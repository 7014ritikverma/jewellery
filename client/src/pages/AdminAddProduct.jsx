
// import { useEffect, useState, useRef } from "react";
// import axios from "axios";
// import ProductVariantEditor from "../components/ProductVariantEditor";

// const defaultMaterial = { metal: "Gold 22K", weight: "" };
// const maxProductImages = 10;

// const AdminAddProduct = (props) => {
//     const [form, setForm] = useState({
//         name: "",
//         price: "",
//         category: "",
//         subCategory: "",
//         inspiration: "",
//         design: "",
//         videoUrl: "",
//         quantity: "",
//         makingCharge: "",
//         materials: [defaultMaterial],
//         variantGroups: [],
//         variantCombinations: [],
//     });

//     const [images, setImages] = useState([]); // ✅ multiple images
//     const [preview, setPreview] = useState([]);
//     const [video, setVideo] = useState(null);
//     const [videoPreview, setVideoPreview] = useState("");
//     const [metalRates, setMetalRates] = useState([]);
//     const [globalMakingCharge, setGlobalMakingCharge] = useState(0);
//     const token = localStorage.getItem("adminToken");
//     const fileInputRef = useRef(null);

//     const handleAuthError = (err) => {
//         if (err.response?.status === 401 || err.response?.status === 403) {
//             localStorage.removeItem("adminToken");
//             window.location.href = "/admin-login";
//             return true;
//         }

//         return false;
//     };

//     const categoryData = {
//         Rings: ["Gold", "Diamond", "Silver"],
//         Necklace: ["Gold", "Pearl", "Silver"],
//         Bracelets: ["Silver", "Diamond", "Gold"],
//     };

//     useEffect(() => {
//         const fetchRates = async () => {
//             try {
//                 const res = await axios.get("/api/metals");
//                 setMetalRates(res.data || []);
//                 const settingRes = await axios.get("/api/metals/pricing-settings");
//                 setGlobalMakingCharge(Number(settingRes.data?.makingCharge || 0));
//             } catch (err) {
//                 console.log(err);
//             }
//         };

//         fetchRates();
//         const interval = setInterval(fetchRates, 60 * 1000);
//         return () => clearInterval(interval);
//     }, []);

//     const rateMap = metalRates.reduce((map, item) => {
//         if (item?.metal) map[item.metal] = Number(item.rate || 0);
//         return map;
//     }, {});

//     const validMaterials = form.materials.filter(
//         (item) => item?.metal && Number(item.weight) > 0
//     );

//     const missingMaterials = validMaterials.filter(
//         (item) => rateMap[item.metal] === undefined
//     );

//     const materialMetalValue = validMaterials.reduce((sum, item) => {
//         const rate = rateMap[item.metal] || 0;
//         return sum + Number(item.weight) * rate;
//     }, 0);
//     const appliedMakingCharge = form.makingCharge !== "" ? Number(form.makingCharge) || 0 : globalMakingCharge;
//     const computedMaterialPrice = materialMetalValue > 0 ? materialMetalValue + appliedMakingCharge : 0;
//     const getVariantPrice = (combo = {}) => {
//         const weight = Number(combo.weight) || 0;
//         const rate = Number(combo.rate) || Number(rateMap[combo.metal]) || 0;
//         const comboMakingCharge = combo.makingCharge !== undefined && combo.makingCharge !== ""
//             ? Number(combo.makingCharge) || 0
//             : globalMakingCharge;

//         if (combo.metal && weight > 0 && rate > 0) {
//             return weight * rate + comboMakingCharge;
//         }

//         return Number(combo.price) || 0;
//     };
//     const getVariantBasePrice = (combo = {}) => {
//         const weight = Number(combo.weight) || 0;
//         const rate = Number(combo.rate) || Number(rateMap[combo.metal]) || 0;

//         if (combo.metal && weight > 0 && rate > 0) {
//             return weight * rate;
//         }

//         return Number(combo.price) || 0;
//     };
//     const variantPrices = (form.variantCombinations || [])
//         .map(getVariantPrice)
//         .filter((price) => price > 0);
//     const lowestVariantPrice = variantPrices.length ? Math.min(...variantPrices) : 0;
//     const variantBasePrices = (form.variantCombinations || [])
//         .map(getVariantBasePrice)
//         .filter((price) => price > 0);
//     const lowestVariantBasePrice = variantBasePrices.length ? Math.min(...variantBasePrices) : 0;

