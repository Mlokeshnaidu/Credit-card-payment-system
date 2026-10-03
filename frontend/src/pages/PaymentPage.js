import React, { useState, useEffect } from 'react';
import { cardAPI, transactionAPI } from '../api/services';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

export default function PaymentPage() {
  const [cards, setCards] = useState([]);
  const [form, setForm] = useState({
    card_id: '', amount: '', currency: 'INR',
    merchant_name: '', description: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    cardAPI.getCards().then(r => {
      const c = r.data.cards || [];
      setCards(c);
      const def = c.find(x => x.is_default) || c[0];
      if (def) setForm(f => ({ ...f, card_id: def.id }));
    }).catch(() => toast.error('Failed to load cards'));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.card_id) return toast.error('Please select a card');
    if (!form.amount || parseFloat(form.amount) <= 0) return toast.error('Enter a valid amount');

    setLoading(true);
    setResult(null);
    try {
      const resp = await transactionAPI.makePayment({
        ...form,
        card_id: parseInt(form.card_id),
        amount: parseFloat(form.amount),
      });
      setResult(resp.data);
      if (resp.data.transaction.status === 'SUCCESS') {
        toast.success('Payment successful');
      } else {
        toast.error(`Payment failed: ${resp.data.transaction.failure_reason || 'Unknown error'}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Payment failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Make a Payment</h1>
          <p className="text-slate-400 mt-1">Securely process your payment</p>
        </div>

        {cards.length === 0 ? (
          <div className="card-glass p-10 text-center">
            <h3 className="text-lg font-semibold text-white mb-2">No cards available</h3>
            <p className="text-slate-400 mb-5">Add a card first to make payments</p>
            <a href="/cards" className="btn-primary">Add a Card</a>
          </div>
        ) : (
          <>
            <div className="card-glass p-6 mb-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Select Card</label>
                  <div className="space-y-2">
                    {cards.map(card => (
                      <label
                        key={card.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
                          ${parseInt(form.card_id) === card.id
                            ? 'border-blue-500 bg-blue-950/40'
                            : 'border-slate-700 bg-slate-800/40 hover:border-slate-600'}`}
                      >
                        <input
                          type="radio"
                          name="card_id"
                          value={card.id}
                          checked={parseInt(form.card_id) === card.id}
                          onChange={handleChange}
                          className="accent-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-white font-mono font-medium">{card.masked_card_number}</p>
                          <p className="text-slate-400 text-xs">
                            {card.card_holder_name} - {card.card_type} - Exp {String(card.expiry_month).padStart(2, '0')}/{card.expiry_year}
                          </p>
                        </div>
                        {card.is_default && (
                          <span className="text-xs text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded-full">Default</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400 font-semibold">Rs.</span>
                    <input
                      id="payment-amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="1"
                      value={form.amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="input-field pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Merchant</label>
                    <input
                      id="merchant-name"
                      name="merchant_name"
                      type="text"
                      value={form.merchant_name}
                      onChange={handleChange}
                      placeholder="Amazon, Flipkart..."
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Currency</label>
                    <select id="currency" name="currency" value={form.currency} onChange={handleChange} className="input-field">
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Description (Optional)</label>
                  <input
                    id="description"
                    name="description"
                    type="text"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="What is this payment for?"
                    className="input-field"
                  />
                </div>

                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-xs text-slate-400">
                  Payment is processed securely via the FastAPI payment service. No CVV is required or stored.
                </div>

                <button
                  id="pay-btn"
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full text-base py-3"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Processing Payment...
                    </span>
                  ) : `Pay Rs.${form.amount || '0.00'}`}
                </button>
              </form>
            </div>

            {result && (
              <div className={`card-glass p-6 border-2 ${
                result.transaction.status === 'SUCCESS' ? 'border-green-700' : 'border-red-700'
              }`}>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-1">
                    Payment {result.transaction.status === 'SUCCESS' ? 'Successful' : 'Failed'}
                  </h3>
                  {result.transaction.failure_reason && (
                    <p className="text-red-400 text-sm mb-3">{result.transaction.failure_reason}</p>
                  )}
                  <div className="bg-slate-800 rounded-xl p-4 text-left space-y-2 text-sm mt-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Transaction ID</span>
                      <span className="text-white font-mono text-xs">{result.transaction.transaction_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount</span>
                      <span className="text-white font-semibold">Rs.{parseFloat(result.transaction.amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status</span>
                      <span className={result.transaction.status === 'SUCCESS' ? 'text-green-400' : 'text-red-400'}>
                        {result.transaction.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setResult(null);
                      setForm(f => ({ ...f, amount: '', merchant_name: '', description: '' }));
                    }}
                    className="btn-secondary mt-4"
                  >
                    Make Another Payment
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
