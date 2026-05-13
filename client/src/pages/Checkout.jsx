
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const addressRef = useRef(null);


    const singleProduct = location.state?.product;

    const singleQty = Math.max(
        1,
        Number(location.state?.qty) || 1
    );

    const cartItems = location.state?.cartItems || [];

    // ✅ BOTH SUPPORT
    const products = singleProduct
        ? [{ ...singleProduct, qty: singleQty }]
        : cartItems;

    // ✅ TOTAL
    const orderTotal = products.reduce(
        (total, item) =>
            total + Number(item.price) * Number(item.qty),
        0
    );

    const token = localStorage.getItem("userToken");

    const [address, setAddress] = useState("");
    const [mobile, setMobile] = useState("");
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);
    const [showCODPopup, setShowCODPopup] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);

    const authHeaders = useMemo(() => ({
        Authorization: `Bearer ${token}`
    }), [token]);

    useEffect(() => {
        if (!token) return;

        axios.get("http://localhost:5000/api/user/profile", {
            headers: authHeaders
        })
            .then((res) => {
                setUser(res.data);
                setAddress(res.data?.address || "");
                setMobile(res.data?.mobile || res.data?.phone || "");
            })
            .catch((err) => console.log(err));
    }, [token, authHeaders]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        if (window.Razorpay) {
            setRazorpayLoaded(true);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => setRazorpayLoaded(true);
        script.onerror = () => console.error("Failed to load Razorpay checkout script.");
        document.body.appendChild(script);

        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

    const validateCheckout = () => {
        if (!token) {
            alert("Please login first");
            navigate("/login");
            return false;
        }

        if (!products.length) {
            alert("Product missing. Please select product again.");
            navigate("/shop");
            return false;
        }

        if (!address.trim()) {
            alert("Please enter delivery address");
            addressRef.current?.focus();
            return false;
        }

        if (!orderTotal || orderTotal <= 0) {
            alert("Invalid order total. Please check your cart.");
            return false;
        }

        return true;
    };

    const saveAddress = async () => {
        await axios.put(
            "http://localhost:5000/api/user/profile",
            {
                address: address.trim(),
                phone: mobile.trim(),
                mobile: mobile.trim()
            },
            { headers: authHeaders }
        );
    };

    const createOrder = async ({ paymentMethod, paymentStatus }) => {
        await saveAddress();

        await axios.post(
            "http://localhost:5000/api/orders",
            {
                items: products.map((item) => ({
                    product: item._id,
                    qty: item.qty
                })),
                total: orderTotal,
                address: address.trim(),
                paymentMethod,
                paymentStatus
            },
            { headers: authHeaders }
        );
    };

    const handleCOD = async () => {
        if (!validateCheckout()) return;

        const mobileForDelivery = (user?.mobile || mobile).trim();

        if (!mobileForDelivery) {
            alert("Please enter mobile number for delivery.");
            return;
        }

        if (!/^[6-9]\d{9}$/.test(mobileForDelivery)) {
            alert("Please enter a valid 10 digit mobile number.");
            return;
        }

        // const confirmed = window.confirm("Kya aap Cash on Delivery order confirm karna chahte ho?");

        // if (!confirmed) return;

        try {
            setLoading(true);
            await createOrder({
                paymentMethod: "COD",
                paymentStatus: "Pending"
            });

            // alert("Order placed with Cash on Delivery");
            // navigate("/orders");
        } catch (err) {
            console.log(err);
            alert(err.response?.data || "COD verification failed");
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!validateCheckout()) return;

        if (!razorpayLoaded || typeof window?.Razorpay !== "function") {
            alert("Razorpay checkout is not loaded yet. Please refresh the page and try again.");
            return;
        }

        if (!orderTotal || orderTotal <= 0) {
            alert("Invalid order total. Please check your cart.");
            return;
        }

        if (orderTotal > 100000) {
            alert("Order total exceeds Razorpay's maximum payment limit of ₹100000. Please reduce your cart amount.");
            return;
        }

        try {
            setLoading(true);
            await saveAddress();

            const res = await axios.post(
                "http://localhost:5000/api/payment/create-order",
                { amount: Number(orderTotal) }
            );

            if (res.data?.error) {
                throw new Error(res.data.error);
            }

            const order = res.data;

            const options = {
                key: "rzp_test_Sk6uW9CCim2n1n",
                amount: order.amount,
                currency: "INR",
                name: "Khushbu Jewellers",
                description: "Khushbu Jewellers Order",
                order_id: order.id,
                handler: async function () {
                    await createOrder({
                        paymentMethod: "ONLINE",
                        paymentStatus: "Paid"
                    });

                    alert("Payment Successful");
                    navigate("/orders");
                },
                prefill: {
                    name: user?.name || "Customer",
                    contact: user?.mobile || mobile || ""
                },
                theme: {
                    color: "#6b0f1a"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", function (response) {
                console.error("Razorpay payment failed:", response);
                alert("Payment failed. Please try again.");
            });
            rzp.open();
        } catch (err) {
            console.error("Payment failed:", err.response?.data || err.message || err);
            alert(err.response?.data?.error || err.message || "Payment Failed");
        } finally {
            setLoading(false);
        }
    };

    // if (!product) return <h2 className="p-10 mt-24">No product selected</h2>;

    return (

        <div className="bg-gray-100 min-h-screen py-10 px-4 mt-20">
            <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full">1</span>
                        <span>Address</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full">2</span>
                        <span className="font-semibold">Order Summary</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <span className="bg-gray-300 px-3 py-1 rounded-full">3</span>
                        <span>Payment</span>
                    </div>
                </div>

                <div className="border p-4 mb-4 rounded bg-gray-50">
                    <div className="flex justify-between">
                        <h3 className="font-semibold">Deliver to:</h3>
                        <button
                            type="button"
                            onClick={() => addressRef.current?.focus()}
                            className="text-blue-500 cursor-pointer"
                        >
                            Change
                        </button>
                    </div>
                    <p className="mt-2 text-sm">
                        {address.trim() || "Enter your address below"}
                    </p>
                </div>

                <textarea
                    ref={addressRef}
                    value={address}
                    placeholder="Enter delivery address"
                    className="w-full border p-3 mb-4 rounded"
                    onChange={(e) => {
                        setAddress(e.target.value);
                    }}
                />

                <input
                    value={mobile}
                    placeholder="Enter mobile number for delivery"
                    className="w-full border p-3 mb-4 rounded"
                    onChange={(e) => setMobile(e.target.value)}
                />

                {products.map((item, index) => (

                    <div
                        key={index}
                        className="border p-4 rounded flex gap-4 mb-4"
                    >

                        <img
                            src={item.images?.[0]}
                            alt={item.name}
                            className="w-24 h-24 object-cover rounded"
                        />

                        <div className="flex-1">

                            <h3 className="font-semibold">
                                {item.name}
                            </h3>

                            <p className="text-green-600 font-bold mt-1">

                                ₹{Number(item.price).toLocaleString(
                                    "en-IN",
                                    {
                                        minimumFractionDigits: 2,
                                    }
                                )}

                            </p>

                            <p className="text-sm text-gray-700 mt-1">

                                Qty: {item.qty}

                            </p>

                        </div>

                    </div>

                ))}

                <div className="text-sm text-gray-600 mb-4">
                    <p className="font-semibold text-green-600">
                        Open Box Delivery Available
                    </p>
                    <p>
                        Delivery agent will open the package so you can check product.
                    </p>
                </div>

                <div className="border p-4 rounded mb-4 flex justify-between font-semibold">
                    <span>Total Amount</span>
                    <span>₹{Number(orderTotal).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                    })}</span>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="bg-green-600 text-white px-6 py-3 rounded w-full disabled:opacity-60"
                    >
                        Pay Now
                    </button>

                    <button
                        onClick={() => setShowCODPopup(true)}
                        disabled={loading}
                        className="bg-gray-800 text-white px-6 py-3 rounded w-full disabled:opacity-60"
                    >
                        Cash on Delivery
                    </button>
                </div>
            </div>

            {/* COD CONFIRM POPUP */}
            {
                showCODPopup && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

                        <div className="bg-[#f6c04b] w-[320px] rounded-2xl p-6 text-center shadow-2xl">

                            {/* ICON */}
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-5xl">
                                🛒✅
                            </div>

                            {/* TEXT */}
                            <h2 className="text-lg font-semibold mb-6">
                                Would you like to confirm the order?
                            </h2>

                            {/* BUTTONS */}
                            <div className="flex justify-center gap-6">

                                {/* CONFIRM */}
                                <button
                                    onClick={async () => {

                                        setShowCODPopup(false);

                                        try {

                                            await handleCOD();

                                            setShowSuccessPopup(true);

                                            setTimeout(() => {
                                                navigate("/orders");
                                            }, 2000);

                                        } catch (err) {
                                            console.log(err);
                                        }
                                    }}
                                    className="bg-[#002b5b] text-white px-6 py-2 rounded-lg"
                                >
                                    Confirm
                                </button>

                                {/* CANCEL */}
                                <button
                                    onClick={() => setShowCODPopup(false)}
                                    disabled={loading}
                                    className="text-orange-500 font-semibold"
                                >
                                    Cancel
                                </button>

                            </div>

                        </div>
                    </div>
                )
            }

            {/* SUCCESS POPUP */}
            {showSuccessPopup && (

                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

                    <div className="bg-white popup-animation w-[320px] rounded-2xl p-6 text-center shadow-2xl">

                        {/* SUCCESS ICON */}
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-5xl">
                            ✅
                        </div>

                        {/* TEXT */}
                        <h2 className="text-2xl font-bold text-green-600 mb-2">
                            Order Confirmed!
                        </h2>

                        <p className="text-gray-600">
                            Your order has been placed successfully.
                        </p>

                    </div>

                </div>
            )}

        </div>


    );

};

export default Checkout;

