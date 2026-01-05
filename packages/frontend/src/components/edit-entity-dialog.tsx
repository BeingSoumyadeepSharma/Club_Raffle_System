"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateEntity, ClubEntity } from "@/lib/api";
import { Pencil } from "lucide-react";

interface EditEntityDialogProps {
  entity: ClubEntity;
  onSuccess?: (entity: ClubEntity) => void;
}

const EMOJI_OPTIONS = ["🎲", "🎰", "🎭", "🎯", "💎", "👑", "🌟", "🌒", "🖤🖤🖤"];

export function EditEntityDialog({ entity, onSuccess }: EditEntityDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(entity.displayName);
  const [emoji, setEmoji] = useState(entity.emoji);
  const [tagline, setTagline] = useState(entity.tagline);
  const [rafflePercentage, setRafflePercentage] = useState(entity.rafflePercentage ?? 70);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      // Reset form to current entity values when opening
      setDisplayName(entity.displayName);
      setEmoji(entity.emoji);
      setTagline(entity.tagline);
      setRafflePercentage(entity.rafflePercentage ?? 70);
    }
    setOpen(isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedEntity = await updateEntity(entity.id, {
        displayName,
        emoji,
        tagline,
        rafflePercentage,
      });

      if (updatedEntity) {
        onSuccess?.(updatedEntity);
        setOpen(false);
      }
    } catch (error) {
      console.error("Failed to update entity:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Edit Club">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Club Entity</DialogTitle>
          <DialogDescription>
            Update the club settings and raffle percentage.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName">Club Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., GODFATHER'S CLUB"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Select Emoji</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`text-2xl p-2 rounded-lg border-2 transition-colors ${
                      emoji === e
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Enter a catchy tagline"
              />
            </div>
            <div className="grid gap-2">
              <Label>Prize Percentage: {rafflePercentage}%</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[rafflePercentage]}
                  onValueChange={(value) => setRafflePercentage(value[0])}
                  min={10}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {rafflePercentage}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Percentage of revenue allocated for the prize pool
              </p>
            </div>
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Preview</p>
              <p className="text-lg font-bold">
                {emoji} {displayName || "CLUB NAME"} {emoji}
              </p>
              <p className="text-sm text-muted-foreground">{tagline}</p>
              <p className="text-xs text-amber-500 mt-2">🏆 Prize: {rafflePercentage}% of revenue</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !displayName}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
