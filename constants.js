export const API_URL = "https://api.chand.nirvanatech.ir/";
export const SUPPORT_URL = "https://khodekia.github.io/support";

// Pixel sizes are logical; they get multiplied by the display scale factor.
export const MIN_VIEWPORT_WIDTH = 50;

// After a network failure, try again sooner than the regular interval.
export const RETRY_SECONDS = 60;

export const CHANGE_ICONS = {
  up: "go-up-symbolic",
  down: "go-down-symbolic",
};

// Pixels per second.
export const SPEED_MAP = Object.freeze({ slow: 10, medium: 25, fast: 55 });

export const LANGUAGES = [
  ["en", "English"],
  ["fa", "پارسی"],
];

// `key` is the field in the API response. `kind` says what the number is:
// "toman" prices can be shown in Rial too, "usd" prices are US dollars and
// "index" is a plain index value.
function symbol(id, key, kind, en, enShort, fa, faShort = fa) {
  return {
    id,
    key,
    kind,
    labels: { en, fa },
    shortLabels: { en: enShort, fa: faShort },
  };
}

// The API uses the sell rate ("1" suffix) for currencies.
function currency(code, en, fa, faShort) {
  return symbol(code, `${code}1`, "toman", en, code.toUpperCase(), fa, faShort);
}

export const SYMBOL_GROUPS = [
  {
    id: "currency",
    labels: { en: "Currencies", fa: "ارزها" },
    symbols: [
      currency("usd", "US Dollar", "دلار آمریکا", "دلار"),
      currency("eur", "Euro", "یورو"),
      currency("gbp", "British Pound", "پوند انگلیس", "پوند"),
      currency("cad", "Canadian Dollar", "دلار کانادا"),
      currency("aud", "Australian Dollar", "دلار استرالیا"),
      currency("chf", "Swiss Franc", "فرانک سوئیس"),
      currency("aed", "UAE Dirham", "درهم امارات", "درهم"),
      currency("try", "Turkish Lira", "لیر ترکیه", "لیر"),
      currency("cny", "Chinese Yuan", "یوان چین", "یوان"),
      currency("jpy", "Japanese Yen (10)", "ین ژاپن (۱۰)"),
      currency("rub", "Russian Ruble", "روبل روسیه", "روبل"),
      currency("inr", "Indian Rupee", "روپیه هند", "روپیه"),
      currency("sek", "Swedish Krona", "کرون سوئد"),
      currency("nok", "Norwegian Krone", "کرون نروژ"),
      currency("dkk", "Danish Krone", "کرون دانمارک"),
      currency("afn", "Afghan Afghani", "افغانی"),
      currency("iqd", "Iraqi Dinar (100)", "دینار عراق (۱۰۰)"),
      currency("kwd", "Kuwaiti Dinar", "دینار کویت"),
      currency("sar", "Saudi Riyal", "ریال عربستان"),
      currency("bhd", "Bahraini Dinar", "دینار بحرین"),
      currency("omr", "Omani Rial", "ریال عمان"),
      currency("qar", "Qatari Riyal", "ریال قطر"),
      currency("amd", "Armenian Dram (10)", "درام ارمنستان (۱۰)"),
      currency("azn", "Azerbaijani Manat", "منات آذربایجان"),
      currency("myr", "Malaysian Ringgit", "رینگیت مالزی"),
      currency("sgd", "Singapore Dollar", "دلار سنگاپور"),
      currency("hkd", "Hong Kong Dollar", "دلار هنگ کنگ"),
      currency("thb", "Thai Baht", "بات تایلند"),
    ],
  },
  {
    id: "gold",
    labels: { en: "Gold & Coins", fa: "طلا و سکه" },
    symbols: [
      symbol("gold18", "gol18", "toman", "18K Gold (gram)", "18K Gold",
        "طلای ۱۸ عیار (گرم)", "طلا ۱۸"),
      symbol("mithqal", "mithqal", "toman", "Gold Mithqal", "Mithqal",
        "مثقال طلا", "مثقال"),
      symbol("ounce", "ounce", "usd", "Gold Ounce", "Ounce",
        "انس طلا", "انس"),
      symbol("emami", "emami1", "toman", "Emami Coin", "Emami",
        "سکه امامی", "امامی"),
      symbol("azadi", "azadi1", "toman", "Bahar Azadi Coin", "Azadi",
        "سکه بهار آزادی", "بهار آزادی"),
      symbol("half-coin", "azadi1_2", "toman", "Half Coin", "Half Coin",
        "نیم سکه"),
      symbol("quarter-coin", "azadi1_4", "toman", "Quarter Coin",
        "Quarter Coin", "ربع سکه"),
      symbol("gram-coin", "azadi1g", "toman", "1g Coin", "1g Coin",
        "سکه گرمی"),
    ],
  },
  {
    id: "other",
    labels: { en: "Other", fa: "سایر" },
    symbols: [
      symbol("bitcoin", "bitcoin", "usd", "Bitcoin", "BTC", "بیت‌کوین"),
      symbol("bourse", "bourse", "index", "Tehran Stock Exchange Index",
        "TSE", "شاخص بورس تهران", "بورس"),
    ],
  },
];

