import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ProductFormModal from '../components/ProductFormModal';
import ProductStatusBadge from '../components/ProductStatusBadge';

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        axios.get('/api/vendor/products'),
        axios.get('/api/categories'),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch {
      toast.error('Failed to load vendor products.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (formData) => {
    setLoading(true);
    try {
      await axios.post('/api/vendor/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Product created in draft mode.');
      setFormOpen(false);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Failed to create product.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (formData) => {
    setLoading(true);
    try {
      const { data } = await axios.put(`/api/vendor/products/${editing._id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(data.message ?? 'Product updated.');
      setEditing(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Failed to update product.');
    } finally {
      setLoading(false);
    }
  };

  const submitProduct = async (id) => {
    try {
      await axios.post(`/api/vendor/products/${id}/submit`);
      toast.success('Product submitted for approval.');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Failed to submit product.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">My Products</h1>
        <button
          onClick={() => setFormOpen(true)}
          className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {products.map((product) => (
          <div key={product._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{product.name}</p>
                <p className="text-xs text-gray-500">SKU: {product.sku}</p>
              </div>
              <ProductStatusBadge status={product.status} />
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300">₹{product.discountPrice ?? product.price} · Stock: {product.stockQuantity}</p>
            {product.reviewComment && (
              <p className="text-xs text-red-600 dark:text-red-300">Admin feedback: {product.reviewComment}</p>
            )}
            {product.pendingChangeRequest && (
              <p className="text-xs text-yellow-600 dark:text-yellow-300">A change request is pending approval.</p>
            )}

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setEditing(product)}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600"
              >
                Edit
              </button>
              {['draft', 'rejected', 'changes_requested'].includes(product.status) && (
                <button
                  onClick={() => submitProduct(product._id)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 text-white"
                >
                  Submit for Approval
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {formOpen && (
        <ProductFormModal
          categories={categories}
          onSubmit={handleCreate}
          onClose={() => setFormOpen(false)}
          loading={loading}
        />
      )}

      {editing && (
        <ProductFormModal
          initialData={editing}
          categories={categories}
          onSubmit={handleEdit}
          onClose={() => setEditing(null)}
          loading={loading}
        />
      )}
    </div>
  );
}
