import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, Calendar, Clock, MapPin, Download, ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/booking/$code")({
  component: () => (<RequireAuth><BookingSuccess /></RequireAuth>),
});

function BookingSuccess() {
  const { code } = Route.useParams();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["booking-code", code],
    queryFn: async () => {
      const { data: booking } = await supabase.from("bookings").select("*, events(*, venues(*)), profiles:user_id(*)").eq("booking_code", code).maybeSingle();
      const { data: seats } = await supabase.from("booking_seats").select("*, seats(*, seat_categories(*))").eq("booking_id", (booking as any)?.id ?? "00000000-0000-0000-0000-000000000000");
      const { data: profile } = user ? await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle() : { data: null };
      return { booking, seats: seats ?? [], profile };
    },
  });

  useEffect(() => {
    if (data?.booking?.qr_data && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, data.booking.qr_data, { width: 220, margin: 1, color: { dark: "#000000", light: "#ffffff" } });
    }
  }, [data?.booking?.qr_data]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `ticket-${code}.png`;
    a.click();
  }

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!data?.booking) return <div className="py-24 text-center">Ticket not found.</div>;

  const b = data.booking as any;
  const ev = b.events;
  const seats = data.seats as any[];
  const profile = data.profile as any;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <div className="text-center mb-8">
        <div className="inline-grid h-14 w-14 place-items-center rounded-full gradient-bg shadow-glow mb-3">
          <CheckCircle2 className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-black">Booking confirmed!</h1>
        <p className="mt-2 text-muted-foreground">Your QR ticket is ready. Show it at the entry.</p>
      </div>

      <div className="glass-strong rounded-3xl overflow-hidden shadow-elegant">
        <div className="grid md:grid-cols-[1fr_auto]">
          <div className="p-6 md:p-8">
            <Badge className="gradient-bg text-primary-foreground border-0 mb-2">{ev.type === "movie" ? "Movie" : "Concert"}</Badge>
            <h2 className="font-display text-2xl font-black">{ev.title}</h2>
            <div className="mt-2 text-sm text-muted-foreground space-y-1">
              <p className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{new Date(ev.event_date).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</p>
              <p className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{ev.start_time?.slice(0,5)}</p>
              {ev.venues && <p className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{ev.venues.name}, {ev.venues.city}</p>}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-xs uppercase tracking-widest text-muted-foreground">Booking ID</div><div className="font-mono font-semibold">{b.booking_code}</div></div>
              <div><div className="text-xs uppercase tracking-widest text-muted-foreground">Guest</div><div className="font-semibold">{profile?.full_name ?? "—"}</div></div>
              <div><div className="text-xs uppercase tracking-widest text-muted-foreground">Category</div><div className="font-semibold">{seats[0]?.seats?.seat_categories?.name}</div></div>
              <div><div className="text-xs uppercase tracking-widest text-muted-foreground">Status</div><div className="font-semibold capitalize">{b.status}</div></div>
              <div className="col-span-2">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Seats</div>
                <div className="font-semibold">{seats.map((s) => `${s.seats?.row_label}${s.seats?.seat_number}`).join(", ")}</div>
              </div>
            </div>
          </div>
          <div className="relative bg-white p-6 md:p-8 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-dashed border-border">
            <canvas ref={canvasRef} className="rounded-lg" />
            <div className="mt-3 text-xs text-black font-mono">{b.booking_code}</div>
            <Button onClick={download} variant="glass" size="sm" className="mt-3">
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Button asChild variant="hero" size="lg"><Link to="/dashboard">My tickets <ArrowRight className="h-4 w-4" /></Link></Button>
        <Button asChild variant="glass" size="lg"><Link to="/">Book more</Link></Button>
      </div>
    </div>
  );
}
