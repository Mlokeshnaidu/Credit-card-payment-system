import React, { useState, useEffect } from 'react';
import { cardAPI } from '../api/services';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

const initialForm = {
  card_number: '', card_holder_name: '', card_type: 'CREDIT',
  expiry_month: '', expiry_year: '', bank_name: '', is_default: false
};

export default function CardsPage() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchCards = async () => {
    try {
      const resp = await cardAPI.getCards();
      setCards(resp.data.cards || []);
    } catch { toast.error('Failed to load cards'); }
    setLoading(false);
  };

  useEffect(() => { fetchCards(); }, []);

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };

  const formatCardInput = (value) => {
    const clean = value.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(\d{4})/g, '$1 ').trim();
  };

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\s/g, '');
    setForm({ ...form, card_number: raw });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      await cardAPI.addCard(form);
      toast.success('Card added successfully');
      setForm(initialForm);
      setShowForm(false);
      fetchCards();
    } catch (err) {
      const data = err.response?.data;
      if (data) setErrors(data);
      toast.error(data?.card_number?.[0] || data?.non_field_errors?.[0] || 'Failed to add card');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id, masked) => {
    if (!window.confirm(`Remove card ${masked}?`)) return;
    try {
      await cardAPI.deleteCard(id);
      toast.success('Card removed');
      setCards(cards.filter(c => c.id !== id));
    } catch { toast.error('Failed to remove card'); }
  };

  const handleSetDefault = async (id) => {
    try {
      await cardAPI.setDefault(id);
      toast.success('Default card updated');
      fetchCards();
    } catch { toast.error('Failed to update default'); }
  };

  const years = Array.from({ length: 15 }, (_, i) => 2024 + i);

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">My Cards</h1>
            <p className="text-slate-400 mt-1">Manage your saved payment cards</p>
          </div>
          <button id="add-card-btn" onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : 'Add Card'}
          </button>
        </div>

        {showForm && (
          <div className="card-glass p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-5">Add New Card</h2>
            <div className="bg-yellow-950/40 border border-yellow-800/50 rounded-xl p-3 mb-5 text-sm text-yellow-300">
              Security: Only the last 4 digits are stored. No CVV is required or stored.
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Card Number</label>
                <input
                  id="card-number"
                  name="card_number"
                  type="text"
                  value={formatCardInput(form.card_number)}
                  onChange={handleCardNumberChange}
                  placeholder="1234 5678 9012 3456"
                  className="input-field font-mono"
                  maxLength={19}
                  required
                />
                {errors.card_number && (
                  <p className="text-red-400 text-xs mt-1">{errors.card_number[0] || errors.card_number}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Card Holder Name</label>
                  <input
                    id="card-holder-name"
                    name="card_holder_name"
                    type="text"
                    value={form.card_holder_name}
                    onChange={handleChange}
                    placeholder="JOHN DOE"
                    className="input-field uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Card Type</label>
                  <select id="card-type" name="card_type" value={form.card_type} onChange={handleChange} className="input-field">
                    <option value="CREDIT">Credit Card</option>
                    <option value="DEBIT">Debit Card</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Expiry Month</label>
                  <select id="expiry-month" name="expiry_month" value={form.expiry_month} onChange={handleChange} className="input-field" required>
                    <option value="">MM</option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Expiry Year</label>
                  <select id="expiry-year" name="expiry_year" value={form.expiry_year} onChange={handleChange} className="input-field" required>
                    <option value="">YYYY</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Bank Name</label>
                  <input
                    id="bank-name"
                    name="bank_name"
                    type="text"
                    value={form.bank_name}
                    onChange={handleChange}
                    placeholder="HDFC, SBI..."
                    className="input-field"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  id="is-default"
                  name="is_default"
                  type="checkbox"
                  checked={form.is_default}
                  onChange={handleChange}
                  className="w-4 h-4 rounded accent-blue-500"
                />
                <span className="text-sm text-slate-300">Set as default card</span>
              </label>

              <button id="submit-card-btn" type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? 'Adding...' : 'Add Card'}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500" />
          </div>
        ) : cards.length === 0 ? (
          <div className="card-glass p-12 text-center">
            <h3 className="text-xl font-semibold text-white mb-2">No cards added yet</h3>
            <p className="text-slate-400 mb-5">Add your first card to start making payments</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">Add Your First Card</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {cards.map((card) => (
              <div
                key={card.id}
                className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-800 to-slate-800 border border-blue-700/30 shadow-lg"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-8 translate-x-8" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-slate-500/10 rounded-full translate-y-8 -translate-x-8" />

                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-medium text-blue-300 bg-blue-900/50 px-2.5 py-1 rounded-full border border-blue-700/50">
                      {card.card_type}
                    </span>
                    {card.is_default && (
                      <span className="text-xs font-medium text-green-300 bg-green-900/50 px-2.5 py-1 rounded-full border border-green-700/50">
                        Default
                      </span>
                    )}
                  </div>

                  <p className="text-white font-mono text-lg tracking-widest mb-4">{card.masked_card_number}</p>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-slate-400 text-xs uppercase tracking-wider">Card Holder</p>
                      <p className="text-white font-medium mt-0.5">{card.card_holder_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-xs uppercase tracking-wider">Expires</p>
                      <p className="text-white font-medium mt-0.5">
                        {String(card.expiry_month).padStart(2, '0')}/{card.expiry_year}
                      </p>
                    </div>
                  </div>

                  {card.bank_name && (
                    <p className="text-slate-400 text-xs mt-2">{card.bank_name} Bank</p>
                  )}

                  <div className="flex gap-2 mt-5">
                    {!card.is_default && (
                      <button
                        onClick={() => handleSetDefault(card.id)}
                        className="flex-1 text-xs py-2 px-3 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-900 transition-colors border border-blue-700/30"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(card.id, card.masked_card_number)}
                      className="flex-1 text-xs py-2 px-3 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/60 transition-colors border border-red-800/30"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
