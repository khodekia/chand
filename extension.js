// ─── Chand — Main Extension Entry Point ─────────────────────────
import GLib from 'gi://GLib';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { ChandIndicator } from './indicator.js';
import { ApiClient }      from './api.js';

export default class ChandExtension extends Extension {
    _indicator       = null;
    _api             = null;
    _timeoutId       = null;
    _settingsHandlers = [];

    // ── Lifecycle ───────────────────────────────────────────────

    enable() {
        this._settings = this.getSettings();
        this._api      = new ApiClient();

        // Create and register the panel indicator
        this._indicator = new ChandIndicator(this._settings);
        Main.panel.addToStatusArea(this.uuid, this._indicator);

        // Wire indicator signals
        this._indicator.connect('refresh-requested', () => {
            this._fetchPrices();
        });
        this._indicator.connect('preferences-requested', () => {
            this.openPreferences();
        });

        // React to settings changes that affect display only
        const displayKeys = [
            'language', 'display-unit', 'panel-ticker',
            'visible-assets', 'show-change-indicator', 
            'font-family', 'font-size',
        ];
        for (const key of displayKeys) {
            const hid = this._settings.connect(`changed::${key}`, () => {
                this._indicator.refreshDisplay();
            });
            this._settingsHandlers.push(hid);
        }

        // React to interval change by restarting the timer
        const intHid = this._settings.connect('changed::update-interval', () => {
            this._restartTimer();
        });
        this._settingsHandlers.push(intHid);

        // Start periodic fetching and do an immediate first fetch
        this._startTimer();
        this._fetchPrices();
    }

    disable() {
        this._stopTimer();

        // Disconnect all settings handlers
        for (const hid of this._settingsHandlers) {
            this._settings.disconnect(hid);
        }
        this._settingsHandlers = [];

        // Tear down indicator
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }

        // Tear down API client
        if (this._api) {
            this._api.destroy();
            this._api = null;
        }

        this._settings = null;
    }

    // ── Price fetching ──────────────────────────────────────────

    _fetchPrices() {
        if (!this._api) return;

        this._api.fetchAllPrices()
            .then(prices => {
                if (this._indicator) {
                    this._indicator.updatePrices(prices);
                }
            })
            .catch(e => {
                console.error(`[Chand] Failed to fetch prices: ${e.message}`);
            });
    }

    // ── Timer management ────────────────────────────────────────

    _startTimer() {
        const interval = this._settings.get_int('update-interval');
        this._timeoutId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            interval,
            () => {
                this._fetchPrices();
                return GLib.SOURCE_CONTINUE;
            },
        );
    }

    _stopTimer() {
        if (this._timeoutId) {
            GLib.Source.remove(this._timeoutId);
            this._timeoutId = null;
        }
    }

    _restartTimer() {
        this._stopTimer();
        this._startTimer();
    }
}