//     const finalPrice = computedMaterialPrice > 0
//         ? computedMaterialPrice
//         : Number(form.price || 0) > 0
//             ? Number(form.price || 0) + appliedMakingCharge
//             : lowestVariantPrice;
//     const basePrice = materialMetalValue > 0
//         ? materialMetalValue
//         : Number(form.price || 0) || lowestVariantBasePrice;

//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         if (finalPrice <= 0) {
//             alert("Please enter a product price or valid material weights and rates.");
//             return;
//         }

//         if (missingMaterials.length) {
//             alert(`Missing rate for metal: ${missingMaterials.map((item) => item.metal).join(", ")}`);
//             return;
//         }

//         try {
//             const formData = new FormData();
//             images.forEach((file) => {
//                 formData.append("images", file); // ✅ ONLY THIS
//             });
//             if (video) {
//                 formData.append("video", video);
//             }

//             // 🔥 upload images
//             const uploadRes = await axios.post(
//                 "/api/upload",
//                 formData,
//                 {
//                     headers: {
//                         Authorization: `Bearer ${token}`,
//                     },
//                 }
//             );

//             const imageUrls = uploadRes.data.urls;
//             const uploadedVideoUrl = uploadRes.data.videoUrl || "";

//             const payload = {
//                 name: form.name,
//                 category: form.category,
//                 subCategory: form.subCategory,
//                 inspiration: form.inspiration,
//                 design: form.design
//                     ? form.design.split(",").map(i => i.trim()).filter(i => i)
//                     : [],
//                 images: imageUrls,
//                 videoUrl: uploadedVideoUrl,
//                 quantity: Number(form.quantity) || 0,
//                 makingCharge: form.makingCharge,
//                 price: basePrice,
//                 materials: validMaterials.map((item) => ({
//                     metal: item.metal.trim(),
//                     weight: Number(item.weight),
//                 })),
//                 variantGroups: form.variantGroups,
//                 variantCombinations: form.variantCombinations,
//             };

//             await axios.post(
//                 "/api/products",
//                 payload,
//                 {
//                     headers: {
//                         Authorization: `Bearer ${token}`,
//                     },
//                 }
//             );

//             alert("Product Added ✅");

//             // reset
//             setForm({ name: "", price: "", category: "", subCategory: "", inspiration: "", design: "", videoUrl: "", quantity: "", makingCharge: "", materials: [defaultMaterial], variantGroups: [], variantCombinations: [] });
//             setImages([]);
//             setPreview([]);
//             setVideo(null);
//             setVideoPreview("");

//             props?.onSuccess && props.onSuccess();

//         } catch (err) {
//             if (handleAuthError(err)) return;
//             console.log(err);
//             const message = err.response?.data?.error || err.response?.data?.message || err.response?.data || err.message;
//             alert(`Error: ${message}`);
//         }
//     };

//     return (
//         <div className="w-full">

//             <form
//                 onSubmit={handleSubmit}
//                 className="mx-auto w-full max-w-none space-y-5 rounded-2xl bg-[#FFBC73]/30 p-4 shadow-xl sm:p-6 xl:p-8"
//             >
//                 <h2 className="text-2xl font-bold text-center mb-4">
//                     Add New Product
//                 </h2>

//                 {/* Name */}
//                 <input
//                     value={form.name}
//                     placeholder="Product Name"
//                     required
//                     className="w-full border p-3 rounded-lg "
//                     onChange={(e) =>
//                         setForm({ ...form, name: e.target.value })
//                     }
//                 />

//                 {/* Price */}
//                 <div className="space-y-2">
//                     <label className="font-semibold">Material-based Pricing</label>
//                     {form.materials.map((material, index) => (
//                         <div key={index} className="grid grid-cols-1 gap-2 items-end mb-2 md:grid-cols-[1fr_1fr_auto]">
//                             <select
//                                 value={material.metal}
//                                 className="border p-3 rounded-lg"
//                                 onChange={(e) => {
//                                     const materials = [...form.materials];
//                                     materials[index] = {
//                                         ...materials[index],
//                                         metal: e.target.value,
//                                     };
//                                     setForm({ ...form, materials });
//                                 }}
//                             >
//                                 <option value="">Select metal</option>
//                                 {metalRates.map((item) => (
//                                     <option key={item._id || item.metal} value={item.metal}>
//                                         {item.metal}
//                                     </option>
//                                 ))}
//                             </select>
//                             <input
//                                 value={material.weight}
//                                 placeholder="Weight (g)"
//                                 type="number"
//                                 step="0.01"
//                                 min="0"
//                                 className="border p-3 rounded-lg"
//                                 onChange={(e) => {
//                                     const materials = [...form.materials];
//                                     materials[index] = {
//                                         ...materials[index],
//                                         weight: e.target.value,
//                                     };
//                                     setForm({ ...form, materials });
//                                 }}
//                             />
//                             <button
//                                 type="button"
//                                 onClick={() => {
//                                     const materials = form.materials.filter((_, idx) => idx !== index);
//                                     setForm({ ...form, materials: materials.length ? materials : [defaultMaterial] });
//                                 }}
//                                 className="bg-red-500 text-white px-3 py-2 rounded-lg"
//                             >
//                                 Remove
//                             </button>
//                         </div>
//                     ))}

