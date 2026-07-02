import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BadgeCheck, CreditCard, MapPin, PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import ProductVariantSelector, {
    buildDefaultVariantSelection,
    buildSelectedVariantList,
    normalizeVariantSelection,
    resolveSelectedVariant,
} from "./ProductVariantSelector";
import { formatPrice } from "../utils/formatPrice";
import AuthRequiredModal from "./AuthRequiredModal";

const BuySection = ({ product, addToCart, onVariantImageSelect }) => {
    const navigate = useNavigate();
    const [pincode, setPincode] = useState("");
    const [deliveryMsg, setDeliveryMsg] = useState("");
    const [checkingDelivery, setCheckingDelivery] = useState(false);
    const [selectedVariants, setSelectedVariants] = useState({});
    const [showAuthPrompt, setShowAuthPrompt] = useState(false);
    const [pendingCheckoutState, setPendingCheckoutState] = useState(null);
    const token = localStorage.getItem("userToken");

    const saveDeliveryPincode = async ({ city, state }) => {
        localStorage.setItem("deliveryPincode", pincode);

        if (!token) return;

        await axios.put(
            `/api/user/profile`,
            {
                deliveryPincode: pincode,
                deliveryCity: city || "",
                deliveryState: state || "",
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
    };

    const checkDelivery = async (pin = pincode, options = { save: true }) => {
        const nextPincode = String(pin || "").replace(/\D/g, "").slice(0, 6);

        if (nextPincode.length !== 6) {
            setDeliveryMsg("Invalid pincode");
            return;
        }

        try {
            setCheckingDelivery(true);
            const res = await axios.get(
                `/api/payment/check-pincode/${nextPincode}?cod=1`
            );

            if (!res.data.available) {
                setDeliveryMsg("Delivery not available");
                return;
            }

            if (options.save !== false) {
                await saveDeliveryPincode({
                    city: res.data.city,
                    state: res.data.state,
                });
            }

            const locationText = [res.data.city, res.data.state].filter(Boolean).join(", ");

            if (res.data.estimatedDeliveryText) {
                setDeliveryMsg(
                    `Delivery by ${res.data.estimatedDeliveryText}${locationText ? ` to ${locationText}` : ""}`
                );
                return;
            }

            setDeliveryMsg(
                locationText
                    ? `Delivery available to ${locationText}. Courier delivery date is not available yet.`
                    : "Delivery available. Courier delivery date is not available yet."
            );
        } catch (err) {
            console.log(err);
            setDeliveryMsg("Error checking delivery");
        } finally {
            setCheckingDelivery(false);
        }
    };

    useEffect(() => {
        const savedPincode = localStorage.getItem("deliveryPincode") || "";
        if (savedPincode) {
            setPincode(savedPincode);
            return;
        }

        if (!token) return;

        axios.get(`/api/user/profile`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => {
                const profilePincode = res.data?.deliveryPincode || String(res.data?.address || "").match(/\b\d{6}\b/)?.[0] || "";
                if (profilePincode) setPincode(profilePincode);
            })
            .catch((err) => console.log(err));
    }, [token]);

    useEffect(() => {
        const defaultSelection = buildDefaultVariantSelection(product);
        setSelectedVariants(defaultSelection);
        const defaultVariant = resolveSelectedVariant(product, defaultSelection);
        onVariantImageSelect?.(defaultVariant.image || "", defaultVariant.images || []);
    }, [product?._id]);

    useEffect(() => {
        if (pincode.length === 6) {
            checkDelivery(pincode, { save: false });
        }
    }, [pincode]);

    const buildProductWithVariants = () => ({
        ...product,
        price: selectedVariant.price,
        quantity: selectedVariant.quantity,
        images: selectedVariant.images?.length
            ? selectedVariant.images
            : product.images,
        selectedVariants: buildSelectedVariantList(normalizedSelectedVariants),
    });

    const handleBuyNow = () => {
        const checkoutState = {
            product: buildProductWithVariants(),
            qty: 1,
        };

        if (!token) {
            setPendingCheckoutState(checkoutState);
            setShowAuthPrompt(true);
            return;
        }

        navigate("/checkout", { state: checkoutState });
    };

    const materialNames = Array.from(
        new Set(
            (product.materials || [])
                .map((item) => String(item?.metal || "").trim())
                .filter(Boolean)
        )
    );
    const madeWithText = materialNames.length
        ? `Made with ${materialNames.join(", ")}`
        : product.subCategory
            ? `Made with ${product.subCategory}`
            : "Material details unavailable";
    const primaryMetalName = materialNames[0] || product.subCategory || "Metal";
    const primaryMetalCode = primaryMetalName
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 3)
        .toUpperCase();
    const normalizedSelectedVariants = normalizeVariantSelection(product, selectedVariants);
    const selectedVariant = resolveSelectedVariant(product, normalizedSelectedVariants);
    const selectedQuantity = selectedVariant.quantity;
    const selectedWeight = Number(selectedVariant.weight || 0);
    const materialWeight = (product.materials || []).reduce(
        (sum, item) => sum + (Number(item?.weight) || 0),
        0
    );
    const displayWeight = selectedWeight > 0 ? selectedWeight : materialWeight;

    return (
        <div className="w-full parkinsans mt-3">
            <h2 className="text-2xl text-[#3A001F] mb-2 ">{product.name}</h2>

            <p className="text-sm text-[#A56028] mb-2 uppercase">{madeWithText}</p>

            <h3 className="text-2xl text-[#3A001F] font-semibold mb-4">
                ₹ {formatPrice(selectedVariant.price)}.00
            </h3>

            {displayWeight > 0 && (
                <p className="mb-4 text-sm font-semibold text-[#A56028]">
                    Weight: {displayWeight.toLocaleString("en-IN", { maximumFractionDigits: 2 })} g
                </p>
            )}

            {/* <p className="text-sm mb-2">Color: Silver</p> */}

            <div className="mb-4">
                {selectedQuantity > 0 ? (
                    <span className="text-green-600 font-semibold">In Stock ({selectedQuantity})</span>
                ) : (
                    <span className="text-red-600 font-semibold">Out of Stock</span>
                )}
            </div>

            <ProductVariantSelector
                product={product}
                selection={selectedVariants}
                onChange={(nextSelection) => {
                    const normalizedSelection = normalizeVariantSelection(product, nextSelection);
                    setSelectedVariants(normalizedSelection);
                    const nextVariant = resolveSelectedVariant(product, normalizedSelection);
                    onVariantImageSelect?.(nextVariant.image || "", nextVariant.images || []);
                }}
                onImageSelect={onVariantImageSelect}
            />

            {/* <div className="flex items-center gap-2 mb-4">
                <input type="checkbox" />
                <span className="text-sm">Add gift box to your order</span>
            </div> */}

            <div className="grid gap-3 sm:grid-cols-2">
                <button
                    onClick={() => addToCart(buildProductWithVariants())}
                    disabled={selectedQuantity <= 0}
                    className={`flex min-h-12 items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-bold transition ${selectedQuantity > 0
                            ? "bg-[#A56028] text-white shadow-sm hover:bg-[#8f4f1e]"
                            : "bg-gray-400 text-gray-200 cursor-not-allowed"
                        }`}
                >
                    <PackageCheck size={18} />
                    Add To Cart
                </button>

                <button
                    onClick={handleBuyNow}
                    disabled={selectedQuantity <= 0}
                    className={`flex min-h-12 items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-bold transition ${selectedQuantity > 0
                            ? "bg-[#3A001F] text-white shadow-sm hover:bg-[#581b3c]"
                            : "bg-gray-400 text-gray-200 cursor-not-allowed"
                        }`}
                >
                    <CreditCard size={18} />
                    Buy it now
                </button>
            </div>

            <div className="mt-4 grid gap-3 text-[#3A001F] sm:grid-cols-3">
                <div className="rounded-lg border border-[#ead5dc] bg-white p-3 shadow-sm">
                    <RotateCcw className="mb-2 text-[#A56028]" size={18} />
                    <p className="text-sm font-bold">Easy returns</p>
                    <p className="mt-1 text-xs text-[#7d5363]">7 day return window</p>
                </div>

                <div className="rounded-lg border border-[#ead5dc] bg-white p-3 shadow-sm">
                    <ShieldCheck className="mb-2 text-[#A56028]" size={18} />
                    <p className="text-sm font-bold">Warranty</p>
                    <p className="mt-1 text-xs text-[#7d5363]">6 months support</p>
                </div>

                <div className="rounded-lg border border-[#ead5dc] bg-[#fff7f3] p-3 shadow-sm">
                    <BadgeCheck className="mb-2 text-[#A56028]" size={18} />
                    <p className="text-sm font-bold">5% extra off</p>
                    <p className="mt-1 text-xs text-[#7d5363]">Auto applied prepaid</p>
                </div>
            </div>

            <div className="mt-5 rounded-lg border border-[#ead5dc] bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fdecef] text-[#3A001F]">
                            <Truck size={18} />
                        </span>
                        <div>
                            <p className="text-sm font-bold text-[#3A001F]">Estimated delivery</p>
                            <p className="text-xs text-[#7d5363]">Check availability for your area</p>
                        </div>
                    </div>
                </div>

                <div className="flex overflow-hidden rounded-md border border-[#3A001F]/25 bg-white">
                    <input
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength="6"
                        placeholder="Enter 6 digit pincode"
                        className="min-w-0 flex-1 px-4 py-3 text-sm outline-none"
                    />

                    <button
                        onClick={() => checkDelivery(pincode)}
                        disabled={checkingDelivery}
                        className="bg-[#3A001F] px-5 text-sm font-bold text-white transition hover:bg-[#581b3c] disabled:opacity-60"
                    >
                        {checkingDelivery ? "..." : "Check"}
                    </button>
                </div>

                {deliveryMsg && (
                    <p className="mt-3 flex items-start gap-2 text-sm font-semibold text-green-700">
                        <MapPin className="mt-0.5 shrink-0" size={16} />
                        {deliveryMsg}
                    </p>
                )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-[#3A001F] text-xs sm:grid-cols-4">
                <div className="rounded-lg bg-[#fdecef] p-3 text-center">
                    <div className="mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-white font-bold">
                        {primaryMetalCode || "M"}
                    </div>
                    <p className="font-semibold uppercase">{primaryMetalName}</p>
                </div>
                <div className="rounded-lg bg-[#fdecef] p-3 text-center">
                    <div className="mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-white font-bold">OK</div>
                    <p className="font-semibold uppercase">Certified</p>
                </div>
                <div className="rounded-lg bg-[#fdecef] p-3 text-center">
                    <div className="mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-white font-bold">6M</div>
                    <p className="font-semibold uppercase">Warranty</p>
                </div>
                <div className="rounded-lg bg-[#fdecef] p-3 text-center">
                    <div className="mx-auto mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-white font-bold">GD</div>
                    <p className="font-semibold uppercase">Good design</p>
                </div>
            </div>

            <div className="mt-6 border-t text-[#3A001F]">
                <div className="border-b py-3">
                    <details>
                        <summary className="cursor-pointer uppercase font-semibold tracking-wide">
                            Product Description
                        </summary>

                        <div className="text-sm text-[#A56028] mt-3 space-y-3">
                            <p>{product.inspiration || "No description available"}</p>
                            <p className="font-semibold text-[#3A001F]">The Design:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                {product.design?.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </details>
                </div>

                <div className="border-b py-3">
                    <details>
                        <summary className="cursor-pointer tracking-wide uppercase font-semibold ">
                            Shipping & Returns
                        </summary>

                        <ul className="flex flex-col space-y-3 mt-5">
                            <li className="text-sm text-[#A56028]">- <span className="font-semibold text-base text-[#3A001F]">Express Shipping:</span> Delivery date is checked from courier serviceability.</li>
                            <li className="text-sm text-[#A56028]">- <span className="font-semibold text-base text-[#3A001F]">Return Policy:</span> No questions asked returns within 7 days.</li>
                            <li className="text-sm text-[#A56028]">- <span className="font-semibold text-base text-[#3A001F]">Product Warranty:</span> 7-day manufacturing warranty.</li>
                            {/* <li className="text-sm">- <span className="font-semibold text-base">Global Shipping:</span> We ship to over 20 countries.</li> */}
                        </ul>
                    </details>
                </div>

                <div className="border-b py-3">
                    <details>
                        <summary className="cursor-pointer tracking-wide uppercase font-semibold">Store Address</summary>
                        <p className="text-sm mt-2 text-[#A56028]">
                            5th Floor, Marwadi Catalysts Building, CYB-5 RIICO Cyber Park, Phase II, Jodhpur, Rajasthan 342005.
                        </p>
                    </details>
                </div>
            </div>

            <AuthRequiredModal
                open={showAuthPrompt}
                onClose={() => setShowAuthPrompt(false)}
                checkoutState={pendingCheckoutState}
            />
        </div>
    );
};

export default BuySection;
