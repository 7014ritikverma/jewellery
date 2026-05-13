import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { WishlistContext } from "../context/WishlistContext";
import { useState } from "react";
import axios from "axios";

const BuySection = ({ product, addToCart }) => {
    const navigate = useNavigate();
    const { toggleWishlist, isInWishlist } = useContext(WishlistContext);
    const [pincode, setPincode] = useState("");
    const [deliveryMsg, setDeliveryMsg] = useState("");

    const handleBuyNow = () => {
        navigate("/buy-now", { state: { product } });
    };

    const checkDelivery = async () => {

        if (pincode.length !== 6) {
            setDeliveryMsg("❌ Invalid pincode");
            return;
        }

        try {

            const res = await axios.get(
                `http://localhost:5000/api/payment/check-pincode/${pincode}`
            );

            if (!res.data.available) {
                setDeliveryMsg("❌ Delivery not available");
                return;
            }

            const date = new Date();

            date.setDate(date.getDate() + res.data.days);

            const deliveryDate = date.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short"
            });

            setDeliveryMsg(
                `✅ Delivery by ${deliveryDate} to ${res.data.city}, ${res.data.state}`
            );

        } catch (err) {

            setDeliveryMsg("❌ Error checking delivery");
        }
    };

    return (
        <div className="max-w-lg">

            {/* TITLE */}
            <h2 className="text-xl font-semibold mb-2">
                {product.name}
            </h2>

            <p className="text-sm text-gray-500 mb-2 uppercase">
                Made with Silver
            </p>

            {/* PRICE */}
            <h3 className="text-2xl font-bold mb-4">
                ₹{Number(product.price).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                })}
            </h3>

            {/* COLOR */}
            <p className="text-sm mb-2">Color: Silver</p>

            {/* THUMBNAILS */}
            {/* <div className="flex gap-2 mb-4">
                <img src={product.image} className="h-16 w-16 rounded border" />
                <img src={product.image} className="h-16 w-16 rounded border opacity-60" />
            </div> */}

            {/* GIFT OPTION */}
            <div className="flex items-center gap-2 mb-4">
                <input type="checkbox" />
                <span className="text-sm">🎁 Add gift box to your order</span>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3 mb-4">

                {/* ADD TO CART */}
                <button
                    onClick={() => addToCart(product)}
                    className="flex-1 bg-[#b97b8b] text-white py-3 rounded-lg font-semibold hover:opacity-90"
                >
                    Add To Cart
                </button>

                {/* BUY NOW */}
                <button
                    onClick={handleBuyNow}
                    className="flex-1 bg-black text-white py-3 rounded-lg font-semibold hover:opacity-90"
                >
                    Buy it now
                </button>

            </div>

            {/* FEATURES */}
            <div className="space-y-3">

                <div className="bg-pink-50 border rounded-xl p-4 text-sm">
                    <p className="font-semibold">✔ 15 Days Easy Returns</p>
                    <p className="text-gray-500">
                        Not satisfied? Enjoy easy returns within 15 days
                    </p>
                </div>

                <div className="bg-pink-50 border rounded-xl p-4 text-sm">
                    <p className="font-semibold">✔ 6 Months Warranty</p>
                    <p className="text-gray-500">
                        Valid only on selected products
                    </p>
                </div>

                <div className="bg-pink-50 border rounded-xl p-4 text-sm flex justify-between items-center">
                    <p>
                        <span className="font-semibold">5% Extra off</span> on prepaid orders
                    </p>
                    <button className="bg-[#6b0f1a] text-white px-3 py-1 rounded">
                        Auto Apply
                    </button>
                </div>

            </div>

            {/* 🔻 EXTRA UI (DELIVERY + REVIEW + INFO) */}

            {/* DELIVERY CHECK */}
            <div className="mt-6">
                <p className="font-semibold mb-2">Estimated Delivery Time</p>

                <div className="flex">
                    <input
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        maxLength="6"
                        placeholder="Enter 6 digit pincode"
                        className="flex-1 border p-2 rounded-l-full outline-none"
                    />

                    <button
                        onClick={checkDelivery}
                        className="bg-[#6b0f1a] text-white px-5 rounded-r-full"
                    >
                        Check
                    </button>
                </div>

                {/* RESULT */}
                {deliveryMsg && (
                    <p className="mt-2 text-green-600 font-semibold">
                        {deliveryMsg}
                    </p>
                )}
            </div>

            {/* REVIEW CARD */}
            {/* <div className="bg-gray-100 p-4 rounded-xl mt-4 flex justify-between items-center">
                <div>
                    <p className="text-yellow-500">★★★★★</p>
                    <p className="text-sm">
                        <b>kavy</b> <br />
                        great product. really loved the quality
                    </p>
                </div>
                <span className="text-xl">›</span>
            </div> */}

            {/* ICON FEATURES */}
            <div className="grid grid-cols-5 gap-3 text-center text-xs mt-6">

                <div>
                    <div className="bg-pink-100 p-3 rounded-full">💍</div>
                    <p>SILVER</p>
                </div>

                <div>
                    <div className="bg-pink-100 p-3 rounded-full">✔</div>
                    <p>CERTIFIED</p>
                </div>

                <div>
                    <div className="bg-pink-100 p-3 rounded-full">🛡</div>
                    <p>6 MONTH WARRANTY</p>
                </div>

                <div>
                    <div className="bg-pink-100 p-3 rounded-full">✨</div>
                    <p>GOOD DESIGN</p>
                </div>

                <div>
                    <div className="bg-pink-100 p-3 rounded-full">😊</div>
                    <p>2 LAKH+ HAPPY</p>
                </div>

            </div>

            {/* ACCORDION SECTION */}
            <div className="mt-6 border-t">

                {/* PRODUCT DESCRIPTION (DYNAMIC) */}
                <div className="border-b py-3">
                    <details>
                        <summary className="cursor-pointer uppercase font-semibold flex justify-between">
                            Product Description
                        </summary>

                        <div className="text-sm text-gray-700 mt-3 space-y-3">



                            <p>
                                {product.inspiration || "No description available"}
                            </p>

                            <p className="font-semibold text-[#6b0f1a]">
                                The Design:
                            </p>

                            <ul className="list-disc pl-5 space-y-1">
                                {product.design?.map((item, i) => (


                                    <li key={i}>{item}</li>

                                ))}
                            </ul>

                        </div>
                    </details>
                </div>

                {/* SHIPPING & RETURNS (STATIC) */}
                <div className="border-b py-3">
                    <details>
                        <summary className="cursor-pointer uppercase font-semibold mb-5">
                            Shipping & Returns
                        </summary>

                        {/* <p className="text-sm text-gray-600 mt-2">
                            Free shipping across India. Delivery within 5-7 days.
                            Easy 15 days return policy available.
                        </p> */}

                        <ul className="flex flex-col space-y-3">
                            <li className="text-sm">- <span className="font-semibold text-base">Express Shipping:</span> Available on all orders 5–7 days across India. </li>
                            <li className="text-sm">- <span className="font-semibold text-base">Return Policy:</span> No questions asked returns within 15 days.</li>
                            <li className="text-sm">- <span className="font-semibold text-base">Product Warranty:</span> 15-day manufacturing warranty.</li>
                            <li className="text-sm">- <span className="font-semibold text-base">Global Shipping:</span> We ship to over 20 countries.</li>
                        </ul>

                    </details>
                </div>

                {/* STORE ADDRESS (STATIC) */}
                <div className="border-b py-3">
                    <details>
                        <summary className="cursor-pointer uppercase font-semibold">
                            Store Address
                        </summary>

                        <p className="text-sm mt-2">
                            5th Floor, Marwadi Catalysts Building, CYB-5 RIICO Cyber Park, Phase II, Jodhpur, Rajasthan 342005.
                        </p>
                    </details>
                </div>

            </div>

        </div>

    );
};

export default BuySection;

