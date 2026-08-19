import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productRes, categoryRes] = await Promise.all([
        axios.get('/api/products', { params: { search, category } }),
        axios.get('/api/categories'),
      ]);
      setProducts(productRes.data);
      setCategories(categoryRes.data);
    } catch {
      toast.error('Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category]);

  const productsView = useMemo(() => products ?? [], [products]);

  const addToCart = async (productId) => {
    try {
      await axios.post('/api/cart/items', { productId, quantity: 1 });
      toast.success('Added to cart.');
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Could not add to cart.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products..."
          className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
        />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading products...</div>
      ) : productsView.length === 0 ? (
        <div className="text-gray-500">No approved products found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {productsView.map((product) => (
            <div key={product._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <img
                src={product.primaryImage || 'https://via.placeholder.com/600x400?text=Product'}
                alt={product.name}
                className="w-full h-40 object-cover rounded-lg mb-3"
              />
              <div className="space-y-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{product.categoryId?.name}</p>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-300">
                  ₹{product.discountPrice ?? product.price}
                </p>
                <p className="text-xs text-gray-500">Stock: {product.stockQuantity}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <Link
                  to={`/products/${product._id}`}
                  className="flex-1 text-center px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600"
                >
                  Details
                </Link>
                <button
                  onClick={() => addToCart(product._id)}
                  className="flex-1 px-3 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
