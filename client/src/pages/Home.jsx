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
  const reelsSliderRef = useRef(null);

  const defaultHeroSlides = useMemo(
    () => [
      {
        image:
          "https://khushbujewellers.com/cdn/shop/files/Luxury_Pendant_Collection.webp?v=1790053437&width=1600",
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
      {
        image:
          "https://khushbujewellers.com/cdn/shop/files/hero_banner_3.webp?v=1789971862&width=1600",
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

  const defaultMomentCards = [
    { title: "Everyday Shine", eyebrow: "Curated for you", text: "Light, lovely & made for every day", cta: "Discover daily wear", path: "/shop?type=new", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=85&w=1200&auto=format&fit=crop" },
    { title: "For Your Forever", eyebrow: "Curated for you", text: "Little symbols of a big promise", cta: "Explore rings", path: "/shop?search=Ring", image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=85&w=900&auto=format&fit=crop" },
    { title: "A Gift With Meaning", eyebrow: "Curated for you", text: "A beautiful surprise, chosen with love", cta: "Find a gift", path: "/shop?search=Gift", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=85&w=900&auto=format&fit=crop" },
  ];

  const momentCards = useMemo(() => {
    const cards = Array.isArray(homeContent?.bannerCards)
      ? homeContent.bannerCards.filter((card) => card?.image && card.isActive !== false)
      : [];
    const displayCards = cards.length ? cards : defaultMomentCards;
    const layoutClasses = ["md:col-span-2 md:row-span-2", "md:col-span-2", "md:col-span-2"];

    return displayCards.slice(0, 3).map((card, index) => ({
      title: card.title || "Jewellery for every moment",
      eyebrow: card.eyebrow || "Curated for you",
      text: card.text || "Discover a piece made to be remembered.",
      cta: card.cta || "Explore collection",
      image: card.image,
      path: card.path || buildShopPath(card.link),
      className: layoutClasses[index] || "md:col-span-2",
    }));
  }, [homeContent]);
  const videoReels = useMemo(() => (
    Array.isArray(homeContent?.videoReels)
      ? homeContent.videoReels.filter((reel) => reel?.videoUrl && reel.isActive !== false)
      : []
  ), [homeContent]);

  const scrollCategorySlider = (directionValue) => {
    const slider = categorySliderRef.current;

    if (!slider) return;

    const card = slider.querySelector("[data-category-card]");
    const gap = Number.parseFloat(getComputedStyle(slider).columnGap || "0");
    const width = card?.getBoundingClientRect().width || 106;
    slider.scrollBy({ left: directionValue * (width + gap) * 3, behavior: "smooth" });
  };

  const scrollReels = (directionValue) => {
    const slider = reelsSliderRef.current;
    if (!slider) return;

    const cards = Array.from(slider.querySelectorAll("[data-reel-card]"));
    if (!cards.length) return;

    const atStart = slider.scrollLeft <= 2;
    const atEnd = slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 2;
    if (directionValue > 0 && atEnd) {
      slider.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (directionValue < 0 && atStart) {
      slider.scrollTo({ left: slider.scrollWidth, behavior: "smooth" });
      return;
    }

    const currentIndex = cards.reduce((closestIndex, card, index) => (
      Math.abs(card.offsetLeft - slider.scrollLeft) < Math.abs(cards[closestIndex].offsetLeft - slider.scrollLeft)
        ? index
        : closestIndex
    ), 0);
    const nextIndex = (currentIndex + directionValue + cards.length) % cards.length;
    slider.scrollTo({ left: cards[nextIndex].offsetLeft, behavior: "smooth" });
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
    const slider = reelsSliderRef.current;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (!slider || reduceMotion || videoReels.length < 2) return undefined;

    const timer = setInterval(() => scrollReels(1), 4200);
    return () => clearInterval(timer);
  }, [videoReels.length]);

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
    <section className="relative mx-auto max-w-[1500px] px-4 py-8 sm:px-6 md:py-10 lg:px-8">
      <SectionTitle
        action={
          <button
            type="button"
            onClick={() => navigate(path)}
            className="rounded-full bodoni-moda border border-[#d9c2c9] px-4 py-2 text-xs font-semibold text-[#3A001F] transition hover:border-[#3A001F] hover:bg-[#3A001F] hover:text-white"
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
          className="absolute left-1 top-[30%] z-10 hidden h-10 w-10 items-center justify-center rounded-full bg-white text-[#3A001F] shadow-lg ring-1 ring-[#581b3c] transition hover:bg-[#3A001F] hover:text-white md:flex lg:left-2"
          onClick={(event) => {
            const row = event.currentTarget.nextElementSibling;
            row?.scrollBy({ left: -760, behavior: "smooth" });
          }}
        >
          <FiChevronLeft />
        </button>
        <div className="flex snap-x snap-mandatory bodoni-moda gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden">
          {products.map((product) => {
            const cardWishlistKey = `${title}:${product._id}`;

            return (
              <div key={`${title}-${product._id}`} className="w-[44vw] shrink-0 snap-start sm:w-[196px] xl:w-[210px]">
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
          className="absolute right-1 top-[30%] z-10 hidden h-10 w-10 items-center justify-center rounded-full bg-white text-[#3A001F] shadow-lg ring-1 ring-[#581b3c] transition hover:bg-[#3A001F] hover:text-white md:flex lg:right-2"
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
    <div className="min-h-screen overflow-x-hidden bg-[#fffaf8] pt-[90px] text-[#3A001F]">
      <section className="relative isolate w-full bg-[#f7eceb]">
        <div className="relative h-[clamp(220px,42.85vw,720px)] w-full overflow-hidden">
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
                className="block h-full w-full"
              >
                <img
                  src={currentSlide.image}
                  alt={currentSlide.alt || "Shree Sarraf jewellery collection"}
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

      <section className="bg-white py-6 sm:py-7">
        <SectionTitle>Handpicked for You, Crafted by Us</SectionTitle>
        <div className="relative mx-auto px-3 sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label="Scroll categories left"
            onClick={() => scrollCategorySlider(-1)}
            className="absolute left-2 top-16 z-10 hidden h-9 w-9 items-center justify-center rounded-full bg-white hover:bg-[#3A001F] hover:text-white text-[#3A001F] shadow-md ring-1 ring-[#581b3c] md:flex"
          >
            <FiChevronLeft />
          </button>
          <div
            ref={categorySliderRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:gap-4 sm:px-8 lg:gap-5 [&::-webkit-scrollbar]:hidden"
          >
            {categories.map((category) => (
              <button
                key={category.name}
                data-category-card
                type="button"
                onClick={() => navigate(resolveCategoryPath(category))}
                className="group min-w-[82px] snap-start py-1 text-center sm:min-w-[126px] lg:min-w-[140px]"
              >
                <span className="mx-auto flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-xl bg-[#fdecef] group-hover:shadow-lg sm:h-[112px] sm:w-[112px] lg:h-[130px] lg:w-[130px]">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-full w-full rounded-xl object-cover transition duration-700 group-hover:scale-110"
                  />
                </span>
                <span className="mt-2 parkinsans block flex items-center justify-center text-sm font-medium tracking-wide text-[#3A001F] sm:text-base">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Scroll categories right"
            onClick={() => scrollCategorySlider(1)}
            className="absolute right-2 top-16 z-10 hidden h-9 w-9 items-center justify-center rounded-full bg-white hover:bg-[#3A001F] hover:text-white text-[#3A001F] shadow-md ring-1 ring-[#581b3c] md:flex"
          >
            <FiChevronRight />
          </button>
        </div>
      </section>

      {/* {featuredProduct && (
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
      )} */}

      <section className="bg-[#fffdfc] py-10">
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
                <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fdecef] text-3xl text-[#A56028] transition group-hover:-translate-y-1 group-hover:bg-[#3A001F] group-hover:text-[#FFBC73]">
                  <Icon />
                </span>
                <span className="mt-3 block bodoni-moda text-sm font-semibold text-[#3A001F]">
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

      <section className="mx-auto max-w-[1320px] px-4 py-10 sm:px-8">
        <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:mb-8 sm:flex-row sm:items-end">
          <div>
            <p className="parkinsans text-xs font-bold uppercase tracking-[0.22em] text-[#A56028]">Made for your moments</p>
            <h2 className="bodoni-moda mt-2 text-3xl font-semibold text-[#3A001F] sm:text-4xl">Jewellery with a story</h2>
          </div>
          <button type="button" onClick={() => navigate("/shop")} className="parkinsans text-sm font-bold text-[#6b0f1a] underline decoration-[#d9a77c] decoration-2 underline-offset-4">View all jewellery</button>
        </div>
        <div className="grid gap-4 md:grid-cols-4 md:grid-rows-2 sm:gap-6">
          {momentCards.map((card) => (
            <button key={card.title} type="button" onClick={() => navigate(card.path)} className={`group relative min-h-[220px] overflow-hidden rounded-2xl text-left ${card.className}`}>
              <img src={card.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#260012]/90 via-[#3A001F]/28 to-transparent" />
              <div className="relative flex h-full min-h-[220px] flex-col justify-end p-6 sm:p-7">
                <p className="parkinsans text-[11px] font-bold uppercase tracking-[0.16em] text-[#ffd9aa]">{card.eyebrow}</p>
                <h3 className="bodoni-moda mt-2 text-3xl font-semibold leading-none text-white">{card.title}</h3>
                <p className="mt-2 max-w-sm text-sm text-white/85">{card.text}</p>
                <span className="mt-5 w-fit border-b border-[#ffd9aa] pb-1 parkinsans text-xs font-bold uppercase tracking-[0.1em] text-white">{card.cta}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-4 py-8 sm:px-8">
        <SectionTitle>The <span className="text-[#A56028] parkinsans font-bold">Shree Sarraf</span> Promise</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 bodoni-moda lg:grid-cols-5">
          {promiseCards.map((promise) => {
            const Icon = promise.icon;
            return (
              <div
                key={promise.title}
                className="flex items-center gap-4 rounded-lg bg-white px-5 py-5"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fdecef] text-xl text-[#3A001F]">
                  <Icon />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#A56028]">{promise.title}</h3>
                  <p className="mt-1 tracking-wide text-xs text-[#7d5363]">{promise.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {videoReels.length > 0 && (
        <section className="w-full bodoni-moda px-4 pb-10 pt-4 sm:px-8 lg:px-10 xl:px-12">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[1.8px] text-[#A56028]">Watch & shop</p>
              <h2 className="parkinsans text-2xl font-bold text-[#3A001F] sm:text-3xl">Reels</h2>
            </div>
            {videoReels.length > 1 && (
              <div className="flex gap-2">
                <button type="button" onClick={() => scrollReels(-1)} aria-label="Previous reels" className="rounded-full border border-[#581b3c] p-2 text-[#3A001F] transition hover:bg-[#3A001F] hover:text-white"><FiChevronLeft /></button>
                <button type="button" onClick={() => scrollReels(1)} aria-label="Next reels" className="rounded-full border border-[#581b3c] p-2 text-[#3A001F] transition hover:bg-[#3A001F] hover:text-white"><FiChevronRight /></button>
              </div>
            )}
          </div>
          <div ref={reelsSliderRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden">
            {videoReels.map((reel, index) => {
              const product = reel.product;
              const path = product?._id ? `/product/${product._id}` : buildShopPath(reel.link);
              return (
                <article data-reel-card key={`${reel.videoUrl}-${index}`} className="w-[72vw] max-w-[290px]  border border-[#3A001F] shrink-0 snap-start overflow-hidden rounded-xl bg-[#1f0711] shadow-[0_12px_28px_rgba(58,0,31,0.18)] sm:w-[235px] sm:max-w-none lg:w-[260px] xl:w-[280px]">
                  <video src={reel.videoUrl} autoPlay muted loop playsInline preload="metadata" className="aspect-[9/14] w-full bg-black object-cover" /> 
                  <div className="min-h-[106px] bg-[#ffffff] p-3 text-[#3A001F] sm:min-h-[110px]">
                    <h3 className="line-clamp-1 text-sm font-bold">{reel.title || product?.name || "Featured collection"}</h3>
                    {product?.price > 0 && <p className="mt-2 text-sm font-extrabold">₹ {formatPrice(product.price)}</p>}
                    <button type="button" onClick={() => navigate(path)} className="mt-2 w-full rounded-md bg-[#A56028] text-white px-3 py-2 text-xs font-bold transition hover:text-black hover:bg-gray-200">{product ? "SHOP NOW" : "EXPLORE"}</button>
                  </div>
                </article>
              );
            })}
          </div>
          {/* <p className="mt-1 text-xs text-[#7d5363]">Swipe to browse more videos.</p> */}
        </section>
      )}
    </div>
  );
};

export default Home;
