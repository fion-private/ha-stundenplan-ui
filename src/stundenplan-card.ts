import { css, html, LitElement, nothing } from "lit";
import type { PropertyValues, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";

import { CARD_TAG, CARD_VERSION, EDITOR_TAG, EMPTY_STATE_ICON, INTEGRATION_ICON } from "./const";
import { formatLongDate, groupLessonsByPeriod } from "./helpers";
import type { LessonGroup } from "./helpers";
import { localize } from "./localize/localize";
import type {
  StundenplanCardConfig,
  StundenplanEntityAttributes,
  StundenplanLesson,
} from "./types";

/**
 * Lovelace card for the "Stundenplan" integration. Reads the `lessons`
 * attribute of a single `sensor.<class>_day_plan_today` /
 * `_day_plan_tomorrow` entity and renders it as a single-day timeline, with
 * live "past / current / upcoming" highlighting when the plan's target
 * date is today. The card always shows exactly one of the two days - which
 * one is picked via the `entity` config option.
 */
@customElement(CARD_TAG)
export class StundenplanCard extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: StundenplanCardConfig;

  private _clockIntervalId?: number;

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import("./stundenplan-card-editor");
    return document.createElement(EDITOR_TAG) as unknown as LovelaceCardEditor;
  }

  public static getStubConfig(hass: HomeAssistant): StundenplanCardConfig {
    // Day-plan entities created by the "Stundenplan" integration expose a
    // `lessons` attribute - used here purely as a heuristic to pre-fill a
    // sensible default (today's or tomorrow's plan, whichever is found
    // first) when the card is added via the UI picker.
    const match = Object.keys(hass.states).find((entityId) => {
      if (!entityId.startsWith("sensor.")) {
        return false;
      }
      const attrs = hass.states[entityId]?.attributes as StundenplanEntityAttributes | undefined;
      return Array.isArray(attrs?.lessons);
    });
    return {
      type: `custom:${CARD_TAG}`,
      entity: match ?? "",
    };
  }

  public setConfig(config: StundenplanCardConfig): void {
    if (!config.entity) {
      throw new Error(localize(this.hass, "error.no_entity"));
    }
    this._config = { compact: false, ...config };
  }

  public getCardSize(): number {
    const lessonCount = this._lessons().length || 3;
    const perRow = this._config?.compact ? 0.5 : 0.8;
    return 1 + Math.ceil(lessonCount * perRow);
  }

  public connectedCallback(): void {
    super.connectedCallback();
    // The entity itself only updates hourly, but "past / current /
    // upcoming" needs to track the wall clock - so we force a re-render
    // every minute while the card is on screen.
    this._clockIntervalId = window.setInterval(() => this.requestUpdate(), 60_000);
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._clockIntervalId !== undefined) {
      window.clearInterval(this._clockIntervalId);
      this._clockIntervalId = undefined;
    }
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this._config) {
      return false;
    }
    if (changedProps.has("_config")) {
      return true;
    }
    // Avoid re-rendering on every hass update (e.g. unrelated entities
    // changing) - only react when our own entity's state object changes,
    // or when this was triggered by the internal minute-clock via
    // requestUpdate() (in which case "hass" is not in changedProps at all).
    if (!changedProps.has("hass")) {
      return true;
    }
    const oldHass = changedProps.get("hass") as HomeAssistant | undefined;
    if (!oldHass) {
      return true;
    }
    return oldHass.states[this._config.entity] !== this.hass?.states[this._config.entity];
  }

  private _stateObj() {
    if (!this.hass || !this._config) {
      return undefined;
    }
    return this.hass.states[this._config.entity];
  }

  private _lessons(): StundenplanLesson[] {
    const attrs = this._stateObj()?.attributes as StundenplanEntityAttributes | undefined;
    return Array.isArray(attrs?.lessons) ? attrs!.lessons! : [];
  }

  protected render(): TemplateResult {
    if (!this._config) {
      return html``;
    }
    const stateObj = this._stateObj();
    if (!stateObj) {
      return html`
        <hui-warning>
          ${localize(this.hass, "error.entity_not_found", { entity: this._config.entity })}
        </hui-warning>
      `;
    }

    const attrs = stateObj.attributes as StundenplanEntityAttributes;
    const lessons = Array.isArray(attrs.lessons) ? attrs.lessons : [];
    const title = this._config.title || attrs.friendly_name || "Stundenplan";
    const language = this.hass?.locale?.language ?? this.hass?.language ?? "en";
    const dateLabel = formatLongDate(attrs.target_date, language);
    const isEmpty =
      Boolean(attrs.plan_not_found) || Boolean(attrs.skipped_reason) || lessons.length === 0;

    return html`
      <ha-card>
        <div class="header">
          <div class="icon-badge">
            <ha-icon .icon=${INTEGRATION_ICON}></ha-icon>
          </div>
          <div class="titles">
            <div class="title">${title}</div>
            ${dateLabel ? html`<div class="subtitle">${dateLabel}</div>` : nothing}
          </div>
        </div>
        ${isEmpty ? this._renderEmptyState() : this._renderTimeline(lessons, attrs.target_date)}
      </ha-card>
    `;
  }

  private _renderEmptyState(): TemplateResult {
    return html`
      <div class="empty">
        <ha-icon .icon=${EMPTY_STATE_ICON}></ha-icon>
        <div class="empty-title">${localize(this.hass, "empty.title")}</div>
        <div class="empty-subtitle">${localize(this.hass, "empty.subtitle")}</div>
      </div>
    `;
  }

  private _renderTimeline(lessons: StundenplanLesson[], targetDate?: string): TemplateResult {
    const groups = groupLessonsByPeriod(lessons, targetDate, new Date());
    const compact = Boolean(this._config?.compact);
    return html`
      <div class="timeline ${compact ? "compact" : ""}">
        ${groups.map((group) => this._renderGroup(group, compact))}
      </div>
    `;
  }

  private _renderGroup(group: LessonGroup, compact: boolean): TemplateResult {
    const dotStatus = this._groupDotStatus(group.lessons);
    const rowClasses = [
      "row",
      group.timing === "current" ? "current" : "",
      group.timing === "past" ? "past" : "",
    ]
      .filter(Boolean)
      .join(" ");
    return html`
      <div class=${rowClasses}>
        <div class="time">${compact ? group.start : html`${group.start}<br />${group.end}`}</div>
        <div class="dot-col"><span class="dot ${dotStatus}"></span></div>
        <div class="content">
          ${group.lessons.map((lesson) => this._renderLesson(lesson, compact))}
          ${
            group.timing === "current"
              ? html`<span class="now-badge">${localize(this.hass, "now")}</span>`
              : nothing
          }
        </div>
      </div>
    `;
  }

  private _groupDotStatus(lessons: StundenplanLesson[]): string {
    if (lessons.some((lesson) => lesson.status === "cancelled")) {
      return "cancelled";
    }
    if (lessons.some((lesson) => lesson.status === "changed")) {
      return "changed";
    }
    return "regular";
  }

  private _renderLesson(lesson: StundenplanLesson, compact: boolean): TemplateResult {
    const cancelled = lesson.status === "cancelled";
    const changed = lesson.status === "changed";
    const meta = [lesson.teacher, lesson.room].filter(Boolean).join(" · ");
    // The course badge only adds information when the course code differs
    // from the subject (e.g. split groups like "WPK1"/"WPK2" for subject
    // "WPK"). When they're identical (the common case), showing both would
    // just be visual noise.
    const showCourseBadge = Boolean(lesson.course) && lesson.course !== lesson.subject && !compact;
    return html`
      <div class="lesson">
        <div class="lesson-line">
          ${showCourseBadge ? html`<span class="course-badge">${lesson.course}</span>` : nothing}
          <span class="subject ${cancelled ? "cancelled" : ""}">${lesson.subject}</span>
          ${
            changed
              ? html`<span class="badge warning">${localize(this.hass, "status.changed")}</span>`
              : nothing
          }
          ${
            cancelled
              ? html`<span class="badge error">${localize(this.hass, "status.cancelled")}</span>`
              : nothing
          }
        </div>
        ${!compact && meta ? html`<div class="meta">${meta}</div>` : nothing}
        ${lesson.note ? html`<div class="note">${lesson.note}</div>` : nothing}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    ha-card {
      padding: 16px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }
    .icon-badge {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background-color: rgba(var(--rgb-primary-color, 3, 169, 244), 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .icon-badge ha-icon {
      color: var(--primary-color);
      --mdc-icon-size: 18px;
    }
    .title {
      font-size: 15px;
      font-weight: 500;
      color: var(--primary-text-color);
      line-height: 1.3;
    }
    .subtitle {
      font-size: 13px;
      color: var(--secondary-text-color);
    }
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 24px 8px 8px;
    }
    .empty ha-icon {
      color: var(--disabled-text-color);
      --mdc-icon-size: 28px;
      margin-bottom: 8px;
    }
    .empty-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--secondary-text-color);
    }
    .empty-subtitle {
      font-size: 13px;
      color: var(--disabled-text-color);
      margin-top: 4px;
    }
    .row {
      display: grid;
      grid-template-columns: 50px 16px 1fr;
      column-gap: 10px;
      padding: 10px 8px;
      margin: 0 -8px;
      border-top: 1px solid var(--divider-color);
      border-radius: 8px;
      position: relative;
    }
    .timeline.compact .row {
      grid-template-columns: 42px 12px 1fr;
      padding: 6px 8px;
    }
    .row.current {
      background-color: rgba(var(--rgb-primary-color, 3, 169, 244), 0.08);
      border-top-color: transparent;
    }
    .row.past .time,
    .row.past .subject,
    .row.past .meta,
    .row.past .note {
      color: var(--disabled-text-color);
    }
    .time {
      font-size: 12px;
      color: var(--secondary-text-color);
      line-height: 1.35;
      padding-top: 2px;
    }
    .row.current .time {
      color: var(--primary-color);
      font-weight: 500;
    }
    .dot-col {
      display: flex;
      justify-content: center;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: 6px;
      background-color: var(--disabled-text-color);
    }
    .timeline.compact .dot {
      width: 6px;
      height: 6px;
    }
    .dot.changed {
      background-color: var(--warning-color);
    }
    .dot.cancelled {
      background-color: var(--error-color);
    }
    .content {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-right: 40px;
    }
    .lesson-line {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .subject {
      font-size: 14px;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .subject.cancelled {
      text-decoration: line-through;
      color: var(--disabled-text-color);
      font-weight: 400;
    }
    .meta {
      font-size: 13px;
      color: var(--secondary-text-color);
      margin-top: 1px;
    }
    .note {
      font-size: 12px;
      color: var(--disabled-text-color);
      font-style: italic;
      margin-top: 2px;
    }
    .badge {
      font-size: 11px;
      font-weight: 500;
      border-radius: 10px;
      padding: 1px 6px;
    }
    .badge.warning {
      color: var(--warning-color);
      background-color: rgba(var(--rgb-warning-color, 255, 160, 0), 0.15);
    }
    .badge.error {
      color: var(--error-color);
      background-color: rgba(var(--rgb-error-color, 219, 68, 55), 0.15);
    }
    .course-badge {
      font-size: 10px;
      font-weight: 500;
      color: var(--primary-color);
      background-color: rgba(var(--rgb-primary-color, 3, 169, 244), 0.15);
      border-radius: 10px;
      padding: 1px 6px;
    }
    .now-badge {
      position: absolute;
      top: 10px;
      right: 8px;
      font-size: 10px;
      font-weight: 600;
      color: var(--primary-color);
      text-transform: uppercase;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "stundenplan-card": StundenplanCard;
  }
}

window.customCards = window.customCards ?? [];
window.customCards.push({
  type: CARD_TAG,
  name: "Stundenplan Card",
  description: "Shows one day's timetable and substitutions from the Stundenplan integration.",
  preview: true,
  documentationURL: "https://github.com/fion-private/ha-stundenplan-ui",
});

// eslint-disable-next-line no-console
console.info(
  `%c STUNDENPLAN-CARD %c v${CARD_VERSION} `,
  "color: white; background: #1976d2; font-weight: 700; border-radius: 3px 0 0 3px;",
  "color: #1976d2; background: white; font-weight: 700; border-radius: 0 3px 3px 0;"
);
