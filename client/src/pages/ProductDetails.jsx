// import { useLocation, useParams } from "react-router-dom";
// import BuySection from "../components/BuySection";
// import { useContext, useEffect, useState } from "react";
// import { CartContext } from "../context/CartContext";
// import axios from "axios";
// import { WishlistContext } from "../context/WishlistContext";

// const ProductDetails = () => {
//     const location = useLocation();
//     const { id } = useParams();

//     const { toggleWishlist, isInWishlist } = useContext(WishlistContext);
//     const { addToCart } = useContext(CartContext);

//     const [product, setProduct] = useState(location.state?.product || null);
//     const [mainImage, setMainImage] = useState("");
//     const [loading, setLoading] = useState(true);

//     const [related, setRelated] = useState([]);
//     const [filter, setFilter] = useState({
//         minPrice: 0,
//         maxPrice: 100000,
//         rating: 0
//     });

//     // 🔥 API fallback
//     useEffect(() => {
//         if (!product && id) {
//             axios
//                 .get(`http://localhost:5000/api/products/${id}`)
//                 .then((res) => {
//                     setProduct(res.data);
//                 })
//                 .catch(() => {
//                     setProduct(null);
//                 })
//                 .finally(() => setLoading(false));
//         } else {
//             setLoading(false);
//         }
//     }, [id, product]);

//     useEffect(() => {
//         if (product?.category) {
//             axios.get("http://localhost:5000/api/products")
//                 .then(res => {
//                     let data = res.data;

//                     // SAME CATEGORY
//                     data = data.filter(p =>
//                         p.category === product.category &&
//                         p._id !== product._id
//                     );

//                     // PRICE FILTER
//                     data = data.filter(p =>
//                         p.price >= filter.minPrice && p.price <= filter.maxPrice
//                     );

//                     // RATING FILTER
//                     if (filter.rating > 0) {
//                         data = data.filter(p => (p.avgRating || 0) >= filter.rating);
//                     }

//                     setRelated(data.slice(0, 8));
//                 });
//         }
//     }, [product, filter]);

//     // 🔥 Image set
//     useEffect(() => {
//         if (product?.images?.length > 0) {
//             setMainImage(product.images[0]);
//         }
//     }, [product]);

//     // 🔥 Loading UI
//     if (loading) {
//         return <h2 className="text-center mt-20">Loading...</h2>;
//     }

//     // 🔥 Error UI
//     if (!product) {
//         return <h2 className="text-center mt-20">Product not found ❌</h2>;
//     }

//     const rating = Number(product.avgRating || 0);
//     const roundedRating = Math.round(rating);
//     const reviewCount = Number(product.reviewCount || product.reviews?.length || 0);

//     return (
//         <div className="p-10 mt-24 w-full flex flex-col items-center">

//             {/* TOP SECTION */}
//             <div className="flex gap-10">

//                 {/* LEFT SIDE */}
//                 <div>

//                     <div className="relative">
//                         <img
//                             src={mainImage}
//                             className="h-[600px] w-[600px] object-cover rounded-xl"
//                         />

//                         <button
//                             onClick={() => toggleWishlist(product)}
//                             className="text-2xl absolute right-2 top-2"
//                         >
//                             {isInWishlist(product._id) ? "❤️" : "🤍"}
//                         </button>
//                     </div>

//                     {/* THUMBNAILS */}
//                     <div className="flex gap-3 mt-4">
//                         {product.images?.map((img, i) => (
//                             <img
//                                 key={i}
//                                 src={img}
//                                 onClick={() => setMainImage(img)}
//                                 className="h-20 w-20 rounded cursor-pointer border hover:scale-105"
//                             />
//                         ))}
//                     </div>

//                 </div>

//                 {/* RIGHT SIDE */}
//                 <BuySection product={product} addToCart={addToCart} />

//             </div>



//             <div className="mt-16 w-full max-w-6xl">

//                 <h2 className="text-2xl font-bold mb-4">Filter Related Products</h2>

//                 <div className="flex gap-4 mb-6">

//                     <input
//                         type="number"
//                         placeholder="Min Price"
//                         className="border p-2"
//                         onChange={(e) =>
//                             setFilter({ ...filter, minPrice: Number(e.target.value) })
//                         }
//                     />

//                     <input
//                         type="number"
//                         placeholder="Max Price"
//                         className="border p-2"
//                         onChange={(e) =>
//                             setFilter({ ...filter, maxPrice: Number(e.target.value) })
//                         }
//                     />

//                     <select
//                         className="border p-2"
//                         onChange={(e) =>
//                             setFilter({ ...filter, rating: Number(e.target.value) })
//                         }
//                     >
//                         <option value="0">All Ratings</option>
//                         <option value="4">4★+</option>
//                         <option value="3">3★+</option>
//                     </select>

