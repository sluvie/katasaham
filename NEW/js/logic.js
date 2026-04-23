// js/logic.js
// core calculations for KataSaham

export const Logic = {
    getEffectiveFee: (date, feeSettings) => {
        const txDate = new Date(date);
        return feeSettings.find(fee => {
            const from = new Date(fee.effectiveFrom);
            const to = fee.effectiveTo ? new Date(fee.effectiveTo) : new Date('2099-12-31');
            return txDate >= from && txDate <= to;
        }) || feeSettings[0];
    },

    processPortfolio: (transactions, feeSettings, dividends = [], filterYear = 'all') => {
        const portfolio = {}; // ticker -> { qty, avgPrice, totalCost, realizedProfit, dividends }
        const yearlyReports = {}; // year -> { realizedProfit, turnover, dividends }

        // Sort by date to process chronologically
        const sortedTx = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

        sortedTx.forEach(tx => {
            const year = new Date(tx.date).getFullYear().toString();
            if (!yearlyReports[year]) {
                yearlyReports[year] = { realizedProfit: 0, turnover: 0, dividends: 0 };
            }

            const monthYear = `${year}-${(new Date(tx.date).getMonth() + 1).toString().padStart(2, '0')}`;
            if (!yearlyReports[year].monthly) yearlyReports[year].monthly = {};
            if (!yearlyReports[year].monthly[monthYear]) {
                yearlyReports[year].monthly[monthYear] = { realizedProfit: 0, turnover: 0, dividends: 0 };
            }

            if (!portfolio[tx.emiten]) {
                portfolio[tx.emiten] = { qty: 0, avgPrice: 0, totalCost: 0, realizedProfit: 0, dividends: 0 };
            }

            const p = portfolio[tx.emiten];
            const fees = Logic.getEffectiveFee(tx.date, feeSettings);
            const feeRate = tx.type === 'BUY' ? fees.buyFee : fees.sellFee;
            const feeValue = (tx.price * tx.quantity) * (feeRate / 100);

            if (tx.type === 'BUY') {
                const cost = (tx.price * tx.quantity) + feeValue;
                p.avgPrice = (p.totalCost + cost) / (p.qty + tx.quantity);
                p.qty += tx.quantity;
                p.totalCost += cost;
            } else {
                const revenue = (tx.price * tx.quantity) - feeValue;
                const costBasis = p.avgPrice * tx.quantity;
                const profit = revenue - costBasis;
                
                p.qty -= tx.quantity;
                p.totalCost -= costBasis;
                p.realizedProfit += profit;
                
                yearlyReports[year].realizedProfit += profit;
                yearlyReports[year].monthly[monthYear].realizedProfit += profit;
            }
            
            yearlyReports[year].turnover += (tx.price * tx.quantity);
            yearlyReports[year].monthly[monthYear].turnover += (tx.price * tx.quantity);
        });

        // Add Dividends
        dividends.forEach(div => {
            const year = new Date(div.cumDate).getFullYear().toString();
            if (!yearlyReports[year]) yearlyReports[year] = { realizedProfit: 0, turnover: 0, dividends: 0 };
            
            if (portfolio[div.emiten]) {
                portfolio[div.emiten].dividends += div.totalReceived;
                portfolio[div.emiten].realizedProfit += div.totalReceived;
                yearlyReports[year].dividends += div.totalReceived;
                yearlyReports[year].realizedProfit += div.totalReceived;
            }
        });

        return { portfolio, yearlyReports };
    },

    simulateDCA: (currentAvg, currentQty, marketPrice, buyQty) => {
        const currentCost = currentAvg * currentQty;
        const newCost = marketPrice * buyQty;
        const totalQty = currentQty + buyQty;
        const newAvg = (currentCost + newCost) / totalQty;
        return {
            newAvg,
            reduction: ((currentAvg - newAvg) / currentAvg) * 100
        };
    },

    formatIDR: (num) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(num);
    }
};
