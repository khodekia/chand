// ─── Panel Indicator for Chand Extension ────────────────────────
import GObject  from 'gi://GObject';
import St       from 'gi://St';
import Clutter  from 'gi://Clutter';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {
    CRYPTO_ASSETS,
    CURRENCY_ASSETS,
    GOLD_ASSETS,
    CATEGORIES,
    ALL_ASSETS,
} from './constants.js';

import {
    formatPrice,
    formatChange,
    getChangeStyleClass,
    formatTimestamp,
} from './utils.js';

// ─────────────────────────────────────────────────────────────────
export const ChandIndicator = GObject.registerClass(
    {
        Signals: {
            'refresh-requested':     {},
            'preferences-requested': {},
        },
    },
    class ChandIndicator extends PanelMenu.Button {

        // ── Construction ────────────────────────────────────────
        _init(settings) {
            super._init(0.0, 'Chand');

            this._settings = settings;
            this._prices   = { crypto: {}, currencies: {}, gold: {} };

            // Top-bar container
            this._panelBox = new St.BoxLayout({
                style_class: 'panel-status-menu-box',
            });

            this._panelLabel = new St.Label({
                text:        '💰 …',
                style_class: 'chand-panel-label',
                y_align:     Clutter.ActorAlign.CENTER,
            });

            this._panelBox.add_child(this._panelLabel);
            this.add_child(this._panelBox);

            // Render the dropdown with placeholder data
            this._buildMenu();
        }

        // ── Public API ──────────────────────────────────────────

        /** Called by extension.js whenever new prices arrive. */
        updatePrices(prices) {
            this._prices = prices;
            this._refreshDisplay();
        }

        /** Rebuild panel label + dropdown without re-fetching. */
        refreshDisplay() {
            this._refreshDisplay();
        }

        // ── Internals ───────────────────────────────────────────

        _refreshDisplay() {
            this._updatePanelLabel();
            this._buildMenu();
        }

        _updatePanelLabel() {
            const tickerId = this._settings.get_string('panel-ticker');
            const lang     = this._settings.get_string('language');
            const unit     = this._settings.get_string('display-unit');
            const showChange = this._settings.get_boolean('show-change-indicator');
            const fontFamily = this._settings.get_string('font-family');
            const fontSize = this._settings.get_int('font-size');
            const fontStyle = `font-family: '${fontFamily}'; font-size: ${fontSize}px;`;

            const asset = ALL_ASSETS.find(a => a.id === tickerId);
            if (!asset) {
                this._panelLabel.set_text('💰 …');
                this._panelLabel.style_class = 'chand-panel-label';
                this._panelLabel.set_style(fontStyle);
                return;
            }

            // Look up price data across all categories
            const priceData =
                this._prices.crypto?.[tickerId]     ??
                this._prices.currencies?.[tickerId]  ??
                this._prices.gold?.[tickerId]        ?? null;

            if (!priceData) {
                this._panelLabel.set_text(`${asset.symbol} …`);
                this._panelLabel.style_class = 'chand-panel-label';
                this._panelLabel.set_style(fontStyle);
                return;
            }

            const price     = formatPrice(priceData.price, unit, lang);
            const changeStr = showChange ? formatChange(priceData.change, lang) : '';
            const cls       = getChangeStyleClass(priceData.change);

            this._panelLabel.set_text(`${asset.symbol} ${price}${showChange ? ' ' + changeStr : ''}`);
            this._panelLabel.style_class = `chand-panel-label ${cls}`;
            this._panelLabel.set_style(fontStyle);
        }

        // ── Menu builder ────────────────────────────────────────

        _buildMenu() {
            this.menu.removeAll();

            const lang = this._settings.get_string('language');
            const unit = this._settings.get_string('display-unit');
            const showChange = this._settings.get_boolean('show-change-indicator');
            const fontFamily = this._settings.get_string('font-family');
            const fontSize = this._settings.get_int('font-size');
            const fontStyle = `font-family: '${fontFamily}'; font-size: ${fontSize}px;`;

            const unitLabel = unit === 'toman'
                ? (lang === 'fa' ? 'تومان' : 'Toman')
                : (lang === 'fa' ? 'ریال'  : 'Rial');

            // ── Title ──
            const titleText = lang === 'fa'
                ? `چند — نرخ لحظه‌ای (${unitLabel})`
                : `Chand — Live Prices (${unitLabel})`;

            const titleItem = new PopupMenu.PopupMenuItem(titleText, { reactive: false });
            this.menu.addMenuItem(titleItem);

            // ── Category sections ──
            const visibleAssets = this._settings.get_strv('visible-assets');

            const visibleCurrencies = CURRENCY_ASSETS.filter(a => visibleAssets.includes(a.id));
            if (visibleCurrencies.length > 0)
                this._addSection(CATEGORIES.currencies[lang], visibleCurrencies, this._prices.currencies, lang, unit, showChange, fontStyle);

            const visibleCrypto = CRYPTO_ASSETS.filter(a => visibleAssets.includes(a.id));
            if (visibleCrypto.length > 0)
                this._addSection(CATEGORIES.crypto[lang], visibleCrypto, this._prices.crypto, lang, unit, showChange, fontStyle);

            const visibleGold = GOLD_ASSETS.filter(a => visibleAssets.includes(a.id));
            if (visibleGold.length > 0)
                this._addSection(CATEGORIES.gold[lang], visibleGold, this._prices.gold, lang, unit, showChange, fontStyle);

            // ── Footer ──
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            // Last-updated timestamp
            const timeStr    = formatTimestamp(lang);
            const updateText = lang === 'fa'
                ? `آخرین بروزرسانی: ${timeStr}`
                : `Last update: ${timeStr}`;
            const updateItem = new PopupMenu.PopupMenuItem(updateText, { reactive: false });
            updateItem.label.add_style_class_name('chand-timestamp');
            updateItem.label.set_style(fontStyle);
            this.menu.addMenuItem(updateItem);

            // Action buttons
            this._addFooterButtons(lang, fontStyle);
        }

        _addSection(headerLabel, assets, priceMap, lang, unit, showChange, fontStyle) {
            this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(headerLabel));

            for (const asset of assets) {
                const data = priceMap?.[asset.id];
                const name = lang === 'fa' ? asset.fa : asset.en;

                const item = new PopupMenu.PopupBaseMenuItem({ reactive: false });

                const row = new St.BoxLayout({
                    style_class: 'chand-price-row',
                    x_expand:    true,
                });

                // Name column
                const nameLabel = new St.Label({
                    text:        `${asset.symbol}  ${name}`,
                    style_class: 'chand-price-name',
                    x_expand:    true,
                    x_align:     Clutter.ActorAlign.START,
                    y_align:     Clutter.ActorAlign.CENTER,
                });
                nameLabel.set_style(fontStyle);
                row.add_child(nameLabel);

                if (data && data.price !== null && data.price !== undefined) {
                    // Price column
                    const priceLabel = new St.Label({
                        text:        formatPrice(data.price, unit, lang),
                        style_class: 'chand-price-value',
                        x_align:     Clutter.ActorAlign.END,
                        y_align:     Clutter.ActorAlign.CENTER,
                    });
                    priceLabel.set_style(fontStyle);

                    if (showChange) {
                        // Change column
                        const changeLabel = new St.Label({
                            text:        formatChange(data.change, lang),
                            style_class: `chand-price-change ${getChangeStyleClass(data.change)}`,
                            x_align:     Clutter.ActorAlign.END,
                            y_align:     Clutter.ActorAlign.CENTER,
                        });
                        changeLabel.set_style(fontStyle);

                        row.add_child(priceLabel);
                        row.add_child(changeLabel);
                    } else {
                        row.add_child(priceLabel);
                    }
                } else {
                    // Loading placeholder
                    const dotLabel = new St.Label({
                        text:        '…',
                        style_class: 'chand-price-value chand-loading-text',
                        x_align:     Clutter.ActorAlign.END,
                        y_align:     Clutter.ActorAlign.CENTER,
                    });
                    dotLabel.set_style(fontStyle);
                    row.add_child(dotLabel);
                }

                item.add_child(row);
                this.menu.addMenuItem(item);
            }
        }

        _addFooterButtons(lang, fontStyle) {
            const footerItem = new PopupMenu.PopupBaseMenuItem({ reactive: false });
            const box = new St.BoxLayout({
                x_expand: true,
                x_align:  Clutter.ActorAlign.CENTER,
                style:    'spacing: 8px;',
            });

            // Refresh
            const refreshBtn = new St.Button({
                label:       lang === 'fa' ? '🔄 بروزرسانی' : '🔄 Refresh',
                style_class: 'chand-footer-btn',
                can_focus:   true,
            });
            refreshBtn.set_style(fontStyle);
            refreshBtn.connect('clicked', () => {
                this.emit('refresh-requested');
            });

            // Settings
            const settingsBtn = new St.Button({
                label:       lang === 'fa' ? '⚙ تنظیمات' : '⚙ Settings',
                style_class: 'chand-footer-btn',
                can_focus:   true,
            });
            settingsBtn.set_style(fontStyle);
            settingsBtn.connect('clicked', () => {
                this.emit('preferences-requested');
                this.menu.close();
            });

            box.add_child(refreshBtn);
            box.add_child(settingsBtn);
            footerItem.add_child(box);
            this.menu.addMenuItem(footerItem);
        }
    },
);
