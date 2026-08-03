#!/bin/bash
# ─── Chand Extension Installer ──────────────────────────────────
set -e

UUID="chand@nirvanatech.ir"
INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🪙 Installing Chand extension..."
echo ""

# Compile GSettings schemas
echo "  → Compiling GSettings schemas..."
glib-compile-schemas "$SCRIPT_DIR/schemas/"

# Create installation directory
mkdir -p "$INSTALL_DIR"

# Copy extension files
echo "  → Copying files to $INSTALL_DIR ..."
cp -f  "$SCRIPT_DIR/metadata.json"  "$INSTALL_DIR/"
cp -f  "$SCRIPT_DIR/extension.js"   "$INSTALL_DIR/"
cp -f  "$SCRIPT_DIR/indicator.js"   "$INSTALL_DIR/"
cp -f  "$SCRIPT_DIR/api.js"         "$INSTALL_DIR/"
cp -f  "$SCRIPT_DIR/constants.js"   "$INSTALL_DIR/"
cp -f  "$SCRIPT_DIR/utils.js"       "$INSTALL_DIR/"
cp -f  "$SCRIPT_DIR/prefs.js"       "$INSTALL_DIR/"
cp -f  "$SCRIPT_DIR/stylesheet.css" "$INSTALL_DIR/"
cp -rf "$SCRIPT_DIR/schemas"        "$INSTALL_DIR/"

echo ""
echo "✅ Chand installed successfully!"
echo ""
echo "Next steps:"
echo "  1. Restart GNOME Shell:"
echo "     • Wayland  → Log out and log back in"
echo "     • X11      → Alt+F2, type 'r', press Enter"
echo "  2. Enable the extension:"
echo "     gnome-extensions enable $UUID"
echo ""
echo "Or use Extension Manager to enable Chand."
