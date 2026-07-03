import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Ticket,
  Search,
  Sparkles,
  Shield,
  Zap,
  Clock,
  Users,
  Star,
  MapPin,
  Calendar,
  ChevronRight,
} from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { EventCard } from "@/components/events/event-card";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const { data: featured = [] } = useQuery({
    queryKey: ["featured-movies"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*, venues(*)")
        .eq("type", "movie")
        .in("status", ["published", "sold_out"])
        .order("event_date", { ascending: true })
        .limit(6);
      return data ?? [];
    },
  });

  const { data: concerts = [] } = useQuery({
    queryKey: ["upcoming-concerts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*, venues(*)")
        .eq("type", "concert")
        .in("status", ["published", "sold_out"])
        .order("event_date", { ascending: true })
        .limit(6);
      return data ?? [];
    },
  });

  const { data: venues = [] } = useQuery({
    queryKey: ["popular-venues"],
    queryFn: async () => {
      const { data } = await supabase.from("venues").select("*").limit(6);
      return data ?? [];
    },
  });

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Concert stage with dramatic lights"
            className="h-full w-full object-cover"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-20 pb-24 md:pt-32 md:pb-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Live seat maps. Instant QR tickets.
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-black tracking-tighter leading-[0.95]">
              Book Movies &<br />
              <span className="gradient-text">Concerts in Seconds.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
              Discover blockbusters, live shows, and unforgettable nights. Pick your seats in real
              time and get your QR ticket instantly.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigate({ to: "/movies", search: { q } });
              }}
              className="mt-8 glass-strong rounded-2xl p-2 flex flex-col sm:flex-row gap-2 max-w-2xl shadow-elegant"
            >
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search movies, concerts, venues, cities..."
                  className="border-0 focus-visible:ring-0 h-11 bg-transparent"
                />
              </div>
              <Button type="submit" variant="hero" size="lg">
                Search
              </Button>
            </form>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="glass" size="lg">
                <Link to="/movies">
                  <Ticket className="h-4 w-4" /> Browse movies
                </Link>
              </Button>
              <Button asChild variant="glass" size="lg">
                <Link to="/concerts">
                  <Sparkles className="h-4 w-4" /> See concerts
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 -mt-12 relative z-10">
        <div className="glass-strong rounded-3xl p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 shadow-elegant">
          {[
            { n: "2M+", l: "Tickets booked" },
            { n: "500+", l: "Venues" },
            { n: "50K+", l: "Events hosted" },
            { n: "4.9★", l: "Rated by users" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="font-display text-3xl md:text-4xl font-black gradient-text">{s.n}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED MOVIES */}
      <SectionHeader
        eyebrow="Now Showing"
        title="Featured Movies"
        cta={{ label: "View all", to: "/movies" }}
      />
      <SectionGrid items={featured} emptyLabel="No movies yet — organizers are adding them soon." />

      {/* UPCOMING CONCERTS */}
      <SectionHeader
        eyebrow="Live This Season"
        title="Upcoming Concerts"
        cta={{ label: "See all", to: "/concerts" }}
      />
      <SectionGrid items={concerts} emptyLabel="No concerts yet — check back soon." />

      {/* POPULAR VENUES */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary font-semibold">Cities & Halls</p>
            <h2 className="mt-1 text-3xl md:text-4xl font-black">Popular Venues</h2>
          </div>
        </div>
        {venues.length === 0 ? (
          <EmptyState label="No venues yet." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {venues.map((v) => (
              <div key={v.id} className="glass rounded-2xl p-6 shadow-card hover:shadow-elegant transition-all hover:-translate-y-0.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{v.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {v.city}
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground font-medium">
                    {v.capacity} seats
                  </span>
                </div>
                {v.description && (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{v.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* WHY */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-24">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">Why us</p>
          <h2 className="mt-1 text-3xl md:text-4xl font-black">Ticketing, reimagined.</h2>
        </div>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { icon: Zap, title: "Lightning checkout", body: "Pick, pay, and get your QR ticket in under 60 seconds." },
            { icon: Shield, title: "Guaranteed seats", body: "10-minute holds ensure no one grabs your seat mid-checkout." },
            { icon: Clock, title: "Waitlist automation", body: "Sold out? Join the waitlist and we'll auto-offer seats to you." },
            { icon: Users, title: "For every organizer", body: "Sell tickets, track revenue, and manage venues in one dashboard." },
            { icon: Sparkles, title: "Interactive seat maps", body: "Zoomable, touch-friendly maps — pick exactly the seat you want." },
            { icon: Star, title: "Loved by fans", body: "4.9/5 across 50,000+ reviews from real ticket holders." },
          ].map((f, i) => (
            <div key={i} className="glass rounded-2xl p-6 shadow-card">
              <div className="grid h-11 w-11 place-items-center rounded-xl gradient-bg shadow-glow">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="mt-4 font-bold text-lg">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-24">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">What fans say</p>
          <h2 className="mt-1 text-3xl md:text-4xl font-black">Loved by the crowd</h2>
        </div>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { name: "Priya S.", text: "Booked front-row concert tickets in 40 seconds. The seat map is stunning.", role: "Music fan" },
            { name: "Arjun M.", text: "The waitlist got me tickets to a sold-out premiere. Chef's kiss.", role: "Film buff" },
            { name: "Sara T.", text: "As an organizer, the dashboards make my life 10x easier.", role: "Event organizer" },
          ].map((t, i) => (
            <div key={i} className="glass rounded-2xl p-6 shadow-card">
              <div className="flex gap-0.5 text-primary-glow">
                {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-3 text-sm">{t.text}</p>
              <p className="mt-4 text-sm font-semibold">{t.name} <span className="text-muted-foreground font-normal">· {t.role}</span></p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 mt-24">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">FAQ</p>
          <h2 className="mt-1 text-3xl md:text-4xl font-black">Answers, fast.</h2>
        </div>
        <Accordion type="single" collapsible className="mt-8 glass rounded-2xl px-6">
          {[
            { q: "How do I book a ticket?", a: "Browse events, tap an event, pick your seats on the live map, and check out. You'll get a QR ticket instantly." },
            { q: "What happens if the show is sold out?", a: "Join the waitlist. If seats free up, we'll offer them to you with a 15-minute claim window." },
            { q: "Can I cancel or refund?", a: "Yes — cancel from My Tickets. Refunds follow the organizer's policy for that event." },
            { q: "How do organizers get started?", a: "Register as an organizer and submit for approval. Once approved, create events, venues, and seat maps." },
          ].map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-b last:border-b-0">
              <AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-24">
        <div className="relative overflow-hidden rounded-3xl gradient-bg p-10 md:p-16 shadow-glow text-center">
          <h2 className="font-display text-3xl md:text-5xl font-black text-primary-foreground">
            Your next great night starts here.
          </h2>
          <p className="mt-3 text-primary-foreground/90 max-w-xl mx-auto">
            Join 2M+ ticket holders. Sign up in 30 seconds.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="glass" size="xl">
              <Link to="/auth" search={{ mode: "register" }}>
                Create free account <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ eyebrow, title, cta }: { eyebrow: string; title: string; cta: { label: string; to: string } }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-24">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">{eyebrow}</p>
          <h2 className="mt-1 text-3xl md:text-4xl font-black">{title}</h2>
        </div>
        <Link to={cta.to} className="text-sm font-semibold text-primary hover:underline hidden sm:inline-flex items-center gap-1">
          {cta.label} <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function SectionGrid({ items, emptyLabel }: { items: any[]; emptyLabel: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {items.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="glass rounded-2xl py-14 text-center text-muted-foreground shadow-card">
      <Calendar className="h-8 w-8 mx-auto mb-3 opacity-50" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
