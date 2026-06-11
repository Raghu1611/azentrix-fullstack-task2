import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';

export default function AdminPanel() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.users);
    } catch (err) {
      setError('Failed to fetch user directory');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = async (user) => {
    setError('');
    setSuccess('');
    const newRole = user.role === 'admin' ? 'member' : 'admin';

    // Prevent changing own role (otherwise could lose admin permissions)
    if (user.id === currentUser.id) {
      setError('Cannot change your own role.');
      return;
    }

    try {
      const response = await api.patch(`/users/${user.id}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? response.data.user : u))
      );
      setSuccess(`Updated ${user.name}'s role to ${newRole}`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const triggerDeleteUser = (user) => {
    if (user.id === currentUser.id) {
      setError('Cannot delete your own account.');
      return;
    }
    setUserToDelete(user);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/users/${userToDelete.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setSuccess(`Successfully deleted account for ${userToDelete.name}`);
      setTimeout(() => setSuccess(''), 4000);
      setIsConfirmOpen(false);
      setUserToDelete(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            User Administration
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage system users, toggle administrative privileges, or remove accounts.
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-red-950/40 border border-red-900 text-red-400 px-4 py-3 rounded-xl text-sm mb-6 max-w-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-950/40 border border-emerald-900 text-emerald-400 px-4 py-3 rounded-xl text-sm mb-6 max-w-lg">
            {success}
          </div>
        )}

        {/* Content Table */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-850">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      User Name
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Email Address
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      System Role
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Joined Date
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((user) => {
                    const isSelf = user.id === currentUser.id;
                    return (
                      <tr key={user.id} className="hover:bg-slate-850/40 transition duration-150">
                        {/* Name */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-100 flex items-center gap-2">
                          {user.name}
                          {isSelf && (
                            <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full font-bold uppercase">
                              You
                            </span>
                          )}
                        </td>
                        
                        {/* Email */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {user.email}
                        </td>
                        
                        {/* Role badge */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            user.role === 'admin' 
                              ? 'bg-indigo-900/40 text-indigo-300 border-indigo-900' 
                              : 'bg-emerald-950/40 text-emerald-400 border-emerald-900'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        
                        {/* Joined at */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </td>
                        
                        {/* Action buttons */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                          <button
                            onClick={() => handleRoleToggle(user)}
                            disabled={isSelf}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition duration-200 ${
                              isSelf
                                ? 'text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                                : 'text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            Toggle Role
                          </button>
                          
                          <button
                            onClick={() => triggerDeleteUser(user)}
                            disabled={isSelf}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition duration-200 ${
                              isSelf
                                ? 'text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                                : 'text-red-500 border-red-950/60 hover:bg-red-950/20 hover:border-red-900'
                            }`}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Delete User Confirmation */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete the user account for "${userToDelete?.name}"? All cards created by this user will lose their ownership link. This cannot be undone.`}
        confirmText="Delete Account"
      />
    </div>
  );
}
