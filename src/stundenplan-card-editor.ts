import { html, LitElement } from "lit";
import type { TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { fireEvent } from "custom-card-helpers";
import type { HomeAssistant, LovelaceCardEditor } from "custom-card-helpers";

import { EDITOR_TAG } from "./const";
import { localize } from "./localize/localize";
import type { StundenplanCardConfig } from "./types";

interface SchemaItem {
  name: string;
  selector: Record<string, unknown>;
}

const SCHEMA: SchemaItem[] = [
  { name: "entity", selector: { entity: { domain: "sensor" } } },
  { name: "title", selector: { text: {} } },
  { name: "compact", selector: { boolean: {} } },
];

@customElement(EDITOR_TAG)
export class StundenplanCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: StundenplanCardConfig;

  public setConfig(config: StundenplanCardConfig): void {
    this._config = config;
  }

  private _computeLabel = (schemaItem: SchemaItem): string =>
    localize(this.hass, `editor.${schemaItem.name}`);

  private _valueChanged(ev: CustomEvent<{ value: StundenplanCardConfig }>): void {
    fireEvent(this, "config-changed", { config: ev.detail.value });
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) {
      return html``;
    }
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${this._config}
        .schema=${SCHEMA}
        .computeLabel=${this._computeLabel}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "stundenplan-card-editor": StundenplanCardEditor;
  }
}
