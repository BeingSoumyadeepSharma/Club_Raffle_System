"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth, ROLE_LABELS, getAuthHeaders } from "@/lib/auth-context";
import { User, Key, Pencil } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

interface ProfileDialogProps {
  trigger?: React.ReactNode;
}

export function ProfileDialog({ trigger }: ProfileDialogProps) {
  const { user, updateRafflerName, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  
  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  // Raffler name state
  const [rafflerName, setRafflerName] = useState("");
  const [rafflerLoading, setRafflerLoading] = useState(false);
  const [rafflerSuccess, setRafflerSuccess] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && user) {
      setRafflerName(user.rafflerName || "");
    }
    // Reset states when closing
    if (!isOpen) {
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
      setPasswordSuccess(false);
      setRafflerSuccess(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!user) return;
    
    setPasswordError("");
    setPasswordSuccess(false);
    
    if (newPassword.length < 4) {
      setPasswordError("Password must be at least 4 characters");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/users/${user.id}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (res.ok) {
        setPasswordSuccess(true);
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        const json = await res.json();
        setPasswordError(json.error || "Failed to update password");
      }
    } catch (error) {
      setPasswordError("Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRafflerNameUpdate = async () => {
    if (!user) return;
    
    setRafflerLoading(true);
    try {
      const success = await updateRafflerName(rafflerName);
      if (success) {
        setRafflerSuccess(true);
        setTimeout(() => setRafflerSuccess(false), 3000);
      }
    } finally {
      setRafflerLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" title="Profile Settings">
            <User className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </DialogTitle>
          <DialogDescription>
            Update your account settings
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* User Info */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Account</Label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-muted-foreground">{ROLE_LABELS[user.role]}</p>
              </div>
            </div>
          </div>

          {/* Raffler Name */}
          <div className="space-y-2">
            <Label htmlFor="rafflerName" className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Raffler Name
            </Label>
            <p className="text-xs text-muted-foreground">
              This name auto-fills when purchasing tickets or making announcements
            </p>
            <div className="flex gap-2">
              <Input
                id="rafflerName"
                value={rafflerName}
                onChange={(e) => setRafflerName(e.target.value)}
                placeholder="Enter your raffler name"
              />
              <Button 
                onClick={handleRafflerNameUpdate} 
                disabled={rafflerLoading}
                variant={rafflerSuccess ? "outline" : "default"}
              >
                {rafflerLoading ? "..." : rafflerSuccess ? "✓ Saved" : "Save"}
              </Button>
            </div>
          </div>

          {/* Password Change */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Change Password
            </Label>
            <div className="space-y-2">
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 4 characters)"
              />
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
              {passwordError && (
                <p className="text-sm text-red-500">{passwordError}</p>
              )}
              {passwordSuccess && (
                <p className="text-sm text-green-500">Password updated successfully!</p>
              )}
              <Button 
                onClick={handlePasswordUpdate} 
                disabled={passwordLoading || !newPassword || !confirmPassword}
                className="w-full"
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </div>
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
