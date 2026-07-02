// import { useContext } from "react";
// import { WishlistContext } from "../context/WishlistContext";
// import { CartContext } from "../context/CartContext";
// import { FaTrash } from "react-icons/fa";
// import { useNavigate } from "react-router-dom";

// const Wishlist = () => {
//   const { wishlist, removeFromWishlist } = useContext(WishlistContext);
//   const { addToCart } = useContext(CartContext);
//   const navigate = useNavigate();

//   return (
//     <div className="bg-gray-100 min-h-screen p-6 mt-20">

//       <div className="max-w-4xl mx-auto bg-white shadow rounded">

//         {/* HEADER */}
//         <div className="p-4 border-b font-semibold text-lg">
//           My Wishlist ({wishlist.length})
//         </div>

//         {/* ITEMS */}
//         {wishlist.length > 0 ? (
//           wishlist.map((item, i) => (
//             <div
//               key={i}
//               className="flex items-center justify-between p-4 border-b hover:bg-gray-50"
//             >

//               {/* LEFT */}
//               <div onClick={() => navigate(`/product/${item._id}`, { state: { product: item } })}
//                 className="flex items-center gap-4 cursor-pointer">

//                 <img
//                   src={item.images?.[0]}
//                   className="w-24 h-24 object-cover"
//                 />

//                 <div>
//                   <h3 className="text-sm font-medium">
//                     {item.name}
//                   </h3>

//                   <span className="text-lg font-bold">
//                     ₹{Number(item.price).toLocaleString("en-IN", {
//                       minimumFractionDigits: 2,
//                     })}
//                   </span>


//                 </div>
//               </div>

//               {/* RIGHT */}
//               <div className="flex gap-5 justify-center items-center">

//                 {/* ADD TO CART */}
//                 <button
//                   onClick={() => addToCart(item)}
//                   className="bg-[#6b0f1a] cursor-pointer text-white px-4 py-2 rounded text-sm"
//                 >
//                   Add to Cart
//                 </button>

//                 {/* REMOVE */}
//                 <button
//                   onClick={() => removeFromWishlist(item._id)}
//                   className="text-gray-400 cursor-pointer hover:text-red-500"
//                 >
//                   <FaTrash />
//                 </button>


//               </div>

//             </div>
//           ))
//         ) : (
//           <p className="p-6 text-center text-gray-500">
//             Your wishlist is empty ❌
//           </p>
//         )}

//       </div>
//     </div>
//   );
// };

// export default Wishlist;

import { useContext } from "react";
import { WishlistContext } from "../context/WishlistContext";
import { CartContext } from "../context/CartContext";
import { FiHeart, FiTrash2, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "../utils/formatPrice";

const Wishlist = () => {

  const { wishlist, removeFromWishlist } =
    useContext(WishlistContext);

  const { addToCart } =
    useContext(CartContext);

  const navigate = useNavigate();

  const closeWishlist = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/");
  };

  return (

    <div className="fixed inset-0 z-[70] mt-0 bg-black/45 text-[#3A001F]">
      <button
        type="button"
        aria-label="Close wishlist"
        className="absolute inset-0 cursor-default"
        onClick={closeWishlist}
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl sm:w-[430px]">

        {/* HEADER */}
        <div className="flex items-center justify-between border-b px-5 py-4 bg-white">

          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3A001F] text-white">
              <FiHeart size={18} />
            </span>
            <div>
              <h2 className="text-lg font-bold">My Wishlist</h2>
              <p className="text-xs text-gray-500">{wishlist.length} item{wishlist.length === 1 ? "" : "s"}</p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close wishlist"
            onClick={closeWishlist}
            className="flex h-10 w-10 items-center justify-center rounded-full border text-gray-700 hover:bg-gray-50"
          >
            <FiX size={20} />
          </button>

        </div>

        {/* ITEMS */}
        {wishlist.length > 0 ? (

          <div className="flex-1 overflow-y-auto divide-y">

            {wishlist.map((item, i) => (

              <div
                key={item.wishlistKey || item._id || i}
                className="flex items-center gap-3 p-4 transition hover:bg-gray-50"
              >

                {/* LEFT */}
                <div
                  onClick={() =>
                    navigate(`/product/${item._id}`, {
                      state: { product: item }
                    })
                  }
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                >

                  <img
                    src={item.images?.[0]}
                    alt={item.name}
                    className="h-20 w-20 shrink-0 rounded-xl border object-cover shadow-sm"
                  />

                  <div className="min-w-0 flex-1">

                    <h3 className="line-clamp-2 text-sm font-semibold text-[#A56028]">
                      {item.name}
                    </h3>

                    <span className="mt-1 block text-base font-bold text-[#3A001F]">

                      ₹{formatPrice(item.price)}

                    </span>

                    <p className="mt-1 text-xs font-medium text-green-600">
                      In Stock
                    </p>

                  </div>

                </div>

                {/* RIGHT */}
                <div
                  className="flex shrink-0 items-center gap-2"
                >

                  {/* ADD TO CART */}
                  <button
                    onClick={() => addToCart(item)}
                    className="rounded-lg bg-[#3A001F] px-3 py-2 text-xs font-medium text-white shadow-md transition hover:bg-[#581b3c]"
                  >
                    Add to Cart
                  </button>

                  {/* REMOVE */}
                  <button
                    onClick={() =>
                      removeFromWishlist(item.wishlistKey || item._id)
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <FiTrash2 />
                  </button>

                </div>

              </div>

            ))}

          </div>

        ) : (

          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">

            <img
              src="https://cdn-icons-png.flaticon.com/512/4555/4555971.png"
              alt="Empty Wishlist"
              className="w-40 mb-6 opacity-80"
            />

            <h2 className="text-3xl font-bold text-[#3A001F] mb-2">
              Your Wishlist is Empty
            </h2>

            <p className="text-gray-500 text-center mb-6">
              Save your favourite jewellery items here 💖
            </p>

            <button
              onClick={() => navigate("/")}
              className="
              bg-[#6b0f1a]
              hover:bg-[#4d0912]
              text-white
              px-6
              py-3
              rounded-xl
              transition
              "
            >
              Continue Shopping
            </button>

          </div>

        )}

      </aside>

    </div>

  );
};

export default Wishlist;
