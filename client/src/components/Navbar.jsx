

// import { Link, useNavigate } from "react-router-dom";
// import { FiUser, FiHeart, FiShoppingBag } from "react-icons/fi";
// import { useCallback, useContext, useState, useRef, useEffect } from "react";
// import { AuthContext } from "../context/AuthContext";
// import { WishlistContext } from "../context/WishlistContext";
// import { CartContext } from "../context/CartContext";
// import axios from "axios";

// const Navbar = () => {
//   const { userToken, logout } = useContext(AuthContext);
//   const [open, setOpen] = useState(false);
//   const navigate = useNavigate();
//   const { wishlist } = useContext(WishlistContext);
//   const { cart } = useContext(CartContext);
//   const userDropdownRef = useRef();
//   const searchDropdownRef = useRef();

//   const [searchOpen, setSearchOpen] = useState(false);
//   const [searchText, setSearchText] = useState("");
//   const [products, setProducts] = useState([]);

//   const handleLogout = () => {
//     logout();
//     navigate("/");
//   };

//   const closeSearch = useCallback(() => {
//     setSearchOpen(false);
//   }, []);

//   const filteredProducts = products.filter(p =>
//     p.name.toLowerCase().includes(searchText.toLowerCase())
//   );

//   useEffect(() => {
//     axios.get("http://localhost:5000/api/products")
//       .then(res => setProducts(res.data));
//   }, []);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
//         setOpen(false);
//       }

//       if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
//         closeSearch();
//       }
//     };

//     const handleKeyDown = (event) => {
//       if (event.key === "Escape") {
//         setOpen(false);
//         closeSearch();
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     document.addEventListener("keydown", handleKeyDown);

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//       document.removeEventListener("keydown", handleKeyDown);
//     };
//   }, [closeSearch]);

//   return (


//     <div className="w-full fixed top-0 z-50">

//       {/* 🔴 TOP BAR */}
//       <div className="bg-[#6b0f1a] text-white text-center py-2 text-sm">
//         Welcome to Khushbu Jewellers
//       </div>

//       {/* ⚪ MAIN NAVBAR */}
//       <div className="bg-white shadow px-6 py-4 flex justify-between items-center">

//         <Link to="/" className=""><h1 className="text-2xl font-semibold">KHUSHBU</h1></Link>

//         {/* MENU */}
//         <div className="hidden md:flex gap-6">
//           <Link to="/" className="hover:text-[#6b0f1a]">Home</Link>

//           <div className="group relative cursor-pointer">
//             <span className="hover:text-[#6b0f1a]">Shop By Category ▾</span>

//             {/* DROPDOWN */}
//             <div className="absolute hidden group-hover:block bg-white shadow p-3 mt-2 w-40">
//               <Link to="/shop?category=Rings" className="block py-1 hover:text-[#6b0f1a]">
//                 Rings
//               </Link>

//               <Link to="/shop?category=Necklace" className="block py-1 hover:text-[#6b0f1a]">
//                 Necklace
//               </Link>

//               <Link to="/shop?category=Earrings" className="block py-1 hover:text-[#6b0f1a]">
//                 Earrings
//               </Link>
//             </div>
//           </div>

//           <Link to="/shop?type=new" className="hover:text-[#6b0f1a]">
//             New Arrival
//           </Link>

//           <Link to="/shop?type=bestseller" className="hover:text-[#6b0f1a]">
//             Bestsellers
//           </Link>

//           <div className="group relative cursor-pointer">
//             <span className="hover:text-[#6b0f1a]">Info ▾</span>

//             <div className="absolute hidden group-hover:block bg-white shadow p-3 mt-2 w-40">
//               <Link to="/about" className="block py-1">About</Link>
//               <Link to="/contact" className="block py-1">Contact</Link>
//             </div>
//           </div>

//           <div className="group relative cursor-pointer">
//             <span className="hover:text-[#6b0f1a]">Our Policy ▾</span>

//             <div className="absolute hidden group-hover:block bg-white shadow p-3 mt-2 w-40">
//               <Link to="/return" className="block py-1">Return</Link>
//               <Link to="/privacy" className="block py-1">Privacy</Link>

//             </div>
//           </div>
//         </div>

//         {/* RIGHT SIDE */}
//         <div className="flex items-center gap-4">

//           {/* SEARCH */}
//           <div className="relative" ref={searchDropdownRef}>

//             <input
//               placeholder="Search..."
//               className="border px-4 py-2 rounded-full"
//               value={searchText}
//               onFocus={() => setSearchOpen(true)}
//               onClick={() => setSearchOpen(true)}
//               onChange={(e) => setSearchText(e.target.value)}
//             />

