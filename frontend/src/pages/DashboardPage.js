import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, cardAPI, transactionAPI } from '../api/services';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { SpendingLineChart, CategoryPieChart, UtilizationGauge } from '../components/Charts';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [cards, setCards] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [utilizationData, setUtilizationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jwtError, setJwtError] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadStatement = async () => {
    setDownloadingPdf(true);
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const resp = await transactionAPI.downloadStatementPDF({ month, year });
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `monthly_statement_${year}_${String(month).padStart(2, '0')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Monthly statement PDF downloaded!');
    } catch (err) {
      console.error('Failed to download statement:', err);
      toast.error('Failed to generate monthly statement PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setJwtError(null);
    try {
      // 1. Fetch quick stats summary from FastAPI
      const summaryResp = await dashboardAPI.getSummary();
      setSummary(summaryResp.data);

      // 2. Fetch saved cards from Django (supplementary)
      try {
        const cardsResp = await cardAPI.getCards();
        setCards(cardsResp.data?.cards || (Array.isArray(cardsResp.data) ? cardsResp.data : []));
      } catch (cardErr) {
        console.warn('Unable to load cards list:', cardErr);
      }

      // 3. Fetch comprehensive analytics for charts
      try {
        const [monthResp, catResp, utilResp] = await Promise.allSettled([
          transactionAPI.getMonthlyAnalytics(6),
          transactionAPI.getCategoryAnalytics(),
          transactionAPI.getUtilizationAnalytics()
        ]);
        if (monthResp.status === 'fulfilled') setMonthlyData(monthResp.value.data?.monthly_summary || []);
        if (catResp.status === 'fulfilled') setCategoryData(catResp.value.data?.categories || []);
        if (utilResp.status === 'fulfilled') setUtilizationData(utilResp.value.data);
      } catch (analyticsErr) {
        console.warn('Unable to load analytics charts:', analyticsErr);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard summary:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setJwtError('Authentication failed: Your JWT token is missing, expired, or invalid. Please sign in again.');
      } else {
        setJwtError(err.response?.data?.detail || 'Failed to load dashboard statistics. Please ensure backend services are running.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLoginRedirect = () => {
    if (logout) logout();
    navigate('/login');
  };

  const statusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'SUCCESS') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
          Success
        </span>
      );
    }
    if (s === 'FAILED') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5"></span>
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-ping"></span>
        Pending
      </span>
    );
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount || 0);
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Loading skeleton component
  const SkeletonCard = () => (
    <div className="card-glass p-6 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-slate-700/80 rounded w-28"></div>
        <div className="w-8 h-8 bg-slate-700/60 rounded-lg"></div>
      </div>
      <div className="h-8 bg-slate-700 rounded w-36 mb-2"></div>
      <div className="h-3 bg-slate-800 rounded w-20"></div>
    </div>
  );

  const SkeletonRows = () => (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-700/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-700/70"></div>
            <div>
              <div className="h-4 bg-slate-700 rounded w-32 mb-1.5"></div>
              <div className="h-3 bg-slate-800 rounded w-24"></div>
            </div>
          </div>
          <div className="text-right">
            <div className="h-4 bg-slate-700 rounded w-20 mb-1.5 ml-auto"></div>
            <div className="h-5 bg-slate-800 rounded-full w-16 ml-auto"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Credit Card Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Welcome back, <span className="font-semibold text-blue-600 dark:text-blue-400">{user?.full_name || user?.username || 'Cardholder'}</span>. Here is your quick credit overview.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-3 items-center">
            {/* Download Statement PDF Button */}
            <button
              onClick={handleDownloadStatement}
              disabled={downloadingPdf}
              id="download-statement-btn"
              title="Download Monthly Statement (PDF)"
              className="inline-flex items-center px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium text-sm rounded-xl shadow-sm transition-all transform active:scale-95 disabled:opacity-50"
            >
              {downloadingPdf ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Statement (PDF)
                </>
              )}
            </button>

            <Link
              to="/pay"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-sm shadow-blue-500/30 transition-all transform active:scale-95"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Make Payment
            </Link>

            <button
              onClick={fetchDashboardData}
              title="Refresh Stats"
              className="p-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* JWT Failure Error Message */}
        {jwtError && (
          <div className="mb-8 p-5 bg-rose-950/60 border border-rose-600/50 rounded-2xl shadow-xl shadow-rose-950/40 backdrop-blur-md">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-rose-900/60 text-rose-400 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-rose-200">Authentication Error</h3>
                <p className="text-sm text-rose-300/90 mt-1">{jwtError}</p>
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={handleLoginRedirect}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow transition-colors"
                  >
                    Log In Again
                  </button>
                  <button
                    onClick={fetchDashboardData}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                  >
                    Retry Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 card-glass p-6">
                <div className="h-6 bg-slate-700/80 rounded w-44 mb-6"></div>
                <SkeletonRows />
              </div>
              <div className="card-glass p-6">
                <div className="h-6 bg-slate-700/80 rounded w-32 mb-6"></div>
                <div className="space-y-3">
                  <div className="h-28 bg-slate-800/60 rounded-xl animate-pulse"></div>
                  <div className="h-28 bg-slate-800/60 rounded-xl animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Required 4 Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {/* Stat 1: Total Spent */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-800/60 to-slate-900/90 border border-slate-700/60 p-6 backdrop-blur-xl shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Spent</span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-white tracking-tight">
                  {formatCurrency(summary?.total_amount_spent)}
                </p>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <span className="text-emerald-400 font-medium">All-time</span> successful charges
                </p>
              </div>

              {/* Stat 2: Available Credit */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-800/60 to-slate-900/90 border border-slate-700/60 p-6 backdrop-blur-xl shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider">Available Credit</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                  {formatCurrency(summary?.available_credit_limit)}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Remaining of ₹50,000.00 limit
                </p>
              </div>

              {/* Stat 3: Total Transactions */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-800/60 to-slate-900/90 border border-slate-700/60 p-6 backdrop-blur-xl shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Transactions</span>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-white tracking-tight">
                  {summary?.total_transactions ?? 0}
                </p>
                <div className="text-xs text-slate-400 mt-2">
                  <Link to="/transactions" className="text-purple-400 hover:underline">
                    View transaction history &rarr;
                  </Link>
                </div>
              </div>

              {/* Stat 4: This Month Spending */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/90 via-slate-800/60 to-slate-900/90 border border-slate-700/60 p-6 backdrop-blur-xl shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider">This Month Spending</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-amber-300 tracking-tight">
                  {formatCurrency(summary?.current_month_spending)}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Current billing cycle spending
                </p>
              </div>
            </div>

            {/* Interactive Analytics & Visual Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <SpendingLineChart data={monthlyData} title="Monthly Spending Trends (Line Chart)" />
              </div>
              <div>
                <UtilizationGauge
                  percentage={utilizationData?.overall_utilization_percentage || 0}
                  totalLimit={utilizationData?.total_credit_limit || 50000}
                  totalSpent={utilizationData?.total_spent || summary?.total_amount_spent || 0}
                />
              </div>
            </div>

            <div className="mb-8">
              <CategoryPieChart categories={categoryData} title="Category-Wise Expense Distribution (Pie Chart)" />
            </div>

            {/* Main Content Grid: Last 5 Transactions + Saved Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Last 5 Transactions Table / List (2 Cols) */}
              <div className="lg:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl shadow-xl">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <span>Recent Transactions</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Last 5
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Summary of your latest 5 processed card payments</p>
                  </div>
                  <Link
                    to="/transactions"
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
                  >
                    <span>All Transactions</span>
                    <span>&rarr;</span>
                  </Link>
                </div>

                {summary?.last_5_transactions && summary.last_5_transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          <th className="pb-3 pl-2">Masked Card</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 pr-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {summary.last_5_transactions.map((txn, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40 transition-colors group">
                            <td className="py-3.5 pl-2">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300 group-hover:border-blue-500/50 transition-colors">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="font-mono text-sm font-semibold text-slate-100">
                                    {txn.masked_card_number || txn.masked_card || '**** **** **** ****'}
                                  </p>
                                  <p className="text-xs text-slate-400 truncate max-w-[150px]">
                                    {txn.description || 'Card Payment'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 text-xs text-slate-300">
                              {formatDate(txn.date)}
                            </td>
                            <td className="py-3.5">
                              {statusBadge(txn.status)}
                            </td>
                            <td className="py-3.5 pr-2 text-right">
                              <p className="text-sm font-bold text-white">
                                {formatCurrency(txn.amount)}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 px-4 border border-dashed border-slate-800 rounded-xl">
                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 mb-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-base font-semibold text-slate-300">No Recent Transactions</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Transactions will appear here automatically once you process payments through your cards.
                    </p>
                    <Link
                      to="/pay"
                      className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Make First Payment
                    </Link>
                  </div>
                )}
              </div>

              {/* Sidebar: Saved Cards & Quick Actions (1 Col) */}
              <div className="space-y-6">
                {/* Saved Cards Panel */}
                <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl shadow-xl">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                    <h2 className="text-lg font-bold text-white">My Cards</h2>
                    <Link to="/cards" className="text-xs font-medium text-blue-400 hover:underline">
                      Manage
                    </Link>
                  </div>

                  {cards.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
                      <p className="text-xs text-slate-400 mb-2">No payment cards registered</p>
                      <Link
                        to="/cards"
                        className="text-xs text-blue-400 font-semibold hover:underline"
                      >
                        + Add a credit/debit card
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cards.slice(0, 3).map((card) => (
                        <div
                          key={card.id}
                          className="p-3.5 bg-gradient-to-r from-slate-800/80 to-slate-800/40 border border-slate-700/60 rounded-xl hover:border-slate-600 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm font-semibold tracking-wider text-slate-200">
                              {card.masked_card_number}
                            </span>
                            {card.is_default && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                            <span>{card.card_holder_name}</span>
                            <span className="font-mono">{card.expiry_month}/{card.expiry_year}</span>
                          </div>
                        </div>
                      ))}
                      {cards.length > 3 && (
                        <p className="text-xs text-center text-slate-500 pt-1">
                          +{cards.length - 3} more card{cards.length - 3 > 1 ? 's' : ''} in wallet
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Actions Panel */}
                <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl shadow-xl">
                  <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider text-slate-400">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    <Link
                      to="/pay"
                      className="flex items-center justify-between p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        Initiate Payment
                      </span>
                      <span>&rarr;</span>
                    </Link>
                    <Link
                      to="/cards"
                      className="flex items-center justify-between p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        Add New Card
                      </span>
                      <span>&rarr;</span>
                    </Link>
                    <Link
                      to="/transactions"
                      className="flex items-center justify-between p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                        Transaction History
                      </span>
                      <span>&rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
