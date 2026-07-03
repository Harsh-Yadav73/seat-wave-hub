import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  component: Contact,
});

function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Thanks! We'll get back to you shortly.");
    setName(""); setEmail(""); setMessage("");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-widest text-primary font-semibold">Contact</p>
        <h1 className="font-display text-4xl md:text-5xl font-black mt-2">Get in touch</h1>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <form onSubmit={submit} className="glass-strong rounded-3xl p-8 space-y-4 shadow-elegant">
          <div><Label>Your name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" /></div>
          <div><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" /></div>
          <div><Label>Message</Label><Textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1.5" /></div>
          <Button type="submit" variant="hero" size="lg" className="w-full">Send message</Button>
        </form>
        <div className="space-y-4">
          {[
            { icon: Mail, label: "Email", value: "hello@ticketbooking.app" },
            { icon: Phone, label: "Phone", value: "+91 98765 43210" },
            { icon: MapPin, label: "Office", value: "Bengaluru, India" },
          ].map((c) => (
            <div key={c.label} className="glass rounded-2xl p-6 flex items-start gap-4 shadow-card">
              <div className="grid h-11 w-11 place-items-center rounded-xl gradient-bg shadow-glow shrink-0">
                <c.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{c.label}</div>
                <div className="font-semibold">{c.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
