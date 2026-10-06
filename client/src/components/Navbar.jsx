import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiChevronDown,
  FiHeart,
  FiMenu,
  FiSearch,
  FiShoppingBag,
  FiUser,
  FiX,
} from "react-icons/fi";
import { formatPrice } from "../utils/formatPrice";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";

import { AuthContext } from "../context/AuthContext";
import { WishlistContext } from "../context/WishlistContext";
import { CartContext } from "../context/CartContext";
import ConfirmDialog from "./ConfirmDialog";

const unwrapProducts = (payload) =>
  Array.isArray(payload) ? payload : payload?.products || [];

const Navbar = () => {
  const { userToken, logout } = useContext(AuthContext);
  const { wishlist } = useContext(WishlistContext);
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [products, setProducts] = useState([]);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const userDropdownRef = useRef();
  const searchDropdownRef = useRef();

  const categories = Array.from(
    new Set(products.map((product) => product.category).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  const categoryOptions =
    categories.length > 0
      ? categories
      : ["Rings", "Necklace", "Earrings", "Bracelets", "Mangalsutras"];

  const infoLinks = [
    ["Job's", "/jobs"],
    ["Blogs", "/blogs"],
    ["Bulk Inquiry", "/bulk-inquiry"],
    ["About", "/about"],
    ["Contact", "/contact"],
    ["Brand Story", "/brand-story"],
    ["Collab With Us", "/collab"],
  ];

  const policyLinks = [
    ["Return", "/return-refund"],
    ["Privacy", "/privacy"],
    ["Terms & Conditions", "/terms-conditions"],
    ["FAQ", "/faq"],
  ];

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    setLogoutConfirmOpen(false);
    navigate("/");
  };

  useEffect(() => {
    axios
      .get("/api/products?page=1&limit=60")
      .then((res) => setProducts(unwrapProducts(res.data)))
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setOpen(false);
      }

      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target)) {
        closeSearch();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeSearch]);

  const searchBox = (mobile = false) => (
    <div className="relative w-full" ref={mobile ? null : searchDropdownRef}>
      <div className="flex h-12 items-center gap-3 rounded-md border border-[#581b3c] bg-white px-4 text-[#3A001F] shadow-[0_6px_18px_rgba(92,11,42,0.04)]">
        <FiSearch className="shrink-0 text-[#3A001F]" size={18} />
        <input
          type="text"
          placeholder="Search for products, collections..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-[#3A001F] placeholder:parkinsans"
          value={searchText}
          onFocus={() => setSearchOpen(true)}
          onClick={() => setSearchOpen(true)}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {searchOpen && (
        <div className="absolute left-0 top-14 z-50 w-full min-w-[320px] rounded-lg border border-[#581b3c] bg-white p-4 text-[#4b0b24] shadow-2xl">
          {!searchText && (
            <>
              <h3 className="mb-3 text-sm font-bold">Popular Choices</h3>
              <div className="mb-4 flex flex-wrap gap-2">
                {categoryOptions.slice(0, 8).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      navigate(`/shop?category=${item}`);
                      closeSearch();
                      setMobileMenu(false);
                    }}
                    className="rounded-full bg-[#3A001F] px-3 py-1 text-xs font-normal text-white transition hover:bg-[#FFBC73] hover:text-[#3A001F]"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="grid max-h-[330px] gap-3 overflow-y-auto">
            {filteredProducts.slice(0, 6).map((p) => (
              <button
                key={p._id}
                type="button"
                onClick={() => {
                  navigate(`/product/${p._id}`, { state: { product: p } });
                  closeSearch();
                  setMobileMenu(false);
                }}
                className="flex items-center gap-3 text-left"
              >
                <img
                  src={p.images?.[0]}
                  alt={p.name}
                  className="h-14 w-14 rounded-md object-cover"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm ">{p.name}</span>
                  <span className="block text-xs font-bold text-[#3A001F]">
                    ₹ {formatPrice(p.price)}.00
                  </span>
                </span>
              </button>
            ))}
            {searchText && filteredProducts.length === 0 && (
              <p className="py-3 text-sm text-[#8a6673]">No matching products found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <header className="fixed left-0 bodoni-moda top-0 z-50 w-full border-b border-stone-200 bg-[#3A001F] text-white shadow-sm">
      <Link to="/shop" className="flex h-6 items-center justify-center border-b border-stone-200 bg-[#faf8f5] px-4 text-[9px] font-medium tracking-[0.04em] text-[#423a36] sm:text-[10px]">
        Free express shipping with orders over ₹1500&nbsp; <span className="ml-1 font-bold underline underline-offset-2">SHOP NOW</span>
      </Link>

      <div className="mx-auto grid h-[64px] max-w-[1480px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-8 lg:h-[66px]">
        <div className="flex items-center sm:gap-4 gap-8">
          <button
            type="button"
            onClick={() => setMobileMenu((current) => !current)}
            className="flex h-9 w-9 items-center justify-center text-[#292321] lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenu ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>

          <Link to="/" className="shrink-0" aria-label="Khushbu Jewellers home">
            <img src="Logo2.png" alt="Khushbu Jewellers" className="h-8 w-auto object-contain sm:h-10" />
          </Link>
        </div>

        <nav className="hidden items-center justify-center gap-7 text-sm font-medium lg:flex xl:gap-9">
          <Link to="/" className={`border-b pb-1 transition hover:border-[#FFBC73] ${location.pathname === "/" ? "border-[#A56028]" : "border-transparent"}`}>Home</Link>
          <div className="group relative py-6">
            <span className="inline-flex cursor-pointer items-center gap-1 transition hover:text-[#a56028]">Categories <FiChevronDown size={13} /></span>
            <div className="absolute left-1/2 top-[58px] hidden w-48 -translate-x-1/2 border border-stone-200 text-[#3A001F] rounded-2xl bg-white p-2 shadow-lg group-hover:block">
              {categoryOptions.map((item) => (
                <Link key={item} to={`/shop?category=${item}`} className="block px-3 py-2 text-sm transition hover:bg-stone-100 rounded-md hover:text-[#a56028]">
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <Link to="/shop?type=new" className="transition hover:text-[#a56028]">New Arrival</Link>
          <Link to="/shop?type=bestseller" className="transition hover:text-[#a56028]">Bestsellers</Link>
          <div className="group relative py-6">
            <span className="inline-flex cursor-pointer items-center gap-1 transition hover:text-[#a56028]">Info <FiChevronDown size={13} /></span>
            <div className="absolute left-1/2 top-[58px] hidden w-48 -translate-x-1/2 border border-stone-200 bg-white text-[#3A001F] rounded-2xl p-2 shadow-lg group-hover:block">
              {infoLinks.map(([label, path]) => (
                <Link key={label} to={path} className="block px-3 py-2 text-sm transition hover:bg-stone-100 rounded-md hover:text-[#a56028]">
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div className="group relative py-6">
            <span className="inline-flex cursor-pointer items-center gap-1 transition hover:text-[#a56028]">Our Policy <FiChevronDown size={13} /></span>
            <div className="absolute left-1/2 top-[58px] hidden w-52 -translate-x-1/2 border border-stone-200 bg-white text-[#3A001F] rounded-2xl p-2 shadow-lg group-hover:block">
              {policyLinks.map(([label, path]) => (
                <Link key={label} to={path} className="block px-3 py-2 text-sm transition hover:bg-stone-100 rounded-md hover:text-[#a56028]">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3 text-white sm:gap-4">
          <div className="relative hidden sm:block" ref={searchDropdownRef}>
            <button type="button" onClick={() => setSearchOpen((current) => !current)} className="p-1 transition hover:text-[#FFBC73]" aria-label="Search products"><FiSearch size={18} /></button>
            {searchOpen && <div className="absolute right-0 top-9 w-[360px]">{searchBox()}</div>}
          </div>
          <Link
            to="/wishlist"
            state={{ backgroundLocation: location }}
            className="relative hidden p-1 transition hover:text-[#FFBC73] md:flex"
          >
            <FiHeart size={22} />
            {wishlist.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#a56028] px-1 text-[10px] text-white">
                {wishlist.length}
              </span>
            )}
          </Link>

          <div className="relative" ref={userDropdownRef}>
            <button
              type="button"
              onClick={() => setOpen((current) => !current)}
              className="flex p-1 transition hover:text-[#FFBC73]"
            >
              <FiUser size={22} />
            </button>

            {open && (
              <div className="absolute right-0 mt-4 w-44 border border-stone-200 bg-white p-2 text-sm text-[#292321] shadow-xl">
                {!userToken ? (
                  <Link to="/login" className="block px-3 py-2 hover:bg-stone-50 hover:text-[#a56028]">
                    Login / Signup
                  </Link>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/dashboard");
                        setOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-left hover:bg-stone-50 hover:text-[#a56028]"
                    >
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/orders");
                        setOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-left hover:bg-stone-50 hover:text-[#a56028]"
                    >
                      Orders
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoutConfirmOpen(true)}
                      className="block w-full px-3 py-2 text-left text-red-600 hover:bg-stone-50"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <Link
            to="/cart"
            state={{ backgroundLocation: location }}
            className="relative flex p-1 transition hover:text-[#FFBC73]"
          >
            <FiShoppingBag size={22} />
            {cart.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#a56028] px-1 text-[10px] text-white">
                {cart.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {mobileMenu && (
        <div className="border-t border-[#581b3c] bg-[#3A001F] px-4 py-4 text-white shadow-xl lg:hidden">
          <div ref={searchDropdownRef}>{searchBox(true)}</div>
          <nav className="mt-5 grid gap-3 text-sm ">
            <Link to="/" onClick={() => setMobileMenu(false)}>
              Home
            </Link>
            <Link to="/shop?type=new" onClick={() => setMobileMenu(false)}>
              New Arrivals
            </Link>
            <Link to="/shop?type=bestseller" onClick={() => setMobileMenu(false)}>
              Bestsellers
            </Link>
            <div className="border-t border-[#f3dfe3] pt-3">
              <p className="mb-2 text-xs uppercase tracking-[1.5px] text-[#FFBC73]">
                Categories
              </p>
              <div className="grid grid-cols-2 gap-2 text-white/80">
                {categoryOptions.slice(0, 8).map((item) => (
                  <Link
                    key={item}
                    to={`/shop?category=${item}`}
                    onClick={() => setMobileMenu(false)}
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>
            <div className="border-t border-[#f3dfe3] pt-3">
              <p className="mb-2 text-xs uppercase tracking-[1.5px] text-[#FFBC73]">
                Info
              </p>
              <div className="grid gap-2 text-white/80">
                {infoLinks.map(([label, path]) => (
                  <Link
                    key={label}
                    to={path}
                    onClick={() => setMobileMenu(false)}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="border-t border-[#f3dfe3] pt-3">
              <p className="mb-2 text-xs uppercase tracking-[1.5px] text-[#FFBC73]">
                Our Policy
              </p>
              <div className="grid gap-2 text-white/80">
                {policyLinks.map(([label, path]) => (
                  <Link
                    key={label}
                    to={path}
                    onClick={() => setMobileMenu(false)}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>
      )}

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Logout?"
        message="Are you sure you want to Logout?"
        confirmText="Yes, logout"
        cancelText="Cancle"
        danger
        onConfirm={handleLogout}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </header>
  );
};

export default Navbar;
