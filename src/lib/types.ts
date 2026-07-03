import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
export type Venue = Database["public"]["Tables"]["venues"]["Row"];
export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type SeatCategory = Database["public"]["Tables"]["seat_categories"]["Row"];
export type Seat = Database["public"]["Tables"]["seats"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type BookingSeat = Database["public"]["Tables"]["booking_seats"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type Waitlist = Database["public"]["Tables"]["waitlist"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type OrganizerProfile = Database["public"]["Tables"]["organizer_profiles"]["Row"];

export type AppRole = "admin" | "organizer" | "customer";
export type EventType = "movie" | "concert";
export type SeatCategoryType = "premium" | "gold" | "silver" | "standard" | "economy";
export type SeatStatus = "available" | "held" | "booked" | "disabled";

export interface EventWithVenue extends EventRow {
  venues: Venue | null;
}
