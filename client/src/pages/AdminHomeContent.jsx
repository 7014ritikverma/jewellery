import { useEffect, useState } from "react";
import axios from "axios";

const createBlankLink = () => ({
  category: "",
  subCategory: "",
  search: "",
  path: "",
});

const createBlankHeroSlide = () => ({
  image: "",
  alt: "",
  link: createBlankLink(),
  isActive: true,
});

const createBlankBannerCard = () => ({
  title: "",
  eyebrow: "",
  text: "",
  cta: "Shop Now",
  image: "",
  link: createBlankLink(),
  tone: "from-[#fbe1e6] to-[#fff6f0]",
  dark: false,
  isActive: true,
});

const createBlankCategoryCard = () => ({
  name: "",
  image: "",
  category: "",
  subCategory: "",
  search: "",
  path: "",
  keywords: "",
  isActive: true,
});

const AdminHomeContent = () => {
  const [homeContent, setHomeContent] = useState({
    heroSlides: [createBlankHeroSlide()],
    categoryCards: [createBlankCategoryCard()],
    featuredProduct: "",
    bannerCards: [createBlankBannerCard()],
  });
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState("");

  const token = localStorage.getItem("adminToken");

  const handleAuthError = (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem("adminToken");
      window.location.href = "/admin-login";
      return true;
    }

    return false;
  };

  const normalizeHomeContent = (data = {}) => ({
    heroSlides: Array.isArray(data.heroSlides) && data.heroSlides.length
      ? data.heroSlides.map((slide) => ({
        ...createBlankHeroSlide(),
        ...slide,
        link: { ...createBlankLink(), ...(slide.link || {}) },
      }))
      : [createBlankHeroSlide()],
    categoryCards: Array.isArray(data.categoryCards) && data.categoryCards.length
      ? data.categoryCards.map((card) => ({
        ...createBlankCategoryCard(),
        ...card,
        keywords: Array.isArray(card.keywords) ? card.keywords.join(", ") : card.keywords || "",
      }))
      : [createBlankCategoryCard()],
    featuredProduct: data.featuredProduct?._id || data.featuredProduct || "",
    bannerCards: Array.isArray(data.bannerCards) && data.bannerCards.length
      ? data.bannerCards.map((card) => ({
        ...createBlankBannerCard(),
        ...card,
        link: { ...createBlankLink(), ...(card.link || {}) },
      }))
      : [createBlankBannerCard()],
  });

  const fetchHomeContent = async () => {
    try {
      const res = await axios.get("/api/home-content");
      setHomeContent(normalizeHomeContent(res.data));
    } catch (err) {
      console.log(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get("/api/products?page=1&limit=48");
      setProducts(Array.isArray(res.data) ? res.data : res.data?.products || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchHomeContent();
    fetchProducts();
  }, []);

  const updateArrayItem = (field, index, value) => {
    const next = [...(homeContent[field] || [])];
    next[index] = { ...next[index], ...value };
    setHomeContent({ ...homeContent, [field]: next });
  };

  const updateLink = (field, index, value) => {
    const next = [...(homeContent[field] || [])];
    next[index] = {
      ...next[index],
      link: {
        ...createBlankLink(),
        ...(next[index]?.link || {}),
        ...value,
      },
    };
    setHomeContent({ ...homeContent, [field]: next });
  };

  const removeArrayItem = (field, index, createBlankItem) => {
    if (!window.confirm("Do you really want to remove this item?")) return;

    const next = (homeContent[field] || []).filter((_, itemIndex) => itemIndex !== index);
    setHomeContent({ ...homeContent, [field]: next.length ? next : [createBlankItem()] });
  };

  const handleImageUpload = async (field, index, file) => {
    if (!file) return;

    try {
      setUploadingImage(`${field}-${index}`);
      const formData = new FormData();
      formData.append("images", file);

      const res = await axios.post("/api/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const image = res.data?.urls?.[0];
      if (image) updateArrayItem(field, index, { image });
    } catch (err) {
      if (handleAuthError(err)) return;
      console.log(err);
      alert("Image upload failed");
    } finally {
      setUploadingImage("");
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await axios.put(
        "/api/home-content",
        {
          heroSlides: (homeContent.heroSlides || []).filter((slide) => slide.image),
          categoryCards: (homeContent.categoryCards || []).filter((card) => card.name && card.image),
          featuredProduct: homeContent.featuredProduct || null,
          bannerCards: (homeContent.bannerCards || []).filter((card) => card.image),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Home content saved");
      fetchHomeContent();
    } catch (err) {
      if (handleAuthError(err)) return;
      console.log(err);
      alert(err.response?.data || "Home content save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto text-[#3A001F] max-w-5xl space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Home Content</h1>
        <p className="text-sm text-[#A56028]">
          Manage homepage hero banners, featured product and gift cards.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Crafted by Us</h2>
          <button
            type="button"
            onClick={() => setHomeContent({
              ...homeContent,
              categoryCards: [...(homeContent.categoryCards || []), createBlankCategoryCard()],
            })}
            className="rounded bg-blue-600 px-3 py-2 text-sm text-white"
          >
            Add Item
          </button>
        </div>

        {(homeContent.categoryCards || []).map((card, index) => (
          <div key={index} className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Item {index + 1}</h3>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={card.isActive !== false}
                  onChange={(e) => updateArrayItem("categoryCards", index, { isActive: e.target.checked })}
                />
                Active
              </label>
            </div>

            {card.image && (
              <img
                src={card.image}
                alt={card.name || "Crafted by Us item"}
                className="h-40 w-full rounded-lg object-cover"
              />
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={card.name || ""}
                placeholder="Display name"
                className="rounded-lg border p-2"
                onChange={(e) => updateArrayItem("categoryCards", index, { name: e.target.value })}
              />
              <input
                value={card.image || ""}
                placeholder="Image URL"
                className="rounded-lg border p-2"
                onChange={(e) => updateArrayItem("categoryCards", index, { image: e.target.value })}
              />
              <input
                value={card.category || ""}
                placeholder="Category"
                className="rounded-lg border p-2"
                onChange={(e) => updateArrayItem("categoryCards", index, { category: e.target.value })}
              />
              <input
                value={card.subCategory || ""}
                placeholder="Subcategory"
                className="rounded-lg border p-2"
                onChange={(e) => updateArrayItem("categoryCards", index, { subCategory: e.target.value })}
              />
              <input
                value={card.search || ""}
                placeholder="Search term"
                className="rounded-lg border p-2"
                onChange={(e) => updateArrayItem("categoryCards", index, { search: e.target.value })}
              />
              <input
                value={card.path || ""}
                placeholder="Custom path"
                className="rounded-lg border p-2"
                onChange={(e) => updateArrayItem("categoryCards", index, { path: e.target.value })}
              />
            </div>

            <input
              value={card.keywords || ""}
              placeholder="Matching keywords, comma separated"
              className="w-full rounded-lg border p-2"
              onChange={(e) => updateArrayItem("categoryCards", index, { keywords: e.target.value })}
            />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="w-full rounded-lg border p-2"
              onChange={(e) => handleImageUpload("categoryCards", index, e.target.files?.[0])}
            />
            {uploadingImage === `categoryCards-${index}` && (
              <p className="text-sm text-blue-600">Uploading image...</p>
            )}

            <button
              type="button"
              onClick={() => removeArrayItem("categoryCards", index, createBlankCategoryCard)}
              className="rounded bg-red-500 px-3 py-2 text-sm text-white"
            >
              Remove Item
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <label className="mb-2 block font-semibold">Featured Product</label>
        <select
          value={homeContent.featuredProduct}
          className="w-full rounded-lg border p-2"
          onChange={(e) => setHomeContent({ ...homeContent, featuredProduct: e.target.value })}
        >
          <option value="">Use latest product automatically</option>
          {products.map((product) => (
            <option key={product._id} value={product._id}>
              {product.name} ({product.category || "No category"})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Hero Slides</h2>
          <button
            type="button"
            onClick={() => setHomeContent({
              ...homeContent,
              heroSlides: [...(homeContent.heroSlides || []), createBlankHeroSlide()],
            })}
            className="rounded bg-blue-600 px-3 py-2 text-sm text-white"
          >
            Add Slide
          </button>
        </div>

        {(homeContent.heroSlides || []).map((slide, index) => (
          <div key={index} className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Slide {index + 1}</h3>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={slide.isActive !== false}
                  onChange={(e) => updateArrayItem("heroSlides", index, { isActive: e.target.checked })}
                />
                Active
              </label>
            </div>

            {slide.image && (
              <img
                src={slide.image}
                alt={slide.alt || "Hero slide"}
                className="h-40 w-full rounded-lg object-cover"
              />
            )}

            <input
              value={slide.image || ""}
              placeholder="Hero image URL"
              className="w-full rounded-lg border p-2"
              onChange={(e) => updateArrayItem("heroSlides", index, { image: e.target.value })}
            />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="w-full rounded-lg border p-2"
              onChange={(e) => handleImageUpload("heroSlides", index, e.target.files?.[0])}
            />
            {uploadingImage === `heroSlides-${index}` && (
              <p className="text-sm text-blue-600">Uploading image...</p>
            )}

            <input
              value={slide.alt || ""}
              placeholder="Image alt text"
              className="w-full rounded-lg border p-2"
              onChange={(e) => updateArrayItem("heroSlides", index, { alt: e.target.value })}
            />

            <div className="grid gap-3 md:grid-cols-4">
              <input
                value={slide.link?.category || ""}
                placeholder="Open category"
                className="rounded-lg border p-2"
                onChange={(e) => updateLink("heroSlides", index, { category: e.target.value })}
              />
              <input
                value={slide.link?.subCategory || ""}
                placeholder="Open subcategory"
                className="rounded-lg border p-2"
                onChange={(e) => updateLink("heroSlides", index, { subCategory: e.target.value })}
              />
              <input
                value={slide.link?.search || ""}
                placeholder="Open search"
                className="rounded-lg border p-2"
                onChange={(e) => updateLink("heroSlides", index, { search: e.target.value })}
              />
              <input
                value={slide.link?.path || ""}
                placeholder="Custom path"
                className="rounded-lg border p-2"
                onChange={(e) => updateLink("heroSlides", index, { path: e.target.value })}
              />
            </div>

            <button
              type="button"
              onClick={() => removeArrayItem("heroSlides", index, createBlankHeroSlide)}
              className="rounded bg-red-500 px-3 py-2 text-sm text-white"
            >
              Remove Slide
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Gift Cards</h2>
          <button
            type="button"
            onClick={() => setHomeContent({
              ...homeContent,
              bannerCards: [...(homeContent.bannerCards || []), createBlankBannerCard()],
            })}
            className="rounded bg-blue-600 px-3 py-2 text-sm text-white"
          >
            Add Card
          </button>
        </div>

        {(homeContent.bannerCards || []).map((card, index) => (
          <div key={index} className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Card {index + 1}</h3>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={card.isActive !== false}
                  onChange={(e) => updateArrayItem("bannerCards", index, { isActive: e.target.checked })}
                />
                Active
              </label>
            </div>

            {card.image && (
              <img
                src={card.image}
                alt={card.title || "Gift card"}
                className="h-40 w-full rounded-lg object-cover"
              />
            )}

            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={card.title || ""}
                placeholder="Title"
                className="rounded-lg border p-2"
                onChange={(e) => updateArrayItem("bannerCards", index, { title: e.target.value })}
              />
              <input
                value={card.eyebrow || ""}
                placeholder="Eyebrow"
                className="rounded-lg border p-2"
                onChange={(e) => updateArrayItem("bannerCards", index, { eyebrow: e.target.value })}
              />
              <input
                value={card.cta || ""}
                placeholder="Button text"
                className="rounded-lg border p-2"
                onChange={(e) => updateArrayItem("bannerCards", index, { cta: e.target.value })}
              />
              <label className="flex items-center gap-2 rounded-lg border p-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(card.dark)}
                  onChange={(e) => updateArrayItem("bannerCards", index, { dark: e.target.checked })}
                />
                Dark text overlay
              </label>
            </div>

            <textarea
              value={card.text || ""}
              placeholder="Short text"
              className="w-full rounded-lg border p-2"
              onChange={(e) => updateArrayItem("bannerCards", index, { text: e.target.value })}
            />

            <input
              value={card.image || ""}
              placeholder="Card image URL"
              className="w-full rounded-lg border p-2"
              onChange={(e) => updateArrayItem("bannerCards", index, { image: e.target.value })}
            />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="w-full rounded-lg border p-2"
              onChange={(e) => handleImageUpload("bannerCards", index, e.target.files?.[0])}
            />
            {uploadingImage === `bannerCards-${index}` && (
              <p className="text-sm text-blue-600">Uploading image...</p>
            )}

            <div className="grid gap-3 md:grid-cols-4">
              <input
                value={card.link?.category || ""}
                placeholder="Open category"
                className="rounded-lg border p-2"
                onChange={(e) => updateLink("bannerCards", index, { category: e.target.value })}
              />
              <input
                value={card.link?.subCategory || ""}
                placeholder="Open subcategory"
                className="rounded-lg border p-2"
                onChange={(e) => updateLink("bannerCards", index, { subCategory: e.target.value })}
              />
              <input
                value={card.link?.search || ""}
                placeholder="Open search"
                className="rounded-lg border p-2"
                onChange={(e) => updateLink("bannerCards", index, { search: e.target.value })}
              />
              <input
                value={card.link?.path || ""}
                placeholder="Custom path"
                className="rounded-lg border p-2"
                onChange={(e) => updateLink("bannerCards", index, { path: e.target.value })}
              />
            </div>

            <button
              type="button"
              onClick={() => removeArrayItem("bannerCards", index, createBlankBannerCard)}
              className="rounded bg-red-500 px-3 py-2 text-sm text-white"
            >
              Remove Card
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded bg-[#3A001F] px-4 py-2 text-white disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Home Content"}
      </button>
    </div>
  );
};

export default AdminHomeContent;
