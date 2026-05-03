import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Logic } from '../utils/logic';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  AlertCircle,
  Clock,
  ArrowRight,
  Wallet
} from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState({
    transactions: [],
    dividends: [],
    feeSettings: [],
    accounts: []
  });
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [txRes, divRes, feeRes, accRes] = await Promise.all([
        axios.get('/api/transactions'),
        axios.get('/api/dividends'),
        axios.get('/api/fee-settings'),
        axios.get('/api/accounts')
      ]);

      setData({
        transactions: txRes.data,
        dividends: divRes.data,
        feeSettings: feeRes.data,
        accounts: accRes.data
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div></div>;

  const portfolioData = Logic.processPortfolio(data.transactions, data.feeSettings, data.dividends);
  const report = portfolioData.yearlyReports[activeYear] || { realizedProfit: 0, turnover: 0, dividends: 0 };
  
  const totalProfitGlobal = Object.values(portfolioData.yearlyReports).reduce((acc, curr) => acc + curr.realizedProfit, 0);
  const totalDivGlobal = Object.values(portfolioData.yearlyReports).reduce((acc, curr) => acc + curr.dividends, 0);
  
  const activeStocks = Object.keys(portfolioData.portfolio).filter(ticker => portfolioData.portfolio[ticker].qty > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          label={`Profit Realisasi (${activeYear})`}
          value={Logic.formatIDR(report.realizedProfit)}
          subValue="Berdasarkan transaksi jual & dividen"
          type={report.realizedProfit >= 0 ? 'success' : 'danger'}
          icon={TrendingUp}
        />
        <StatCard 
          label="Profit Kumulatif (Global)"
          value={Logic.formatIDR(totalProfitGlobal)}
          subValue="Total profit sejak awal"
          type={totalProfitGlobal >= 0 ? 'success' : 'danger'}
          icon={DollarSign}
        />
        <StatCard 
          label="Total Dividen"
          value={Logic.formatIDR(totalDivGlobal)}
          subValue="Pendapatan pasif yang diterima"
          type="info"
          icon={BarChart3}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Portfolio Table */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-400" />
                Portofolio Terbuka
              </h3>
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-full border border-indigo-500/20 uppercase tracking-wider">
                {activeStocks.length} Emiten
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Emiten</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Jumlah</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Avg Price</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Modal Total</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Profit Realized</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {activeStocks.length > 0 ? activeStocks.map(ticker => {
                    const p = portfolioData.portfolio[ticker];
                    return (
                      <tr key={ticker} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="font-bold text-white group-hover:text-indigo-400 transition-colors">{ticker}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-300">{(p.qty/100).toLocaleString()} <span className="text-[10px] text-slate-500 font-bold ml-1">LOT</span></td>
                        <td className="px-6 py-4 text-right text-slate-300 font-medium">{Logic.formatIDR(p.avgPrice)}</td>
                        <td className="px-6 py-4 text-right text-slate-300">{Logic.formatIDR(p.totalCost)}</td>
                        <td className={`px-6 py-4 text-right font-bold ${p.realizedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {Logic.formatIDR(p.realizedProfit)}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-slate-500 italic">
                        Belum ada posisi terbuka. Tambahkan transaksi untuk mulai memantau.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Recent Activity or Summary */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              Aktivitas Terbaru
            </h3>
            <div className="space-y-6">
              {data.transactions.slice(0, 5).map((tx, idx) => (
                <div key={idx} className="flex items-start gap-4 group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-800 ${tx.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400'}`}>
                    {tx.type === 'BUY' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-white group-hover:text-indigo-400 transition-colors">{tx.emiten_ticker || tx.emiten}</p>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{new Date(tx.tx_date || tx.date).toLocaleDateString('id-ID')}</span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {tx.type === 'BUY' ? 'Beli' : 'Jual'} {tx.quantity/100} Lot @ {Logic.formatIDR(tx.price)}
                    </p>
                  </div>
                </div>
              ))}
              {data.transactions.length === 0 && <p className="text-slate-500 text-sm italic text-center py-4">Belum ada aktivitas.</p>}
            </div>
            <button className="w-full mt-8 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subValue, type, icon: Icon }) => {
  const colors = {
    success: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
    danger: 'from-red-500/20 to-red-600/5 border-red-500/20 text-red-400',
    info: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/20 text-indigo-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[type]} border rounded-3xl p-6 shadow-lg shadow-black/20`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm font-bold uppercase tracking-widest text-slate-400">{label}</span>
        <div className={`p-2 rounded-xl bg-slate-900/50 border border-white/5`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="space-y-1">
        <h4 className="text-3xl font-black tracking-tight text-white">{value}</h4>
        <p className="text-xs text-slate-500 font-medium">{subValue}</p>
      </div>
    </div>
  );
};

export default Dashboard;
