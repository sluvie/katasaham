import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Logic } from '../utils/logic';
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Search,
  ArrowUpDown,
  Filter,
  Download,
  Info,
  DollarSign
} from 'lucide-react';

const EmitenHistory = () => {
  const [data, setData] = useState({
    transactions: [],
    dividends: [],
    feeSettings: [],
    emitens: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'realizedProfit', direction: 'desc' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [txRes, divRes, feeRes, emRes] = await Promise.all([
        axios.get('/api/transactions'),
        axios.get('/api/dividends'),
        axios.get('/api/fee-settings'),
        axios.get('/api/emitens')
      ]);

      setData({
        transactions: txRes.data,
        dividends: divRes.data,
        feeSettings: feeRes.data,
        emitens: emRes.data
      });
    } catch (err) {
      console.error('Failed to fetch emiten history data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div></div>;

  const { portfolio } = Logic.processPortfolio(data.transactions, data.feeSettings, data.dividends);
  
  // Transform portfolio object into array for table
  const emitenList = Object.keys(portfolio).map(ticker => {
    const p = portfolio[ticker];
    return {
      ticker,
      qty: p.qty,
      avgPrice: p.avgPrice,
      realizedProfit: p.realizedProfit,
      dividends: p.dividends,
      totalProfit: p.realizedProfit + p.dividends,
      // Find emiten name from master data
      name: data.emitens.find(e => e.ticker === ticker)?.name || 'Unknown'
    };
  });

  // Filter
  const filteredList = emitenList.filter(e => 
    e.ticker.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort
  const sortedList = [...filteredList].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const totalRealized = emitenList.reduce((acc, curr) => acc + curr.realizedProfit, 0);
  const totalDivs = emitenList.reduce((acc, curr) => acc + curr.dividends, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tight">Rekap Emiten</h2>
          <p className="text-slate-400">Seluruh riwayat performa per emiten yang pernah Anda transaksikan.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 px-6 flex items-center gap-4 shadow-lg shadow-black/20">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Realized</p>
              <p className={`text-xl font-black ${totalRealized >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {Logic.formatIDR(totalRealized)}
              </p>
            </div>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 px-6 flex items-center gap-4 shadow-lg shadow-black/20">
            <div className="p-3 bg-indigo-500/10 rounded-xl">
              <DollarSign className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Dividen</p>
              <p className="text-xl font-black text-white">
                {Logic.formatIDR(totalDivs)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Cari Ticker atau Nama Perusahaan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors shadow-lg shadow-indigo-600/20">
            <Download className="w-4 h-4" />
            Ekspor CSV
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50">
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-slate-300 transition-colors" onClick={() => requestSort('ticker')}>
                  <div className="flex items-center gap-2">
                    Emiten <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors" onClick={() => requestSort('qty')}>
                  <div className="flex items-center gap-2 justify-end">
                    Sisa Posisi <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors" onClick={() => requestSort('avgPrice')}>
                  <div className="flex items-center gap-2 justify-end">
                    Avg Price <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors" onClick={() => requestSort('realizedProfit')}>
                  <div className="flex items-center gap-2 justify-end">
                    Realized Profit <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors" onClick={() => requestSort('dividends')}>
                  <div className="flex items-center gap-2 justify-end">
                    Dividen <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right cursor-pointer hover:text-slate-300 transition-colors" onClick={() => requestSort('totalProfit')}>
                  <div className="flex items-center gap-2 justify-end">
                    Total Net <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sortedList.length > 0 ? sortedList.map((e) => (
                <tr key={e.ticker} className="hover:bg-slate-800/30 transition-all group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-white group-hover:text-indigo-400 transition-colors tracking-wide">{e.ticker}</span>
                      <span className="text-[10px] font-medium text-slate-500 truncate max-w-[150px]">{e.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    {e.qty > 0 ? (
                      <div className="flex flex-col items-end">
                        <span className="text-white font-bold">{e.qty / 100} <span className="text-[10px] text-slate-500">LOT</span></span>
                        <span className="text-[10px] text-emerald-500/70 font-black uppercase tracking-tighter">Active</span>
                      </div>
                    ) : (
                      <span className="px-2 py-1 bg-slate-800 text-slate-500 text-[10px] font-bold rounded-md uppercase tracking-widest">Closed</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right text-slate-300 font-medium">
                    {e.qty > 0 ? Logic.formatIDR(e.avgPrice) : '-'}
                  </td>
                  <td className={`px-6 py-5 text-right font-black ${e.realizedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {Logic.formatIDR(e.realizedProfit)}
                  </td>
                  <td className="px-6 py-5 text-right text-indigo-300 font-bold">
                    {Logic.formatIDR(e.dividends)}
                  </td>
                  <td className={`px-6 py-5 text-right font-black ${e.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    <div className="flex flex-col items-end">
                      <span className="text-sm">{Logic.formatIDR(e.totalProfit)}</span>
                      {e.realizedProfit !== 0 && (
                        <span className="text-[10px] opacity-60">
                          {((e.totalProfit / Math.abs(e.realizedProfit)) * 100).toFixed(1)}% ROI
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700">
                        <Info className="w-8 h-8 text-slate-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-white font-bold text-lg">Tidak ada data ditemukan</p>
                        <p className="text-slate-500 text-sm italic">Coba ubah kata kunci pencarian Anda.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmitenHistory;
