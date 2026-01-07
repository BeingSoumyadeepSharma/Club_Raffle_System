"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ClubEntity, purchaseTickets } from "@/lib/api";
import { Ticket } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface PurchaseTicketsDialogProps {
  entities: ClubEntity[];
  selectedEntityId?: string;
  onSuccess?: (receipt: string) => void;
}

export function PurchaseTicketsDialog({
  entities,
  selectedEntityId,
  onSuccess,
}: PurchaseTicketsDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [entityId, setEntityId] = useState(selectedEntityId || "");
  const [buyerName, setBuyerName] = useState("");
  const [rafflerName, setRafflerName] = useState("");
  const [ticketCount, setTicketCount] = useState("1");
  const [pricePerTicket, setPricePerTicket] = useState("100");
  const [isGift, setIsGift] = useState(false);
  const [gifterName, setGifterName] = useState("");

  // Auto-fill raffler name from user and entity from selectedEntityId or user's assigned entities
  useEffect(() => {
    if (user?.rafflerName) {
      setRafflerName(user.rafflerName);
    }
    // If no selectedEntityId, default to user's first assigned entity
    if (!selectedEntityId && user?.assignedEntities?.length) {
      const firstAccessibleEntity = entities.find(e => user.assignedEntities.includes(e.id));
      if (firstAccessibleEntity) {
        setEntityId(firstAccessibleEntity.id);
      }
    }
  }, [user, selectedEntityId, entities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await purchaseTickets({
        entityId,
        buyerName,
        rafflerName,
        ticketCount: parseInt(ticketCount),
        pricePerTicket: parseFloat(pricePerTicket),
        isGift,
        gifterName: isGift ? gifterName : undefined,
      });

      if (result) {
        onSuccess?.(result.receipt);
        setOpen(false);
        // Reset form but keep raffler name and entity
        setBuyerName("");
        setTicketCount("1");
        setIsGift(false);
        setGifterName("");
      }
    } catch (error) {
      console.error("Failed to purchase tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = parseInt(ticketCount || "0") * parseFloat(pricePerTicket || "0");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Ticket className="h-4 w-4" />
          Purchase Tickets
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Purchase Raffle Tickets</DialogTitle>
          <DialogDescription>
            Fill in the details to purchase raffle tickets.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
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
              <Label htmlFor="buyerName">Buyer Name</Label>
              <Input
                id="buyerName"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Enter buyer's name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rafflerName">Raffler Name (Seller)</Label>
              <Input
                id="rafflerName"
                value={rafflerName}
                onChange={(e) => setRafflerName(e.target.value)}
                placeholder="Enter seller's name"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ticketCount">Number of Tickets</Label>
                <Input
                  id="ticketCount"
                  type="number"
                  min="1"
                  value={ticketCount}
                  onChange={(e) => setTicketCount(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pricePerTicket">Price per Ticket ($)</Label>
                <Input
                  id="pricePerTicket"
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricePerTicket}
                  onChange={(e) => setPricePerTicket(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isGift"
                checked={isGift}
                onCheckedChange={(checked) => setIsGift(checked === true)}
              />
              <Label htmlFor="isGift" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                🎁 This is a gift
              </Label>
            </div>
            {isGift && (
              <div className="grid gap-2">
                <Label htmlFor="gifterName">Gifter Name (Who is giving this gift?)</Label>
                <Input
                  id="gifterName"
                  value={gifterName}
                  onChange={(e) => setGifterName(e.target.value)}
                  placeholder="Enter gifter's name"
                  required={isGift}
                />
              </div>
            )}
            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-sm text-muted-foreground">Total Price</p>
              <p className="text-2xl font-bold">${totalPrice.toFixed(2)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !entityId}>
              {loading ? "Processing..." : "Complete Purchase"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
