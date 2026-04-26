// js/importer.js

export const Importer = {
    parseCSV: (text, accountId) => {
        const lines = text.split('\n');
        const transactions = [];
        
        // Expected format: Date,Ticker,Type,Qty,Price
        // Example: 2025-01-01,BBCA,BUY,10,9500
        lines.forEach(line => {
            const parts = line.split(',').map(p => p.trim());
            if (parts.length >= 5) {
                const [date, ticker, type, qty, price] = parts;
                if (date && ticker && type) {
                    transactions.push({
                        date,
                        accountId,
                        emiten: ticker.toUpperCase(),
                        type: type.toUpperCase(),
                        quantity: parseInt(qty) * 100, // lot to shares
                        price: parseFloat(price)
                    });
                }
            }
        });
        return transactions;
    },

    processOCR: async (imageFile, broker, onProgress) => {
        const { createWorker } = Tesseract;
        const worker = await createWorker('eng', 1, {
            logger: m => {
                if (m.status === 'recognizing text') {
                    onProgress(Math.floor(m.progress * 100));
                }
            }
        });

        const ret = await worker.recognize(imageFile);
        const text = ret.data.text;
        await worker.terminate();

        console.log("OCR Raw Text:", text);
        return Importer.parseTextToTransactions(text, broker);
    },

    parseTextToTransactions: (text, broker) => {
        const lines = text.split('\n');
        const result = [];
        
        // Simple heuristic based patterns for common brokers
        // This is a "best effort" parser.
        lines.forEach(line => {
            // Regex to find potential ticker (4 uppercase letters) and numbers
            const tickerMatch = line.match(/\b[A-Z]{4}\b/);
            const numbers = line.match(/\b\d+([,.]\d+)*\b/g);

            if (tickerMatch && numbers && numbers.length >= 2) {
                const ticker = tickerMatch[0];
                // Try to find quantity and price
                // Usually quantity comes before price or is a smaller number
                // This will need refine for specific brokers
                let qty = 0;
                let price = 0;

                // Heuristic: Price is usually > 50, Qty is usually smaller or in lots
                const vals = numbers.map(n => parseFloat(n.replace(/[,.]/g, '')));
                
                // Very basic heuristic for now
                if (vals.length >= 2) {
                    // Assuming last large number is price, and one before is qty
                    price = vals[vals.length - 1];
                    qty = vals[vals.length - 2];
                }

                if (qty > 0 && price > 0) {
                    result.push({
                        emiten: ticker,
                        quantity: qty, // Note: usually in lots in apps? Or shares? Most apps show lots
                        price: price,
                        type: line.toUpperCase().includes('SELL') || line.toUpperCase().includes('JUAL') ? 'SELL' : 'BUY'
                    });
                }
            }
        });

        return result;
    }
};
