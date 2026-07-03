import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RequireAuth } from "@/components/auth/require-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Ticket, DollarSign, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: () => (<RequireAuth role="admin"><AdminDashboard /></RequireAuth>),
});

function AdminDashboard() {
  const qc = useQueryClient();

  const { data: orgs = [] } = useQuery({
    queryKey: ["admin-organizers"],
    queryFn: async () => (await supabase.from("organizer_profiles").select("*, profiles:user_id(*)")).data ?? [],
  });
  const { data: venues = [] } = useQuery({ queryKey: ["admin-venues"], queryFn: async () => (await supabase.from("venues").select("*")).data ?? [] });
  const { data: bookings = [] } = useQuery({ queryKey: ["admin-bookings"], queryFn: async () => (await supabase.from("bookings").select("*")).data ?? [] });
  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: async () => (await supabase.from("profiles").select("*")).data ?? [] });

  const pending = orgs.filter((o: any) => o.status === "pending");
  const totalRevenue = bookings.filter((b: any) => b.status === "confirmed").reduce((s: number, b: any) => s + Number(b.total_amount || 0), 0);

  async function decide(id: string, approve: boolean) {
    const { error } = await supabase.from("organizer_profiles").update({ status: approve ? "approved" : "rejected", approved_at: approve ? new Date().toISOString() : null }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(approve ? "Organizer approved" : "Organizer rejected");
    qc.invalidateQueries({ queryKey: ["admin-organizers"] });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-primary font-semibold">Admin</p>
        <h1 className="font-display text-4xl font-black">Control center</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat icon={Users} label="Users" value={users.length} />
        <Stat icon={Building2} label="Venues" value={venues.length} />
        <Stat icon={Ticket} label="Bookings" value={bookings.length} />
        <Stat icon={DollarSign} label="Revenue" value={`₹${totalRevenue.toFixed(0)}`} />
      </div>

      <Tabs defaultValue="organizers">
        <TabsList className="glass">
          <TabsTrigger value="organizers">Organizers {pending.length > 0 && <Badge className="ml-1 h-4 px-1 text-[10px]">{pending.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="venues">Venues</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="organizers" className="mt-6 space-y-3">
          {orgs.length === 0 ? <Empty label="No organizer applications." /> : orgs.map((o: any) => (
            <div key={o.id} className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-card">
              <div>
                <div className="font-semibold">{o.company_name}</div>
                <div className="text-xs text-muted-foreground">{o.profiles?.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={o.status === "approved" ? "default" : o.status === "pending" ? "secondary" : "destructive"} className="capitalize">{o.status}</Badge>
                {o.status === "pending" && (
                  <>
                    <Button size="sm" variant="hero" onClick={() => decide(o.id, true)}><Check className="h-4 w-4" /> Approve</Button>
                    <Button size="sm" variant="ghost" onClick={() => decide(o.id, false)}><X className="h-4 w-4" /> Reject</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="users" className="mt-6 space-y-2">
          {users.map((u: any) => (
            <div key={u.id} className="glass rounded-2xl p-4 flex justify-between shadow-card">
              <div><div className="font-semibold">{u.full_name ?? "Unnamed"}</div><div className="text-xs text-muted-foreground">{u.email}</div></div>
              <div className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="venues" className="mt-6 grid sm:grid-cols-2 gap-3">
          {venues.map((v: any) => (
            <div key={v.id} className="glass rounded-2xl p-5 shadow-card">
              <div className="font-semibold">{v.name}</div>
              <div className="text-xs text-muted-foreground">{v.city} · {v.capacity} seats</div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <div className="glass rounded-2xl p-8 shadow-card">
            <p className="text-sm text-muted-foreground">Confirmed revenue</p>
            <p className="font-display text-5xl font-black gradient-text mt-2">₹{totalRevenue.toFixed(0)}</p>
            <p className="mt-4 text-sm text-muted-foreground">{bookings.filter((b: any) => b.status === "confirmed").length} confirmed bookings · {bookings.filter((b: any) => b.status === "cancelled").length} cancellations</p>
          </div>
        </TabsContent>
      </Tabs>
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
function Empty({ label }: { label: string }) { return <div className="glass rounded-2xl py-14 text-center text-muted-foreground shadow-card">{label}</div>; }
