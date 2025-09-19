import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, updateDoc, where, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const AdminCategories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  // Edit modal state
  const [editingCategory, setEditingCategory] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'categories'), orderBy('name'));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategories(list);
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name || !newCategory.description) {
      toast.error('Please provide a name and description.');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'categories'), {
        name: newCategory.name.trim(),
        description: newCategory.description.trim(),
        createdAt: new Date().toISOString()
      });
      toast.success('Category created');
      setNewCategory({ name: '', description: '' });
      fetchCategories();
    } catch (err) {
      console.error('Error creating category:', err);
      toast.error('Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return toast.error('Category not found');

    // Check if any product uses this category (by id or name)
    try {
      const qById = query(collection(db, 'products'), where('category', '==', cat.id), limit(1));
      const snapById = await getDocs(qById);
      if (snapById.size > 0) {
        toast.error('Cannot delete category: products are assigned to it.');
        return;
      }
      const qByName = query(collection(db, 'products'), where('category', '==', cat.name), limit(1));
      const snapByName = await getDocs(qByName);
      if (snapByName.size > 0) {
        toast.error('Cannot delete category: products are assigned to it.');
        return;
      }

      if (!window.confirm('Delete this category? This will not remove products linked to it.')) return;

      await deleteDoc(doc(db, 'categories', id));
      toast.success('Category deleted');
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete category');
    }
  };

  const handleStartEdit = (cat) => {
    setEditingCategory({ ...cat });
  };

  const handleCancelEdit = () => setEditingCategory(null);

  const handleSaveEdit = async () => {
    if (!editingCategory || !editingCategory.name || !editingCategory.description) {
      toast.error('Name and description are required');
      return;
    }
    setEditSubmitting(true);
    try {
      const ref = doc(db, 'categories', editingCategory.id);
      await updateDoc(ref, {
        name: editingCategory.name.trim(),
        description: editingCategory.description.trim(),
        updatedAt: new Date().toISOString()
      });
      toast.success('Category updated');
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      console.error('Update failed:', err);
      toast.error('Failed to update category');
    } finally {
      setEditSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    if (!searchTerm) return categories;
    const q = searchTerm.toLowerCase();
    return categories.filter(c => (c.name || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q));
  }, [categories, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Guard: simple client-side admin check
  if (!user || !user.isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Manage Categories</h1>
        <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">You must be an administrator to view this page.</p>
        </div>
      </div>
    );
  }

  const exportCSV = () => {
    const lines = [
      ['id', 'name', 'description', 'createdAt', 'updatedAt'].join(',')
    ];
    filtered.forEach(c => {
      lines.push([
        `"${c.id}"`,
        `"${(c.name||'').replace(/"/g,'""')}"`,
        `"${(c.description||'').replace(/"/g,'""')}"`,
        `"${c.createdAt||''}"`,
        `"${c.updatedAt||''}"`
      ].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `categories_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const seedDefaultCategories = async () => {
    const defaults = [
      { name: 'Stationery', description: 'Office and school supplies' },
      { name: 'Electronics', description: 'Small electronics and accessories' },
      { name: 'Packaging', description: 'Boxes, tape and packaging materials' },
      { name: 'Cleaning', description: 'Cleaning supplies and disinfectants' }
    ];
    let added = 0;
    for (const d of defaults) {
      try {
        const q = query(collection(db, 'categories'), where('name', '==', d.name), limit(1));
        const snap = await getDocs(q);
        if (snap.size === 0) {
          await addDoc(collection(db, 'categories'), {
            name: d.name,
            description: d.description,
            createdAt: new Date().toISOString()
          });
          added++;
        }
      } catch (err) {
        console.warn('Seed error for', d.name, err);
      }
    }
    if (added > 0) {
      toast.success(`Added ${added} default categories`);
      fetchCategories();
    } else {
      toast.info('Default categories already present');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Manage Categories</h1>

      {/* Create */}
      <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <input
              value={newCategory.name}
              onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="e.g. Stationery"
            />
          </div>
          <div className="md:col-span-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <input
              value={newCategory.description}
              onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Short description"
            />
          </div>
          <div className="md:col-span-2 text-right">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:opacity-90"
            >
              {submitting ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <input
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            placeholder="Search categories..."
            className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white w-64"
          />
          <button onClick={exportCSV} className="px-3 py-2 bg-primary text-white rounded-md">Export CSV</button>
          <button onClick={seedDefaultCategories} className="px-3 py-2 bg-primary/80 text-white rounded-md">Seed Defaults</button>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{filtered.length} categories</div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-surface-dark rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3">Existing Categories</h2>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">No categories found.</p>
            ) : (
              <ul className="space-y-2">
                {pageItems.map(cat => (
                  <li key={cat.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">{cat.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{cat.description}</p>
                      <p className="text-xs text-gray-400 mt-1">Created: {cat.createdAt ? String(cat.createdAt) : '—'}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 rounded-md"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="text-red-600 hover:text-red-800 text-sm px-3 py-1 rounded-md"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 border rounded-md">Prev</button>
                <span className="text-sm">Page {page} of {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 border rounded-md">Next</button>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-surface-dark rounded-lg p-6 w-full max-w-xl">
            <h3 className="text-lg font-semibold mb-4">Edit Category</h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <input
                  value={editingCategory.description}
                  onChange={(e) => setEditingCategory(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-4">
                <button onClick={handleCancelEdit} className="px-4 py-2 border rounded-md">Cancel</button>
                <button onClick={handleSaveEdit} disabled={editSubmitting} className="px-4 py-2 bg-primary text-white rounded-md">{editSubmitting ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
