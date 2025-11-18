import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/**
 * Simple Notes Manager - Ocean Professional themed single-page app.
 * - Add, edit, delete notes
 * - List notes as responsive cards
 * - Persist notes in localStorage (key: 'notes')
 * - No backend required and no dependency on env vars
 */

// Types
/**
 * @typedef {{ id: string, title: string, content: string, createdAt: number, updatedAt: number }} Note
 */

// Utilities
const LS_KEY = 'notes';
const now = () => Date.now();
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// PUBLIC_INTERFACE
export default function App() {
  /** State */
  const [notes, setNotes] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('');
  const editingNote = useMemo(
    () => notes.find(n => n.id === editingId) || null,
    [editingId, notes]
  );

  /** Persist on changes */
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(notes));
    } catch {
      // ignore persistence errors
    }
  }, [notes]);

  // PUBLIC_INTERFACE
  const addNote = (title, content) => {
    const ts = now();
    const note = { id: uid(), title, content, createdAt: ts, updatedAt: ts };
    setNotes(prev => [note, ...prev]);
  };

  // PUBLIC_INTERFACE
  const updateNote = (id, title, content) => {
    setNotes(prev =>
      prev.map(n => (n.id === id ? { ...n, title, content, updatedAt: now() } : n))
    );
    setEditingId(null);
  };

  // PUBLIC_INTERFACE
  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const onEdit = (id) => setEditingId(id);
  const onCancelEdit = () => setEditingId(null);

  const filteredNotes = useMemo(() => {
    if (!filter.trim()) return notes;
    const q = filter.toLowerCase();
    return notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }, [filter, notes]);

  return (
    <div className="app-root" data-theme="ocean">
      <Header />
      <main className="container">
        <div className="panel panel-form">
          <NoteForm
            key={editingNote ? editingNote.id : 'new'}
            initialNote={editingNote}
            onSubmit={(title, content) =>
              editingNote ? updateNote(editingNote.id, title, content) : addNote(title, content)
            }
            onCancel={editingNote ? onCancelEdit : undefined}
          />
        </div>

        <div className="panel panel-list">
          <ListHeader
            count={filteredNotes.length}
            total={notes.length}
            filter={filter}
            setFilter={setFilter}
          />
          <NotesList
            notes={filteredNotes}
            onEdit={onEdit}
            onDelete={deleteNote}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

// PUBLIC_INTERFACE
function Header() {
  /**
   * Header with subtle gradient using primary and background colors.
   */
  const appTitle = process.env.REACT_APP_FRONTEND_URL
    ? 'Simple Notes Manager'
    : 'Simple Notes Manager';
  return (
    <header className="header">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">📝</div>
          <div className="brand-text">
            <h1 className="title">Simple Notes Manager</h1>
            <p className="subtitle">{appTitle}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

// PUBLIC_INTERFACE
function Footer() {
  return (
    <footer className="footer">
      <span>Built with Ocean Professional theme</span>
      <span className="dots" aria-hidden="true">• • •</span>
      <span className="muted">LocalStorage persistence, no backend required</span>
    </footer>
  );
}

// PUBLIC_INTERFACE
function ListHeader({ count, total, filter, setFilter }) {
  /** Displays counts and search input */
  return (
    <div className="list-header">
      <div className="list-meta">
        <span className="badge">{count}</span>
        <span className="meta-text">
          {count === total ? 'notes' : `filtered of ${total}`}
        </span>
      </div>
      <div className="search">
        <input
          aria-label="Search notes"
          placeholder="Search notes..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function NoteForm({ initialNote, onSubmit, onCancel }) {
  /**
   * Form for creating or editing a note.
   * Requires title; shows inline error for empty title.
   */
  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState(initialNote?.content || '');
  const [error, setError] = useState('');

  const isEditing = Boolean(initialNote);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setError('');
    onSubmit(title.trim(), content.trim());
    if (!isEditing) {
      setTitle('');
      setContent('');
    }
  };

  return (
    <form className="note-form" onSubmit={handleSubmit} noValidate>
      <div className="form-row">
        <label htmlFor="title" className="label">Title</label>
        <input
          id="title"
          className={`input ${error ? 'input-error' : ''}`}
          type="text"
          placeholder="e.g., Grocery list"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {error && <div className="error-text" role="alert">{error}</div>}
      </div>

      <div className="form-row">
        <label htmlFor="content" className="label">Content</label>
        <textarea
          id="content"
          className="textarea"
          placeholder="Write your note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
        />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {isEditing ? 'Save Changes' : 'Add Note'}
        </button>
        {isEditing && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// PUBLIC_INTERFACE
function NotesList({ notes, onEdit, onDelete }) {
  /**
   * Responsive grid of note cards.
   */
  if (notes.length === 0) {
    return <div className="empty-state">No notes yet. Start by adding one above.</div>;
  }

  return (
    <section className="notes-grid" aria-label="Notes list">
      {notes.map(n => (
        <article key={n.id} className="card">
          <div className="card-body">
            <h3 className="card-title">{n.title}</h3>
            {n.content && <p className="card-content">{n.content}</p>}
          </div>
          <div className="card-footer">
            <div className="timestamps">
              <span title={`Updated: ${new Date(n.updatedAt).toLocaleString()}`}>
                Updated {timeAgo(n.updatedAt)}
              </span>
            </div>
            <div className="card-actions">
              <button
                className="btn btn-ghost"
                onClick={() => onEdit(n.id)}
                aria-label={`Edit ${n.title}`}
              >
                ✏️ Edit
              </button>
              <button
                className="btn btn-danger"
                onClick={() => onDelete(n.id)}
                aria-label={`Delete ${n.title}`}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

// Helpers
function timeAgo(ts) {
  const diff = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
