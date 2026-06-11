import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function CardModal({ isOpen, onClose, onSubmit, card = null }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!card;

  // Initialize fields on open or change of card
  useEffect(() => {
    if (isOpen) {
      setError('');
      if (card) {
        setTitle(card.title || '');
        setDescription(card.description || '');
        setAssigneeId(card.assignee?.id || card.assignee?._id || '');
        setPriority(card.priority || 'medium');
        setDueDate(card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '');
      } else {
        setTitle('');
        setDescription('');
        setAssigneeId('');
        setPriority('medium');
        setDueDate('');
      }
      fetchUsers();
    }
  }, [isOpen, card]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get('/users/assignees');
      setUsers(response.data.users);
    } catch (err) {
      console.error('Failed to load assignees directory', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      title: title.trim(),
      description: description.trim(),
      assignee: assigneeId || null,
      priority,
      dueDate: dueDate || null,
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save card');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">
            {isEditMode ? 'Edit Task Card' : 'Create Task Card'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition duration-200 text-lg"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-900 text-red-400 px-4 py-2.5 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300">Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Implement drag-and-drop"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition duration-200"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300">Description</label>
            <textarea
              rows="4"
              placeholder="Provide context or instructions for this task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition duration-200"
            />
          </div>

          {/* Assignee Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300">Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              disabled={loadingUsers}
              className="mt-1 block w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition duration-200"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          {/* Priority & Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority pills */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Priority Tag</label>
              <div className="flex gap-2">
                {['low', 'medium', 'high'].map((p) => {
                  const colors = {
                    low: 'bg-emerald-950 text-emerald-400 border-emerald-800 active:bg-emerald-800',
                    medium: 'bg-amber-950 text-amber-400 border-amber-800 active:bg-amber-800',
                    high: 'bg-rose-950 text-rose-400 border-rose-800 active:bg-rose-850',
                  };
                  const activeColors = {
                    low: 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/10',
                    medium: 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/10',
                    high: 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-500/10',
                  };
                  const isSelected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all duration-200 ${
                        isSelected ? activeColors[p] : `text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200`
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 block w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition duration-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-sm font-semibold rounded-xl transition duration-200 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-sm font-semibold rounded-xl transition duration-200 shadow-md text-white disabled:opacity-50"
            >
              {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
