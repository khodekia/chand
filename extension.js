import GLib from "gi://GLib";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import { HttpError, RatesClient } from "./api.js";
import { RETRY_SECONDS } from "./constants.js";
import ChandIndicator from "./indicator.js";

const MIN_INTERVAL_SECONDS = 60;

export default class ChandExtension extends Extension {
  enable() {
    this._settings = this.getSettings();
    this._client = new RatesClient(
      `Chand/${this.metadata.version} (GNOME Shell extension)`,
    );
    this._snapshot = null;
    this._error = null;
    this._fetching = false;

    this._addIndicator();

    this._settings.connectObject(
      "changed::update-interval", () => this._scheduleRefresh(),
      "changed::panel-position", () => this._addIndicator(),
      this,
    );

    // Load the cache before the first fetch, so price changes are measured
    // against the last rates seen before a restart.
    const client = this._client;
    client.loadCache().then((cached) => {
      if (client !== this._client) return;
      if (cached && !this._snapshot) {
        this._snapshot = cached;
        this._indicator.setRates(cached);
      }
      this.refresh();
    });
  }

  disable() {
    this._cancelScheduledRefresh();
    this._settings.disconnectObject(this);
    this._client.destroy();
    this._client = null;
    this._indicator.destroy();
    this._indicator = null;
    this._settings = null;
    this._snapshot = null;
    this._error = null;
  }

  async refresh() {
    if (this._fetching) return;

    this._cancelScheduledRefresh();
    this._fetching = true;
    this._indicator.setStatus({ loading: true, error: this._error });

    const client = this._client;
    let snapshot = null;
    let error = null;
    try {
      snapshot = await client.fetch();
    } catch (e) {
      error = e;
    }

    // Disabled while the request was in flight.
    if (client !== this._client) return;

    this._fetching = false;
    this._error = error;
    if (error) {
      console.warn(`Chand: failed to fetch rates: ${error.message}`);
    } else {
      this._snapshot = snapshot;
      this._indicator.setRates(snapshot);
    }
    this._indicator.setStatus({ loading: false, error });

    // HTTP errors (server trouble) won't clear up in a minute, but a dropped
    // connection often does.
    const retry = error && !(error instanceof HttpError);
    this._scheduleRefresh(retry ? RETRY_SECONDS : undefined);
  }

  _addIndicator() {
    this._indicator?.destroy();
    this._indicator = new ChandIndicator(this._settings, this);

    const box = this._settings.get_string("panel-position");
    // In the left box, go after the Activities button rather than before it.
    const index = box === "left" ? -1 : 0;
    Main.panel.addToStatusArea(this.uuid, this._indicator, index, box);

    // Also with no rates yet, so the button shows the app name, not nothing.
    this._indicator.setRates(this._snapshot);
    this._indicator.setStatus({ loading: this._fetching, error: this._error });
  }

  _scheduleRefresh(seconds) {
    this._cancelScheduledRefresh();

    const intervalSeconds = Math.max(
      MIN_INTERVAL_SECONDS,
      this._settings.get_int("update-interval"),
    );
    this._timeoutId = GLib.timeout_add_seconds(
      GLib.PRIORITY_DEFAULT,
      Math.min(seconds ?? intervalSeconds, intervalSeconds),
      () => {
        this._timeoutId = null;
        this.refresh();
        return GLib.SOURCE_REMOVE;
      },
    );
  }

  _cancelScheduledRefresh() {
    if (this._timeoutId) {
      GLib.source_remove(this._timeoutId);
      this._timeoutId = null;
    }
  }
}
