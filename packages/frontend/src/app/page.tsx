"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PurchaseTicketsDialog } from "@/components/purchase-tickets-dialog";
import { ReceiptModal } from "@/components/receipt-modal";
import { EntityCard } from "@/components/entity-card";
import { PurchaseCard } from "@/components/purchase-card";
import { ClubEntity, TicketPurchase, getEntities, getPurchases, getExportAllUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Building2, Ticket, DollarSign, Users, FileSpreadsheet, Trophy } from "lucide-react";

export default function HomePage() {
  const [entities, setEntities] = useState<ClubEntity[]>([]);
  const [purchases, setPurchases] = useState<TicketPurchase[]>([]);
  const [receipt, setReceipt] = useState<string>("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (!authLoading && user && user.role !== "superuser") {
      // Redirect non-superusers to tickets page
      router.push("/tickets");
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    try {
      const [entitiesData, purchasesData] = await Promise.all([
        getEntities(),
        getPurchases(),
      ]);
      setEntities(entitiesData);
      setPurchases(purchasesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handlePurchaseSuccess = (receiptText: string) => {
    setReceipt(receiptText);
    setShowReceipt(true);
    loadData();
  };

  const totalTicketsSold = purchases.reduce((acc, p) => acc + p.ticketCount, 0);
  const totalRevenue = purchases.reduce((acc, p) => acc + p.totalPrice, 0);
  const winningAmount = Math.floor(totalRevenue * 0.7);

  // Show loading while checking auth or if not logged in (will redirect)
  // Also redirect non-superusers
  if (authLoading || !user || loading || user.role !== "superuser") {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4">🎲</div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your party raffle system
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Clubs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{entities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Tickets Sold</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{totalTicketsSold}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">🏆 Prize</CardTitle>
            <Trophy className="h-4 w-4 text-amber-500 hidden sm:block" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-amber-500">${winningAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">70% of revenue</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Purchases</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">{purchases.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Clubs */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Club Entities</h2>
        {entities.length === 0 ? (
          <Card className="p-6 sm:p-8 text-center">
            <p className="text-muted-foreground text-sm sm:text-base">No clubs created yet.</p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {entities.map((entity) => (
              <EntityCard key={entity.id} entity={entity} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Purchases */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Recent Purchases</h2>
        {purchases.length === 0 ? (
          <Card className="p-6 sm:p-8 text-center">
            <p className="text-muted-foreground text-sm sm:text-base">No purchases yet.</p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {purchases.slice(0, 6).map((purchase) => (
              <PurchaseCard
                key={purchase.id}
                purchase={purchase}
                entity={entities.find((e) => e.id === purchase.entityId)}
                onViewReceipt={(r) => {
                  setReceipt(r);
                  setShowReceipt(true);
                }}
                onDelete={loadData}
                onUpdate={loadData}
              />
            ))}
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        receipt={receipt}
        open={showReceipt}
        onOpenChange={setShowReceipt}
      />
    </div>
  );
}
