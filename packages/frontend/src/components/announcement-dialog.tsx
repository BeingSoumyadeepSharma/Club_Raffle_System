"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClubEntity, generateAnnouncement, resetTicketCounter } from "@/lib/api";
import { Megaphone, RotateCcw, Copy, Check } from "lucide-react";

interface AnnouncementDialogProps {
  entities: ClubEntity[];
  onCounterReset?: () => void;
}

export function AnnouncementDialog({ entities, onCounterReset }: AnnouncementDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entityId, setEntityId] = useState("");
  const [rafflerName, setRafflerName] = useState("");
  const [pricePerTicket, setPricePerTicket] = useState("100");
  const [announcement, setAnnouncement] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!entityId || !rafflerName || !pricePerTicket) return;
    
    setLoading(true);
    try {
      const result = await generateAnnouncement({
        entityId,
        rafflerName,
        pricePerTicket: parseFloat(pricePerTicket),
      });
      if (result) {
        setAnnouncement(result);
      }
    } catch (error) {
      console.error("Failed to generate announcement:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(announcement);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetCounter = async () => {
    if (!entityId) return;
    
    if (confirm("Are you sure you want to reset the ticket counter? This will start ticket numbers from 1 again.")) {
      setLoading(true);
      try {
        const success = await resetTicketCounter(entityId);
        if (success) {
          alert("Ticket counter has been reset to 0!");
          onCounterReset?.();
        }
      } catch (error) {
        console.error("Failed to reset counter:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const selectedEntity = entities.find(e => e.id === entityId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Megaphone className="h-4 w-4" />
          Announcement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Raffle Announcement</DialogTitle>
          <DialogDescription>
            Create an announcement with current stats and prize amount (70% of revenue)
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="entity">Club Entity</Label>
            <Select value={entityId} onValueChange={setEntityId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a club" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {entity.emoji} {entity.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rafflerName">Your Name (Raffler)</Label>
            <Input
              id="rafflerName"
              value={rafflerName}
              onChange={(e) => setRafflerName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pricePerTicket">Price per Ticket ($)</Label>
            <Input
              id="pricePerTicket"
              type="number"
              min="0"
              step="1"
              value={pricePerTicket}
              onChange={(e) => setPricePerTicket(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleGenerate} 
              disabled={loading || !entityId || !rafflerName}
              className="flex-1"
            >
              Generate Announcement
            </Button>
            <Button 
              variant="destructive"
              onClick={handleResetCounter} 
              disabled={loading || !entityId}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Counter
            </Button>
          </div>
          {announcement && (
            <div className="grid gap-2">
              <Label>Generated Announcement</Label>
              <div className="relative">
                <Textarea
                  value={announcement}
                  readOnly
                  className="min-h-[120px] pr-12"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Click the copy button to copy the announcement to your clipboard.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
