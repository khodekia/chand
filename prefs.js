// ─── Chand — Preferences Window ─────────────────────────────────
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import { 
    ALL_ASSETS, 
    INTERVAL_OPTIONS, 
    CURRENCY_ASSETS, 
    CRYPTO_ASSETS, 
    GOLD_ASSETS 
} from './constants.js';

export default class ChandPreferences extends ExtensionPreferences {

    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        // ─── General Page ───────────────────────────────────────
        const page = new Adw.PreferencesPage({
            title:     'General',
            icon_name: 'preferences-system-symbolic',
        });

        // ── Display Settings ────────────────────────────────────
        const displayGroup = new Adw.PreferencesGroup({
            title:       'Display Settings — تنظیمات نمایش',
            description: 'Configure language, unit, and update frequency.',
        });

        // Language
        const langModel = new Gtk.StringList();
        langModel.append('فارسی (Persian)');
        langModel.append('English');

        const langRow = new Adw.ComboRow({
            title:    'Language — زبان',
            subtitle: 'Display language for the extension UI',
            model:    langModel,
        });

        const LANG_MAP = ['fa', 'en'];
        langRow.set_selected(Math.max(0, LANG_MAP.indexOf(settings.get_string('language'))));
        langRow.connect('notify::selected', () => {
            settings.set_string('language', LANG_MAP[langRow.selected]);
        });
        displayGroup.add(langRow);

        // Display unit
        const unitModel = new Gtk.StringList();
        unitModel.append('تومان (Toman)');
        unitModel.append('ریال (Rial)');

        const unitRow = new Adw.ComboRow({
            title:    'Display Unit — واحد نمایش',
            subtitle: 'How prices are displayed',
            model:    unitModel,
        });

        const UNIT_MAP = ['toman', 'rial'];
        unitRow.set_selected(Math.max(0, UNIT_MAP.indexOf(settings.get_string('display-unit'))));
        unitRow.connect('notify::selected', () => {
            settings.set_string('display-unit', UNIT_MAP[unitRow.selected]);
        });
        displayGroup.add(unitRow);

        // Update interval
        const intervalModel = new Gtk.StringList();
        for (const opt of INTERVAL_OPTIONS) {
            intervalModel.append(`${opt.en}  —  ${opt.fa}`);
        }

        const intervalRow = new Adw.ComboRow({
            title:    'Update Interval — بازه بروزرسانی',
            subtitle: 'How often prices are refreshed',
            model:    intervalModel,
        });

        const currentInterval = settings.get_int('update-interval');
        const intervalIdx     = INTERVAL_OPTIONS.findIndex(o => o.value === currentInterval);
        intervalRow.set_selected(Math.max(0, intervalIdx));
        intervalRow.connect('notify::selected', () => {
            settings.set_int('update-interval', INTERVAL_OPTIONS[intervalRow.selected].value);
        });
        displayGroup.add(intervalRow);

        page.add(displayGroup);

        // ── Panel Indicator ─────────────────────────────────────
        const panelGroup = new Adw.PreferencesGroup({
            title:       'Panel Indicator — نمایش در نوار بالا',
            description: 'Choose which price appears in the GNOME top panel.',
        });

        const tickerModel = new Gtk.StringList();
        for (const asset of ALL_ASSETS) {
            tickerModel.append(`${asset.symbol}  ${asset.en}  —  ${asset.fa}`);
        }

        const tickerRow = new Adw.ComboRow({
            title:    'Panel Price — قیمت نوار بالا',
            subtitle: 'The asset shown directly on the top bar',
            model:    tickerModel,
        });

        const currentTicker = settings.get_string('panel-ticker');
        const tickerIdx     = ALL_ASSETS.findIndex(a => a.id === currentTicker);
        tickerRow.set_selected(Math.max(0, tickerIdx));
        tickerRow.connect('notify::selected', () => {
            settings.set_string('panel-ticker', ALL_ASSETS[tickerRow.selected].id);
        });
        panelGroup.add(tickerRow);

