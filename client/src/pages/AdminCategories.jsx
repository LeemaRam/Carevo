import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const EMPTY = { name: '', description: '', image: '', status: 'active' };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    try {
      const { data } = await axios.get('/api/admin/categories');
      setCategories(data);
    } catch {
      toast.error('Failed to load categories.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/admin/categories/${editingId}`, form);
        toast.success('Category updated.');
      } else {
        await axios.post('/api/admin/categories', form);
        toast.success('Category created.');
      }
      setForm(EMPTY);
      setEditingId(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Failed to save category.');
    }
  };

  const startEdit = (category) => {
    setEditingId(category._id);
    setForm({
      name: category.name,
      description: category.description ?? '',
      image: category.image ?? '',
      status: category.status,
    });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await axios.delete(`/api/admin/categories/${id}`);
      toast.success('Category deleted.');
      load();
    } catch {
      toast.error('Failed to delete category.');
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Category Management</h1>

      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <input
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Category name"
          required
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
        />
        <input
          value={form.image}
          onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))}
          placeholder="Image URL"
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
        />
        <textarea
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          placeholder="Description"
          className="md:col-span-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
          rows={3}
        />
        <select
          value={form.status}
          onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white">{editingId ? 'Update' : 'Add'} Category</button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY);
              }}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {categories.map((category) => (
          <div key={category._id} className="flex justify-between items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{category.name}</p>
              <p className="text-xs text-gray-500">{category.status}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(category)} className="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-600">Edit</button>
              <button onClick={() => remove(category._id)} className="text-xs px-3 py-1 rounded bg-red-600 text-white">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
