import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Timer, Lock, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { RequireAuth } from "@/components/auth/require-auth";

export const Route = createFileRoute("/checkout/$bookingId")({
  component: () => (<RequireAuth><Checkout /></RequireAuth>),
});

function Checkout() {
  const { bookingId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paying, setPaying] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () => {
      const { data: booking } = await supabase.from("bookings").select("*, events(*, venues(*))").eq("id", bookingId).maybeSingle();
      const { data: seats } = await supabase.from("booking_seats").select("*, seats(*, seat_categories(*))").eq("booking_id", bookingId);
      return { booking, seats: seats ?? [] };
    },
  });

  const booking = data?.booking as any;
  const seats = data?.seats as any[];

  const heldUntil = seats?.[0]?.seats?.held_until ? new Date(seats[0].seats.held_until).getTime() : null;
  const remaining = heldUntil ? Math.max(0, Math.floor((heldUntil - now) / 1000)) : null;
  const expired = remaining === 0;

  useEffect(() => {
    if (expired && booking?.status === "pending") {
      // Auto-cancel expired
      supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId).then(() => {
        toast.error("Your seat hold expired.");
      });
    }
  }, [expired, booking?.status, bookingId]);

  async function pay() {
    if (!user || !booking) return;
    setPaying(true);
    try {
      // Mock payment
      await new Promise((r) => setTimeout(r, 1200));
      const txn = `MOCK_${Date.now()}`;

      // Confirm booking
      const qrPayload = JSON.stringify({ b: booking.booking_code, e: booking.event_id, u: user.id });
      const { error: bErr } = await supabase.from("bookings").update({ status: "confirmed", qr_data: qrPayload }).eq("id", booking.id);
      if (bErr) throw bErr;

      // Book seats
      const seatIds = seats.map((s) => s.seat_id);
      const { error: sErr } = await supabase.from("seats").update({ status: "booked", held_by: null, held_until: null }).in("id", seatIds);
      if (sErr) throw sErr;

      // Payment record
      await supabase.from("payments").insert({ booking_id: booking.id, amount: booking.total_amount, method: "mock", status: "success", transaction_id: txn });

      // Notification
      await supabase.from("notifications").insert({ user_id: user.id, type: "booking_confirmed", title: "Booking confirmed", message: `Your booking ${booking.booking_code} is confirmed.` });

      navigate({ to: "/booking/$code", params: { code: booking.booking_code } });
    } catch (e: any) {
      toast.error(e.message ?? "Payment failed");
    } finally {
      setPaying(false);
    }
  }

  async function cancel() {
    if (!booking) return;
    const seatIds = seats.map((s) => s.seat_id);
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
    await supabase.from("seats").update({ status: "available", held_by: null, held_until: null }).in("id", seatIds);
    toast.success("Booking cancelled");
    navigate({ to: "/dashboard" });
  }

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!booking) return <div className="py-24 text-center">Booking not found.</div>;

  const ev = booking.events;
  const mm = String(Math.floor((remaining ?? 0) / 60)).padStart(2, "0");
  const ss = String((remaining ?? 0) % 60).padStart(2, "0");

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      <Link to="/events/$id" params={{ id: booking.event_id }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to event
      </Link>

      <div className="grid md:grid-cols-[1fr_360px] gap-6">
        <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-elegant">
          <h1 className="font-display text-2xl font-black">Review & pay</h1>
          <p className="text-sm text-muted-foreground">Booking <span className="font-mono">{booking.booking_code}</span></p>

          <div className="mt-6 rounded-2xl bg-background/40 p-5">
            <div className="font-bold text-lg">{ev?.title}</div>
            <div className="text-sm text-muted-foreground">
              {new Date(ev?.event_date).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })} · {ev?.start_time?.slice(0,5)}
            </div>
            {ev?.venues && <div className="text-sm text-muted-foreground">{ev.venues.name}, {ev.venues.city}</div>}
            <div className="mt-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Seats</div>
              <ul className="space-y-1 text-sm">
                {seats.map((bs) => (
                  <li key={bs.id} className="flex justify-between">
                    <span>{bs.seats?.row_label}{bs.seats?.seat_number} <span className="text-muted-foreground">· {bs.seats?.seat_categories?.name}</span></span>
                    <span className="tabular-nums">₹{Number(bs.price).toFixed(0)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="font-display font-bold text-lg mb-3">Payment method</h2>
            <div className="rounded-2xl border p-4 flex items-center gap-3 bg-background/40">
              <CreditCard className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <div className="text-sm font-semibold">Mock Payment (Test mode)</div>
                <div className="text-xs text-muted-foreground">Simulated — always succeeds</div>
              </div>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <aside className="h-max">
          <div className="glass-strong rounded-3xl p-6 shadow-elegant sticky top-24">
            {remaining !== null && !expired && booking.status === "pending" && (
              <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-2 text-sm font-semibold mb-4">
                <Timer className="h-4 w-4" /> Seats held: {mm}:{ss}
              </div>
            )}
            {expired && (
              <div className="rounded-xl bg-destructive/10 text-destructive px-3 py-2 text-sm font-semibold mb-4">
                Hold expired
              </div>
            )}
            <div className="flex justify-between mb-2 text-sm"><span>Subtotal</span><span className="tabular-nums">₹{Number(booking.total_amount).toFixed(0)}</span></div>
            <div className="flex justify-between mb-4 text-sm text-muted-foreground"><span>Fees</span><span>₹0</span></div>
            <div className="flex justify-between items-center mb-6">
              <span className="font-semibold">Total</span>
              <span className="font-display text-2xl font-black gradient-text tabular-nums">₹{Number(booking.total_amount).toFixed(0)}</span>
            </div>
            <Button onClick={pay} disabled={paying || expired || booking.status !== "pending"} variant="hero" size="lg" className="w-full">
              {paying && <Loader2 className="h-4 w-4 animate-spin" />} Pay now
            </Button>
            <Button onClick={cancel} variant="ghost" size="sm" className="w-full mt-2">Cancel booking</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
