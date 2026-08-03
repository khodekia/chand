// ─── API Endpoints ───────────────────────────────────────────────
export const NOBITEX_API_URL = 'https://apiv2.nobitex.ir/market/stats';
export const CHAND_API_URL   = 'https://api.chand.nirvanatech.ir/';

// ─── Crypto Assets (Nobitex — priced in Rial) ───────────────────
export const CRYPTO_ASSETS = [
    { id: 'btc',  pair: 'btc-rls',  en: 'Bitcoin',       fa: 'بیت‌کوین',      symbol: '₿' },
    { id: 'eth',  pair: 'eth-rls',  en: 'Ethereum',      fa: 'اتریوم',        symbol: 'Ξ' },
    { id: 'usdt', pair: 'usdt-rls', en: 'Tether (USDT)', fa: 'تتر',           symbol: '₮' },
    { id: 'doge', pair: 'doge-rls', en: 'Dogecoin',      fa: 'دوج‌کوین',      symbol: 'Ð' },
    { id: 'xrp',  pair: 'xrp-rls',  en: 'Ripple (XRP)',  fa: 'ریپل',          symbol: '✕' },
    { id: 'sol',  pair: 'sol-rls',  en: 'Solana',        fa: 'سولانا',        symbol: '◎' },
    { id: 'bnb',  pair: 'bnb-rls',  en: 'BNB',           fa: 'بایننس کوین',   symbol: '◆' },
];

// ─── Fiat Currencies (Bonbast API) ──────────────────────────────
export const CURRENCY_ASSETS = [
    { id: 'usd', slug: 'usd1', symbol: '$', en: 'US Dollar', fa: 'دلار آمریکا' },
    { id: 'eur', slug: 'eur1', symbol: '€', en: 'Euro', fa: 'یورو' },
    { id: 'gbp', slug: 'gbp1', symbol: '£', en: 'British Pound', fa: 'پوند انگلیس' },
    { id: 'cad', slug: 'cad1', symbol: 'C$', en: 'Canadian Dollar', fa: 'دلار کانادا' },
    { id: 'aud', slug: 'aud1', symbol: 'A$', en: 'Australian Dollar', fa: 'دلار استرالیا' },
    { id: 'chf', slug: 'chf1', symbol: 'CHF', en: 'Swiss Franc', fa: 'فرانک سوئیس' },
    { id: 'aed', slug: 'aed1', symbol: 'د.إ', en: 'UAE Dirham', fa: 'درهم امارات' },
    { id: 'try', slug: 'try1', symbol: '₺', en: 'Turkish Lira', fa: 'لیر ترکیه' },
    { id: 'cny', slug: 'cny1', symbol: '¥', en: 'Chinese Yuan', fa: 'یوان چین' },
    { id: 'jpy', slug: 'jpy1', symbol: '¥', en: 'Japanese Yen', fa: 'ین ژاپن' },
    { id: 'rub', slug: 'rub1', symbol: '₽', en: 'Russian Ruble', fa: 'روبل روسیه' },
    { id: 'inr', slug: 'inr1', symbol: '₹', en: 'Indian Rupee', fa: 'روپیه هند' },
    { id: 'sek', slug: 'sek1', symbol: 'kr', en: 'Swedish Krona', fa: 'کرون سوئد' },
    { id: 'nok', slug: 'nok1', symbol: 'kr', en: 'Norwegian Krone', fa: 'کرون نروژ' },
    { id: 'dkk', slug: 'dkk1', symbol: 'kr', en: 'Danish Krone', fa: 'کرون دانمارک' },
    { id: 'afn', slug: 'afn1', symbol: '؋', en: 'Afghan Afghani', fa: 'افغانی افغانستان' },
    { id: 'iqd', slug: 'iqd1', symbol: 'ع.د', en: 'Iraqi Dinar', fa: 'دینار عراق' },
    { id: 'kwd', slug: 'kwd1', symbol: 'د.ك', en: 'Kuwaiti Dinar', fa: 'دینار کویت' },
    { id: 'sar', slug: 'sar1', symbol: 'ر.س', en: 'Saudi Riyal', fa: 'ریال عربستان' },
    { id: 'bhd', slug: 'bhd1', symbol: '.د.ب', en: 'Bahraini Dinar', fa: 'دینار بحرین' },
    { id: 'omr', slug: 'omr1', symbol: 'ر.ع.', en: 'Omani Rial', fa: 'ریال عمان' },
    { id: 'qar', slug: 'qar1', symbol: 'ر.ق', en: 'Qatari Riyal', fa: 'ریال قطر' },
    { id: 'amd', slug: 'amd1', symbol: '֏', en: 'Armenian Dram', fa: 'درام ارمنستان' },
    { id: 'azn', slug: 'azn1', symbol: '₼', en: 'Azerbaijani Manat', fa: 'منات آذربایجان' },
    { id: 'myr', slug: 'myr1', symbol: 'RM', en: 'Malaysian Ringgit', fa: 'رینگیت مالزی' },
    { id: 'sgd', slug: 'sgd1', symbol: 'S$', en: 'Singapore Dollar', fa: 'دلار سنگاپور' },
    { id: 'hkd', slug: 'hkd1', symbol: 'HK$', en: 'Hong Kong Dollar', fa: 'دلار هنگ کنگ' },
    { id: 'thb', slug: 'thb1', symbol: '฿', en: 'Thai Baht', fa: 'بات تایلند' }
];

// ─── Gold & Coin Assets (Bonbast — priced in Toman) ────────────
export const GOLD_ASSETS = [
    { id: 'gold18', slug: 'gol18',  en: '18K Gold (gram)',  fa: 'طلای ۱۸ عیار (گرم)',  symbol: '✦' },
    { id: 'ounce',  slug: 'ounce',  en: 'Gold Ounce',       fa: 'انس طلا',              symbol: '▪' },
    { id: 'emami',  slug: 'emami1', en: 'Emami Coin',       fa: 'سکه امامی',            symbol: '●' },
    { id: 'azadi',  slug: 'azadi1', en: 'Bahar Azadi',      fa: 'سکه بهار آزادی',       symbol: '○' },
];

// ─── Category Labels ────────────────────────────────────────────
export const CATEGORIES = {
    currencies: { en: '💱 Currencies',       fa: '💱 ارزها' },
    crypto:     { en: '₿ Cryptocurrencies',  fa: '₿ رمزارزها' },
    gold:       { en: '🪙 Gold & Coins',     fa: '🪙 طلا و سکه' },
};

// ─── Aggregated asset list (for panel ticker lookup) ────────────
export const ALL_ASSETS = [
    ...CRYPTO_ASSETS,
    ...CURRENCY_ASSETS,
    ...GOLD_ASSETS,
];

// ─── Preference helpers ─────────────────────────────────────────
export const INTERVAL_OPTIONS = [
    { value: 60,   en: '1 minute',   fa: '۱ دقیقه' },
    { value: 120,  en: '2 minutes',  fa: '۲ دقیقه' },
    { value: 300,  en: '5 minutes',  fa: '۵ دقیقه' },
    { value: 600,  en: '10 minutes', fa: '۱۰ دقیقه' },
    { value: 900,  en: '15 minutes', fa: '۱۵ دقیقه' },
    { value: 1800, en: '30 minutes', fa: '۳۰ دقیقه' },
];
