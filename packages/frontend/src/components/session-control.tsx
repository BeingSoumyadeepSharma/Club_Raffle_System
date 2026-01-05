"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Play, Square, Clock, DollarSign, Ticket, User } from "lucide-react";
import { Session, startSession, closeSession } from "@/lib/api";

interface SessionControlProps {
  entityId: string;
  entityName: string;
  activeSession: Session | null;
  onSessionChange: () => void;
}

export function SessionControl({ 
  entityId, 
  entityName, 
  activeSession, 
  onSessionChange 
}: SessionControlProps) {
  const [loading, setLoading] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartSession = async () => {
    setLoading(true);
    setError(null);
    try {
      await startSession(entityId);
      onSessionChange();
    } catch (err: any) {
      setError(err.message || "Failed to start session");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    
    setLoading(true);
    setError(null);
    try {
      await closeSession(activeSession.id);
      setShowCloseDialog(false);
      onSessionChange();
    } catch (err: any) {
      setError(err.message || "Failed to close session");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (!activeSession) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">No active shift</p>
              <p className="text-xs text-muted-foreground">
                Start a shift to begin selling tickets. The ticket counter will reset.
              </p>
            </div>
            <Button onClick={handleStartSession} disabled={loading} className="gap-2 w-full sm:w-auto">
              <Play className="h-4 w-4" />
              {loading ? "Starting..." : "Start Shift"}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-green-500/50 bg-green-500/5">
        <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" className="bg-green-500">
                <Clock className="h-3 w-3 mr-1" />
                Active Shift
              </Badge>
              <span className="text-xs sm:text-sm text-muted-foreground">
                Started {formatDuration(activeSession.startedAt)} ago
              </span>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setShowCloseDialog(true)}
              className="gap-2 w-full sm:w-auto"
            >
              <Square className="h-4 w-4" />
              End Shift
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Raffler</p>
                <p className="text-sm font-medium">{activeSession.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Tickets Sold</p>
                <p className="text-sm font-medium">{activeSession.ticketsSold}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-sm font-medium">${activeSession.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Started</p>
                <p className="text-sm font-medium">
                  {new Date(activeSession.startedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </CardContent>
      </Card>

      {/* Close Session Confirmation Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Shift?</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this shift for {entityName}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">{formatDuration(activeSession.startedAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tickets Sold</p>
                <p className="font-medium">{activeSession.ticketsSold}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Revenue</p>
                <p className="font-medium">${activeSession.totalRevenue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ticket Range</p>
                <p className="font-medium">
                  {activeSession.startTicketNumber} - {activeSession.endTicketNumber || activeSession.startTicketNumber - 1}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              After ending the shift, you can start a new one. The ticket counter will reset for the next shift.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCloseSession} disabled={loading}>
              {loading ? "Ending..." : "End Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
