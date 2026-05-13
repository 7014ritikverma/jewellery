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
import { FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Wishlist = () => {

  const { wishlist, removeFromWishlist } =
    useContext(WishlistContext);

  const { addToCart } =
    useContext(CartContext);

  const navigate = useNavigate();

  return (

    <div className="bg-gray-100 min-h-screen px-3 sm:px-6 py-6 mt-20">

      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">

        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b font-bold text-xl flex justify-between items-center bg-white">

          <h2>
            My Wishlist
          </h2>

          <span className="text-sm bg-pink-100 text-[#6b0f1a] px-3 py-1 rounded-full">
            {wishlist.length} Items
          </span>

        </div>

        {/* ITEMS */}
        {wishlist.length > 0 ? (

          <div className="divide-y">

            {wishlist.map((item, i) => (

              <div
                key={i}
                className="
                flex
                flex-col
                sm:flex-row
                sm:items-center
                sm:justify-between
                gap-4
                p-4
                hover:bg-gray-50
                transition
                "
              >

                {/* LEFT */}
                <div
                  onClick={() =>
                    navigate(`/product/${item._id}`, {
                      state: { product: item }
                    })
                  }
                  className="
                  flex
                  gap-4
                  cursor-pointer
                  items-center
                  "
                >

                  <img
                    src={item.images?.[0]}
                    alt={item.name}
                    className="
                    w-24
                    h-24
                    sm:w-28
                    sm:h-28
                    object-cover
                    rounded-xl
                    border
                    shadow-sm
                    "
                  />

                  <div className="flex flex-col gap-2">

                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 line-clamp-2">
                      {item.name}
                    </h3>

                    <span className="text-xl font-bold text-[#6b0f1a]">

                      ₹{Number(item.price).toLocaleString(
                        "en-IN",
                        {
                          minimumFractionDigits: 2,
                        }
                      )}

                    </span>

                    <p className="text-sm text-green-600 font-medium">
                      In Stock
                    </p>

                  </div>

                </div>

                {/* RIGHT */}
                <div
                  className="
                  flex
                  items-center
                  gap-3
                  sm:gap-5
                  w-full
                  sm:w-auto
                  "
                >

                  {/* ADD TO CART */}
                  <button
                    onClick={() => addToCart(item)}
                    className="
                    flex-1
                    sm:flex-none
                    bg-[#6b0f1a]
                    hover:bg-[#4d0912]
                    text-white
                    px-5
                    py-3
                    rounded-xl
                    text-sm
                    font-medium
                    transition
                    shadow-md
                    "
                  >
                    Add to Cart
                  </button>

                  {/* REMOVE */}
                  <button
                    onClick={() =>
                      removeFromWishlist(item._id)
                    }
                    className="
                    text-gray-400
                    hover:text-red-500
                    transition
                    text-lg
                    p-2
                    "
                  >
                    <FaTrash />
                  </button>

                </div>

              </div>

            ))}

          </div>

        ) : (

          <div className="flex flex-col items-center justify-center py-20 px-4">

            <img
              src="https://cdn-icons-png.flaticon.com/512/4555/4555971.png"
              alt="Empty Wishlist"
              className="w-40 mb-6 opacity-80"
            />

            <h2 className="text-3xl font-bold text-[#6b0f1a] mb-2">
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

      </div>

    </div>

  );
};

export default Wishlist;