export const ALL_SYMBOLS = SYMBOL_GROUPS.flatMap((group) => group.symbols);

export const PREFS_STRINGS = {
  en: {
    pageTitle: "Chand",
    generalGroup: "General",
    panelGroup: "Top bar",
    languageTitle: "Language",
    unitTitle: "Unit",
    unitSubtitle: "Currency, gold and coin prices",
    toman: "Toman",
    rial: "Rial",
    intervalTitle: "Refresh interval",
    intervalSubtitle: "How often to fetch new rates",
    lastUpdatedTitle: "Show last updated time",
    lastUpdatedSubtitle: "Display when the rates were last updated, in the menu",
    positionTitle: "Position",
    positionSubtitle: "Where the rates sit in the top bar",
    left: "Left",
    center: "Center",
    right: "Right",
    maxWidthTitle: "Maximum width",
    maxWidthSubtitle: "Text wider than this scrolls",
    changeTitle: "Show change in top bar",
    changeSubtitle: "Display the direction and percentage of the latest move next to each rate",
    speedTitle: "Scroll speed",
    aboutGroup: "About",
    aboutRow: "Rates in the top bar",
    aboutSubtitle: "Tick the ones you want from the top bar menu.",
    sourceRow: "Source code",
    supportRow: "Support Chand",
    slow: "Slow",
    medium: "Medium",
    fast: "Fast",
    minute1: "1 minute",
    minutes2: "2 minutes",
    minutes5: "5 minutes",
    minutes10: "10 minutes",
    minutes15: "15 minutes",
    minutes30: "30 minutes",
    hour1: "1 hour",
  },
  fa: {
    pageTitle: "چند",
    generalGroup: "تنظیمات عمومی",
    panelGroup: "نوار بالا",
    languageTitle: "زبان",
    unitTitle: "واحد",
    unitSubtitle: "واحد قیمت ارز، طلا و سکه",
    toman: "تومان",
    rial: "ریال",
    intervalTitle: "فاصله بروزرسانی",
    intervalSubtitle: "هر چند وقت یک‌بار نرخ‌ها بروزرسانی شوند",
    lastUpdatedTitle: "نمایش زمان آخرین بروزرسانی",
    lastUpdatedSubtitle: "نمایش زمان آخرین بروزرسانی نرخ‌ها در منو",
    positionTitle: "مکان",
    positionSubtitle: "جای نمایش نرخ‌ها در نوار بالا",
    left: "چپ",
    center: "وسط",
    right: "راست",
    maxWidthTitle: "حداکثر عرض",
    maxWidthSubtitle: "متن پهن‌تر از این اسکرول می‌شود",
    changeTitle: "نمایش تغییرات در نوار بالا",
    changeSubtitle: "نمایش جهت و درصد آخرین تغییر کنار هر نرخ",
    speedTitle: "سرعت اسکرول",
    aboutGroup: "درباره",
    aboutRow: "نرخ‌های نوار بالا",
    aboutSubtitle: "نرخ‌های دلخواه را از منوی نوار بالا تیک بزنید.",
    sourceRow: "کد منبع",
    supportRow: "حمایت از چند",
    slow: "آهسته",
    medium: "متوسط",
    fast: "سریع",
    minute1: "۱ دقیقه",
    minutes2: "۲ دقیقه",
    minutes5: "۵ دقیقه",
    minutes10: "۱۰ دقیقه",
    minutes15: "۱۵ دقیقه",
    minutes30: "۳۰ دقیقه",
    hour1: "۱ ساعت",
  },
};

export const UI_STRINGS = {
  en: {
    appName: "Chand",
    pricesIn: "Prices in",
    toman: "Toman",
    rial: "Rial",
    language: "Language",
    lastUpdatedPrefix: "Last updated",
    lastUpdatedPlaceholder: "Last updated: --",
    updating: "Updating…",
    updateFailed: "Couldn't update rates",
    settings: "Settings",
    refresh: "Refresh",
    sourceCode: "Source code",
  },
  fa: {
    appName: "چند",
    pricesIn: "قیمت‌ها به",
    toman: "تومان",
    rial: "ریال",
    language: "زبان",
    lastUpdatedPrefix: "آخرین بروزرسانی",
    lastUpdatedPlaceholder: "آخرین بروزرسانی: --",
    updating: "در حال بروزرسانی…",
    updateFailed: "بروزرسانی نرخ‌ها ناموفق بود",
    settings: "تنظیمات",
    refresh: "بروزرسانی",
    sourceCode: "کد منبع",
  },
};
