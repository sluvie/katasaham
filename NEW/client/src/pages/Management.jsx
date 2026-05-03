import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Wallet, 
  ShieldCheck, 
  UserPlus, 
  Settings2,
  Trash2,
  Building2,
  Palette,
  Search,
  Users,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  History,
  Percent,
  Calendar,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Management = () => {
  const [accounts, setAccounts] = useState([]);
  const [emitens, setEmitens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('accounts');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';
  
  const [accForm, setAccForm] = useState({
    id: '',
    name: '',
    broker: 'Mirae',
    color: '#6366f1'
  });
  
  const [selectedAccForFees, setSelectedAccForFees] = useState(null);
  const [feeHistory, setFeeHistory] = useState([]);
  const [feeForm, setFeeForm] = useState({
    buy_fee: '',
    sell_fee: '',
    effective_from: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const requests = [
        axios.get('/api/accounts'),
        axios.get('/api/emitens')
      ];
      
      if (isAdmin) {
        requests.push(axios.get('/api/admin/users'));
      }

      const responses = await Promise.all(requests);
      setAccounts(responses[0].data);
      setEmitens(responses[1].data);
      
      if (isAdmin && responses[2]) {
        setUsers(responses[2].data);
      }
    } catch (err) {
      console.error('Failed to fetch management data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, data) => {
    try {
      await axios.put(`/api/admin/users/${userId}`, data);
      fetchData();
    } catch (err) {
      alert('Gagal mengupdate user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Hapus user ini?')) return;
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus user');
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      const id = 'acc_' + Date.now();
      await axios.post('/api/accounts', { ...accForm, id });
      setAccForm({ id: '', name: '', broker: 'Mirae', color: '#6366f1' });
      fetchData();
    } catch (err) {
      alert('Gagal menambah akun');
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!confirm('Hapus akun ini?')) return;
    try {
      await axios.delete(`/api/accounts/${id}`);
      fetchData();
    } catch (err) {
      alert('Gagal menghapus akun');
    }
  };

  const fetchFeeHistory = async (accountId) => {
    try {
      const res = await axios.get(`/api/accounts/${accountId}/fees`);
      setFeeHistory(res.data);
    } catch (err) {
      console.error('Gagal mengambil riwayat fee', err);
    }
  };

  const handleOpenFees = (acc) => {
    setSelectedAccForFees(acc);
    fetchFeeHistory(acc.id);
    setFeeForm({
      buy_fee: '',
      sell_fee: '',
      effective_from: new Date().toISOString().split('T')[0]
    });
  };

  const handleAddFee = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/accounts/${selectedAccForFees.id}/fees`, feeForm);
      fetchFeeHistory(selectedAccForFees.id);
      setFeeForm({
        ...feeForm,
        buy_fee: '',
        sell_fee: ''
      });
    } catch (err) {
      alert('Gagal menambah setting fee');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div></div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Terminal Manajemen</h2>
        <p className="text-slate-400 text-sm">Kelola data master dan konfigurasi sistem Anda</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-900/50 border border-slate-800 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('accounts')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'accounts' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Profil & Akun
        </button>
        <button 
          onClick={() => setActiveTab('emitens')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'emitens' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Master Emiten
        </button>
        {isAdmin && (
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Manajemen User
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {activeTab === 'accounts' && (
          <>
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-400" />
                  Tambah Akun Baru
                </h3>
                <form onSubmit={handleAddAccount} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nama Akun</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Contoh: Suli Mandiri"
                      value={accForm.name}
                      onChange={(e) => setAccForm({...accForm, name: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Sekuritas</label>
                    <select 
                      value={accForm.broker}
                      onChange={(e) => setAccForm({...accForm, broker: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Mirae">Mirae Asset</option>
                      <option value="Stockbit">Stockbit</option>
                      <option value="Bions">Bions</option>
                      <option value="Ajaib">Ajaib</option>
                      <option value="Pina">Pina</option>
                      <option value="General">Lainnya</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
                      <Palette className="w-3 h-3" /> Warna Tema
                    </label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="color" 
                        value={accForm.color}
                        onChange={(e) => setAccForm({...accForm, color: e.target.value})}
                        className="w-12 h-12 bg-transparent border-none cursor-pointer"
                      />
                      <span className="text-xs text-slate-400">Pembeda di dashboard</span>
                    </div>
                  </div>
                  <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98]">
                    Tambah Akun
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="px-8 py-5 border-b border-slate-800">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    Daftar Akun Terdaftar
                  </h3>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {accounts.map(acc => (
                    <div key={acc.id} className="px-8 py-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors group">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: acc.color + '20', border: `1px solid ${acc.color}40` }}>
                          <Wallet className="w-6 h-6" style={{ color: acc.color }} />
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-indigo-400 transition-colors">{acc.name}</p>
                          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">{acc.broker}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenFees(acc)}
                          className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all"
                          title="Pengaturan Fee"
                        >
                          <Settings2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteAccount(acc.id)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {accounts.length === 0 && (
                    <div className="p-12 text-center text-slate-500 italic">
                      Belum ada akun. Silakan tambah akun pertama Anda.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'emitens' && (
          <div className="lg:col-span-3">
             <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Master Emiten</h3>
                      <p className="text-slate-400 text-sm">Total {emitens.length} emiten terdaftar</p>
                    </div>
                  </div>
                  
                  <div className="relative w-full md:w-96">
                    <input 
                      type="text" 
                      placeholder="Cari kode atau nama emiten..." 
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {emitens
                    .filter(e => 
                      e.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      e.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(e => (
                    <div key={e.ticker} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl hover:border-indigo-500/50 transition-all group flex flex-col items-center text-center">
                      <p className="text-lg font-black text-white group-hover:text-indigo-400 mb-1">{e.ticker}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase truncate w-full">{e.name}</p>
                      {e.board && (
                        <span className="mt-2 px-2 py-0.5 bg-slate-900 text-[8px] font-bold text-slate-400 rounded-md border border-slate-800">
                          {e.board}
                        </span>
                      )}
                    </div>
                  ))}
                  {emitens.length === 0 && !loading && (
                    <div className="col-span-full py-20 text-center text-slate-500 italic">
                      Data emiten tidak ditemukan.
                    </div>
                  )}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'users' && isAdmin && (
          <div className="lg:col-span-3">
             <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Manajemen User</h3>
                      <p className="text-slate-400 text-sm">Kelola akses dan perizinan pengguna</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 text-xs font-bold uppercase tracking-widest">
                        <th className="px-4 py-4">User</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-4 py-4">Role</th>
                        <th className="px-4 py-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {users.map(u => (
                        <tr key={u.id} className="group hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                {u.name?.charAt(0) || u.username?.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">{u.name}</p>
                                <p className="text-xs text-slate-500">@{u.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              u.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              u.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <select 
                              value={u.role}
                              onChange={(e) => handleUpdateUser(u.id, { role: e.target.value })}
                              className="bg-slate-950 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                            >
                              <option value="USER">USER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {u.status === 'PENDING' && (
                                <>
                                  <button 
                                    onClick={() => handleUpdateUser(u.id, { status: 'APPROVED' })}
                                    className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                    title="Setujui"
                                  >
                                    <CheckCircle2 className="w-5 h-5" />
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateUser(u.id, { status: 'REJECTED' })}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Tolak"
                                  >
                                    <XCircle className="w-5 h-5" />
                                  </button>
                                </>
                              )}
                              {u.id !== currentUser?.id && (
                                <button 
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                  title="Hapus User"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Fee Settings Modal */}
      {selectedAccForFees && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-10 py-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: selectedAccForFees.color + '20', border: `1px solid ${selectedAccForFees.color}40` }}>
                  <Settings2 className="w-6 h-6" style={{ color: selectedAccForFees.color }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Pengaturan Fee Sekuritas</h3>
                  <p className="text-sm text-slate-400">{selectedAccForFees.name} • <span className="uppercase tracking-widest text-[10px] font-bold">{selectedAccForFees.broker}</span></p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAccForFees(null)}
                className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-2xl transition-all"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-5 gap-10">
              {/* Form Column */}
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Tambah Setting Baru
                  </h4>
                  <form onSubmit={handleAddFee} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 flex items-center gap-1">
                          <Percent className="w-3 h-3" /> Fee Beli (%)
                        </label>
                        <input 
                          type="number" 
                          step="0.001"
                          required 
                          placeholder="0.15"
                          value={feeForm.buy_fee}
                          onChange={(e) => setFeeForm({...feeForm, buy_fee: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-1 flex items-center gap-1">
                          <Percent className="w-3 h-3" /> Fee Jual (%)
                        </label>
                        <input 
                          type="number" 
                          step="0.001"
                          required 
                          placeholder="0.25"
                          value={feeForm.sell_fee}
                          onChange={(e) => setFeeForm({...feeForm, sell_fee: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Berlaku Mulai
                      </label>
                      <input 
                        type="date" 
                        required 
                        value={feeForm.effective_from}
                        onChange={(e) => setFeeForm({...feeForm, effective_from: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2">
                      Simpan Perubahan <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-[10px] text-slate-500 leading-relaxed italic">
                      * Menyimpan setting baru akan secara otomatis memotong (cut-off) masa berlaku setting fee yang sedang aktif.
                    </p>
                  </form>
                </div>
              </div>

              {/* History Column */}
              <div className="lg:col-span-3 space-y-6">
                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <History className="w-4 h-4" /> Riwayat Perubahan
                </h4>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {feeHistory.map((fee, idx) => (
                    <div key={fee.id} className={`p-5 rounded-2xl border ${idx === 0 ? 'bg-indigo-500/5 border-indigo-500/30 ring-1 ring-indigo-500/20' : 'bg-slate-800/20 border-slate-800/50'} flex items-center justify-between relative overflow-hidden`}>
                      {idx === 0 && (
                        <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-500 text-[8px] font-black text-white rounded-bl-xl uppercase tracking-tighter">
                          Aktif
                        </div>
                      )}
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Buy / Sell</span>
                          <p className="text-lg font-black text-white">
                            {parseFloat(fee.buy_fee)}% <span className="text-slate-600 mx-1">/</span> {parseFloat(fee.sell_fee)}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Periode</span>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                          <span>{new Date(fee.effective_from).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <ChevronRight className="w-3 h-3 text-slate-600" />
                          <span>{fee.effective_to ? new Date(fee.effective_to).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Seterusnya'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {feeHistory.length === 0 && (
                    <div className="py-20 text-center bg-slate-800/10 rounded-3xl border border-dashed border-slate-800">
                      <p className="text-slate-500 italic text-sm text-balance">Belum ada riwayat fee. Silakan tambahkan setting pertama untuk akun ini.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Management;
