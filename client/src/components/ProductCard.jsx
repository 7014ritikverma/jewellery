// 

import { useNavigate } from "react-router-dom";

import {
    FiHeart,
    FiShoppingBag
} from "react-icons/fi";

const ProductCard = ({
    product,
    addToCart,
    toggleWishlist,
    isInWishlist
}) => {

    const navigate = useNavigate();

    const rating = Number(product.avgRating || 0);

    const roundedRating = Math.round(rating);

    const reviewCount = Number(
        product.reviewCount ||
        product.reviews?.length ||
        0
    );

    const handleBuyNow = () => {

        navigate(`/product/${product._id}`, {
            state: { product }
        });
    };

    return (

        <div className="group bg-white rounded-[24px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 relative w-full">
 
            {/* WISHLIST */}
            <button
                onClick={() => toggleWishlist(product)}
                className="absolute top-3 right-3 md:top-5 md:right-5 z-20 bg-white/90 backdrop-blur-md shadow-md p-2 md:p-2 rounded-full hover:scale-110 transition duration-300"
            >

                <FiHeart
                    className={`text-lg md:text-xl ${isInWishlist(product._id)
                        ? "text-red-500"
                        : "text-gray-500"
                        }`}
                />

            </button>

            {/* IMAGE */}
            <div
                onClick={() =>
                    navigate(`/product/${product._id}`, {
                        state: { product }
                    })
                }
                className="relative overflow-hidden cursor-pointer"
            >

                <img
                    src={product.images?.[0]}
                    alt={product.name}
                    className="h-[220px] sm:h-[260px] md:h-[320px] w-full object-cover group-hover:scale-110 transition duration-700"
                />

                {/* OVERLAY */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition duration-500"></div>

                {/* QUICK VIEW */}
                <button
                    onClick={handleBuyNow}
                    className="hidden md:block absolute bottom-5 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 rounded-full shadow-xl opacity-0 group-hover:opacity-100 translate-y-10 group-hover:translate-y-0 transition-all duration-500 font-medium"
                >
                    Quick View
                </button>

            </div>

            {/* CONTENT */}
            <div className="p-4 md:p-5">

                {/* CATEGORY */}
                <p className="uppercase tracking-[2px] md:tracking-[3px] text-[10px] md:text-xs text-gray-400 mb-2">

                    Luxury Jewellery

                </p>

                {/* TITLE */}
                <h3 className="text-[15px] sm:text-lg md:text-xl font-semibold text-[#2b2b2b] mb-2 md:mb-3 line-clamp-1">

                    {product.name}

                </h3>

                {/* RATING */}
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 flex-wrap">

                    <div className="flex text-yellow-500 text-xs md:text-sm">

                        {"★".repeat(roundedRating)}
                        {"☆".repeat(5 - roundedRating)}

                    </div>

                    <span className="text-xs md:text-sm text-gray-500">

                        {rating
                            ? rating.toFixed(1)
                            : "No rating"}

                        {" "}({reviewCount})

                    </span>

                </div>

                {/* PRICE */}
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-5 flex-wrap">

                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#6b0f1a]">

                        ₹{Number(product.price).toLocaleString(
                            "en-IN",
                            {
                                minimumFractionDigits: 2,
                            }
                        )}

                    </h2>

                    <span className="text-gray-400 line-through text-sm md:text-base">

                        ₹{Number(product.price * 1.4).toLocaleString(
                            "en-IN",
                            {
                                minimumFractionDigits: 2,
                            }
                        )}

                    </span>

                </div>

                {/* BUTTONS */}
                <div className="flex gap-2 md:gap-3">

                    {/* BUY NOW */}
                    <button
                        onClick={handleBuyNow}
                        className="w-full bg-black hover:bg-[#111] text-white py-2.5 md:py-3 rounded-full transition duration-300 font-medium text-sm md:text-base"
                    >

                        Buy Now

                    </button>

                    {/* ADD TO CART */}
                    <button
                        onClick={() => addToCart(product)}
                        className="w-full bg-[#6b0f1a] hover:bg-[#4e0912] text-white py-2.5 md:py-3 rounded-full transition duration-300 flex items-center justify-center gap-2 font-medium text-sm md:text-base"
                    >

                        <FiShoppingBag />

                        <span className="hidden sm:block">
                            Add
                        </span>

                    </button>

                </div>

            </div>

        </div>
    );
};

export default ProductCard;