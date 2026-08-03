// ─── Persian digit mapping ──────────────────────────────────────
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Convert Latin digits (0-9) to Persian digits (۰-۹).
 */
export function toPersianDigits(str) {
    return String(str).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[parseInt(d)]);
}

/**
 * Format a number with thousand-separator commas.
 * Returns Persian digits when lang === 'fa'.
 */
export function formatNumber(num, lang = 'fa') {
    if (num === null || num === undefined || isNaN(num)) return '—';

    const intPart = Math.floor(Math.abs(num)).toString();
    const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const result = num < 0 ? `-${withCommas}` : withCommas;

    return lang === 'fa' ? toPersianDigits(result) : result;
}

/**
 * Format a price stored in Rial.
 * If unit === 'toman', divides by 10 first.
 */
export function formatPrice(priceInRial, unit = 'toman', lang = 'fa') {
    if (priceInRial === null || priceInRial === undefined) return '—';
    let price = parseFloat(priceInRial);
    if (isNaN(price)) return '—';

    if (unit === 'toman') {
        price = Math.round(price / 10);
    }
    return formatNumber(price, lang);
}

/**
 * Format a 24-hour change percentage with a directional arrow.
 *   +1.23  →  "▲ 1.23%"
 *   -0.50  →  "▼ 0.50%"
 *    0.00  →  "■ 0.00%"
 */
export function formatChange(changePercent, lang = 'fa') {
    if (changePercent === null || changePercent === undefined) return '';
    const change = parseFloat(changePercent);
    if (isNaN(change)) return '';

    const arrow    = change > 0 ? '▲' : change < 0 ? '▼' : '■';
    const absVal   = Math.abs(change).toFixed(2);
    const formatted = lang === 'fa' ? toPersianDigits(absVal) : absVal;

    return `${arrow} ${formatted}%`;
}

/**
 * Return the CSS style class name that corresponds to a price direction.
 */
export function getChangeStyleClass(changePercent) {
    const change = parseFloat(changePercent);
    if (isNaN(change) || change === 0) return 'chand-neutral';
    return change > 0 ? 'chand-up' : 'chand-down';
}

/**
 * Parse a TGJU formatted price string (e.g. "615,000") to Rial.
 * TGJU prices are in Toman → multiply by 10 for Rial.
 */
export function parseTgjuPrice(priceStr) {
    if (!priceStr) return null;
    const cleaned = String(priceStr).replace(/,/g, '').trim();
    const num = parseFloat(cleaned);
    if (isNaN(num)) return null;
    return num * 10; // Toman → Rial
}

/**
 * Return a formatted HH:MM timestamp for the current time.
 */
export function formatTimestamp(lang = 'fa') {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${h}:${m}`;
    return lang === 'fa' ? toPersianDigits(timeStr) : timeStr;
}
