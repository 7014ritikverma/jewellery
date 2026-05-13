import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

const Cart = ({ product }) => {
  const {
    cart,
    removeItem,
    increaseQty,
    decreaseQty,
    clearCart,
    total,
  } = useContext(CartContext);

  const navigate = useNavigate();

  return (
    <div className="p-10 mt-20 bg-gray-100 min-h-screen">

      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Cart 🛒</h1>

          {cart.length > 0 && (

            <button
              onClick={clearCart}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Clear Cart
            </button>

          )}

        </div>

        {/* CART ITEMS */}
        {/* EMPTY CART */}
        {cart.length === 0 ? (

          <div className="flex flex-col items-center justify-center mt-20">

            {/* IMAGE */}
            <img
              src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png"
              alt="Empty Cart"
              className="w-72 mb-6 opacity-80"
            />

            {/* TEXT */}
            <h2 className="text-5xl font-bold text-red-500 mb-3">
              Oops!
            </h2>

            <p className="text-3xl text-gray-700">
              No Products Found...
            </p>

            {/* BUTTON */}
            <button
              onClick={() => navigate("/shop")}
              className="mt-8 bg-[#6b0f1a] text-white px-8 py-3 rounded-lg text-lg"
            >
              Continue Shopping
            </button>

          </div>

        ) : (

          <>
            {/* CART ITEMS */}
            {cart.map((item, i) => (

              <div
                key={i}
                className="bg-white p-4 rounded-xl shadow mb-4 flex justify-between items-center"
              >

                {/* LEFT SIDE */}
                <div
                  onClick={() =>
                    navigate(`/product/${item._id}`, {
                      state: { product: item }
                    })
                  }
                  className="flex items-center gap-4 cursor-pointer"
                >

                  <img
                    src={item.images?.[0]}
                    className="w-20 h-20 object-cover rounded"
                  />

                  <div>
                    <h3 className="font-semibold text-sm">
                      {item.name}
                    </h3>

                    <p className="text-gray-600">
                      ₹{Number(item.price).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                </div>

                {/* QUANTITY */}
                <div className="flex items-center gap-2">

                  <button
                    onClick={() => decreaseQty(item._id)}
                    className="bg-gray-200 px-3 py-1 rounded"
                  >
                    -
                  </button>

                  <span className="font-semibold">
                    {item.qty}
                  </span>

                  <button
                    onClick={() => increaseQty(item._id)}
                    className="bg-gray-200 px-3 py-1 rounded"
                  >
                    +
                  </button>

                </div>

                {/* REMOVE */}
                <div>
                  <button
                    onClick={() => removeItem(item._id)}
                    className="bg-red-500 text-white px-4 py-2 rounded"
                  >
                    Remove
                  </button>
                </div>

              </div>

            ))}

            {/* TOTAL */}
            {cart.length > 0 && (

              <div className="flex justify-end mt-6">

                <div className="bg-white p-6 rounded-xl shadow w-80">

                  <h2 className="text-xl font-bold mb-4">
                    Total: ₹{Number(total).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </h2>

                  <button
                    onClick={() =>
                      navigate("/checkout", {
                        state: {
                          cartItems: cart,
                          total: total
                        }
                      })
                    }
                    className="w-full bg-[#6b0f1a] text-white py-3 rounded-lg">
                    Checkout
                  </button>

                </div>

              </div>

            )}
          </>
        )}

        {/* TOTAL
        <div className="flex justify-end mt-6">
          <div className="bg-white p-6 rounded-xl shadow w-80">

            <h2 className="text-xl font-bold mb-4">
              Total: ₹{total}
            </h2>

            <button className="w-full bg-[#6b0f1a] text-white py-3 rounded-lg">
              Checkout
            </button>

          </div>
        </div> */}

      </div >
    </div >
  );
};

export default Cart;