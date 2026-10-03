import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navLinks = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/cards', label: 'My Cards' },
  { path: '/pay', label: 'Make Payment' },
  { path: '/transactions', label: 'Transactions' },
];

const adminLinks = [
  { path: '/admin', label: 'Admin Panel' },
];

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const links = isAdmin ? [...navLinks, ...adminLinks] : navLinks;

  return (
    <nav className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">CC<span className="text-blue-400">Pay</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${location.pathname === link.path
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:block text-sm text-slate-400">
              {user?.username}
              {isAdmin && (
                <span className="ml-1.5 text-xs bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded-full">Admin</span>
              )}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              Logout
            </button>
            <button
              className="md:hidden text-slate-400 text-lg"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? 'x' : '='}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden py-3 border-t border-slate-800 space-y-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                  ${location.pathname === link.path ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
