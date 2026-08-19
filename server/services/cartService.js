const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const ProductImage = require('../models/ProductImage');
const { getEffectivePrice } = require('../utils/productHelpers');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId });
  }
  return cart;
};

const ensurePurchasableProduct = async (productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    const error = new Error('Invalid product ID.');
    error.status = 400;
    throw error;
  }

  const product = await Product.findById(productId);
  if (!product || product.status !== 'approved') {
    const error = new Error('Product is not available.');
    error.status = 400;
    throw error;
  }

  if (product.stockQuantity <= 0) {
    const error = new Error('Product is out of stock.');
    error.status = 400;
    throw error;
  }

  return product;
};

const getCartDetails = async (userId) => {
  const cart = await getOrCreateCart(userId);
  const items = await CartItem.find({ cartId: cart._id }).populate({
    path: 'productId',
    populate: ['categoryId', { path: 'vendorId', populate: { path: 'userId', select: 'name' } }],
  });

  const productIds = items.map((item) => item.productId?._id).filter(Boolean);
  const images = await ProductImage.find({ productId: { $in: productIds }, isPrimary: true });
  const imageMap = new Map(images.map((img) => [img.productId.toString(), img.imagePath]));

  const normalizedItems = items
    .filter((item) => item.productId)
    .map((item) => {
      const itemSubtotal = item.price * item.quantity;
      return {
        id: item._id,
        quantity: item.quantity,
        price: item.price,
        subtotal: itemSubtotal,
        product: {
          id: item.productId._id,
          name: item.productId.name,
          slug: item.productId.slug,
          status: item.productId.status,
          stockQuantity: item.productId.stockQuantity,
          image: imageMap.get(item.productId._id.toString()) ?? '',
        },
      };
    });

  const total = normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    id: cart._id,
    items: normalizedItems,
    subtotal: total,
    total,
  };
};

const addCartItem = async (userId, productId, quantity) => {
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) {
    const error = new Error('Quantity must be a positive integer.');
    error.status = 400;
    throw error;
  }

  const [cart, product] = await Promise.all([getOrCreateCart(userId), ensurePurchasableProduct(productId)]);
  const existing = await CartItem.findOne({ cartId: cart._id, productId });

  const finalQuantity = existing ? existing.quantity + qty : qty;
  if (finalQuantity > product.stockQuantity) {
    const error = new Error('Requested quantity exceeds available stock.');
    error.status = 400;
    throw error;
  }

  if (existing) {
    existing.quantity = finalQuantity;
    existing.price = getEffectivePrice(product);
    await existing.save();
  } else {
    await CartItem.create({
      cartId: cart._id,
      productId,
      quantity: qty,
      price: getEffectivePrice(product),
    });
  }

  return getCartDetails(userId);
};

const updateCartItem = async (userId, itemId, quantity) => {
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) {
    const error = new Error('Quantity must be a positive integer.');
    error.status = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    const error = new Error('Invalid cart item ID.');
    error.status = 400;
    throw error;
  }

  const cart = await getOrCreateCart(userId);
  const item = await CartItem.findOne({ _id: itemId, cartId: cart._id });
  if (!item) {
    const error = new Error('Cart item not found.');
    error.status = 404;
    throw error;
  }

  const product = await ensurePurchasableProduct(item.productId);
  if (qty > product.stockQuantity) {
    const error = new Error('Requested quantity exceeds available stock.');
    error.status = 400;
    throw error;
  }

  item.quantity = qty;
  item.price = getEffectivePrice(product);
  await item.save();

  return getCartDetails(userId);
};

const removeCartItem = async (userId, itemId) => {
  if (!mongoose.Types.ObjectId.isValid(itemId)) {
    const error = new Error('Invalid cart item ID.');
    error.status = 400;
    throw error;
  }

  const cart = await getOrCreateCart(userId);
  const item = await CartItem.findOne({ _id: itemId, cartId: cart._id });
  if (!item) {
    const error = new Error('Cart item not found.');
    error.status = 404;
    throw error;
  }

  await item.deleteOne();
  return getCartDetails(userId);
};

module.exports = {
  getCartDetails,
  addCartItem,
  updateCartItem,
  removeCartItem,
};
