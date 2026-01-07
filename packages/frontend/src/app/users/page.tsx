"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, getAuthHeaders, ROLE_LABELS, UserRole } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { UserPlus, Trash2, Shield, Key, Plus, X, Crown, Briefcase, Users, Pencil } from "lucide-react";
import { getEntities, ClubEntity } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

interface UserWithEntities {
  id: string;
  username: string;
  role: UserRole;
  rafflerName?: string;
  assignedEntities: string[];
  createdAt: string;
}

// Role badge styling
const ROLE_BADGE_VARIANTS: Record<UserRole, { variant: "default" | "secondary" | "outline"; icon: React.ReactNode }> = {
  superuser: { variant: "default", icon: <Crown className="h-3 w-3" /> },
  club_owner: { variant: "default", icon: <Shield className="h-3 w-3" /> },
  event_manager: { variant: "secondary", icon: <Briefcase className="h-3 w-3" /> },
  staff: { variant: "outline", icon: <Users className="h-3 w-3" /> },
};

// Role hierarchy for permission checks
const ROLE_HIERARCHY: Record<UserRole, number> = {
  superuser: 4,
  club_owner: 3,
  event_manager: 2,
  staff: 1,
};

export default function UsersPage() {
  const { user, isLoading, canManageUsers } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserWithEntities[]>([]);
  const [entities, setEntities] = useState<ClubEntity[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [creatableRoles, setCreatableRoles] = useState<UserRole[]>([]);

  // Create user dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("staff");
  const [newRafflerName, setNewRafflerName] = useState("");
  const [creating, setCreating] = useState(false);

  // Assign entity dialog state
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState("");

  // Password dialog state
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [newUserPassword, setNewUserPassword] = useState("");

  // Raffler name dialog state
  const [rafflerNameOpen, setRafflerNameOpen] = useState(false);
  const [rafflerNameUserId, setRafflerNameUserId] = useState<string | null>(null);
  const [editRafflerName, setEditRafflerName] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    } else if (!isLoading && user && !canManageUsers()) {
      router.push("/");
    }
  }, [user, isLoading, router, canManageUsers]);

  useEffect(() => {
    if (user && canManageUsers()) {
      loadUsers();
      loadEntities();
      loadCreatableRoles();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/users`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadEntities = async () => {
    const data = await getEntities();
    setEntities(data);
  };

  const loadCreatableRoles = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/roles/creatable`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setCreatableRoles(json.data);
        // Set default to the lowest role the user can create
        if (json.data.length > 0) {
          setNewRole(json.data[json.data.length - 1]);
        }
      }
    } catch (error) {
      console.error("Failed to load creatable roles:", error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch(`${API_BASE}/auth/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole,
          rafflerName: newRafflerName || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setCreateOpen(false);
        setNewUsername("");
        setNewPassword("");
        setNewRafflerName("");
        setNewRole(creatableRoles[creatableRoles.length - 1] || "staff");
        loadUsers();
      } else {
        alert(json.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Failed to create user:", error);
      alert("Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`${API_BASE}/auth/users/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        loadUsers();
      } else {
        const json = await res.json();
        alert(json.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  // Check if current user can manage the target user
  const canManageUser = (targetUser: UserWithEntities) => {
    if (!user) return false;
    if (targetUser.id === user.id) return false; // Can't manage yourself
    return ROLE_HIERARCHY[user.role] > ROLE_HIERARCHY[targetUser.role];
  };

  const handleAssignEntity = async () => {
    if (!selectedUserId || !selectedEntityId) return;

    try {
      const res = await fetch(`${API_BASE}/auth/users/${selectedUserId}/entities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ entityId: selectedEntityId }),
      });

      if (res.ok) {
        setAssignOpen(false);
        setSelectedUserId(null);
        setSelectedEntityId("");
        loadUsers();
      } else {
        const json = await res.json();
        alert(json.error || "Failed to assign entity");
      }
    } catch (error) {
      console.error("Failed to assign entity:", error);
    }
  };

  const handleUnassignEntity = async (userId: string, entityId: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/users/${userId}/entities/${entityId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        loadUsers();
      }
    } catch (error) {
      console.error("Failed to unassign entity:", error);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordUserId || !newUserPassword) return;

    try {
      const res = await fetch(`${API_BASE}/auth/users/${passwordUserId}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ password: newUserPassword }),
      });

      if (res.ok) {
        setPasswordOpen(false);
        setPasswordUserId(null);
        setNewUserPassword("");
        alert("Password updated successfully");
      } else {
        const json = await res.json();
        alert(json.error || "Failed to update password");
      }
    } catch (error) {
      console.error("Failed to update password:", error);
    }
  };

  const handleUpdateRafflerName = async () => {
    if (!rafflerNameUserId) return;

    try {
      const res = await fetch(`${API_BASE}/auth/users/${rafflerNameUserId}/raffler-name`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ rafflerName: editRafflerName }),
      });

      if (res.ok) {
        setRafflerNameOpen(false);
        setRafflerNameUserId(null);
        setEditRafflerName("");
        loadUsers();
      } else {
        const json = await res.json();
        alert(json.error || "Failed to update raffler name");
      }
    } catch (error) {
      console.error("Failed to update raffler name:", error);
    }
  };

  const getEntityName = (entityId: string) => {
    const entity = entities.find((e) => e.id === entityId);
    return entity ? `${entity.emoji} ${entity.displayName}` : entityId;
  };

  if (isLoading || !canManageUsers()) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Create users and assign them to club entities
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <UserPlus className="h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Create a new user account and assign a role.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Username</Label>
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter password (min 4 characters)"
                    minLength={4}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Raffler Name (Optional)</Label>
                  <Input
                    value={newRafflerName}
                    onChange={(e) => setNewRafflerName(e.target.value)}
                    placeholder="Name used for raffle entries"
                  />
                  <p className="text-xs text-muted-foreground">
                    This name will auto-fill when purchasing tickets or making announcements
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {creatableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {newRole === 'superuser' && "Full access to all clubs and user management"}
                    {newRole === 'club_owner' && "Can edit club info and manage Event Managers & Staff"}
                    {newRole === 'event_manager' && "Can edit club info and manage Staff"}
                    {newRole === 'staff' && "Basic access to assigned clubs"}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating || creatableRoles.length === 0}>
                  {creating ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loadingUsers ? (
        <p className="text-muted-foreground">Loading users...</p>
      ) : users.length === 0 ? (
        <Card className="p-6 sm:p-8 text-center">
          <p className="text-muted-foreground">No users found.</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {users.map((u) => (
            <Card key={u.id}>
              <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg flex flex-wrap items-center gap-2">
                    {u.username}
                    <Badge variant={ROLE_BADGE_VARIANTS[u.role].variant} className="gap-1 text-xs">
                      {ROLE_BADGE_VARIANTS[u.role].icon}
                      {ROLE_LABELS[u.role]}
                    </Badge>
                  </CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    {/* Show raffler name edit button for own account */}
                    {u.id === user?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs sm:text-sm"
                        onClick={() => {
                          setRafflerNameUserId(u.id);
                          setEditRafflerName(u.rafflerName || "");
                          setRafflerNameOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="hidden sm:inline">Raffler Name</span>
                      </Button>
                    )}
                    {/* Show password button for own account or manageable users */}
                    {(u.id === user?.id || canManageUser(u)) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs sm:text-sm"
                        onClick={() => {
                          setPasswordUserId(u.id);
                          setPasswordOpen(true);
                        }}
                      >
                        <Key className="h-4 w-4" />
                        <span className="hidden sm:inline">Password</span>
                      </Button>
                    )}
                    {/* Only show delete for manageable users (not self) */}
                    {canManageUser(u) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-red-500 hover:bg-red-500/10"
                        onClick={() => handleDeleteUser(u.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {u.id === user?.id && (
                      <Badge variant="outline" className="text-xs">You</Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="text-xs sm:text-sm">
                  Created: {new Date(u.createdAt).toLocaleDateString()}
                  {u.rafflerName && <span className="ml-2">• Raffler: {u.rafflerName}</span>}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                {u.role !== 'superuser' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Assigned Entities:</Label>
                      {canManageUser(u) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            setSelectedUserId(u.id);
                            setAssignOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          Assign Entity
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {u.assignedEntities.length === 0 ? (
                        <span className="text-sm text-muted-foreground">
                          No entities assigned
                        </span>
                      ) : (
                        u.assignedEntities.map((entityId) => (
                          <Badge
                            key={entityId}
                            variant="secondary"
                            className="gap-1 pr-1"
                          >
                            {getEntityName(entityId)}
                            {canManageUser(u) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-destructive/20"
                                onClick={() => handleUnassignEntity(u.id, entityId)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                )}
                {u.role === 'superuser' && (
                  <p className="text-sm text-muted-foreground">
                    Superusers have access to all entities
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Entity Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Entity</DialogTitle>
            <DialogDescription>
              Select an entity to assign to this user.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an entity" />
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
          <DialogFooter>
            <Button onClick={handleAssignEntity} disabled={!selectedEntityId}>
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Password</DialogTitle>
            <DialogDescription>
              Enter a new password for this user.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>New Password</Label>
            <Input
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              placeholder="Enter new password (min 4 characters)"
              minLength={4}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleUpdatePassword} disabled={newUserPassword.length < 4}>
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Raffler Name Dialog */}
      <Dialog open={rafflerNameOpen} onOpenChange={setRafflerNameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Raffler Name</DialogTitle>
            <DialogDescription>
              This name will auto-fill when purchasing tickets or making announcements.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Raffler Name</Label>
            <Input
              value={editRafflerName}
              onChange={(e) => setEditRafflerName(e.target.value)}
              placeholder="Enter your name for raffle entries"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateRafflerName}>
              Update Raffler Name
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
