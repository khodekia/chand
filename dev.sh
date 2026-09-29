#!/usr/bin/env bash
# Development helper for the Chand extension. Run `./dev.sh help` for usage.
set -euo pipefail

cd "$(dirname "$(readlink -f "$0")")"

UUID=$(grep -oP '"uuid"\s*:\s*"\K[^"]+' metadata.json)
ZIP="dist/$UUID.shell-extension.zip"
SHELL_MAJOR=$(gnome-shell --version | grep -oP '\d+' | head -1)

pack() {
  mkdir -p dist
  gnome-extensions pack --force --out-dir=dist \
    --extra-source=api.js \
    --extra-source=constants.js \
    --extra-source=indicator.js \
    --extra-source=menuBuilder.js \
    --extra-source=utils.js
  echo "Packed $ZIP"
}

install() {
  pack
  gnome-extensions install --force "$ZIP"
  echo "Installed $UUID."
  echo "On Wayland, log out and back in to load new code, or use './dev.sh nested'."
}

# A throwaway GNOME Shell in a window, with its own D-Bus session.
nested() {
  local flag=--nested
  if ((SHELL_MAJOR >= 49)); then
    flag=--devkit
    # Without the devkit viewer the shell still starts, just with no window.
    if [[ ! -x /usr/lib/mutter-devkit && ! -x /usr/libexec/mutter-devkit ]]; then
      echo "GNOME $SHELL_MAJOR needs the mutter-devkit package for a nested shell." >&2
      echo "Install it (e.g. 'sudo pacman -S mutter-devkit') and try again." >&2
      exit 1
    fi
  fi
  install
  MUTTER_DEBUG_DUMMY_MODE_SPECS=${MUTTER_DEBUG_DUMMY_MODE_SPECS:-1600x900} \
    dbus-run-session -- bash -c "
      gnome-shell $flag --wayland &
      sleep 4
      gnome-extensions enable '$UUID'
      wait
    "
}

case "${1:-help}" in
  pack) pack ;;
  install) install ;;
  nested) nested ;;
  prefs) gnome-extensions prefs "$UUID" ;;
  logs) journalctl --user -f -o cat _COMM=gnome-shell _COMM=gjs ;;
  *)
    cat <<USAGE
Usage: ./dev.sh <command>

  pack     Build $ZIP
  install  Pack and install for the current user
  nested   Install, then run a nested GNOME Shell with the extension enabled
  prefs    Open the preferences window
  logs     Follow GNOME Shell and preferences logs
USAGE
    ;;
esac
