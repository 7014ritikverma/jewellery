import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAward,
  FiChevronLeft,
  FiChevronRight,
  FiGift,
  FiHeart,
  FiRefreshCw,
  FiShield,
  FiShoppingBag,
  FiTruck,
} from "react-icons/fi";
import {
  GiDiamondRing,
  GiEarrings,
  GiGemNecklace,
  GiLaurelsTrophy,
} from "react-icons/gi";

import ProductCard from "../components/ProductCard";
import { CartContext } from "../context/CartContext";
import { WishlistContext } from "../context/WishlistContext";
import { formatPrice } from "../utils/formatPrice";

const unwrapProducts = (payload) =>
  Array.isArray(payload) ? payload : payload?.products || [];

const getMaterialNames = (product) => Array.from(
  new Set(
    (product?.materials || [])
      .map((material) => String(material?.metal || "").trim())
      .filter(Boolean)
  )
);

const buildShopPath = (link = {}, fallback = "/shop") => {
  if (link.path) return link.path;

  const params = new URLSearchParams();
  if (link.category) params.set("category", link.category);
  if (link.subCategory) params.set("subCategory", link.subCategory);
  if (link.search) params.set("search", link.search);

  const query = params.toString();
  return query ? `/shop?${query}` : fallback;
};

const Home = () => {
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { toggleWishlist, isInWishlist } = useContext(WishlistContext);
  const [activeSlide, setActiveSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [youMayLike, setYouMayLike] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [homeContent, setHomeContent] = useState(null);
  const categorySliderRef = useRef(null);

  const defaultHeroSlides = useMemo(
    () => [
      {
        image:
          "https://khushbujewellers.com/cdn/shop/files/khushbu_banner_2100.900.webp?v=1779797281&width=1600",
        path: "/shop?category=Necklace",
      },
      {
        image:
          "https://khushbujewellers.com/cdn/shop/files/PEN_a5caf62d-acdc-4d23-8ce1-9b145c4b783a.webp?v=1778320574&width=1600",
        path: "/shop?type=new",
      },
      {
        image:
          "https://khushbujewellers.com/cdn/shop/files/MANGALSUTRA_5945f9b8-24db-4366-8b92-58d10dd14013.webp?v=1778320805&width=1600",
        path: "/shop?category=Diamond",
      },
    ],
    []
  );

  const heroSlides = useMemo(() => {
    const slides = Array.isArray(homeContent?.heroSlides)
      ? homeContent.heroSlides.filter((slide) => slide?.image && slide.isActive !== false)
      : [];

    return slides.length
      ? slides.map((slide) => ({
        image: slide.image,
        alt: slide.alt || "Khushbu jewellery collection",
        path: buildShopPath(slide.link),
      }))
      : defaultHeroSlides;
  }, [defaultHeroSlides, homeContent]);

  const defaultCategories = [
    {
      name: "All Sets",
      image:
        "https://images.unsplash.com/photo-1589128777073-263566ae5e4d?q=80&w=500&auto=format&fit=crop",
      path: "/shop",
    },
    {
      name: "Necklaces",
      keywords: ["necklace", "necklaces"],
      image:
        "https://images.unsplash.com/photo-1617038220319-276d3cfab638?q=80&w=500&auto=format&fit=crop",
      fallbackPath: "/shop?category=Necklace",
    },
    {
      name: "Rings",
      keywords: ["ring", "rings"],
      image:
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=500&auto=format&fit=crop",
      fallbackPath: "/shop?category=Rings",
    },
    {
      name: "Earrings",
      keywords: ["earring", "earrings", "stud", "studs"],
      image:
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=500&auto=format&fit=crop",
      fallbackPath: "/shop?search=Earrings",
    },
    {
      name: "Bracelets",
      keywords: ["bracelet", "bracelets"],
      image:
        "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=500&auto=format&fit=crop",
      fallbackPath: "/shop?category=Bracelets",
    },
    {
      name: "Mangalsutra",
      keywords: ["mangalsutra", "mangalsutras"],
      image:
        "https://images.unsplash.com/photo-1603974372039-adc49044b6bd?q=80&w=500&auto=format&fit=crop",
      fallbackPath: "/shop?search=Mangalsutra",
    },
    {
      name: "Pendants",
      keywords: ["pendant", "pendants"],
      image:
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=500&auto=format&fit=crop",
      fallbackPath: "/shop?search=Pendant",
    },
    {
      name: "Chains",
      keywords: ["chain", "chains"],
      image:
        "https://images.unsplash.com/photo-1617038220319-276d3cfab638?q=80&w=500&auto=format&fit=crop",
      fallbackPath: "/shop?search=Chain",
    },
    {
      name: "Payal",
      keywords: ["payal", "anklet", "anklets"],
      image:
        "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=500&auto=format&fit=crop&sat=-10",
      fallbackPath: "/shop?search=Payal",
    },
    {
      name: "Bangles",
      keywords: ["bangle", "bangles"],
      image:
        "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?q=80&w=500&auto=format&fit=crop",
      fallbackPath: "/shop?search=Bangle",
    },
    {
      name: "Evil Eye",
      keywords: ["evil eye", "evil eyes"],
      image:
        "https://plus.unsplash.com/premium_photo-1664114727358-5c1e70d8733f?q=80&w=500&auto=format&fit=crop",
      fallbackPath: "/shop?search=Evil%20Eye",
    },
  ];

  const categories = useMemo(() => {
    const cards = Array.isArray(homeContent?.categoryCards)
      ? homeContent.categoryCards.filter((card) => card?.name && card?.image && card.isActive !== false)
      : [];

    return cards.length
      ? cards.map((card) => ({
        name: card.name,
        image: card.image,
        category: card.category,
        subCategory: card.subCategory,
        keywords: Array.isArray(card.keywords) && card.keywords.length
          ? card.keywords
          : [card.name, card.category, card.subCategory, card.search].filter(Boolean),
        path: buildShopPath({
          path: card.path,
          category: card.category,
          subCategory: card.subCategory,
          search: card.search,
        }),
      }))
      : defaultCategories;
  }, [defaultCategories, homeContent]);

  const promiseCards = [
    {
      icon: FiAward,
      title: "BIS Hallmarked",
      text: "100% Certified Jewellery",
    },
    {
      icon: FiTruck,
      title: "Free Shipping",
      text: "On Orders Above Rs 1999",
    },
    {
      icon: FiRefreshCw,
      title: "Easy Returns",
      text: "Within 7 Days",
    },
    {
      icon: FiHeart,
      title: "Lifetime Exchange",
      text: "On All Jewellery",
    },
    {
      icon: FiShield,
      title: "Secure Payment",
      text: "100% Safe & Secure",
    },
  ];

  const priceRanges = [
    { label: "Under ₹ 999", icon: FiGift, max: 999 },
    { label: "₹ 999 - ₹ 2,999", icon: FiShoppingBag, min: 999, max: 2999 },
    { label: "₹ 2,999 - ₹ 4,999", icon: GiDiamondRing, min: 2999, max: 4999 },
    { label: "₹ 4,999 - ₹ 9 ,999", icon: GiGemNecklace, min: 4999, max: 9999 },
    { label: "₹ 9 ,999 - ₹19,999", icon: GiEarrings, min: 9999, max: 19999 },
    { label: "Above ₹ 19,999", icon: GiLaurelsTrophy, min: 19999 },
  ];

  const defaultBannerCards = [
    {
      title: "Gift Edit",
      eyebrow: "For Her, Him & Boys",
      text: "Rings, bracelets, chains and easy daily-wear picks.",
      cta: "Explore Gifts",
      image:
        "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?q=80&w=1000&auto=format&fit=crop",
      path: "/shop?search=Gift",
      tone: "from-[#fbe1e6] to-[#fff6f0]",
    },
    {
      title: "Men's Collection",
      eyebrow: "Timeless. Bold. You.",
      text: "Refined pieces in clean silhouettes",
      cta: "Shop Now",
      image:
        "https://images.unsplash.com/photo-1520367445093-50dc08a59d9d?q=80&w=1000&auto=format&fit=crop",
      path: "/shop?search=Men",
      tone: "from-[#20262f] to-[#7d858d]",
      dark: true,
    },
    {
      title: "Anniversary Collection",
      eyebrow: "Celebrate Love Forever",
      text: "Rings, necklaces and keepsake pieces for milestones.",
      cta: "Shop Now",
      image:
        "https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?q=80&w=1000&auto=format&fit=crop",
      path: "/shop?search=Anniversary",
      tone: "from-[#fee4e5] to-[#fff8f4]",
    },
  ];

  const bannerCards = useMemo(() => {
    const cards = Array.isArray(homeContent?.bannerCards)
      ? homeContent.bannerCards.filter((banner) => banner?.image && banner.isActive !== false)
      : [];

    return cards.length
      ? cards.map((banner) => ({
        title: banner.title || "Gift Edit",
        eyebrow: banner.eyebrow || "",
        text: banner.text || "",
        cta: banner.cta || "Shop Now",
        image: banner.image,
        path: buildShopPath(banner.link),
        tone: banner.tone || "from-[#fbe1e6] to-[#fff6f0]",
        dark: Boolean(banner.dark),
      }))
      : defaultBannerCards;
  }, [homeContent]);

  const scrollCategorySlider = (directionValue) => {
    const slider = categorySliderRef.current;

    if (!slider) return;

    const card = slider.querySelector("[data-category-card]");
    const gap = Number.parseFloat(getComputedStyle(slider).columnGap || "0");
    const width = card?.getBoundingClientRect().width || 106;
    slider.scrollBy({ left: directionValue * (width + gap) * 3, behavior: "smooth" });
  };

  const goToSlide = (index) => {
    setDirection(index > activeSlide ? 1 : -1);
    setActiveSlide((index + heroSlides.length) % heroSlides.length);
  };

  const nextSlide = () => {
    setDirection(1);
    setActiveSlide((current) => (current + 1) % heroSlides.length);
  };

  const previousSlide = () => {
    setDirection(-1);
    setActiveSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5200);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    const slider = categorySliderRef.current;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (!slider || reduceMotion || categories.length < 2) return undefined;

    const timer = setInterval(() => {
      const nearEnd = slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 12;

      if (nearEnd) {
        slider.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }

      scrollCategorySlider(1);
    }, 3200);

    return () => clearInterval(timer);
  }, [categories.length]);

  useEffect(() => {
    setActiveSlide((current) => Math.min(current, Math.max(heroSlides.length - 1, 0)));
  }, [heroSlides.length]);

  useEffect(() => {
    const loadRows = async () => {
      try {
        const [allRes, newRes, bestRes, homeRes] = await Promise.all([
          axios.get("/api/products?page=1&limit=12"),
          axios.get("/api/products?type=new&page=1&limit=12"),
          axios.get("/api/products?type=bestseller&page=1&limit=12"),
          axios.get("/api/home-content"),
        ]);

        setYouMayLike(unwrapProducts(allRes.data));
        setNewArrivals(unwrapProducts(newRes.data));
        setBestSellers(unwrapProducts(bestRes.data));
        setHomeContent(homeRes.data || null);
      } catch (err) {
        console.log(err);
      }
    };

    loadRows();
  }, []);

  const currentSlide = heroSlides[activeSlide] || heroSlides[0];
  const featuredProduct = homeContent?.featuredProduct || newArrivals[0] || youMayLike[0];
  const featuredMaterials = getMaterialNames(featuredProduct);
  const featuredMaterialText = featuredMaterials.length
    ? featuredMaterials.join(", ")
    : featuredProduct?.subCategory || "Material details";
  const allRowProducts = [...newArrivals, ...youMayLike, ...bestSellers];
  const hasFeaturedReviews =
    Number(featuredProduct?.avgRating || 0) > 0 ||
    Number(featuredProduct?.reviewCount || featuredProduct?.reviews?.length || 0) > 0;

  const buildPricePath = (range) => {
    const params = new URLSearchParams();

    if (range.min !== undefined) params.set("minPrice", String(range.min));
    if (range.max !== undefined) params.set("maxPrice", String(range.max));

    return `/shop?${params.toString()}`;
  };

  const resolveCategoryPath = (category) => {
    if (category.path) return category.path;

    const keywords = category.keywords || [category.name];
    const exactMatch = allRowProducts.find((product) =>
      keywords.some((keyword) => {
        const value = keyword.toLowerCase();
        return (
          product.category?.toLowerCase() === value ||
          product.subCategory?.toLowerCase() === value
        );
      })
    );

    if (
      exactMatch?.subCategory &&
      keywords.some((keyword) => exactMatch.subCategory?.toLowerCase() === keyword.toLowerCase())
    ) {
      return `/shop?subCategory=${encodeURIComponent(exactMatch.subCategory)}`;
    }

    if (exactMatch?.category) {
      return `/shop?category=${encodeURIComponent(exactMatch.category)}`;
    }

    const looseMatch = allRowProducts.find((product) =>
      keywords.some((keyword) => {
        const value = keyword.toLowerCase();
        return (
          product.category?.toLowerCase().includes(value) ||
          product.subCategory?.toLowerCase().includes(value) ||
          product.name?.toLowerCase().includes(value)
        );
      })
    );

    if (looseMatch) {
      return `/shop?search=${encodeURIComponent(category.name)}`;
    }

    return category.fallbackPath || "/shop";
  };

  const SectionTitle = ({ children, action }) => (
    <div className="relative mb-6 flex items-center justify-center px-4 sm:px-6">
      <div className="relative text-center">
        <h2 className="parkinsans text-xl text-[#4b0b24] sm:text-2xl">
          {children}
        </h2>
        <span className="mx-auto mt-2 block h-px w-44 bg-gradient-to-r from-transparent via-[#b98668] to-transparent" />
        <span className="mx-auto -mt-[5px] block h-2 w-2 rotate-45 border border-[#b98668] bg-white" />
      </div>
      {action && <div className="absolute right-6 hidden sm:block">{action}</div>}
    </div>
  );

  const ProductRow = ({ title, products, path }) => (
    <section className="relative mx-auto max-w-[1480px] px-4 py-8 sm:px-8">
      <SectionTitle
        action={
          <button
            type="button"
            onClick={() => navigate(path)}
            className="rounded-full border-1 border-[#581b3c] px-4 py-2 text-xs font-semibold text-[#3A001F] transition hover:bg-[#3A001F] hover:text-white"
          >
            View all
          </button>
        }
      >
        {title}
      </SectionTitle>
      <div className="relative">
        <button
          type="button"
          aria-label={`Scroll ${title} left`}
          className="absolute -left-2 top-[30%] z-10 hidden h-10 w-10 items-center justify-center rounded-full bg-white text-[#3A001F] shadow-lg ring-1 ring-[#581b3c] transition hover:bg-[#3A001F] hover:text-white md:flex"
          onClick={(event) => {
            const row = event.currentTarget.nextElementSibling;
            row?.scrollBy({ left: -760, behavior: "smooth" });
          }}
        >
          <FiChevronLeft />
        </button>
        <div className="flex gap-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map((product) => {
            const cardWishlistKey = `${title}:${product._id}`;

            return (
            <div key={`${title}-${product._id}`} className="w-[170px] shrink-0 sm:w-[196px] xl:w-[210px]">
              <ProductCard
                product={product}
                addToCart={addToCart}
                toggleWishlist={toggleWishlist}
                isInWishlist={isInWishlist}
                wishlistKey={cardWishlistKey}
                compact
              />
            </div>
          );
          })}
          {products.length === 0 && (
            <div className="w-full rounded-lg border border-[#581b3c] bg-white py-10 text-center text-sm text-[#3A001F]">
              Products loading...
            </div>
          )}
        </div>
        <button
          type="button"
          aria-label={`Scroll ${title} right`}
          className="absolute -right-2 top-[30%] z-10 hidden h-10 w-10 items-center justify-center rounded-full bg-white text-[#3A001F] shadow-lg ring-1 ring-[#581b3c] transition hover:bg-[#3A001F] hover:text-white md:flex"
          onClick={(event) => {
            const row = event.currentTarget.previousElementSibling;
            row?.scrollBy({ left: 760, behavior: "smooth" });
          }}
        >
          <FiChevronRight />
        </button>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen overflow-hidden bg-[#fffaf8] pt-[132px] text-[#3A001F] lg:pt-[117px]">
      <section className="relative">
        <div className="relative h-[380px] overflow-hidden sm:h-[430px] lg:h-[550px]">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={activeSlide}
              custom={direction}
              initial={{ x: direction * 80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -80, opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <button
                type="button"
                aria-label="Open hero collection"
                onClick={() => navigate(currentSlide.path)}
                className="h-full w-full"
              >
                <img
                  src={currentSlide.image}
                  alt={currentSlide.alt || "Khushbu jewellery collection"}
                  className="h-full w-full object-cover object-center"
                />
              </button>
            </motion.div>
          </AnimatePresence>

          <button
            type="button"
            aria-label="Previous slide"
            onClick={previousSlide}
            className="absolute left-5 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#3A001F] shadow-lg transition hover:bg-[#3A001F] hover:text-white md:flex"
          >
            <FiChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={nextSlide}
            className="absolute right-5 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#3A001F] shadow-lg transition hover:bg-[#3A001F] hover:text-white md:flex"
          >
            <FiChevronRight size={22} />
          </button>
        </div>

        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {heroSlides.map((slide, index) => (
            <button
              key={`${slide.image}-${index}`}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${index === activeSlide ? "w-7 bg-[#3A001F]" : "w-2 bg-white/60"
                }`}
            />
          ))}
        </div>
      </section>

      <section className="bg-white py-7 ">
        <SectionTitle>Handpicked for You, Crafted by Us</SectionTitle>
        <div className="relative mx-auto max-w-[1440px] px-4 sm:px-8 ">
          <button
            type="button"
            aria-label="Scroll categories left"
            onClick={() => scrollCategorySlider(-1)}
            className="absolute left-2 top-10 z-10 hidden h-9 w-9 items-center justify-center rounded-full bg-white hover:bg-[#3A001F] hover:text-white text-[#3A001F] shadow-md ring-1 ring-[#581b3c] md:flex"
          >
            <FiChevronLeft />
          </button>
          <div
            ref={categorySliderRef}
            className="flex gap-5 overflow-x-auto px-2 pb-1 [scrollbar-width:none] sm:gap-8 sm:px-8 [&::-webkit-scrollbar]:hidden"
          >
            {categories.map((category) => (
              <button
                key={category.name}
                data-category-card
                type="button"
                onClick={() => navigate(resolveCategoryPath(category))}
                className="group min-w-[96px] py-1 text-center sm:min-w-[140px]"
              >
                <span className="mx-auto flex h-[82px] w-[82px] items-center justify-center overflow-hidden rounded-full bg-[#fdecef] p-[6px] ring-1 ring-[#581b3c]  group-hover:shadow-lg sm:h-[130px] sm:w-[130px]">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-full w-full rounded-full object-cover transition duration-700 group-hover:scale-110"
                  />
                </span>
                <span className="mt-2 block flex items-center justify-center text-[12px] font-medium text-[#3A001F]">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Scroll categories right"
            onClick={() => scrollCategorySlider(1)}
            className="absolute right-2 top-10 z-10 hidden h-9 w-9 items-center justify-center rounded-full bg-white hover:bg-[#3A001F] hover:text-white text-[#3A001F] shadow-md ring-1 ring-[#581b3c] md:flex"
          >
            <FiChevronRight />
          </button>
        </div>
      </section>

      {featuredProduct && (
        <section className="mx-auto max-w-[1100px] px-4 py-5 my-10 sm:px-8">
          <div className="grid overflow-hidden rounded-lg bg-white shadow-[0_16px_40px_rgba(93,42,55,0.08)] md:grid-cols-[1.05fr_1fr]">
            <button
              type="button"
              onClick={() => navigate(`/product/${featuredProduct._id}`, { state: { product: featuredProduct } })}
              className="max-h-[500px] overflow-hidden rounded-lg bg-[#f9dfe2]"
            >
              <img
                src={featuredProduct.images?.[0]}
                alt={featuredProduct.name}
                className="h-full w-full object-cover  transition duration-700 hover:scale-105"
              />
            </button>
            <div className="relative flex flex-col justify-center px-7 py-8 sm:px-12">

              <span className=" text-[12px] flex justify-center items-center w-fit p-1 gap-1 px-2 flex rounded-full font-bold border border-[#581b3c] tracking-wide text-[#A56028]">
                <img className="h-5" src="fire.gif" alt="" />
                Tranding
              </span>
              <p className="my-3 text-[11px] font-bold uppercase tracking-[1.8px] text-[#A56028]">
                Featured Product
              </p>
              <h2 className=" text-xl font-semibold leading-tight text-[#3A001F] sm:text-2xl">
                {featuredProduct.name}
              </h2>
              {hasFeaturedReviews ? (
                <div className="mt-4 flex items-center gap-1 text-sm text-[#d99619]">
                  {"★".repeat(Math.round(Number(featuredProduct.avgRating || 0)))}
                  <span className="ml-2 text-xs font-medium text-[#A56028]">
                    ({featuredProduct.reviewCount || featuredProduct.reviews?.length || 0} Reviews)
                  </span>
                </div>
              ) : (
                <p className="mt-2 text-xs font-medium text-[#A56028]">
                  No reviews yet
                </p>
              )}
              <p className="mt-6 text-2xl font-extrabold text-[#3A001F]">
                ₹ {formatPrice(featuredProduct.price)}.00
              </p>
              {/* <p className="mt-1 text-xs text-[#A56028]">Inclusive of all taxes</p> */}
              <button
                type="button"
                onClick={() => navigate(`/product/${featuredProduct._id}`, { state: { product: featuredProduct } })}
                className="mt-6 w-fit rounded-md border-2 border-[#581b3c] px-6 py-3 text-sm font-bold text-[#3A001F] transition hover:bg-[#3A001F] hover:text-white"
              >
                Order Now
              </button>
              <div className="mt-8 grid gap-4 text-xs font-medium text-[#A56028] sm:grid-cols-3">
                <span className="inline-flex items-center gap-2">
                  <FiAward /> {featuredMaterialText}
                </span>
                <span className="inline-flex items-center gap-2">
                  <FiRefreshCw /> Easy Returns
                </span>
                <span className="inline-flex items-center gap-2">
                  <FiShield /> Secure Packaging
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="bg-white py-8">
        <SectionTitle>Shop By Price</SectionTitle>
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-5 px-4 sm:grid-cols-3 md:grid-cols-6">
          {priceRanges.map((range) => {
            const Icon = range.icon;
            return (
              <button
                key={range.label}
                type="button"
                onClick={() => navigate(buildPricePath(range))}
                className="group text-center"
              >
                <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fdecef] text-3xl text-[#A56028] ring-1 ring-[#581b3c] transition group-hover:-translate-y-1 group-hover:bg-[#3A001F] group-hover:text-[#FFBC73]">
                  <Icon />
                </span>
                <span className="mt-3 block text-xs font-semibold text-[#3A001F]">
                  {range.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <ProductRow title="You May Like" products={youMayLike} path="/shop" />
      <ProductRow title="Best Sellers" products={bestSellers} path="/shop?type=bestseller" />
      <ProductRow title="New Arrivals" products={newArrivals} path="/shop?type=new" />

      <section className="mx-auto grid max-w-[1320px] gap-6 px-4 py-7 sm:px-8 lg:grid-cols-3">
        {bannerCards.map((banner) => (
          <button
            key={banner.title}
            type="button"
            onClick={() => navigate(banner.path)}
            className={`group relative h-[220px] overflow-hidden rounded-lg bg-gradient-to-r ${banner.tone} text-left shadow-[0_14px_30px_rgba(92,11,42,0.08)]`}
          >
            <img
              src={banner.image}
              alt={banner.title}
              className="absolute inset-y-0 right-0 h-full w-[58%] object-cover transition duration-700 group-hover:scale-105"
            />
            <div className={`absolute inset-0 ${banner.dark ? "bg-gradient-to-r from-[#3A001F]/90 via-[#3A001F]/55 to-transparent" : "bg-gradient-to-r from-white/88 via-white/55 to-transparent"}`} />
            <div className={`relative z-10 flex h-full max-w-[58%] flex-col justify-center p-7 ${banner.dark ? "text-[#FFBC73]" : "text-[#4b0b24]"}`}>
              <p className="text-[11px] font-bold uppercase tracking-[1.4px]">
                {banner.eyebrow}
              </p>
              <h3 className="bodoni-moda text-white mt-1 text-3xl font-bold leading-tight">
                {banner.title}
              </h3>
              <p className="mt-2 text-xs font-medium text-white/90 opacity-80">{banner.text}</p>
              <span className="mt-5 w-fit rounded-md bg-[#5c0b2a] px-5 py-2 text-[10px] font-bold uppercase tracking-[1px] text-white">
                {banner.cta}
              </span>
            </div>
          </button>
        ))}
      </section>



      <section className="mx-auto max-w-[1320px] px-4 py-8 sm:px-8">
        <SectionTitle>The <span className="text-[#A56028] font-semibold">Shree Sarraf</span> Promise</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {promiseCards.map((promise) => {
            const Icon = promise.icon;
            return (
              <div
                key={promise.title}
                className="flex items-center gap-4 rounded-lg border border-[#581b3c] bg-white px-5 py-5 shadow-[0_12px_24px_rgba(92,11,42,0.05)]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fdecef] text-xl text-[#3A001F]">
                  <Icon />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#A56028]">{promise.title}</h3>
                  <p className="mt-1 text-xs text-[#7d5363]">{promise.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Home;
