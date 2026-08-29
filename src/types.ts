import type { LovelaceCardConfig } from "custom-card-helpers";

/**
 * Mirrors the status values produced by the "Stundenplan" integration's
 * coordinator (custom_components/stundenplan/coordinator.py, `Lesson.status`).
 */
export type StundenplanStatus = "regulaer" | "geaendert" | "entfaellt";

/**
 * A single entry of the `stunden` attribute on the
 * `sensor.<class>_tagesplan` entity provided by the "Stundenplan" integration.
 */
export interface StundenplanLesson {
  stunde: number;
  beginn: string; // "HH:MM"
  ende: string; // "HH:MM"
  fach: string;
  kurs: string | null;
  lehrer: string;
  raum: string;
  hinweis: string;
  status: StundenplanStatus;
  faellt_aus: boolean;
}

export interface StundenplanEntityAttributes {
  ziel_datum?: string; // "YYYY-MM-DD"
  kein_plan_gefunden?: boolean;
  uebersprungen_grund?: string | null;
  anzahl_stunden?: number;
  stunden?: StundenplanLesson[];
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
 *   does not apply (e.g. it's the evening before, showing tomorrow's plan).
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
