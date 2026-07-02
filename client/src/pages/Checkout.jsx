import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    FiArrowLeft,
    FiCheck,
    FiCreditCard,
    FiLock,
    FiPackage,
    FiSmartphone,
    FiTruck,
} from "react-icons/fi";
import axios from "axios";
import { CartContext } from "../context/CartContext";
import { formatPrice } from "../utils/formatPrice";
import { calculateCheckoutPricing } from "../utils/checkoutPricing";

const API_URL = "/api";

const fieldClass =
    "h-12 w-full rounded-md border border-[#d7cbd0] bg-white px-3 text-sm text-[#2c1420] outline-none transition placeholder:text-[#84757c] focus:border-[#681333] focus:ring-1 focus:ring-[#681333]";

const CheckoutHeader = () => (
    <header className="border-b border-[#e7dfe2] bg-white">
        <div className="mx-auto grid h-[72px] max-w-6xl grid-cols-[40px_1fr_40px] items-center px-4 sm:px-6">
            <Link
                to="/"
                aria-label="Back to store"
                className="flex h-10 w-10 items-center justify-center text-[#3A001F] transition hover:bg-[#f7f2f4]"
            >
                <FiArrowLeft size={20} />
            </Link>
            <Link to="/" className="justify-self-center">
                <img src="/Logo.png" alt="Khushbu Jewellers" className="h-10 w-auto object-contain" />
            </Link>
            <FiLock className="justify-self-end text-[#3A001F]" size={18} aria-label="Secure checkout" />
        </div>
    </header>
);

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const addressRef = useRef(null);
    const { cart, clearCart } = useContext(CartContext);

    const singleProduct = location.state?.product;
    const singleQty = Math.max(1, Number(location.state?.qty) || 1);
    const cartItems = location.state?.cartItems || cart || [];
    const products = singleProduct
        ? [{ ...singleProduct, qty: singleQty }]
        : cartItems;
    const orderTotal = products.reduce(
        (total, item) => total + Number(item.price) * Number(item.qty),
        0
    );

    const token = localStorage.getItem("userToken");
    const [deliveryName, setDeliveryName] = useState("");
    const [addressLine1, setAddressLine1] = useState("");
    const [addressLine2, setAddressLine2] = useState("");
    const [landmark, setLandmark] = useState("");
    const [mobile, setMobile] = useState("");
    const [pincode, setPincode] = useState("");
    const [city, setCity] = useState("");
    const [stateName, setStateName] = useState("");
    const [deliveryMsg, setDeliveryMsg] = useState("");
    const [deliveryEstimate, setDeliveryEstimate] = useState(null);
    const [user, setUser] = useState(null);
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [cashfreeLoaded, setCashfreeLoaded] = useState(false);
    const [paymentChoice, setPaymentChoice] = useState("UPI");
    const [showCODPopup, setShowCODPopup] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const pricing = useMemo(
        () => calculateCheckoutPricing(orderTotal, paymentChoice),
        [orderTotal, paymentChoice]
    );

    const authHeaders = useMemo(
        () => ({ Authorization: `Bearer ${token}` }),
        [token]
    );

    useEffect(() => {
        if (!token) return;

        axios
            .get(`${API_URL}/user/profile`, { headers: authHeaders })
            .then((res) => {
                const savedAddress = res.data?.address || "";
                const savedPhone = res.data?.mobile || res.data?.phone || "";
                const savedPincode =
                    localStorage.getItem("deliveryPincode") ||
                    res.data?.deliveryPincode ||
                    String(savedAddress).match(/\b\d{6}\b/)?.[0] ||
                    "";

                setUser(res.data);
                setDeliveryName(res.data?.name || "");
                setAddressLine1(savedAddress);
                setMobile(savedPhone);
                setPincode(savedPincode);
                setCity(res.data?.deliveryCity || "");
                setStateName(res.data?.deliveryState || "");
            })
            .catch((err) => console.error("Unable to load checkout profile:", err))
            .finally(() => setProfileLoaded(true));
    }, [token, authHeaders]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (window.Cashfree) {
            setCashfreeLoaded(true);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
        script.async = true;
        script.onload = () => setCashfreeLoaded(true);
        script.onerror = () => console.error("Failed to load Cashfree checkout script.");
        document.body.appendChild(script);

        return () => {
            if (script.parentNode) script.parentNode.removeChild(script);
        };
    }, []);

    const checkDeliveryPincode = async (nextPincode = pincode) => {
        if (!/^\d{6}$/.test(nextPincode)) {
            setDeliveryMsg("");
            setDeliveryEstimate(null);
            return;
        }

        setDeliveryMsg("Checking delivery availability...");
        try {
            const res = await axios.get(
                `${API_URL}/payment/check-pincode/${nextPincode}?cod=${paymentChoice === "COD" ? 1 : 0}`
            );

            if (!res.data?.available) {
                setDeliveryEstimate(null);
                setDeliveryMsg("Delivery is not available for this pincode.");
                return;
            }

            if (res.data.city) setCity(res.data.city);
            if (res.data.state) setStateName(res.data.state);
            setDeliveryEstimate({
                estimatedDeliveryDate: res.data.estimatedDeliveryDate,
                estimatedDeliveryText: res.data.estimatedDeliveryText,
            });
            localStorage.setItem("deliveryPincode", nextPincode);
            setDeliveryMsg(
                res.data.estimatedDeliveryText
                    ? `Delivery by ${res.data.estimatedDeliveryText}`
                    : "Delivery is available. The courier date will appear after confirmation."
            );
        } catch (err) {
            console.error("Delivery check failed:", err);
            setDeliveryEstimate(null);
            setDeliveryMsg("Unable to check delivery right now.");
        }
    };

    useEffect(() => {
        if (pincode.length === 6) checkDeliveryPincode(pincode);
    }, [pincode, paymentChoice]);

    const validateCheckout = () => {
        if (!token) {
            alert("Please login or sign up before making the payment.");
            return false;
        }
        if (!products.length || products.some((item) => !item._id)) {
            alert("Product details are missing. Please select the product again.");
            navigate("/shop");
            return false;
        }
        if (!deliveryName.trim()) {
            alert("Please enter the receiver name.");
            return false;
        }
        if (!addressLine1.trim()) {
            alert("Please enter the full delivery address.");
            addressRef.current?.focus();
            return false;
        }
        if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
            alert("Please enter a valid 10 digit mobile number.");
            return false;
        }
        if (!/^\d{6}$/.test(pincode)) {
            alert("Please enter a valid 6 digit pincode.");
            return false;
        }
        if (!city.trim() || !stateName.trim()) {
            alert("Please enter the delivery city and state.");
            return false;
        }
        if (!orderTotal || orderTotal <= 0) {
            alert("Invalid order total. Please check your cart.");
            return false;
        }
        return true;
    };

    const fullAddress = [
        addressLine1,
        addressLine2,
        landmark,
        city,
        stateName,
        pincode,
    ]
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .join(", ");

    const saveAddress = async () => {
        await axios.put(
            `${API_URL}/user/profile`,
            {
                name: deliveryName.trim(),
                address: fullAddress,
                phone: mobile.trim(),
                mobile: mobile.trim(),
                deliveryPincode: pincode,
                deliveryCity: city.trim(),
                deliveryState: stateName.trim(),
            },
            { headers: authHeaders }
        );
    };

    const getApiErrorMessage = (err, fallback) => {
        const data = err.response?.data;
        if (typeof data === "string") return data;
        return data?.error || data?.message || err.message || fallback;
    };

    const createOrder = async ({
        paymentMethod,
        paymentStatus,
        cashfreeOrderId,
        cashfreePaymentSessionId,
    }) => {
        await saveAddress();
        const res = await axios.post(
            `${API_URL}/orders`,
            {
                items: products.map((item) => ({
                    product: item._id,
                    qty: item.qty,
                    variants: item.selectedVariants || [],
                })),
                total: orderTotal,
                originalAmount: pricing.originalAmount,
                shippingCharge: pricing.shippingCharge,
                discountAmount: pricing.discountAmount,
                finalPayableAmount: pricing.finalPayableAmount,
                selectedPaymentMethod: paymentMethod === "COD" ? "COD" : paymentChoice,
                address: fullAddress,
                deliveryMobile: mobile.trim(),
                estimatedDeliveryDate: deliveryEstimate?.estimatedDeliveryDate,
                estimatedDeliveryText: deliveryEstimate?.estimatedDeliveryText,
                shippingAddress: {
                    name: deliveryName.trim(),
                    phone: mobile.trim(),
                    address: fullAddress,
                    addressLine1: addressLine1.trim(),
                    addressLine2: addressLine2.trim(),
                    landmark: landmark.trim(),
                    city: city.trim(),
                    state: stateName.trim(),
                    pincode,
                    country: "India",
                },
                paymentMethod,
                paymentStatus,
                cashfreeOrderId,
                cashfreePaymentSessionId,
            },
            { headers: authHeaders }
        );
        return res.data;
    };

    const handleCOD = async () => {
        if (!validateCheckout()) return false;
        setLoading(true);
        try {
            const order = await createOrder({
                paymentMethod: "COD",
                paymentStatus: "Pending",
            });
            return Boolean(order?._id);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!validateCheckout()) return;
        if (!cashfreeLoaded || typeof window?.Cashfree !== "function") {
            alert("Secure payment is still loading. Please try again in a moment.");
            return;
        }

        try {
            setLoading(true);
            await saveAddress();
            const res = await axios.post(
                `${API_URL}/payment/create-order`,
                {
                    items: products.map((item) => ({
                        product: item._id,
                        qty: item.qty,
                        variants: item.selectedVariants || [],
                    })),
                    selectedPaymentMethod: paymentChoice,
                    customer: {
                        name: deliveryName.trim() || user?.name || "Customer",
                        email: user?.email || "",
                        phone: mobile.trim() || user?.mobile || user?.phone || "",
                    },
                    returnUrl: `${window.location.origin}/checkout`,
                },
                { headers: authHeaders }
            );

            if (res.data?.error) throw new Error(res.data.error);
            const paymentOrder = res.data;
            const cashfree = window.Cashfree({
                mode: paymentOrder.environment === "production" ? "production" : "sandbox",
            });
            const result = await cashfree.checkout({
                paymentSessionId: paymentOrder.paymentSessionId,
                redirectTarget: "_modal",
            });

            if (result?.error) {
                throw new Error(result.error.message || "Payment was not completed.");
            }

            await createOrder({
                paymentMethod: "ONLINE",
                selectedPaymentMethod: paymentChoice,
                paymentStatus: "Paid",
                cashfreeOrderId: paymentOrder.orderId,
                cashfreePaymentSessionId: paymentOrder.paymentSessionId,
            });
            if (!singleProduct) clearCart();
            navigate("/orders");
        } catch (err) {
            console.error("Payment failed:", err.response?.data || err.message || err);
            alert(getApiErrorMessage(err, "Payment failed. Please try again."));
        } finally {
            setLoading(false);
        }
    };

    const handleCheckoutSubmit = () => {
        if (paymentChoice === "COD") {
            if (validateCheckout()) setShowCODPopup(true);
            return;
        }
        handlePayment();
    };

    const confirmCOD = async () => {
        setShowCODPopup(false);
        try {
            const orderCreated = await handleCOD();
            if (!orderCreated) return;
            if (!singleProduct) clearCart();
            setShowSuccessPopup(true);
            setTimeout(() => navigate("/orders"), 1600);
        } catch (err) {
            console.error("COD order failed:", err.response?.data || err);
            alert(getApiErrorMessage(err, "Order could not be placed."));
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-white text-[#2c1420]">
                <CheckoutHeader />
                <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.05fr_0.95fr]">
                    <section className="self-start">
                        <p className="text-sm font-semibold text-[#7a2947]">Secure checkout</p>
                        <h1 className="mt-2 text-2xl font-semibold">Login to complete your order</h1>
                        <p className="mt-3 max-w-lg text-sm leading-6 text-[#6f6268]">
                            Your account keeps the delivery address, invoice and order updates together.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <Link
                                to="/login"
                                state={{ from: "/checkout", checkoutState: location.state }}
                                className="rounded-md bg-[#681333] px-6 py-3 text-sm font-semibold text-white"
                            >
                                Login
                            </Link>
                            <Link
                                to="/signup"
                                state={{ from: "/checkout", checkoutState: location.state }}
                                className="rounded-md border border-[#681333] px-6 py-3 text-sm font-semibold text-[#681333]"
                            >
                                Sign up
                            </Link>
                        </div>
                    </section>
                    <OrderSummary products={products} pricing={pricing} />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-[#2c1420]">
            <CheckoutHeader />

            <main className="mx-auto grid max-w-6xl lg:grid-cols-[minmax(0,1fr)_420px]">
                <section className="px-4 py-8 sm:px-8 lg:border-r lg:border-[#e7dfe2] lg:px-12 lg:py-10">
                    <div className="mx-auto max-w-[620px] space-y-8">
                        <section>
                            <div className="flex items-center justify-between">
                                <h1 className="text-lg font-semibold">Contact</h1>
                                {!profileLoaded && <span className="text-xs text-[#796c72]">Loading...</span>}
                            </div>
                            <p className="mt-3 text-sm text-[#4f4147]">
                                {user?.email || "Your account email"}
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold">Delivery</h2>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <label className="sm:col-span-2">
                                    <span className="sr-only">Country</span>
                                    <select className={fieldClass} value="India" disabled>
                                        <option>India</option>
                                    </select>
                                </label>
                                <input
                                    value={deliveryName}
                                    placeholder="Full name"
                                    className={fieldClass}
                                    onChange={(e) => setDeliveryName(e.target.value)}
                                />
                                <input
                                    value={mobile}
                                    placeholder="Phone"
                                    inputMode="numeric"
                                    maxLength="10"
                                    className={fieldClass}
                                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                />
                                <input
                                    ref={addressRef}
                                    value={addressLine1}
                                    placeholder="Address"
                                    className={`${fieldClass} sm:col-span-2`}
                                    onChange={(e) => setAddressLine1(e.target.value)}
                                />
                                <input
                                    value={addressLine2}
                                    placeholder="Apartment, suite, etc. (optional)"
                                    className={`${fieldClass} sm:col-span-2`}
                                    onChange={(e) => setAddressLine2(e.target.value)}
                                />
                                <input
                                    value={landmark}
                                    placeholder="Landmark (optional)"
                                    className={`${fieldClass} sm:col-span-2`}
                                    onChange={(e) => setLandmark(e.target.value)}
                                />
                                <input
                                    value={city}
                                    placeholder="City"
                                    className={fieldClass}
                                    onChange={(e) => setCity(e.target.value)}
                                />
                                <input
                                    value={stateName}
                                    placeholder="State"
                                    className={fieldClass}
                                    onChange={(e) => setStateName(e.target.value)}
                                />
                                <input
                                    value={pincode}
                                    placeholder="PIN code"
                                    inputMode="numeric"
                                    maxLength="6"
                                    className={`${fieldClass} sm:col-span-2`}
                                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    onBlur={() => checkDeliveryPincode()}
                                />
                            </div>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold">Shipping method</h2>
                            <div className="mt-3 flex min-h-14 items-center justify-between rounded-md border-2 border-[#681333] bg-[#fff9fb] px-4 text-sm">
                                <span className="flex items-center gap-2 font-medium">
                                    <FiTruck size={18} /> Standard delivery
                                </span>
                                <strong>
                                    {pricing.shippingCharge
                                        ? `Rs. ${formatPrice(pricing.shippingCharge)}`
                                        : "FREE"}
                                </strong>
                            </div>
                            <p className="mt-2 text-xs text-[#796c72]">
                                Free delivery on orders of Rs. 999 and above.
                            </p>
                            {deliveryMsg && (
                                <p
                                    className={`mt-2 text-sm ${
                                        deliveryEstimate ? "font-medium text-[#17643b]" : "text-[#7b4a29]"
                                    }`}
                                >
                                    {deliveryMsg}
                                </p>
                            )}
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold">Payment</h2>
                            <p className="mt-1 text-xs text-[#796c72]">All transactions are secure and encrypted.</p>
                            <div className="mt-3 overflow-hidden rounded-md border border-[#d7cbd0]">
                                <label className={`flex cursor-pointer gap-3 p-4 ${paymentChoice === "UPI" ? "bg-[#fff9fb] ring-1 ring-inset ring-[#681333]" : ""}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="UPI"
                                        checked={paymentChoice === "UPI"}
                                        onChange={() => setPaymentChoice("UPI")}
                                        className="mt-1 accent-[#681333]"
                                    />
                                    <span className="flex-1">
                                        <span className="flex items-center gap-2 text-sm font-semibold">
                                            <FiSmartphone /> UPI
                                        </span>
                                        <span className="mt-1 block text-xs leading-5 text-[#796c72]">
                                            5% instant discount
                                        </span>
                                    </span>
                                </label>
                                <label className={`flex cursor-pointer gap-3 border-t border-[#d7cbd0] p-4 ${paymentChoice === "CARD" ? "bg-[#fff9fb] ring-1 ring-inset ring-[#681333]" : ""}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="CARD"
                                        checked={paymentChoice === "CARD"}
                                        onChange={() => setPaymentChoice("CARD")}
                                        className="mt-1 accent-[#681333]"
                                    />
                                    <span>
                                        <span className="flex items-center gap-2 text-sm font-semibold">
                                            <FiCreditCard /> Credit or Debit Card
                                        </span>
                                        <span className="mt-1 block text-xs text-[#796c72]">
                                            2% cashback applied to this payment
                                        </span>
                                    </span>
                                </label>
                                <label className={`flex cursor-pointer gap-3 border-t border-[#d7cbd0] p-4 ${paymentChoice === "WALLET" ? "bg-[#fff9fb] ring-1 ring-inset ring-[#681333]" : ""}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="WALLET"
                                        checked={paymentChoice === "WALLET"}
                                        onChange={() => setPaymentChoice("WALLET")}
                                        className="mt-1 accent-[#681333]"
                                    />
                                    <span>
                                        <span className="flex items-center gap-2 text-sm font-semibold">
                                            <FiCreditCard /> Wallet
                                        </span>
                                        <span className="mt-1 block text-xs text-[#796c72]">
                                            3% instant discount
                                        </span>
                                    </span>
                                </label>
                                <label className={`flex cursor-pointer gap-3 border-t border-[#d7cbd0] p-4 ${paymentChoice === "COD" ? "bg-[#fff9fb] ring-1 ring-inset ring-[#681333]" : ""}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="COD"
                                        checked={paymentChoice === "COD"}
                                        onChange={() => setPaymentChoice("COD")}
                                        className="mt-1 accent-[#681333]"
                                    />
                                    <span>
                                        <span className="flex items-center gap-2 text-sm font-semibold">
                                            <FiPackage /> Cash on Delivery
                                        </span>
                                        <span className="mt-1 block text-xs text-[#796c72]">Pay when your order arrives</span>
                                    </span>
                                </label>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold">Billing address</h2>
                            <div className="mt-3 flex min-h-14 items-center gap-3 rounded-md border-2 border-[#681333] bg-[#fff9fb] px-4 text-sm font-medium">
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#681333] text-white">
                                    <FiCheck size={11} />
                                </span>
                                Same as shipping address
                            </div>
                        </section>

                        <button
                            type="button"
                            onClick={handleCheckoutSubmit}
                            disabled={loading}
                            className="flex min-h-13 w-full items-center justify-center gap-2 rounded-md bg-[#681333] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#4d0d26] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <FiLock />
                            {loading
                                ? "Processing..."
                                : paymentChoice === "COD"
                                  ? "Place COD order"
                                  : `Pay Rs. ${formatPrice(pricing.finalPayableAmount)}`}
                        </button>
                    </div>
                </section>

                <aside className="order-first bg-[#faf8f9] px-4 py-7 sm:px-8 lg:order-none lg:min-h-[calc(100vh-72px)] lg:px-8 lg:py-10">
                    <OrderSummary products={products} pricing={pricing} />
                </aside>
            </main>

            {showCODPopup && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4">
                    <div className="w-full max-w-sm rounded-md bg-white p-6 shadow-2xl">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f8edf1] text-[#681333]">
                            <FiPackage size={21} />
                        </div>
                        <h2 className="mt-4 text-lg font-semibold">Confirm Cash on Delivery?</h2>
                        <p className="mt-2 text-sm leading-6 text-[#706168]">
                            Your order will be created now and can be prepared for real courier shipment.
                        </p>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setShowCODPopup(false)}
                                disabled={loading}
                                className="rounded-md border border-[#681333] px-4 py-3 text-sm font-semibold text-[#681333]"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmCOD}
                                disabled={loading}
                                className="rounded-md bg-[#681333] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                            >
                                Confirm order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSuccessPopup && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4">
                    <div className="w-full max-w-sm rounded-md bg-white p-7 text-center shadow-2xl">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf7ef] text-[#17643b]">
                            <FiCheck size={24} />
                        </div>
                        <h2 className="mt-4 text-xl font-semibold">Order confirmed</h2>
                        <p className="mt-2 text-sm text-[#706168]">Taking you to your orders...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const OrderSummary = ({ products, pricing }) => (
    <div className="mx-auto w-full max-w-md">
        <h2 className="text-base font-semibold lg:sr-only">Order summary</h2>
        <div className="mt-4 space-y-4 lg:mt-0">
            {products.length ? (
                products.map((item, index) => (
                    <div key={item.cartKey || `${item._id}-${index}`} className="flex items-center gap-4">
                        <div className="relative h-16 w-16 shrink-0">
                            <img
                                src={item.images?.[0]}
                                alt={item.name}
                                className="h-full w-full rounded-md border border-[#ddd3d7] bg-white object-cover"
                            />
                            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#5d4e55] px-1 text-[10px] font-semibold text-white">
                                {item.qty}
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                            {item.selectedVariants?.length > 0 && (
                                <p className="mt-1 truncate text-xs text-[#796c72]">
                                    {item.selectedVariants
                                        .map((variant) => `${variant.group}: ${variant.option}`)
                                        .join(" / ")}
                                </p>
                            )}
                        </div>
                        <p className="shrink-0 text-sm font-semibold">
                            Rs. {formatPrice(Number(item.price) * Number(item.qty))}
                        </p>
                    </div>
                ))
            ) : (
                <p className="rounded-md border border-[#ddd3d7] bg-white p-4 text-sm text-[#796c72]">
                    No products selected.
                </p>
            )}
        </div>

        <div className="mt-7 space-y-3 border-t border-[#ddd3d7] pt-5 text-sm">
            <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rs. {formatPrice(pricing.originalAmount)}</span>
            </div>
            <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-medium">
                    {pricing.shippingCharge
                        ? `Rs. ${formatPrice(pricing.shippingCharge)}`
                        : "FREE"}
                </span>
            </div>
            {pricing.discountAmount > 0 && (
                <div className="flex justify-between font-medium text-[#17643b]">
                    <span>
                        {pricing.selectedPaymentMethod === "CARD" ? "Card cashback" : "Payment discount"}
                        {" "}({pricing.discountPercent}%)
                    </span>
                    <span>- Rs. {formatPrice(pricing.discountAmount)}</span>
                </div>
            )}
        </div>
        <div className="mt-5 flex items-end justify-between border-t border-[#ddd3d7] pt-5">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-semibold">
                <span className="mr-2 text-xs font-normal text-[#796c72]">INR</span>
                Rs. {formatPrice(pricing.finalPayableAmount)}
            </span>
        </div>
    </div>
);

export default Checkout;
