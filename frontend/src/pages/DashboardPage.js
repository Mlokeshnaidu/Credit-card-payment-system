import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cardAPI, transactionAPI } from '../api/services';
import Navbar from '../components/Navbar';

export default function DashboardPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cardResp, txResp] = await Promise.all([
          cardAPI.getCards(),
          transactionAPI.getTransactions({ page_size: 5 }),
        ]);
        setCards(cardResp.data.cards || []);
        setTransactions(txResp.data.results || []);
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, []);

  const totalSpent = transactions
    .filter(t => t.status === 'SUCCESS')
    .reduce((s, t) => s + parseFloat(t.amount), 0);
  const successCount = transactions.filter(t => t.status === 'SUCCESS').length;

  const StatCard = ({ label, value, link, linkLabel }) => (
    <div className="card-glass p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        {link && (
          <Link to={link} className="text-xs font-medium text-blue-400 hover:underline">{linkLabel}</Link>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );

  const statusBadge = (s) => {
    if (s === 'SUCCESS') return <span className="badge-success">Success</span>;
    if (s === 'FAILED') return <span className="badge-failed">Failed</span>;
    return <span className="badge-pending">Pending</span>;
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Good day, <span className="text-blue-400">{user?.full_name || user?.username}</span>
          </h1>
          <p className="text-slate-400 mt-1">Here is an overview of your account</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              <StatCard label="Saved Cards" value={cards.length} link="/cards" linkLabel="Manage" />
              <StatCard label="Total Spent" value={`Rs.${totalSpent.toFixed(2)}`} />
              <StatCard label="Transactions" value={transactions.length} link="/transactions" linkLabel="View All" />
              <StatCard label="Successful" value={successCount} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card-glass p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
                  <Link to="/transactions" className="text-blue-400 text-sm hover:underline">View All</Link>
                </div>
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p className="mb-2 text-sm">No transactions yet</p>
                    <Link to="/pay" className="text-blue-400 text-sm hover:underline">Make your first payment</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 bg-slate-700/40 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-white">{t.merchant_name || t.description || 'Payment'}</p>
                          <p className="text-xs text-slate-400">{new Date(t.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">Rs.{parseFloat(t.amount).toFixed(2)}</p>
                          {statusBadge(t.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card-glass p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">My Cards</h2>
                  <Link to="/cards" className="text-blue-400 text-sm hover:underline">Manage</Link>
                </div>
                {cards.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <p className="mb-2 text-sm">No cards added</p>
                    <Link to="/cards" className="text-blue-400 text-sm hover:underline">Add a card</Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cards.slice(0, 3).map((card) => (
                      <div key={card.id} className="p-4 bg-gradient-to-r from-blue-900/50 to-slate-800/50 border border-blue-800/30 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-mono font-medium">{card.masked_card_number}</p>
                            <p className="text-xs text-slate-400 mt-1">{card.card_holder_name} - {card.bank_name || card.card_type}</p>
                          </div>
                          <div className="text-right">
                            {card.is_default && (
                              <span className="text-xs text-blue-400 bg-blue-900/50 px-2 py-1 rounded-full">Default</span>
                            )}
                            <p className="text-xs text-slate-400 mt-1">{card.expiry_month}/{card.expiry_year}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 card-glass p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <Link to="/pay" className="btn-primary">Make Payment</Link>
                <Link to="/cards" className="btn-secondary">Add Card</Link>
                <Link to="/transactions" className="btn-secondary">View History</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
