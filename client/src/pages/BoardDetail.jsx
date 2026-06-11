import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import CardModal from '../components/CardModal';
import ConfirmModal from '../components/ConfirmModal';

const COLUMNS = ['To Do', 'In Progress', 'Done'];

export default function BoardDetail() {
  const { boardId } = useParams();
  const { user } = useAuth();
  const socket = useSocket();

  const [board, setBoard] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);

  // Ref to store card state for socket event handlers
  const cardsRef = useRef([]);
  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  // Fetch Board Details and Cards
  useEffect(() => {
    fetchBoardDetails();
  }, [boardId]);

  const fetchBoardDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/boards/${boardId}`);
      setBoard(response.data.board);
      setCards(response.data.cards);
    } catch (err) {
      setError('Failed to fetch board details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Socket.io real-time listeners setup
  useEffect(() => {
    if (!socket || !boardId) return;

    // Join room
    socket.emit('join_board', boardId);

    // Listen for card created
    socket.on('card_created', (newCard) => {
      // Prevent duplicates if this client initiated creation
      if (cardsRef.current.some((c) => c.id === newCard.id)) return;
      setCards((prev) => [...prev, newCard]);
    });

    // Listen for card updated
    socket.on('card_updated', (updatedCard) => {
      setCards((prev) =>
        prev.map((c) => (c.id === updatedCard.id ? updatedCard : c))
      );
    });

    // Listen for card deleted
    socket.on('card_deleted', ({ id }) => {
      setCards((prev) => prev.filter((c) => c.id !== id));
    });

    // Listen for card moved
    socket.on('card_moved', ({ card: movedCard, fromStatus, toStatus, fromPosition, toPosition }) => {
      // If we did not trigger the drag locally, rearrange cards state
      const existing = cardsRef.current.find((c) => c.id === movedCard.id);
      if (existing && existing.status === toStatus && existing.position === toPosition) {
        return; // Already synchronized locally
      }

      setCards((prev) => {
        // Remove card from its previous state location
        const filtered = prev.filter((c) => c.id !== movedCard.id);
        
        // Correct positions of other cards
        const adjusted = filtered.map((c) => {
          let pos = c.position;
          // Shift down remaining cards in old column
          if (c.status === fromStatus && c.position > fromPosition) {
            pos -= 1;
          }
          // Shift up target column cards
          if (c.status === toStatus && c.position >= toPosition) {
            pos += 1;
          }
          return { ...c, position: pos };
        });

        // Insert card at target location
        return [...adjusted, movedCard].sort((a, b) => a.position - b.position);
      });
    });

    return () => {
      socket.emit('leave_board', boardId);
      socket.off('card_created');
      socket.off('card_updated');
      socket.off('card_deleted');
      socket.off('card_moved');
    };
  }, [socket, boardId]);

  // Check card permission
  const canManageCard = (card) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const creatorId = card.creator?.id || card.creator?._id || card.creator;
    const assigneeId = card.assignee?.id || card.assignee?._id || card.assignee;
    return creatorId === user.id || assigneeId === user.id;
  };

  // Drag and Drop implementation
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Exit if not dropped in a column or no change
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const draggedCard = cards.find((c) => c.id === draggableId);
    if (!draggedCard) return;

    // Enforce drag permission
    if (!canManageCard(draggedCard)) {
      setError('You are only authorized to drag cards you created or are assigned to.');
      setTimeout(() => setError(''), 5000);
      return;
    }

    const fromStatus = source.droppableId;
    const toStatus = destination.droppableId;
    const fromPosition = source.index;
    const toPosition = destination.index;

    // Optimistic UI Update: Local rearrangement
    const originalCards = [...cards];
    setCards((prev) => {
      const filtered = prev.filter((c) => c.id !== draggableId);
      
      const adjusted = filtered.map((c) => {
        let pos = c.position;
        // Shift old column down
        if (c.status === fromStatus && c.position > fromPosition) {
          pos -= 1;
        }
        // Shift new column up
        if (c.status === toStatus && c.position >= toPosition) {
          pos += 1;
        }
        return { ...c, position: pos };
      });

      const updatedCard = { ...draggedCard, status: toStatus, position: toPosition };
      return [...adjusted, updatedCard].sort((a, b) => a.position - b.position);
    });

    // Send update request to server
    try {
      await api.patch(`/cards/${draggableId}/move`, {
        status: toStatus,
        position: toPosition,
      });
    } catch (err) {
      // Revert upon API error
      setCards(originalCards);
      setError(err.response?.data?.message || 'Unauthorized move action. Reverting position.');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Create / Edit card submission handler
  const handleCardSubmit = async (payload) => {
    if (editingCard) {
      // Update action
      const response = await api.patch(`/cards/${editingCard.id}`, payload);
      setCards((prev) =>
        prev.map((c) => (c.id === editingCard.id ? response.data.card : c))
      );
    } else {
      // Create action
      const response = await api.post('/cards', { ...payload, boardId });
      setCards((prev) => [...prev, response.data.card]);
    }
  };

  // Trigger Delete confirmation dialog
  const triggerDeleteCard = (card, e) => {
    e.stopPropagation();
    setCardToDelete(card);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!cardToDelete) return;
    try {
      await api.delete(`/cards/${cardToDelete.id}`);
      setCards((prev) => prev.filter((c) => c.id !== cardToDelete.id));
      setIsConfirmOpen(false);
      setCardToDelete(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete card');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Open Create Dialog
  const handleOpenCreateModal = () => {
    setEditingCard(null);
    setIsCardModalOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEditModal = (card) => {
    if (!canManageCard(card)) return;
    setEditingCard(card);
    setIsCardModalOpen(true);
  };

  // Extract initials for assignee avatars
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date() && new Date(dateStr).toDateString() !== new Date().toDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans">
        <Navbar />
        <div className="flex justify-center items-center py-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans">
        <Navbar />
        <div className="max-w-md mx-auto py-20 text-center space-y-4">
          <p className="text-xl font-bold">Workspace Board not found</p>
          <Link to="/" className="inline-block px-4 py-2 bg-slate-800 border border-slate-700 text-sm font-semibold rounded-xl text-blue-400">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      <Navbar />

      {/* Board Info Subheader */}
      <div className="bg-slate-900/40 border-b border-slate-900 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Link to="/" className="text-slate-400 hover:text-white transition duration-200 text-sm">
                ← Boards
              </Link>
              <span className="text-slate-650">/</span>
              <h1 className="text-2xl font-bold">{board.name}</h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">{board.description}</p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold transition-all duration-200 shadow-md transform hover:-translate-y-0.5"
          >
            + Add Card
          </button>
        </div>
      </div>

      {/* Error alerts */}
      {error && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-red-950/40 border border-red-900 text-red-400 px-4 py-3 rounded-xl text-sm shadow-md">
            {error}
          </div>
        </div>
      )}

      {/* Kanban Board Layout */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start min-w-[768px]">
            {COLUMNS.map((columnName) => {
              // Filter cards belonging to this column status, ordered by position
              const columnCards = cards
                .filter((c) => c.status === columnName)
                .sort((a, b) => a.position - b.position);

              return (
                <div key={columnName} className="bg-slate-900/50 border border-slate-900 rounded-2xl p-4 flex flex-col max-h-[75vh]">
                  {/* Column Header */}
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800/60">
                    <h3 className="font-bold text-slate-200 flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        columnName === 'To Do' ? 'bg-amber-500' : columnName === 'In Progress' ? 'bg-blue-500' : 'bg-emerald-500'
                      }`} />
                      {columnName}
                    </h3>
                    <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full font-semibold">
                      {columnCards.length}
                    </span>
                  </div>

                  {/* Card Droppable Container */}
                  <Droppable droppableId={columnName}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto space-y-3 min-h-[150px] rounded-lg transition-colors p-1 ${
                          snapshot.isDraggingOver ? 'bg-slate-850/20' : ''
                        }`}
                      >
                        {columnCards.map((card, index) => {
                          const userCanEdit = canManageCard(card);
                          return (
                            <Draggable
                              key={card.id}
                              draggableId={card.id}
                              index={index}
                              isDragDisabled={!userCanEdit}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => handleOpenEditModal(card)}
                                  className={`bg-slate-900 border p-4 rounded-xl shadow-md transition-all duration-250 flex flex-col select-none relative group ${
                                    snapshot.isDragging 
                                      ? 'border-blue-500 bg-slate-850 rotate-1 scale-105 shadow-xl z-50' 
                                      : 'border-slate-800 hover:border-slate-700/80 hover:bg-slate-900/80 cursor-grab'
                                  }`}
                                >
                                  {/* Task Top Meta (Priority, Lock indicator) */}
                                  <div className="flex justify-between items-start gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                                      card.priority === 'high' 
                                        ? 'bg-rose-950/50 text-rose-400 border-rose-900/60' 
                                        : card.priority === 'medium'
                                        ? 'bg-amber-950/50 text-amber-400 border-amber-900/60'
                                        : 'bg-emerald-950/50 text-emerald-400 border-emerald-900/60'
                                    }`}>
                                      {card.priority}
                                    </span>

                                    {!userCanEdit ? (
                                      <span className="text-xs text-slate-550 flex items-center gap-1 opacity-70 cursor-not-allowed" title="Read-only card (You do not own this)">
                                        🔒 Lock
                                      </span>
                                    ) : (
                                      <button
                                        onClick={(e) => triggerDeleteCard(card, e)}
                                        className="text-xs text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                        title="Delete Task"
                                      >
                                        🗑️
                                      </button>
                                    )}
                                  </div>

                                  {/* Task Title & Description */}
                                  <h4 className={`font-semibold text-slate-100 text-sm leading-snug group-hover:text-blue-300 transition-colors ${
                                    columnName === 'Done' ? 'line-through text-slate-400 group-hover:text-slate-300' : ''
                                  }`}>
                                    {card.title}
                                  </h4>
                                  {card.description && (
                                    <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                                      {card.description}
                                    </p>
                                  )}

                                  {/* Task Bottom Details (Due Date, Assignee) */}
                                  <div className="mt-4 pt-3 border-t border-slate-800/50 flex justify-between items-center text-[10px] text-slate-500">
                                    {card.dueDate ? (
                                      <span className={`flex items-center gap-1 font-semibold ${
                                        isOverdue(card.dueDate) && columnName !== 'Done' 
                                          ? 'text-red-400' 
                                          : 'text-slate-400'
                                      }`}>
                                        📅 {new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                      </span>
                                    ) : (
                                      <span />
                                    )}

                                    {card.assignee ? (
                                      <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800/80">
                                        <div className="h-4 w-4 bg-indigo-600 rounded flex items-center justify-center font-bold text-[8px] text-white">
                                          {getInitials(card.assignee.name)}
                                        </div>
                                        <span className="max-w-[70px] truncate text-slate-300 font-medium">
                                          {card.assignee.name.split(' ')[0]}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="italic text-slate-600 font-sans">Unassigned</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Create / Edit Card Modal */}
      <CardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        onSubmit={handleCardSubmit}
        card={editingCard}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Task Card"
        message={`Are you sure you want to permanently delete the task "${cardToDelete?.title}"? This cannot be undone.`}
        confirmText="Delete Task"
      />
    </div>
  );
}
