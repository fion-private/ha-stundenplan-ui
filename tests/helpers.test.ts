import { describe, expect, it } from "vitest";

import { formatLongDate, getLessonTiming, groupLessonsByPeriod } from "../src/helpers";
import type { StundenplanLesson } from "../src/types";

function lesson(overrides: Partial<StundenplanLesson> = {}): StundenplanLesson {
  return {
    stunde: 1,
    beginn: "08:00",
    ende: "08:45",
    fach: "MA",
    kurs: null,
    lehrer: "Mueller",
    raum: "101",
    hinweis: "",
    status: "regulaer",
    faellt_aus: false,
    ...overrides,
  };
}

describe("getLessonTiming", () => {
  const zielDatum = "2026-08-28";

  it("returns 'neutral' when the target date is not today", () => {
    const now = new Date("2026-08-27T09:00:00");
    expect(getLessonTiming(lesson(), zielDatum, now)).toBe("neutral");
  });

  it("returns 'neutral' when no target date is given", () => {
    const now = new Date("2026-08-28T09:00:00");
    expect(getLessonTiming(lesson(), undefined, now)).toBe("neutral");
  });

  it("returns 'upcoming' before the lesson starts", () => {
    const now = new Date("2026-08-28T07:00:00");
    expect(getLessonTiming(lesson(), zielDatum, now)).toBe("upcoming");
  });

  it("returns 'current' while the lesson is ongoing", () => {
    const now = new Date("2026-08-28T08:20:00");
    expect(getLessonTiming(lesson(), zielDatum, now)).toBe("current");
  });

  it("returns 'current' exactly at the start time", () => {
    const now = new Date("2026-08-28T08:00:00");
    expect(getLessonTiming(lesson(), zielDatum, now)).toBe("current");
  });

  it("returns 'past' once the end time is reached", () => {
    const now = new Date("2026-08-28T08:45:00");
    expect(getLessonTiming(lesson(), zielDatum, now)).toBe("past");
  });

  it("returns 'past' well after the lesson has ended", () => {
    const now = new Date("2026-08-28T14:00:00");
    expect(getLessonTiming(lesson(), zielDatum, now)).toBe("past");
  });

  it("returns 'neutral' for malformed time strings", () => {
    const now = new Date("2026-08-28T09:00:00");
    expect(getLessonTiming(lesson({ beginn: "n/a" }), zielDatum, now)).toBe("neutral");
  });
});

describe("groupLessonsByPeriod", () => {
  const zielDatum = "2026-08-28";
  const now = new Date("2026-08-28T07:00:00");

  it("groups parallel lessons of the same period together", () => {
    const lessons = [
      lesson({ stunde: 3, fach: "WPK1", kurs: "WPK1", beginn: "09:50", ende: "10:35" }),
      lesson({ stunde: 3, fach: "WPK2", kurs: "WPK2", beginn: "09:50", ende: "10:35" }),
      lesson({ stunde: 1 }),
    ];
    const groups = groupLessonsByPeriod(lessons, zielDatum, now);
    expect(groups.map((group) => group.stunde)).toEqual([1, 3]);
    expect(groups[1].lessons).toHaveLength(2);
    expect(groups[1].lessons.map((l) => l.fach)).toEqual(["WPK1", "WPK2"]);
  });

  it("sorts groups by period number ascending, regardless of input order", () => {
    const lessons = [lesson({ stunde: 5 }), lesson({ stunde: 2 }), lesson({ stunde: 1 })];
    const groups = groupLessonsByPeriod(lessons, zielDatum, now);
    expect(groups.map((group) => group.stunde)).toEqual([1, 2, 5]);
  });

  it("computes timing per group from its representative lesson", () => {
    const lessons = [lesson({ stunde: 1, beginn: "06:00", ende: "06:45" })];
    const groups = groupLessonsByPeriod(lessons, zielDatum, now);
    expect(groups[0].timing).toBe("past");
  });

  it("returns an empty array for an empty input", () => {
    expect(groupLessonsByPeriod([], zielDatum, now)).toEqual([]);
  });
});

describe("formatLongDate", () => {
  it("returns an empty string when no date is given", () => {
    expect(formatLongDate(undefined, "en")).toBe("");
  });

  it("returns the raw input for a malformed date", () => {
    expect(formatLongDate("not-a-date", "en")).toBe("not-a-date");
  });

  it("formats a valid date in English", () => {
    const result = formatLongDate("2026-08-28", "en");
    expect(result).toContain("August");
    expect(result).toContain("28");
  });

  it("formats a valid date in German", () => {
    const result = formatLongDate("2026-08-28", "de");
    expect(result).toContain("August");
    expect(result).toContain("28");
  });
});
