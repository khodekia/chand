<div align="center">
  <img src="chand-logo-512.png" alt="Chand Logo" width="256" />
  <h1>Chand (چند)</h1>
  <p>Live Iranian market rates in Toman or Rial, right in your GNOME top bar.</p>
</div>

---

**Chand** (Persian for "How much?") is a GNOME Shell extension that keeps you updated on the latest Iranian market prices: currencies, gold, coins and more.

## ✨ Features
- **Several rates at once**: Tick any rates in the top bar menu to show them together. Text wider than the top bar space scrolls, and pauses while you hover over it.
- **What you can track**:
  - US dollar and 27 other currencies
  - 18K gold, mithqal and gold ounce
  - Emami, Bahar Azadi, half, quarter and 1g coins
  - Bitcoin and the Tehran Stock Exchange index
- **Price changes**: An ▲/▼ arrow and the percentage move next to each rate.
- **Persian or English**: The menu and settings switch to a right-to-left layout in Persian, with Persian digits and dates.
- **Toman or Rial**: Pick the unit for currency, gold and coin prices.
- **Customizable top bar**: Choose the position (left, center or right), maximum width, separator, and scroll speed and style.
- **Works offline**: The last rates are kept, so they show right away after a restart or while you're offline.

## 💻 Compatibility
- **GNOME Shell**: 49, 50

## 📦 Installation

### From GNOME Extensions (Recommended)
The easiest way to install Chand is directly from the official GNOME Extensions website.
[Gnome Extensions Page](https://extensions.gnome.org/extension/10618/chand/)

### Manual Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/khodekia/chand.git
   ```
2. Build and install the extension:
   ```bash
   cd chand
   ./dev.sh install
   ```
3. Log out and log back in.
4. Enable the extension using the **Extensions** app.

### Development
`./dev.sh` has a few helpers:
- `pack` builds the zip into `dist/`
- `install` packs and installs it for your user
- `nested` runs a nested GNOME Shell with the extension enabled
- `prefs` opens the settings window
- `logs` follows the GNOME Shell logs

## ⚙️ Configuration
- **Rates in the top bar**: Open Chand's menu in the top bar and tick the ones you want.
- **Everything else**: Language, unit, refresh interval and the top bar options are in the **Extensions** app. Click the settings icon next to Chand, or the gear button in Chand's menu.

## 🔒 Data
Chand only connects to `api.chand.nirvanatech.ir` to fetch rates. It sends no personal data. The latest rates are cached in `~/.cache/chand/`.

## ❤️ Support & Donations
If you find this extension useful and want to support its continued development, please consider making a donation! It helps me dedicate more time to maintaining and improving the project.

👉 **[Support Chand Development](https://khodekia.github.io/support)**

All major cryptocurrencies (BTC, ETH, DOGE, LTC, BCH, TON) are accepted.

## 📝 License
This project is open-source and available under the terms of the GPL-3.0 License.
