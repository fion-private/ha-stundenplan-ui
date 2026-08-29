import type { HomeAssistant } from "custom-card-helpers";

import de from "./languages/de.json";
import en from "./languages/en.json";

type LanguageDict = Record<string, unknown>;

const LANGUAGES: Record<string, LanguageDict> = { en, de };
const FALLBACK_LANGUAGE = "en";

function resolvePath(dict: LanguageDict, path: string[]): unknown {
  let current: unknown = dict;
  for (const segment of path) {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }
    current = (current as LanguageDict)[segment];
  }
  return current;
}

/**
 * Resolves a dot-separated translation key (e.g. "editor.entity") against
 * the Home Assistant frontend's currently selected language, falling back
 * to English, and finally to the raw key if nothing matches.
 */
export function localize(
  hass: HomeAssistant | undefined,
  key: string,
  vars?: Record<string, string>
): string {
  const rawLanguage = hass?.locale?.language ?? hass?.language ?? FALLBACK_LANGUAGE;
  const language = rawLanguage.toLowerCase().split("-")[0];
  const path = key.split(".");

  const dict = LANGUAGES[language] ?? LANGUAGES[FALLBACK_LANGUAGE];
  let value = resolvePath(dict, path);
  if (typeof value !== "string") {
    value = resolvePath(LANGUAGES[FALLBACK_LANGUAGE], path);
  }

  let text = typeof value === "string" ? value : key;
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      text = text.replace(`{${name}}`, replacement);
    }
  }
  return text;
}
