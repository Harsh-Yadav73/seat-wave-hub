import { useMemo, useState } from "react";
import type { Seat, SeatCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SeatMapProps {
  seats: Seat[];
  categories: SeatCategory[];
  selectedIds: string[];
  currentUserId?: string | null;
  onToggle: (seat: Seat) => void;
  maxSelect?: number;
}

export function SeatMap({ seats, categories, selectedIds, currentUserId, onToggle, maxSelect = 8 }: SeatMapProps) {
  const [zoom, setZoom] = useState(1);

  const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  // group seats by category, then by row
  const grouped = useMemo(() => {
    const byCat: Record<string, Record<string, Seat[]>> = {};
    for (const s of seats) {
      byCat[s.category_id] ??= {};
      byCat[s.category_id][s.row_label] ??= [];
      byCat[s.category_id][s.row_label].push(s);
    }
    for (const cat of Object.values(byCat)) {
      for (const row of Object.values(cat)) row.sort((a, b) => a.seat_number - b.seat_number);
    }
    return byCat;
  }, [seats]);

  // ordered categories (by price desc, so premium at top)
  const orderedCats = [...categories].sort((a, b) => Number(b.price) - Number(a.price));

  return (
    <div>
      {/* Screen */}
      <div className="mx-auto mb-6 max-w-2xl">
        <div className="mx-auto h-2 rounded-full gradient-bg shadow-glow" />
        <p className="mt-2 text-center text-xs uppercase tracking-widest text-muted-foreground">Screen / Stage</p>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center justify-end gap-2 mb-3">
        <Button type="button" size="icon" variant="glass" onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}><Minus className="h-4 w-4" /></Button>
        <span className="text-xs w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
        <Button type="button" size="icon" variant="glass" onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}><Plus className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="glass" onClick={() => setZoom(1)}><RotateCcw className="h-4 w-4" /></Button>
      </div>

      <div className="overflow-auto rounded-2xl glass p-4 sm:p-6 shadow-card">
        <div className="mx-auto inline-block origin-top" style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
          {orderedCats.map((cat) => {
            const rows = grouped[cat.id];
            if (!rows) return null;
            const rowLabels = Object.keys(rows).sort();
            return (
              <div key={cat.id} className="mb-6 last:mb-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: cat.color ?? "#8b5cf6" }} />
                  <span className="text-xs font-semibold uppercase tracking-wider">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">₹{Number(cat.price).toFixed(0)}</span>
                </div>
                <div className="space-y-1.5">
                  {rowLabels.map((row) => (
                    <div key={row} className="flex items-center gap-1.5 justify-center">
                      <span className="w-6 text-xs text-muted-foreground text-center tabular-nums">{row}</span>
                      <div className="flex gap-1.5 flex-wrap justify-center">
                        {rows[row].map((seat) => {
                          const isSelected = selectedIds.includes(seat.id);
                          const isHeldByMe = seat.held_by === currentUserId;
                          let state: "available" | "held" | "booked" | "selected" | "disabled" = seat.status as any;
                          if (isSelected) state = "selected";
                          else if (seat.status === "held" && !isHeldByMe) state = "held";
                          const cls = {
                            available: "bg-emerald-500/25 hover:bg-emerald-500/50 border border-emerald-500/60 text-emerald-900 dark:text-emerald-50",
                            held: "bg-amber-500/40 border border-amber-500/70 text-amber-900 dark:text-amber-50 cursor-not-allowed",
                            booked: "bg-red-500/30 border border-red-500/60 text-red-900 dark:text-red-50 cursor-not-allowed",
                            selected: "gradient-bg text-primary-foreground shadow-glow border border-transparent",
                            disabled: "bg-muted border border-border text-muted-foreground cursor-not-allowed",
                          }[state];
                          const disabled = state === "held" || state === "booked" || state === "disabled" || (state === "available" && !isSelected && selectedIds.length >= maxSelect);
                          return (
                            <button
                              key={seat.id}
                              type="button"
                              disabled={disabled}
                              onClick={() => onToggle(seat)}
                              aria-label={`Seat ${row}${seat.seat_number}`}
                              className={cn(
                                "h-8 w-8 rounded-md text-[10px] font-semibold transition-all touch-manipulation",
                                cls,
                                disabled && "opacity-70"
                              )}
                            >
                              {seat.seat_number}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
        <LegendItem className="bg-emerald-500/40 border-emerald-500/60" label="Available" />
        <LegendItem className="gradient-bg border-transparent" label="Selected" />
        <LegendItem className="bg-amber-500/40 border-amber-500/70" label="Held" />
        <LegendItem className="bg-red-500/40 border-red-500/60" label="Booked" />
        <LegendItem className="bg-muted border-border" label="Disabled" />
      </div>
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("inline-block h-3.5 w-3.5 rounded border", className)} />
      {label}
    </span>
  );
}