        page.add(panelGroup);

        // ── Add General page to window ──────────────────────────
        window.add(page);

        // ─── Assets Page ────────────────────────────────────────
        const assetsPage = new Adw.PreferencesPage({
            title:     'Assets',
            icon_name: 'view-list-symbolic',
        });

        const createAssetGroup = (title, description, assetList) => {
            const group = new Adw.PreferencesGroup({
                title:       title,
                description: description,
            });

            const visibleAssets = settings.get_strv('visible-assets');

            for (const asset of assetList) {
                const switchRow = new Adw.SwitchRow({
                    title:    `${asset.symbol ? asset.symbol + '  ' : ''}${asset.en} — ${asset.fa}`,
                    subtitle: asset.id.toUpperCase(),
                    active:   visibleAssets.includes(asset.id)
                });
                
                switchRow.connect('notify::active', () => {
                    const currentAssets = settings.get_strv('visible-assets');
                    if (switchRow.active) {
                        if (!currentAssets.includes(asset.id)) {
                            currentAssets.push(asset.id);
                        }
                    } else {
                        const idx = currentAssets.indexOf(asset.id);
                        if (idx > -1) {
                            currentAssets.splice(idx, 1);
                        }
                    }
                    settings.set_strv('visible-assets', currentAssets);
                });
                
                group.add(switchRow);
            }
            return group;
        };

        assetsPage.add(createAssetGroup('💱 Currencies — ارزها', 'Select which fiat currencies to display.', CURRENCY_ASSETS));
        assetsPage.add(createAssetGroup('₿ Cryptocurrencies — رمزارزها', 'Select which cryptocurrencies to display.', CRYPTO_ASSETS));
        assetsPage.add(createAssetGroup('🪙 Gold & Coins — طلا و سکه', 'Select which gold and coin assets to display.', GOLD_ASSETS));

        window.add(assetsPage);

        // ── Appearance Settings ───────────────────────────────────
        const appearanceGroup = new Adw.PreferencesGroup({
            title:       'Appearance — ظاهر',
            description: 'Configure font, change indicator, and other visual options.',
        });

        // Show change indicator
        const changeIndicatorSwitch = new Adw.SwitchRow({
            title:    'Show Change Indicator — نمایش نشانگر تغییر',
            subtitle: 'Display ▲/▼ arrows and percentage change',
        });
        settings.bind('show-change-indicator', changeIndicatorSwitch, 'active', Gio.SettingsBindFlags.DEFAULT);
        appearanceGroup.add(changeIndicatorSwitch);

        // Font family
        const fontModel = new Gtk.StringList();
        const fontOptions = [
            'Cantarell',
            'Noto Sans',
            'Noto Sans Arabic',
            'DejaVu Sans',
            'Liberation Sans',
            'Monospace',
            'Sans',
            'Serif',
        ];
        for (const font of fontOptions) {
            fontModel.append(font);
        }

        const fontRow = new Adw.ComboRow({
            title:    'Font Family — فونت',
            subtitle: 'Font family for price display',
            model:    fontModel,
        });

        const currentFont = settings.get_string('font-family');
        const fontIdx = fontOptions.indexOf(currentFont);
        fontRow.set_selected(Math.max(0, fontIdx));
        fontRow.connect('notify::selected', () => {
            settings.set_string('font-family', fontOptions[fontRow.selected]);
        });
        appearanceGroup.add(fontRow);

        // Font size
        const fontSizeRow = new Adw.SpinRow({
            title:    'Font Size — اندازه فونت',
            subtitle: 'Font size in pixels for price display',
            adjustment: new Gtk.Adjustment({
                lower: 8,
                upper: 24,
                step_increment: 1,
                page_increment: 2,
            }),
        });
        fontSizeRow.set_value(settings.get_int('font-size'));
        fontSizeRow.connect('notify::value', () => {
            settings.set_int('font-size', Math.round(fontSizeRow.get_value()));
        });
        appearanceGroup.add(fontSizeRow);

        page.add(appearanceGroup);

    }
}
