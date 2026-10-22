// Price alerts. Shared by the extension and the preferences window, so this
// file must not import anything from GNOME Shell.
//
// An alert is [symbolId, direction, threshold]: direction is "above" or
// "below", and the threshold is in the symbol's own unit (Toman, US dollars
// or index points), so switching between Toman and Rial doesn't change it.
// Each alert goes off once and is then removed.

import { ALERT_STRINGS } from "./constants.js";
import { formatValue } from "./utils.js";

export const ALERTS_KEY = "price-alerts";
export const ALERTS_TYPE = "a(ssd)";

export function isTriggered([, direction, threshold], value) {
  return direction === "below" ? value <= threshold : value >= threshold;
}

// Splits alerts into the ones the snapshot sets off and the ones left over.
// Alerts for rates missing from the snapshot stay.
export function splitTriggered(alerts, snapshot) {
  const triggered = [];
  const remaining = [];
  for (const alert of alerts) {
    const value = snapshot?.rates?.[alert[0]]?.value;
    if (typeof value === "number" && isTriggered(alert, value)) {
      triggered.push({ alert, value });
    } else {
      remaining.push(alert);
    }
  }
  return { triggered, remaining };
}

// Reads a number typed in Latin, Persian or Arabic digits, with or without
// thousands separators. Returns null unless it's a positive number.
export function parseAmount(text) {
  const normalized = String(text)
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/٫/g, ".")
    .replace(/[,٬\s]/g, "");
  if (!/^\d*\.?\d+$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

// What the user types is in the display unit; alerts store the symbol's own.
export function toSymbolUnit(symbol, amount, unit) {
  return symbol.kind === "toman" && unit === "rial" ? amount / 10 : amount;
}

// "Toman", "Rial", "US dollars" or "points", for labelling an amount.
export function unitName(symbol, unit, lang) {
  const strings = ALERT_STRINGS[lang];
  if (symbol.kind === "usd") return strings.usDollars;
  if (symbol.kind === "index") return strings.points;
  return unit === "rial" ? strings.rial : strings.toman;
}

// "100,000 Toman" or "$4,165.58", in the display unit.
export function formatAmount(symbol, value, unit, lang) {
  const text = formatValue(symbol, value, unit, lang);
  return symbol.kind === "toman"
    ? `${text} ${unitName(symbol, unit, lang)}`
    : text;
}

// Title and body for the notification of a triggered alert.
export function describeTriggered({ alert, value }, symbol, unit, lang) {
  const [, direction, threshold] = alert;
  const strings = ALERT_STRINGS[lang];
  const name = symbol.labels[lang];
  const target = formatAmount(symbol, threshold, unit, lang);
  const now = formatAmount(symbol, value, unit, lang);
  return {
    title: direction === "below"
      ? strings.wentBelow(name, target)
      : strings.wentAbove(name, target),
    body: strings.now(now),
  };
}
