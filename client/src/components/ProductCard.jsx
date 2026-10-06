import { useNavigate } from "react-router-dom";
import { FiHeart, FiShoppingBag } from "react-icons/fi";
import { formatPrice } from "../utils/formatPrice";

const getDisplayPrice = (product) => {
  const variantPrices = (product.variantCombinations || [])
    .map((combo) => Number(combo?.price || 0))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (variantPrices.length) {
    return Math.min(...variantPrices);
  }

  return Number(product.price || 0);
};

const ProductCard = ({
  product,
  addToCart,
  toggleWishlist,
  isInWishlist,
  wishlistKey,
  compact = false,
}) => {
  const navigate = useNavigate();

  const rating = Number(product.avgRating || 0);
  const reviewCount = Number(product.reviewCount || product.reviews?.length || 0);
  const hasReviews = rating > 0 || reviewCount > 0;
  const ratingLabel = rating > 0 ? rating.toFixed(1) : "0.0";
  const activeWishlistKey = wishlistKey || product.wishlistKey || product._id;
  const displayPrice = getDisplayPrice(product);

  const openProduct = () => {
    navigate(`/product/${product._id}`, {
      state: { product },
    });
  };

  return (
    <article className="group w-full animate-card-in transition-transform duration-300 ease-out hover:-translate-y-1">
      <div className="relative overflow-hidden rounded-xl bg-[#f8e8e5] shadow-sm ring-1 ring-[#efd7d9]">
        <button
          type="button"
          onClick={openProduct}
          className={`block w-full overflow-hidden bg-amber-600 text-left ${compact ? "aspect-[1.06/1]" : "aspect-square"
            }`}
        >
          <img
            src={product.images?.[0]}
            alt={product.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
          />
        </button>

        <button
          type="button"
          onClick={() => toggleWishlist({ ...product, wishlistKey: activeWishlistKey })}
          aria-label="Add to wishlist"
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/82 text-red-700 shadow-sm backdrop-blur transition hover:scale-110 hover:bg-white"
        >
          <FiHeart
            strokeWidth={2.2}
            className={`text-lg ${isInWishlist(activeWishlistKey) ? "fill-red-700" : ""}`}
          />
        </button>

        <button
          type="button"
          onClick={() => addToCart(product)}
          disabled={product.quantity <= 0}
          aria-label="Add to cart"
          className={`absolute bottom-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#3A001F] shadow-sm transition ${product.quantity > 0
              ? "hover:scale-105 hover:bg-[#3A001F] hover:text-white"
              : "cursor-not-allowed opacity-50"
            }`}
        >
          <FiShoppingBag size={16} />
        </button>

        {hasReviews && (
          <div className="absolute bottom-2 left-2 flex items-center justify-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[#3A001F] shadow-sm">
            <span>{ratingLabel}</span>
            <img className="h-[10px]" src="/star.png" alt="" />
            <span className="h-3 w-px bg-[#7a1f3f]/18" />
            <span>{reviewCount}</span>
          </div>
        )}
      </div>

      <button type="button" onClick={openProduct} className="mt-3 block w-full text-left">
        <h3 className="line-clamp-1 bodoni-moda tracking-wide text-sm font-normal group-hover:underline leading-5 text-black sm:text-base">
          {product.name}
        </h3>
        <p className="bodoni-moda mt-2 text-sm font-bold leading-none text-[#3A001F] sm:text-base">
          ₹ {formatPrice(displayPrice)}.00
        </p>

      </button>
    </article>
  );
};

export default ProductCard;
