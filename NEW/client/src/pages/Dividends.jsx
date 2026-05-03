import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Logic } from '../utils/logic';
import { 
  Plus, 
  Trash2, 
  Pencil,
  AlertCircle, 
  Calendar,
  CheckCircle2,
  Clock,
  Building2,
  X,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dividends = () => {
  const [dividends, setDividends] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [emitens, setEmitens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    cum_date: new Date().toISOString().split('T')[0],
    account_id: '',
    emiten_ticker: '',
    value_per_share: '',
    total_received: '',
    status: 'RECEIVED'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [divRes, accRes, emRes] = await Promise.all([
        axios.get('/api/dividends'),
        axios.get('/api/accounts'),
        axios.get('/api/emitens')
      ]);
      setDividends(divRes.data);
      setAccounts(accRes.data);
      setEmitens(emRes.data);
      if (accRes.data.length > 0 && !formData.account_id) {
        setFormData(prev => ({ ...prev, account_id: accRes.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch dividends data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        value_per_share: Number(formData.value_per_share),
        total_received: Number(formData.total_received)
      };

      if (editingId) {
        await axios.put(`/api/dividends/${editingId}`, payload);
      } else {
        await axios.post('/api/dividends', payload);
      }

      handleCloseModal();
      fetchData();
    } catch (err) {
      alert(editingId ? 'Gagal memperbarui dividen' : 'Gagal menambah dividen');
    }
  };

  const handleEditClick = (div) => {
    setEditingId(div.id);
    setFormData({
      cum_date: div.cum_date.split('T')[0],
      account_id: div.account_id,
      emiten_ticker: div.emiten_ticker,
      value_per_share: div.value_per_share,
      total_received: div.total_received,
      status: div.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus catatan dividen ini?')) return;
    try {
      await axios.delete(`/api/dividends/${id}`);
      fetchData();
    } catch (err) {
      alert('Gagal menghapus dividen');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      cum_date: new Date().toISOString().split('T')[0],
      account_id: accounts[0]?.id || '',
      emiten_ticker: '',
      value_per_share: '',
      total_received: '',
      status: 'RECEIVED'
    });
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Catatan Dividen</h2>
          <p className="text-slate-400 text-sm">Pantau pendapatan pasif dari investasi Anda</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          Tambah Dividen
        </button>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50">
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Cum Date</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Emiten</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Per Lembar</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Total Diterima</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {dividends.map((div) => (
                <tr key={div.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 text-slate-300">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      {new Date(div.cum_date).toLocaleDateString('id-ID')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-500/50" />
                      <span className="font-bold text-white">{div.emiten_ticker}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-300">
                    {Logic.formatIDR(div.value_per_share)}
                  </td>
                  <td className="px-6 py-4 text-right text-emerald-400 font-bold text-lg">
                    {Logic.formatIDR(div.total_received)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      div.status === 'RECEIVED' 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {div.status === 'RECEIVED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {div.status === 'RECEIVED' ? 'Diterima' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 transition-opacity">
                      <button 
                        onClick={() => handleEditClick(div)}
                        className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(div.id)}
                        className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {dividends.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-500">
                      <AlertCircle className="w-12 h-12 opacity-20" />
                      <p className="italic">Belum ada data dividen.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCloseModal}></div>
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{editingId ? 'Edit Dividen' : 'Tambah Dividen'}</h3>
              <button onClick={handleCloseModal} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Cum Date</label>
                  <input 
                    type="date" 
                    required 
                    value={formData.cum_date}
                    onChange={(e) => setFormData({...formData, cum_date: e.target.value})}
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

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Emiten</label>
                <input 
                  list="emiten-list"
                  required 
                  placeholder="Ketik kode saham (misal: BBCA)"
                  value={formData.emiten_ticker}
                  onChange={(e) => setFormData({...formData, emiten_ticker: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                />
                <datalist id="emiten-list">
                  {emitens.map(e => (
                    <option key={e.ticker} value={e.ticker}>{e.name}</option>
                  ))}
                </datalist>
                <p className="text-[10px] text-slate-500 ml-1 italic">* Ketik kode saham untuk mencari</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nilai per Lembar</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required 
                    placeholder="Contoh: 100.55"
                    value={formData.value_per_share}
                    onChange={(e) => setFormData({...formData, value_per_share: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Total Diterima</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required 
                    placeholder="Contoh: 100000.50"
                    value={formData.total_received}
                    onChange={(e) => setFormData({...formData, total_received: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Status</label>
                <select 
                  required 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="RECEIVED">RECEIVED (Diterima)</option>
                  <option value="PENDING">PENDING (Menunggu)</option>
                </select>
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
                {editingId ? 'Simpan Perubahan' : 'Simpan Dividen'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dividends;
