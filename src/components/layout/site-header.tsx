import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Ticket, LogOut, User as UserIcon, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/movies", label: "Movies" },
  { to: "/concerts", label: "Concerts" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const { isAuthenticated, user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const dashboardPath = roles.includes("admin")
    ? "/admin"
    : roles.includes("organizer")
      ? "/organizer"
      : "/dashboard";

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glass-strong border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-bg shadow-glow">
              <Ticket className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">
              Ticket<span className="gradient-text">Booking</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="px-3 py-2 text-sm font-medium text-muted-foreground rounded-lg hover:text-foreground hover:bg-accent/50 transition-colors"
                activeProps={{ className: "text-foreground bg-accent/60" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="glass" size="sm" className="gap-2">
                    <UserIcon className="h-4 w-4" />
                    {user?.email?.split("@")[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: dashboardPath })}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/dashboard/tickets" })}>
                    <Ticket className="mr-2 h-4 w-4" /> My Tickets
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await signOut();
                      navigate({ to: "/" });
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/auth">Login</Link>
                </Button>
                <Button asChild variant="hero" size="sm">
                  <Link to="/auth" search={{ mode: "register" }}>
                    Register
                  </Link>
                </Button>
              </>
            )}
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85%] sm:w-96">
              <div className="mt-8 flex flex-col gap-2">
                {NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-4 py-3 text-base font-medium hover:bg-accent"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="mt-4 border-t pt-4 flex flex-col gap-2">
                  {isAuthenticated ? (
                    <>
                      <Button
                        variant="glass"
                        onClick={() => {
                          setOpen(false);
                          navigate({ to: dashboardPath });
                        }}
                      >
                        Dashboard
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          await signOut();
                          setOpen(false);
                          navigate({ to: "/" });
                        }}
                      >
                        Sign out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild variant="ghost" onClick={() => setOpen(false)}>
                        <Link to="/auth">Login</Link>
                      </Button>
                      <Button asChild variant="hero" onClick={() => setOpen(false)}>
                        <Link to="/auth" search={{ mode: "register" }}>
                          Register
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
