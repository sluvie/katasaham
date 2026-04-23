// js/priceFetcher.js
// Fetches prices from Google Sheets (CSV) or other sources

export const PriceFetcher = {
    fetchFromGS: async (url) => {
        if (!url) return null;
        try {
            // Ensure the URL is for CSV export
            let csvUrl = url;
            if (url.includes('/edit')) {
                csvUrl = url.replace(/\/edit.*$/, '/export?format=csv');
            } else if (url.includes('docs.google.com/spreadsheets') && !url.includes('output=csv')) {
                csvUrl += (url.includes('?') ? '&' : '?') + 'output=csv';
            }

            const response = await fetch(csvUrl);
            const text = await response.text();
            return PriceFetcher.parseCSV(text);
        } catch (error) {
            console.error('Error fetching prices:', error);
            return null;
        }
    },

    parseCSV: (text) => {
        const lines = text.split('\n');
        const priceMap = {}; // Ticker -> Price
        lines.forEach(line => {
            const [ticker, price] = line.split(',').map(s => s.trim());
            if (ticker && !isNaN(parseFloat(price))) {
                priceMap[ticker.toUpperCase()] = parseFloat(price);
            }
        });
        return priceMap;
    }
};
