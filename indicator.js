import Clutter from "gi://Clutter";
import GObject from "gi://GObject";
import Pango from "gi://Pango";
import St from "gi://St";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import {
  ALL_SYMBOLS,
  MARQUEE_GAP_STYLES,
  MIN_VIEWPORT_WIDTH,
  SPEED_MAP,
  UI_STRINGS,
} from "./constants.js";
import { MenuBuilder } from "./menuBuilder.js";
import { formatChange, formatValue } from "./utils.js";

// Settings that change how the text scrolls, but not the text itself.
const MARQUEE_KEYS = ["marquee-gap-style", "marquee-speed", "max-width"];
const TEXT_KEYS = ["show-change-indicator", "separator"];

const ChandIndicator = GObject.registerClass(
  class ChandIndicator extends PanelMenu.Button {
    _init(settings, extension) {
      super._init(0.0, "Chand");
      this._settings = settings;
      this._snapshot = null;
      this._panelText = null;
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
      // Hold the text still while the pointer is over it, so it can be read.
      this.connect("notify::hover", () => this._syncMarqueePaused());
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

      // Two copies of the text, so the scrolling loop has no visible seam.
      this._labels = [0, 1].map(() => {
        const label = new St.Label({
          y_align: Clutter.ActorAlign.CENTER,
          y_expand: true,
        });
        label.clutter_text.set_line_wrap(false);
        label.clutter_text.set_ellipsize(Pango.EllipsizeMode.NONE);
        this._track.add_child(label);
        return label;
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
      } else if (TEXT_KEYS.includes(key)) {
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
      const parts = [];

      for (const symbol of ALL_SYMBOLS) {
        const rate = this._snapshot?.rates[symbol.id];
        if (!rate) {
          this._menuBuilder.setValue(symbol.id, null, null);
          continue;
        }

        const value = formatValue(symbol, rate.value, unit, lang);
        const change = formatChange(rate.change, lang);
        this._menuBuilder.setValue(symbol.id, value, change);

        if (!inPanel.has(symbol.id)) continue;

        const suffix = showChange && change ? ` ${change.text}` : "";
        parts.push(`${symbol.shortLabels[lang]} ${value}${suffix}`);
      }

      this._menuBuilder.setLastUpdated(this._snapshot?.updated);

      const separator = this._settings.get_string("separator") || "|";
      const text = parts.length
        ? parts.join(`  ${separator}  `)
        : UI_STRINGS[lang].appName;

      // Restarting the marquee on every refresh would make it jump back to
      // the start, so only lay out again when the text actually changed.
      if (text !== this._panelText) {
        this._panelText = text;
        this._layoutTicker();
      }
    }

    _layoutTicker() {
      if (this._panelText === null) return;

      this._stopMarquee();
      this._track.translation_x = 0;

      const [labelA, labelB] = this._labels;
      const { scale_factor: scale } = St.ThemeContext.get_for_stage(
        global.stage,
      );
      const maxWidth = this._settings.get_int("max-width") * scale;

      labelA.text = this._panelText;
      labelA.set_position(0, 0);
      labelB.hide();

      // The viewport's width includes its CSS padding, so add that on top of
      // the room the text needs, or the end of the text gets clipped.
      const padding = Math.ceil(
        this._viewport.get_theme_node().get_horizontal_padding(),
      );

      const [, textWidth] = labelA.get_preferred_width(-1);
      if (textWidth <= maxWidth) {
        const contentWidth = Math.ceil(
          Math.max(MIN_VIEWPORT_WIDTH * scale, textWidth),
        );
        // Centered, for short text such as the app name.
        labelA.set_position(Math.floor((contentWidth - textWidth) / 2), 0);
        this._viewport.width = contentWidth + padding;
        return;
      }

      const gapStyle = this._settings.get_string("marquee-gap-style");
      const gap = MARQUEE_GAP_STYLES[gapStyle] ?? MARQUEE_GAP_STYLES.dot;
      labelA.text = labelB.text = this._panelText + gap;

      // Whole pixels keep the loop seamless and the text sharp while moving.
      const unitWidth = Math.ceil(labelA.get_preferred_width(-1)[1]);
      this._viewport.width = maxWidth + padding;

      // Persian reads right to left, so its text enters from the left edge
      // and moves right; English enters from the right and moves left.
      const rtl = this._getLang() === "fa";
      labelB.set_position(rtl ? -unitWidth : unitWidth, 0);
      labelB.show();

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
