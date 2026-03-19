export type ActivityCategory =
  | "beach"
  | "culture"
  | "food"
  | "nature"
  | "adventure"
  | "shopping"
  | "temple";

export interface ItineraryActivity {
  id: string;
  time: string;
  title: string;
  location: string;
  category: ActivityCategory;
  notes?: string;
}

export interface ItineraryDay {
  id: string;
  date: string;
  activities: ItineraryActivity[];
}
