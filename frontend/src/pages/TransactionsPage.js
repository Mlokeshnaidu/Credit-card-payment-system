import React, { useState, useEffect, useCallback } from 'react';
import { transactionAPI } from '../api/services';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const statusBadge = (s) => {
  const st = (s || '').toUpperCase();
  if (st === 'SUCCESS') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
        Success
      </span>
    );
  }
  if (st === 'FAILED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5"></span>
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-pulse"></span>
      Pending
    </span>
  );
};

const fraudStatusBadge = (fs) => {
  const s = (fs || 'CLEAN').toUpperCase();
  if (s === 'FLAGGED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600/30 text-rose-300 border border-rose-500/40" title="Flagged by real-time Fraud Engine">
        ⚠ FLAGGED
      </span>
    );
  }
  if (s === 'SUSPICIOUS') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600/30 text-amber-300 border border-amber-500/40" title="Suspicious pattern detected">
        ⚡ SUSPICIOUS
      </span>
    );
  }
  if (s === 'BLOCKED') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-700/40 text-red-300 border border-red-500/50" title="Blocked by Security Policy">
        🛑 BLOCKED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
      Clean
    </span>
  );
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    fraud_status: '',
    category: '',
    card_search: '',
    search: '',
    date_from: '',
    date_to: '',
    amount_min: '',
    amount_max: '',
  });
  const [ordering, setOrdering] = useState('-created_at');
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, count: 0 });

  const fetchTransactions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v !== null)
      );
      const params = {
        page,
        page_size: 10,
        ordering,
        ...cleanFilters,
      };
      const resp = await transactionAPI.getTransactions(params);
      setTransactions(resp.data.results || []);
      setPagination({
        page: resp.data.page,
        total_pages: resp.data.total_pages,
        count: resp.data.count,
      });
    } catch {
      toast.error('Failed to load transactions');
    }
    setLoading(false);
  }, [filters, ordering]);

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      fraud_status: '',
      category: '',
      card_search: '',
      search: '',
      date_from: '',
      date_to: '',
      amount_min: '',
      amount_max: '',
    });
    setOrdering('-created_at');
  };

  const handleSort = (field) => {
    if (ordering === field) {
      setOrdering(`-${field}`);
    } else if (ordering === `-${field}`) {
      setOrdering(field);
    } else {
      setOrdering(`-${field}`);
    }
  };

  const renderSortArrow = (field) => {
    if (ordering === field) return ' ↑';
    if (ordering === `-${field}`) return ' ↓';
    return '';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Transaction History</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Advanced search, security verification, and historical card payments ({pagination.count} records)
            </p>
          </div>
        </div>

        {/* Advanced Search & Filtering Matrix */}
        <div className="card-glass p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Advanced Search & Multi-Field Filters
            </h2>
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Masked Card Number Search */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Masked Card Number</label>
              <input
                id="filter-card-search"
                name="card_search"
                type="text"
                placeholder="Search **** 1234 or card..."
                value={filters.card_search}
                onChange={handleFilterChange}
                className="input-field text-xs py-2 w-full"
              />
            </div>

            {/* Keyword / Merchant / TXN ID Search */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Search Merchant / ID</label>
              <input
                id="filter-search"
                name="search"
                type="text"
                placeholder="Merchant, ID, Description..."
                value={filters.search}
                onChange={handleFilterChange}
                className="input-field text-xs py-2 w-full"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Payment Status</label>
              <select
                id="filter-status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="input-field text-xs py-2 w-full"
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            {/* Fraud Status Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Fraud Risk Status</label>
              <select
                id="filter-fraud-status"
                name="fraud_status"
                value={filters.fraud_status}
                onChange={handleFilterChange}
                className="input-field text-xs py-2 w-full"
              >
                <option value="">All Fraud Statuses</option>
                <option value="CLEAN">Clean</option>
                <option value="SUSPICIOUS">Suspicious</option>
                <option value="FLAGGED">Flagged</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Expense Category</label>
              <select
                id="filter-category"
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="input-field text-xs py-2 w-full"
              >
                <option value="">All Categories</option>
                <option value="SHOPPING">Shopping</option>
                <option value="DINING">Dining & Food</option>
                <option value="TRAVEL">Travel & Transport</option>
                <option value="GROCERIES">Groceries</option>
                <option value="ENTERTAINMENT">Entertainment</option>
                <option value="UTILITIES">Bills & Utilities</option>
                <option value="HEALTHCARE">Healthcare</option>
                <option value="OTHER">General / Other</option>
              </select>
            </div>

            {/* Date Range: From */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">From Date</label>
              <input
                id="filter-date-from"
                name="date_from"
                type="date"
                value={filters.date_from}
                onChange={handleFilterChange}
                className="input-field text-xs py-2 w-full"
              />
            </div>

            {/* Date Range: To */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">To Date</label>
              <input
                id="filter-date-to"
                name="date_to"
                type="date"
                value={filters.date_to}
                onChange={handleFilterChange}
                className="input-field text-xs py-2 w-full"
              />
            </div>

            {/* Amount Range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Min (₹)</label>
                <input
                  id="filter-amount-min"
                  name="amount_min"
                  type="number"
                  placeholder="Min"
                  value={filters.amount_min}
                  onChange={handleFilterChange}
                  className="input-field text-xs py-2 w-full"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Max (₹)</label>
                <input
                  id="filter-amount-max"
                  name="amount_max"
                  type="number"
                  placeholder="Max"
                  value={filters.amount_max}
                  onChange={handleFilterChange}
                  className="input-field text-xs py-2 w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table with Sortable Columns */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="card-glass p-12 text-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Transactions Found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
              No records match your active search and filter parameters. Try clearing your filters or making a new payment.
            </p>
          </div>
        ) : (
          <>
            <div className="card-glass overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700/80">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Transaction ID
                      </th>
                      <th
                        onClick={() => handleSort('merchant_name')}
                        className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-500 transition-colors"
                      >
                        Merchant / Category{renderSortArrow('merchant_name')}
                      </th>
                      <th
                        onClick={() => handleSort('amount')}
                        className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-500 transition-colors text-right"
                      >
                        Amount{renderSortArrow('amount')}
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Card
                      </th>
                      <th
                        onClick={() => handleSort('status')}
                        className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-500 transition-colors"
                      >
                        Status{renderSortArrow('status')}
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Fraud Status
                      </th>
                      <th
                        onClick={() => handleSort('created_at')}
                        className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-500 transition-colors text-right"
                      >
                        Date / Time{renderSortArrow('created_at')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-semibold">
                            {t.transaction_id}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {t.merchant_name || 'Card Payment'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                              {t.category || 'OTHER'}
                            </span>
                            <span className="text-xs text-slate-400 truncate max-w-[140px]">{t.description}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                            ₹{parseFloat(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[11px] text-slate-400 ml-1">{t.currency}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-mono text-slate-700 dark:text-slate-300 font-medium">
                            {t.card_details?.masked_card_number || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">{statusBadge(t.status)}</td>
                        <td className="px-4 py-3.5">{fraudStatusBadge(t.fraud_status)}</td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(t.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Server-Side Pagination */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-6 px-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Showing page <span className="font-bold text-slate-700 dark:text-slate-200">{pagination.page}</span> of{' '}
                  <span className="font-bold text-slate-700 dark:text-slate-200">{pagination.total_pages}</span> ({pagination.count} total records)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchTransactions(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="btn-secondary text-xs py-1.5 px-3.5 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchTransactions(pagination.page + 1)}
                    disabled={pagination.page >= pagination.total_pages}
                    className="btn-secondary text-xs py-1.5 px-3.5 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
