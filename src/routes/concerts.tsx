import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { EventsBrowsePage } from "./movies";

const searchSchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  language: z.string().optional(),
  genre: z.string().optional(),
  sort: z.enum(["date", "price"]).optional(),
});

export const Route = createFileRoute("/concerts")({
  validateSearch: (s) => searchSchema.parse(s),
  component: () => <EventsBrowsePage type="concert" heading="Concerts" />,
});
