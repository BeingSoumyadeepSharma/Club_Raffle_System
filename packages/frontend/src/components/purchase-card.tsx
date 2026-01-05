"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TicketPurchase, ClubEntity, getReceipt, updatePaymentStatus, deletePurchase, updateBuyerName } from "@/lib/api";
import { Receipt, Eye, Check, X, Trash2, Pencil } from "lucide-react";

interface PurchaseCardProps {
  purchase: TicketPurchase;
  entity?: ClubEntity;
  onViewReceipt?: (receipt: string) => void;
  onPaymentUpdate?: () => void;
  onDelete?: () => void;
  onUpdate?: () => void;
}

export function PurchaseCard({ purchase, entity, onViewReceipt, onPaymentUpdate, onDelete, onUpdate }: PurchaseCardProps) {
  const [isPaid, setIsPaid] = useState(purchase.isPaid);
  const [buyerName, setBuyerName] = useState(purchase.buyerName);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(purchase.buyerName);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleViewReceipt = async () => {
    const receipt = await getReceipt(purchase.id);
    if (receipt) {
      onViewReceipt?.(receipt);
    }
  };

  const handleTogglePayment = async () => {
    setUpdating(true);
    try {
      const result = await updatePaymentStatus(purchase.id, !isPaid);
      if (result) {
        setIsPaid(result.isPaid);
        onPaymentUpdate?.();
      }
    } catch (error) {
      console.error("Failed to update payment status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete purchase for ${buyerName}? This will remove tickets #${purchase.startTicketNumber}-#${purchase.endTicketNumber}.`)) {
      return;
    }
    setDeleting(true);
    try {
      const success = await deletePurchase(purchase.id);
      if (success) {
        onDelete?.();
      }
    } catch (error) {
      console.error("Failed to delete purchase:", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveName = async () => {
    if (!tempName.trim()) return;
    setUpdating(true);
    try {
      const result = await updateBuyerName(purchase.id, tempName.trim());
      if (result) {
        setBuyerName(result.buyerName);
        setEditingName(false);
        onUpdate?.();
      }
    } catch (error) {
      console.error("Failed to update buyer name:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setTempName(buyerName);
    setEditingName(false);
  };

  return (
    <Card className={isPaid ? "border-green-500/50" : "border-red-500/50"}>
      <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Receipt className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            {editingName ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="h-7 w-24 sm:w-32 text-sm sm:text-base"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                />
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSaveName} disabled={updating}>
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ) : (
              <>
                <span className="truncate max-w-[120px] sm:max-w-none">{buyerName}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 ml-1 flex-shrink-0"
                  onClick={() => setEditingName(true)}
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </Button>
              </>
            )}
            {purchase.isGift && <span title="Gift" className="flex-shrink-0">🎁</span>}
          </CardTitle>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <Badge variant={isPaid ? "default" : "destructive"} className={`text-xs ${isPaid ? "bg-green-500" : ""}`}>
              {isPaid ? "PAID" : "UNPAID"}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {purchase.ticketCount} ticket{purchase.ticketCount > 1 ? "s" : ""}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        <div className="space-y-2 text-sm">
          {entity && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Club:</span>
              <span>{entity.emoji} {entity.displayName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tickets:</span>
            <span>#{purchase.startTicketNumber} - #{purchase.endTicketNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price/ticket:</span>
            <span>${purchase.pricePerTicket}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total:</span>
            <span>${purchase.totalPrice}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Raffler:</span>
            <span>{purchase.rafflerName}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Date:</span>
            <span>{new Date(purchase.createdAt).toLocaleString()}</span>
          </div>
          {purchase.isGift && purchase.gifterName && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>🎁 Gift from:</span>
              <span>{purchase.gifterName}</span>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
          <Button
            variant={isPaid ? "outline" : "default"}
            size="sm"
            className={`flex-1 min-w-[80px] gap-1 sm:gap-2 text-xs sm:text-sm ${isPaid ? "border-green-500 text-green-500 hover:bg-green-500/10" : "bg-red-500 hover:bg-red-600"}`}
            onClick={handleTogglePayment}
            disabled={updating}
          >
            {isPaid ? (
              <>
                <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Paid</span>
              </>
            ) : (
              <>
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="sm:hidden">Pay</span>
                <span className="hidden sm:inline">Mark as Paid</span>
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 sm:gap-2 text-xs sm:text-sm"
            onClick={handleViewReceipt}
          >
            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Receipt</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 sm:gap-2 text-red-500 hover:bg-red-500/10 hover:text-red-500"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
