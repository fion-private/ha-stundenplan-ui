import type { LovelaceCardConfig } from "custom-card-helpers";

/**
 * Mirrors the status values produced by the "Stundenplan" integration's
 * coordinator (custom_components/stundenplan/coordinator.py, `Lesson.status`).
 */
export type StundenplanStatus = "regular" | "changed" | "cancelled";

/**
 * A single entry of the `lessons` attribute on a
 * `sensor.<class>_day_plan_today` / `_tomorrow` entity provided by the
 * "Stundenplan" integration.
 */
export interface StundenplanLesson {
  period: number;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  subject: string;
  course: string | null;
  teacher: string;
  room: string;
  note: string;
  status: StundenplanStatus;
  cancelled: boolean;
}

export interface StundenplanEntityAttributes {
  target_date?: string; // "YYYY-MM-DD"
  plan_not_found?: boolean;
  skipped_reason?: string | null;
  lesson_count?: number;
  lessons?: StundenplanLesson[];
  friendly_name?: string;
}

export interface StundenplanCardConfig extends LovelaceCardConfig {
  entity: string;
  title?: string;
  compact?: boolean;
}

/**
 * Where a lesson (or period group) sits relative to "now":
 * - "neutral": the plan's target date is not today, so live highlighting
 *   does not apply (e.g. the card is configured to show tomorrow's plan).
 * - "past" / "current" / "upcoming": relative to the lesson's start/end time,
 *   only computed when the target date is today.
 */
export type LessonTiming = "past" | "current" | "upcoming" | "neutral";

declare global {
  interface Window {
    customCards?: Array<{
      type: string;
      name: string;
      description?: string;
      preview?: boolean;
      documentationURL?: string;
    }>;
  }
}
