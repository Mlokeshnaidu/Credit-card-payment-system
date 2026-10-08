import React, { useState, useEffect } from 'react';
import { adminAPI } from '../api/services';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const statusBadge = (s) => {
  const st = (s || '').toUpperCase();
  if (st === 'SUCCESS') return <span className="badge-success">Success</span>;
  if (st === 'FAILED') return <span className="badge-failed">Failed</span>;
  return <span className="badge-pending">Pending</span>;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cards, setCards] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Card management states
  const [cardSearch, setCardSearch] = useState('');
  const [cardStatusFilter, setCardStatusFilter] = useState('all');
  const [editingLimitCard, setEditingLimitCard] = useState(null);
  const [newCreditLimit, setNewCreditLimit] = useState('');
  const [updatingLimit, setUpdatingLimit] = useState(false);
  const [activityCard, setActivityCard] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const resp = await adminAPI.getDashboard();
      setStats(resp.data);
    } catch {
      toast.error('Failed to load dashboard');
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const resp = await adminAPI.getUsers();
      setUsers(resp.data.users || []);
    } catch {
      toast.error('Failed to load users');
    }
  };

  const fetchTransactions = async () => {
    try {
      const resp = await adminAPI.getTransactions();
      setTransactions(resp.data.transactions || []);
    } catch {
      toast.error('Failed to load transactions');
    }
  };

  const fetchCards = async () => {
    try {
      const params = {};
      if (cardStatusFilter !== 'all') params.status = cardStatusFilter;
      if (cardSearch) params.search = cardSearch;
      const resp = await adminAPI.getCards(params);
      setCards(resp.data.cards || []);
    } catch {
      toast.error('Failed to load cards');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'users' && users.length === 0) fetchUsers();
    if (tab === 'transactions' && transactions.length === 0) fetchTransactions();
    if (tab === 'cards') fetchCards();
  };

  const handleToggleUser = async (id) => {
    try {
      const resp = await adminAPI.toggleUser(id);
      toast.success(resp.data.message);
      fetchUsers();
    } catch {
      toast.error('Failed to update user');
    }
  };

  const handleToggleCardBlock = async (card) => {
    const actionName = card.is_blocked ? 'unblock' : 'block';
    if (!window.confirm(`Are you sure you want to ${actionName} card ending in ${card.last_four_digits}?`)) {
      return;
    }
    try {
      const resp = await adminAPI.toggleCardBlock(card.id, {
        reason: card.is_blocked ? 'Admin requested unblock' : 'Security precaution / Admin block',
      });
      toast.success(resp.data.message);
      fetchCards();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${actionName} card`);
    }
  };

  const handleOpenLimitModal = (card) => {
    setEditingLimitCard(card);
    setNewCreditLimit(card.credit_limit || 50000);
  };

  const handleSaveCreditLimit = async (e) => {
    e.preventDefault();
    if (!editingLimitCard) return;
    const limitNum = parseFloat(newCreditLimit);
    if (isNaN(limitNum) || limitNum <= 0) {
      toast.error('Please enter a valid positive credit limit');
      return;
    }
    setUpdatingLimit(true);
    try {
      const resp = await adminAPI.updateCreditLimit(editingLimitCard.id, limitNum);
      toast.success(resp.data.message);
      setEditingLimitCard(null);
      fetchCards();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update credit limit');
    } finally {
      setUpdatingLimit(false);
    }
  };

  const handleViewCardActivity = async (card) => {
    setActivityCard(card);
    setLoadingActivity(true);
    try {
      const resp = await adminAPI.getCardActivity(card.id);
      setActivityData(resp.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load card activity');
      setActivityCard(null);
    } finally {
      setLoadingActivity(false);
    }
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
      toast.success('CSV exported successfully');
    } catch {
      toast.error('Export failed');
    }
  };

  const tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'cards', label: 'Card Management' },
    { key: 'users', label: 'Users' },
    { key: 'transactions', label: 'Transactions' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Admin Operations Panel</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Complete financial oversight, card control, and access monitoring</p>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-2 mb-8 bg-slate-200/80 dark:bg-slate-800/80 p-1.5 rounded-2xl w-fit border border-slate-300 dark:border-slate-700/60 shadow-sm">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === t.key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : (
          <>
            {/* TAB 1: OVERVIEW DASHBOARD */}
            {activeTab === 'dashboard' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {[
                    { label: 'Total Users', value: stats.summary.total_users, color: 'text-blue-500' },
                    { label: 'Total Cards', value: stats.summary.total_cards, color: 'text-indigo-500' },
                    { label: 'Transactions', value: stats.summary.total_transactions, color: 'text-emerald-500' },
                    { label: "Today's Volume", value: `₹${stats.summary.today.total_amount.toLocaleString()}`, color: 'text-violet-500' },
                  ].map((s) => (
                    <div key={s.label} className="card-glass p-5">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{s.label}</p>
                      <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                <div className="card-glass p-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                    Today's Activity Breakdown — {stats.summary.today.date}
                  </h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/30">
                      <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.summary.today.successful}</p>
                      <p className="text-slate-600 dark:text-slate-400 text-xs font-medium uppercase mt-1">Successful</p>
                    </div>
                    <div className="text-center p-4 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-800/30">
                      <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{stats.summary.today.failed}</p>
                      <p className="text-slate-600 dark:text-slate-400 text-xs font-medium uppercase mt-1">Failed</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800/30">
                      <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{stats.summary.today.total_transactions}</p>
                      <p className="text-slate-600 dark:text-slate-400 text-xs font-medium uppercase mt-1">Total</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CARD MANAGEMENT (SPRINT ITEM 4) */}
            {activeTab === 'cards' && (
              <div className="space-y-6">
                {/* Search and Filters Bar */}
                <div className="card-glass p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex-1 w-full md:w-auto relative">
                    <input
                      type="text"
                      placeholder="Search cardholder, last 4 digits, or owner email..."
                      value={cardSearch}
                      onChange={(e) => setCardSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchCards()}
                      className="input-field pl-10"
                    />
                    <svg className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto">
                    <select
                      value={cardStatusFilter}
                      onChange={(e) => {
                        setCardStatusFilter(e.target.value);
                      }}
                      className="input-field py-2.5 text-sm"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active Only</option>
                      <option value="blocked">Blocked Only</option>
                    </select>

                    <button
                      onClick={fetchCards}
                      className="btn-primary py-2.5 px-5 text-sm whitespace-nowrap"
                    >
                      Filter Cards
                    </button>
                  </div>
                </div>

                {/* Cards Table */}
                <div className="card-glass overflow-hidden">
                  <div className="p-5 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Registered Cards Directory</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage statuses, credit limits, and monitor transaction volumes</p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700">
                      {cards.length} cards loaded
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100/80 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700/60">
                        <tr>
                          {['Owner / Email', 'Cardholder', 'Card Number', 'Type / Bank', 'Credit Limit', 'Available', 'Status', 'Actions'].map((h) => (
                            <th key={h} className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider px-4 py-3.5">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 text-sm">
                        {cards.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3.5">
                              <p className="font-semibold text-slate-900 dark:text-white">{c.user_email || 'User ID: ' + c.user}</p>
                              {c.user_full_name && <p className="text-xs text-slate-500">{c.user_full_name}</p>}
                            </td>
                            <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                              {c.card_holder_name}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="font-mono text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-blue-400 rounded-md border border-slate-200 dark:border-slate-700">
                                {c.masked_card_number}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{c.card_type}</span>
                              <p className="text-xs text-slate-500">{c.bank_name || 'CCPay Bank'}</p>
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">
                              ₹{parseFloat(c.credit_limit || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-emerald-600 dark:text-emerald-400">
                              ₹{parseFloat(c.available_credit_limit || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5">
                              {c.is_blocked ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
                                  Blocked
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                {/* Toggle Block Button */}
                                <button
                                  onClick={() => handleToggleCardBlock(c)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    c.is_blocked
                                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                                  }`}
                                >
                                  {c.is_blocked ? 'Unblock' : 'Block'}
                                </button>

                                {/* Edit Limit Button */}
                                <button
                                  onClick={() => handleOpenLimitModal(c)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 transition-colors"
                                >
                                  Limit
                                </button>

                                {/* Activity Button */}
                                <button
                                  onClick={() => handleViewCardActivity(c)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors"
                                >
                                  Activity
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {cards.length === 0 && (
                      <div className="text-center py-12 text-slate-500">
                        No cards found matching your query.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: USERS */}
            {activeTab === 'users' && (
              <div className="card-glass overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">User Accounts</h2>
                  <span className="text-sm text-slate-500">{users.length} users</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800/60">
                      <tr>
                        {['Email', 'Username', 'Full Name', 'Status', 'Joined', 'Action'].map((h) => (
                          <th key={h} className="text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{u.email}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">@{u.username}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{u.full_name}</td>
                          <td className="px-4 py-3">
                            {u.is_admin ? (
                              <span className="text-xs font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400 px-2.5 py-1 rounded-full">Admin</span>
                            ) : (
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                u.is_active
                                  ? 'text-emerald-700 bg-emerald-100 dark:bg-green-900/40 dark:text-green-400'
                                  : 'text-rose-700 bg-rose-100 dark:bg-red-900/40 dark:text-red-400'
                              }`}>
                                {u.is_active ? 'Active' : 'Inactive'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {new Date(u.date_joined).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            {!u.is_admin && (
                              <button
                                onClick={() => handleToggleUser(u.id)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                                  u.is_active
                                    ? 'text-rose-700 bg-rose-100 hover:bg-rose-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/60'
                                    : 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/60'
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
              </div>
            )}

            {/* TAB 4: TRANSACTIONS */}
            {activeTab === 'transactions' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Transaction Ledger</h2>
                  <button id="export-csv-btn" onClick={handleExportCSV} className="btn-primary text-sm py-2 px-4 shadow-sm">
                    Export CSV
                  </button>
                </div>
                <div className="card-glass overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800/60">
                        <tr>
                          {['Transaction ID', 'Amount', 'Card', 'Merchant', 'Status', 'Date'].map((h) => (
                            <th key={h} className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase px-4 py-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {transactions.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/30">
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">{t.transaction_id}</span>
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-white">
                              ₹{parseFloat(t.amount).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-400">
                              {t.card_details?.masked_card_number || '-'}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{t.merchant_name || '-'}</td>
                            <td className="px-4 py-3">{statusBadge(t.status)}</td>
                            <td className="px-4 py-3 text-xs text-slate-500">
                              {new Date(t.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {transactions.length === 0 && (
                    <div className="text-center py-10 text-slate-500">No transactions recorded yet</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* MODAL 1: EDIT CREDIT LIMIT */}
        {editingLimitCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <div className="card-glass max-w-md w-full p-6 animate-scale-up border border-slate-300 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Update Credit Limit</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Card: <span className="font-mono font-bold text-blue-500">{editingLimitCard.masked_card_number}</span> ({editingLimitCard.card_holder_name})
              </p>

              <form onSubmit={handleSaveCreditLimit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    New Credit Limit (₹)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="1000"
                    max="10000000"
                    value={newCreditLimit}
                    onChange={(e) => setNewCreditLimit(e.target.value)}
                    required
                    className="input-field font-semibold text-lg"
                  />
                  <p className="text-xs text-slate-500 mt-1">Previous limit: ₹{parseFloat(editingLimitCard.credit_limit || 0).toLocaleString()}</p>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingLimitCard(null)}
                    className="btn-secondary text-sm py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingLimit}
                    className="btn-primary text-sm py-2 px-5"
                  >
                    {updatingLimit ? 'Saving...' : 'Save Limit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: CARD ACTIVITY MONITORING */}
        {activityCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <div className="card-glass max-w-2xl w-full p-6 animate-scale-up max-h-[90vh] overflow-y-auto border border-slate-300 dark:border-slate-700">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-4 mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Card Activity & Audit Trail</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {activityCard.masked_card_number} — {activityCard.card_holder_name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActivityCard(null);
                    setActivityData(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {loadingActivity || !activityData ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
                      <p className="text-xs text-slate-500 uppercase font-semibold">Total Txns</p>
                      <p className="text-xl font-extrabold text-slate-900 dark:text-white">{activityData.metrics.total_transactions}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl text-center">
                      <p className="text-xs text-emerald-600 uppercase font-semibold">Successful</p>
                      <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{activityData.metrics.success_count}</p>
                    </div>
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl text-center">
                      <p className="text-xs text-rose-600 uppercase font-semibold">Failed</p>
                      <p className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{activityData.metrics.failed_count}</p>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl text-center">
                      <p className="text-xs text-blue-600 uppercase font-semibold">Total Spent</p>
                      <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400">₹{activityData.metrics.total_spent.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Recent Transactions List */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Recent Card Transactions</h4>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-slate-800/80">
                          <tr>
                            <th className="p-2.5 font-bold text-slate-600 dark:text-slate-400">ID</th>
                            <th className="p-2.5 font-bold text-slate-600 dark:text-slate-400">Amount</th>
                            <th className="p-2.5 font-bold text-slate-600 dark:text-slate-400">Status</th>
                            <th className="p-2.5 font-bold text-slate-600 dark:text-slate-400">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {activityData.recent_transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40">
                              <td className="p-2.5 font-mono text-blue-500">{tx.transaction_id}</td>
                              <td className="p-2.5 font-bold">₹{parseFloat(tx.amount).toFixed(2)}</td>
                              <td className="p-2.5">{statusBadge(tx.status)}</td>
                              <td className="p-2.5 text-slate-500">{new Date(tx.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                          {activityData.recent_transactions.length === 0 && (
                            <tr>
                              <td colSpan="4" className="p-4 text-center text-slate-500">No transactions on this card yet</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Audit Logs */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Security & Activity Audit Logs</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {activityData.audit_logs.map((log) => (
                        <div key={log.id} className="p-2.5 bg-slate-100 dark:bg-slate-800/60 rounded-lg text-xs flex justify-between items-start gap-3">
                          <div>
                            <span className="font-bold text-blue-600 dark:text-blue-400 uppercase">{log.action}: </span>
                            <span className="text-slate-700 dark:text-slate-300">{log.description}</span>
                          </div>
                          <span className="text-slate-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))}
                      {activityData.audit_logs.length === 0 && (
                        <p className="text-xs text-slate-500 italic">No specific audit logs recorded for this card.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
