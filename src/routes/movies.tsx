import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EventCard } from "@/components/events/event-card";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const searchSchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  language: z.string().optional(),
  genre: z.string().optional(),
  sort: z.enum(["date", "price"]).optional(),
});

export const Route = createFileRoute("/movies")({
  validateSearch: (s) => searchSchema.parse(s),
  component: () => <EventsBrowsePage type="movie" heading="Movies" />,
});

export function EventsBrowsePage({ type, heading }: { type: "movie" | "concert"; heading: string }) {
  const search = Route.useSearch() as z.infer<typeof searchSchema>;
  const [q, setQ] = useState(search.q ?? "");
  const [city, setCity] = useState(search.city ?? "all");
  const [language, setLanguage] = useState(search.language ?? "all");
  const [genre, setGenre] = useState(search.genre ?? "all");
  const [sort, setSort] = useState<"date" | "price">(search.sort ?? "date");

  const { data = [], isLoading } = useQuery({
    queryKey: ["events-browse", type, q, city, language, genre, sort],
    queryFn: async () => {
      let query = supabase.from("events").select("*, venues(*)").eq("type", type).in("status", ["published", "sold_out"]);
      if (q) query = query.ilike("title", `%${q}%`);
      if (language !== "all") query = query.eq("language", language);
      if (genre !== "all") query = query.eq("genre", genre);
      query = sort === "price" ? query.order("base_price") : query.order("event_date");
      const { data } = await query;
      let rows = data ?? [];
      if (city !== "all") rows = rows.filter((r: any) => r.venues?.city === city);
      return rows;
    },
  });

  const cities = Array.from(new Set(data.map((e: any) => e.venues?.city).filter(Boolean)));
  const languages = Array.from(new Set(data.map((e: any) => e.language).filter(Boolean)));
  const genres = Array.from(new Set(data.map((e: any) => e.genre).filter(Boolean)));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">Discover</p>
          <h1 className="font-display text-4xl md:text-5xl font-black">{heading}</h1>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3 mb-8 shadow-card">
        <div className="flex-1 min-w-[200px] flex items-center gap-2 rounded-xl bg-background/50 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${heading.toLowerCase()}`} className="border-0 focus-visible:ring-0 bg-transparent h-9 p-0" />
        </div>
        <FilterSelect value={city} onChange={setCity} label="City" options={cities as string[]} />
        <FilterSelect value={language} onChange={setLanguage} label="Language" options={languages as string[]} />
        <FilterSelect value={genre} onChange={setGenre} label="Genre" options={genres as string[]} />
        <Select value={sort} onValueChange={(v) => setSort(v as any)}>
          <SelectTrigger className="w-[140px] rounded-xl"><SlidersHorizontal className="h-3.5 w-3.5" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Sort: Date</SelectItem>
            <SelectItem value="price">Sort: Price</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl aspect-[4/5] animate-pulse" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="glass rounded-2xl py-16 text-center text-muted-foreground shadow-card">
          <Calendar className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p>No {heading.toLowerCase()} match your filters.</p>
          <Link to="/" className="text-primary text-sm hover:underline mt-2 inline-block">Back to home</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.map((e: any) => <EventCard key={e.id} event={e} />)}
        </div>
      )}
    </div>
  );
}

function FilterSelect({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[140px] rounded-xl"><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{label}: All</SelectItem>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
