// src/utils/logic.js
// core calculations for KataSaham

export const Logic = {
    getEffectiveFee: (date, feeSettings, accountId) => {
        const txDate = new Date(date);
        const accountFees = feeSettings.filter(f => !f.accountId || f.accountId === accountId);
        
        // Find fee that matches the date range
        const matchingFee = accountFees.find(fee => {
            const from = new Date(fee.effective_from || fee.effectiveFrom);
            const to = (fee.effective_to || fee.effectiveTo) ? new Date(fee.effective_to || fee.effectiveTo) : new Date('2099-12-31');
            return txDate >= from && txDate <= to;
        });

        return matchingFee || accountFees[accountFees.length - 1] || feeSettings[0];
    },

    processPortfolio: (transactions, feeSettings, dividends = [], filterYear = 'all', filterAccountId = 'all') => {
        const portfolio = {}; // ticker -> { qty, avgPrice, totalCost, realizedProfit, dividends }
        const yearlyReports = {}; // year -> { realizedProfit, turnover, dividends }

        // Filter by Account if specified
        let filteredTx = transactions;
        if (filterAccountId !== 'all') {
            filteredTx = transactions.filter(tx => tx.account_id === filterAccountId || tx.accountId === filterAccountId);
        }

        // Sort by date to process chronologically
        const sortedTx = [...filteredTx].sort((a, b) => new Date(a.tx_date || a.date) - new Date(b.tx_date || b.date));

        sortedTx.forEach(tx => {
            const dateStr = tx.tx_date || tx.date;
            const emiten = tx.emiten_ticker || tx.emiten;
            const year = new Date(dateStr).getFullYear().toString();
            
            if (!yearlyReports[year]) {
                yearlyReports[year] = { realizedProfit: 0, turnover: 0, dividends: 0 };
            }

            const monthYear = `${year}-${(new Date(dateStr).getMonth() + 1).toString().padStart(2, '0')}`;
            if (!yearlyReports[year].monthly) yearlyReports[year].monthly = {};
            if (!yearlyReports[year].monthly[monthYear]) {
                yearlyReports[year].monthly[monthYear] = { realizedProfit: 0, turnover: 0, dividends: 0 };
            }

            if (!portfolio[emiten]) {
                portfolio[emiten] = { qty: 0, avgPrice: 0, totalCost: 0, realizedProfit: 0, dividends: 0 };
            }

            const p = portfolio[emiten];
            const fees = Logic.getEffectiveFee(dateStr, feeSettings, tx.account_id || tx.accountId);
            const feeRate = tx.type === 'BUY' ? fees.buy_fee || fees.buyFee : fees.sell_fee || fees.sellFee;
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

        // Filter and Process Dividends
        const filteredDivs = filterAccountId === 'all' ? dividends : dividends.filter(d => d.account_id === filterAccountId || d.accountId === filterAccountId);

        filteredDivs.forEach(div => {
            const year = new Date(div.cum_date || div.cumDate).getFullYear().toString();
            if (!yearlyReports[year]) yearlyReports[year] = { realizedProfit: 0, turnover: 0, dividends: 0 };
            
            const emiten = div.emiten_ticker || div.emiten;
            if (!portfolio[emiten]) {
                portfolio[emiten] = { qty: 0, avgPrice: 0, totalCost: 0, realizedProfit: 0, dividends: 0 };
            }

            const monthYear = `${year}-${(new Date(div.cum_date || div.cumDate).getMonth() + 1).toString().padStart(2, '0')}`;
            if (!yearlyReports[year].monthly) yearlyReports[year].monthly = {};
            if (!yearlyReports[year].monthly[monthYear]) {
                yearlyReports[year].monthly[monthYear] = { realizedProfit: 0, turnover: 0, dividends: 0 };
            }

            const divAmount = Number(div.total_received || div.totalReceived || 0);
            portfolio[emiten].dividends += divAmount;
            // portfolio[emiten].realizedProfit += divAmount; // Removed: only buy/sell transactions
            
            yearlyReports[year].dividends += divAmount;
            // yearlyReports[year].realizedProfit += divAmount; // Removed: only buy/sell transactions
            
            yearlyReports[year].monthly[monthYear].dividends += divAmount;
            // yearlyReports[year].monthly[monthYear].realizedProfit += divAmount; // Removed: only buy/sell transactions
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
            maximumFractionDigits: 2
        }).format(num);
    }
};
