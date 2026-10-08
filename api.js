import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Soup from "gi://Soup";
import { ALL_SYMBOLS, API_URL } from "./constants.js";

Gio._promisify(Soup.Session.prototype, "send_and_read_async");
Gio._promisify(Gio.File.prototype, "load_contents_async");
Gio._promisify(
  Gio.File.prototype,
  "replace_contents_bytes_async",
  "replace_contents_finish",
);
Gio._promisify(Gio.File.prototype, "delete_async");

export class HttpError extends Error {
  constructor(status, reason, code = null) {
    super(reason ? `HTTP ${status} (${reason})` : `HTTP ${status}`);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

// The API refuses some regions with 451, or 403 and code "region_blocked".
export function isRegionBlocked(error) {
  if (!(error instanceof HttpError)) return false;
  return error.status === 451 ||
    (error.status === 403 && error.code === "region_blocked");
}

export function isCancelled(error) {
  return error instanceof GLib.Error &&
    error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED);
}

function parseNumber(raw) {
  if (raw === undefined || raw === null) return null;
  const value = Number(String(raw).replace(/,/g, ""));
  return Number.isFinite(value) && value > 0 ? value : null;
}

// A snapshot is { updated, rates: { [symbolId]: { value, change } } }. The
// API only reports current prices, so `change` is the percentage move since
// the previous different value seen, carried over while the price holds.
function buildSnapshot(json, previous) {
  const rates = {};

  for (const symbol of ALL_SYMBOLS) {
    const value = parseNumber(json?.[symbol.key]);
    if (value === null) continue;

    const before = previous?.rates?.[symbol.id];
    let change = before?.change ?? null;
    if (before && before.value !== value) {
      change = ((value - before.value) / before.value) * 100;
    }
    rates[symbol.id] = { value, change };
  }

  if (!Object.keys(rates).length) {
    throw new Error("Response has no known rates");
  }

  const updated = Date.parse(json.timestamp);
  return { updated: Number.isFinite(updated) ? updated : Date.now(), rates };
}

export class RatesClient {
  constructor(userAgent) {
    this._session = new Soup.Session({ timeout: 20, user_agent: userAgent });
    this._cancellable = new Gio.Cancellable();
    this._snapshot = null;
    this._cacheDir = GLib.build_filenamev([GLib.get_user_cache_dir(), "chand"]);
    this._cacheFile = Gio.File.new_for_path(
      GLib.build_filenamev([this._cacheDir, "rates.json"]),
    );
  }

  // Resolves to the last good snapshot, or null if there is none.
  async loadCache() {
    try {
      const [bytes] = await this._cacheFile.load_contents_async(
        this._cancellable,
      );
      const snapshot = JSON.parse(new TextDecoder().decode(bytes));
      if (typeof snapshot?.rates !== "object" || snapshot.rates === null) {
        throw new Error("Unexpected cache format");
      }
      this._snapshot ??= snapshot;
      return snapshot;
    } catch (e) {
      const missing = e instanceof GLib.Error &&
        e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND);
      if (!missing && !isCancelled(e)) {
        console.warn(`Chand: ignoring unreadable cache: ${e.message}`);
      }
      return null;
    }
  }

  async fetch() {
    const message = Soup.Message.new("GET", API_URL);
    const bytes = await this._session.send_and_read_async(
      message,
      GLib.PRIORITY_DEFAULT,
      this._cancellable,
    );
    const text = new TextDecoder().decode(bytes.get_data() ?? new Uint8Array());
    // Not get_status(): it throws for codes missing from the Soup.Status enum.
    const status = message.status_code;

    if (status !== Soup.Status.OK) {
      let reason = message.get_reason_phrase();
      let code = null;
      try {
        const body = JSON.parse(text);
        reason = body.error || reason;
        code = body.code ?? null;
      } catch {
        // Not JSON; keep the reason phrase.
      }
      const error = new HttpError(status, reason, code);
      // Rates from before the block shouldn't keep showing, now or after a
      // restart.
      if (isRegionBlocked(error)) this._clearCache();
      throw error;
    }

    this._snapshot = buildSnapshot(JSON.parse(text), this._snapshot);
    this._saveCache(this._snapshot);
    return this._snapshot;
  }

  async _saveCache(snapshot) {
    try {
      GLib.mkdir_with_parents(this._cacheDir, 0o700);
      await this._cacheFile.replace_contents_bytes_async(
        new GLib.Bytes(new TextEncoder().encode(JSON.stringify(snapshot))),
        null,
        false,
        Gio.FileCreateFlags.REPLACE_DESTINATION,
        this._cancellable,
      );
    } catch (e) {
      if (!isCancelled(e)) {
        console.warn(`Chand: couldn't write cache: ${e.message}`);
      }
    }
  }

  async _clearCache() {
    this._snapshot = null;
    try {
      await this._cacheFile.delete_async(
        GLib.PRIORITY_DEFAULT,
        this._cancellable,
      );
    } catch (e) {
      const missing = e instanceof GLib.Error &&
        e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.NOT_FOUND);
      if (!missing && !isCancelled(e)) {
        console.warn(`Chand: couldn't delete cache: ${e.message}`);
      }
    }
  }

  destroy() {
    this._cancellable.cancel();
    this._session.abort();
    this._session = null;
  }
}
