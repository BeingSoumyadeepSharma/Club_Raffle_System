"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PurchaseCard } from "@/components/purchase-card";
import { PurchaseTicketsDialog } from "@/components/purchase-tickets-dialog";
import { AnnouncementDialog } from "@/components/announcement-dialog";
import { ReceiptModal } from "@/components/receipt-modal";
import { SessionControl } from "@/components/session-control";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClubEntity, TicketPurchase, Session, getEntities, getPurchases, getPurchasesByEntity, getExportAllUrl, getExportEntityUrl, getActiveSession } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { FileSpreadsheet, History } from "lucide-react";

export default function TicketsPage() {
  const [entities, setEntities] = useState<ClubEntity[]>([]);
  const [purchases, setPurchases] = useState<TicketPurchase[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>(""); // Start empty, will be set after loading
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [showCurrentSessionOnly, setShowCurrentSessionOnly] = useState(true);
  const [receipt, setReceipt] = useState<string>("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const loadEntities = async () => {
    const entitiesData = await getEntities();
    setEntities(entitiesData);
    return entitiesData;
  };

  const loadActiveSession = async (entityId: string) => {
    if (entityId === "all") {
      setActiveSession(null);
      return null;
    }
    const session = await getActiveSession(entityId);
    setActiveSession(session);
    return session;
  };

  const loadPurchases = async (entityId: string, sessionOnly: boolean = true) => {
    setLoading(true);
    try {
      if (entityId === "all") {
        const data = await getPurchases();
        setPurchases(data);
      } else {
        const data = await getPurchasesByEntity(entityId, { sessionOnly });
        setPurchases(data);
      }
    } catch (error) {
      console.error("Failed to load purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const entitiesData = await loadEntities();
      
      // Determine the default selected entity based on user role
      let defaultEntity = "all";
      if (user && user.role !== "superuser") {
        // For non-superusers, default to their first assigned entity
        if (user.assignedEntities.length > 0) {
          // Find the first assigned entity that exists
          const firstAssigned = user.assignedEntities.find(id => 
            entitiesData.some(e => e.id === id)
          );
          if (firstAssigned) {
            defaultEntity = firstAssigned;
          }
        }
      }
      
      setSelectedEntity(defaultEntity);
      setInitialized(true);
      
      // Load purchases based on the default entity
      if (defaultEntity !== "all") {
        await loadActiveSession(defaultEntity);
        await loadPurchases(defaultEntity, showCurrentSessionOnly);
      } else {
        const purchasesData = await getPurchases();
        setPurchases(purchasesData);
        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleEntityFilter = async (value: string) => {
    setSelectedEntity(value);
    await loadActiveSession(value);
    await loadPurchases(value, showCurrentSessionOnly && value !== "all");
  };

  const handleSessionToggle = async (sessionOnly: boolean) => {
    setShowCurrentSessionOnly(sessionOnly);
    if (selectedEntity !== "all") {
      await loadPurchases(selectedEntity, sessionOnly);
    }
  };

  const handleSessionChange = async () => {
    if (selectedEntity !== "all") {
      await loadActiveSession(selectedEntity);
      await loadPurchases(selectedEntity, showCurrentSessionOnly);
    }
  };

  const handlePurchaseSuccess = (receiptText: string) => {
    setReceipt(receiptText);
    setShowReceipt(true);
    // Reload both session stats and purchases
    if (selectedEntity !== "all") {
      loadActiveSession(selectedEntity);
      loadPurchases(selectedEntity, showCurrentSessionOnly);
    } else {
      loadData();
    }
  };

  const totalTickets = purchases.reduce((acc, p) => acc + p.ticketCount, 0);
  const totalRevenue = purchases.reduce((acc, p) => acc + p.totalPrice, 0);
  const winningAmount = Math.floor(totalRevenue * 0.7);

  const selectedEntityData = entities.find(e => e.id === selectedEntity);

  // Show loading while checking auth, initializing, or if not logged in (will redirect)
  if (authLoading || !user || !initialized || (loading && entities.length === 0)) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4">🎟️</div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Ticket Purchases</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            View and manage all ticket purchases
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AnnouncementDialog entities={entities} onCounterReset={loadData} />
          <Button variant="outline" className="gap-2 flex-1 sm:flex-none" asChild>
            <a href={getExportAllUrl()} download>
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden xs:inline">Export</span>
            </a>
          </Button>
          <PurchaseTicketsDialog
            entities={entities}
            onSuccess={handlePurchaseSuccess}
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground">Total Purchases</p>
          <p className="text-xl sm:text-2xl font-bold">{purchases.length}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground">Tickets Sold</p>
          <p className="text-xl sm:text-2xl font-bold">{totalTickets}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground">Revenue</p>
          <p className="text-xl sm:text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/50">
          <p className="text-xs sm:text-sm text-muted-foreground">🏆 Prize (70%)</p>
          <p className="text-xl sm:text-2xl font-bold text-amber-500">${winningAmount.toFixed(2)}</p>
        </Card>
      </div>

      {/* Filter and Session Control */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-sm font-medium">Filter by Club:</span>
            <Select value={selectedEntity} onValueChange={handleEntityFilter}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Select a club" />
              </SelectTrigger>
              <SelectContent>
                {/* Only show "All Clubs" option for superusers */}
                {user?.role === "superuser" && (
                  <SelectItem value="all">All Clubs</SelectItem>
                )}
                {entities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {entity.emoji} {entity.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedEntity !== "all" && (
            <div className="flex items-center gap-2">
              <Switch
                id="session-toggle"
                checked={showCurrentSessionOnly}
                onCheckedChange={handleSessionToggle}
              />
              <Label htmlFor="session-toggle" className="flex items-center gap-1 text-xs sm:text-sm cursor-pointer">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">{showCurrentSessionOnly ? "Current session only" : "Show all history"}</span>
                <span className="sm:hidden">{showCurrentSessionOnly ? "Session" : "All"}</span>
              </Label>
            </div>
          )}
        </div>

        {/* Session Control - only show when a specific entity is selected */}
        {selectedEntity !== "all" && selectedEntityData && (
          <SessionControl
            entityId={selectedEntity}
            entityName={selectedEntityData.displayName}
            activeSession={activeSession}
            onSessionChange={handleSessionChange}
          />
        )}
      </div>

      {/* Purchases Grid */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : purchases.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">🎟️</div>
          <h3 className="text-lg sm:text-xl font-semibold mb-2">
            {selectedEntity !== "all" && activeSession && showCurrentSessionOnly
              ? "No Purchases in Current Session"
              : selectedEntity !== "all" && !activeSession
              ? "No Active Session"
              : "No Purchases Yet"}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">
            {selectedEntity !== "all" && !activeSession
              ? "Start a shift to begin selling tickets."
              : selectedEntity !== "all" && activeSession && showCurrentSessionOnly
              ? "Start selling raffle tickets to see purchases here."
              : "Start selling raffle tickets to see purchases here."}
          </p>
          {(selectedEntity === "all" || activeSession) && (
            <PurchaseTicketsDialog
              entities={entities}
              onSuccess={handlePurchaseSuccess}
            />
          )}
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {purchases.map((purchase) => (
            <PurchaseCard
              key={purchase.id}
              purchase={purchase}
              entity={entities.find((e) => e.id === purchase.entityId)}
              onViewReceipt={(r) => {
                setReceipt(r);
                setShowReceipt(true);
              }}
              onDelete={() => {
                if (selectedEntity !== "all") {
                  loadActiveSession(selectedEntity);
                  loadPurchases(selectedEntity, showCurrentSessionOnly);
                } else {
                  loadData();
                }
              }}
              onUpdate={() => {
                if (selectedEntity !== "all") {
                  loadActiveSession(selectedEntity);
                  loadPurchases(selectedEntity, showCurrentSessionOnly);
                } else {
                  loadData();
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        receipt={receipt}
        open={showReceipt}
        onOpenChange={setShowReceipt}
      />
    </div>
  );
}
