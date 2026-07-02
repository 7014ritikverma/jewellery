import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiAward,
  FiChevronDown,
  FiHeart,
  FiHelpCircle,
  FiMapPin,
  FiMenu,
  FiSearch,
  FiShield,
  FiShoppingBag,
  FiTruck,
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
  const [showSecondaryNav, setShowSecondaryNav] = useState(true);

  const userDropdownRef = useRef();
  const searchDropdownRef = useRef();
  const lastScrollYRef = useRef(0);

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
    const handleScroll = () => {
      const currentY = Math.max(window.scrollY, 0);
      const previousY = lastScrollYRef.current;

      if (currentY < 20 || currentY < previousY - 6) {
        setShowSecondaryNav(true);
      } else if (currentY > previousY + 6) {
        setShowSecondaryNav(false);
      }

      lastScrollYRef.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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
          className="w-full bg-transparent parkinsans text-sm outline-none placeholder:text-[#3A001F]"
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
    <header className="fixed left-0 top-0 z-50 w-full bg-white parkinsans shadow-[0_6px_24px_rgba(92,11,42,0.08)]">
      {/* <div className="bg-[#5c0b2a] text-white">
        <div className="mx-auto flex h-9 max-w-[1480px] items-center justify-between gap-4 px-4 text-[11px] font-medium sm:px-8">
          <div className="hidden items-center gap-8 lg:flex">
            <span className="inline-flex items-center gap-2">
              <FiTruck /> Free Shipping on Orders Above Rs1999
            </span>
            <span className="inline-flex items-center gap-2">
              <FiAward /> BIS Hallmarked Jewellery
            </span>
            <span className="inline-flex items-center gap-2">
              <FiShield /> 100% Secure Payment
            </span>
          </div>
          <span className="lg:hidden">BIS Hallmarked Jewellery</span>
          <div className="flex items-center gap-5">
            <Link to="/orders" className="hidden hover:text-[#ffd7df] sm:inline">
              Track Order
            </Link>
            <Link to="/contact" className="hidden items-center gap-1 hover:text-[#ffd7df] sm:inline-flex">
              <FiMapPin /> Store Locator
            </Link>
            <Link to="/faq" className="inline-flex items-center gap-1 hover:text-[#ffd7df]">
              <FiHelpCircle /> Help
            </Link>
          </div>
        </div>
      </div> */}

      <div className="mx-auto grid h-[76px] max-w-[1480px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 sm:px-8">
        <div className="flex items-center sm:gap-4 gap-8">
          <button
            type="button"
            onClick={() => setMobileMenu((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-[#3A001F] text-[#3A001F] lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenu ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>

          <Link to="/" className="shrink-0">
            <img src="Logo.png" alt="Khushbu Jewellers" className="h-8 sm:h-12 w-auto object-contain" />
          </Link>
        </div>

        <div className="hidden min-w-0 justify-center lg:flex">
          <div className="flex w-full max-w-[640px] items-center gap-4">
            <div className="group relative shrink-0">
              <button
                type="button"
                className="flex h-12 items-center gap-3 rounded-md bg-[#3A001F] px-5 text-sm tracking-wide text-white transition hover:bg-[#3A001F]/90"
              >
                <FiMenu />
                Categories
                <FiChevronDown className="transition group-hover:rotate-180" />
              </button>
              <div className="absolute left-0 top-full hidden w-50 rounded-lg border-2 border-[#581b3c] bg-[#3A001F] p-3 text-sm tracking-wide font-normal text-white/80   shadow-2xl group-hover:block">
                {categoryOptions.map((item) => (
                  <Link
                    key={item}
                    to={`/shop?category=${item}`}
                    className="block rounded-md px-3 py-2 hover:text-white hover:underline hover:bg-[#A56028]"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>

            <div className="min-w-0 flex-1">{searchBox()}</div>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-3 text-[#3A001F] sm:gap-5">
          <Link
            to="/wishlist"
            state={{ backgroundLocation: location }}
            className="relative flex flex-col items-center gap-1 text-[11px] font-semibold"
          >
            <FiHeart size={22} />
            <span className="hidden sm:block">Wishlist</span>
            {wishlist.length > 0 && (
              <span className="absolute right-1 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">
                {wishlist.length}
              </span>
            )}
          </Link>

          <div className="relative" ref={userDropdownRef}>
            <button
              type="button"
              onClick={() => setOpen((current) => !current)}
              className="flex flex-col items-center gap-1 text-[11px] font-semibold"
            >
              <FiUser size={22} />
              <span className="hidden sm:block">Account</span>
            </button>

            {open && (
              <div className="absolute right-0 mt-4 w-44 rounded-lg border-2 border-[#581b3c] bg-[#3A001F] p-3 text-sm font-normal text-white/80 shadow-2xl">
                {!userToken ? (
                  <Link to="/login" className="block rounded-md px-3 py-2 hover:bg-[#A56028]">
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
                      className="block w-full rounded-md px-3 py-2 text-left hover:text-white hover:bg-[#A56028]"
                    >
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/orders");
                        setOpen(false);
                      }}
                      className="block w-full rounded-md px-3 py-2 text-left hover:text-white hover:bg-[#A56028]"
                    >
                      Orders
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoutConfirmOpen(true)}
                      className="block w-full rounded-md px-3 py-2 text-left hover:font-semibold text-red-600 hover:bg-white"
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
            className="relative flex flex-col items-center gap-1 text-[11px] font-semibold"
          >
            <FiShoppingBag size={22} />
            <span className="hidden sm:block">Cart</span>
            {cart.length > 0 && (
              <span className="absolute -right-1 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">
                {cart.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      <nav
        className={`hidden overflow-hidden border-t border-[#f3dfe3] bg-[#A56028] transition-[max-height,opacity] duration-300 lg:block ${
          showSecondaryNav ? "max-h-10 opacity-100" : "max-h-0 border-transparent opacity-0"
        }`}
      >
        <div className="mx-auto flex h-10 max-w-[1480px] items-center justify-center gap-7 px-8 text-[14px] text-white">
          <Link to="/" className="transition hover:underline hover:text-[#FFBC73]">
            Home
          </Link>

          {/* <div className="group relative flex h-full items-center">
            <span className="inline-flex cursor-pointer items-center gap-1 transition hover:text-[#c18056]">
              Shop By Category
              <FiChevronDown className="text-sm transition group-hover:rotate-180" />
            </span>
            <div className="absolute left-0 top-full hidden w-52 rounded-lg border border-[#efd6da] bg-white p-3 text-sm font-semibold text-[#5c0b2a] shadow-2xl group-hover:block">
              {categoryOptions.map((item) => (
                <Link
                  key={item}
                  to={`/shop?category=${item}`}
                  className="block rounded-md px-3 py-2 hover:bg-[#fdecef]"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div> */}

          <Link to="/shop?type=new" className="transition hover:underline hover:text-[#FFBC73]">
            New Arrival
          </Link>

          <Link to="/shop?type=bestseller" className="transition hover:underline hover:text-[#FFBC73]">
            Bestsellers
          </Link>

          <div className="group relative flex h-full items-center">
            <span className="inline-flex cursor-pointer items-center gap-1 transition hover:underline hover:text-[#FFBC73]">
              Info
              <FiChevronDown className="text-sm transition group-hover:rotate-180" />
            </span>
            <div className="absolute left-0 top-full hidden w-48 rounded-lg border-2 border-[#581b3c] bg-[#3A001F] p-3 text-sm  text-white/80 shadow-2xl group-hover:block">
              {infoLinks.map(([label, path]) => (
                <Link
                  key={label}
                  to={path}
                  className="block rounded-md px-3 py-2 hover:text-white hover:underline hover:bg-[#A56028]"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="group relative flex h-full items-center">
            <span className="inline-flex cursor-pointer items-center gap-1 transition hover:underline hover:text-[#FFBC73]">
              Our Policy
              <FiChevronDown className="text-sm transition group-hover:rotate-180" />
            </span>
            <div className="absolute left-0 top-full hidden w-56 rounded-lg border-2 border-[#581b3c] bg-[#3A001F] p-3 text-sm text-white/80 shadow-2xl group-hover:block">
              {policyLinks.map(([label, path]) => (
                <Link
                  key={label}
                  to={path}
                  className="block rounded-md px-3 py-2 hover:text-white hover:underline hover:bg-[#A56028]"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

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
