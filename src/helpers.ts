import type { LessonTiming, StundenplanLesson } from "./types";

/**
 * Combines an ISO date ("YYYY-MM-DD") with an "HH:MM" time string into a
 * local Date object. Returns null if either input is malformed.
 */
export function parseHms(dateIso: string, hm: string | undefined): Date | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hm ?? "");
  if (!match) {
    return null;
  }
  const date = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const [, hoursStr, minutesStr] = match;
  date.setHours(Number(hoursStr), Number(minutesStr), 0, 0);
  return date;
}

export function isSameLocalDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Determines whether a lesson is in the past, currently ongoing, or still
 * upcoming, relative to `now`. Live highlighting only applies when the
 * plan's target date is today; otherwise "neutral" is returned (e.g. in the
 * evening before, when the entity already shows tomorrow's plan).
 */
export function getLessonTiming(
  lesson: Pick<StundenplanLesson, "beginn" | "ende">,
  zielDatum: string | undefined,
  now: Date
): LessonTiming {
  if (!zielDatum) {
    return "neutral";
  }
  const zielDate = new Date(`${zielDatum}T00:00:00`);
  if (Number.isNaN(zielDate.getTime()) || !isSameLocalDate(zielDate, now)) {
    return "neutral";
  }
  const start = parseHms(zielDatum, lesson.beginn);
  const end = parseHms(zielDatum, lesson.ende);
  if (!start || !end) {
    return "neutral";
  }
  if (now < start) {
    return "upcoming";
  }
  if (now >= end) {
    return "past";
  }
  return "current";
}

export interface LessonGroup {
  stunde: number;
  beginn: string;
  ende: string;
  lessons: StundenplanLesson[];
  timing: LessonTiming;
}

/**
 * Groups lessons by period number (`stunde`), ascending. Multiple lessons
 * with the same period number (parallel/split course groups, see the
 * integration's `Ku2` handling) end up in the same group and share one
 * timeline row.
 */
export function groupLessonsByPeriod(
  lessons: StundenplanLesson[],
  zielDatum: string | undefined,
  now: Date
): LessonGroup[] {
  const byPeriod = new Map<number, StundenplanLesson[]>();
  for (const lesson of lessons) {
    const existing = byPeriod.get(lesson.stunde);
    if (existing) {
      existing.push(lesson);
    } else {
      byPeriod.set(lesson.stunde, [lesson]);
    }
  }

  return Array.from(byPeriod.entries())
    .sort(([periodA], [periodB]) => periodA - periodB)
    .map(([stunde, group]) => {
      const sorted = [...group].sort((a, b) => a.beginn.localeCompare(b.beginn));
      const representative = sorted[0];
      return {
        stunde,
        beginn: representative.beginn,
        ende: representative.ende,
        lessons: sorted,
        timing: getLessonTiming(representative, zielDatum, now),
      };
    });
}

/**
 * Formats an ISO date ("YYYY-MM-DD") as a localized long date, e.g.
 * "Friday, August 28" (en) / "Freitag, 28. August" (de).
 */
export function formatLongDate(dateIso: string | undefined, language: string): string {
  if (!dateIso) {
    return "";
  }
  const date = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateIso;
  }
  try {
    return new Intl.DateTimeFormat(language, {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}
