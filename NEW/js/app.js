// js/app.js
import { Store } from './store.js';
import { Logic } from './logic.js';
import { PriceFetcher } from './priceFetcher.js';

const App = {
    state: {
        currentPage: 'dashboard',
        activePeriod: '2026',
        transactions: [],
        feeSettings: [],
        emitens: [],
        industries: [],
        dividends: [],
        settings: { gsLink: '' },
        marketPrices: {}
    },

    init: () => {
        App.loadData();
        App.attachEventListeners();
        App.render();
    },

    loadData: () => {
        App.state.transactions = Store.getTransactions();
        App.state.feeSettings = Store.getFeeSettings();
        App.state.emitens = Store.getEmitens();
        App.state.industries = Store.getIndustries();
        App.state.dividends = Store.getDividends();
        App.state.settings = Store.getSettings();
    },

    attachEventListeners: () => {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const page = e.target.dataset.page;
                App.navigate(page);
            });
        });

        document.getElementById('active-period').addEventListener('change', (e) => {
            App.state.activePeriod = e.target.value;
            App.render();
        });
    },

    navigate: (page) => {
        App.state.currentPage = page;
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });
        App.render();
    },

    render: () => {
        const content = document.getElementById('main-content');
        const { currentPage } = App.state;

        switch (currentPage) {
            case 'dashboard':
                content.innerHTML = App.renderDashboard();
                break;
            case 'transactions':
                content.innerHTML = App.renderTransactions();
                App.attachTransactionEvents();
                break;
            case 'dividends':
                content.innerHTML = App.renderDividends();
                App.attachDividendEvents();
                break;
            case 'dca':
                content.innerHTML = App.renderDCA();
                App.attachDCAEvents();
                break;
            case 'reports':
                content.innerHTML = App.renderReports();
                break;
            case 'settings':
                content.innerHTML = App.renderSettings();
                App.attachSettingsEvents();
                break;
            default:
                content.innerHTML = '<h1>404 Not Found</h1>';
        }
    },

    // --- RENDERERS ---

    renderDashboard: () => {
        const data = Logic.processPortfolio(App.state.transactions, App.state.feeSettings, App.state.activePeriod === 'all' ? App.state.dividends : App.state.dividends.filter(d => new Date(d.cumDate).getFullYear().toString() === App.state.activePeriod), App.state.activePeriod);
        const report = data.yearlyReports[App.state.activePeriod] || { realizedProfit: 0, turnover: 0, dividends: 0 };
        const totalProfitAllTime = Object.values(data.yearlyReports).reduce((acc, curr) => acc + curr.realizedProfit, 0);
        const totalDivAllTime = Object.values(data.yearlyReports).reduce((acc, curr) => acc + (curr.dividends || 0), 0);

        return `
            <div class="page dashboard">
                <header class="page-header">
                    <h2>Dashboard ${App.state.activePeriod === 'all' ? 'Keseluruhan' : App.state.activePeriod}</h2>
                </header>
                
                <div class="stats-grid">
                    <div class="card stat-card">
                        <span class="stat-label">Profit Direalisasikan (${App.state.activePeriod})</span>
                        <span class="stat-value ${report.realizedProfit >= 0 ? 'success' : 'error'}">
                            ${Logic.formatIDR(report.realizedProfit)}
                        </span>
                    </div>
                    <div class="card stat-card">
                        <span class="stat-label">Profit Kumulatif (Global)</span>
                        <span class="stat-value ${totalProfitAllTime >= 0 ? 'success' : 'error'}">
                            ${Logic.formatIDR(totalProfitAllTime)}
                        </span>
                    </div>
                    <div class="card stat-card">
                        <span class="stat-label">Total Dividen (Global)</span>
                        <span class="stat-value success">${Logic.formatIDR(totalDivAllTime)}</span>
                    </div>
                </div>

                <div class="card">
                    <h3>Portofolio Terbuka</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>EMITEN</th>
                                    <th>JUMLAH</th>
                                    <th>AVG PRICE</th>
                                    <th>MODAL TOTAL</th>
                                    <th>PROFIT REALIZED</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.keys(data.portfolio).map(ticker => {
                                    const p = data.portfolio[ticker];
                                    if (p.qty <= 0 && p.realizedProfit === 0) return '';
                                    return `
                                        <tr>
                                            <td><strong>${ticker}</strong></td>
                                            <td>${p.qty.toLocaleString()}</td>
                                            <td>${Logic.formatIDR(p.avgPrice)}</td>
                                            <td>${Logic.formatIDR(p.totalCost)}</td>
                                            <td class="${p.realizedProfit >= 0 ? 'success' : 'error'}">
                                                ${Logic.formatIDR(p.realizedProfit)}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    renderTransactions: () => {
        return `
            <div class="page transactions">
                <div class="layout-grid" style="display:grid; grid-template-columns: 350px 1fr; gap: 2rem;">
                    <aside class="card">
                        <h3>Tambah Transaksi</h3>
                        <form id="tx-form">
                            <div class="form-group">
                                <label>Tanggal</label>
                                <input type="date" name="date" required value="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div class="form-group">
                                <label>Emiten</label>
                                <select name="emiten" required>
                                    ${App.state.emitens.map(e => `<option value="${e.ticker}">${e.ticker} - ${e.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Tipe</label>
                                <select name="type">
                                    <option value="BUY">BELI</option>
                                    <option value="SELL">JUAL</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Jumlah (Lot)</label>
                                <input type="number" name="quantity" required placeholder="Contoh: 10">
                            </div>
                            <div class="form-group">
                                <label>Harga per Lembar</label>
                                <input type="number" name="price" required placeholder="Contoh: 5000">
                            </div>
                            <button type="submit" class="primary" style="width:100%">Simpan Transaksi</button>
                        </form>
                    </aside>

                    <section class="card">
                        <h3>Riwayat Transaksi</h3>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>TANGGAL</th>
                                        <th>EMITEN</th>
                                        <th>TIPE</th>
                                        <th>QTY (LOT)</th>
                                        <th>HARGA</th>
                                        <th>FEE</th>
                                        <th>TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${[...App.state.transactions].reverse().map(tx => {
                                        const fees = Logic.getEffectiveFee(tx.date, App.state.feeSettings);
                                        const feeRate = tx.type === 'BUY' ? fees.buyFee : fees.sellFee;
                                        const feeVal = (tx.price * tx.quantity * 100) * (feeRate / 100);
                                        return `
                                            <tr>
                                                <td>${tx.date}</td>
                                                <td><strong>${tx.emiten}</strong></td>
                                                <td class="${tx.type === 'BUY' ? 'success' : 'error'}">${tx.type}</td>
                                                <td>${tx.quantity}</td>
                                                <td>${Logic.formatIDR(tx.price)}</td>
                                                <td>${feeRate}%</td>
                                                <td>${Logic.formatIDR(tx.price * tx.quantity * 100)}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        `;
    },

    renderDividends: () => {
        const data = Logic.processPortfolio(App.state.transactions, App.state.feeSettings, App.state.dividends);
        return `
            <div class="page dividends">
                <div class="layout-grid" style="display:grid; grid-template-columns: 350px 1fr; gap: 2rem;">
                    <aside class="card">
                        <h3>Tambah Dividen</h3>
                        <form id="div-form">
                            <div class="form-group">
                                <label>Emiten</label>
                                <select name="emiten" id="div-emiten-select" required>
                                    ${App.state.emitens.map(e => `<option value="${e.ticker}">${e.ticker}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Cum Date</label>
                                <input type="date" name="cumDate" required>
                            </div>
                            <div class="form-group">
                                <label>Nilai per Lembar</label>
                                <input type="number" step="0.01" name="valuePerShare" id="div-val-input" required>
                            </div>
                            <div class="form-group">
                                <label>Total Diterima (Auto-calc)</label>
                                <input type="number" step="0.01" name="totalReceived" id="div-total-input" placeholder="Opsional, bisa adjust manual">
                            </div>
                            <button type="submit" class="primary" style="width:100%">Simpan Dividen</button>
                        </form>
                    </aside>

                    <section class="card">
                        <h3>Riwayat Dividen</h3>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>CUM DATE</th>
                                        <th>EMITEN</th>
                                        <th>PER LEMBAR</th>
                                        <th>TOTAL DITERIMA</th>
                                        <th>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${App.state.dividends.map(div => `
                                        <tr>
                                            <td>${div.cumDate}</td>
                                            <td><strong>${div.emiten}</strong></td>
                                            <td>${Logic.formatIDR(div.valuePerShare)}</td>
                                            <td>${Logic.formatIDR(div.totalReceived)}</td>
                                            <td><span class="badge ${div.status.toLowerCase()}">${div.status}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        `;
    },

    renderDCA: () => {
        const data = Logic.processPortfolio(App.state.transactions, App.state.feeSettings, App.state.dividends);
        const hasPrices = Object.keys(App.state.marketPrices).length > 0;

        return `
            <div class="page dca">
                <header class="page-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2rem;">
                    <h2>DCA Advisor</h2>
                    <button id="sync-prices-btn" class="primary" style="background: var(--surface-hover); color: var(--accent-color); border: 1px solid var(--accent-color);">
                        🔄 Sinkronkan Harga (GS)
                    </button>
                </header>

                <div class="card" style="margin-bottom: 2rem;">
                    <h3>Analisis Posisi & Rekomendasi DCA</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>EMITEN</th>
                                    <th>HARGA RATA-RATA</th>
                                    <th>HARGA PASAR</th>
                                    <th>GAP (%)</th>
                                    <th>SIMULASI DCA (10 LOT)</th>
                                    <th>NEW AVG</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.keys(data.portfolio).filter(t => data.portfolio[t].qty > 0).map(ticker => {
                                    const p = data.portfolio[ticker];
                                    const mPrice = App.state.marketPrices[ticker] || 0;
                                    const gap = mPrice ? ((mPrice - p.avgPrice) / p.avgPrice) * 100 : 0;
                                    const sim = mPrice ? Logic.simulateDCA(p.avgPrice, p.qty, mPrice, 1000) : null;

                                    return `
                                        <tr>
                                            <td><strong>${ticker}</strong></td>
                                            <td>${Logic.formatIDR(p.avgPrice)}</td>
                                            <td>${mPrice ? Logic.formatIDR(mPrice) : '<em>N/A</em>'}</td>
                                            <td class="${gap < -5 ? 'error' : gap > 5 ? 'success' : ''}">
                                                ${gap ? gap.toFixed(2) + '%' : '-'}
                                            </td>
                                            <td>
                                                ${gap < -5 ? '⚡ Rekomendasi DCA' : 'Tahan'}
                                            </td>
                                            <td>${sim ? Logic.formatIDR(sim.newAvg) + ' (-' + sim.reduction.toFixed(1) + '%)' : '-'}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    renderSettings: () => {
        return `
            <div class="page settings">
                <div class="stats-grid">
                    <div class="card">
                        <h3>Konfigurasi Fee</h3>
                        <form id="fee-form">
                            <!-- ... existing fee form ... -->
                            <div class="form-group">
                                <label>Efektif Mulai</label>
                                <input type="date" name="effectiveFrom" required>
                            </div>
                            <div class="form-group">
                                <label>Buy Fee (%)</label>
                                <input type="number" step="0.01" name="buyFee" value="0.15">
                            </div>
                            <div class="form-group">
                                <label>Sell Fee (%)</label>
                                <input type="number" step="0.01" name="sellFee" value="0.25">
                            </div>
                            <button type="submit" class="primary">Update Fee</button>
                        </form>
                    </div>

                    <div class="card">
                        <h3>Integrasi Google Sheets</h3>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">
                            Masukkan link Google Sheets yang telah di-"Publish to Web" sebagai CSV untuk mengambil harga emiten secara otomatis.
                        </p>
                        <form id="gs-form">
                            <div class="form-group">
                                <label>Google Sheets CSV URL</label>
                                <input type="text" name="gsLink" value="${App.state.settings.gsLink}" placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv">
                            </div>
                            <button type="submit" class="primary">Simpan Link</button>
                        </form>
                    </div>

                    <div class="card">
                        <h3>Manajemen Emiten</h3>
                        <form id="emiten-form">
                            <div class="form-group">
                                <label>Ticker (4 Huruf)</label>
                                <input type="text" name="ticker" maxlength="4" placeholder="BBRI">
                            </div>
                            <div class="form-group">
                                <label>Nama Perusahaan</label>
                                <input type="text" name="name" placeholder="Bank Rakyat Indonesia">
                            </div>
                            <div class="form-group">
                                <label>Industri</label>
                                <select name="industry">
                                    ${App.state.industries.map(i => `<option value="${i}">${i}</option>`).join('')}
                                </select>
                            </div>
                            <button type="submit" class="primary">Tambah Emiten</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    renderReports: () => {
        const data = Logic.processPortfolio(App.state.transactions, App.state.feeSettings);
        return `
            <div class="page reports">
                <div class="card" style="margin-bottom: 2rem;">
                    <h3>Laporan Pembukuan per Tahun</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>TAHUN</th>
                                    <th>REALIZED PROFIT</th>
                                    <th>TURNOVER</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.keys(data.yearlyReports).sort((a,b) => b-a).map(year => `
                                    <tr>
                                        <td><strong>${year}</strong></td>
                                        <td class="${data.yearlyReports[year].realizedProfit >= 0 ? 'success' : 'error'}">
                                            ${Logic.formatIDR(data.yearlyReports[year].realizedProfit)}
                                        </td>
                                        <td>${Logic.formatIDR(data.yearlyReports[year].turnover)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="card" style="margin-bottom: 2rem;">
                    <h3>Laporan Pergerakan Bulanan (${App.state.activePeriod})</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>BULAN</th>
                                    <th>PROFIT REALIZED</th>
                                    <th>TURNOVER</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${App.state.activePeriod !== 'all' && data.yearlyReports[App.state.activePeriod]?.monthly ? 
                                    Object.keys(data.yearlyReports[App.state.activePeriod].monthly).sort().map(m => `
                                        <tr>
                                            <td>${m}</td>
                                            <td class="${data.yearlyReports[App.state.activePeriod].monthly[m].realizedProfit >= 0 ? 'success' : 'error'}">
                                                ${Logic.formatIDR(data.yearlyReports[App.state.activePeriod].monthly[m].realizedProfit)}
                                            </td>
                                            <td>${Logic.formatIDR(data.yearlyReports[App.state.activePeriod].monthly[m].turnover)}</td>
                                        </tr>
                                    `).join('') : '<tr><td colspan="3" style="text-align:center">Pilih periode tahun untuk melihat pergerakan bulanan</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="card">
                    <h3>Analisis Emiten & Industri</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 1rem;">Distribusi profitabilitas berdasarkan sektor industri.</p>
                    <!-- Visual representation would go here (Pie/Bar) -->
                    <div style="height: 100px; display:flex; align-items:center; justify-content:center; border: 1px dashed var(--border-color); border-radius: 8px;">
                        Chart Placeholder (Visualisasi per Industri)
                    </div>
                </div>
            </div>
        `;
    },

    // --- EVENT HANDLERS ---

    attachTransactionEvents: () => {
        const form = document.getElementById('tx-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const tx = {
                    date: formData.get('date'),
                    emiten: formData.get('emiten'),
                    type: formData.get('type'),
                    quantity: parseInt(formData.get('quantity')) * 100, // lot to shares
                    price: parseFloat(formData.get('price'))
                };
                Store.saveTransaction(tx);
                App.loadData();
                App.render();
            });
        }
    },

    attachDCAEvents: () => {
        const btn = document.getElementById('sync-prices-btn');
        if (btn) {
            btn.addEventListener('click', async () => {
                btn.innerText = '⌛ Sinkronkan...';
                const prices = await PriceFetcher.fetchFromGS(App.state.settings.gsLink);
                if (prices) {
                    App.state.marketPrices = prices;
                    alert('Harga berhasil diperbarui!');
                } else {
                    alert('Gagal mengambil harga. Pastikan link GS benar dan sudah "Publish to Web".');
                }
                btn.innerText = '🔄 Sinkronkan Harga (GS)';
                App.render();
            });
        }
    },

    attachDividendEvents: () => {
        const form = document.getElementById('div-form');
        const emitenSelect = document.getElementById('div-emiten-select');
        const valInput = document.getElementById('div-val-input');
        const totalInput = document.getElementById('div-total-input');

        const updateAutoCalc = () => {
            const ticker = emitenSelect.value;
            const val = parseFloat(valInput.value) || 0;
            const data = Logic.processPortfolio(App.state.transactions, App.state.feeSettings);
            const qty = data.portfolio[ticker]?.qty || 0;
            totalInput.value = (val * qty).toFixed(2);
        };

        emitenSelect.addEventListener('change', updateAutoCalc);
        valInput.addEventListener('input', updateAutoCalc);

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                Store.saveDividend({
                    emiten: formData.get('emiten'),
                    cumDate: formData.get('cumDate'),
                    valuePerShare: parseFloat(formData.get('valuePerShare')),
                    totalReceived: parseFloat(formData.get('totalReceived')),
                    status: 'RECEIVED'
                });
                App.loadData();
                App.render();
            });
        }
    },

    attachSettingsEvents: () => {
        const gsForm = document.getElementById('gs-form');
        if (gsForm) {
            gsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(gsForm);
                const settings = { gsLink: formData.get('gsLink') };
                Store.saveSettings(settings);
                App.state.settings = settings;
                alert('Settings disimpan!');
            });
        }

        const feeForm = document.getElementById('fee-form');
        if (feeForm) {
            feeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(feeForm);
                Store.saveFeeSetting({
                    effectiveFrom: formData.get('effectiveFrom'),
                    buyFee: parseFloat(formData.get('buyFee')),
                    sellFee: parseFloat(formData.get('sellFee')),
                    effectiveTo: null
                });
                App.loadData();
                App.render();
            });
        }

        const emitenForm = document.getElementById('emiten-form');
        if (emitenForm) {
            emitenForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(emitenForm);
                Store.saveEmiten({
                    ticker: formData.get('ticker').toUpperCase(),
                    name: formData.get('name'),
                    industry: formData.get('industry')
                });
                App.loadData();
                App.render();
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', App.init);
export default App;