//             {/* 🔽 DROPDOWN */}
//             {searchOpen && (
//               <div className="absolute top-12 right-0 w-[500px] bg-white shadow-xl p-4 rounded-xl z-50">

//                 {/* POPULAR */}
//                 {!searchText && (
//                   <>
//                     <h3 className="font-semibold mb-2">Popular Choices</h3>

//                     <div className="flex gap-2 flex-wrap mb-4">
//                       {["Anklet", "Bracelet", "Rings", "Earrings", "Necklace"].map(item => (
//                         <button
//                           key={item}
//                           onClick={() => {
//                             navigate(`/shop?category=${item}`);  // ✅ listing page
//                             closeSearch();
//                           }}
//                           className="bg-gray-200 px-3 py-1 rounded-full text-sm"
//                         >
//                           {item}
//                         </button>
//                       ))}
//                     </div>
//                   </>
//                 )}

//                 {/* RESULTS */}
//                 <h3 className="font-semibold mb-2">Recommended</h3>

//                 <div className="flex gap-3 overflow-x-auto">

//                   {filteredProducts.slice(0, 5).map(p => (
//                     <div
//                       key={p._id}
//                       onClick={() => {
//                         navigate(`/product/${p._id}`, { state: { product: p } }); // ✅ details
//                         closeSearch();
//                       }}
//                       className="min-w-[120px] cursor-pointer"
//                     >
//                       <img src={p.images?.[0]} className="h-24 w-24 object-cover rounded" />
//                       <p className="text-sm truncate">{p.name}</p>
//                       <p className="text-red-500 text-sm">₹{Number(p.price).toLocaleString("en-IN", {
//                         minimumFractionDigits: 2,
//                       })}</p>
//                     </div>
//                   ))}

//                 </div>

//               </div>
//             )}

//           </div>

//           {/* USER ICON */}
//           <div className="relative" ref={userDropdownRef}>
//             <FiUser
//               className="text-xl cursor-pointer"
//               onClick={() => setOpen(!open)}
//             />

//             {open && (
//               <div className="absolute  right-0 mt-2 bg-white shadow-lg rounded-lg p-3 w-40">

//                 {!userToken ? (
//                   <>
//                     <Link
//                       to="/login"
//                       className="block py-1 hover:text-[#6b0f1a]"
//                     >
//                       Login
//                     </Link>

//                     <Link
//                       to="/signup"
//                       className="block py-1 hover:text-[#6b0f1a]"
//                     >
//                       Signup
//                     </Link>
//                   </>
//                 ) : (
//                   <>
//                     <button
//                       onClick={() => {
//                         navigate("/dashboard");
//                         setOpen(false);   // ✅ CLOSE
//                       }}
//                       className="block w-full text-left py-1 hover:text-[#6b0f1a]"
//                     >
//                       Profile
//                     </button>

//                     <button
//                       onClick={() => {
//                         navigate("/orders");
//                         setOpen(false);
//                       }}
//                       className="block w-full text-left py-1 hover:text-[#6b0f1a]"
//                     >
//                       Orders
//                     </button>

//                     <button
//                       onClick={() => {
//                         handleLogout();
//                         setOpen(false);   // ✅ CLOSE
//                       }}
//                       className="block w-full text-left py-1 text-red-500"
//                     >
//                       Logout
//                     </button>
//                   </>
//                 )}

//               </div>
//             )}
//           </div>

//           {/* WISHLIST */}
//           <Link to="/wishlist" className="relative">
//             <FiHeart className="text-xl" />

//             {wishlist.length > 0 && (
//               <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
//                 {wishlist.length}
//               </span>
//             )}
//           </Link>

//           {/* CART */}
//           <Link to="/cart" className="relative">
//             <FiShoppingBag className="text-xl cursor-pointer" />

//             {cart.length > 0 && (
//               <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
//                 {cart.length}
//               </span>
//             )}
//           </Link>

//         </div>

//       </div>

//     </div>
//   );
// };

// export default Navbar;


import { Link, useNavigate } from "react-router-dom";

import {
  FiUser,
  FiHeart,
  FiShoppingBag,
  FiMenu,
  FiX,
  FiSearch
} from "react-icons/fi";

import {
  useCallback,
  useContext,
  useState,
  useRef,
  useEffect
} from "react";

import { AuthContext } from "../context/AuthContext";
import { WishlistContext } from "../context/WishlistContext";
import { CartContext } from "../context/CartContext";

