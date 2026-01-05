"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EntityCard } from "@/components/entity-card";
import { CreateEntityDialog } from "@/components/create-entity-dialog";
import { EditEntityDialog } from "@/components/edit-entity-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClubEntity, getEntities, deleteEntity, getExportEntityUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Trash2, FileSpreadsheet } from "lucide-react";

export default function EntitiesPage() {
  const [entities, setEntities] = useState<ClubEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isLoading: authLoading, canCreateClubs } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const showCreateClub = !authLoading && canCreateClubs();
  const isSuperuser = user?.role === 'superuser';

  const loadEntities = async () => {
    try {
      const data = await getEntities();
      setEntities(data);
    } catch (error) {
      console.error("Failed to load entities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadEntities();
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this club?")) {
      await deleteEntity(id);
      loadEntities();
    }
  };

  // Show loading while checking auth or if not logged in (will redirect)
  if (authLoading || !user || loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4">🏢</div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Club Entities</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your raffle club entities
          </p>
        </div>
        {showCreateClub && <CreateEntityDialog onSuccess={loadEntities} />}
      </div>

      {entities.length === 0 ? (
        <Card className="p-6 sm:p-12 text-center">
          <div className="text-4xl sm:text-6xl mb-4">🏢</div>
          <h3 className="text-lg sm:text-xl font-semibold mb-2">No Clubs Yet</h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">
            {showCreateClub 
              ? "Create your first club entity to start selling raffle tickets."
              : "No clubs available. Contact a superuser to create one."}
          </p>
          {showCreateClub && <CreateEntityDialog onSuccess={loadEntities} />}
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {entities.map((entity) => (
            <div key={entity.id} className="relative group">
              <EntityCard entity={entity} />
              <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                >
                  <a href={getExportEntityUrl(entity.id)} download title="Export to Excel">
                    <FileSpreadsheet className="h-4 w-4" />
                  </a>
                </Button>
                <EditEntityDialog entity={entity} onSuccess={loadEntities} />
                {isSuperuser && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(entity.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
