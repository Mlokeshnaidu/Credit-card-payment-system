import React, { useState, useEffect, useCallback } from 'react';
import { transactionAPI } from '../api/services';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const statusBadge = (s) => {
  if (s === 'SUCCESS') return <span className="badge-success">Success</span>;
  if (s === 'FAILED') return <span className="badge-failed">Failed</span>;
  return <span className="badge-pending">Pending</span>;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '', date_from: '', date_to: '', amount_min: '', amount_max: ''
  });
  const [pagination, setPagination] = useState({ page: 1, total_pages: 1, count: 0 });

  const fetchTransactions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        page_size: 10,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      };
      const resp = await transactionAPI.getTransactions(params);
      setTransactions(resp.data.results || []);
      setPagination({
        page: resp.data.page,
        total_pages: resp.data.total_pages,
        count: resp.data.count,
      });
    } catch { toast.error('Failed to load transactions'); }
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchTransactions(1); }, [fetchTransactions]);

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  const clearFilters = () => setFilters({ status: '', date_from: '', date_to: '', amount_min: '', amount_max: '' });

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Transaction History</h1>
          <p className="text-slate-400 mt-1">{pagination.count} total transactions</p>
        </div>

        <div className="card-glass p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Filter Transactions</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <select id="filter-status" name="status" value={filters.status} onChange={handleFilterChange} className="input-field text-sm py-2">
              <option value="">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </select>
            <input id="filter-date-from" name="date_from" type="date" value={filters.date_from} onChange={handleFilterChange} className="input-field text-sm py-2" />
            <input id="filter-date-to" name="date_to" type="date" value={filters.date_to} onChange={handleFilterChange} className="input-field text-sm py-2" />
            <input id="filter-amount-min" name="amount_min" type="number" value={filters.amount_min} onChange={handleFilterChange} className="input-field text-sm py-2" placeholder="Min Amount" />
            <input id="filter-amount-max" name="amount_max" type="number" value={filters.amount_max} onChange={handleFilterChange} className="input-field text-sm py-2" placeholder="Max Amount" />
          </div>
          <button onClick={clearFilters} className="mt-3 text-sm text-slate-400 hover:text-white transition-colors">
            Clear Filters
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="card-glass p-12 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">No transactions found</h3>
            <p className="text-slate-400">Try adjusting your filters or make a payment</p>
          </div>
        ) : (
          <>
            <div className="card-glass overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-800/80 border-b border-slate-700">
                  <tr>
                    {['Transaction ID', 'Merchant', 'Amount', 'Card', 'Status', 'Date'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-blue-400">{t.transaction_id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-white">{t.merchant_name || '-'}</p>
                        <p className="text-xs text-slate-500">{t.description}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-white">Rs.{parseFloat(t.amount).toFixed(2)}</span>
                        <span className="text-xs text-slate-500 ml-1">{t.currency}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-slate-300">
                          {t.card_details ? t.card_details.masked_card_number : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{statusBadge(t.status)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-400">{new Date(t.created_at).toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-5">
                <button
                  onClick={() => fetchTransactions(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-slate-400 text-sm">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <button
                  onClick={() => fetchTransactions(pagination.page + 1)}
                  disabled={pagination.page === pagination.total_pages}
                  className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
