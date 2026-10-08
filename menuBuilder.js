import Clutter from "gi://Clutter";
import Gio from "gi://Gio";
import St from "gi://St";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import { HttpError, isRegionBlocked } from "./api.js";
import {
  CHANGE_ICONS,
  LANGUAGES,
  SYMBOL_GROUPS,
  UI_STRINGS,
} from "./constants.js";
import { formatTime } from "./utils.js";

export class MenuBuilder {
  constructor(settings, extension) {
    this._settings = settings;
    this._extension = extension;
    this._groupItems = [];
    this._symbolItems = new Map();
    this._langItems = new Map();
    this._footerButtons = [];
    this._updated = null;
    this._status = { loading: false, error: null };
  }

  build(menu) {
    this._menu = menu;
    this._unitItem = new PopupMenu.PopupMenuItem("", {
      reactive: false,
      style_class: "chand-unit",
    });
    menu.addMenuItem(this._unitItem);
    this._buildSymbolGroups(menu);
    menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    this._buildLanguageMenu(menu);
    menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    this._buildStatusItems(menu);
    this._buildFooter(menu);
    this.syncChecks();
    this.updateLanguage();
  }

  _buildSymbolGroups(menu) {
    for (const group of SYMBOL_GROUPS) {
      const submenu = new PopupMenu.PopupSubMenuMenuItem("");
      this._groupItems.push({ submenu, labels: group.labels });

      for (const symbol of group.symbols) {
        submenu.menu.addMenuItem(this._createSymbolItem(symbol));
      }

      menu.addMenuItem(submenu);
    }
  }

  _createSymbolItem({ id, labels }) {
    const menuItem = new PopupMenu.PopupMenuItem("");
    menuItem.label.x_expand = true;

    const valueLabel = new St.Label({
      y_align: Clutter.ActorAlign.CENTER,
      style_class: "chand-item-value",
    });
    const changeBox = new St.BoxLayout({
      y_align: Clutter.ActorAlign.CENTER,
      style_class: "chand-item-change",
    });
    const changeIcon = new St.Icon({
      y_align: Clutter.ActorAlign.CENTER,
      style_class: "chand-change-icon",
      visible: false,
    });
    const changeLabel = new St.Label({ y_align: Clutter.ActorAlign.CENTER });
    changeBox.add_child(changeIcon);
    changeBox.add_child(changeLabel);
    menuItem.add_child(valueLabel);
    menuItem.add_child(changeBox);

    // Toggle without closing the menu, so several rates can be picked.
    menuItem.activate = () => {
      const ids = this._settings.get_strv("panel-symbols");
      this._settings.set_strv(
        "panel-symbols",
        ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id],
      );
    };

