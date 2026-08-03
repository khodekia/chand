import { ApiClient } from './api.js';

async function main() {
    const api = new ApiClient();
    try {
        console.log("Fetching all prices first time...");
        let prices = await api.fetchAllPrices();
        console.log("Currencies (1):", JSON.stringify(prices.currencies.usd).substring(0, 80));
        
        console.log("Fetching all prices second time...");
        prices = await api.fetchAllPrices();
        console.log("Currencies (2):", JSON.stringify(prices.currencies.usd).substring(0, 80));
    } catch (e) {
        console.error(e);
    }
}
await main();
