import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SeatMap } from "@/components/booking/seat-map";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Tag, Loader2, Ticket, AlertCircle, Heart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import type { Seat, SeatCategory, EventWithVenue } from "@/lib/types";

export const Route = createFileRoute("/events/$id")({
  component: EventDetail,
});

function EventDetail() {
  const { id } = Route.useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Seat[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: async (): Promise<EventWithVenue | null> => {
      const { data } = await supabase.from("events").select("*, venues(*)").eq("id", id).maybeSingle();
      return data as any;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["seat-categories", id],
    queryFn: async () => {
      const { data } = await supabase.from("seat_categories").select("*").eq("event_id", id);
      return (data ?? []) as SeatCategory[];
    },
  });

  const { data: seats = [] } = useQuery({
    queryKey: ["seats", id],
    queryFn: async () => {
      const { data } = await supabase.from("seats").select("*").eq("event_id", id).order("row_label").order("seat_number");
      return (data ?? []) as Seat[];
    },
    refetchInterval: 15000,
  });

  // realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`seats:${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "seats", filter: `event_id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["seats", id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, qc]);

  const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const total = selected.reduce((sum, s) => sum + Number(catMap[s.category_id]?.price ?? 0), 0);

  function toggle(seat: Seat) {
    setSelected((prev) => (prev.some((s) => s.id === seat.id) ? prev.filter((s) => s.id !== seat.id) : [...prev, seat]));
  }

  async function proceed() {
    if (!isAuthenticated || !user) {
      toast.error("Please sign in first");
      navigate({ to: "/auth", search: { mode: "login" } });
      return;
    }
    if (selected.length === 0) return;
    setSubmitting(true);
    try {
      const heldUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const seatIds = selected.map((s) => s.id);

      // Concurrent-safe hold: only update rows still available
      const { data: heldSeats, error: holdErr } = await supabase
        .from("seats")
        .update({ status: "held", held_by: user.id, held_until: heldUntil })
        .in("id", seatIds)
        .eq("status", "available")
        .select("id");
      if (holdErr) throw holdErr;
      if (!heldSeats || heldSeats.length !== seatIds.length) {
        // rollback anything we did lock
        const lockedIds = heldSeats?.map((s: any) => s.id) ?? [];
        if (lockedIds.length) {
          await supabase.from("seats").update({ status: "available", held_by: null, held_until: null }).in("id", lockedIds);
        }
        toast.error("Some seats were just taken. Please choose again.");
        qc.invalidateQueries({ queryKey: ["seats", id] });
        setSelected([]);
        return;
      }

      // Create pending booking
      const { data: booking, error: bookingErr } = await supabase
        .from("bookings")
        .insert({ user_id: user.id, event_id: id, total_amount: total, status: "pending" })
        .select()
        .single();
      if (bookingErr) throw bookingErr;

      // Insert booking_seats
      const rows = selected.map((s) => ({ booking_id: booking.id, seat_id: s.id, price: Number(catMap[s.category_id]?.price ?? 0) }));
      const { error: bsErr } = await supabase.from("booking_seats").insert(rows);
      if (bsErr) throw bsErr;

      navigate({ to: "/checkout/$bookingId", params: { bookingId: booking.id } });
    } catch (e: any) {
      toast.error(e.message ?? "Could not hold seats");
    } finally {
      setSubmitting(false);
    }
  }

  async function joinWaitlist() {
    if (!user) { navigate({ to: "/auth", search: { mode: "login" } }); return; }
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const { error } = await supabase.from("waitlist").insert({ user_id: user.id, event_id: id, expires_at: expires, status: "waiting" });
    if (error) toast.error(error.message);
    else toast.success("You're on the waitlist. We'll notify you if seats free up.");
  }

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!event) return (
    <div className="mx-auto max-w-md py-24 text-center">
      <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
      <p>Event not found.</p>
      <Link to="/" className="text-primary text-sm hover:underline mt-2 inline-block">Home</Link>
    </div>
  );

  const soldOut = event.status === "sold_out";
  const banner = event.banner_url || `https://source.unsplash.com/1600x600/?${event.type},${encodeURIComponent(event.title)}`;

  return (
    <div>
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0">
          <img src={banner} alt={event.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-10">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className="gradient-bg text-primary-foreground border-0">{event.type === "movie" ? "Movie" : "Concert"}</Badge>
            {event.age_rating && <Badge variant="secondary">{event.age_rating}</Badge>}
            {soldOut && <Badge variant="destructive">Sold out</Badge>}
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-black leading-tight">{event.title}</h1>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{new Date(event.event_date).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{event.start_time?.slice(0,5)}{event.duration_minutes ? ` · ${event.duration_minutes}min` : ""}</span>
            {event.venues && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.venues.name}, {event.venues.city}</span>}
            {event.genre && <span className="flex items-center gap-1.5"><Tag className="h-4 w-4" />{event.genre}</span>}
            {event.language && <span>· {event.language}</span>}
          </div>
          {event.description && <p className="mt-4 max-w-3xl text-muted-foreground">{event.description}</p>}
        </div>
      </section>

      {/* SEAT MAP / WAITLIST */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-24">
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div>
            {seats.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center text-muted-foreground shadow-card">
                <Ticket className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p>Seats aren't published for this event yet.</p>
              </div>
            ) : (
              <SeatMap seats={seats} categories={categories} selectedIds={selected.map((s) => s.id)} currentUserId={user?.id} onToggle={toggle} />
            )}
          </div>
          <aside className="lg:sticky lg:top-24 h-max">
            <div className="glass-strong rounded-2xl p-6 shadow-elegant">
              <h3 className="font-display font-bold text-lg">Your selection</h3>
              {selected.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">Pick up to 8 seats on the map.</p>
              ) : (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {selected.map((s) => (
                    <li key={s.id} className="flex justify-between">
                      <span>{s.row_label}{s.seat_number} <span className="text-muted-foreground">· {catMap[s.category_id]?.name}</span></span>
                      <span className="tabular-nums">₹{Number(catMap[s.category_id]?.price ?? 0).toFixed(0)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="my-4 h-px bg-border" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-display text-2xl font-black gradient-text tabular-nums">₹{total.toFixed(0)}</span>
              </div>
              {soldOut ? (
                <Button onClick={joinWaitlist} variant="glass" size="lg" className="w-full">
                  <Heart className="h-4 w-4" /> Join waitlist
                </Button>
              ) : (
                <Button onClick={proceed} disabled={selected.length === 0 || submitting} variant="hero" size="lg" className="w-full">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Continue to payment
                </Button>
              )}
              <p className="mt-3 text-[11px] text-muted-foreground text-center">
                Seats are held for 10 minutes at checkout.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
