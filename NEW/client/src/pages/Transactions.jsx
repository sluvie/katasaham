import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Logic } from '../utils/logic';
import { 
  Plus, 
  Search, 
  Trash2, 
  AlertCircle, 
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  X,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [emitens, setEmitens] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    tx_date: new Date().toISOString().split('T')[0],
    account_id: '',
    emiten_ticker: '',
    type: 'BUY',
    quantity: '',
    price: '',
    fee_applied: 0.15
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [txRes, accRes, emRes] = await Promise.all([
        axios.get('/api/transactions'),
        axios.get('/api/accounts'),
        axios.get('/api/emitens')
      ]);
      setTransactions(txRes.data);
      setAccounts(accRes.data);
      setEmitens(emRes.data);
      if (accRes.data.length > 0 && !formData.account_id) {
        setFormData(prev => ({ ...prev, account_id: accRes.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch transactions data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity) * 100, // convert Lot to Shares
        price: Number(formData.price)
      };
      await axios.post('/api/transactions', payload);
      setShowAddModal(false);
      setFormData({
        tx_date: new Date().toISOString().split('T')[0],
        account_id: accounts[0]?.id || '',
        emiten_ticker: '',
        type: 'BUY',
        quantity: '',
        price: '',
        fee_applied: 0.15
      });
      fetchData();
    } catch (err) {
      alert('Gagal menambah transaksi');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus transaksi ini?')) return;
    try {
      await axios.delete(`/api/transactions/${id}`);
      fetchData();
    } catch (err) {
      alert('Gagal menghapus transaksi');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div></div>;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Riwayat Transaksi</h2>
          <p className="text-slate-400 text-sm">Kelola semua aktivitas beli dan jual saham Anda</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          Tambah Transaksi
        </button>
      </div>

      {/* Transaction List */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50">
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Tanggal</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Emiten</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Tipe</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Lot</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Harga</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Total</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-300">
                        {new Date(tx.tx_date).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-white group-hover:text-indigo-400 transition-colors">{tx.emiten_ticker}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      tx.type === 'BUY' 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {tx.type === 'BUY' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                      {tx.type === 'BUY' ? 'Beli' : 'Jual'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-300 font-medium">
                    {tx.quantity / 100}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-300">
                    {Logic.formatIDR(tx.price)}
                  </td>
                  <td className="px-6 py-4 text-right text-white font-bold">
                    {Logic.formatIDR(tx.price * tx.quantity)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleDelete(tx.id)}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-500">
                      <AlertCircle className="w-12 h-12 opacity-20" />
                      <p className="italic">Belum ada riwayat transaksi.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Tambah Transaksi</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddTransaction} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tanggal</label>
                  <input 
                    type="date" 
                    required 
                    value={formData.tx_date}
                    onChange={(e) => setFormData({...formData, tx_date: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Akun</label>
                  {accounts.length > 0 ? (
                    <select 
                      required 
                      value={formData.account_id}
                      onChange={(e) => setFormData({...formData, account_id: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    </select>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Belum ada akun terdaftar
                      </div>
                      <Link 
                        to="/management" 
                        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-xs font-bold ml-1 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Buat Akun di Management
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Emiten</label>
                  <input 
                    list="emiten-list-tx"
                    required 
                    placeholder="Ketik kode (BBCA)"
                    value={formData.emiten_ticker}
                    onChange={(e) => setFormData({...formData, emiten_ticker: e.target.value.toUpperCase()})}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <datalist id="emiten-list-tx">
                    {emitens.map(e => (
                      <option key={e.ticker} value={e.ticker}>{e.name}</option>
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tipe</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, type: 'BUY'})}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${formData.type === 'BUY' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >BELI</button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, type: 'SELL'})}
                      className={`py-2 text-xs font-bold rounded-lg transition-all ${formData.type === 'SELL' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                    >JUAL</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Jumlah (LOT)</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="Contoh: 10"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Harga per Lembar</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="Contoh: 5000"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={accounts.length === 0}
                className={`w-full py-4 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-[0.98] ${
                  accounts.length === 0 
                    ? 'bg-slate-800 cursor-not-allowed text-slate-500' 
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                }`}
              >
                Simpan Transaksi
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
