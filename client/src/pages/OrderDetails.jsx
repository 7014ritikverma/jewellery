import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const OrderDetails = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const navigate = useNavigate();


    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await axios.get(
                    `http://localhost:5000/api/orders/${id}`
                );
                setOrder(res.data);
            } catch (err) {
                console.log(err);
            }
        };

        fetchOrder();
    }, [id]);

    if (!order) return <h2 className="p-10">Loading...</h2>;

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
                        src={item?.images?.[0]}
                        className="w-20 h-20 object-cover"
                    />

                    <div>
                        <h3 className="font-semibold hover:text-blue-600">
                            {item?.name}
                        </h3>

                        <p className="text-gray-500 text-sm">
                            Qty: {order.items?.[0]?.qty}
                        </p>
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