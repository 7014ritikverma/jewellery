import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { CartContext } from "../context/CartContext";
import { WishlistContext } from "../context/WishlistContext";
import EmptyState from "../components/EmptyState";
import PageLoader from "../components/PageLoader";

const getDisplayPrice = (product) => {
  const variantPrices = (product.variantCombinations || [])
    .map((combo) => Number(combo?.price || 0))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (variantPrices.length) {
    return Math.min(...variantPrices);
  }

  return Number(product.price || 0);
};

const isInsidePriceRange = (product, minPrice, maxPrice) => {
  const price = getDisplayPrice(product);
  const min = Number(minPrice);
  const max = Number(maxPrice);

  if (!Number.isFinite(price) || price <= 0) return false;
  if (Number.isFinite(min) && min > 0 && price < min) return false;
  if (Number.isFinite(max) && max > 0 && price > max) return false;

  return true;
};

const Products = ({ homeView = false }) => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: homeView ? 12 : 16,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    rating: "0",
    metal: "",
  });
  const [metalRates, setMetalRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const { addToCart } = useContext(CartContext);
  const { toggleWishlist, isInWishlist } = useContext(WishlistContext);

  const query = new URLSearchParams(location.search);
  const category = query.get("category");
  const subCategory = query.get("subCategory");
  const type = query.get("type");
  const search = query.get("search");
  const minPriceQuery = query.get("minPrice");
  const maxPriceQuery = query.get("maxPrice");
  const pageSize = homeView ? 12 : 16;
  const activeType = homeView ? "new" : type;
  const priceFiltersSynced =
    homeView ||
    (
      filters.minPrice === (minPriceQuery || "") &&
      filters.maxPrice === (maxPriceQuery || "")
    );

  useEffect(() => {
    setPage(1);
  }, [category, subCategory, search, activeType, homeView, filters.minPrice, filters.maxPrice, filters.rating, filters.metal]);

  useEffect(() => {
    if (homeView) return;

    setFilters((current) =>
      current.minPrice === (minPriceQuery || "") &&
      current.maxPrice === (maxPriceQuery || "")
        ? current
        : {
            ...current,
            minPrice: minPriceQuery || "",
            maxPrice: maxPriceQuery || "",
          }
    );
  }, [homeView, minPriceQuery, maxPriceQuery]);

  useEffect(() => {
    if (homeView) return;

    axios
      .get("/api/metals")
      .then((res) => setMetalRates(res.data || []))
      .catch((err) => console.log(err));
  }, [homeView]);

  useEffect(() => {
    if (!priceFiltersSynced) return;

    const params = new URLSearchParams();

    if (activeType) {
      params.set("type", activeType);
    }

    if (category) {
      params.set("category", category);
    }

    if (subCategory) {
      params.set("subCategory", subCategory);
    }

    if (search) {
      params.set("search", search);
    }

    if (!homeView) {
      if (filters.minPrice) {
        params.set("minPrice", filters.minPrice);
      }

      if (filters.maxPrice) {
        params.set("maxPrice", filters.maxPrice);
      }

      if (filters.rating !== "0") {
        params.set("rating", filters.rating);
      }

      if (filters.metal) {
        params.set("metal", filters.metal);
      }
    }

    params.set("page", String(page));
    params.set("limit", String(pageSize));

    setLoading(true);
    axios
      .get(`/api/products?${params.toString()}`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.products || [];
        const hasLocalPriceFilter = !homeView && (filters.minPrice || filters.maxPrice);
        const filteredData =
          hasLocalPriceFilter
            ? data.filter((product) =>
                isInsidePriceRange(product, filters.minPrice, filters.maxPrice)
              )
            : data;
        const nextPagination =
          hasLocalPriceFilter && filteredData.length !== data.length
            ? {
                page,
                limit: pageSize,
                total: filteredData.length,
                totalPages: Math.max(1, Math.ceil(filteredData.length / pageSize)),
              }
            : res.data.pagination || {
                page,
                limit: pageSize,
                total: filteredData.length,
                totalPages: 1,
              };

        setProducts(filteredData);
        setPagination(nextPagination);
      })
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, [category, subCategory, search, activeType, page, pageSize, homeView, filters, priceFiltersSynced]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      rating: "0",
      metal: "",
    });
    navigate("/shop");
  };

  const goToPage = (nextPage) => {
    setPage(Math.min(Math.max(nextPage, 1), pagination.totalPages || 1));
  };

  const totalPages = pagination.totalPages || 1;
  const firstVisiblePage = Math.max(1, Math.min(page - 2, totalPages - 4));
  const visiblePageCount = Math.min(5, totalPages);
  const visiblePages = Array.from(
    { length: visiblePageCount },
    (_, index) => firstVisiblePage + index
  );
  const filterContent = (
    <>
      <div>
        <label className="mb-1 block text-sm font-semibold text-[#3A001F]">
          Min Price
        </label>
        <input
          type="number"
          min="0"
          step="100"
          value={filters.minPrice}
          placeholder="From"
          className="w-full rounded-md border border-[#3A001F]/20 p-2 text-sm outline-none focus:border-[#3A001F]"
          onChange={(e) => updateFilter("minPrice", e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-[#3A001F]">
          Max Price
        </label>
        <input
          type="number"
          min="0"
          step="100"
          value={filters.maxPrice}
          placeholder="Any price"
          className="w-full rounded-md border border-[#3A001F]/20 p-2 text-sm outline-none focus:border-[#3A001F]"
          onChange={(e) => updateFilter("maxPrice", e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-[#3A001F]">
          Rating
        </label>
        <select
          value={filters.rating}
          className="w-full rounded-md border border-[#3A001F]/20 p-2 text-sm outline-none focus:border-[#3A001F]"
          onChange={(e) => updateFilter("rating", e.target.value)}
        >
          <option value="0">All Ratings</option>
          <option value="4">4 Star+</option>
          <option value="3">3 Star+</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-[#3A001F]">
          Metal
        </label>
        <select
          value={filters.metal}
          className="w-full rounded-md border border-[#3A001F]/20 p-2 text-sm outline-none focus:border-[#3A001F]"
          onChange={(e) => updateFilter("metal", e.target.value)}
        >
          <option value="">All Metals</option>
          {metalRates.map((item) => (
            <option key={item._id || item.metal} value={item.metal}>
              {item.metal}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={clearFilters}
        className="min-h-10 rounded-md border border-[#d8c3b8] px-4 text-sm font-semibold text-[#3A001F] transition hover:border-[#3A001F]"
      >
        Clear
      </button>
    </>
  );

  return (
    <div className={homeView ? "" : "pt-[132px] lg:pt-[172px]"}>
      {!homeView && (
        <div className="mx-auto max-w-[1500px] px-4 pt-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-[#3A001F]/10 bg-white p-4 shadow-sm lg:hidden">
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-[#3A001F]">Filters</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {filterContent}
            </div>
          </div>
        </div>
      )}

      <div className={homeView ? "" : "mx-auto flex max-w-[1500px] gap-8 px-4 py-10 sm:px-6 lg:px-8"}>
        {!homeView && (
          <aside className="hidden w-60 shrink-0 self-start rounded-lg border border-[#3A001F]/10 bg-white p-4 shadow-sm lg:block">
            <p className="mb-4 text-sm font-bold uppercase tracking-wide text-[#3A001F]">Filters</p>
            <div className="space-y-4">
              {filterContent}
            </div>
          </aside>
        )}

        <div
          className={`grid w-full grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 ${
            homeView
              ? "mx-auto p-0 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
              : "md:grid-cols-4 xl:grid-cols-5"
          }`}
        >
        {loading ? (
          <div className="col-span-full">
            <PageLoader label="Loading products..." />
          </div>
        ) : products.length > 0 ? (
          products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              addToCart={addToCart}
              toggleWishlist={toggleWishlist}
              isInWishlist={isInWishlist}
              compact={homeView}
            />
          ))
        ) : (
          <EmptyState
            title="No products found"
            message="Try clearing filters or searching another category."
            action={
              !homeView && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-md bg-[#3A001F] px-5 py-2 text-sm font-semibold text-white"
                >
                  Clear filters
                </button>
              )
            }
          />
        )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mx-auto mt-8 flex max-w-[1500px] flex-wrap items-center justify-center gap-2 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="min-h-10 rounded-full border border-[#d8c3b8] px-4 text-sm font-semibold text-[#3A001F] transition hover:border-[#6b0f1a] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Previous
          </button>

          {visiblePages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => goToPage(pageNumber)}
              className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition ${
                pageNumber === page
                  ? "bg-[#3A001F] text-white"
                  : "border border-[#d8c3b8] text-[#3A001F] hover:border-[#3A001F]"
              }`}
            >
              {pageNumber}
            </button>
          ))}

          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="min-h-10 rounded-full border border-[#d8c3b8] px-4 text-sm font-semibold text-[#3A001F] transition hover:border-[#3A001F] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Products;
