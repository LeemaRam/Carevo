import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Cart() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  const loadCart = async () => {
    try {
      const { data } = await axios.get('/api/cart');
      setCart(data);
    } catch {
      toast.error('Failed to load cart.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQuantity = async (itemId, quantity) => {
    try {
      const { data } = await axios.put(`/api/cart/items/${itemId}`, { quantity });
      setCart(data);
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Failed to update quantity.');
    }
  };

  const removeItem = async (itemId) => {
    try {
      const { data } = await axios.delete(`/api/cart/items/${itemId}`);
      setCart(data);
      toast.success('Item removed.');
    } catch {
      toast.error('Failed to remove item.');
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading cart...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Shopping Cart</h1>
      {cart.items.length === 0 ? (
        <div className="text-gray-500">Your cart is empty.</div>
      ) : (
        <div className="space-y-3">
          {cart.items.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <img
                src={item.product.image || 'https://via.placeholder.com/200x160?text=Item'}
                alt={item.product.name}
                className="w-24 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">{item.product.name}</p>
                <p className="text-sm text-gray-500">₹{item.price} each</p>
                <p className="text-sm text-gray-500">Subtotal: ₹{item.subtotal}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600"
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600"
                >
                  +
                </button>
              </div>
              <button onClick={() => removeItem(item.id)} className="text-sm text-red-600">Remove</button>
            </div>
          ))}

          <div className="text-right text-lg font-semibold text-gray-900 dark:text-white">Total: ₹{cart.total}</div>
        </div>
      )}
    </div>
  );
}
