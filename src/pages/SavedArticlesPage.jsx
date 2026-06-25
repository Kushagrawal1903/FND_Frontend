import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { articlesAPI } from '../services/api';

const SavedArticlesPage = () => {
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('all'); // 'all' | 'true' | 'false' | 'mixture'
  const [error, setError] = useState('');

  // Editing States
  const [editingArticle, setEditingArticle] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await articlesAPI.getAll();
      // Backend returns { status, data: { articles: [...] } }
      const data = res.data?.data?.articles ?? res.data?.data ?? res.data ?? [];
      setArticles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load saved articles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchArticles();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this bookmark?')) return;
    try {
      await articlesAPI.delete(id);
      setArticles(articles.filter((art) => art._id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete bookmark.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingArticle) return;
    setEditLoading(true);
    try {
      // The backend save article route can take updates or we save with notes
      await articlesAPI.save({
        title: editingArticle.title,
        url: editingArticle.url,
        verdict: editingArticle.verdict,
        notes: editNotes,
      });

      // Update local state by refetching
      await fetchArticles();
      setEditSuccess(true);
      setTimeout(() => {
        setEditSuccess(false);
        setEditingArticle(null);
        setEditNotes('');
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Failed to save notes.');
    } finally {
      setEditLoading(false);
    }
  };

  const getVerdictStyle = (verdict) => {
    const v = String(verdict).toLowerCase();
    if (v === 'true') {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (v === 'false') {
      return 'bg-red-100 text-red-800 border-red-200';
    } else if (v === 'mixture') {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Search & Filter computation — guard ensures articles is always an array
  const filteredArticles = (Array.isArray(articles) ? articles : []).filter((art) => {
    const matchesSearch =
      (art.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((art.notes || '').toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesVerdict =
      verdictFilter === 'all' ||
      String(art.verdict).toLowerCase() === verdictFilter.toLowerCase();

    return matchesSearch && matchesVerdict;
  });

  return (
    <div className="bg-background min-h-screen text-on-background font-body-md flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 ml-0 md:ml-64 flex flex-col h-screen overflow-y-auto w-full">
        <Header title="Saved Articles" />

        <div className="p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto w-full flex flex-col gap-gutter">
          
          {/* Controls Bar */}
          <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search saved claims or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-bright border border-outline-variant rounded-lg text-sm input-focus-ring"
              />
            </div>

            {/* Verdict Filter */}
            <div className="flex gap-2 items-center w-full sm:w-auto overflow-x-auto">
              <button 
                onClick={() => setVerdictFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                  verdictFilter === 'all' 
                    ? 'bg-primary text-on-primary border-primary' 
                    : 'bg-surface border-outline-variant text-on-surface-variant hover:border-on-surface'
                }`}
              >
                All Bookmarks
              </button>
              <button 
                onClick={() => setVerdictFilter('true')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                  verdictFilter === 'true' 
                    ? 'bg-green-700 text-white border-green-700' 
                    : 'bg-surface border-outline-variant text-on-surface-variant hover:border-on-surface'
                }`}
              >
                True
              </button>
              <button 
                onClick={() => setVerdictFilter('false')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                  verdictFilter === 'false' 
                    ? 'bg-red-700 text-white border-red-700' 
                    : 'bg-surface border-outline-variant text-on-surface-variant hover:border-on-surface'
                }`}
              >
                False
              </button>
              <button 
                onClick={() => setVerdictFilter('mixture')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                  verdictFilter === 'mixture' 
                    ? 'bg-amber-700 text-white border-amber-700' 
                    : 'bg-surface border-outline-variant text-on-surface-variant hover:border-on-surface'
                }`}
              >
                Mixture
              </button>
            </div>

          </div>

          {/* Error notice */}
          {error && (
            <div className="bg-surface border border-outline-variant rounded-xl p-4 text-center">
              <p className="text-error">{error}</p>
            </div>
          )}

          {/* Articles list */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 font-body-md text-on-surface-variant">Fetching bookmarked articles...</p>
            </div>
          ) : filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredArticles.map((article) => (
                <div 
                  key={article._id} 
                  className="bg-surface border border-outline-variant rounded-xl p-stack-lg shadow-sm flex flex-col gap-4"
                >
                  <div className="flex justify-between items-start gap-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-bold uppercase ${getVerdictStyle(article.verdict)}`}>
                      {article.verdict}
                    </span>
                    <span className="text-[11px] text-outline">
                      Saved: {new Date(article.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-headline-md text-[18px] text-on-surface leading-snug mb-2 line-clamp-2">
                      "{article.title}"
                    </h3>
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-label-sm text-xs text-primary hover:underline flex items-center gap-1 truncate w-full"
                    >
                      {article.url} <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                    </a>
                  </div>

                  {/* Personal notes section */}
                  <div className="bg-surface-bright border border-outline-variant/60 rounded-lg p-3">
                    <p className="font-label-sm text-[11px] text-on-surface-variant font-bold uppercase tracking-wide mb-1">
                      Personal Notes
                    </p>
                    <p className="font-body-md text-sm text-on-surface-variant italic leading-relaxed">
                      {article.notes || 'No annotations recorded.'}
                    </p>
                  </div>

                  {/* Action triggers */}
                  <div className="flex gap-2 border-t border-outline-variant/60 pt-3">
                    <button
                      onClick={() => {
                        setEditingArticle(article);
                        setEditNotes(article.notes || '');
                      }}
                      className="flex-1 bg-surface border border-outline-variant hover:border-on-surface text-on-surface font-label-md text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      Edit Notes
                    </button>
                    <button
                      onClick={() => handleDelete(article._id)}
                      className="flex-1 bg-surface border border-error-container text-error hover:bg-error-container/20 font-label-md text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Remove Bookmark
                    </button>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-outline-variant rounded-xl p-16 text-center shadow-sm flex flex-col items-center justify-center gap-4">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant">bookmark_border</span>
              <h2 className="font-headline-md text-on-surface">No Saved Articles</h2>
              <p className="font-body-md text-on-surface-variant max-w-sm">
                You haven't bookmarked any news verifications matching your criteria. Try scanning a claim on the dashboard!
              </p>
            </div>
          )}

        </div>

        {/* Modal: Edit Notes */}
        {editingArticle && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-surface border border-outline-variant rounded-xl p-stack-lg shadow-lg flex flex-col gap-4">
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
                <h3 className="font-headline-md text-[18px] font-bold text-on-surface">
                  Edit Personal Annotation
                </h3>
                <button 
                  onClick={() => setEditingArticle(null)}
                  className="p-1 hover:text-error cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {editSuccess ? (
                <div className="p-4 text-center text-green-800 font-label-md">
                  Annotation updated successfully!
                </div>
              ) : (
                <form onSubmit={handleEditSubmit} className="flex flex-col gap-3">
                  <p className="font-body-md text-sm text-on-surface-variant truncate">
                    Editing notes for: <strong>"{editingArticle.title}"</strong>
                  </p>

                  <div className="flex flex-col gap-1">
                    <label className="font-label-sm text-xs text-on-surface" htmlFor="edit-notes">
                      Notes
                    </label>
                    <textarea
                      id="edit-notes"
                      rows={4}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full bg-surface border border-outline-variant rounded-lg font-body-md text-sm p-2 input-focus-ring resize-none"
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingArticle(null)}
                      className="px-4 py-2 border border-outline-variant text-on-surface hover:border-on-surface rounded-lg font-label-md text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="px-4 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-lg font-label-md text-sm cursor-pointer"
                    >
                      {editLoading ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default SavedArticlesPage;
