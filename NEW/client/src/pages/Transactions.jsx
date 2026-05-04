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
  ExternalLink,
  Pencil
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
  const [editingTx, setEditingTx] = useState(null);
  const [filterEmiten, setFilterEmiten] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'tx_date', direction: 'desc' });

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

  const handleAddTransaction = async (e, closeModal = false) => {
    if (e) e.preventDefault();
    
    // Check form validity manually since we're using type="button" for some buttons
    const form = e?.currentTarget?.form || e?.target?.closest('form');
    if (form && !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity) * 100, // convert Lot to Shares
        price: Number(formData.price)
      };
      
      if (editingTx) {
        await axios.put(`/api/transactions/${editingTx.id}`, payload);
      } else {
        await axios.post('/api/transactions', payload);
      }

      if (closeModal) {
        setShowAddModal(false);
        setEditingTx(null);
        setFormData({
          tx_date: new Date().toISOString().split('T')[0],
          account_id: accounts[0]?.id || '',
          emiten_ticker: '',
          type: 'BUY',
          quantity: '',
          price: '',
          fee_applied: 0.15
        });
      } else {
        // Reset only specific fields to allow batch entry
        setFormData(prev => ({
          ...prev,
          emiten_ticker: '',
          quantity: '',
          price: ''
        }));
      }
      
      if (closeModal) {
        fetchData();
      }
    } catch (err) {
      alert(editingTx ? 'Gagal mengubah transaksi' : 'Gagal menambah transaksi');
    }
  };

  const handleEditClick = (tx) => {
    setEditingTx(tx);
    setFormData({
      tx_date: new Date(tx.tx_date).toISOString().split('T')[0],
      account_id: tx.account_id,
      emiten_ticker: tx.emiten_ticker,
      type: tx.type,
      quantity: tx.quantity / 100, // convert Shares back to Lot
      price: tx.price,
      fee_applied: tx.fee_applied
    });
    setShowAddModal(true);
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedTransactions = [...transactions]
    .filter(tx => filterEmiten === 'all' || tx.emiten_ticker === filterEmiten)
    .sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      // Special case for calculated columns
      if (sortConfig.key === 'total') {
        aVal = a.price * a.quantity;
        bVal = b.price * b.quantity;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

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

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Filter Emiten</label>
          <div className="relative group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <select 
              value={filterEmiten}
              onChange={(e) => setFilterEmiten(e.target.value)}
              className="pl-12 pr-10 py-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="all">Semua Emiten</option>
              {Array.from(new Set(transactions.map(t => t.emiten_ticker))).sort().map(ticker => (
                <option key={ticker} value={ticker}>{ticker}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
        
        {filterEmiten !== 'all' && (
          <button 
            onClick={() => setFilterEmiten('all')}
            className="px-4 py-3 text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Reset
          </button>
        )}
      </div>

      {/* Transaction List */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50">
                <SortableHeader label="Tanggal" sortKey="tx_date" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Emiten" sortKey="emiten_ticker" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Tipe" sortKey="type" currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Lot" sortKey="quantity" currentSort={sortConfig} onSort={handleSort} align="right" />
                <SortableHeader label="Harga" sortKey="price" currentSort={sortConfig} onSort={handleSort} align="right" />
                <SortableHeader label="Total" sortKey="total" currentSort={sortConfig} onSort={handleSort} align="right" />
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {sortedTransactions.map((tx) => (
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
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => handleEditClick(tx)}
                        className="p-2 text-slate-500 hover:text-indigo-400 transition-colors"
                        title="Edit Transaksi"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(tx.id)}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sortedTransactions.length === 0 && (
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
              <h3 className="text-xl font-bold text-white">{editingTx ? 'Edit Transaksi' : 'Tambah Transaksi'}</h3>
              <button onClick={() => { setShowAddModal(false); setEditingTx(null); }} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
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

              <div className="flex flex-col gap-3">
                {!editingTx && (
                  <button 
                    type="button"
                    onClick={(e) => handleAddTransaction(e, false)}
                    disabled={accounts.length === 0}
                    className={`w-full py-4 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-[0.98] ${
                      accounts.length === 0 
                        ? 'bg-slate-800 cursor-not-allowed text-slate-500' 
                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                    }`}
                  >
                    Simpan & Tambah Lagi
                  </button>
                )}

                <button 
                  type="button"
                  onClick={(e) => handleAddTransaction(e, true)}
                  disabled={accounts.length === 0}
                  className={`w-full py-4 font-bold rounded-2xl transition-all active:scale-[0.98] ${
                    editingTx 
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {editingTx ? 'Simpan Perubahan' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;

const SortableHeader = ({ label, sortKey, currentSort, onSort, align = 'left' }) => {
  const isActive = currentSort.key === sortKey;
  
  return (
    <th 
      className={`px-6 py-5 text-xs font-bold uppercase tracking-widest cursor-pointer group transition-colors ${
        isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
      } ${align === 'right' ? 'text-right' : ''}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        <div className={`flex flex-col text-[8px] leading-[4px] transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`}>
          <span className={isActive && currentSort.direction === 'asc' ? 'text-indigo-400' : 'text-slate-600'}>▲</span>
          <span className={isActive && currentSort.direction === 'desc' ? 'text-indigo-400' : 'text-slate-600'}>▼</span>
        </div>
      </div>
    </th>
  );
};
