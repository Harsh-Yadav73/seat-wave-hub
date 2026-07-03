import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Shield, Zap, Users, Star, Clock } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-primary font-semibold">About</p>
        <h1 className="font-display text-4xl md:text-5xl font-black mt-2">Ticketing, reimagined.</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Ticket Booking System makes discovering and booking movies and concerts effortless — with live seat maps,
          instant QR tickets, and smart waitlists.
        </p>
      </div>
      <div className="mt-12 grid sm:grid-cols-2 gap-5">
        {[
          { icon: Zap, title: "Lightning fast", body: "Sub-60-second checkout with mock/real payment providers." },
          { icon: Shield, title: "Secure by default", body: "RLS-enforced APIs, session-based auth, input validation." },
          { icon: Users, title: "Multi-role", body: "Admins, organizers, and customers — each with tailored dashboards." },
          { icon: Sparkles, title: "Beautiful UI", body: "Glassmorphism, gradients, smooth animations, dark mode." },
          { icon: Clock, title: "Realtime holds", body: "10-minute seat holds prevent double-booking with concurrent protection." },
          { icon: Star, title: "Loved by fans", body: "Trusted by 2M+ users across 500+ venues." },
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
    </div>
  );
}
