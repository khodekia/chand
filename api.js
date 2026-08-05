// ─── API Client for Chand Extension ─────────────────────────────
//
// Data sources:
//   • Nobitex  — crypto prices in Iranian Rial (POST, no auth)
//   • TGJU     — fiat & gold prices in Toman   (GET, no auth)
//
import Soup from 'gi://Soup';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import {
    NOBITEX_API_URL,
    CHAND_API_URL,
    CRYPTO_ASSETS,
    CURRENCY_ASSETS,
    GOLD_ASSETS,
} from './constants.js';

export class ApiClient {
    constructor() {
        this._session = new Soup.Session({ timeout: 30 });
        this._cacheFile = Gio.File.new_for_path(
            GLib.build_filenamev([GLib.get_user_cache_dir(), 'chand-prices.json'])
        );
        this._loadCache();
    }

    _loadCache() {
        this._lastPrices = {};
        this._lastChanges = {};
        this._cacheFile.load_contents_async(null, (file, result) => {
            try {
                const [, contents] = file.load_contents_finish(result);
                if (contents) {
                    const data = JSON.parse(new TextDecoder('utf-8').decode(contents));
                    this._lastPrices = data.lastPrices || {};
                    this._lastChanges = data.lastChanges || {};
                }
            } catch (e) {
                // Ignored (e.g., file does not exist on first run)
            }
        });
    }

    _saveCache() {
        try {
            const data = JSON.stringify({
                lastPrices: this._lastPrices,
                lastChanges: this._lastChanges
            });
            const bytes = new GLib.Bytes(new TextEncoder().encode(data));
            this._cacheFile.replace_contents_bytes_async(
                bytes,
                null,
                false,
                Gio.FileCreateFlags.REPLACE_DESTINATION,
                null,
                (file, result) => {
                    try {
                        file.replace_contents_finish(result);
                    } catch (e) {
                        console.error(`[Chand] Error saving cache: ${e.message}`);
                    }
                }
            );
        } catch (e) {
            console.error(`[Chand] Error saving cache: ${e.message}`);
        }
    }

    // ── Generic HTTP helpers ────────────────────────────────────

    /**
     * Perform an HTTP GET and return parsed JSON.
     */
    _get(url) {
        return new Promise((resolve, reject) => {
            const message = Soup.Message.new('GET', url);
            if (!message) {
                reject(new Error(`Invalid URL: ${url}`));
                return;
            }

            this._session.send_and_read_async(
                message,
                GLib.PRIORITY_DEFAULT,
                null,
                (session, result) => {
                    try {
                        const bytes = session.send_and_read_finish(result);
                        if (message.get_status() !== 200) {
                            reject(new Error(`HTTP ${message.get_status()} from ${url}`));
                            return;
                        }
                        const text = new TextDecoder('utf-8').decode(bytes.get_data());
                        resolve(JSON.parse(text));
                    } catch (e) {
                        reject(e);
                    }
                },
            );
        });
    }

    /**
     * Perform an HTTP POST with a form-urlencoded body and return parsed JSON.
     */
    _post(url, body) {
        return new Promise((resolve, reject) => {
            const message = Soup.Message.new('POST', url);
            if (!message) {
                reject(new Error(`Invalid URL: ${url}`));
                return;
            }

            const encoded = new TextEncoder().encode(body);
            message.set_request_body_from_bytes(
                'application/x-www-form-urlencoded',
                new GLib.Bytes(encoded),
            );

            this._session.send_and_read_async(
                message,
                GLib.PRIORITY_DEFAULT,
                null,
                (session, result) => {
                    try {
                        const bytes = session.send_and_read_finish(result);
                        if (message.get_status() !== 200) {
                            reject(new Error(`HTTP ${message.get_status()} from ${url}`));
                            return;
                        }
                        const text = new TextDecoder('utf-8').decode(bytes.get_data());
                        resolve(JSON.parse(text));
                    } catch (e) {
                        reject(e);
                    }
                },
            );
        });
    }

    // ── Source-specific fetchers ─────────────────────────────────

    /**
     * Fetch crypto prices from Nobitex (in Rial).
     */
    fetchCryptoPrices() {
        const src = CRYPTO_ASSETS.map(a => a.id).join(',');
        return this._post(NOBITEX_API_URL, `srcCurrency=${src}&dstCurrency=rls`)
            .then(data => {
                if (data.status !== 'ok') return {};
                const prices = {};
                for (const asset of CRYPTO_ASSETS) {
                    const stat = data.stats?.[asset.pair];
                    if (stat) {
                        prices[asset.id] = {
                            price:  parseFloat(stat.latest)    || 0,
                            change: parseFloat(stat.dayChange) || 0,
                        };
                    }
                }
                return prices;
            })
            .catch(e => {
                console.error(`[Chand] Nobitex API error: ${e.message}`);
                return {};
            });
    }

    /**
     * Fetch all fiat and gold prices from custom Cloudflare API (proxying Bonbast).
     */
    fetchBonbastPrices() {
        console.debug('[Chand] Fetching Custom API prices...');
        return this._get(CHAND_API_URL)
            .then(data => {
                const currencies = {};
                const gold = {};

                const parsePrice = (str, id) => {
                    if (!str) return 0;
                    const val = parseFloat(str.toString().replace(/,/g, ''));
                    // Ounce is in USD, so we shouldn't multiply by 10 (Toman to Rial)
                    if (id === 'ounce') return val;
                    return val * 10;
                };

                const processAsset = (asset, targetObj) => {
                    const priceStr = data[asset.slug];
                    if (priceStr) {
                        const newPrice = parsePrice(priceStr, asset.id);
                        let change = 0;
                        
                        if (this._lastPrices[asset.id]) {
                            const oldPrice = this._lastPrices[asset.id];
                            if (newPrice !== oldPrice) {
                                change = ((newPrice - oldPrice) / oldPrice) * 100;
                                this._lastChanges[asset.id] = change;
                            } else {
                                change = this._lastChanges[asset.id] || 0;
                            }
                        } else {
                            this._lastChanges[asset.id] = 0;
                        }
                        
                        this._lastPrices[asset.id] = newPrice;
                        targetObj[asset.id] = { price: newPrice, change };
                    }
                };

                for (const asset of CURRENCY_ASSETS) {
                    processAsset(asset, currencies);
                }
                for (const asset of GOLD_ASSETS) {
                    processAsset(asset, gold);
                }

                this._saveCache();
                return { currencies, gold };
            })
            .catch(e => {
                console.error(`[Chand] Custom API error: ${e.message}`);
                return { currencies: {}, gold: {} };
            });
    }

    // ── Aggregate fetcher ───────────────────────────────────────

    /**
     * Fetch crypto, currency, and gold prices in parallel.
     * Returns { crypto, currencies, gold }.
     */
    fetchAllPrices() {
        return Promise.all([
            this.fetchCryptoPrices(),
            this.fetchBonbastPrices(),
        ]).then(([crypto, bonbast]) => ({
            crypto,
            currencies: bonbast.currencies || {},
            gold: bonbast.gold || {}
        }));
    }

    // ── Cleanup ─────────────────────────────────────────────────

    destroy() {
        if (this._session) {
            this._session.abort();
            this._session = null;
        }
    }
}