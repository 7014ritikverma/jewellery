import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import OrderTracking from "../components/OrderTracking";
import EmptyState from "../components/EmptyState";
import PageLoader from "../components/PageLoader";

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

const OrderDetails = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [trackingLoading, setTrackingLoading] = useState(false);
    const navigate = useNavigate();
    const token = localStorage.getItem("userToken");


    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await axios.get(
                    `/api/orders/${id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setOrder(res.data);
            } catch (err) {
                console.log(err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id, token]);

    const syncTracking = async () => {
        try {
            setTrackingLoading(true);
            const res = await axios.get(
                `/api/orders/${id}/shiprocket/tracking`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setOrder(res.data);
        } catch (err) {
            console.log(err);
            alert(err.response?.data?.message || "Tracking not available yet");
        } finally {
            setTrackingLoading(false);
        }
    };

    if (loading) return <div className="mt-28"><PageLoader label="Loading order details..." /></div>;

    if (!order) {
        return (
            <div className="mt-28">
                <EmptyState
                    title="Order not found"
                    message="We could not find this order, or you may not have access to it."
                />
            </div>
        );
    }

    const item = order.items[0].product;

    return (
        <div className="p-10 bg-gray-100 min-h-screen mt-20">
            <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">

                <h2 className="text-2xl font-bold mb-6">
                    Order Details
                </h2>

                {/* PRODUCT */}
                <div
                    onClick={() => navigate(`/product/${item._id}`)}
                    className="flex gap-4 items-center cursor-pointer"
                >
                    <img
                        src={order.items?.[0]?.itemImage || item?.images?.[0]}
                        className="w-20 h-20 object-cover"
                    />

                    <div>
                        <h3 className="font-semibold hover:text-blue-600">
                            {item?.name}
                        </h3>

                        <p className="text-gray-500 text-sm">
                            Qty: {order.items?.[0]?.qty}
                        </p>

                        {order.items?.[0]?.variants?.length > 0 && (
                            <p className="text-xs text-gray-500">
                                {order.items[0].variants.map((variant) => `${variant.group}: ${variant.option}`).join(" | ")}
                            </p>
                        )}
                    </div>
                </div>

                {/* STATUS */}
                <div className="mb-4">
                    <p className="font-semibold">
                        Status:
                        <span className="text-green-600 ml-2">
                            {order.status}
                        </span>
                    </p>
                </div>

                <div className="mb-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="font-semibold">Order Tracking</p>
                        <button
                            type="button"
                            onClick={syncTracking}
                            disabled={trackingLoading || !order.shiprocket?.awbCode}
                            className="rounded bg-[#6b0f1a] px-4 py-2 text-sm text-white disabled:opacity-50"
                        >
                            {trackingLoading ? "Syncing..." : "Track Live"}
                        </button>
                    </div>
                    <OrderTracking order={order} />
                </div>

                {formatDeliveryDate(order) && (
                    <div className="mb-4 rounded border border-green-200 bg-green-50 p-3">
                        <p className="font-semibold text-green-800">
                            Estimated delivery by {formatDeliveryDate(order)}
                        </p>
                    </div>
                )}

                {/* ADDRESS */}
                <div className="mb-4">
                    <p className="font-semibold">Delivery Address:</p>
                    <p className="text-gray-600">
                        {order.address}
                    </p>
                </div>

                {/* DATE */}
                <p className="text-sm text-gray-500">
                    Ordered on:{" "}
                    {new Date(order.createdAt).toLocaleString()}
                </p>

            </div>
        </div>
    );
};

export default OrderDetails;
