import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await api.get('/boards');
      setBoards(response.data.boards);
    } catch (err) {
      setError('Failed to fetch boards');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!boardName) return;

    setSubmitting(true);
    setError('');
    try {
      const response = await api.post('/boards', {
        name: boardName,
        description: boardDescription,
      });
      setBoards([response.data.board, ...boards]);
      setIsModalOpen(false);
      setBoardName('');
      setBoardDescription('');
    } catch (err) {
      setError('Failed to create board. Try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Collaborative Boards
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Select an existing workspace or launch a new board to collaborate in real-time.
            </p>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold transition-all duration-200 shadow-md transform hover:-translate-y-0.5"
          >
            <span className="text-lg">+</span> Create New Board
          </button>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-900 text-red-400 px-4 py-3 rounded-xl text-sm mb-6 max-w-md">
            {error}
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : boards.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl max-w-lg mx-auto">
            <span className="text-5xl">📋</span>
            <h3 className="mt-4 text-lg font-bold text-slate-200">No boards yet</h3>
            <p className="text-sm text-slate-400 mt-1 px-6">
              Create your very first board to start managing tasks and invite your team.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-750 text-sm font-semibold rounded-xl transition duration-200"
            >
              Get Started
            </button>
          </div>
        ) : (
          /* Board Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <Link
                key={board.id}
                to={`/boards/${board.id}`}
                className="group relative flex flex-col justify-between p-6 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors duration-200">
                    {board.name}
                  </h3>
                  <p className="text-slate-400 text-sm mt-2 line-clamp-2">
                    {board.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-500">
                  <span>Created by {board.creator?.name || 'Unknown'}</span>
                  <span>{new Date(board.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Create New Workspace</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition duration-200 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Board Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Sprint Tracker"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  className="mt-1 block w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 font-sans">Description</label>
                <textarea
                  rows="3"
                  placeholder="What is this board for?"
                  value={boardDescription}
                  onChange={(e) => setBoardDescription(e.target.value)}
                  className="mt-1 block w-full px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-white placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition duration-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-sm font-semibold rounded-xl transition duration-200 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-sm font-semibold rounded-xl transition duration-200 shadow-md text-white disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
