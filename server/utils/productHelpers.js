const slugify = (value) =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const getEffectivePrice = (product) =>
  product.discountPrice !== null && product.discountPrice !== undefined
    ? product.discountPrice
    : product.price;

module.exports = {
  slugify,
  getEffectivePrice,
};
