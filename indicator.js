import Clutter from "gi://Clutter";
import GObject from "gi://GObject";
import St from "gi://St";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import {
  ALL_SYMBOLS,
  CHANGE_ICONS,
  MIN_VIEWPORT_WIDTH,
  SPEED_MAP,
  UI_STRINGS,
} from "./constants.js";
import { MenuBuilder } from "./menuBuilder.js";
import { formatChange, formatValue } from "./utils.js";

// Settings that change how the ticker scrolls, but not what it shows.
const MARQUEE_KEYS = ["marquee-speed", "max-width"];

const ChandIndicator = GObject.registerClass(
  class ChandIndicator extends PanelMenu.Button {
    _init(settings, extension) {
      super._init(0.0, "Chand");
      this._settings = settings;
      this._snapshot = null;
      this._tickerItems = null;
      this._tickerKey = null;
      this._marquee = null;

      this._initTicker();

      this._menuBuilder = new MenuBuilder(settings, extension);
      this._menuBuilder.build(this.menu);
      this.menu.actor.add_style_class_name("chand-menu");

      this._settings.connectObject(
        "changed",
        (_settings, key) => this._onSettingChanged(key),
        this,
      );
      // Hold the ticker still while the pointer is over it, so it can be read.
      this.connect("notify::hover", () => this._syncMarqueePaused());
      // Also runs when the shell shuts down, which destroys the panel without
      // disabling extensions; stopping here keeps the ticker's timeline from
      // drawing into widgets that are already gone.
      this.connect("destroy", () => this._stopMarquee());
    }

    destroy() {
      this._stopMarquee();
      super.destroy();
    }

    _initTicker() {
      this._viewport = new St.Bin({
        clip_to_allocation: true,
        style_class: "chand-viewport",
      });

      this._track = new St.Widget({
        layout_manager: new Clutter.FixedLayout(),
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
      });

      this._viewport.set_child(this._track);
      this.add_child(this._viewport);
    }

    setRates(snapshot) {
      this._snapshot = snapshot;
      this._render();
    }

    setStatus(status) {
      this._menuBuilder.setStatus(status);
    }

    _getLang() {
      return this._settings.get_string("language") === "fa" ? "fa" : "en";
    }

    _onSettingChanged(key) {
      if (key === "language" || key === "display-unit") {
        this._menuBuilder.updateLanguage();
        this._render();
      } else if (key === "panel-symbols") {
        this._menuBuilder.syncChecks();
        this._render();
      } else if (key === "show-change-indicator") {
        this._render();
      } else if (MARQUEE_KEYS.includes(key)) {
        this._layoutTicker();
      } else if (key === "show-last-updated") {
        this._menuBuilder.updateStatus();
      }
    }

    _render() {
      const lang = this._getLang();
      const unit = this._settings.get_string("display-unit");
      const inPanel = new Set(this._settings.get_strv("panel-symbols"));
      const showChange = this._settings.get_boolean("show-change-indicator");
      const items = [];

      for (const symbol of ALL_SYMBOLS) {
        const rate = this._snapshot?.rates[symbol.id];
        if (!rate) {
          this._menuBuilder.setValue(symbol.id, null, null);
          continue;
        }

        const value = formatValue(symbol, rate.value, unit, lang);
        const change = formatChange(rate.change, lang);
        this._menuBuilder.setValue(symbol.id, value, change);

        if (inPanel.has(symbol.id)) {
          items.push({
            text: `${symbol.shortLabels[lang]} ${value}`,
            change: showChange ? change : null,
          });
        }
      }

      this._menuBuilder.setLastUpdated(this._snapshot?.updated);

      if (!items.length) {
        items.push({ text: UI_STRINGS[lang].appName, change: null });
      }

      // Restarting the marquee on every refresh would make it jump back to
      // the start, so only lay out again when what it shows has changed.
      const key = JSON.stringify([lang, items]);
      if (key !== this._tickerKey) {
        this._tickerKey = key;
        this._tickerItems = items;
        this._layoutTicker();
      }
    }

    // One copy of the ticker content. `withGap` adds the space that
    // separates the end of one copy from the start of the next.
    _buildRow(withGap) {
      const row = new St.BoxLayout({
        style_class: "chand-ticker-row",
        y_align: Clutter.ActorAlign.CENTER,
      });

      this._tickerItems.forEach(({ text, change }, index) => {
        if (index > 0) {
          row.add_child(new St.Widget({
            style_class: "chand-ticker-separator",
            y_align: Clutter.ActorAlign.CENTER,
          }));
        }

        row.add_child(new St.Label({
          text,
          y_align: Clutter.ActorAlign.CENTER,
        }));

        if (change) {
          const changeBox = new St.BoxLayout({
            style_class: `chand-ticker-change ${change.styleClass ?? ""}`,
            y_align: Clutter.ActorAlign.CENTER,
          });
          const iconName = CHANGE_ICONS[change.direction];
          if (iconName) {
            changeBox.add_child(new St.Icon({
              icon_name: iconName,
              style_class: "chand-change-icon",
              y_align: Clutter.ActorAlign.CENTER,
            }));
          }
          changeBox.add_child(new St.Label({
            text: change.text,
            y_align: Clutter.ActorAlign.CENTER,
          }));
          row.add_child(changeBox);
        }
      });

      if (withGap) {
        row.add_child(new St.Widget({ style_class: "chand-ticker-gap" }));
      }

      // Persian rows run right to left, first rate on the right.
      row.set_text_direction(
        this._getLang() === "fa"
          ? Clutter.TextDirection.RTL
          : Clutter.TextDirection.LTR,
      );
      return row;
    }

    _layoutTicker() {
      if (!this._tickerItems) return;

      this._stopMarquee();
      this._track.translation_x = 0;
      this._track.destroy_all_children();

      const { scale_factor: scale } = St.ThemeContext.get_for_stage(
        global.stage,
      );
      const maxWidth = this._settings.get_int("max-width") * scale;
      // The viewport's width includes its CSS padding, so add that on top of
      // the room the ticker needs, or its end gets clipped.
      const padding = Math.ceil(
        this._viewport.get_theme_node().get_horizontal_padding(),
      );

      const row = this._buildRow(false);
      this._track.add_child(row);
      const [, rowWidth] = row.get_preferred_width(-1);

      if (rowWidth <= maxWidth) {
        const contentWidth = Math.ceil(
          Math.max(MIN_VIEWPORT_WIDTH * scale, rowWidth),
        );
        // Centered, for short content such as the app name.
        row.set_position(Math.floor((contentWidth - rowWidth) / 2), 0);
        this._viewport.width = contentWidth + padding;
        return;
      }

      row.destroy();
      const rowA = this._buildRow(true);
      const rowB = this._buildRow(true);
      this._track.add_child(rowA);
      this._track.add_child(rowB);

      // Whole pixels keep the loop seamless and the text sharp while moving.
      const unitWidth = Math.ceil(rowA.get_preferred_width(-1)[1]);
      this._viewport.width = maxWidth + padding;

      // Persian reads right to left, so its ticker enters from the left edge
      // and moves right; English enters from the right and moves left.
      const rtl = this._getLang() === "fa";
      rowA.set_position(0, 0);
      rowB.set_position(rtl ? -unitWidth : unitWidth, 0);

      const speedKey = this._settings.get_string("marquee-speed");
      const speed = (SPEED_MAP[speedKey] ?? SPEED_MAP.medium) * scale;
      const from = rtl ? maxWidth - unitWidth : 0;
      const distance = rtl ? unitWidth : -unitWidth;

      this._track.translation_x = from;
      this._startMarquee(from, distance, speed);
    }

    // Driven by a timeline on the stage's frame clock instead of a GLib
    // timer, so it moves in step with the display.
    _startMarquee(from, distance, pixelsPerSecond) {
      this._marquee = new Clutter.Timeline({
        actor: this._track,
        duration: Math.round((Math.abs(distance) / pixelsPerSecond) * 1000),
        repeat_count: -1,
      });
      this._marqueeFrameId = this._marquee.connect("new-frame", (timeline) => {
        const x = Math.round(from + distance * timeline.get_progress());
        if (x !== this._track.translation_x) this._track.translation_x = x;
      });
      this._syncMarqueePaused();
    }

    _stopMarquee() {
      if (!this._marquee) return;
      this._marquee.disconnect(this._marqueeFrameId);
      this._marquee.stop();
      this._marquee = null;
    }

    _syncMarqueePaused() {
      if (!this._marquee) return;
      if (this.hover) this._marquee.pause();
      else this._marquee.start();
    }
  },
);

export default ChandIndicator;