//                 </div>

//                 {/* 🔥 RELATED PRODUCTS */}
//                 <div className="grid md:grid-cols-4 gap-6">

//                     {related.length > 0 ? (
//                         related.map((p) => (
//                             <div
//                                 key={p._id}
//                                 className="cursor-pointer"
//                                 onClick={() => window.location.href = `/product/${p._id}`}
//                             >
//                                 <img
//                                     src={p.images?.[0]}
//                                     className="h-40 w-full object-cover rounded"
//                                 />
//                                 <p className="mt-2">{p.name}</p>
//                                 <p className="text-sm text-yellow-500">
//                                     {"★".repeat(Math.round(p.avgRating || 0))}{"☆".repeat(5 - Math.round(p.avgRating || 0))}
//                                     <span className="text-gray-600 ml-2">
//                                         {p.avgRating ? Number(p.avgRating).toFixed(1) : "No rating"}
//                                     </span>
//                                 </p>
//                                 <p className="text-red-500">₹{Number(p.price).toLocaleString("en-IN", {
//                                     minimumFractionDigits: 2,
//                                 })}</p>
//                             </div>
//                         ))
//                     ) : (
//                         <p>No related products 😔</p>
//                     )}

//                 </div>

//             </div>

//             {/* 🔥 FILTER UI */}
//             <div className="mt-12 w-full max-w-6xl">
//                 <h2 className="text-2xl font-bold mb-3">Customer Reviews</h2>
//                 <div className="flex items-center gap-3 mb-4">
//                     <span className="text-yellow-500 text-xl">
//                         {"★".repeat(roundedRating)}{"☆".repeat(5 - roundedRating)}
//                     </span>
//                     <span className="font-semibold">
//                         {rating ? rating.toFixed(1) : "No rating"} out of 5
//                     </span>
//                     <span className="text-gray-500">({reviewCount} reviews)</span>
//                 </div>

//                 {product.reviews?.length > 0 ? (
//                     <div className="space-y-3">
//                         {product.reviews.map((review) => (
//                             <div key={review._id} className="border p-4 rounded">
//                                 <div className="flex items-center justify-between">
//                                     <p className="font-semibold">{review.name || "Customer"}</p>
//                                     <span className="text-yellow-500">
//                                         {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
//                                     </span>
//                                 </div>
//                                 <p className="text-gray-700 mt-2">{review.comment}</p>
//                                 <p className="text-xs text-gray-400 mt-2">
//                                     {new Date(review.createdAt).toDateString()}
//                                 </p>
//                             </div>
//                         ))}
//                     </div>
//                 ) : (
//                     <p className="text-gray-500">No reviews yet.</p>
//                 )}
//             </div>

//         </div>
//     );
// };

// export default ProductDetails;


import { useLocation, useParams } from "react-router-dom";
import BuySection from "../components/BuySection";
import { useContext, useEffect, useState } from "react";
import { CartContext } from "../context/CartContext";
import axios from "axios";
import { WishlistContext } from "../context/WishlistContext";

