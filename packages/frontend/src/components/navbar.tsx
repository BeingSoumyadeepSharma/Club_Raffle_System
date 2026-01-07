"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth, ROLE_LABELS } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Home, Building2, Ticket, Users, LogIn, LogOut, Crown, Shield, Briefcase, Menu, Sun, Moon } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/entities", label: "Clubs", icon: Building2 },
  { href: "/tickets", label: "Tickets", icon: Ticket },
];

// Role icons
const ROLE_ICONS = {
  superuser: Crown,
  club_owner: Shield,
  event_manager: Briefcase,
  staff: Users,
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading, canManageUsers } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const RoleIcon = user ? ROLE_ICONS[user.role] : null;

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        // Hide Dashboard from non-superusers
        if (item.href === "/" && user?.role !== "superuser") {
          return null;
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => mobile && setMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
              isActive ? "text-primary" : "text-muted-foreground",
              mobile && "py-2"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
      {canManageUsers() && (
        <Link
          href="/users"
          onClick={() => mobile && setMobileMenuOpen(false)}
          className={cn(
            "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
            pathname === "/users" ? "text-primary" : "text-muted-foreground",
            mobile && "py-2"
          )}
        >
          <Users className="h-4 w-4" />
          Users
        </Link>
      )}
    </>
  );

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo and Desktop Navigation */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl mr-8">
            🎲 <span className="hidden sm:inline">Raffle System</span>
          </Link>
          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            <NavLinks />
          </div>
        </div>

        {/* Desktop User Info & Auth */}
        <div className="hidden md:flex items-center gap-4">
          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          {isLoading ? (
            <span className="text-sm text-muted-foreground">Loading...</span>
          ) : user ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                {RoleIcon && <RoleIcon className="h-4 w-4 text-primary" />}
                <span>{user.username}</span>
                <span className="text-xs text-muted-foreground hidden lg:inline">({ROLE_LABELS[user.role]})</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" asChild className="gap-2">
              <Link href="/login">
                <LogIn className="h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          {/* Mobile Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          {user && (
            <div className="flex items-center gap-1 text-sm">
              {RoleIcon && <RoleIcon className="h-4 w-4 text-primary" />}
              <span className="text-xs">{user.username}</span>
            </div>
          )}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} modal={true}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]" onInteractOutside={() => setMobileMenuOpen(false)}>
              <div className="flex flex-col gap-4 mt-8">
                <NavLinks mobile />
                <div className="border-t pt-4 mt-4">
                  {isLoading ? (
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  ) : user ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm">
                        {RoleIcon && <RoleIcon className="h-4 w-4 text-primary" />}
                        <span>{user.username}</span>
                        <span className="text-xs text-muted-foreground">({ROLE_LABELS[user.role]})</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full gap-2">
                        <LogOut className="h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" asChild className="w-full gap-2">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        <LogIn className="h-4 w-4" />
                        Login
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
