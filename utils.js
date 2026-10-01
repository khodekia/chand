const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function localizeDigits(text, lang) {
  if (lang !== "fa") return text;
  return text.replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[digit]);
}

// `value` is in the symbol's own unit: Toman, US dollars or index points.
export function formatValue(symbol, value, unit, lang) {
  let text;
  if (symbol.kind === "usd") {
    text = `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  } else {
    const shown = symbol.kind === "toman" && unit === "rial" ? value * 10 : value;
    text = Math.round(shown).toLocaleString("en-US");
  }
  return localizeDigits(text, lang);
}

// Returns null when there is no change to show yet. `direction` picks the
// arrow icon: "up", "down" or "none".
export function formatChange(change, lang) {
  if (typeof change !== "number" || !Number.isFinite(change)) return null;

  const percent = localizeDigits(Math.abs(change).toFixed(2), lang);
  const text = `${percent}${lang === "fa" ? "٪" : "%"}`;
  if (change > 0) {
    return { direction: "up", text, styleClass: "chand-change-up" };
  }
  if (change < 0) {
    return { direction: "down", text, styleClass: "chand-change-down" };
  }
  return { direction: "none", text, styleClass: null };
}

export function formatTime(timestamp, lang) {
  return new Date(timestamp).toLocaleString(lang === "fa" ? "fa-IR" : "en-US", {
    month: lang === "fa" ? "long" : "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
