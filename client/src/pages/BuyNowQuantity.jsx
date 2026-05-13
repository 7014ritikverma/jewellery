import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const BuyNowQuantity = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const product = location.state?.product;
    const [qty, setQty] = useState(1);

    if (!product) {
        return (
            <div className="p-10 mt-24">
                <h2 className="text-xl font-semibold">No product selected</h2>
                <button
                    onClick={() => navigate("/shop")}
                    className="mt-4 bg-black text-white px-5 py-2 rounded"
                >
                    Go to Shop
                </button>
            </div>
        );
    }

    const price = Number(product.price) || 0;
    const total = price * qty;

    const updateQty = (value) => {
        const nextQty = Math.max(1, Math.min(10, Number(value) || 1));
        setQty(nextQty);
    };

    const continueToCheckout = () => {
        navigate("/checkout", {
            state: {
                product,
                qty
            }
        });
    };

    return (
        <div className="bg-gray-100 min-h-screen py-10 px-4 mt-20">
            <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
                <h2 className="text-2xl font-bold mb-6">Select Quantity</h2>

                <div className="border p-4 rounded flex gap-4 mb-6">
                    <img
                        src={product.images?.[0] || product.image}
                        alt={product.name}
                        className="w-28 h-28 object-cover rounded"
                    />

                    <div className="flex-1">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <p className="text-green-600 font-bold mt-2">₹{Number(price).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                        })}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between border p-4 rounded mb-4">
                    <span className="font-semibold">Quantity</span>

                    <div className="flex items-center border rounded">
                        <button
                            type="button"
                            onClick={() => updateQty(qty - 1)}
                            className="px-4 py-2 text-xl"
                        >
                            -
                        </button>
                        <input
                            value={qty}
                            className="w-14 text-center border-x py-2"
                            onChange={(e) => updateQty(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => updateQty(qty + 1)}
                            className="px-4 py-2 text-xl"
                        >
                            +
                        </button>
                    </div>
                </div>

                <div className="flex justify-between text-lg font-semibold mb-6">
                    <span>Total</span>
                    <span>₹{Number(total).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                    })}</span>
                </div>

                <button
                    onClick={continueToCheckout}
                    className="w-full bg-black text-white py-3 rounded font-semibold"
                >
                    Continue to Checkout
                </button>
            </div>
        </div>
    );
};

export default BuyNowQuantity;