import axios from "axios";

const Navbar = () => {

  const { userToken, logout } = useContext(AuthContext);

  const { wishlist } = useContext(WishlistContext);

  const { cart } = useContext(CartContext);

  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  const [mobileMenu, setMobileMenu] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);

  const [searchText, setSearchText] = useState("");

  const [products, setProducts] = useState([]);

  const userDropdownRef = useRef();

  const searchDropdownRef = useRef();

  const handleLogout = () => {

    logout();

    navigate("/");
  };

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchText.toLowerCase())
  );

  useEffect(() => {

    axios
      .get("http://localhost:5000/api/products")
      .then((res) => setProducts(res.data));

  }, []);

  useEffect(() => {

    const handleClickOutside = (event) => {

      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }

      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target)
      ) {
        closeSearch();
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {

      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };

  }, [closeSearch]);

  return (

    <div className="w-full fixed top-0 z-50">

      {/* TOP BAR */}
      <div className="bg-[#6b0f1a] text-white text-center py-2 text-xs sm:text-sm tracking-wide">

        ✨ Welcome To Khushbu Jewellers ✨

      </div>

      {/* MAIN NAVBAR */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">

          {/* LEFT */}
          <div className="flex items-center justify-around w-1/3 gap-4">

            {/* MOBILE MENU BUTTON */}
            <button
              onClick={() =>
                setMobileMenu(!mobileMenu)
              }
              className="lg:hidden text-2xl"
            >

              {mobileMenu ? <FiX /> : <FiMenu />}

            </button>

            {/* LOGO */}
            <Link to="/">

              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-[4px] text-[#6b0f1a]">

                KHUSHBU

              </h1>

            </Link>

          </div>


          {/* DESKTOP MENU */}
          <div className="hidden lg:flex items-center gap-5 2xl:gap-7 text-[13px] 2xl:text-[15px] font-medium ml-6 lg:mr-5 whitespace-nowrap">

            <Link
              to="/"
              className="hover:text-[#6b0f1a] transition duration-300"
            >
              Home
            </Link>

            {/* CATEGORY DROPDOWN */}
            <div className="group relative cursor-pointer">

              <span className="hover:text-[#6b0f1a] transition duration-300">

                Shop By Category ▾

              </span>

              {/* DROPDOWN */}
              <div className="absolute hidden group-hover:block top-8 left-0 bg-white border border-gray-100 shadow-2xl rounded-2xl p-4 w-52 z-50">

                <Link
                  to="/shop?category=Rings"
                  className="block py-2 hover:text-[#6b0f1a]"
                >
                  Rings
                </Link>

                <Link
                  to="/shop?category=Necklace"
                  className="block py-2 hover:text-[#6b0f1a]"
                >
                  Necklace
                </Link>

                <Link
                  to="/shop?category=Earrings"
                  className="block py-2 hover:text-[#6b0f1a]"
                >
                  Earrings
                </Link>

                <Link
                  to="/shop?category=Bracelet"
                  className="block py-2 hover:text-[#6b0f1a]"
                >
                  Bracelet
                </Link>



              </div>

            </div>

            <Link
              to="/shop?type=new"
              className="hover:text-[#6b0f1a] transition duration-300"
            >
              New Arrival
            </Link>

            <Link
              to="/shop?type=bestseller"
              className="hover:text-[#6b0f1a] transition duration-300"
            >
              Bestsellers
            </Link>

            {/* <Link
              to="/about"
              className="hover:text-[#6b0f1a] transition duration-300"
            >
              About
            </Link>

            <Link
              to="/contact"
              className="hover:text-[#6b0f1a] transition duration-300"
            >
              Contact
            </Link> */}

            <div className="group relative cursor-pointer">
              <span className="hover:text-[#6b0f1a]">Info ▾</span>

              <div className="absolute hidden group-hover:block bg-white shadow p-3 mt-2 w-40">
                <Link to="/about" className="block py-1">About</Link>
                <Link to="/contact" className="block py-1">Contact</Link>
              </div>
            </div>

            <div className="group relative cursor-pointer">
              <span className="hover:text-[#6b0f1a]">Our Policy ▾</span>

              <div className="absolute hidden group-hover:block bg-white shadow p-3 mt-2 w-40">
                <Link to="/return" className="block py-1">Return</Link>
                <Link to="/privacy" className="block py-1">Privacy</Link>

              </div>
            </div>

          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-3 sm:gap-5">

            {/* SEARCH */}
            <div
              className="relative hidden sm:block"
              ref={searchDropdownRef}
            >

              <div className="flex items-center border border-gray-300 rounded-full px-4 py-2 bg-gray-50 w-[230px] lg:w-[250px]">

                <FiSearch className="text-gray-500 mr-2" />

                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent outline-none w-full text-sm"
                  value={searchText}
                  onFocus={() => setSearchOpen(true)}
                  onClick={() => setSearchOpen(true)}
                  onChange={(e) =>
                    setSearchText(e.target.value)
                  }
                />

              </div>

              {/* SEARCH DROPDOWN */}
              {searchOpen && (

                <div className="absolute top-14 right-0 w-[320px] md:w-[500px] bg-white shadow-2xl rounded-2xl p-5 z-50 border border-gray-100">

                  {!searchText && (

                    <>
                      <h3 className="font-semibold mb-3">
                        Popular Choices
                      </h3>

                      <div className="flex flex-wrap gap-2 mb-4">

                        {[
                          "Rings",
                          "Necklace",
                          "Earrings",
                          "Bracelet"
                        ].map((item) => (

                          <button
                            key={item}
                            onClick={() => {
                              navigate(`/shop?category=${item}`);
                              closeSearch();
                            }}
                            className="bg-gray-100 hover:bg-[#6b0f1a] hover:text-white px-3 py-1 rounded-full text-sm transition"
                          >
                            {item}
                          </button>

                        ))}

                      </div>

                    </>

                  )}

                  <div className="flex gap-4 overflow-x-auto">

                    {filteredProducts
                      .slice(0, 5)
                      .map((p) => (

                        <div
                          key={p._id}
                          onClick={() => {
                            navigate(`/product/${p._id}`, {
                              state: { product: p }
                            });

                            closeSearch();
                          }}
                          className="min-w-[120px] cursor-pointer"
                        >

                          <img
                            src={p.images?.[0]}
                            className="h-24 w-24 object-cover rounded-xl"
                          />

                          <p className="text-sm truncate mt-2">

                            {p.name}

                          </p>

                          <p className="text-[#6b0f1a] font-semibold text-sm">

                            ₹{Number(p.price).toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits: 2
                              }
                            )}

                          </p>

                        </div>

                      ))}

                  </div>

                </div>

              )}

            </div>

            {/* USER */}
            <div
              className="relative"
              ref={userDropdownRef}
            >

              <FiUser
                className="text-xl sm:text-2xl cursor-pointer hover:text-[#6b0f1a] transition"
                onClick={() => setOpen(!open)}
              />

              {open && (

                <div className="absolute right-0 mt-4 bg-white border border-gray-100 shadow-2xl rounded-2xl p-4 w-44">

                  {!userToken ? (
                    <>

                      <Link
                        to="/login"
                        className="block py-2 hover:text-[#6b0f1a]"
                      >
                        Login
                      </Link>

                      <Link
                        to="/signup"
                        className="block py-2 hover:text-[#6b0f1a]"
                      >
                        Signup
                      </Link>

                    </>
                  ) : (
                    <>

                      <button
                        onClick={() => {
                          navigate("/dashboard");
                          setOpen(false);
                        }}
                        className="block w-full text-left py-2 hover:text-[#6b0f1a]"
                      >
                        Profile
                      </button>

                      <button
                        onClick={() => {
                          navigate("/orders");
                          setOpen(false);
                        }}
                        className="block w-full text-left py-2 hover:text-[#6b0f1a]"
                      >
                        Orders
                      </button>

                      <button
                        onClick={() => {
                          handleLogout();
                          setOpen(false);
                        }}
                        className="block w-full text-left py-2 text-red-500"
                      >
                        Logout
                      </button>

                    </>
                  )}

                </div>

              )}

            </div>

            {/* WISHLIST */}
            <Link
              to="/wishlist"
              className="relative"
            >

              <FiHeart className="text-xl sm:text-2xl hover:text-[#6b0f1a] transition" />

              {wishlist.length > 0 && (

                <span className="absolute -top-2 -right-2 bg-[#6b0f1a] text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full">

                  {wishlist.length}

                </span>

              )}

            </Link>

            {/* CART */}
            <Link
              to="/cart"
              className="relative"
            >

              <FiShoppingBag className="text-xl sm:text-2xl hover:text-[#6b0f1a] transition" />

              {cart.length > 0 && (

                <span className="absolute -top-2 -right-2 bg-[#6b0f1a] text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full">

                  {cart.length}

                </span>

              )}

            </Link>

          </div>

        </div>

        {/* MOBILE MENU */}
        {mobileMenu && (

          <div className="md:hidden bg-white border-t border-gray-200 px-6 py-5 flex flex-col gap-5 text-[15px] font-medium shadow-lg">

            <div
              className="relative"
              ref={searchDropdownRef}
            >

              <div className="flex items-center border border-gray-300 rounded-full px-4 py-2 bg-gray-50 w-[230px] lg:w-[250px]">

                <FiSearch className="text-gray-500 mr-2" />

                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent outline-none w-full text-sm"
                  value={searchText}
                  onFocus={() => setSearchOpen(true)}
                  onClick={() => setSearchOpen(true)}
                  onChange={(e) =>
                    setSearchText(e.target.value)
                  }
                />

              </div>

              {/* SEARCH DROPDOWN */}
              {searchOpen && (

                <div className="absolute top-14 left-0 w-[320px] md:w-[500px] bg-white shadow-2xl rounded-2xl p-5 z-50 border border-gray-100">

                  {!searchText && (

                    <>
                      <h3 className="font-semibold mb-3">
                        Popular Choices
                      </h3>

                      <div className="flex flex-wrap gap-2 mb-4">

                        {[
                          "Rings",
                          "Necklace",
                          "Earrings",
                          "Bracelet"
                        ].map((item) => (

                          <button
                            key={item}
                            onClick={() => {
                              navigate(`/shop?category=${item}`);
                              closeSearch();
                            }}
                            
                            className="bg-gray-100 hover:bg-[#6b0f1a] hover:text-white px-3 py-1 rounded-full text-sm transition"
                          >
                            {item}
                          </button>

                        ))}

                      </div>

                    </>

                  )}

                  <div className="flex gap-4 overflow-x-auto">

                    {filteredProducts
                      .slice(0, 5)
                      .map((p) => (

                        <div
                          key={p._id}
                          onClick={() => {
                            navigate(`/product/${p._id}`, {
                              state: { product: p }
                            });

                            closeSearch();
                          }}
                          className="min-w-[120px] cursor-pointer"
                        >

                          <img
                            src={p.images?.[0]}
                            className="h-24 w-24 object-cover rounded-xl"
                          />

                          <p className="text-sm truncate mt-2">

                            {p.name}

                          </p>

                          <p className="text-[#6b0f1a] font-semibold text-sm">

                            ₹{Number(p.price).toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits: 2
                              }
                            )}

                          </p>

                        </div>

                      ))}

                  </div>

                </div>

              )}

            </div>

            <Link
              to="/"
              onClick={() => setMobileMenu(false)}
            >
              Home
            </Link>

            {/* CATEGORY */}
            <div className="flex flex-col gap-3">

              <p className="font-semibold text-[#6b0f1a]">
                Shop By Category ▾
              </p>

              <div className="flex flex-col gap-3 pl-3 text-gray-700">

                <Link
                  to="/shop?category=Rings"
                  onClick={() => setMobileMenu(false)}
                >
                  Rings
                </Link>

                <Link
                  to="/shop?category=Necklace"
                  onClick={() => setMobileMenu(false)}
                >
                  Necklace
                </Link>

                <Link
                  to="/shop?category=Earrings"
                  onClick={() => setMobileMenu(false)}
                >
                  Earrings
                </Link>

                <Link
                  to="/shop?category=Bracelet"
                  onClick={() => setMobileMenu(false)}
                >
                  Bracelet
                </Link>

              </div>

            </div>

            <Link
              to="/shop?type=new"
              onClick={() => setMobileMenu(false)}
            >
              New Arrival
            </Link>

            <Link
              to="/shop?type=bestseller"
              onClick={() => setMobileMenu(false)}
            >
              Bestsellers
            </Link>

            <div className="flex flex-col gap-2 ">
              <span className="font-semibold text-[#6b0f1a]">Info ▾</span>

              <div className="flex flex-col gap-1 pl-3 text-gray-700">
                <Link to="/about"
                  onClick={() => setMobileMenu(false)}
                  className=" py-1">About</Link>
                <Link to="/contact"
                  onClick={() => setMobileMenu(false)}
                  className=" py-1">Contact</Link>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="font-semibold text-[#6b0f1a]">Our Policy ▾</span>

              <div className="flex flex-col gap-1 pl-3 text-gray-700">
                <Link to="/return"
                  onClick={() => setMobileMenu(false)}
                  className=" py-1">Return</Link>
                <Link to="/privacy"
                  onClick={() => setMobileMenu(false)}
                  className=" py-1">Privacy</Link>

              </div>
            </div>

          </div>

        )}

      </div>

    </div>
  );
};

export default Navbar;