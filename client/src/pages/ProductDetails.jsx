import { useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, ChevronRight, Heart, PlayCircle, Share2, X } from "lucide-react";
import BuySection from "../components/BuySection";
import ProductCard from "../components/ProductCard";
import { CartContext } from "../context/CartContext";
import { WishlistContext } from "../context/WishlistContext";
import EmptyState from "../components/EmptyState";
import PageLoader from "../components/PageLoader";

const getShareUrl = (id) => {
    if (typeof window === "undefined") return `/product/${id}`;
    return `${window.location.origin}/product/${id}`;
};

const getVideoEmbedUrl = (url = "") => {
    if (!url) return "";

    try {
        const videoUrl = new URL(url);

        if (videoUrl.hostname.includes("youtu.be")) {
            return `https://www.youtube.com/embed/${videoUrl.pathname.replace("/", "")}`;
        }

        if (videoUrl.hostname.includes("youtube.com")) {
            const watchId = videoUrl.searchParams.get("v");
            if (watchId) return `https://www.youtube.com/embed/${watchId}`;

            const shortsMatch = videoUrl.pathname.match(/\/shorts\/([^/?]+)/);
            if (shortsMatch?.[1]) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
        }
    } catch {
        return url;
    }

    return url;
};

const isDirectVideo = (url = "") => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

const getProductMetals = (item) => (
    Array.isArray(item?.materials)
        ? item.materials.map((material) => material?.metal).filter(Boolean)
        : []
);

