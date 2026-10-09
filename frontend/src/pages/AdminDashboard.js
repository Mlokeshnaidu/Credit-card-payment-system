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

const roleBadge = (role) => {
  const r = (role || 'CUSTOMER').toUpperCase();
  if (r === 'ADMIN') {
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">Admin</span>;
  }
  if (r === 'SUPPORT') {
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">Support</span>;
  }
  if (r === 'READ_ONLY') {
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Read-Only</span>;
  }
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/40 text-slate-400 border border-slate-700">Customer</span>;
};

const fraudRiskBadge = (score) => {
  const num = parseInt(score, 10) || 0;
  if (num >= 70) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">High Risk ({num}/100)</span>;
  }
  if (num >= 35) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Moderate ({num}/100)</span>;
  }
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Low Risk ({num}/100)</span>;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cards, setCards] = useState([]);
  const [fraudLogs, setFraudLogs] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
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

  // Fraud Review Modal
  const [reviewingLog, setReviewingLog] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('CONFIRMED_FRAUD');
  const [reviewNotes, setReviewNotes] = useState('');
  const [blockCardOnReview, setBlockCardOnReview] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Health auto-refresh interval
  const [healthLoading, setHealthLoading] = useState(false);

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

  const fetchFraudLogs = async () => {
    try {
      const resp = await adminAPI.getFraudLogs();
      setFraudLogs(resp.data.fraud_logs || []);
    } catch {
      toast.error('Failed to load fraud logs');
    }
  };

  const fetchSystemHealth = async () => {
    setHealthLoading(true);
    try {
      const resp = await adminAPI.getSystemHealth();
      setSystemHealth(resp.data);
    } catch {
      toast.error('Failed to ping system health');
    } finally {
      setHealthLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'users' && users.length === 0) fetchUsers();
    if (tab === 'transactions' && transactions.length === 0) fetchTransactions();
    if (tab === 'cards') fetchCards();
    if (tab === 'fraud') fetchFraudLogs();
    if (tab === 'health') fetchSystemHealth();
  };

  const handleToggleUser = async (id) => {
    try {
      const resp = await adminAPI.toggleUser(id);
      toast.success(resp.data.message);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const resp = await adminAPI.updateUserRole(userId, newRole);
      toast.success(resp.data.message);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update user role');
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

  const handleOpenFraudReview = (log) => {
    setReviewingLog(log);
    setReviewStatus(log.review_status === 'PENDING_REVIEW' ? 'CONFIRMED_FRAUD' : log.review_status);
    setReviewNotes(log.review_notes || '');
    setBlockCardOnReview(false);
  };

  const handleSaveFraudReview = async (e) => {
    e.preventDefault();
    if (!reviewingLog) return;
    setSubmittingReview(true);
    try {
      const resp = await adminAPI.reviewFraudLog(reviewingLog.id, {
        review_status: reviewStatus,
        review_notes: reviewNotes,
        block_card: blockCardOnReview,
      });
      toast.success(resp.data.message);
      setReviewingLog(null);
      fetchFraudLogs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit fraud review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Export Handlers
  const handleExportCSV = async () => {
    try {
      const resp = await adminAPI.exportCSV();
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Transactions CSV exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleExportAnalyticsCSV = async () => {
    try {
      const resp = await adminAPI.exportAnalyticsCSV();
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_summary_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Analytics Summary CSV exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleExportAnalyticsPDF = async () => {
    try {
      const resp = await adminAPI.exportAnalyticsPDF();
      const url = window.URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_summary_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Executive Analytics PDF downloaded');
    } catch {
      toast.error('PDF export failed');
    }
  };

  const tabs = [
    { key: 'dashboard', label: 'Overview' },
    { key: 'cards', label: 'Card Management' },
    { key: 'users', label: 'RBAC & Users' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'fraud', label: 'Fraud Detection' },
    { key: 'health', label: 'System Health' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Title and Global Export Options */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Admin & Security Operations</h1>
              {stats?.user_role && roleBadge(stats.user_role)}
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Role-Based Access Control, Real-Time Fraud Shield, System Health & Financial Analytics
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-sm transition-all"
            >
              Export Txns CSV
            </button>
            <button
              onClick={handleExportAnalyticsCSV}
              className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-all"
            >
              Summary CSV
            </button>
            <button
              onClick={handleExportAnalyticsPDF}
              className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all"
            >
              Summary PDF 📄
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex flex-wrap gap-2 mb-8 bg-slate-200/80 dark:bg-slate-800/80 p-1.5 rounded-2xl w-fit border border-slate-300 dark:border-slate-700/60 shadow-sm">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === t.key
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              {t.label}
              {t.key === 'fraud' && stats?.summary?.fraud_alerts?.pending > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-extrabold animate-pulse">
                  {stats.summary.fraud_alerts.pending}
                </span>
              )}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="card-glass p-6 md:col-span-2">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
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

                  <div className="card-glass p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                        Fraud Shield Status
                      </h3>
                      <p className="text-xs text-slate-400 mb-4">Active real-time evaluation engine</p>
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Pending Reviews:</span>
                          <span className="font-extrabold text-rose-400">{stats.summary.fraud_alerts?.pending ?? 0}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Total Flagged:</span>
                          <span className="font-bold text-slate-200">{stats.summary.fraud_alerts?.total ?? 0}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTabChange('fraud')}
                      className="mt-4 w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition-colors"
                    >
                      Review Fraud Attempts &rarr;
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CARD MANAGEMENT */}
            {activeTab === 'cards' && (
              <div className="space-y-6">
                <div className="card-glass p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex-1 w-full md:w-auto relative">
                    <input
                      type="text"
                      placeholder="Search by cardholder, masked number, last 4 digits..."
                      value={cardSearch}
                      onChange={(e) => setCardSearch(e.target.value)}
                      className="input-field text-sm py-2.5 w-full"
                    />
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <select
                      value={cardStatusFilter}
                      onChange={(e) => setCardStatusFilter(e.target.value)}
                      className="input-field text-sm py-2.5"
                    >
                      <option value="all">All Card Statuses</option>
                      <option value="active">Active Only</option>
                      <option value="blocked">Blocked Only</option>
                    </select>
                    <button onClick={fetchCards} className="btn-primary text-sm py-2.5 px-5">
                      Search
                    </button>
                  </div>
                </div>

                <div className="card-glass overflow-hidden shadow-xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/80">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Card Details</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cardholder / Bank</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Credit Limit</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                      {cards.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3.5">
                            <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">
                              {c.masked_card_number}
                            </span>
                            <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                              {c.card_type}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-medium text-slate-900 dark:text-white">{c.card_holder_name}</p>
                            <p className="text-xs text-slate-400">{c.bank_name || 'Standard Bank'}</p>
                          </td>
                          <td className="px-4 py-3.5 text-right font-extrabold text-slate-900 dark:text-white">
                            ₹{parseFloat(c.credit_limit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3.5">
                            {c.is_blocked ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                Blocked
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleViewCardActivity(c)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 transition-colors"
                              >
                                Activity
                              </button>
                              <button
                                onClick={() => handleOpenLimitModal(c)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-colors"
                              >
                                Edit Limit
                              </button>
                              <button
                                onClick={() => handleToggleCardBlock(c)}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                                  c.is_blocked
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                                }`}
                              >
                                {c.is_blocked ? 'Unblock' : 'Block'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: RBAC & USERS MANAGEMENT */}
            {activeTab === 'users' && (
              <div className="card-glass overflow-hidden shadow-xl">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                      Role-Based Access Control (RBAC) User Directory
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Admin, Support, Read-Only, and Customer authorization</p>
                  </div>
                  <button onClick={fetchUsers} className="btn-secondary text-xs py-1.5 px-3">
                    Refresh Directory
                  </button>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/80">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Current Role</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assign Role</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-900 dark:text-white">{u.full_name || u.username}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </td>
                        <td className="px-4 py-3.5">{roleBadge(u.role)}</td>
                        <td className="px-4 py-3.5">
                          <select
                            value={u.role || 'CUSTOMER'}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="input-field text-xs py-1 px-2.5 rounded-lg font-semibold"
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="SUPPORT">Support</option>
                            <option value="READ_ONLY">Read-Only</option>
                            <option value="CUSTOMER">Customer</option>
                          </select>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                            u.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {u.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => handleToggleUser(u.id)}
                            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                              u.is_active
                                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 4: TRANSACTIONS MONITOR */}
            {activeTab === 'transactions' && (
              <div className="card-glass overflow-hidden shadow-xl">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Real-Time Transaction Ledger
                  </h2>
                  <button onClick={fetchTransactions} className="btn-secondary text-xs py-1.5 px-3">
                    Refresh Ledger
                  </button>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/80">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Transaction ID</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Amount</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fraud Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-xs text-blue-500 font-semibold">{t.transaction_id}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-slate-300">{t.user_email || t.merchant_name}</td>
                        <td className="px-4 py-3.5 text-right font-extrabold text-slate-900 dark:text-white">
                          ₹{parseFloat(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5 text-xs font-medium text-slate-400">{t.category || 'OTHER'}</td>
                        <td className="px-4 py-3.5">{statusBadge(t.status)}</td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.fraud_status === 'FLAGGED' ? 'bg-rose-500/20 text-rose-400' :
                            t.fraud_status === 'SUSPICIOUS' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {t.fraud_status || 'CLEAN'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 5: FRAUD DETECTION & LOGS */}
            {activeTab === 'fraud' && (
              <div className="space-y-6">
                <div className="card-glass p-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Detected Fraud Attempts & Anomaly Log
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Review rule-triggered alerts: rapid high-value transactions, cross-location velocity, device anomalies
                    </p>
                  </div>
                  <button onClick={fetchFraudLogs} className="btn-secondary text-xs py-1.5 px-3">
                    Refresh Alerts
                  </button>
                </div>

                <div className="card-glass overflow-hidden shadow-xl">
                  {fraudLogs.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      <p className="text-base font-semibold text-slate-300">No Fraud Alerts Detected</p>
                      <p className="text-xs mt-1">All payment transactions are evaluated clean against fraud rule thresholds.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/80">
                        <tr>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Alert ID / TXN</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Triggered Rule</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Risk Level</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Card / Location</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Review Status</th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                        {fraudLogs.map((fl) => (
                          <tr key={fl.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3.5">
                              <span className="font-mono text-xs text-rose-400 font-bold block">#{fl.id}</span>
                              <span className="font-mono text-[11px] text-slate-400">{fl.transaction_id}</span>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="font-bold text-slate-900 dark:text-white text-xs">{fl.rule_triggered}</p>
                              <p className="text-[11px] text-slate-400 truncate max-w-[200px]" title={fl.details}>{fl.details}</p>
                            </td>
                            <td className="px-4 py-3.5">{fraudRiskBadge(fl.risk_score)}</td>
                            <td className="px-4 py-3.5 text-xs text-slate-300">
                              <p className="font-mono">{fl.masked_card_number || 'Card N/A'}</p>
                              <p className="text-slate-500">{fl.location || 'Local'}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                fl.review_status === 'CONFIRMED_FRAUD' ? 'bg-rose-500/20 text-rose-400' :
                                fl.review_status === 'DISMISSED' ? 'bg-slate-700/50 text-slate-400' : 'bg-amber-500/20 text-amber-400 animate-pulse'
                              }`}>
                                {fl.review_status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() => handleOpenFraudReview(fl)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: SYSTEM HEALTH MONITORING */}
            {activeTab === 'health' && (
              <div className="space-y-6">
                <div className="card-glass p-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Live System Health & Infrastructure Latency
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Response time metrics, database connectivity, gateway status, and error telemetry
                    </p>
                  </div>
                  <button
                    onClick={fetchSystemHealth}
                    disabled={healthLoading}
                    className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
                  >
                    {healthLoading ? 'Pinging...' : 'Refresh Health'}
                  </button>
                </div>

                {systemHealth && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      {/* Service 1: Django Core */}
                      <div className="card-glass p-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Core REST API</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {systemHealth.services?.django_api?.status || 'Active'}
                          </span>
                        </div>
                        <p className="text-3xl font-extrabold text-blue-500">
                          {systemHealth.services?.django_api?.avg_response_time_ms_1h || 12.4} ms
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          Avg Response Time (1h) | Error Rate: {systemHealth.services?.django_api?.error_rate_percentage || 0}%
                        </p>
                      </div>

                      {/* Service 2: Database */}
                      <div className="card-glass p-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Database Engine</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {systemHealth.services?.database?.status || 'Connected'}
                          </span>
                        </div>
                        <p className="text-3xl font-extrabold text-indigo-400">
                          {systemHealth.services?.database?.ping_latency_ms || 1.8} ms
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          Engine: {systemHealth.services?.database?.engine || 'MySQL'} | Query Ping
                        </p>
                      </div>

                      {/* Service 3: FastAPI Gateway */}
                      <div className="card-glass p-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment Gateway</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {systemHealth.services?.fastapi_payment_gateway?.status || 'Online'}
                          </span>
                        </div>
                        <p className="text-3xl font-extrabold text-teal-400">
                          {systemHealth.services?.fastapi_payment_gateway?.ping_latency_ms || 24.1} ms
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          Endpoint: {systemHealth.services?.fastapi_payment_gateway?.url}
                        </p>
                      </div>
                    </div>

                    {/* Recent Errors & Failures Telemetry */}
                    <div className="card-glass p-6">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                        Recent Failures & Telemetry Exceptions
                      </h3>
                      {!systemHealth.recent_errors || systemHealth.recent_errors.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                          <p className="text-sm font-semibold text-emerald-400">Zero System Errors Logged</p>
                          <p className="text-xs text-slate-500 mt-1">All incoming API endpoints are responding within normal parameters.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-400 border-b border-slate-700">
                              <tr>
                                <th className="px-3 py-2">Endpoint</th>
                                <th className="px-3 py-2">Method</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2">Latency</th>
                                <th className="px-3 py-2">Message</th>
                                <th className="px-3 py-2 text-right">Time</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                              {systemHealth.recent_errors.map((err, i) => (
                                <tr key={i} className="hover:bg-slate-800/40">
                                  <td className="px-3 py-2.5 font-mono text-rose-400">{err.endpoint}</td>
                                  <td className="px-3 py-2.5 font-bold">{err.method}</td>
                                  <td className="px-3 py-2.5 text-rose-400 font-extrabold">{err.status_code}</td>
                                  <td className="px-3 py-2.5 font-mono">{err.response_time_ms}ms</td>
                                  <td className="px-3 py-2.5 text-slate-400 truncate max-w-[200px]">{err.error_message}</td>
                                  <td className="px-3 py-2.5 text-right text-slate-500">
                                    {new Date(err.timestamp).toLocaleTimeString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Credit Limit Edit Modal */}
      {editingLimitCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Update Credit Limit</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Card: <span className="font-mono text-slate-700 dark:text-slate-200">{editingLimitCard.masked_card_number}</span> ({editingLimitCard.card_holder_name})
            </p>
            <form onSubmit={handleSaveCreditLimit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Sanctioned Limit (₹)
                </label>
                <input
                  type="number"
                  step="1000"
                  min="1000"
                  max="10000000"
                  value={newCreditLimit}
                  onChange={(e) => setNewCreditLimit(e.target.value)}
                  className="input-field text-sm py-2.5 w-full font-bold"
                  placeholder="e.g. 75000"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLimitCard(null)}
                  className="btn-secondary text-xs py-2 px-4"
                  disabled={updatingLimit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-2 px-5"
                  disabled={updatingLimit}
                >
                  {updatingLimit ? 'Updating...' : 'Save Limit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fraud Alert Review Modal */}
      {reviewingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Fraud Alert Review #{reviewingLog.id}</h3>
              {fraudRiskBadge(reviewingLog.risk_score)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Rule: <span className="font-bold text-rose-400">{reviewingLog.rule_triggered}</span> | TXN: <span className="font-mono">{reviewingLog.transaction_id}</span>
            </p>

            <form onSubmit={handleSaveFraudReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Review Resolution Status</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  className="input-field text-xs py-2 w-full"
                >
                  <option value="CONFIRMED_FRAUD">Confirmed Fraud</option>
                  <option value="DISMISSED">Dismissed / False Positive</option>
                  <option value="PENDING_REVIEW">Pending Further Review</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Investigation Notes</label>
                <textarea
                  rows="3"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Document investigative findings or user contact logs..."
                  className="input-field text-xs py-2 w-full"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="block_card_check"
                  checked={blockCardOnReview}
                  onChange={(e) => setBlockCardOnReview(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="block_card_check" className="text-xs font-bold text-rose-500">
                  Immediately Block Card to prevent further unauthorized charges
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReviewingLog(null)}
                  className="btn-secondary text-xs py-2 px-4"
                  disabled={submittingReview}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-2 px-5 bg-rose-600 hover:bg-rose-500"
                  disabled={submittingReview}
                >
                  {submittingReview ? 'Submitting...' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Card Activity Modal */}
      {activityCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Card Activity & Audit Trail</h3>
                <p className="text-xs font-mono text-slate-400">{activityCard.masked_card_number} ({activityCard.card_holder_name})</p>
              </div>
              <button onClick={() => setActivityCard(null)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            {loadingActivity ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
              </div>
            ) : activityData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                    <span className="text-xs text-slate-400 block">Total Spent</span>
                    <span className="text-sm font-bold text-emerald-400">₹{activityData.metrics.total_spent.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                    <span className="text-xs text-slate-400 block">Available Limit</span>
                    <span className="text-sm font-bold text-blue-400">₹{activityData.metrics.available_credit_limit.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                    <span className="text-xs text-slate-400 block">Transactions</span>
                    <span className="text-sm font-bold text-white">{activityData.metrics.total_transactions}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Audit Action Trail</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activityData.audit_logs.map((log) => (
                      <div key={log.id} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50 text-xs">
                        <div className="flex justify-between font-semibold text-slate-300">
                          <span>{log.action}</span>
                          <span className="text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-400 mt-0.5">{log.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
