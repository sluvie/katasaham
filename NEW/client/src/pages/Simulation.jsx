import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Logic } from '../utils/logic';
import { 
  Calculator, 
  Search, 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Layers,
  ArrowRight,
  Info,
  AlertCircle
} from 'lucide-react';

const Simulation = () => {
  const [data, setData] = useState({
    transactions: [],
    dividends: [],
    feeSettings: [],
    emitens: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedTicker, setSelectedTicker] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Simulation Inputs
  const [targetLot, setTargetLot] = useState('');
  const [targetAvgPrice, setTargetAvgPrice] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [targetYield, setTargetYield] = useState('');

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
      console.error('Failed to fetch simulation data', err);
    } finally {
      setLoading(false);
    }
  };

  const portfolioData = useMemo(() => {
    return Logic.processPortfolio(data.transactions, data.feeSettings, data.dividends);
  }, [data.transactions, data.feeSettings, data.dividends]);

  const filteredEmitens = useMemo(() => {
    if (!searchQuery) return data.emitens.slice(0, 50);
    return data.emitens.filter(e => 
      e.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
      e.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 50);
  }, [data.emitens, searchQuery]);

  const selectedEmiten = useMemo(() => {
    return data.emitens.find(e => e.ticker === selectedTicker);
  }, [data.emitens, selectedTicker]);

  const currentPosition = useMemo(() => {
    return portfolioData.portfolio[selectedTicker] || { qty: 0, avgPrice: 0 };
  }, [portfolioData, selectedTicker]);

  const lastDiv = useMemo(() => {
    const divs = data.dividends.filter(d => d.emiten_ticker === selectedTicker);
    if (divs.length === 0) return 0;
    // Get the most recent one by cum_date
    const sorted = [...divs].sort((a, b) => new Date(b.cum_date) - new Date(a.cum_date));
    return sorted[0].value_per_share;
  }, [data.dividends, selectedTicker]);

  // Calculations
  const stackingResult = useMemo(() => {
    if (!targetLot || isNaN(targetLot)) return null;
    const targetQty = Number(targetLot) * 100;
    const neededQty = Math.max(0, targetQty - currentPosition.qty);
    const neededLot = neededQty / 100;
    const price = selectedEmiten?.last_price || buyPrice || 0;
    const estCost = neededQty * price;
    
    return {
      neededLot,
      estCost
    };
  }, [targetLot, currentPosition, selectedEmiten, buyPrice]);

  const dacResult = useMemo(() => {
    const currentPrice = Number(buyPrice) || selectedEmiten?.last_price || 0;
    if (!currentPrice) return null;

    let targetP = Number(targetAvgPrice);
    
    // If targetYield is provided, calculate targetAvgPrice from it
    if (targetYield && lastDiv > 0) {
      targetP = lastDiv / (Number(targetYield) / 100);
    }

    if (!targetP || isNaN(targetP)) return null;

    const currentQty = currentPosition.qty;
    const currentAvg = currentPosition.avgPrice;

    // buyQty = (currentQty * (currentAvg - targetAvg)) / (targetAvg - buyPrice)
    // Avoid division by zero and handle impossible targets
    const denominator = targetP - currentPrice;
    if (Math.abs(denominator) < 0.01) return { error: 'Target harga sama dengan harga beli saat ini.' };
    
    const buyQtyNeeded = (currentQty * (currentAvg - targetP)) / denominator;

    if (buyQtyNeeded < 0) {
      return { 
        error: targetP < currentAvg 
          ? 'Target harga terlalu rendah untuk dicapai dengan harga beli saat ini.' 
          : 'Target harga sudah terlampaui atau tidak dapat dicapai.'
      };
    }

    return {
      targetP,
      buyLotNeeded: Math.ceil(buyQtyNeeded / 100),
      totalCost: Math.ceil(buyQtyNeeded / 100) * 100 * currentPrice
    };
  }, [buyPrice, selectedEmiten, targetAvgPrice, targetYield, currentPosition, lastDiv]);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Calculator className="w-8 h-8 text-indigo-500" />
            Simulasi Stacking & DAC
          </h2>
          <p className="text-slate-400 mt-1 font-medium">Rencanakan akumulasi lot dan optimasi harga rata-rata</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Emiten Selector & Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl sticky top-24">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Pilih Emiten</h3>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Cari Ticker (misal: BBCA)..." 
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1 mb-6">
              {filteredEmitens.map(e => (
                <button
                  key={e.ticker}
                  onClick={() => {
                    setSelectedTicker(e.ticker);
                    setSearchQuery('');
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    selectedTicker === e.ticker 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold">{e.ticker}</p>
                    <p className="text-[10px] opacity-60 truncate max-w-[120px]">{e.name}</p>
                  </div>
                  <ArrowRight className={`w-4 h-4 transition-transform ${selectedTicker === e.ticker ? 'translate-x-0' : '-translate-x-2 opacity-0'}`} />
                </button>
              ))}
            </div>

            {selectedTicker && (
              <div className="pt-6 border-t border-slate-800 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Harga Terakhir</span>
                  <span className="font-bold text-white">{Logic.formatIDR(selectedEmiten?.last_price || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Posisi Saat Ini</span>
                  <span className="font-bold text-indigo-400">{(currentPosition.qty / 100).toLocaleString()} Lot</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Rata-rata Harga</span>
                  <span className="font-bold text-white">{Logic.formatIDR(currentPosition.avgPrice)}</span>
                </div>
                {lastDiv > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Dividen Terakhir</span>
                    <span className="font-bold text-emerald-400">{Logic.formatIDR(lastDiv)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Calculators */}
        <div className="lg:col-span-2 space-y-8">
          {!selectedTicker ? (
            <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl p-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pilih Emiten Terlebih Dahulu</h3>
              <p className="text-slate-500 max-w-sm">Pilih kode saham di panel sebelah kiri untuk mulai menghitung simulasi Stacking dan DAC.</p>
            </div>
          ) : (
            <>
              {/* Stacking Calculator */}
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="px-8 py-6 border-b border-slate-800 flex items-center gap-3 bg-gradient-to-r from-indigo-500/10 to-transparent">
                  <Layers className="w-6 h-6 text-indigo-400" />
                  <h3 className="text-lg font-bold text-white">Kalkulator Stacking Lot</h3>
                </div>
                <div className="p-8">
                  <div className="mb-8 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Lot Saat Ini</p>
                      <p className="text-lg font-black text-white">{(currentPosition.qty / 100).toLocaleString()} <span className="text-xs font-normal text-slate-500">LOT</span></p>
                    </div>
                    <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Avg Price Saat Ini</p>
                      <p className="text-lg font-black text-white">{Logic.formatIDR(currentPosition.avgPrice)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Target Jumlah Lot</label>
                        <input 
                          type="number" 
                          placeholder="Misal: 1000"
                          className="w-full px-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xl font-black focus:ring-2 focus:ring-indigo-500 transition-all"
                          value={targetLot}
                          onChange={(e) => setTargetLot(e.target.value)}
                        />
                      </div>
                      <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex gap-3">
                        <Info className="w-5 h-5 text-indigo-400 shrink-0" />
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Gunakan kalkulator ini untuk mengetahui berapa lot lagi yang harus Anda beli untuk mencapai jumlah kepemilikan saham yang diinginkan.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-950/50 rounded-3xl p-8 border border-slate-800 flex flex-col justify-center min-h-[200px]">
                      {stackingResult ? (
                        <div className="space-y-6">
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Lot Yang Perlu Ditambah</p>
                            <h4 className="text-4xl font-black text-indigo-400">{stackingResult.neededLot.toLocaleString()} <span className="text-sm">LOT</span></h4>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Estimasi Dana Dibutuhkan</p>
                            <h4 className="text-2xl font-bold text-white">{Logic.formatIDR(stackingResult.estCost)}</h4>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-2">
                          <Target className="w-8 h-8 text-slate-700 mx-auto" />
                          <p className="text-slate-500 italic text-sm">Masukkan target lot untuk melihat hasil</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* DAC Calculator */}
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="px-8 py-6 border-b border-slate-800 flex items-center gap-3 bg-gradient-to-r from-emerald-500/10 to-transparent">
                  <TrendingDown className="w-6 h-6 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white">Kalkulator DAC (Dividend Averaging Cost)</h3>
                </div>
                <div className="p-8">
                  <div className="mb-8 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Lot Saat Ini</p>
                      <p className="text-lg font-black text-white">{(currentPosition.qty / 100).toLocaleString()} <span className="text-xs font-normal text-slate-500">LOT</span></p>
                    </div>
                    <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Avg Price Saat Ini</p>
                      <p className="text-lg font-black text-white">{Logic.formatIDR(currentPosition.avgPrice)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Harga Beli Saat Ini (Simulasi)</label>
                          <input 
                            type="number" 
                            placeholder={selectedEmiten?.last_price?.toString() || "0"}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:ring-2 focus:ring-emerald-500 transition-all"
                            value={buyPrice}
                            onChange={(e) => setBuyPrice(e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Target Harga Avg</label>
                            <input 
                              type="number" 
                              disabled={!!targetYield}
                              className={`w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:ring-2 focus:ring-emerald-500 transition-all ${targetYield ? 'opacity-30' : ''}`}
                              value={targetAvgPrice}
                              onChange={(e) => setTargetAvgPrice(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Target Yield %</label>
                            <input 
                              type="number" 
                              step="0.01"
                              disabled={lastDiv <= 0}
                              placeholder={lastDiv <= 0 ? "No Div Data" : "Misal: 5.0"}
                              className={`w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:ring-2 focus:ring-emerald-500 transition-all ${lastDiv <= 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                              value={targetYield}
                              onChange={(e) => setTargetYield(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex gap-3">
                        <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Hitung berapa lot yang harus dibeli pada harga tertentu untuk menurunkan rata-rata harga Anda ke angka yang ditargetkan atau untuk mencapai yield tertentu.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-950/50 rounded-3xl p-8 border border-slate-800 flex flex-col justify-center min-h-[250px]">
                      {dacResult ? (
                        dacResult.error ? (
                          <div className="text-center space-y-3">
                            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                            <p className="text-red-400 text-sm font-medium">{dacResult.error}</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div>
                              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Target Harga Rata-rata</p>
                              <h4 className="text-2xl font-bold text-white">{Logic.formatIDR(dacResult.targetP)}</h4>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Prediksi Lot Harus Dibeli</p>
                              <h4 className="text-4xl font-black text-emerald-400">{dacResult.buyLotNeeded.toLocaleString()} <span className="text-sm">LOT</span></h4>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Total Modal Tambahan</p>
                              <h4 className="text-xl font-bold text-white">{Logic.formatIDR(dacResult.totalCost)}</h4>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="text-center space-y-2">
                          <TrendingDown className="w-8 h-8 text-slate-700 mx-auto" />
                          <p className="text-slate-500 italic text-sm">Masukkan target harga atau yield untuk melihat prediksi</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Simulation;
