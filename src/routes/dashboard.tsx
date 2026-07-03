import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { RequireAuth } from "@/components/auth/require-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Ticket, Calendar, MapPin, Loader2, Heart, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  component: () => (<RequireAuth><CustomerDashboard /></RequireAuth>),
});

function CustomerDashboard() {
  const { user } = useAuth();

  const { data: bookings = [], isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["my-bookings", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("bookings").select("*, events(*, venues(*)), booking_seats(*, seats(*))").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: waitlist = [] } = useQuery({
    enabled: !!user,
    queryKey: ["my-waitlist", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("waitlist").select("*, events(*, venues(*))").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const upcoming = bookings.filter((b: any) => b.status === "confirmed" && new Date(b.events?.event_date) >= new Date());
  const past = bookings.filter((b: any) => new Date(b.events?.event_date) < new Date() || b.status !== "confirmed");

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-primary font-semibold">My account</p>
        <h1 className="font-display text-4xl font-black">Welcome back</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Upcoming" value={upcoming.length} />
        <StatCard label="Total bookings" value={bookings.length} />
        <StatCard label="Waitlisted" value={waitlist.length} />
        <StatCard label="Spent" value={`₹${bookings.reduce((s: number, b: any) => s + Number(b.total_amount || 0), 0).toFixed(0)}`} />
      </div>

      <Tabs defaultValue="tickets">
        <TabsList className="glass">
          <TabsTrigger value="tickets"><Ticket className="h-4 w-4" /> My Tickets</TabsTrigger>
          <TabsTrigger value="history"><Calendar className="h-4 w-4" /> History</TabsTrigger>
          <TabsTrigger value="waitlist"><Heart className="h-4 w-4" /> Waitlist</TabsTrigger>
          <TabsTrigger value="profile"><User className="h-4 w-4" /> Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-6 space-y-3">
          {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /> :
            upcoming.length === 0 ? <Empty label="No upcoming tickets." /> :
            upcoming.map((b: any) => <BookingRow key={b.id} b={b} />)}
        </TabsContent>
        <TabsContent value="history" className="mt-6 space-y-3">
          {past.length === 0 ? <Empty label="No past bookings." /> : past.map((b: any) => <BookingRow key={b.id} b={b} />)}
        </TabsContent>
        <TabsContent value="waitlist" className="mt-6 space-y-3">
          {waitlist.length === 0 ? <Empty label="You're not on any waitlists." /> : waitlist.map((w: any) => (
            <div key={w.id} className="glass rounded-2xl p-4 flex items-center justify-between shadow-card">
              <div>
                <div className="font-semibold">{w.events?.title}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{w.events?.venues?.name}</div>
              </div>
              <Badge variant="secondary" className="capitalize">{w.status}</Badge>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="profile" className="mt-6"><ProfileTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass rounded-2xl p-5 shadow-card">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-3xl font-black gradient-text mt-1">{value}</div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="glass rounded-2xl py-14 text-center text-muted-foreground shadow-card"><Ticket className="h-6 w-6 mx-auto mb-2 opacity-50" />{label}</div>;
}

function BookingRow({ b }: { b: any }) {
  return (
    <Link to="/booking/$code" params={{ code: b.booking_code }} className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-card hover:shadow-elegant transition-all">
      <div>
        <div className="font-semibold">{b.events?.title}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(b.events?.event_date).toLocaleDateString()}</span>
          {b.events?.venues && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{b.events.venues.name}</span>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={b.status === "confirmed" ? "default" : "secondary"} className="capitalize">{b.status}</Badge>
        <span className="font-display font-bold tabular-nums">₹{Number(b.total_amount).toFixed(0)}</span>
      </div>
    </Link>
  );
}

function ProfileTab() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) { setName(data.full_name ?? ""); setPhone(data.phone ?? ""); setCity(data.city ?? ""); }
    });
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: name, phone, city }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Profile updated");
  }

  return (
    <form onSubmit={save} className="glass-strong rounded-2xl p-6 shadow-elegant max-w-xl space-y-4">
      <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
      <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" /></div>
      <div><Label>City</Label><Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1.5" /></div>
      <Button type="submit" variant="hero" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</Button>
    </form>
  );
}
