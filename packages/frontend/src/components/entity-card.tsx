"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClubEntity } from "@/lib/api";

interface EntityCardProps {
  entity: ClubEntity;
  onClick?: () => void;
  selected?: boolean;
}

export function EntityCard({ entity, onClick, selected }: EntityCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        selected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
        <div className="flex items-center justify-between">
          <span className="text-3xl sm:text-4xl">{entity.emoji}</span>
          <div className="flex flex-wrap gap-1 sm:gap-2 justify-end">
            <Badge variant="outline" className="text-amber-500 border-amber-500 text-xs">
              🏆 {entity.rafflePercentage ?? 70}%
            </Badge>
            <Badge variant={selected ? "default" : "secondary"} className="text-xs">
              {entity.name}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-lg sm:text-xl">{entity.displayName}</CardTitle>
        <CardDescription className="text-xs sm:text-sm line-clamp-2">{entity.tagline}</CardDescription>
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        <div className="text-xs text-muted-foreground">
          Created: {new Date(entity.createdAt).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}