    this._symbolItems.set(id, {
      menuItem,
      labels,
      valueLabel,
      changeBox,
      changeIcon,
      changeLabel,
    });
    return menuItem;
  }

  // Ticks the rates that are shown in the top bar.
  syncChecks() {
    const inPanel = new Set(this._settings.get_strv("panel-symbols"));
    for (const [id, { menuItem }] of this._symbolItems) {
      menuItem.setOrnament(
        inPanel.has(id) ? PopupMenu.Ornament.CHECK : PopupMenu.Ornament.NONE,
      );
    }
  }

  _buildLanguageMenu(menu) {
    this._langSubMenu = new PopupMenu.PopupSubMenuMenuItem("");

    for (const [code, name] of LANGUAGES) {
      const langItem = new PopupMenu.PopupMenuItem(name);
      langItem.activate = () => this._settings.set_string("language", code);
      this._langSubMenu.menu.addMenuItem(langItem);
      this._langItems.set(code, langItem);
    }

    menu.addMenuItem(this._langSubMenu);
  }

  _buildStatusItems(menu) {
    this._lastUpdateItem = new PopupMenu.PopupMenuItem("", {
      reactive: false,
    });
    this._errorItem = new PopupMenu.PopupMenuItem("", {
      reactive: false,
      style_class: "chand-error",
    });
    menu.addMenuItem(this._lastUpdateItem);
    menu.addMenuItem(this._errorItem);
  }

  _buildFooter(menu) {
    const footerRow = new PopupMenu.PopupBaseMenuItem({
      reactive: false,
      can_focus: false,
    });

    const launch = (uri) => {
      Gio.AppInfo.launch_default_for_uri(
        uri,
        global.create_app_launch_context(0, -1),
      );
    };

    const buttons = [
      ["settings", "preferences-system-symbolic", () => {
        this._extension.openPreferences();
        menu.close();
      }],
      // Leaves the menu open so the "Updating…" status is visible.
      ["refresh", "view-refresh-symbolic", () => this._extension.refresh()],
      ["sourceCode", "web-browser-symbolic", () => {
        launch(this._extension.metadata.url);
        menu.close();
      }],
    ];

    footerRow.add_child(new St.Widget({ x_expand: true }));
    for (const [stringKey, iconName, onClick] of buttons) {
      const button = new St.Button({
        style_class: "icon-button chand-footer-button",
        can_focus: true,
        child: new St.Icon({ icon_name: iconName }),
      });
      button.connect("clicked", onClick);
      this._footerButtons.push({ button, stringKey });
      footerRow.add_child(button);
      footerRow.add_child(new St.Widget({ x_expand: true }));
    }

    menu.addMenuItem(footerRow);
  }

  _getLang() {
    return this._settings.get_string("language") === "fa" ? "fa" : "en";
  }

  updateLanguage() {
    const lang = this._getLang();
    const strings = UI_STRINGS[lang];
    const rtl = lang === "fa";

    // Only the contents: flipping the whole menu would also make it open
    // toward the other side of the indicator, unlike the rest of the shell.
    this._menu.box.set_text_direction(
      rtl ? Clutter.TextDirection.RTL : Clutter.TextDirection.LTR,
    );
    // The shell picks submenu arrows from the global text direction, so they
    // point the wrong way when this menu's direction differs from it.
    const globalRtl =
      Clutter.get_default_text_direction() === Clutter.TextDirection.RTL;
    const submenus = [
      ...this._groupItems.map(({ submenu }) => submenu),
      this._langSubMenu,
    ];
    for (const submenu of submenus) {
      if (submenu._triangle) {
        submenu._triangle.icon_name =
          rtl === globalRtl ? "pan-end-symbolic" : "pan-start-symbolic";
      }
    }

    const unit = this._settings.get_string("display-unit");
    this._unitItem.label.text =
      `${strings.pricesIn} ${unit === "rial" ? strings.rial : strings.toman}`;

    for (const { submenu, labels } of this._groupItems) {
      submenu.label.text = labels[lang];
    }
    for (const { menuItem, labels } of this._symbolItems.values()) {
      menuItem.label.text = labels[lang];
    }

    this._langSubMenu.label.text = strings.language;
    for (const [code, item] of this._langItems) {
      item.setOrnament(
        code === lang ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE,
      );
    }

    for (const { button, stringKey } of this._footerButtons) {
      button.accessible_name = strings[stringKey];
    }

    this.updateStatus();
  }

  setValue(id, text, change) {
    const widgets = this._symbolItems.get(id);
    if (!widgets) return;

    widgets.valueLabel.text = text ?? "";
    widgets.changeLabel.text = change?.text ?? "";

    const iconName = CHANGE_ICONS[change?.direction];
    widgets.changeIcon.visible = Boolean(iconName);
    if (iconName) widgets.changeIcon.icon_name = iconName;

    widgets.changeBox.style_class = change?.styleClass
      ? `chand-item-change ${change.styleClass}`
      : "chand-item-change";
  }

  setLastUpdated(timestamp) {
    this._updated = timestamp ?? null;
    this.updateStatus();
  }

  setStatus({ loading, error }) {
    this._status = { loading, error };
    this.updateStatus();
  }

  updateStatus() {
    const lang = this._getLang();
    const strings = UI_STRINGS[lang];
    const { loading, error } = this._status;

    let text = strings.lastUpdatedPlaceholder;
    if (loading) {
      text = strings.updating;
    } else if (this._updated) {
      text = `${strings.lastUpdatedPrefix}: ${formatTime(this._updated, lang)}`;
    }
    this._lastUpdateItem.label.text = text;
    this._lastUpdateItem.visible =
      loading || this._settings.get_boolean("show-last-updated");

    // The full error goes to the journal; the menu only needs the gist.
    this._errorItem.visible = Boolean(error) && !loading;
    if (isRegionBlocked(error)) {
      this._errorItem.label.text = strings.regionBlocked;
    } else if (error instanceof HttpError) {
      this._errorItem.label.text =
        `${strings.updateFailed} (HTTP ${error.status})`;
    } else {
      this._errorItem.label.text = strings.updateFailed;
    }
  }
}
