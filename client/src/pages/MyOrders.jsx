import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import OrderTracking from "../components/OrderTracking";
import EmptyState from "../components/EmptyState";
import PageLoader from "../components/PageLoader";
import { formatPrice } from "../utils/formatPrice";

const sortNewestFirst = (orderList) => {
    return [...orderList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const formatDeliveryDate = (order) => {
    if (order.estimatedDeliveryText) return order.estimatedDeliveryText;
    if (!order.estimatedDeliveryDate) return "";

    const date = new Date(order.estimatedDeliveryDate);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [search, setSearch] = useState("");
    const [reviewForms, setReviewForms] = useState({});
    const [returnForms, setReturnForms] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState("");
    const navigate = useNavigate();

    const token = localStorage.getItem("userToken");

    const filteredOrders = sortNewestFirst(orders).filter(order => {
        if (!search.trim()) return true;

        const item = order.items?.[0]?.product;
        return item?.name?.toLowerCase().includes(search.toLowerCase());
    });

    const fetchOrders = useCallback(() => {
        if (!orders.length) {
            setLoading(true);
        }
        axios.get("/api/orders/my-orders", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => setOrders(sortNewestFirst(res.data)))
            .catch(err => console.log(err))
            .finally(() => setLoading(false));
    }, [orders.length, token]);

    const getReviewKey = (orderId, productId) => `${orderId}-${productId}`;

    const updateReviewForm = (orderId, productId, field, value) => {
        const key = getReviewKey(orderId, productId);

        setReviewForms({
            ...reviewForms,
            [key]: {
                rating: 5,
                comment: "",
                ...reviewForms[key],
                [field]: value
            }
        });
    };

    const submitReview = async (order, product) => {
        const key = getReviewKey(order._id, product._id);
        const form = reviewForms[key] || { rating: 5, comment: "", images: [] };

        try {
            setSubmitting(key);
            let reviewImages = [];

            if (form.images?.length) {
                const formData = new FormData();
                form.images.slice(0, 5).forEach((file) => formData.append("images", file));
                const uploadRes = await axios.post(
                    "/api/upload/reviews",
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );
                reviewImages = uploadRes.data.urls || [];
            }

            await axios.post(
                `/api/products/${product._id}/reviews`,
                {
                    orderId: order._id,
                    rating: form.rating,
                    comment: form.comment,
                    reviewImages,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("Review submitted");
            setReviewForms({ ...reviewForms, [key]: { rating: 5, comment: "", images: [] } });
            fetchOrders();
        } catch (err) {
            console.log(err);
            alert(err.response?.data?.message || err.response?.data || "Review submit failed");
        } finally {
            setSubmitting("");
        }
    };

    const submitReturnRequest = async (order) => {
        const reason = returnForms[order._id] || "";

        try {
            setSubmitting(`return-${order._id}`);
            const res = await axios.post(
                `/api/orders/${order._id}/return-request`,
                { reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setOrders(orders.map((item) => item._id === order._id ? res.data : item));
            setReturnForms({ ...returnForms, [order._id]: "" });
            alert("Return request submitted");
        } catch (err) {
            console.log(err);
            alert(err.response?.data || "Return request failed");
        } finally {
            setSubmitting("");
        }
    };

    useEffect(() => {
        fetchOrders();

        const interval = setInterval(fetchOrders, 5000);

        return () => clearInterval(interval);
    }, [fetchOrders]);

    return (
        <div className="p-10 mt-20 bg-gray-100 text-[#3A001F] min-h-screen">
            <div className="max-w-5xl mx-auto">
                <div className="bg-white p-6 rounded-xl shadow">
                    <h2 className="text-xl font-bold mb-4">My Orders</h2>

                    <div className="flex mb-6">
                        <input
                            type="text"
                            placeholder="Search your orders here"
                            className="flex-1 p-3 border outline-none rounded-l"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button className="bg-blue-600 text-white px-6 rounded-r">
                            Search Orders
                        </button>
                    </div>

                    {loading ? (
                        <PageLoader label="Loading your orders..." />
                    ) : filteredOrders.length === 0 ? (
                        <EmptyState
                            title="No orders found"
                            message="Your orders or matching search results will appear here."
                        />
                    ) : (
                        <div className="space-y-4">
                            {filteredOrders.map(order => {
                                const item = order.items?.[0]?.product;

                                return (
                                    <div key={order._id} className="border p-4 rounded-lg hover:shadow-md transition">
                                
                                        <div
                                            onClick={() => navigate(`/order/${order._id}`)}
                                            className="cursor-pointer"
                                        >

                                            {order.items.map((item, index) => (

                                                <div
                                                    key={index}
                                                    className="grid grid-cols-1 gap-4 border-b pb-4 mb-4 md:grid-cols-[1fr_120px_190px] md:items-center"
                                                >

                                                    {/* LEFT */}
                                                    <div className="flex min-w-0 gap-4 items-center">

                                                        <img
                                                            src={item.itemImage || item.product?.images?.[0]}
                                                            alt={item.product?.name}
                                                            className="h-20 w-20 rounded-lg object-cover border"
                                                        />

                                                        <div className="min-w-0">

                                                            <h3 className="font-semibold break-words">
                                                                {item.product?.name}
                                                            </h3>

                                                            <p className="text-[#A56028] text-sm">

                                                                Qty: {item.qty}

                                                            </p>

                                                            {item.variants?.length > 0 && (
                                                                <p className="text-xs text-gray-500">
                                                                    {item.variants.map((variant) => `${variant.group}: ${variant.option}`).join(" | ")}
                                                                </p>
                                                            )}

                                                            <p className="text-[#3A001F] font-bold mt-1">

                                                                ₹{formatPrice(item.itemPrice || item.product?.price)}.00

                                                            </p>

                                                        </div>

                                                    </div>

                                                    {/* PRICE */}
                                                    <div className="font-semibold md:text-center">

                                                        ₹{formatPrice((item.itemPrice || item.product?.price) * item.qty)}.00

                                                    </div>

                                                    {/* STATUS */}
                                                    <div className="md:text-right">

                                                        <p className={`font-semibold ${order.status === "Delivered"
                                                            ? "text-green-600"
                                                            : order.status === "Pending"
                                                                ? "text-red-500"
                                                                : order.status === "Processing"
                                                                    ? "text-yellow-500"
                                                                    : "text-blue-500"
                                                            }`}>

                                                            {order.status}

                                                        </p>

                                                        <p className="text-sm text-gray-500">

                                                            {order.status === "Delivered"
                                                                ? "Your item has been delivered"
                                                                : order.status === "Pending"
                                                                    ? "Your order is Pending"
                                                                    : order.status === "Processing"
                                                                        ? "Your order is Processing"
                                                                        : "Your order is Shipped"}

                                                        </p>

                                                        <p className="text-xs text-gray-400 mt-1">

                                                            {new Date(order.createdAt).toDateString()}

                                                        </p>

                                                        {formatDeliveryDate(order) && (
                                                            <p className="text-xs font-semibold text-green-700 mt-1">
                                                                Expected by {formatDeliveryDate(order)}
                                                            </p>
                                                        )}

                                                    </div>

                                                </div>

                                            ))}

                                            {/* TOTAL */}
                                            <div className="flex justify-end">

                                                <h2 className="text-lg font-bold">

                                                    Total:
                                                    ₹{formatPrice(order.total)}.00

                                                </h2>

                                            </div>

                                            <div className="mt-4">
                                                <OrderTracking order={order} compact />
                                            </div>

                                            {order.status === "Delivered" && (
                                                <div className="mt-4 rounded-lg border border-[#ead7dc] bg-[#fff8f9] p-4" onClick={(e) => e.stopPropagation()}>
                                                    <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                        <p className="font-semibold text-[#3A001F]">Return request</p>
                                                        <span className="text-xs font-semibold text-[#7a1f3f]">
                                                            Status: {order.returnRequest?.status || "None"}
                                                        </span>
                                                    </div>

                                                    {order.returnRequest?.status && order.returnRequest.status !== "None" ? (
                                                        <div className="text-sm text-gray-700">
                                                            <p>{order.returnRequest.reason}</p>
                                                            {order.returnRequest.adminNote && (
                                                                <p className="mt-2 font-semibold text-[#3A001F]">
                                                                    Admin note: {order.returnRequest.adminNote}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="grid gap-3">
                                                            <textarea
                                                                value={returnForms[order._id] || ""}
                                                                placeholder="Reason for return request"
                                                                className="w-full rounded border p-3 text-sm"
                                                                rows={3}
                                                                onChange={(e) => setReturnForms({ ...returnForms, [order._id]: e.target.value })}
                                                            />
                                                            <button
                                                                type="button"
                                                                disabled={submitting === `return-${order._id}`}
                                                                onClick={() => submitReturnRequest(order)}
                                                                className="w-fit rounded bg-[#3A001F] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                                            >
                                                                {submitting === `return-${order._id}` ? "Submitting..." : "Request Return"}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                        </div>

                                        {order.status === "Delivered" && item && (() => {
                                            const reviewKey = getReviewKey(order._id, item._id);
                                            const form = reviewForms[reviewKey] || { rating: 5, comment: "", images: [] };
                                            const hasReviewed = item.reviews?.some(review =>
                                                String(review.order) === String(order._id)
                                            );

                                            if (hasReviewed) {
                                                return (
                                                    <p className="mt-4 text-sm font-semibold text-green-600">
                                                        Review submitted for this product.
                                                    </p>
                                                );
                                            }

                                            return (
                                                <div className="mt-4 border-t pt-4">
                                                    <p className="font-semibold mb-2">Review this product</p>

                                                    <select
                                                        value={form.rating}
                                                        className="border p-2 rounded mb-3"
                                                        onChange={(e) => updateReviewForm(order._id, item._id, "rating", Number(e.target.value))}
                                                    >
                                                        <option value={5}>5 Stars</option>
                                                        <option value={4}>4 Stars</option>
                                                        <option value={3}>3 Stars</option>
                                                        <option value={2}>2 Stars</option>
                                                        <option value={1}>1 Star</option>
                                                    </select>

                                                    <textarea
                                                        value={form.comment}
                                                        placeholder="Write your review"
                                                        className="w-full border p-3 rounded mb-3"
                                                        onChange={(e) => updateReviewForm(order._id, item._id, "comment", e.target.value)}
                                                    />

                                                    <input
                                                        type="file"
                                                        accept="image/jpeg,image/png,image/webp"
                                                        multiple
                                                        className="mb-3 block w-full rounded border p-2 text-sm"
                                                        onChange={(e) => updateReviewForm(
                                                            order._id,
                                                            item._id,
                                                            "images",
                                                            Array.from(e.target.files || []).slice(0, 5)
                                                        )}
                                                    />

                                                    {form.images?.length > 0 && (
                                                        <div className="mb-3 flex gap-2 overflow-x-auto">
                                                            {form.images.map((file, index) => (
                                                                <img
                                                                    key={`${file.name}-${index}`}
                                                                    src={URL.createObjectURL(file)}
                                                                    alt={`Review upload ${index + 1}`}
                                                                    className="h-16 w-16 rounded object-cover"
                                                                />
                                                            ))}
                                                        </div>
                                                    )}

                                                    <button
                                                        onClick={() => submitReview(order, item)}
                                                        disabled={submitting === reviewKey}
                                                        className="bg-black text-white px-5 py-2 rounded disabled:opacity-60"
                                                    >
                                                        {submitting === reviewKey ? "Submitting..." : "Submit Review"}
                                                    </button>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyOrders;