const ProductDetails = () => {
    const location = useLocation();
    const { id } = useParams();

    const { toggleWishlist, isInWishlist } = useContext(WishlistContext);
    const { addToCart } = useContext(CartContext);

    const [product, setProduct] = useState(location.state?.product || null);
    const [mainImage, setMainImage] = useState("");
    const [loading, setLoading] = useState(true);

    const [related, setRelated] = useState([]);
    const [filter, setFilter] = useState({
        minPrice: 0,
        maxPrice: 100000,
        rating: 0
    });

    // 🔥 API fallback
    useEffect(() => {
        if (!product && id) {
            axios
                .get(`http://localhost:5000/api/products/${id}`)
                .then((res) => {
                    setProduct(res.data);
                })
                .catch(() => {
                    setProduct(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [id, product]);

    useEffect(() => {
        if (product?.category) {
            axios.get("http://localhost:5000/api/products")
                .then(res => {
                    let data = res.data;

                    // SAME CATEGORY
                    data = data.filter(p =>
                        p.category === product.category &&
                        p._id !== product._id
                    );

                    // PRICE FILTER
                    data = data.filter(p =>
                        p.price >= filter.minPrice && p.price <= filter.maxPrice
                    );

                    // RATING FILTER
                    if (filter.rating > 0) {
                        data = data.filter(p => (p.avgRating || 0) >= filter.rating);
                    }

                    setRelated(data.slice(0, 8));
                });
        }
    }, [product, filter]);

    // 🔥 Image set
    useEffect(() => {
        if (product?.images?.length > 0) {
            setMainImage(product.images[0]);
        }
    }, [product]);

    // 🔥 Loading UI
    if (loading) {
        return <h2 className="text-center mt-20">Loading...</h2>;
    }

    // 🔥 Error UI
    if (!product) {
        return <h2 className="text-center mt-20">Product not found ❌</h2>;
    }

    const rating = Number(product.avgRating || 0);
    const roundedRating = Math.round(rating);
    const reviewCount = Number(product.reviewCount || product.reviews?.length || 0);

    return (
        <div className="p-10 mt-24 w-full flex flex-col items-center">

            {/* TOP SECTION */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 w-full max-w-7xl">

                {/* LEFT SIDE */}
                <div className="w-full lg:w-1/2">

                    <div className="relative">
                        <img
                            src={mainImage}
                            className="w-full h-[320px] sm:h-[450px] lg:h-[650px] object-cover rounded-2xl shadow-lg
"
                        />

                        <button
                            onClick={() => toggleWishlist(product)}
                            className="text-2xl absolute right-3 top-3 bg-white/90 p-2 rounded-full shadow-md
"
                        >
                            {isInWishlist(product._id) ? "❤️" : "🤍"}
                        </button>
                    </div>

                    {/* THUMBNAILS */}
                    <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                        {product.images?.map((img, i) => (
                            <img
                                key={i}
                                src={img}
                                onClick={() => setMainImage(img)} className="h-20 w-20 min-w-[80px] object-cover rounded-xl cursor-pointer border hover:scale-105 transition
"
                            />
                        ))}
                    </div>

                </div>

                {/* RIGHT SIDE */}
                <div className="w-full lg:w-1/2">
                    <BuySection
                        product={product}
                        addToCart={addToCart}
                    />
                </div>

            </div>



            <div className="mt-16 w-full max-w-6xl">

                <h2 className="text-2xl font-bold mb-4">Filter Related Products</h2>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">

                    <input
                        type="number"
                        placeholder="Min Price"
                        className="border p-2"
                        onChange={(e) =>
                            setFilter({ ...filter, minPrice: Number(e.target.value) })
                        }
                    />

                    <input
                        type="number"
                        placeholder="Max Price"
                        className="border p-2"
                        onChange={(e) =>
                            setFilter({ ...filter, maxPrice: Number(e.target.value) })
                        }
                    />

                    <select
                        className="border p-2"
                        onChange={(e) =>
                            setFilter({ ...filter, rating: Number(e.target.value) })
                        }
                    >
                        <option value="0">All Ratings</option>
                        <option value="4">4★+</option>
                        <option value="3">3★+</option>
                    </select>

                </div>

                {/* 🔥 RELATED PRODUCTS */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">

                    {related.length > 0 ? (
                        related.map((p) => (
                            <div
                                key={p._id}
                                className="cursor-pointer"
                                onClick={() => window.location.href = `/product/${p._id}`}
                            >
                                <img
                                    src={p.images?.[0]}
                                    className="h-40 w-full object-cover rounded"
                                />
                                <p className="mt-2">{p.name}</p>
                                <p className="text-sm text-yellow-500">
                                    {"★".repeat(Math.round(p.avgRating || 0))}{"☆".repeat(5 - Math.round(p.avgRating || 0))}
                                    <span className="text-gray-600 ml-2">
                                        {p.avgRating ? Number(p.avgRating).toFixed(1) : "No rating"}
                                    </span>
                                </p>
                                <p className="text-red-500">₹{Number(p.price).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                })}</p>
                            </div>
                        ))
                    ) : (
                        <p>No related products 😔</p>
                    )}

                </div>

            </div>

            {/* 🔥 FILTER UI */}
            <div className="mt-12 w-full max-w-6xl">
                <h2 className="text-2xl font-bold mb-3">Customer Reviews</h2>
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-yellow-500 text-xl">
                        {"★".repeat(roundedRating)}{"☆".repeat(5 - roundedRating)}
                    </span>
                    <span className="font-semibold">
                        {rating ? rating.toFixed(1) : "No rating"} out of 5
                    </span>
                    <span className="text-gray-500">({reviewCount} reviews)</span>
                </div>

                {product.reviews?.length > 0 ? (
                    <div className="space-y-3">
                        {product.reviews.map((review) => (
                            <div key={review._id} className="border p-4 rounded">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold">{review.name || "Customer"}</p>
                                    <span className="text-yellow-500">
                                        {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                                    </span>
                                </div>
                                <p className="text-gray-700 mt-2">{review.comment}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                    {new Date(review.createdAt).toDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No reviews yet.</p>
                )}
            </div>

        </div>
    );
};

export default ProductDetails;
