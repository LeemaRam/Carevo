import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(`/api/products/${id}`);
        setProduct(data);
      } catch {
        toast.error('Failed to load product details.');
      }
    };

    load();
  }, [id]);

  const addToCart = async () => {
    try {
      await axios.post('/api/cart/items', { productId: id, quantity });
      toast.success('Added to cart.');
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Could not add to cart.');
    }
  };

  if (!product) {
    return <div className="text-gray-500">Loading product...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <img
          src={product.primaryImage || product.images?.[0] || 'https://via.placeholder.com/700x500?text=Product'}
          alt={product.name}
          className="w-full h-80 object-cover rounded-xl"
        />
        <div className="flex gap-2 mt-3 flex-wrap">
          {(product.images ?? []).map((image) => (
            <img key={image} src={image} alt="product" className="h-16 w-16 object-cover rounded-lg" />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
        <p className="text-gray-600 dark:text-gray-300">{product.description || 'No description provided.'}</p>
        <p className="text-sm text-gray-500">Category: {product.categoryId?.name}</p>
        <p className="text-sm text-gray-500">Vendor: {product.vendorId?.businessName || product.vendorId?.userId?.name}</p>
        <p className="text-xl font-semibold text-indigo-600 dark:text-indigo-300">₹{product.discountPrice ?? product.price}</p>
        <p className="text-sm text-gray-500">Available stock: {product.stockQuantity}</p>

        <div className="flex gap-3 items-center">
          <input
            type="number"
            min="1"
            max={product.stockQuantity}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value) || 1)}
            className="w-24 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
          <button onClick={addToCart} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
