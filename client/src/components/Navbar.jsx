import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Extract initials for user avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Navigation */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2 text-xl font-bold tracking-tight hover:opacity-90 transition-opacity">
              <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">mini-Trello</span>
              <span className="text-xl">🗂️</span>
            </Link>

            <div className="hidden md:flex space-x-1">
              <Link
                to="/"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive('/') 
                    ? 'bg-slate-800 text-blue-400 border border-slate-700' 
                    : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive('/admin')
                      ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                      : 'text-slate-300 hover:bg-slate-850 hover:text-white'
                  }`}
                >
                  Admin Panel
                </Link>
              )}
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-slate-850 border border-slate-800 py-1.5 px-3 rounded-xl">
              {/* User Avatar */}
              <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-semibold text-sm shadow-md">
                {getInitials(user.name)}
              </div>
              
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-100">{user.name}</p>
                <span className={`inline-block px-2 py-0.5 mt-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  user.role === 'admin' 
                    ? 'bg-indigo-900/80 text-indigo-300 border border-indigo-700' 
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 hover:bg-red-950/40 hover:text-red-400 hover:border-red-900 transition-all duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
