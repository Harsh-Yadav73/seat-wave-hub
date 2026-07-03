import { Link } from "@tanstack/react-router";
import { MapPin, Calendar, Clock, Tag } from "lucide-react";
import type { EventWithVenue } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export function EventCard({ event }: { event: EventWithVenue }) {
  const soldOut = event.status === "sold_out";
  const bannerFallback = `https://source.unsplash.com/800x1000/?${event.type},${encodeURIComponent(event.title)}`;
  return (
    <Link
      to="/events/$id"
      params={{ id: event.id }}
      className="group glass rounded-2xl overflow-hidden shadow-card hover:shadow-elegant transition-all hover:-translate-y-0.5 flex flex-col"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={event.banner_url || bannerFallback}
          alt={event.title}
          loading="lazy"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Badge className="gradient-bg text-primary-foreground border-0">
            {event.type === "movie" ? "Movie" : "Concert"}
          </Badge>
          {soldOut && <Badge variant="destructive">Sold Out</Badge>}
        </div>
        {event.age_rating && (
          <Badge variant="secondary" className="absolute top-3 right-3">{event.age_rating}</Badge>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-display font-bold text-lg leading-tight line-clamp-1">{event.title}</h3>
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(event.event_date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</p>
          <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {event.start_time?.slice(0,5)}</p>
          {event.venues && <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {event.venues.name}, {event.venues.city}</p>}
          {event.genre && <p className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> {event.genre}</p>}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">From</span>
          <span className="font-display text-xl font-bold gradient-text">₹{Number(event.base_price || 0).toFixed(0)}</span>
        </div>
      </div>
    </Link>
  );
}
