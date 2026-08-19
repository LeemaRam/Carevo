import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ProductStatusBadge from '../components/ProductStatusBadge';

export default function AdminProducts() {
  const [allProducts, setAllProducts] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [pendingChanges, setPendingChanges] = useState([]);

  const load = async () => {
    try {
      const [allRes, pendingRes] = await Promise.all([
        axios.get('/api/admin/products'),
        axios.get('/api/admin/products/pending'),
      ]);
      setAllProducts(allRes.data);
      setPendingProducts(pendingRes.data.pendingProducts ?? []);
      setPendingChanges(pendingRes.data.pendingChanges ?? []);
    } catch {
      toast.error('Failed to load admin product data.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reviewProduct = async (id, action) => {
    const comment = window.prompt('Comment (optional):') ?? '';
    try {
      await axios.post(`/api/admin/products/${id}/${action}`, { comment });
      toast.success(`Product ${action.replace('-', ' ')} successful.`);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Action failed.');
    }
  };

  const reviewChangeRequest = async (id, action) => {
    const comment = window.prompt('Comment (optional):') ?? '';
    try {
      await axios.post(`/api/admin/change-requests/${id}/${action}`, { comment });
      toast.success(`Change request ${action}d.`);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Action failed.');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Product Management</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pending Product Approvals</h2>
        {pendingProducts.length === 0 ? (
          <p className="text-sm text-gray-500">No pending products.</p>
        ) : (
          pendingProducts.map((product) => (
            <div key={product._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{product.name}</p>
                  <p className="text-xs text-gray-500">Vendor: {product.vendorId?.businessName} · Category: {product.categoryId?.name}</p>
                </div>
                <ProductStatusBadge status={product.status} />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">₹{product.discountPrice ?? product.price} · Stock: {product.stockQuantity}</p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => reviewProduct(product._id, 'approve')} className="px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white">Approve</button>
                <button onClick={() => reviewProduct(product._id, 'reject')} className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white">Reject</button>
                <button onClick={() => reviewProduct(product._id, 'request-changes')} className="px-3 py-1.5 text-xs rounded-lg bg-yellow-500 text-white">Request Changes</button>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pending Change Requests</h2>
        {pendingChanges.length === 0 ? (
          <p className="text-sm text-gray-500">No pending change requests.</p>
        ) : (
          pendingChanges.map((change) => (
            <div key={change._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
              <p className="font-semibold text-gray-900 dark:text-white">{change.name}</p>
              <p className="text-xs text-gray-500">Live Product: {change.productId?.name} · Vendor: {change.vendorId?.businessName}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Proposed price: ₹{change.discountPrice ?? change.price} · Stock: {change.stockQuantity}</p>
              <div className="flex gap-2">
                <button onClick={() => reviewChangeRequest(change._id, 'approve')} className="px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white">Approve</button>
                <button onClick={() => reviewChangeRequest(change._id, 'reject')} className="px-3 py-1.5 text-xs rounded-lg bg-red-600 text-white">Reject</button>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">All Products</h2>
        <div className="space-y-2">
          {allProducts.map((product) => (
            <div key={product._id} className="flex justify-between items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                <p className="text-xs text-gray-500">Vendor: {product.vendorId?.businessName} · SKU: {product.sku}</p>
              </div>
              <ProductStatusBadge status={product.status} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
