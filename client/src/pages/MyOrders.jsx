import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const sortNewestFirst = (orderList) => {
    return [...orderList].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [search, setSearch] = useState("");
    const [reviewForms, setReviewForms] = useState({});
    const navigate = useNavigate();

    const token = localStorage.getItem("userToken");

    const filteredOrders = sortNewestFirst(orders).filter(order => {
        const item = order.items?.[0]?.product;
        return item?.name?.toLowerCase().includes(search.toLowerCase());
    });

    const fetchOrders = useCallback(() => {
        axios.get("http://localhost:5000/api/orders/my-orders", {
            headers: { Authorization: token },
        })
            .then(res => setOrders(sortNewestFirst(res.data)))
            .catch(err => console.log(err));
    }, [token]);

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
        const form = reviewForms[key] || { rating: 5, comment: "" };

        try {
            await axios.post(
                `http://localhost:5000/api/products/${product._id}/reviews`,
                {
                    orderId: order._id,
                    rating: form.rating,
                    comment: form.comment
                },
                { headers: { Authorization: token } }
            );

            alert("Review submitted");
            setReviewForms({ ...reviewForms, [key]: { rating: 5, comment: "" } });
            fetchOrders();
        } catch (err) {
            console.log(err);
            alert(err.response?.data || "Review submit failed");
        }
    };

    useEffect(() => {
        fetchOrders();

        const interval = setInterval(fetchOrders, 5000);

        return () => clearInterval(interval);
    }, [fetchOrders]);

    return (
        <div className="p-10 mt-20 bg-gray-100 min-h-screen">
            <div className="max-w-5xl mx-auto">
                <div className="bg-white p-6 rounded-xl shadow">
                    <h2 className="text-xl font-bold mb-4">My Orders</h2>

                    <div className="flex mb-6">
                        <input
                            type="text"
                            placeholder="Search your orders here"
                            className="flex-1 p-3 border rounded-l"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button className="bg-blue-600 text-white px-6 rounded-r">
                            Search Orders
                        </button>
                    </div>

                    {filteredOrders.length === 0 ? (
                        <p>No matching orders</p>
                    ) : (
                        <div className="space-y-4">
                            {filteredOrders.map(order => {
                                const item = order.items?.[0]?.product;

                                return (
                                    <div key={order._id} className="border p-4 rounded-lg hover:shadow-md transition">
                                        {/* <div
                                            onClick={() => navigate(`/order/${order._id}`)}
                                            className="grid grid-cols-1 gap-4 cursor-pointer md:grid-cols-[1fr_120px_190px] md:items-center"
                                        >
                                            <div className="flex min-w-0 gap-4 items-center">
                                                <img
                                                    src={item?.images?.[0]}
                                                    alt={item?.name || "Order item"}
                                                    className="h-20 w-20 flex-none object-cover"
                                                />

                                                <div className="min-w-0">
                                                    <h3 className="font-semibold break-words">
                                                        {item?.name}
                                                    </h3>

                                                    <p className="text-gray-500 text-sm">
                                                        Qty: {order.items?.[0]?.qty}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="font-semibold md:text-center">
                                                ₹{Number(order.total).toLocaleString("en-IN", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </div>

                                            <div className="md:text-right">


                                                <p className={`font-semibold ${order.status === "Delivered"
                                                    ? "text-green-600"
                                                    : order.status === "Pending"
                                                        ? "text-red-500" : order.status === "Processing"
                                                            ? "text-yellow-500"
                                                            : "text-blue-500"}`}>
                                                    {order.status}
                                                </p>

                                                <p className="text-sm text-gray-500">
                                                    {order.status === "Delivered"
                                                        ? "Your item has been delivered"
                                                        : order.status === "Pending"
                                                            ? "Your order is being Pending"
                                                            : order.status === "Processing"
                                                                ? "Your order is being Processing"
                                                                : "Your order is being Shipped"
                                                    }
                                                </p>

                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(order.createdAt).toDateString()}
                                                </p>
                                            </div>
                                        </div> */}

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
                                                            src={item.product?.images?.[0]}
                                                            alt={item.product?.name}
                                                            className="h-20 w-20 rounded-lg object-cover border"
                                                        />

                                                        <div className="min-w-0">

                                                            <h3 className="font-semibold break-words">
                                                                {item.product?.name}
                                                            </h3>

                                                            <p className="text-gray-500 text-sm">

                                                                Qty: {item.qty}

                                                            </p>

                                                            <p className="text-[#6b0f1a] font-bold mt-1">

                                                                ₹{Number(item.product?.price).toLocaleString(
                                                                    "en-IN",
                                                                    {
                                                                        minimumFractionDigits: 2,
                                                                    }
                                                                )}

                                                            </p>

                                                        </div>

                                                    </div>

                                                    {/* PRICE */}
                                                    <div className="font-semibold md:text-center">

                                                        ₹{Number(
                                                            item.product?.price * item.qty
                                                        ).toLocaleString("en-IN", {
                                                            minimumFractionDigits: 2,
                                                        })}

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

                                                    </div>

                                                </div>

                                            ))}

                                            {/* TOTAL */}
                                            <div className="flex justify-end">

                                                <h2 className="text-lg font-bold">

                                                    Total:
                                                    ₹{Number(order.total).toLocaleString(
                                                        "en-IN",
                                                        {
                                                            minimumFractionDigits: 2,
                                                        }
                                                    )}

                                                </h2>

                                            </div>

                                        </div>

                                        {order.status === "Delivered" && item && (() => {
                                            const reviewKey = getReviewKey(order._id, item._id);
                                            const form = reviewForms[reviewKey] || { rating: 5, comment: "" };
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

                                                    <button
                                                        onClick={() => submitReview(order, item)}
                                                        className="bg-black text-white px-5 py-2 rounded"
                                                    >
                                                        Submit Review
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