//                     <button
//                         type="button"
//                         onClick={() => setForm({ ...form, materials: [...form.materials, defaultMaterial] })}
//                         className="bg-[#6b0f1a] text-white px-4 py-2 rounded-lg"
//                     >
//                         Add Material
//                     </button>

//                     <p className="text-sm text-gray-700 mt-2">
//                         Metal value: ₹{materialMetalValue.toLocaleString("en-IN")} | Making charge: ₹{Number(appliedMakingCharge || 0).toLocaleString("en-IN")} | Total: ₹{computedMaterialPrice.toLocaleString("en-IN")}
//                     </p>
//                     {missingMaterials.length > 0 && (
//                         <p className="text-sm text-red-600">
//                             Missing rate for: {missingMaterials.map((item) => item.metal).join(", ")}. Update metal rates in settings.
//                         </p>
//                     )}
//                     {Object.keys(rateMap).length > 0 && (
//                         <div className="flex flex-wrap gap-2 text-xs text-gray-700">
//                             {metalRates.map((item) => (
//                                 <span key={item._id || item.metal} className="border rounded-full px-3 py-1">
//                                     {item.metal}: ₹{Number(item.rate || 0).toLocaleString("en-IN")}/g
//                                 </span>
//                             ))}
//                         </div>
//                     )}
//                     <p className="text-sm text-gray-500">
//                         Enter only metal and weight. Rates refresh automatically from the saved live-rate table.
//                     </p>
//                 </div>

//                 <input
//                     value={form.price}
//                     placeholder="Manual Price (optional)"
//                     type="number"
//                     step="0.01"
//                     className="w-full border p-3 rounded-lg "
//                     onChange={(e) =>
//                         setForm({ ...form, price: e.target.value })
//                     }
//                 />

//                 <input
//                     value={form.makingCharge}
//                     placeholder={`Custom Making Charge (optional, default ₹${Number(globalMakingCharge || 0).toLocaleString("en-IN")})`}
//                     type="number"
//                     step="0.01"
//                     min="0"
//                     className="w-full border p-3 rounded-lg "
//                     onChange={(e) => setForm({ ...form, makingCharge: e.target.value })}
//                 />

//                 {/* Quantity */}
//                 <input
//                     value={form.quantity}
//                     placeholder="Product Quantity"
//                     type="number"
//                     min="0"
//                     required
//                     className="w-full border p-3 rounded-lg "
//                     onChange={(e) =>
//                         setForm({ ...form, quantity: e.target.value })
//                     }
//                 />

//                 <ProductVariantEditor
//                     value={form.variantGroups}
//                     combinations={form.variantCombinations}
//                     metalRates={metalRates}
//                     globalMakingCharge={globalMakingCharge}
//                     token={token}
//                     onAuthError={handleAuthError}
//                     onChange={(variantGroups) => setForm({ ...form, variantGroups })}
//                     onCombinationsChange={(variantCombinations) => setForm({ ...form, variantCombinations })}
//                 />

//                 {/* Category */}
//                 <input
//                     value={form.category}
//                     placeholder="Category"
//                     required
//                     className="w-full border p-3 rounded-lg "
//                     onChange={(e) =>
//                         setForm({ ...form, category: e.target.value })
//                     }
//                 />

//                 {/* SubCategory */}
//                 <input
//                     value={form.subCategory}
//                     placeholder="SubCategory"
//                     required
//                     className="w-full border p-3 rounded-lg "
//                     onChange={(e) =>
//                         setForm({ ...form, subCategory: e.target.value })
//                     }
//                 />

//                 {/* Image Upload */}
//                 <div className="border-2 border-dashed p-4 rounded-lg text-center ">
//                     <input
//                         ref={fileInputRef}
//                         type="file"
//                         multiple
//                         accept="image/jpeg,image/png,image/webp"
//                         required
//                         onChange={(e) => {
//                             const files = Array.from(e.target.files).reverse(); // 🔥 FIX
//                             if (files.length > maxProductImages) {
//                                 alert(`Please select up to ${maxProductImages} product images.`);
//                                 e.target.value = "";
//                                 setImages([]);
//                                 setPreview([]);
//                                 return;
//                             }