const ProductDetails = () => {
    const { id } = useParams();
    const { addToCart } = useContext(CartContext);
    const { toggleWishlist, isInWishlist } = useContext(WishlistContext);

    const [product, setProduct] = useState(null);
    const [mainImage, setMainImage] = useState("");
    const [mainMediaType, setMainMediaType] = useState("image");
    const [selectedVariantImages, setSelectedVariantImages] = useState([]);
    const [openReviewImage, setOpenReviewImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [allRelated, setAllRelated] = useState([]);
    const thumbnailRowRef = useRef(null);

    useEffect(() => {
        if (!id) return;

        setLoading(true);
        axios
            .get(`/api/products/${id}`)
            .then((res) => setProduct(res.data))
            .catch(() => setProduct(null))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (!product?.category) return;

        const metals = getProductMetals(product);
        const params = new URLSearchParams({ category: product.category });

        Promise.all([
            axios.get(`/api/products?${params.toString()}`),
            axios.get(`/api/products?page=1&limit=16`),
        ])
            .then(([categoryRes, fallbackRes]) => {
                const categoryProducts = Array.isArray(categoryRes.data)
                    ? categoryRes.data
                    : categoryRes.data.products || [];
                const fallbackProducts = Array.isArray(fallbackRes.data)
                    ? fallbackRes.data
                    : fallbackRes.data.products || [];
                const relatedProducts = categoryProducts.filter(
                    (item) =>
                        item.category === product.category &&
                        item._id !== product._id &&
                        (
                            !metals.length ||
                            getProductMetals(item).some((metal) => metals.includes(metal))
                        )
                );

                const fallbackRelated = fallbackProducts.filter((item) => item._id !== product._id);
                setAllRelated(relatedProducts.length ? relatedProducts : fallbackRelated);
            })
            .catch((err) => console.log(err));
    }, [product]);

    useEffect(() => {
        setSelectedVariantImages([]);

        if (product?.images?.length > 0) {
            setMainImage(product.images[0]);
            setMainMediaType("image");
            return;
        }

        if (product?.videoUrl) {
            setMainImage(getVideoEmbedUrl(product.videoUrl));
            setMainMediaType("video");
        }
    }, [product]);

    if (loading) {
        return <div className="mt-32"><PageLoader label="Loading product..." /></div>;
    }

    if (!product) {
        return (
            <div className="mt-32">
                <EmptyState
                    title="Product not found"
                    message="This product may be unavailable or the link may have changed."
                />
            </div>
        );
    }

    const rating = Number(product.avgRating || 0);
    const roundedRating = Math.max(0, Math.min(5, Math.round(rating)));
    const reviewCount = Number(product.reviewCount || product.reviews?.length || 0);
    const videoEmbedUrl = getVideoEmbedUrl(product.videoUrl);
    const related = allRelated.slice(0, 8);
    const galleryImages = selectedVariantImages.length ? selectedVariantImages : product.images || [];
    const reviewImages = (product.reviews || []).flatMap((review) =>
        (review.images || []).filter(Boolean).map((image) => ({
            image,
            reviewId: review._id,
            name: review.name || "Customer",
        }))
    );
    const openReview = openReviewImage ? reviewImages[openReviewImage.index] : null;

    const scrollThumbnails = (direction) => {
        thumbnailRowRef.current?.scrollBy({ left: direction * 260, behavior: "smooth" });
    };

    const moveReviewImage = (direction) => {
        if (!reviewImages.length) return;

        setOpenReviewImage((current) => ({
            index: ((current?.index || 0) + direction + reviewImages.length) % reviewImages.length,
        }));
    };

    const shareProduct = async () => {
        const productUrl = getShareUrl(product._id);

        if (navigator.share) {
            await navigator.share({
                title: product.name,
                text: `Check out ${product.name}`,
                url: productUrl,
            });
            return;
        }

        await navigator.clipboard.writeText(productUrl);
        alert("Product link copied");
    };

    return (
        <div className="mt-24 flex w-full bodoni-moda flex-col items-center px-4 py-8 sm:px-6 lg:px-14">
            <div className="flex w-full max-w-7xl flex-col gap-8 md:flex-row md:gap-12">
                <div className="w-full lg:w-1/2">
                    <div className="relative">
                        {mainMediaType === "video" ? (
                            isDirectVideo(mainImage) ? (
                                <video
                                    key={mainImage}
                                    src={mainImage}
                                    className="h-[320px] w-full rounded-2xl bg-black object-cover shadow-lg sm:h-[450px] lg:h-[650px]"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                />
                            ) : (
                                <iframe
                                    src={mainImage}
                                    title={`${product.name} showcase video`}
                                    className="h-[320px] w-full rounded-2xl bg-black shadow-lg sm:h-[450px] lg:h-[650px]"
                                    allow="autoplay; encrypted-media; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            )
                        ) : (
                            <img
                                src={mainImage}
                                alt={product.name}
                                className="h-[320px] w-full rounded-2xl object-cover shadow-lg sm:h-[600px] lg:h-[600px]"
                            />
                        )}

                        <button
                            type="button"
                            onClick={() => toggleWishlist(product)}
                            className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-red-700 shadow-md transition hover:bg-white"
                            aria-label="Add to wishlist"
                        >
                            <Heart
                                size={22}
                                className={isInWishlist(product._id) ? "fill-red-700" : ""}
                            />
                        </button>

                        <button
                            type="button"
                            onClick={shareProduct}
                            title="Share product"
                            className="absolute right-3 top-16 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#3A001F] shadow-md transition hover:bg-white"
                        >
                            <Share2 size={20} />
                        </button>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                        <button
                            type="button"
                            aria-label="Previous product image"
                            onClick={() => scrollThumbnails(-1)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#3A001F] shadow-md ring-1 ring-[#581b3c]/20 transition hover:bg-[#3A001F] hover:text-white"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <div
                            ref={thumbnailRowRef}
                            className="flex flex-1 gap-3 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {galleryImages.map((img, index) => (
                                <button
                                    key={img || index}
                                    type="button"
                                    onClick={() => {
                                        setMainImage(img);
                                        setMainMediaType("image");
                                    }}
                                    className={`h-24 w-24 min-w-20 overflow-hidden rounded-xl border transition hover:scale-105 ${mainImage === img && mainMediaType === "image"
                                        ? "border-[#3A001F] ring-2 ring-[#3A001F]/20"
                                        : "border-[#ead5dc]"
                                        }`}
                                >
                                    <img
                                        src={img}
                                        alt={`${product.name} ${index + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                </button>
                            ))}

                            {videoEmbedUrl && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMainImage(videoEmbedUrl);
                                        setMainMediaType("video");
                                    }}
                                    className="relative h-24 w-24 min-w-20 overflow-hidden rounded-xl border bg-[#3A001F] text-white transition hover:scale-105"
                                    title="Play product video"
                                >
                                    <span className="absolute inset-0 bg-[#3A001F]/60" />
                                    <PlayCircle
                                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                        size={28}
                                    />
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            aria-label="Next product image"
                            onClick={() => scrollThumbnails(1)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#3A001F] shadow-md ring-1 ring-[#581b3c]/20 transition hover:bg-[#3A001F] hover:text-white"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="w-full lg:w-1/2">
                    <BuySection
                        product={product}
                        addToCart={addToCart}
                        onVariantImageSelect={(image, images = []) => {
                            const nextImages = Array.isArray(images) ? images.filter(Boolean) : [];
                            setSelectedVariantImages(nextImages);

                            if (image) {
                                setMainImage(image);
                                setMainMediaType("image");
                            }
                        }}
                    />
                </div>
            </div>

            <div className="mt-16 w-full max-w-7xl">
                <section>
                    <div className="mb-5 flex items-center justify-between gap-4">
                        <h2 className="text-2xl font-bold text-[#3A001F]">Related Products</h2>
                        <p className="text-sm text-[#3A001F]">{related.length} product</p>
                    </div>

                    {related.length > 0 ? (
                        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
                            {related.map((item) => (
                                <ProductCard
                                    key={item._id}
                                    product={item}
                                    addToCart={addToCart}
                                    toggleWishlist={toggleWishlist}
                                    isInWishlist={isInWishlist}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="No related products"
                            message="More matching jewellery will appear here when available."
                        />
                    )}
                </section>
            </div>

            <div className="mt-12 w-full max-w-7xl text-[#3A001F]">
                <h2 className="mb-3 text-2xl font-bold ">Customer Reviews</h2>

                <div className="mb-4 flex items-center gap-3">
                    <span className="text-xl text-yellow-500">
                        {"*".repeat(roundedRating)}{"☆".repeat(5 - roundedRating)}
                    </span>
                    <span className="font-semibold">
                        {rating ? rating.toFixed(1) : "No rating"} out of 5
                    </span>
                    <span className="text-[#A56028]">({reviewCount} reviews)</span>
                </div>

                {product.reviews?.length > 0 ? (
                    <div className="space-y-3">
                        {product.reviews.map((review) => (
                            <div key={review._id} className="rounded border p-4">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold">{review.name || "Customer"}</p>
                                    <span className="text-yellow-500">
                                        {"*".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                                    </span>
                                </div>
                                <p className="mt-2 text-[#A56028]">{review.comment}</p>
                                {review.images?.length > 0 && (
                                    <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                                        {review.images.map((image, index) => (
                                            <button
                                                key={`${review._id}-${index}`}
                                                type="button"
                                                onClick={() => setOpenReviewImage({
                                                    index: Math.max(0, reviewImages.findIndex((item) => (
                                                        item.image === image && item.reviewId === review._id
                                                    ))),
                                                })}
                                                className="h-24 w-24 overflow-hidden rounded-lg border"
                                            >
                                                <img
                                                    src={image}
                                                    alt={`${review.name || "Customer"} review ${index + 1}`}
                                                    className="h-full w-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <p className="mt-2 text-xs text-gray-500">
                                    {new Date(review.createdAt).toDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="No reviews yet"
                        message="Customer reviews and photos will appear here after delivered orders."
                    />
                )}
            </div>

            {openReview && (
                <div
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setOpenReviewImage(null)}
                >
                    <button
                        type="button"
                        aria-label="Close review gallery"
                        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#3A001F] shadow-lg"
                        onClick={() => setOpenReviewImage(null)}
                    >
                        <X size={20} />
                    </button>
                    {reviewImages.length > 1 && (
                        <button
                            type="button"
                            aria-label="Previous review image"
                            className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#3A001F] shadow-lg transition hover:bg-[#3A001F] hover:text-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                moveReviewImage(-1);
                            }}
                        >
                            <ChevronLeft size={24} />
                        </button>
                    )}
                    <img
                        src={openReview.image}
                        alt={`${openReview.name} review`}
                        className="max-h-[86vh] max-w-[94vw] rounded-lg object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                    {reviewImages.length > 1 && (
                        <button
                            type="button"
                            aria-label="Next review image"
                            className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#3A001F] shadow-lg transition hover:bg-[#3A001F] hover:text-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                moveReviewImage(1);
                            }}
                        >
                            <ChevronRight size={24} />
                        </button>
                    )}
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-[#3A001F]">
                        {(openReviewImage.index || 0) + 1} / {reviewImages.length}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetails;


// import { useContext, useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import axios from "axios";
// import { Heart, PlayCircle, Share2 } from "lucide-react";
// import BuySection from "../components/BuySection";
// import ProductCard from "../components/ProductCard";
// import { CartContext } from "../context/CartContext";
// import { WishlistContext } from "../context/WishlistContext";

// const getShareUrl = (id) => {
//     if (typeof window === "undefined") return `/product/${id}`;
//     return `${window.location.origin}/product/${id}`;
// };

// const getVideoEmbedUrl = (url = "") => {
//     if (!url) return "";

//     try {
//         const videoUrl = new URL(url);

//         if (videoUrl.hostname.includes("youtu.be")) {
//             return `https://www.youtube.com/embed/${videoUrl.pathname.replace("/", "")}`;
//         }

//         if (videoUrl.hostname.includes("youtube.com")) {
//             const watchId = videoUrl.searchParams.get("v");

//             if (watchId) {
//                 return `https://www.youtube.com/embed/${watchId}`;
//             }

//             const shortsMatch = videoUrl.pathname.match(/\/shorts\/([^/?]+)/);

//             if (shortsMatch?.[1]) {
//                 return `https://www.youtube.com/embed/${shortsMatch[1]}`;
//             }
//         }

//     } catch {
//         return url;
//     }

//     return url;
// };

// const isDirectVideo = (url = "") =>
//     /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

// const getProductMetals = (item) => (
//     Array.isArray(item?.materials)
//         ? item.materials
//             .map((material) => material?.metal)
//             .filter(Boolean)
//         : []
// );

// const ProductDetails = () => {

//     const { id } = useParams();

//     const { addToCart } = useContext(CartContext);

//     const { toggleWishlist, isInWishlist } =
//         useContext(WishlistContext);

//     const [product, setProduct] = useState(null);

//     const [mainImage, setMainImage] = useState("");

//     const [mainMediaType, setMainMediaType] =
//         useState("image");

//     const [variantImages, setVariantImages] =
//         useState([]);

//     const [loading, setLoading] = useState(true);

//     const [allRelated, setAllRelated] = useState([]);

//     useEffect(() => {

//         if (!id) return;

//         setLoading(true);

//         axios
//             .get(`/api/products/${id}`)

//             .then((res) => setProduct(res.data))

//             .catch(() => setProduct(null))

//             .finally(() => setLoading(false));

//     }, [id]);

//     useEffect(() => {

//         if (!product?.category) return;

//         const metals = getProductMetals(product);

//         const params = new URLSearchParams({
//             category: product.category
//         });

//         axios
//             .get(`/api/products?${params.toString()}`)

//             .then((res) => {

//                 const products = Array.isArray(res.data)
//                     ? res.data
//                     : res.data.products || [];

//                 const relatedProducts = products.filter(
//                     (item) =>
//                         item.category === product.category &&
//                         item._id !== product._id &&
//                         (
//                             !metals.length ||
//                             getProductMetals(item)
//                                 .some((metal) =>
//                                     metals.includes(metal)
//                                 )
//                         )
//                 );

//                 setAllRelated(relatedProducts);

//             })

//             .catch((err) => console.log(err));

//     }, [product]);

//     useEffect(() => {

//         if (variantImages.length > 0) {

//             setMainImage(variantImages[0]);

//             setMainMediaType("image");

//             return;
//         }

//         if (product?.images?.length > 0) {

//             setMainImage(product.images[0]);

//             setMainMediaType("image");

//             return;
//         }

//         if (product?.videoUrl) {

//             setMainImage(
//                 getVideoEmbedUrl(product.videoUrl)
//             );

//             setMainMediaType("video");
//         }

//     }, [product, variantImages]);

//     if (loading) {

//         return (
//             <h2 className="mt-40 text-center">
//                 Loading...
//             </h2>
//         );
//     }

//     if (!product) {

//         return (
//             <h2 className="mt-40 text-center">
//                 Product not found
//             </h2>
//         );
//     }

//     const rating = Number(product.avgRating || 0);

//     const roundedRating = Math.max(
//         0,
//         Math.min(5, Math.round(rating))
//     );

//     const reviewCount = Number(
//         product.reviewCount ||
//         product.reviews?.length ||
//         0
//     );

//     const videoEmbedUrl =
//         getVideoEmbedUrl(product.videoUrl);

//     const related = allRelated.slice(0, 8);

//     const shareProduct = async () => {

//         const productUrl =
//             getShareUrl(product._id);

//         if (navigator.share) {

//             await navigator.share({
//                 title: product.name,
//                 text: `Check out ${product.name}`,
//                 url: productUrl,
//             });

//             return;
//         }

//         await navigator.clipboard.writeText(productUrl);

//         alert("Product link copied");
//     };

//     return (

//         <div className="mt-24 flex w-full flex-col items-center px-4 py-8 sm:px-6 lg:px-10">

//             <div className="flex w-full max-w-7xl flex-col gap-8 lg:flex-row lg:gap-12">

//                 {/* LEFT */}
//                 <div className="w-full lg:w-1/2">

//                     <div className="relative">

//                         {mainMediaType === "video" ? (

//                             isDirectVideo(mainImage) ? (

//                                 <video
//                                     key={mainImage}
//                                     src={mainImage}
//                                     className="h-[320px] w-full rounded-2xl bg-black object-cover shadow-lg sm:h-[450px] lg:h-[650px]"
//                                     autoPlay
//                                     muted
//                                     loop
//                                     playsInline
//                                 />

//                             ) : (

//                                 <iframe
//                                     src={mainImage}
//                                     title={`${product.name} showcase video`}
//                                     className="h-[320px] w-full rounded-2xl bg-black shadow-lg sm:h-[450px] lg:h-[650px]"
//                                     allow="autoplay; encrypted-media; picture-in-picture; web-share"
//                                     allowFullScreen
//                                 />

//                             )

//                         ) : (

//                             <img
//                                 src={mainImage}
//                                 alt={product.name}
//                                 className="h-[320px] w-full rounded-2xl object-cover shadow-lg sm:h-[450px] lg:h-[650px]"
//                             />

//                         )}

//                         {/* WISHLIST */}
//                         <button
//                             type="button"
//                             onClick={() => toggleWishlist(product)}
//                             className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-red-700 shadow-md transition hover:bg-white"
//                         >
//                             <Heart
//                                 size={22}
//                                 className={
//                                     isInWishlist(product._id)
//                                         ? "fill-red-700"
//                                         : ""
//                                 }
//                             />
//                         </button>

//                         {/* SHARE */}
//                         <button
//                             type="button"
//                             onClick={shareProduct}
//                             className="absolute right-3 top-16 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#3A001F] shadow-md transition hover:bg-white"
//                         >
//                             <Share2 size={20} />
//                         </button>
//                     </div>

//                     {/* THUMBNAILS */}
//                     <div className="mt-4 flex gap-3 overflow-x-auto pb-2">

//                         {(variantImages.length > 0
//                             ? variantImages
//                             : product.images
//                         )?.map((img, index) => (

//                             <button
//                                 key={img || index}
//                                 type="button"
//                                 onClick={() => {

//                                     setMainImage(img);

//                                     setMainMediaType("image");
//                                 }}
//                                 className="h-20 w-20 min-w-20 overflow-hidden rounded-xl border transition hover:scale-105"
//                             >

//                                 <img
//                                     src={img}
//                                     alt={`${product.name} ${index + 1}`}
//                                     className="h-full w-full object-cover"
//                                 />

//                             </button>
//                         ))}

//                         {videoEmbedUrl && (

//                             <button
//                                 type="button"
//                                 onClick={() => {

//                                     setMainImage(videoEmbedUrl);

//                                     setMainMediaType("video");
//                                 }}
//                                 className="relative h-20 w-20 min-w-20 overflow-hidden rounded-xl border bg-[#3A001F] text-white transition hover:scale-105"
//                             >

//                                 <span className="absolute inset-0 bg-[#3A001F]/60" />

//                                 <PlayCircle
//                                     className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
//                                     size={28}
//                                 />

//                             </button>
//                         )}

//                     </div>
//                 </div>

//                 {/* RIGHT */}
//                 <div className="w-full lg:w-1/2">

//                     <BuySection
//                         product={product}
//                         addToCart={addToCart}

//                         onVariantImageSelect={(image, images = []) => {
//                             console.log("variant images", images);

//                             setVariantImages([]);

//                             setTimeout(() => {
//                                 setVariantImages([...images]);
//                                 setMainImage(image);
//                                 setMainMediaType("image");
//                             }, 0);

//                         }}
//                     />

//                 </div>
//             </div>

//             {/* RELATED */}
//             <div className="mt-16 w-full max-w-7xl">

//                 <section>

//                     <div className="mb-5 flex items-center justify-between gap-4">

//                         <h2 className="text-2xl font-bold text-[#3A001F] bodoni-moda">
//                             Related Products
//                         </h2>

//                         <p className="text-sm text-[#3A001F]">
//                             {related.length} product
//                         </p>
//                     </div>

//                     {related.length > 0 ? (

//                         <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">

//                             {related.map((item) => (

//                                 <ProductCard
//                                     key={item._id}
//                                     product={item}
//                                     addToCart={addToCart}
//                                     toggleWishlist={toggleWishlist}
//                                     isInWishlist={isInWishlist}
//                                 />

//                             ))}

//                         </div>

//                     ) : (

//                         <p className="rounded-lg border parkinsans border-[#3A001F]/10 bg-white p-6 text-gray-600">
//                             No related products found.
//                         </p>

//                     )}

//                 </section>
//             </div>

//         </div>
//     );
// };

// export default ProductDetails;
