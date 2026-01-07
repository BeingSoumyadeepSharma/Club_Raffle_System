"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TicketPurchase, ClubEntity, getReceipt, updatePaymentStatus, deletePurchase, updateBuyerName } from "@/lib/api";
import { Eye, Check, X, Trash2, Pencil } from "lucide-react";

interface PurchaseTableProps {
  purchases: TicketPurchase[];
  entities: ClubEntity[];
  onViewReceipt?: (receipt: string) => void;
  onDataChange?: () => void;
}

interface TableRowActionsProps {
  purchase: TicketPurchase;
  entity?: ClubEntity;
  onViewReceipt?: (receipt: string) => void;
  onDataChange?: () => void;
}

function PurchaseTableRow({ purchase, entity, onViewReceipt, onDataChange }: TableRowActionsProps) {
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
        onDataChange?.();
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
        onDataChange?.();
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
        onDataChange?.();
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
    <TableRow className={isPaid ? "bg-green-500/5" : "bg-red-500/5"}>
      {/* Buyer Name */}
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {editingName ? (
            <div className="flex items-center gap-1">
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="h-7 w-28 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") handleCancelEdit();
                }}
              />
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSaveName} disabled={updating}>
                <Check className="h-3 w-3 text-green-500" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleCancelEdit}>
                <X className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          ) : (
            <>
              <span className="truncate max-w-[150px]">{buyerName}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => setEditingName(true)}
              >
                <Pencil className="h-3 w-3 text-muted-foreground" />
              </Button>
              {purchase.isGift && <span title={`Gift from ${purchase.gifterName}`}>🎁</span>}
            </>
          )}
        </div>
      </TableCell>

      {/* Club */}
      <TableCell className="hidden md:table-cell">
        {entity ? `${entity.emoji} ${entity.displayName}` : "-"}
      </TableCell>

      {/* Tickets */}
      <TableCell>
        <span className="whitespace-nowrap">
          #{purchase.startTicketNumber}-#{purchase.endTicketNumber}
        </span>
        <span className="text-muted-foreground ml-1">({purchase.ticketCount})</span>
      </TableCell>

      {/* Total */}
      <TableCell className="font-semibold">${purchase.totalPrice}</TableCell>

      {/* Raffler */}
      <TableCell className="hidden lg:table-cell text-muted-foreground">
        {purchase.rafflerName}
      </TableCell>

      {/* Date */}
      <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
        {new Date(purchase.createdAt).toLocaleString()}
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge 
          variant={isPaid ? "default" : "destructive"} 
          className={`text-xs cursor-pointer ${isPaid ? "bg-green-500 hover:bg-green-600" : "hover:bg-red-600"}`}
          onClick={handleTogglePayment}
        >
          {updating ? "..." : isPaid ? "PAID" : "UNPAID"}
        </Badge>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleViewReceipt}
            title="View Receipt"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete Purchase"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function PurchaseTable({ purchases, entities, onViewReceipt, onDataChange }: PurchaseTableProps) {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[150px]">Buyer</TableHead>
            <TableHead className="hidden md:table-cell">Club</TableHead>
            <TableHead>Tickets</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="hidden lg:table-cell">Raffler</TableHead>
            <TableHead className="hidden sm:table-cell">Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases.map((purchase) => (
            <PurchaseTableRow
              key={purchase.id}
              purchase={purchase}
              entity={entities.find((e) => e.id === purchase.entityId)}
              onViewReceipt={onViewReceipt}
              onDataChange={onDataChange}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