//                             setImages(files);


//                             // preview generate
//                             const previews = files.map((file) =>
//                                 URL.createObjectURL(file)
//                             );
//                             setPreview(previews);
//                         }}
//                     />
//                 </div>

//                 {/* Preview */}
//                 <div className="flex gap-2 flex-wrap">
//                     {preview.map((img, i) => (
//                         <div key={i} className="relative">
//                             <img src={img} className="h-20 w-20 rounded-lg" />

//                             {/* ❌ REMOVE BUTTON */}
//                             <button
//                                 type="button"
//                                 onClick={() => {
//                                     const newImages = [...images];
//                                     const newPreview = [...preview];

//                                     newImages.splice(i, 1);
//                                     newPreview.splice(i, 1);

//                                     setImages(newImages);
//                                     setPreview(newPreview);
//                                 }}
//                                 className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded"
//                             >
//                                 ✕
//                             </button>
//                         </div>
//                     ))}
//                 </div>

//                 <div className="border-2 border-dashed p-4 rounded-lg">
//                     <label className="mb-2 block font-semibold">Product Showcase Video (optional)</label>
//                     <input
//                         type="file"
//                         accept="video/mp4,video/webm,video/quicktime"
//                         onChange={(e) => {
//                             const file = e.target.files?.[0] || null;
//                             setVideo(file);
//                             setVideoPreview(file ? URL.createObjectURL(file) : "");
//                         }}
//                     />
//                 </div>

//                 {videoPreview && (
//                     <div className="relative">
//                         <video src={videoPreview} className="h-40 w-full rounded-lg bg-black object-cover" controls />
//                         <button
//                             type="button"
//                             onClick={() => {
//                                 setVideo(null);
//                                 setVideoPreview("");
//                             }}
//                             className="absolute right-2 top-2 rounded bg-red-500 px-2 py-1 text-xs text-white"
//                         >
//                             Remove
//                         </button>
//                     </div>
//                 )}

//                 <textarea
//                     placeholder="Inspiration Description"
//                     className="w-full border p-3 rounded-lg"
//                     required
//                     onChange={(e) =>
//                         setForm({ ...form, inspiration: e.target.value })
//                     }
//                 />

//                 <textarea
//                     placeholder="Design (comma separated)"
//                     className="w-full border p-3 rounded-lg"
//                     required
//                     onChange={(e) =>
//                         setForm({ ...form, design: e.target.value })
//                     }
//                 />


//                 {/* Button */}
//                 <button className="w-full bg-[#6b0f1a] text-white py-3 rounded-lg hover:scale-105 transition">
//                     Add Product
//                 </button>

//             </form>

//         </div>
//     );
// };

// export default AdminAddProduct;



import { useEffect, useState, useRef } from "react";
import axios from "axios";
import ProductVariantEditor from "../components/ProductVariantEditor";
import { useLocation, useNavigate } from "react-router-dom";

const defaultMaterial = { metal: "Gold 22K", weight: "" };
const maxProductImages = 10;

