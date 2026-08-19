import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import ProductStatusBadge from '../components/ProductStatusBadge';

export default function VendorDashboard() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get('/api/vendor/products').then(({ data }) => setProducts(data)).catch(() => setProducts([]));
  }, []);

  const stats = useMemo(() => {
    const summary = { total: products.length, draft: 0, pending: 0, approved: 0, rejected: 0, changes_requested: 0 };
    products.forEach((product) => {
      summary[product.status] = (summary[product.status] ?? 0) + 1;
    });
    return summary;
  }, [products]);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Vendor Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <p className="text-xs uppercase text-gray-500">{key.replace(/_/g, ' ')}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recent Products</h2>
        {(products.slice(0, 6)).map((product) => (
          <div key={product._id} className="flex justify-between items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
              <p className="text-xs text-gray-500">{product.reviewComment || 'No admin feedback yet.'}</p>
            </div>
            <ProductStatusBadge status={product.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
