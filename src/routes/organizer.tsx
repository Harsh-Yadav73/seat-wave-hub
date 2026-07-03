import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { RequireAuth } from "@/components/auth/require-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Ticket, DollarSign, TrendingUp, Building2 } from "lucide-react";

export const Route = createFileRoute("/organizer")({
  component: () => (<RequireAuth role="organizer"><OrganizerDashboard /></RequireAuth>),
});

function OrganizerDashboard() {
  const { user } = useAuth();

  const { data: events = [] } = useQuery({
    enabled: !!user,
    queryKey: ["org-events", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("events").select("*, venues(*), bookings(total_amount, status)").eq("organizer_id", user!.id).order("event_date", { ascending: false });
      return data ?? [];
    },
  });

  const totalRevenue = events.reduce((sum: number, e: any) => sum + (e.bookings?.filter((b: any) => b.status === "confirmed").reduce((s: number, b: any) => s + Number(b.total_amount || 0), 0) ?? 0), 0);
  const totalBookings = events.reduce((sum: number, e: any) => sum + (e.bookings?.filter((b: any) => b.status === "confirmed").length ?? 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-primary font-semibold">Organizer</p>
        <h1 className="font-display text-4xl font-black">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat icon={Calendar} label="Events" value={events.length} />
        <Stat icon={Ticket} label="Bookings" value={totalBookings} />
        <Stat icon={DollarSign} label="Revenue" value={`₹${totalRevenue.toFixed(0)}`} />
        <Stat icon={TrendingUp} label="Avg. per event" value={events.length ? `₹${(totalRevenue / events.length).toFixed(0)}` : "₹0"} />
      </div>

      <Tabs defaultValue="events">
        <TabsList className="glass">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="venues">Venues</TabsTrigger>
        </TabsList>
        <TabsContent value="events" className="mt-6 space-y-3">
          {events.length === 0 ? <Empty label="No events yet. Create your first event." /> :
            events.map((e: any) => (
              <div key={e.id} className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-card">
                <div>
                  <div className="font-semibold">{e.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(e.event_date).toLocaleDateString()} · {e.venues?.name}</div>
                </div>
                <Badge className="capitalize">{e.status}</Badge>
              </div>
            ))}
        </TabsContent>
        <TabsContent value="bookings" className="mt-6"><Empty label="Booking rollups appear here." /></TabsContent>
        <TabsContent value="revenue" className="mt-6">
          <div className="glass rounded-2xl p-8 shadow-card">
            <p className="text-sm text-muted-foreground">Total revenue</p>
            <p className="font-display text-5xl font-black gradient-text mt-2">₹{totalRevenue.toFixed(0)}</p>
          </div>
        </TabsContent>
        <TabsContent value="venues" className="mt-6"><VenuesList /></TabsContent>
      </Tabs>
    </div>
  );
}

function VenuesList() {
  const { data = [] } = useQuery({
    queryKey: ["venues"],
    queryFn: async () => (await supabase.from("venues").select("*")).data ?? [],
  });
  return data.length === 0 ? <Empty label="No venues yet." /> : (
    <div className="grid sm:grid-cols-2 gap-3">
      {data.map((v: any) => (
        <div key={v.id} className="glass rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /><div className="font-semibold">{v.name}</div></div>
          <div className="text-xs text-muted-foreground">{v.city} · {v.capacity} seats</div>
        </div>
      ))}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="glass rounded-2xl p-5 shadow-card">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</div>
      <div className="font-display text-3xl font-black gradient-text mt-1">{value}</div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="glass rounded-2xl py-14 text-center text-muted-foreground shadow-card">{label}</div>;
}