const AdminAddProduct = (props) => {
    const [form, setForm] = useState({
        name: "",
        price: "",
        category: "",
        subCategory: "",
        inspiration: "",
        design: "",
        videoUrl: "",
        quantity: "",
        makingCharge: "",
        isPublished: true,
        materials: [defaultMaterial],
        variantGroups: [],
        variantCombinations: [],
    });

    const [images, setImages] = useState([]); // ✅ multiple images
    const [preview, setPreview] = useState([]);
    const [video, setVideo] = useState(null);
    const [videoPreview, setVideoPreview] = useState("");
    const [metalRates, setMetalRates] = useState([]);
    const [globalMakingCharge, setGlobalMakingCharge] = useState(0);
    const token = localStorage.getItem("adminToken");
    const fileInputRef = useRef(null); const location = useLocation();
    const navigate = useNavigate();

    const productId = new URLSearchParams(location.search).get("id");

    const handleAuthError = (err) => {
        if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem("adminToken");
            window.location.href = "/admin-login";
            return true;
        }

        return false;
    };

    useEffect(() => {
        console.log("Product ID:", productId);
    }, [productId]);

    const categoryData = {
        Rings: ["Gold", "Diamond", "Silver"],
        Necklace: ["Gold", "Pearl", "Silver"],
        Bracelets: ["Silver", "Diamond", "Gold"],
    };

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const res = await axios.get("/api/metals");
                setMetalRates(res.data || []);
                const settingRes = await axios.get("/api/metals/pricing-settings");
                setGlobalMakingCharge(Number(settingRes.data?.makingCharge || 0));
            } catch (err) {
                console.log(err);
            }
        };

        fetchRates();
        const interval = setInterval(fetchRates, 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const rateMap = metalRates.reduce((map, item) => {
        if (item?.metal) map[item.metal] = Number(item.rate || 0);
        return map;
    }, {});

    const validMaterials = form.materials.filter(
        (item) => item?.metal && Number(item.weight) > 0
    );

    const missingMaterials = validMaterials.filter(
        (item) => rateMap[item.metal] === undefined
    );

    const materialMetalValue = validMaterials.reduce((sum, item) => {
        const rate = rateMap[item.metal] || 0;
        return sum + Number(item.weight) * rate;
    }, 0);
    const appliedMakingCharge = form.makingCharge !== "" ? Number(form.makingCharge) || 0 : globalMakingCharge;
    const computedMakingCharge = materialMetalValue > 0 ? (materialMetalValue * appliedMakingCharge) / 100 : 0;
    const computedMaterialPrice = materialMetalValue > 0 ? materialMetalValue + computedMakingCharge : 0;
    const getVariantPrice = (combo = {}) => {
        const weight = Number(combo.weight) || 0;
        const rate = Number(combo.rate) || Number(rateMap[combo.metal]) || 0;
        const comboMakingCharge = combo.makingCharge !== undefined && combo.makingCharge !== ""
            ? Number(combo.makingCharge) || 0
            : globalMakingCharge;

        if (combo.metal && weight > 0 && rate > 0) {
            const basePrice = weight * rate;
            return basePrice + (basePrice * comboMakingCharge) / 100;
        }

        const basePrice = Number(combo.price) || 0;
        return basePrice + (basePrice * comboMakingCharge) / 100;
    };
    const getVariantBasePrice = (combo = {}) => {
        const weight = Number(combo.weight) || 0;
        const rate = Number(combo.rate) || Number(rateMap[combo.metal]) || 0;

        if (combo.metal && weight > 0 && rate > 0) {
            return weight * rate;
        }

        return Number(combo.price) || 0;
    };
    const variantPrices = (form.variantCombinations || [])
        .map(getVariantPrice)
        .filter((price) => price > 0);
    const lowestVariantPrice = variantPrices.length ? Math.min(...variantPrices) : 0;
    const variantBasePrices = (form.variantCombinations || [])
        .map(getVariantBasePrice)
        .filter((price) => price > 0);
    const lowestVariantBasePrice = variantBasePrices.length ? Math.min(...variantBasePrices) : 0;

    const finalPrice = computedMaterialPrice > 0
        ? computedMaterialPrice
        : Number(form.price || 0) > 0
            ? Number(form.price || 0) + (Number(form.price || 0) * appliedMakingCharge) / 100
            : lowestVariantPrice;
    const basePrice = materialMetalValue > 0
        ? materialMetalValue
        : Number(form.price || 0) || lowestVariantBasePrice;
    const variantImageUrls = (form.variantCombinations || [])
        .flatMap((combo) => (
            Array.isArray(combo?.images) && combo.images.length
                ? combo.images
                : [combo?.image]
        ))
        .filter(Boolean)
        .filter((image, index, list) => list.indexOf(image) === index);
    const hasAnyProductImage = preview.length > 0 || variantImageUrls.length > 0;

    const handleSubmit = async (e, nextPublished = form.isPublished) => {
        e.preventDefault();

        if (finalPrice <= 0) {
            alert("Please enter a product price or valid material weights and rates.");
            return;
        }

        if (missingMaterials.length) {
            alert(`Missing rate for metal: ${missingMaterials.map((item) => item.metal).join(", ")}`);
            return;
        }

        try {
            // A variant/pair image can also be the product's main image when no
            // separate product gallery image was uploaded.
            let imageUrls = preview.length ? preview : variantImageUrls;
            let uploadedVideoUrl = videoPreview;

            if (images.length > 0 || video) {

                const formData = new FormData();

                images.forEach((file) => {
                    formData.append("images", file);
                });

                if (video) {
                    formData.append("video", video);
                }

                const uploadRes = await axios.post(
                    "/api/upload",
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const uploadedImages = uploadRes.data?.urls || [];
                imageUrls = uploadedImages.length ? uploadedImages : imageUrls;
                uploadedVideoUrl =
                    uploadRes.data.videoUrl || videoPreview;
            }

            const payload = {
                name: form.name,
                category: form.category,
                subCategory: form.subCategory,
                inspiration: form.inspiration,
                design: form.design
                    ? form.design.split(",").map(i => i.trim()).filter(i => i)
                    : [],
                images: imageUrls,
                videoUrl: uploadedVideoUrl,
                quantity: Number(form.quantity) || 0,
                makingCharge: form.makingCharge,
                price: basePrice,
                materials: validMaterials.map((item) => ({
                    metal: item.metal.trim(),
                    weight: Number(item.weight),
                })),
                variantGroups: form.variantGroups,
                variantCombinations: form.variantCombinations,
                isPublished: nextPublished,
            };

            if (productId) {

                await axios.put(
                    `/api/products/${productId}`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                alert(nextPublished ? "Product Published" : "Product Saved as Draft");
                navigate("/admin?tab=products");

            } else {

                await axios.post(
                    "/api/products",
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                alert(nextPublished ? "Product Added" : "Draft Saved");
            }

            // reset
            setForm({ name: "", price: "", category: "", subCategory: "", inspiration: "", design: "", videoUrl: "", quantity: "", makingCharge: "", isPublished: true, materials: [defaultMaterial], variantGroups: [], variantCombinations: [] });
            setImages([]);
            setPreview([]);
            setVideo(null);
            setVideoPreview("");

            props?.onSuccess && props.onSuccess();

        } catch (err) {
            if (handleAuthError(err)) return;
            console.log(err);
            const message = err.response?.data?.error || err.response?.data?.message || err.response?.data || err.message;
            alert(`Error: ${message}`);
        }
    };

    useEffect(() => {
        if (!productId) return;


        const fetchProduct = async () => {
            try {
                const res = await axios.get(
                    `/api/products/admin/${productId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const p = res.data;
                console.log("PRODUCT DATA", res.data);

                setForm({
                    name: p.name || "",
                    price: p.price || "",
                    category: p.category || "",
                    subCategory: p.subCategory || "",
                    inspiration: p.inspiration || "",
                    design: Array.isArray(p.design)
                        ? p.design.join(", ")
                        : "",
                    videoUrl: p.videoUrl || "",
                    quantity: p.quantity || "",
                    makingCharge: p.makingCharge || "",
                    isPublished: p.isPublished !== false,
                    materials: p.materials?.length
                        ? p.materials
                        : [defaultMaterial],
                    variantGroups: p.variantGroups || [],
                    variantCombinations:
                        p.variantCombinations || [],
                });

                setPreview(p.images || []);
                setVideoPreview(p.videoUrl || "");

            } catch (err) {
                console.log(err);
            }
        };

        fetchProduct();
    }, [productId]);

    return (
        <div className="admin-product-form w-full">

            <form
                onSubmit={handleSubmit}
                className="mx-auto w-full text-[#3A001F] max-w-none space-y-5 rounded-2xl p-4 shadow-xl sm:p-6 xl:p-8"
            >
                <h2 className="text-2xl font-bold text-center mb-4">
                    {productId ? "Edit Product" : "Add New Product"}
                </h2>

                <label className="flex items-center gap-3 rounded-lg border bg-white/70 p-3 text-sm font-semibold text-[#3A001F]">
                    <input
                        type="checkbox"
                        checked={form.isPublished}
                        onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                    />
                    Publish product publicly
                </label>

                {/* Name */}
                <input
                    value={form.name}
                    placeholder="Product Name"
                    required
                    className="w-full border p-3 outline-none rounded-lg "
                    onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                    }
                />

                {/* Price */}
                <div className="space-y-2">
                    <label className="font-semibold">Material-based Pricing</label>
                    {form.materials.map((material, index) => (
                        <div key={index} className="grid grid-cols-1 gap-2 items-end mb-2 md:grid-cols-[1fr_1fr_auto]">
                            <select
                                value={material.metal}
                                className="border p-3 rounded-lg"
                                onChange={(e) => {
                                    const materials = [...form.materials];
                                    materials[index] = {
                                        ...materials[index],
                                        metal: e.target.value,
                                    };
                                    setForm({ ...form, materials });
                                }}
                            >
                                <option value="">Select metal</option>
                                {metalRates.map((item) => (
                                    <option key={item._id || item.metal} value={item.metal}>
                                        {item.metal}
                                    </option>
                                ))}
                            </select>
                            <input
                                value={material.weight}
                                placeholder="Weight (g)"
                                type="number"
                                step="0.01"
                                min="0"
                                className="border p-3 outline-none rounded-lg"
                                onChange={(e) => {
                                    const materials = [...form.materials];
                                    materials[index] = {
                                        ...materials[index],
                                        weight: e.target.value,
                                    };
                                    setForm({ ...form, materials });
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const materials = form.materials.filter((_, idx) => idx !== index);
                                    setForm({ ...form, materials: materials.length ? materials : [defaultMaterial] });
                                }}
                                className="bg-red-500 text-white px-3 py-2 rounded-lg"
                            >
                                Remove
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={() => setForm({ ...form, materials: [...form.materials, defaultMaterial] })}
                        className="bg-[#3A001F] text-white px-4 py-2 rounded-lg"
                    >
                        Add Metal
                    </button>

                    <p className="text-sm text-[#A56028] mt-2">
                        Metal value: ₹{materialMetalValue.toLocaleString("en-IN")} | Making charge: {Number(appliedMakingCharge || 0).toLocaleString("en-IN")}% (₹{computedMakingCharge.toLocaleString("en-IN")}) | Total: ₹{computedMaterialPrice.toLocaleString("en-IN")}
                    </p>
                    {missingMaterials.length > 0 && (
                        <p className="text-sm text-red-600">
                            Missing rate for: {missingMaterials.map((item) => item.metal).join(", ")}. Update metal rates in settings.
                        </p>
                    )}
                    {Object.keys(rateMap).length > 0 && (
                        <div className="flex flex-wrap gap-2 text-xs ">
                            {metalRates.map((item) => (
                                <span key={item._id || item.metal} className="border rounded-full px-3 py-1">
                                    {item.metal}: ₹{Number(item.rate || 0).toLocaleString("en-IN")}/g
                                </span>
                            ))}
                        </div>
                    )}
                    <p className="text-sm text-[#A56028]">
                        Enter only metal and weight. Rates refresh automatically from the saved live-rate table.
                    </p>
                </div>

                <input
                    value={form.price}
                    placeholder="Manual Price (optional)"
                    type="number"
                    step="0.01"
                    className="w-full border outline-none p-3 rounded-lg "
                    onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                    }
                />

                <input
                    value={form.makingCharge}
                    placeholder={`Custom Making Charge % (optional, default ${Number(globalMakingCharge || 0).toLocaleString("en-IN")}%)`}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full border outline-none p-3 rounded-lg "
                    onChange={(e) => setForm({ ...form, makingCharge: e.target.value })}
                />

                {/* Quantity */}
                <input
                    value={form.quantity}
                    placeholder="Product Quantity"
                    type="number"
                    min="0"
                    required
                    className="w-full border outline-none p-3 rounded-lg "
                    onChange={(e) =>
                        setForm({ ...form, quantity: e.target.value })
                    }
                />

                <ProductVariantEditor
                    value={form.variantGroups}
                    combinations={form.variantCombinations}
                    metalRates={metalRates}
                    globalMakingCharge={globalMakingCharge}
                    token={token}
                    onAuthError={handleAuthError}
                    onChange={(variantGroups) => setForm({ ...form, variantGroups })}
                    onCombinationsChange={(variantCombinations) => setForm({ ...form, variantCombinations })}
                />

                {/* Category */}
                <input
                    value={form.category}
                    placeholder="Category"
                    required
                    className="w-full border outline-none p-3 rounded-lg "
                    onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                    }
                />

                {/* SubCategory */}
                <input
                    value={form.subCategory}
                    placeholder="SubCategory"
                    required
                    className="w-full border outline-none p-3 rounded-lg "
                    onChange={(e) =>
                        setForm({ ...form, subCategory: e.target.value })
                    }
                />

                {/* Image Upload */}
                <div className="border-2 border-dashed p-4 rounded-lg text-center ">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        required={!productId && !hasAnyProductImage}
                        onChange={(e) => {
                            // Keep the selection order: the first image is the product cover.
                            const files = Array.from(e.target.files);
                            if (files.length > maxProductImages) {
                                alert(`Please select up to ${maxProductImages} product images.`);
                                e.target.value = "";
                                setImages([]);
                                setPreview([]);
                                return;
                            }

                            setImages(files);


                            // preview generate
                            const previews = files.map((file) =>
                                URL.createObjectURL(file)
                            );
                            setPreview(previews);
                        }}
                    />
                </div>

                <p className="-mt-3 text-xs text-gray-600">
                    Images are saved in the same order you select them. Image 1 is the cover image. Use the arrows to change the order.
                </p>

                {/* Preview */}
                <div className="flex flex-wrap gap-3">
                    {preview.map((img, i) => (
                        <div key={img} className="relative rounded-lg border bg-white p-1">
                            <span className="absolute left-1 top-1 z-10 rounded bg-[#3A001F] px-1.5 py-0.5 text-xs font-semibold text-white">
                                {i === 0 ? "Cover" : `Image ${i + 1}`}
                            </span>
                            <img src={img} alt={`Product preview ${i + 1}`} className="h-20 w-20 rounded-lg object-cover" />

                            <div className="mt-1 flex justify-center gap-1">
                                <button
                                    type="button"
                                    disabled={i === 0}
                                    aria-label={`Move image ${i + 1} earlier`}
                                    onClick={() => {
                                        const nextPreview = [...preview];
                                        [nextPreview[i - 1], nextPreview[i]] = [nextPreview[i], nextPreview[i - 1]];
                                        if (images.length === preview.length) {
                                            const nextImages = [...images];
                                            [nextImages[i - 1], nextImages[i]] = [nextImages[i], nextImages[i - 1]];
                                            setImages(nextImages);
                                        }
                                        setPreview(nextPreview);
                                    }}
                                    className="rounded border px-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    ←
                                </button>
                                <button
                                    type="button"
                                    disabled={i === preview.length - 1}
                                    aria-label={`Move image ${i + 1} later`}
                                    onClick={() => {
                                        const nextPreview = [...preview];
                                        [nextPreview[i], nextPreview[i + 1]] = [nextPreview[i + 1], nextPreview[i]];
                                        if (images.length === preview.length) {
                                            const nextImages = [...images];
                                            [nextImages[i], nextImages[i + 1]] = [nextImages[i + 1], nextImages[i]];
                                            setImages(nextImages);
                                        }
                                        setPreview(nextPreview);
                                    }}
                                    className="rounded border px-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-30"
                                >
                                    →
                                </button>
                            </div>

                            {/* ❌ REMOVE BUTTON */}
                            <button
                                type="button"
                                onClick={() => {
                                    const newImages = [...images];
                                    const newPreview = [...preview];

                                    newImages.splice(i, 1);
                                    newPreview.splice(i, 1);

                                    setImages(newImages);
                                    setPreview(newPreview);
                                }}
                                className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>

                <div className="border-2 border-dashed p-4 rounded-lg">
                    <label className="mb-2 block font-semibold">Product Showcase Video (optional)</label>
                    <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setVideo(file);
                            setVideoPreview(file ? URL.createObjectURL(file) : "");
                        }}
                    />
                </div>

                {videoPreview && (
                    <div className="relative">
                        <video src={videoPreview} className="h-40 w-full rounded-lg bg-black object-cover" controls />
                        <button
                            type="button"
                            onClick={() => {
                                setVideo(null);
                                setVideoPreview("");
                            }}
                            className="absolute right-2 top-2 rounded bg-red-500 px-2 py-1 text-xs text-white"
                        >
                            Remove
                        </button>
                    </div>
                )}

                <textarea
                    value={form.inspiration}
                    placeholder="Inspiration Description"
                    className="w-full border outline-none p-3 rounded-lg"
                    required
                    onChange={(e) =>
                        setForm({ ...form, inspiration: e.target.value })
                    }
                />

                <textarea
                    value={form.design}
                    placeholder="Design (comma separated)"
                    className="w-full border outline-none p-3 rounded-lg"
                    required
                    onChange={(e) =>
                        setForm({ ...form, design: e.target.value })
                    }
                />


                <div className="flex gap-3 mt-4">

                    <button
                        type="submit"
                        className="bg-green-600 text-white px-6 py-2 rounded-lg"
                    >
                        {productId ? "Update Product" : "Add Product"}
                    </button>

                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e, false)}
                        className="bg-[#A56028] text-white px-6 py-2 rounded-lg"
                    >
                        Save Draft
                    </button>

                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e, true)}
                        className="bg-[#3A001F] text-white px-6 py-2 rounded-lg"
                    >
                        Publish
                    </button>

                    {productId && (
                        <button
                            type="button"
                            onClick={() => navigate("/admin")}
                            className="bg-gray-500 text-white px-6 py-2 rounded-lg"
                        >
                            Cancel
                        </button>
                    )}

                </div>

            </form>

        </div>
    );
};

export default AdminAddProduct;

