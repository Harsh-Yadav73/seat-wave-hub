import { Link } from "@tanstack/react-router";
import { Ticket, Twitter, Instagram, Facebook } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card/40 mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="grid h-9 w-9 place-items-center rounded-xl gradient-bg">
                <Ticket className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold">TicketBooking</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Book movies & concerts in seconds. Great seats, no lines.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/movies" className="hover:text-foreground">Movies</Link></li>
              <li><Link to="/concerts" className="hover:text-foreground">Concerts</Link></li>
              <li><Link to="/about" className="hover:text-foreground">About</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/auth" className="hover:text-foreground">Login</Link></li>
              <li><Link to="/auth" search={{ mode: "register" }} className="hover:text-foreground">Register</Link></li>
              <li><Link to="/dashboard/tickets" className="hover:text-foreground">My Tickets</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Follow</h4>
            <div className="flex gap-3 text-muted-foreground">
              <a href="#" className="hover:text-foreground"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="hover:text-foreground"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="hover:text-foreground"><Facebook className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} TicketBooking. All rights reserved.</p>
          <p>Book Movies & Concerts in Seconds.</p>
        </div>
      </div>
    </footer>
  );
}
