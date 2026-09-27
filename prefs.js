import Adw from "gi://Adw";
import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Gtk from "gi://Gtk";
import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";
import { LANGUAGES, PREFS_STRINGS, SUPPORT_URL } from "./constants.js";

// Gtk.Widget.set_default_direction() would also flip every other window in
// the Extensions app, so set the direction on this window's widgets only.
function setDirection(widget, direction) {
  widget.set_direction(direction);
  let child = widget.get_first_child();
  while (child) {
    setDirection(child, direction);
    child = child.get_next_sibling();
  }
}

export default class ChandPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();
    let page = null;
    let rebuildId = 0;

    const build = () => {
      const lang = settings.get_string("language") === "fa" ? "fa" : "en";
      if (page) window.remove(page);
      page = this._buildPage(settings, PREFS_STRINGS[lang]);
      window.add(page);
      setDirection(
        window,
        lang === "fa" ? Gtk.TextDirection.RTL : Gtk.TextDirection.LTR,
      );
    };
    build();

    // Switch language in place. Deferred, so the language row isn't destroyed
    // from inside its own signal handler.
    const languageChangedId = settings.connect("changed::language", () => {
      if (rebuildId) return;
      rebuildId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
        rebuildId = 0;
        build();
        return GLib.SOURCE_REMOVE;
      });
    });

    window.connect("close-request", () => {
      settings.disconnect(languageChangedId);
      if (rebuildId) GLib.source_remove(rebuildId);
      return false;
    });
  }

  _buildPage(settings, t) {
    const page = new Adw.PreferencesPage({ title: t.pageTitle });

    const generalGroup = new Adw.PreferencesGroup({ title: t.generalGroup });
    page.add(generalGroup);

    generalGroup.add(
      this._buildComboRow(
        settings,
        "language",
        t.languageTitle,
        null,
        LANGUAGES.map(([value, label]) => ({ value, label })),
      ),
    );

    generalGroup.add(
      this._buildComboRow(settings, "display-unit", t.unitTitle, t.unitSubtitle, [
        { value: "toman", label: t.toman },
        { value: "rial", label: t.rial },
      ]),
    );

    generalGroup.add(
      this._buildComboRow(
        settings,
        "update-interval",
        t.intervalTitle,
        t.intervalSubtitle,
        [
          { value: 60, label: t.minute1 },
          { value: 120, label: t.minutes2 },
          { value: 300, label: t.minutes5 },
          { value: 600, label: t.minutes10 },
          { value: 900, label: t.minutes15 },
          { value: 1800, label: t.minutes30 },
          { value: 3600, label: t.hour1 },
        ],
      ),
    );

    generalGroup.add(
      this._buildSwitchRow(
        settings,
        "show-last-updated",
        t.lastUpdatedTitle,
        t.lastUpdatedSubtitle,
      ),
    );

    const panelGroup = new Adw.PreferencesGroup({ title: t.panelGroup });
    page.add(panelGroup);

    panelGroup.add(
      this._buildComboRow(
        settings,
        "panel-position",
        t.positionTitle,
        t.positionSubtitle,
        [
          { value: "left", label: t.left },
          { value: "center", label: t.center },
          { value: "right", label: t.right },
        ],
      ),
    );

    const maxWidthRow = new Adw.SpinRow({
      title: t.maxWidthTitle,
      subtitle: t.maxWidthSubtitle,
      adjustment: new Gtk.Adjustment({
        lower: 80,
        upper: 1000,
        step_increment: 10,
        page_increment: 50,
      }),
    });
    settings.bind(
      "max-width",
      maxWidthRow,
      "value",
      Gio.SettingsBindFlags.DEFAULT,
    );
    panelGroup.add(maxWidthRow);

    panelGroup.add(
      this._buildComboRow(
        settings,
        "separator",
        t.separatorTitle,
        t.separatorSubtitle,
        [
          { value: "|", label: t.pipe },
          { value: "•", label: t.dot },
          { value: "·", label: t.middleDot },
          { value: "-", label: t.dashSymbol },
          { value: "/", label: t.slash },
          { value: " ", label: t.space },
        ],
      ),
    );

    panelGroup.add(
      this._buildSwitchRow(
        settings,
        "show-change-indicator",
        t.changeTitle,
        t.changeSubtitle,
      ),
    );

    panelGroup.add(
      this._buildComboRow(
        settings,
        "marquee-gap-style",
        t.gapTitle,
        t.gapSubtitle,
        [
          { value: "space", label: t.blankSpace },
          { value: "dot", label: t.dot },
          { value: "dash", label: t.dash },
          { value: "star", label: t.star },
          { value: "diamond", label: t.diamond },
        ],
      ),
    );

    panelGroup.add(
      this._buildComboRow(settings, "marquee-speed", t.speedTitle, null, [
        { value: "slow", label: t.slow },
        { value: "medium", label: t.medium },
        { value: "fast", label: t.fast },
      ]),
    );

    const aboutGroup = new Adw.PreferencesGroup({ title: t.aboutGroup });
    page.add(aboutGroup);

    aboutGroup.add(
      new Adw.ActionRow({ title: t.aboutRow, subtitle: t.aboutSubtitle }),
    );
    aboutGroup.add(this._buildLinkRow(t.sourceRow, this.metadata.url));
    aboutGroup.add(this._buildLinkRow(t.supportRow, SUPPORT_URL));

    return page;
  }

  _buildSwitchRow(settings, key, title, subtitle) {
    const row = new Adw.SwitchRow({ title, subtitle });
    settings.bind(key, row, "active", Gio.SettingsBindFlags.DEFAULT);
    return row;
  }

  // Works for both integer and string keys; `choices` holds the values.
  _buildComboRow(settings, key, title, subtitle, choices) {
    const isInt = settings.get_value(key).get_type_string() === "i";
    const read = () =>
      isInt ? settings.get_int(key) : settings.get_string(key);
    const write = (value) =>
      isInt ? settings.set_int(key, value) : settings.set_string(key, value);

    const row = new Adw.ComboRow({
      title,
      subtitle: subtitle ?? "",
      model: Gtk.StringList.new(choices.map((c) => c.label)),
    });

    const currentIndex = choices.findIndex((c) => c.value === read());
    row.selected = Math.max(currentIndex, 0);

    row.connect("notify::selected", () => {
      const choice = choices[row.selected];
      if (choice && choice.value !== read()) write(choice.value);
    });

    return row;
  }

  _buildLinkRow(title, url) {
    const row = new Adw.ActionRow({
      title,
      subtitle: url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      activatable: true,
    });
    row.add_suffix(new Gtk.Image({ icon_name: "adw-external-link-symbolic" }));
    row.connect("activated", () => {
      Gio.AppInfo.launch_default_for_uri(url, null);
    });
    return row;
  }
}
