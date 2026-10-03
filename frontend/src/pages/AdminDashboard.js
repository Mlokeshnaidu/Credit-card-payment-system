import React, { useState, useEffect } from 'react';
import { adminAPI } from '../api/services';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const statusBadge = (s) => {
  if (s === 'SUCCESS') return <span className="badge-success">Success</span>;
  if (s === 'FAILED') return <span className="badge-failed">Failed</span>;
  return <span className="badge-pending">Pending</span>;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const resp = await adminAPI.getDashboard();
      setStats(resp.data);
    } catch { toast.error('Failed to load dashboard'); }
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const resp = await adminAPI.getUsers();
      setUsers(resp.data.users || []);
    } catch { toast.error('Failed to load users'); }
  };

  const fetchTransactions = async () => {
    try {
      const resp = await adminAPI.getTransactions();
      setTransactions(resp.data.transactions || []);
    } catch { toast.error('Failed to load transactions'); }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'users' && users.length === 0) fetchUsers();
    if (tab === 'transactions') fetchTransactions();
  };

  const handleToggleUser = async (id) => {
    try {
      const resp = await adminAPI.toggleUser(id);
      toast.success(resp.data.message);
      fetchUsers();
    } catch { toast.error('Failed to update user'); }
  };

  const handleExportCSV = async () => {
    try {
      const resp = await adminAPI.exportCSV();
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch { toast.error('Export failed'); }
  };

  const tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'users', label: 'Users' },
    { key: 'transactions', label: 'Transactions' },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">System overview and management</p>
        </div>

        <div className="flex gap-1 mb-6 bg-slate-800/60 p-1 rounded-xl w-fit">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === t.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500" />
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {[
                    { label: 'Total Users', value: stats.summary.total_users },
                    { label: 'Total Cards', value: stats.summary.total_cards },
                    { label: 'Transactions', value: stats.summary.total_transactions },
                    { label: "Today's Revenue", value: `Rs.${stats.summary.today.total_amount.toFixed(2)}` },
                  ].map(s => (
                    <div key={s.label} className="card-glass p-5">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{s.label}</p>
                      <p className="text-2xl font-bold text-white">{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="card-glass p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">
                    Today's Summary — {stats.summary.today.date}
                  </h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-900/20 rounded-xl border border-green-800/30">
                      <p className="text-2xl font-bold text-green-400">{stats.summary.today.successful}</p>
                      <p className="text-slate-400 text-sm">Successful</p>
                    </div>
                    <div className="text-center p-4 bg-red-900/20 rounded-xl border border-red-800/30">
                      <p className="text-2xl font-bold text-red-400">{stats.summary.today.failed}</p>
                      <p className="text-slate-400 text-sm">Failed</p>
                    </div>
                    <div className="text-center p-4 bg-blue-900/20 rounded-xl border border-blue-800/30">
                      <p className="text-2xl font-bold text-blue-400">{stats.summary.today.total_transactions}</p>
                      <p className="text-slate-400 text-sm">Total</p>
                    </div>
                  </div>
                </div>

                <div className="card-glass p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Weekly Activity</h2>
                  <div className="space-y-2">
                    {stats.weekly_summary.map(day => (
                      <div key={day.date} className="flex items-center gap-4 p-3 bg-slate-800/40 rounded-lg">
                        <span className="text-xs text-slate-400 w-24">{day.date}</span>
                        <div className="flex-1 bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${Math.min((day.transactions / 10) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-white w-16 text-right">{day.transactions} txns</span>
                        <span className="text-xs text-green-400 w-24 text-right">Rs.{day.total_amount.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="card-glass overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">User Management</h2>
                  <span className="text-sm text-slate-400">{users.length} users</span>
                </div>
                <table className="w-full">
                  <thead className="bg-slate-800/60">
                    <tr>
                      {['Email', 'Username', 'Full Name', 'Status', 'Joined', 'Action'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 text-sm text-white">{u.email}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">@{u.username}</td>
                        <td className="px-4 py-3 text-sm text-slate-300">{u.full_name}</td>
                        <td className="px-4 py-3">
                          {u.is_admin
                            ? <span className="text-xs text-blue-400 bg-blue-900/40 px-2 py-1 rounded-full">Admin</span>
                            : <span className={`text-xs px-2 py-1 rounded-full ${
                                u.is_active
                                  ? 'text-green-400 bg-green-900/40'
                                  : 'text-red-400 bg-red-900/40'
                              }`}>
                                {u.is_active ? 'Active' : 'Inactive'}
                              </span>
                          }
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {new Date(u.date_joined).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {!u.is_admin && (
                            <button
                              onClick={() => handleToggleUser(u.id)}
                              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                                u.is_active
                                  ? 'text-red-400 bg-red-900/30 hover:bg-red-900/60'
                                  : 'text-green-400 bg-green-900/30 hover:bg-green-900/60'
                              }`}
                            >
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">All Transactions</h2>
                  <button id="export-csv-btn" onClick={handleExportCSV} className="btn-primary text-sm py-2 px-4">
                    Export CSV
                  </button>
                </div>
                <div className="card-glass overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-800/60">
                      <tr>
                        {['Transaction ID', 'Amount', 'Card', 'Merchant', 'Status', 'Date'].map(h => (
                          <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {transactions.map(t => (
                        <tr key={t.id} className="hover:bg-slate-800/30">
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-blue-400">{t.transaction_id}</span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-white">
                            Rs.{parseFloat(t.amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-slate-400">
                            {t.card_details?.masked_card_number || '-'}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">{t.merchant_name || '-'}</td>
                          <td className="px-4 py-3">{statusBadge(t.status)}</td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {new Date(t.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {transactions.length === 0 && (
                    <div className="text-center py-10 text-slate-500">No transactions yet</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
