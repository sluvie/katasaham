// js/app.js
import { Store } from './store.js';
import { Logic } from './logic.js';
import { PriceFetcher } from './priceFetcher.js';
import { Importer } from './importer.js';

const App = {
    state: {
        currentPage: 'dashboard',
        activePeriod: new Date().getFullYear().toString(),
        activeAccountId: 'all',
        transactions: [],
        feeSettings: [],
        emitens: [],
        industries: [],
        dividends: [],
        accounts: [],
        settings: { gsLink: '' },
        marketPrices: {},
        activeManagementTab: 'accounts',
        ocrResults: [],
        currentUser: null,
        users: [],
        authMode: 'login' // 'login' or 'register'
    },

    init: async () => {
        await Store.initAdmin();
        App.loadData();
        
        if (!App.state.currentUser) {
            App.state.currentPage = 'auth';
        }
        
        App.attachEventListeners();
        
        // Init Selectors
        const pSel = document.getElementById('active-period');
        if (pSel) {
            const current = App.state.activePeriod;
            if (!Array.from(pSel.options).some(o => o.value === current)) {
                const opt = document.createElement('option');
                opt.value = current; opt.text = current;
                const allOpt = Array.from(pSel.options).find(o => o.value === 'all');
                if (allOpt) pSel.insertBefore(opt, allOpt);
                else pSel.appendChild(opt);
            }
            pSel.value = current;
        }

        const aSel = document.getElementById('active-account');
        if (aSel) {
            aSel.innerHTML = '<option value="all">Semua Akun</option>' + 
                App.state.accounts.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('');
            aSel.value = App.state.activeAccountId;
        }

        // Apply dark theme if needed (already in HTML)
        App.render();
    },

    loadData: () => {
        App.state.accounts = Store.getAccounts();
        App.state.transactions = Store.getTransactions();
        App.state.feeSettings = Store.getFeeSettings();
        App.state.emitens = Store.getEmitens();
        App.state.industries = Store.getIndustries();
        App.state.dividends = Store.getDividends();
        App.state.settings = Store.getSettings();
        App.state.currentUser = Store.getCurrentUser();
        if (App.state.currentUser?.role === 'ADMIN') {
            App.state.users = Store.getUsers();
        }
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

        if (aSel) {
            aSel.addEventListener('change', (e) => {
                App.state.activeAccountId = e.target.value;
                App.render();
            });
        }

        // --- GLOBAL PROFILE DROPDOWN ---
        const profileToggle = document.getElementById('profile-toggle');
        const profileMenu = document.getElementById('profile-menu');
        const headerLogoutBtn = document.getElementById('header-logout-btn');

        if (profileToggle && profileMenu) {
            profileToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                profileMenu.classList.toggle('active');
            });

            document.addEventListener('click', () => {
                profileMenu.classList.remove('active');
            });
            
            profileMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        if (headerLogoutBtn) {
            headerLogoutBtn.addEventListener('click', () => {
                Store.logout();
                window.location.reload();
            });
        }
    },

    navigate: (page) => {
        if (!App.state.currentUser && page !== 'auth') {
            App.state.currentPage = 'auth';
        } else {
            App.state.currentPage = page;
        }
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === App.state.currentPage);
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
            case 'management':
                content.innerHTML = App.renderManagement();
                App.attachManagementEvents();
                break;
            case 'settings':
                content.innerHTML = App.renderSettings();
                App.attachSettingsEvents();
                break;
            case 'auth':
                content.innerHTML = App.renderAuth();
                App.attachAuthEvents();
                break;
            case 'user-management':
                content.innerHTML = App.renderUserManagement();
                App.attachUserManagementEvents();
                break;
            default:
                content.innerHTML = '<h1>404 Not Found</h1>';
        }

        // Toggle UI elements based on auth
        const header = document.querySelector('.app-header');
        const selectors = document.querySelector('.selectors-container');
        const userNav = document.getElementById('nav-user-management');
        const body = document.body;

        if (currentPage === 'auth') {
            header.style.display = 'none';
            body.classList.add('auth-page');
        } else {
            header.style.display = 'flex';
            body.classList.remove('auth-page');
            if (selectors) selectors.style.display = 'flex';
            if (userNav) userNav.style.display = App.state.currentUser?.role === 'ADMIN' ? 'block' : 'none';
            
            // User Profile Header
            const profileDropdown = document.getElementById('user-profile-dropdown');
            if (profileDropdown && App.state.currentUser) {
                profileDropdown.style.display = 'block';
                const name = App.state.currentUser.name || App.state.currentUser.username;
                document.getElementById('user-initials').innerText = name.substring(0,2).toUpperCase();
                document.getElementById('menu-user-name').innerText = name;
                document.getElementById('menu-user-role').innerText = App.state.currentUser.role;
            }
        }
    },

    // --- RENDERERS ---

    renderDashboard: () => {
        const data = Logic.processPortfolio(App.state.transactions, App.state.feeSettings, App.state.dividends, App.state.activePeriod, App.state.activeAccountId);
        const report = data.yearlyReports[App.state.activePeriod] || { realizedProfit: 0, turnover: 0, dividends: 0 };
        const totalProfitAllTime = Object.values(data.yearlyReports).reduce((acc, curr) => acc + curr.realizedProfit, 0);
        const totalDivAllTime = Object.values(data.yearlyReports).reduce((acc, curr) => acc + (curr.dividends || 0), 0);
        const totalTurnover = Object.values(data.yearlyReports).reduce((acc, curr) => acc + curr.turnover, 0);
        const activePortfolio = Object.keys(data.portfolio).filter(t => data.portfolio[t].qty > 0);

        return `
            <div class="page dashboard">
                <header class="page-header">
                    <h2>📊 Dashboard ${App.state.activePeriod === 'all' ? 'Keseluruhan' : App.state.activePeriod}</h2>
                    <p>Ringkasan portofolio saham Anda</p>
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
                        <span class="stat-value ${totalDivAllTime > 0 ? 'success' : ''}">
                            ${Logic.formatIDR(totalDivAllTime)}
                        </span>
                    </div>
                </div>

                <div class="card" style="margin-bottom: 1.5rem;">
                    <h3><span class="icon">💼</span> Portofolio Terbuka (${activePortfolio.length} Emiten)</h3>
                    ${activePortfolio.length > 0 ? `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Emiten</th>
                                    <th>Jumlah</th>
                                    <th>Avg Price</th>
                                    <th>Modal Total</th>
                                    <th>Profit Realized</th>
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
                    ` : `
                    <div class="empty-state">
                        <span class="icon">📭</span>
                        <p>Belum ada portofolio terbuka. Tambah transaksi di menu Transaksi.</p>
                    </div>
                    `}
                </div>
            </div>
        `;
    },

    renderTransactions: () => {
        const filteredTx = [...App.state.transactions]
            .filter(tx => App.state.activeAccountId === 'all' || tx.accountId === App.state.activeAccountId)
            .reverse();
        return `
            <div class="page transactions">
                <header class="page-header">
                    <h2>📝 Transaksi</h2>
                    <p>Kelola transaksi beli & jual saham</p>
                </header>
                <div class="layout-grid">
                    <aside class="card">
                        <h3><span class="icon">➕</span> Tambah Transaksi</h3>
                        <form id="tx-form">
                            <div class="form-group">
                                <label>Tanggal</label>
                                <input type="date" name="date" required value="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div class="form-group">
                                <label>Akun</label>
                                <select name="accountId" required>
                                    ${App.state.accounts.map(acc => `<option value="${acc.id}" ${acc.id === App.state.activeAccountId ? 'selected' : ''}>${acc.name}</option>`).join('')}
                                </select>
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
                                <input type="number" name="quantity" required placeholder="10">
                            </div>
                            <div class="form-group">
                                <label>Harga per Lembar</label>
                                <input type="number" name="price" required placeholder="5000">
                            </div>
                            <button type="submit" class="primary" style="width:100%">Simpan Transaksi</button>
                        </form>
                        
                        <div class="ocr-trigger" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px dashed var(--border-color);">
                            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">Atau tambah via screenshot:</p>
                            <button id="show-ocr-btn" class="outline" style="width: 100%;">📸 Upload Screenshot</button>
                        </div>
                    </aside>

                    <section class="card">
                        <div id="ocr-section" style="display:none; margin-bottom: 2rem; padding: 1rem; border: 2px solid var(--primary); border-radius: 8px; background: rgba(99, 102, 241, 0.05);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
                                <h3 style="margin:0;"><span class="icon">🔍</span> Review Hasil OCR</h3>
                                <button id="cancel-ocr-btn" class="outline danger" style="padding: 0.25rem 0.75rem; font-size: 0.8rem;">Batal</button>
                            </div>
                            
                            <div id="ocr-upload-area" style="margin-bottom: 1rem;">
                                <input type="file" id="ocr-file-input" accept="image/*" style="width:100%;">
                                <div id="ocr-progress-bar" style="display:none; margin-top: 0.5rem; height: 4px; background: var(--border-color); border-radius: 2px; overflow: hidden;">
                                    <div id="ocr-progress-fill" style="width:0%; height:100%; background: var(--primary); transition: width 0.3s;"></div>
                                </div>
                            </div>

                            <div id="ocr-review-table-container">
                                <!-- OCR Results Table will be here -->
                            </div>
                        </div>

                        <h3><span class="icon">📋</span> Riwayat Transaksi (${filteredTx.length})</h3>
                        ${filteredTx.length > 0 ? `
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Emiten</th>
                                        <th>Tipe</th>
                                        <th>Qty (Lot)</th>
                                        <th>Harga</th>
                                        <th>Fee</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filteredTx.map(tx => {
                                        const fees = Logic.getEffectiveFee(tx.date, App.state.feeSettings, tx.accountId);
                                        const feeRate = tx.type === 'BUY' ? fees.buyFee : fees.sellFee;
                                        return `
                                            <tr>
                                                <td>${tx.date}</td>
                                                <td><strong>${tx.emiten}</strong></td>
                                                <td><span class="badge ${tx.type.toLowerCase()}">${tx.type}</span></td>
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
                        ` : `
                        <div class="empty-state">
                            <span class="icon">📭</span>
                            <p>Belum ada transaksi. Tambahkan transaksi pertama Anda!</p>
                        </div>
                        `}
                    </section>
                </div>
            </div>
        `;
    },

    renderDividends: () => {
        const data = Logic.processPortfolio(App.state.transactions, App.state.feeSettings, App.state.dividends);
        const filteredDivs = App.state.dividends
            .filter(d => App.state.activeAccountId === 'all' || d.accountId === App.state.activeAccountId);
        return `
            <div class="page dividends">
                <header class="page-header">
                    <h2>💰 Dividen</h2>
                    <p>Catat dan pantau pendapatan dividen</p>
                </header>
                <div class="layout-grid">
                    <aside class="card">
                        <h3><span class="icon">➕</span> Tambah Dividen</h3>
                        <form id="div-form">
                            <div class="form-group">
                                <label>Akun</label>
                                <select name="accountId" required>
                                    ${App.state.accounts.map(acc => `<option value="${acc.id}" ${acc.id === App.state.activeAccountId ? 'selected' : ''}>${acc.name}</option>`).join('')}
                                </select>
                            </div>
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
                                <input type="number" step="0.01" name="totalReceived" id="div-total-input" placeholder="Opsional">
                            </div>
                            <button type="submit" class="primary" style="width:100%">Simpan Dividen</button>
                        </form>
                    </aside>

                    <section class="card">
                        <h3><span class="icon">📋</span> Riwayat Dividen (${filteredDivs.length})</h3>
                        ${filteredDivs.length > 0 ? `
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Cum Date</th>
                                        <th>Emiten</th>
                                        <th>Per Lembar</th>
                                        <th>Total Diterima</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filteredDivs.map(div => `
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
                        ` : `
                        <div class="empty-state">
                            <span class="icon">📭</span>
                            <p>Belum ada data dividen.</p>
                        </div>
                        `}
                    </section>
                </div>
            </div>
        `;
    },

    renderDCA: () => {
        const data = Logic.processPortfolio(App.state.transactions, App.state.feeSettings, App.state.dividends);
        const openPositions = Object.keys(data.portfolio).filter(t => data.portfolio[t].qty > 0);

        return `
            <div class="page dca">
                <header class="page-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h2>⚡ DCA Advisor</h2>
                        <p>Analisis posisi dan rekomendasi dollar-cost averaging</p>
                    </div>
                    <button id="sync-prices-btn" class="outline">
                        🔄 Sinkronkan Harga (GS)
                    </button>
                </header>

                <div class="card">
                    <h3><span class="icon">📈</span> Analisis Posisi & Rekomendasi</h3>
                    ${openPositions.length > 0 ? `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Emiten</th>
                                    <th>Harga Rata-rata</th>
                                    <th>Harga Pasar</th>
                                    <th>Gap (%)</th>
                                    <th>Simulasi DCA (10 Lot)</th>
                                    <th>New Avg</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${openPositions.map(ticker => {
                                    const p = data.portfolio[ticker];
                                    const mPrice = App.state.marketPrices[ticker] || 0;
                                    const gap = mPrice ? ((mPrice - p.avgPrice) / p.avgPrice) * 100 : 0;
                                    const sim = mPrice ? Logic.simulateDCA(p.avgPrice, p.qty, mPrice, 1000) : null;

                                    return `
                                        <tr>
                                            <td><strong>${ticker}</strong></td>
                                            <td>${Logic.formatIDR(p.avgPrice)}</td>
                                            <td>${mPrice ? Logic.formatIDR(mPrice) : '<em style="color:var(--text-muted)">N/A</em>'}</td>
                                            <td class="${gap < -5 ? 'error' : gap > 5 ? 'success' : ''}">
                                                ${gap ? gap.toFixed(2) + '%' : '—'}
                                            </td>
                                            <td>
                                                ${gap < -5 ? '<span class="badge buy">⚡ DCA</span>' : '<span style="color:var(--text-muted)">Tahan</span>'}
                                            </td>
                                            <td>${sim ? Logic.formatIDR(sim.newAvg) + ' (-' + sim.reduction.toFixed(1) + '%)' : '—'}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                    ` : `
                    <div class="empty-state">
                        <span class="icon">📭</span>
                        <p>Belum ada posisi terbuka untuk dianalisis.</p>
                    </div>
                    `}
                </div>
            </div>
        `;
    },

    renderSettings: () => {
        return `
            <div class="page settings">
                <header class="page-header">
                    <h2>⚙️ Pengaturan</h2>
                    <p>Konfigurasi aplikasi dan data dasar</p>
                </header>
                <div class="settings-grid">
                    <div class="card">
                        <h3><span class="icon">👤</span> Profil Pengguna</h3>
                        <p>Login sebagai: <strong>${App.state.currentUser?.username}</strong> (${App.state.currentUser?.role})</p>
                        <button id="logout-btn" class="outline danger" style="width:100%; margin-top: 1rem;">Keluar (Logout)</button>
                    </div>
                    <div class="card">
                        <h3><span class="icon">💾</span> Data & Keamanan</h3>
                        <p class="description">Data Anda disimpan secara lokal di browser ini.</p>
                        <button id="export-data-btn" class="outline" style="width:100%; margin-bottom: 0.5rem;">Export Data (JSON)</button>
                        <button id="clear-data-btn" class="outline danger" style="width:100%">Clear All Data</button>
                    </div>
                </div>
            </div>
        `;
    },

    renderAuth: () => {
        const isLogin = App.state.authMode === 'login';
        return `
            <div class="auth-wrapper">
                <div class="card auth-card">
                    <div class="auth-header">
                        <span class="logo-icon" style="font-size: 3rem; margin-bottom: 1rem; display: block;">📊</span>
                        <h1 style="color: var(--primary);">KataSaham</h1>
                        <p style="color: var(--text-muted);">${isLogin ? 'Selamat datang kembali' : 'Daftar akun baru'}</p>
                    </div>
                    
                    <form id="auth-form" style="margin-top: 2rem;">
                        <div class="form-group">
                            <label>Username</label>
                            <input type="text" name="username" required placeholder="Masukkan username" style="width: 100%;">
                        </div>
                        ${!isLogin ? `
                        <div class="form-group">
                            <label>Nama Lengkap</label>
                            <input type="text" name="name" required placeholder="Masukkan nama lengkap" style="width: 100%;">
                        </div>
                        <div class="form-group">
                            <label>Email (Opsional)</label>
                            <input type="email" name="email" placeholder="contoh@mail.com" style="width: 100%;">
                        </div>
                        ` : ''}
                        <div class="form-group">
                            <label>Password</label>
                            <input type="password" name="password" required placeholder="Masukkan password" style="width: 100%;">
                        </div>
                        <button type="submit" class="primary" style="width:100%; margin-top: 1.5rem; padding: 0.8rem;">
                            ${isLogin ? 'Masuk' : 'Daftar Sekarang'}
                        </button>
                    </form>
                    
                    <div class="auth-footer" style="margin-top: 2rem; text-align: center; font-size: 0.9rem;">
                        ${isLogin ? `
                        Belum punya akun? <a href="#" id="switch-to-register" style="color: var(--primary); font-weight: 600;">Daftar</a>
                        ` : `
                        Sudah punya akun? <a href="#" id="switch-to-login" style="color: var(--primary); font-weight: 600;">Masuk</a>
                        <p style="margin-top: 1.5rem; font-size: 0.75rem; color: var(--text-muted);">* Pendaftaran memerlukan persetujuan admin.</p>
                        `}
                    </div>
                </div>
            </div>
        `;
    },

    renderUserManagement: () => {
        if (App.state.currentUser?.role !== 'ADMIN') {
            return '<div class="alert danger">Akses Ditolak: Khusus Admin</div>';
        }
        return `
            <div class="page user-management">
                <header class="page-header">
                    <h2>👥 Manajemen User</h2>
                    <p>Kelola akses dan persetujuan pengguna baru</p>
                </header>
                
                <div class="card">
                    <h3><span class="icon">📋</span> Daftar Pengguna (${App.state.users.length})</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Nama</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Terdaftar</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${App.state.users.map(u => `
                                    <tr>
                                        <td><strong>${u.username}</strong></td>
                                        <td>${u.name || '-'}</td>
                                        <td><span class="badge ${u.role === 'ADMIN' ? 'buy' : 'sell'}" style="font-size:0.7rem; min-width: 60px;">${u.role}</span></td>
                                        <td><span class="badge ${u.status === 'APPROVED' ? 'buy' : 'neutral'}" style="font-size:0.7rem; min-width: 80px;">${u.status}</span></td>
                                        <td>${new Date(u.createdAt).toLocaleDateString('id-ID')}</td>
                                        <td>
                                            <div style="display:flex; gap: 0.25rem;">
                                            ${u.id === App.state.currentUser.id ? '<em class="text-muted">Sesi Aktif</em>' : `
                                                ${u.status === 'PENDING' ? `
                                                    <button class="outline success btn-approve" data-id="${u.id}" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;">Approve</button>
                                                ` : ''}
                                                ${u.role === 'USER' ? `
                                                    <button class="outline btn-make-admin" data-id="${u.id}" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;">Make Admin</button>
                                                ` : ''}
                                                <button class="outline danger btn-delete-user" data-id="${u.id}" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;">Hapus</button>
                                            `}
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    },

    renderManagement: () => {
        const tab = App.state.activeManagementTab;
        return `
            <div class="page management">
                <header class="page-header">
                    <h2>Terminal Manajemen</h2>
                    <p>Kelola data master dan konfigurasi sistem</p>
                </header>

                <div class="sub-nav">
                    <button class="tab-link ${tab === 'accounts' ? 'active' : ''}" data-tab="accounts">Profil & Fee</button>
                    <button class="tab-link ${tab === 'emitens' ? 'active' : ''}" data-tab="emitens">Master Emiten</button>
                    <button class="tab-link ${tab === 'integrations' ? 'active' : ''}" data-tab="integrations">Integrasi</button>
                    <button class="tab-link ${tab === 'import' ? 'active' : ''}" data-tab="import">Import CSV</button>
                </div>

                <div class="tab-content">
                    ${App.renderManagementTab(tab)}
                </div>
            </div>
        `;
    },

    renderManagementTab: (tab) => {
        switch(tab) {
            case 'accounts':
                return `
                    <div class="layout-grid">
                        <div class="card">
                            <h3><span class="icon">👤</span> Manajemen Akun</h3>
                            <form id="account-form">
                                <div class="form-group">
                                    <label>Nama Akun</label>
                                    <input type="text" name="name" required placeholder="Contoh: Mirae Suli">
                                </div>
                                <div class="form-group">
                                    <label>Sekuritas</label>
                                    <select name="broker" required>
                                        <option value="Bions">Bions</option>
                                        <option value="Mirae">Mirae</option>
                                        <option value="Stockbit">Stockbit</option>
                                        <option value="Ajaib">Ajaib</option>
                                        <option value="General">Lainnya</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Warna Tema</label>
                                    <div style="display:flex; gap:0.5rem; align-items:center;">
                                        <input type="color" name="color" value="#6366f1" style="width: 50px;">
                                        <span class="text-muted">Pembeda di dashboard</span>
                                    </div>
                                </div>
                                <button type="submit" class="primary" style="width:100%">Tambah Akun</button>
                            </form>
                            <div style="margin-top: 1.5rem; display: grid; gap: 0.75rem;">
                                ${App.state.accounts.map(acc => `
                                    <div class="account-item" style="border-left-color: ${acc.color}; display:flex; justify-content:space-between; align-items:center;">
                                        <div>
                                            <strong>${acc.name}</strong>
                                            <div class="broker-tag">${acc.broker}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="card">
                            <h3><span class="icon">💵</span> Konfigurasi Fee</h3>
                            <p class="description">Pilih akun dan tetapkan fee efektif.</p>
                            <form id="fee-form">
                                <div class="form-group">
                                    <label>Akun Tujuan</label>
                                    <select name="accountId" required>
                                        ${App.state.accounts.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Efektif Mulai</label>
                                    <input type="date" name="effectiveFrom" required value="${new Date().toISOString().split('T')[0]}">
                                </div>
                                <div class="form-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                                    <div class="form-group">
                                        <label>Buy Fee (%)</label>
                                        <input type="number" step="0.001" name="buyFee" value="0.15">
                                    </div>
                                    <div class="form-group">
                                        <label>Sell Fee (%)</label>
                                        <input type="number" step="0.001" name="sellFee" value="0.25">
                                    </div>
                                </div>
                                <button type="submit" class="primary" style="width:100%">Simpan Pengaturan Fee</button>
                            </form>
                        </div>
                    </div>
                `;
            case 'emitens':
                return `
                    <div class="layout-grid">
                        <div class="card">
                            <h3><span class="icon">🏢</span> Tambah Emiten</h3>
                            <form id="emiten-form">
                                <div class="form-group">
                                    <label>Ticker (4-5 Huruf)</label>
                                    <input type="text" name="ticker" maxlength="5" placeholder="BBRI" required>
                                </div>
                                <div class="form-group">
                                    <label>Nama Perusahaan</label>
                                    <input type="text" name="name" placeholder="Bank Rakyat Indonesia" required>
                                </div>
                                <div class="form-group">
                                    <label>Industri / Sektor</label>
                                    <select name="industry">
                                        ${App.state.industries.map(i => `<option value="${i}">${i}</option>`).join('')}
                                    </select>
                                </div>
                                <button type="submit" class="primary" style="width:100%">Daftarkan Emiten</button>
                            </form>
                        </div>
                        <div class="card">
                            <h3><span class="icon">📋</span> Daftar Emiten (${App.state.emitens.length})</h3>
                            <div class="table-container" style="max-height: 400px;">
                                <table>
                                    <thead><tr><th>Ticker</th><th>Nama</th><th>Industri</th></tr></thead>
                                    <tbody>
                                        ${App.state.emitens.map(e => `
                                            <tr>
                                                <td><strong>${e.ticker}</strong></td>
                                                <td style="font-size: 0.85rem;">${e.name}</td>
                                                <td><span class="badge">${e.industry}</span></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
            case 'integrations':
                return `
                    <div class="card" style="max-width: 600px;">
                        <h3><span class="icon">📊</span> Google Sheets Sync</h3>
                        <p class="description">Sinkronisasi harga pasar harian dari file Google Sheets Anda.</p>
                        <form id="gs-form">
                            <div class="form-group">
                                <label>CSV URL (Published to Web)</label>
                                <input type="text" name="gsLink" value="${App.state.settings.gsLink}" placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv" required>
                            </div>
                            <div class="alert note" style="font-size: 0.8rem; margin-bottom: 1rem;">
                                ℹ️ Pastikan sheet memiliki kolom 'Ticker' dan 'Price'.
                            </div>
                            <button type="submit" class="primary">Simpan Konfigurasi</button>
                        </form>
                    </div>
                `;
            case 'import':
                return `
                    <div class="card" style="max-width: 600px;">
                        <h3><span class="icon">📥</span> Bulk CSV Import</h3>
                        <p class="description">Impor transaksi dalam jumlah banyak sekaligus.</p>
                        <form id="csv-import-form">
                            <div class="form-group">
                                <label>Akun Tujuan</label>
                                <select name="accountId" required>
                                    ${App.state.accounts.map(acc => `<option value="${acc.id}">${acc.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Pilih File CSV</label>
                                <input type="file" id="csv-file" accept=".csv" required>
                                <p class="text-muted" style="font-size: 0.75rem; margin-top: 0.5rem;">Format: Tanggal (YYYY-MM-DD), Ticker, Tipe (BUY/SELL), Qty (Lot), Harga</p>
                            </div>
                            <button type="submit" class="primary">Mulai Import</button>
                        </form>
                    </div>
                `;
        }
    },

    renderReports: () => {
        const data = Logic.processPortfolio(App.state.transactions, App.state.feeSettings, App.state.dividends, App.state.activePeriod, App.state.activeAccountId);
        return `
            <div class="page reports">
                <header class="page-header">
                    <h2>📑 Laporan</h2>
                    <p>Pembukuan tahunan dan analisis pergerakan bulanan</p>
                </header>

                <div class="card" style="margin-bottom: 1.5rem;">
                    <h3><span class="icon">📅</span> Pembukuan per Tahun</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Tahun</th>
                                    <th>Realized Profit</th>
                                    <th>Turnover</th>
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

                <div class="card" style="margin-bottom: 1.5rem;">
                    <h3><span class="icon">📊</span> Pergerakan Bulanan (${App.state.activePeriod})</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Bulan</th>
                                    <th>Profit Realized</th>
                                    <th>Turnover</th>
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
                                    `).join('') : '<tr><td colspan="3" style="text-align:center;color:var(--text-muted)">Pilih periode tahun untuk melihat pergerakan bulanan</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="card">
                    <h3><span class="icon">🏭</span> Analisis Emiten & Industri</h3>
                    <p class="description">Distribusi profitabilitas berdasarkan sektor industri.</p>
                    <div class="chart-placeholder">
                        📈 Visualisasi per Industri (Coming Soon)
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
                    accountId: formData.get('accountId'),
                    emiten: formData.get('emiten'),
                    type: formData.get('type'),
                    quantity: parseInt(formData.get('quantity')) * 100, // lot to shares
                    price: parseFloat(formData.get('price'))
                };
                Store.saveTransaction(tx);
                App.loadData();
                App.render();
                alert('Transaksi disimpan!');
            });
        }

        // --- OCR WORKFLOW ---
        const showOcrBtn = document.getElementById('show-ocr-btn');
        const ocrSection = document.getElementById('ocr-section');
        const cancelOcrBtn = document.getElementById('cancel-ocr-btn');
        const ocrFileInput = document.getElementById('ocr-file-input');

        if (showOcrBtn) {
            showOcrBtn.addEventListener('click', () => {
                ocrSection.style.display = 'block';
                showOcrBtn.style.display = 'none';
            });
        }

        if (cancelOcrBtn) {
            cancelOcrBtn.addEventListener('click', () => {
                ocrSection.style.display = 'none';
                showOcrBtn.style.display = 'block';
                App.state.ocrResults = [];
                document.getElementById('ocr-review-table-container').innerHTML = '';
            });
        }

        if (ocrFileInput) {
            ocrFileInput.addEventListener('change', async (e) => {
                if (e.target.files.length > 0) {
                    const progress = document.getElementById('ocr-progress-bar');
                    const fill = document.getElementById('ocr-progress-fill');
                    progress.style.display = 'block';
                    fill.style.width = '0%';

                    try {
                        // Use active account for OCR context if possible, or first account
                        const accId = App.state.activeAccountId === 'all' ? App.state.accounts[0]?.id : App.state.activeAccountId;
                        const broker = App.state.accounts.find(a => a.id === accId)?.broker || 'General';
                        
                        const results = await Importer.processOCR(e.target.files[0], broker, (p) => {
                            fill.style.width = p + '%';
                        });

                        App.state.ocrResults = results;
                        App.renderOCRReview();
                    } catch (err) {
                        alert('Gagal memproses OCR: ' + err.message);
                    } finally {
                        progress.style.display = 'none';
                    }
                }
            });
        }
    },

    renderOCRReview: () => {
        const container = document.getElementById('ocr-review-table-container');
        if (!container) return;

        if (App.state.ocrResults.length === 0) {
            container.innerHTML = '<p class="text-muted">Tidak ada transaksi terdeteksi. Silakan upload gambar lain.</p>';
            return;
        }

        container.innerHTML = `
            <div class="table-container" style="margin-top: 1rem;">
                <table id="ocr-review-table">
                    <thead>
                        <tr>
                            <th>Ticker</th>
                            <th>Tipe</th>
                            <th>Qty (Lot)</th>
                            <th>Harga</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${App.state.ocrResults.map((res, idx) => `
                            <tr>
                                <td><input type="text" class="ocr-edit-ticker" value="${res.emiten}" style="width:70px"></td>
                                <td>
                                    <select class="ocr-edit-type">
                                        <option value="BUY" ${res.type === 'BUY' ? 'selected' : ''}>BUY</option>
                                        <option value="SELL" ${res.type === 'SELL' ? 'selected' : ''}>SELL</option>
                                    </select>
                                </td>
                                <td><input type="number" class="ocr-edit-qty" value="${res.quantity}" style="width:60px"></td>
                                <td><input type="number" class="ocr-edit-price" value="${res.price}" style="width:90px"></td>
                                <td><button class="outline danger ocr-row-del" data-idx="${idx}" style="padding: 2px 8px;">×</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
                    <button id="post-ocr-btn" class="primary" style="flex:1">Konfirmasi & Post ${App.state.ocrResults.length} Transaksi</button>
                </div>
            </div>
        `;

        // Attach events for the review table
        container.querySelectorAll('.ocr-row-del').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.idx);
                App.state.ocrResults.splice(idx, 1);
                App.renderOCRReview();
            });
        });

        const postBtn = document.getElementById('post-ocr-btn');
        if (postBtn) {
            postBtn.addEventListener('click', () => {
                const rows = document.querySelectorAll('#ocr-review-table tbody tr');
                const accId = App.state.activeAccountId === 'all' ? App.state.accounts[0]?.id : App.state.activeAccountId;
                
                rows.forEach((row, idx) => {
                    const tx = {
                        date: new Date().toISOString().split('T')[0],
                        accountId: accId,
                        emiten: row.querySelector('.ocr-edit-ticker').value.toUpperCase(),
                        type: row.querySelector('.ocr-edit-type').value,
                        quantity: parseInt(row.querySelector('.ocr-edit-qty').value) * 100,
                        price: parseFloat(row.querySelector('.ocr-edit-price').value)
                    };
                    Store.saveTransaction(tx);
                });

                alert('Berhasil memposting transaksi!');
                App.state.ocrResults = [];
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

        if (emitenSelect && valInput) {
            const updateAutoCalc = () => {
                const ticker = emitenSelect.value;
                const val = parseFloat(valInput.value) || 0;
                const data = Logic.processPortfolio(App.state.transactions, App.state.feeSettings);
                const qty = data.portfolio[ticker]?.qty || 0;
                totalInput.value = (val * qty).toFixed(2);
            };
            emitenSelect.addEventListener('change', updateAutoCalc);
            valInput.addEventListener('input', updateAutoCalc);
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                Store.saveDividend({
                    accountId: formData.get('accountId'),
                    emiten: formData.get('emiten'),
                    cumDate: formData.get('cumDate'),
                    valuePerShare: parseFloat(formData.get('valuePerShare')),
                    totalReceived: parseFloat(formData.get('totalReceived')),
                    status: 'RECEIVED'
                });
                App.loadData();
                App.render();
                alert('Dividen disimpan!');
            });
        }
    },

    attachManagementEvents: () => {
        // Tab switching
        document.querySelectorAll('.tab-link').forEach(btn => {
            btn.addEventListener('click', (e) => {
                App.state.activeManagementTab = e.target.dataset.tab;
                App.render();
            });
        });

        // Account Form
        const accountForm = document.getElementById('account-form');
        if (accountForm) {
            accountForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(accountForm);
                Store.saveAccount({
                    name: formData.get('name'),
                    broker: formData.get('broker'),
                    color: formData.get('color')
                });
                App.loadData();
                App.render();
                alert('Akun berhasil ditambahkan!');
            });
        }

        // Fee Form
        const feeForm = document.getElementById('fee-form');
        if (feeForm) {
            feeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(feeForm);
                Store.saveFeeSetting({
                    accountId: formData.get('accountId'),
                    effectiveFrom: formData.get('effectiveFrom'),
                    buyFee: parseFloat(formData.get('buyFee')),
                    sellFee: parseFloat(formData.get('sellFee')),
                    effectiveTo: null
                });
                App.loadData();
                App.render();
                alert('Fee berhasil diperbarui!');
            });
        }

        // Emiten Form
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
                alert('Emiten ditambahkan!');
            });
        }

        // GS Form
        const gsForm = document.getElementById('gs-form');
        if (gsForm) {
            gsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(gsForm);
                const settings = { gsLink: formData.get('gsLink') };
                Store.saveSettings(settings);
                App.state.settings = settings;
                alert('Integrasi disimpan!');
            });
        }

        // CSV Import
        const csvForm = document.getElementById('csv-import-form');
        if (csvForm) {
            csvForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const fileInput = document.getElementById('csv-file');
                const accountId = new FormData(csvForm).get('accountId');
                
                if (fileInput.files.length > 0) {
                    const text = await fileInput.files[0].text();
                    const transactions = Importer.parseCSV(text, accountId);
                    transactions.forEach(tx => Store.saveTransaction(tx));
                    App.loadData();
                    App.render();
                    alert(`${transactions.length} transaksi diimpor!`);
                }
            });
        }
    },

    attachSettingsEvents: () => {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                Store.logout();
                window.location.reload();
            });
        }

        const clearBtn = document.getElementById('clear-data-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('PERINGATAN: Semua data akan dihapus permanen. Lanjutkan?')) {
                    localStorage.clear();
                    window.location.reload();
                }
            });
        }

        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const data = {
                    transactions: Store.getTransactions(),
                    accounts: Store.getAccounts(),
                    emitens: Store.getEmitens(),
                    feeSettings: Store.getFeeSettings(),
                    dividends: Store.getDividends(),
                    settings: Store.getSettings()
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `katasaham-backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
            });
        }
    },

    attachAuthEvents: () => {
        const form = document.getElementById('auth-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const username = formData.get('username');
                const password = formData.get('password');
                
                try {
                    if (App.state.authMode === 'login') {
                        const user = await Store.login(username, password);
                        App.state.currentUser = user;
                        App.state.currentPage = 'dashboard';
                        App.loadData();
                        App.render();
                    } else {
                        const name = formData.get('name');
                        const email = formData.get('email');
                        await Store.saveUser({ username, password, name, email });
                        alert('Pendaftaran berhasil! Tunggu persetujuan admin untuk bisa masuk.');
                        App.state.authMode = 'login';
                        App.render();
                    }
                } catch (err) {
                    alert(err.message);
                }
            });
        }

        const toReg = document.getElementById('switch-to-register');
        if (toReg) toReg.addEventListener('click', (e) => {
            e.preventDefault();
            App.state.authMode = 'register';
            App.render();
        });

        const toLogin = document.getElementById('switch-to-login');
        if (toLogin) toLogin.addEventListener('click', (e) => {
            e.preventDefault();
            App.state.authMode = 'login';
            App.render();
        });
    },

    attachUserManagementEvents: () => {
        document.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                Store.updateUser(id, { status: 'APPROVED' });
                App.loadData();
                App.render();
            });
        });

        document.querySelectorAll('.btn-make-admin').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if(confirm('Jadikan user ini sebagai Admin?')) {
                    Store.updateUser(id, { role: 'ADMIN' });
                    App.loadData();
                    App.render();
                }
            });
        });

        document.querySelectorAll('.btn-delete-user').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if(confirm('Hapus user ini selamanya?')) {
                    const users = Store.getUsers().filter(u => u.id !== id);
                    localStorage.setItem('ks_users', JSON.stringify(users));
                    App.loadData();
                    App.render();
                }
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
export default App;
