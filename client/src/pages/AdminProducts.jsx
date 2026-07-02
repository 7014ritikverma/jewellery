// import { useEffect, useState } from "react";
// import axios from "axios";
// import ProductVariantEditor from "../components/ProductVariantEditor";

// const AdminProducts = () => {
//     const [products, setProducts] = useState([]);
//     const [editing, setEditing] = useState(null);
//     const [metalRates, setMetalRates] = useState([]);
//     const [globalMakingCharge, setGlobalMakingCharge] = useState(0);
//     const token = localStorage.getItem("adminToken");

//     const handleAuthError = (err) => {
//         if (err.response?.status === 401 || err.response?.status === 403) {
//             localStorage.removeItem("adminToken");
//             window.location.href = "/admin-login";
//             return true;
//         }

//         return false;
//     };

//     const rateMap = metalRates.reduce((map, item) => {
//         if (item?.metal) map[item.metal] = Number(item.rate || 0);
//         return map;
//     }, {});

//     const calculateMaterialsPrice = (materials = []) => {
//         const metalValue = (materials || []).reduce((sum, item) => {
//             if (!item || !item.metal || Number(item.weight) <= 0) {
//                 return sum;
//             }
//             const rate = rateMap[item.metal] || 0;
//             return sum + Number(item.weight) * rate;
//         }, 0);
//         const makingCharge = editing?.makingCharge !== undefined && editing?.makingCharge !== ""
//             ? Number(editing.makingCharge) || 0
//             : globalMakingCharge;

//         return metalValue > 0 ? metalValue + makingCharge : 0;
//     };

//     const calculateMaterialsBasePrice = (materials = []) => {
//         return (materials || []).reduce((sum, item) => {
//             if (!item || !item.metal || Number(item.weight) <= 0) {
//                 return sum;
//             }
//             const rate = rateMap[item.metal] || 0;
//             return sum + Number(item.weight) * rate;
//         }, 0);
//     };

//     const calculateVariantPrice = (combo = {}) => {
//         const weight = Number(combo.weight) || 0;
//         const rate = Number(combo.rate) || Number(rateMap[combo.metal]) || 0;
//         const makingCharge = combo.makingCharge !== undefined && combo.makingCharge !== ""
//             ? Number(combo.makingCharge) || 0
//             : globalMakingCharge;

//         if (combo.metal && weight > 0 && rate > 0) {
//             return weight * rate + makingCharge;
//         }

//         return Number(combo.price) || 0;
//     };

//     const calculateVariantBasePrice = (combo = {}) => {
//         const weight = Number(combo.weight) || 0;
//         const rate = Number(combo.rate) || Number(rateMap[combo.metal]) || 0;

//         if (combo.metal && weight > 0 && rate > 0) {
//             return weight * rate;
//         }

//         return Number(combo.price) || 0;
//     };

//     const fetchProducts = () => {
//         axios.get("/api/products?type=new")
//             .then(res => setProducts(res.data));
//     };

//     const fetchRates = () => {
//         axios.get("/api/metals")
//             .then(res => setMetalRates(res.data || []));
//         axios.get("/api/metals/pricing-settings")
//             .then(res => setGlobalMakingCharge(Number(res.data?.makingCharge || 0)))
//             .catch(err => console.log(err));
//     };

//     const prepareProductForEditing = (product) => {
//         const appliedMakingCharge = product.makingCharge !== undefined && product.makingCharge !== null
//             ? Number(product.makingCharge) || 0
//             : globalMakingCharge;

//         return {
//             ...product,
//             price: Math.max(0, Number(product.price || 0) - appliedMakingCharge),
//             variantCombinations: (product.variantCombinations || []).map((combo) => {
//                 const comboMakingCharge = combo.makingCharge !== undefined && combo.makingCharge !== null
//                     ? Number(combo.makingCharge) || 0
//                     : globalMakingCharge;
//                 const hasMaterialPricing = combo.metal && Number(combo.weight) > 0;

//                 return {
//                     ...combo,
//                     price: hasMaterialPricing
//                         ? combo.price
//                         : Math.max(0, Number(combo.price || 0) - comboMakingCharge),
//                 };
//             }),
//         };
//     };

//     const categoryData = {
//         Rings: ["Gold", "Diamond", "Silver"],
//         Necklace: ["Gold", "Pearl"],
//         Bracelets: ["Silver", "Diamond"],
//     };

//     useEffect(() => {
//         fetchProducts();
//         fetchRates();
//         const interval = setInterval(() => {
//             fetchProducts();
//             fetchRates();
//         }, 60 * 1000);
//         return () => clearInterval(interval);
//     }, []);

//     // DELETE
//     const deleteProduct = async (id) => {
//         if (!window.confirm("Delete this product?")) return;

//         try {
//             await axios.delete(
//                 `/api/products/${id}`,
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );

//             fetchProducts();
//         } catch (err) {
//             if (handleAuthError(err)) return;
//             console.log(err);
//             alert("Delete failed");
//         }
//     };

//     // UPDATE
//     const updateProduct = async () => {
//         try {
//             const validMaterials = (editing.materials || []).filter(
//                 (item) => item && item.metal && Number(item.weight) > 0
//             ).map((item) => ({
//                 metal: item.metal,
//                 weight: Number(item.weight),
//             }));
//             const variantPrices = (editing.variantCombinations || [])
//                 .map(calculateVariantBasePrice)
//                 .filter((price) => price > 0);
//             const lowestVariantPrice = variantPrices.length ? Math.min(...variantPrices) : 0;

//             const payload = {
//                 ...editing,
//                 materials: validMaterials,
//                 variantGroups: editing.variantGroups || [],
//                 variantCombinations: editing.variantCombinations || [],
//                 price: validMaterials.length
//                     ? calculateMaterialsBasePrice(validMaterials)
//                     : Number(editing.price) || lowestVariantPrice,
//             };

//             await axios.put(
//                 `/api/products/${editing._id}`,
//                 payload,
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );

//             alert("Updated ✅");
//             setEditing(null);
//             fetchProducts();

//         } catch (err) {
//             if (handleAuthError(err)) return;
//             console.log(err);
//             alert("Update failed ❌");
//         }
//     };

//     return (
//         <div>
//             <h2 className="text-2xl font-bold mb-6">Products</h2>

//             <div className="grid grid-cols-1 gap-6">

//                 {products.map(p => (
//                     <div
//                         key={p._id}
//                         className={editing?._id === p._id
//                             ? "fixed inset-0 z-50 overflow-y-auto bg-white p-4 shadow-2xl sm:inset-6 sm:rounded-xl sm:p-6"
//                             : "bg-[#FFBC73]/30 space-y-3 p-4 rounded-xl shadow"
//                         }
//                     >

//                         <img
//                             src={p.images?.[0]}
//                             className="h-40 w-full object-cover rounded-lg mb-3"
//                         />

//                         {editing?._id === p._id ? (
//                             <div className="space-y-2 ">

//                                 {/* NAME */}
//                                 <input
//                                     value={editing.name}
//                                     onChange={(e) =>
//                                         setEditing({ ...editing, name: e.target.value })
//                                     }
//                                     className="border rounded-lg flex-wrap w-full p-2 "
//                                 />

//                                         {/* PRICE */}
//                                 <input
//                                     value={editing.price}
//                                     onChange={(e) =>
//                                         setEditing({ ...editing, price: e.target.value })
//                                     }
//                                     className="border p-2 rounded-lg w-full"
//                                 />

//                                 <input
//                                     value={editing.makingCharge ?? ""}
//                                     type="number"
//                                     min="0"
//                                     step="0.01"
//                                     onChange={(e) =>
//                                         setEditing({ ...editing, makingCharge: e.target.value })
//                                     }
//                                     placeholder={`Custom Making Charge (default ₹${Number(globalMakingCharge || 0).toLocaleString("en-IN")})`}
//                                     className="border p-2 rounded-lg w-full"
//                                 />

//                                 {/* MATERIALS */}
//                                 <div className="space-y-2 pt-2">
//                                     <label className="font-semibold">Materials / Weights</label>
//                                     {(editing.materials || []).map((material, idx) => (
//                                         <div key={idx} className="grid grid-cols-1 gap-2 items-end md:grid-cols-[1fr_1fr_auto]">
//                                             <select
//                                                 value={material.metal || ""}
//                                                 className="border p-2 rounded-lg"
//                                                 onChange={(e) => {
//                                                     const materials = [...(editing.materials || [])];
//                                                     materials[idx] = { ...materials[idx], metal: e.target.value };
//                                                     setEditing({ ...editing, materials });
//                                                 }}
//                                             >
//                                                 <option value="">Select metal</option>
//                                                 {metalRates.map((item) => (
//                                                     <option key={item._id || item.metal} value={item.metal}>
//                                                         {item.metal}
//                                                     </option>
//                                                 ))}
//                                             </select>
//                                             <input
//                                                 value={material.weight || ""}
//                                                 placeholder="Weight"
//                                                 type="number"
//                                                 step="0.01"
//                                                 min="0"
//                                                 className="border p-2 rounded-lg"
//                                                 onChange={(e) => {
//                                                     const materials = [...(editing.materials || [])];
//                                                     materials[idx] = { ...materials[idx], weight: e.target.value };
//                                                     setEditing({ ...editing, materials });
//                                                 }}
//                                             />
//                                             <div className="flex gap-2 items-center">
//                                                 <span className="text-sm text-gray-700 py-2 px-3 border rounded-lg w-full">
//                                                     Rate: ₹{rateMap[material.metal] ? rateMap[material.metal].toLocaleString("en-IN") : "0"}
//                                                 </span>
//                                                 <button
//                                                     type="button"
//                                                     onClick={() => {
//                                                         const materials = (editing.materials || []).filter((_, index) => index !== idx);
//                                                         setEditing({ ...editing, materials });
//                                                     }}
//                                                     className="bg-red-500 text-white px-2 py-1 rounded"
//                                                 >
//                                                     ✕
//                                                 </button>
//                                             </div>
//                                         </div>
//                                     ))}
//                                     <button
//                                         type="button"
//                                         onClick={() => setEditing({
//                                             ...editing,
//                                             materials: [...(editing.materials || []), { metal: "Gold 22K", weight: "" }],
//                                         })}
//                                         className="bg-blue-500 text-white px-3 py-2 rounded"
//                                     >
//                                         Add Material
//                                     </button>
//                                     <p className="text-sm text-gray-700">
//                                         Computed material price: ₹{calculateMaterialsPrice(editing.materials || []).toLocaleString("en-IN")}
//                                     </p>
//                                 </div>

//                                 {/* QUANTITY */}
//                                 <input
//                                     value={editing.quantity || 0}
//                                     type="number"
//                                     min="0"
//                                     onChange={(e) =>
//                                         setEditing({ ...editing, quantity: Number(e.target.value) })
//                                     }
//                                     placeholder="Quantity"
//                                     className="border p-2 rounded-lg w-full"
//                                 />

//                                 <ProductVariantEditor
//                                     value={editing.variantGroups || []}
//                                     combinations={editing.variantCombinations || []}
//                                     metalRates={metalRates}
//                                     globalMakingCharge={globalMakingCharge}
//                                     token={token}
//                                     onAuthError={handleAuthError}
//                                     onChange={(variantGroups) => setEditing({ ...editing, variantGroups })}
//                                     onCombinationsChange={(variantCombinations) => setEditing({ ...editing, variantCombinations })}
//                                 />

//                                 {/* CATEGORY */}
//                                 <input
//                                     value={editing.category}
//                                     placeholder="Category"
//                                     onChange={(e) =>
//                                         setEditing({ ...editing, category: e.target.value })
//                                     }
//                                     className="border p-2 rounded-lg w-full"
//                                 />

//                                 {/* SUBCATEGORY */}
//                                 <input
//                                     value={editing.subCategory}
//                                     placeholder="SubCategory"
//                                     onChange={(e) =>
//                                         setEditing({ ...editing, subCategory: e.target.value })
//                                     }
//                                     className="border p-2 rounded-lg w-full"
//                                 />

//                                 <div className="space-y-2">
//                                     <label className="font-semibold">Product Showcase Video</label>
//                                     {editing.videoUrl ? (
//                                         <div className="relative">
//                                             <video
//                                                 src={editing.videoUrl}
//                                                 className="h-36 w-full rounded-lg bg-black object-cover"
//                                                 controls
//                                             />
//                                             <button
//                                                 type="button"
//                                                 onClick={() => setEditing({ ...editing, videoUrl: "" })}
//                                                 className="absolute right-2 top-2 rounded bg-red-500 px-2 py-1 text-xs text-white"
//                                             >
//                                                 Remove
//                                             </button>
//                                         </div>
//                                     ) : (
//                                         <p className="text-sm text-gray-500">No video added</p>
//                                     )}
//                                 </div>

//                                 {/* INSPIRATION */}
//                                 <textarea
//                                     value={editing.inspiration || ""}
//                                     onChange={(e) =>
//                                         setEditing({ ...editing, inspiration: e.target.value })
//                                     }
//                                     placeholder="Inspiration"
//                                     className="border p-2 rounded-lg w-full"
//                                 />

//                                 {/* DESIGN */}
//                                 <textarea
//                                     value={editing.design?.join(",")}
//                                     onChange={(e) =>
//                                         setEditing({
//                                             ...editing,
//                                             design: e.target.value.split(",").map(i => i.trim())
//                                         })
//                                     }
//                                     placeholder="Design"
//                                     className="border p-2 rounded-lg w-full"
//                                 />

//                                 {/* IMAGES PREVIEW */}
//                                 <div className="flex gap-2 flex-wrap">
//                                     {editing.images?.map((img, i) => (
//                                         <div key={i} className="relative">
//                                             <img src={img} className="h-16 w-16 rounded" />

//                                             <button
//                                                 onClick={() => {
//                                                     const newImgs = editing.images.filter((_, idx) => idx !== i);
//                                                     setEditing({ ...editing, images: newImgs });
//                                                 }}
//                                                 className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded"
//                                             >
//                                                 ✕
//                                             </button>
//                                         </div>
//                                     ))}
//                                 </div>

//                                 {/* ADD NEW IMAGES */}
//                                 <input
//                                     type="file"
//                                     multiple
//                                     onChange={async (e) => {
//                                         const files = Array.from(e.target.files);
//                                         const formData = new FormData();

//                                         files.forEach(f => formData.append("images", f));

//                                         try {
//                                             const res = await axios.post(
//                                                 "/api/upload",
//                                                 formData,
//                                                 {
//                                                     headers: {
//                                                         Authorization: `Bearer ${token}`,
//                                                     },
//                                                 }
//                                             );

//                                             setEditing({
//                                                 ...editing,
//                                                 images: [...editing.images, ...res.data.urls],
//                                             });
//                                         } catch (err) {
//                                             if (handleAuthError(err)) return;
//                                             console.log(err);
//                                             alert("Image upload failed");
//                                         }
//                                     }}
//                                 />

//                                 <input
//                                     type="file"
//                                     accept="video/mp4,video/webm,video/quicktime"
//                                     onChange={async (e) => {
//                                         const file = e.target.files?.[0];
//                                         if (!file) return;

//                                         const formData = new FormData();
//                                         formData.append("video", file);

//                                         try {
//                                             const res = await axios.post(
//                                                 "/api/upload",
//                                                 formData,
//                                                 {
//                                                     headers: {
//                                                         Authorization: `Bearer ${token}`,
//                                                     },
//                                                 }
//                                             );

//                                             setEditing({
//                                                 ...editing,
//                                                 videoUrl: res.data.videoUrl || "",
//                                             });
//                                         } catch (err) {
//                                             if (handleAuthError(err)) return;
//                                             console.log(err);
//                                             alert("Video upload failed");
//                                         }
//                                     }}
//                                 />

//                                 {/* BUTTONS */}
//                                 <div className="flex gap-2">
//                                     <button
//                                         onClick={updateProduct}
//                                         className="bg-green-500 text-white px-3 py-1 rounded"
//                                     >
//                                         Save
//                                     </button>

//                                     <button
//                                         onClick={() => setEditing(null)}
//                                         className="bg-gray-400 text-white px-3 py-1 rounded"
//                                     >
//                                         Cancel
//                                     </button>
//                                 </div>

//                             </div>
//                         ) : (
//                             <>
//                                 <h3 className="font-bold text-center">{p.name}</h3>
//                                 <p>₹{p.price}</p>
//                                 <p>Stock: {p.quantity || 0}</p>
//                                 <p>{p.category} / {p.subCategory}</p>
//                                 {p.videoUrl && (
//                                     <p className="text-sm text-green-700">Video added</p>
//                                 )}
//                                 {p.variantGroups?.length > 0 && (
//                                     <p className="text-sm text-[#6b0f1a]">
//                                         Options: {p.variantGroups.map((group) => group.name).join(", ")}
//                                     </p>
//                                 )}
//                                 {p.variantCombinations?.length > 0 && (
//                                     <p className="text-sm text-[#6b0f1a]">
//                                         Variant prices: {p.variantCombinations.length}
//                                     </p>
//                                 )}

//                                 <div className="flex gap-2 mt-3">
//                                     <button
//                                         onClick={() => setEditing(prepareProductForEditing(p))}
//                                         className="bg-blue-500 text-white px-3 py-1 rounded"
//                                     >
//                                         Edit
//                                     </button>

//                                     <button
//                                         onClick={() => deleteProduct(p._id)}
//                                         className="bg-red-500 text-white px-3 py-1 rounded"
//                                     >
//                                         Delete
//                                     </button>
//                                 </div>
//                             </>
//                         )}

//                     </div>
//                 ))}

//             </div>
//         </div>
//     );
// };

// export default AdminProducts;


import { useEffect, useState } from "react";
import axios from "axios";
import ProductVariantEditor from "../components/ProductVariantEditor";
import { useNavigate } from "react-router-dom";
import { formatPrice } from "../utils/formatPrice";


const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [editing, setEditing] = useState(null);
    const [metalRates, setMetalRates] = useState([]);
    const [globalMakingCharge, setGlobalMakingCharge] = useState(0);
    const token = localStorage.getItem("adminToken");
    const [search, setSearch] = useState("");
    const navigate = useNavigate();
    const [viewProduct, setViewProduct] = useState(null);


    const filteredProducts = products.filter(
        (p) =>
            p.name?.toLowerCase().includes(search.toLowerCase()) ||
            p.category?.toLowerCase().includes(search.toLowerCase())
    );

    const handleAuthError = (err) => {
        if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem("adminToken");
            window.location.href = "/admin-login";
            return true;
        }

        return false;
    };

    const rateMap = metalRates.reduce((map, item) => {
        if (item?.metal) map[item.metal] = Number(item.rate || 0);
        return map;
    }, {});

    const calculateMaterialsPrice = (materials = []) => {
        const metalValue = (materials || []).reduce((sum, item) => {
            if (!item || !item.metal || Number(item.weight) <= 0) {
                return sum;
            }
            const rate = rateMap[item.metal] || 0;
            return sum + Number(item.weight) * rate;
        }, 0);
        const makingCharge = editing?.makingCharge !== undefined && editing?.makingCharge !== ""
            ? Number(editing.makingCharge) || 0
            : globalMakingCharge;

        return metalValue > 0 ? metalValue + (metalValue * makingCharge) / 100 : 0;
    };

    const calculateMaterialsBasePrice = (materials = []) => {
        return (materials || []).reduce((sum, item) => {
            if (!item || !item.metal || Number(item.weight) <= 0) {
                return sum;
            }
            const rate = rateMap[item.metal] || 0;
            return sum + Number(item.weight) * rate;
        }, 0);
    };

    const calculateVariantPrice = (combo = {}) => {
        const weight = Number(combo.weight) || 0;
        const rate = Number(combo.rate) || Number(rateMap[combo.metal]) || 0;
        const makingCharge = combo.makingCharge !== undefined && combo.makingCharge !== ""
            ? Number(combo.makingCharge) || 0
            : globalMakingCharge;

        if (combo.metal && weight > 0 && rate > 0) {
            const basePrice = weight * rate;
            return basePrice + (basePrice * makingCharge) / 100;
        }

        const basePrice = Number(combo.price) || 0;
        return basePrice + (basePrice * makingCharge) / 100;
    };

    const calculateVariantBasePrice = (combo = {}) => {
        const weight = Number(combo.weight) || 0;
        const rate = Number(combo.rate) || Number(rateMap[combo.metal]) || 0;

        if (combo.metal && weight > 0 && rate > 0) {
            return weight * rate;
        }

        return Number(combo.price) || 0;
    };

    const fetchProducts = () => {
        axios.get("/api/products/admin/all?type=new", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => setProducts(res.data));
    };

    const fetchRates = () => {
        axios.get("/api/metals")
            .then(res => setMetalRates(res.data || []));
        axios.get("/api/metals/pricing-settings")
            .then(res => setGlobalMakingCharge(Number(res.data?.makingCharge || 0)))
            .catch(err => console.log(err));
    };

    const prepareProductForEditing = (product) => {
        const appliedMakingCharge = product.makingCharge !== undefined && product.makingCharge !== null
            ? Number(product.makingCharge) || 0
            : globalMakingCharge;
        const removeMakingCharge = (price, percent) => {
            const value = Number(price) || 0;
            const percentage = Number(percent) || 0;
            return percentage > 0 ? value / (1 + percentage / 100) : value;
        };

        return {
            ...product,
            price: Math.max(0, removeMakingCharge(product.price, appliedMakingCharge)),
            variantCombinations: (product.variantCombinations || []).map((combo) => {
                const comboMakingCharge = combo.makingCharge !== undefined && combo.makingCharge !== null
                    ? Number(combo.makingCharge) || 0
                    : globalMakingCharge;
                const hasMaterialPricing = combo.metal && Number(combo.weight) > 0;

                return {
                    ...combo,
                    price: hasMaterialPricing
                        ? combo.price
                        : Math.max(0, removeMakingCharge(combo.price, comboMakingCharge)),
                };
            }),
        };
    };

    const categoryData = {
        Rings: ["Gold", "Diamond", "Silver"],
        Necklace: ["Gold", "Pearl"],
        Bracelets: ["Silver", "Diamond"],
    };

    useEffect(() => {
        fetchProducts();
        fetchRates();
        const interval = setInterval(() => {
            fetchProducts();
            fetchRates();
        }, 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // const filteredProducts = products.filter((p) =>
    //     p.name?.toLowerCase().includes(search.toLowerCase()) ||
    //     p.category?.toLowerCase().includes(search.toLowerCase())
    // );

    // DELETE
    const deleteProduct = async (id) => {
        if (!window.confirm("Delete this product?")) return;

        try {
            await axios.delete(
                `/api/products/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            fetchProducts();
        } catch (err) {
            if (handleAuthError(err)) return;
            console.log(err);
            alert("Delete failed");
        }
    };

    // UPDATE
    const updateProduct = async () => {
        try {
            const validMaterials = (editing.materials || []).filter(
                (item) => item && item.metal && Number(item.weight) > 0
            ).map((item) => ({
                metal: item.metal,
                weight: Number(item.weight),
            }));
            const variantPrices = (editing.variantCombinations || [])
                .map(calculateVariantBasePrice)
                .filter((price) => price > 0);
            const lowestVariantPrice = variantPrices.length ? Math.min(...variantPrices) : 0;

            const payload = {
                ...editing,
                materials: validMaterials,
                variantGroups: editing.variantGroups || [],
                variantCombinations: editing.variantCombinations || [],
                price: validMaterials.length
                    ? calculateMaterialsBasePrice(validMaterials)
                    : Number(editing.price) || lowestVariantPrice,
            };

            await axios.put(
                `/api/products/${editing._id}`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("Updated ✅");
            setEditing(null);
            fetchProducts();

        } catch (err) {
            if (handleAuthError(err)) return;
            console.log(err);
            alert("Update failed ❌");
        }
    };

    return (
        <div className="p-6 text-[#3A001F]">

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">
                    Product Management
                </h1>

                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border border-[#3A001F] outline-none rounded-lg px-4 py-2 w-80"
                />
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">

                <table className="w-full">

                    <thead className="bg-slate-100">

                        <tr>
                            <th className="p-4 text-left">Product</th>
                            <th className="p-4 text-left">Category</th>
                            <th className="p-4 text-left">Price</th>
                            <th className="p-4 text-left">Stock</th>
                            <th className="p-4 text-left">Status</th>
                            <th className="p-4 text-left">Actions</th>
                        </tr>

                    </thead>

                    <tbody>

                        {filteredProducts.map((p) => (

                            <tr
                                key={p._id}
                                className="border-b hover:bg-slate-50"
                            >

                                <td className="p-4">

                                    <div className="flex items-center gap-3">

                                        <img
                                            src={p.images?.[0]}
                                            alt=""
                                            className="w-14 h-14 rounded-lg object-cover"
                                        />

                                        <div>

                                            <h4 className="font-semibold">
                                                {p.name}
                                            </h4>

                                            <p className="text-sm text-[#A56028]">
                                                {p.subCategory}
                                            </p>

                                        </div>

                                    </div>

                                </td>

                                <td className="p-4">
                                    {p.category}
                                </td>

                                <td className="p-4 font-semibold">
                                    ₹{formatPrice(p.price)}
                                </td>

                                <td className="p-4">
                                    {p.quantity || 0}
                                </td>

                                <td className="p-4">

                                    <span className={`${p.isPublished === false ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"} px-3 py-1 rounded-full text-sm`}>
                                        {p.isPublished === false ? "Draft" : "Published"}
                                    </span>

                                </td>

                                <td className="p-4">

                                    <div className="flex gap-2">

                                        <button
                                            onClick={() => setViewProduct(p)}
                                            className="bg-[#A56028] text-white px-3 py-1 rounded"
                                        >
                                            View
                                        </button>

                                        <button
                                            onClick={() =>
                                                navigate(`//admin/add-product?id=${p._id}`)
                                            }
                                            className="bg-[#3A001F] cursor-pointer text-white px-3 py-1 rounded"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            onClick={() =>
                                                deleteProduct(p._id)
                                            }
                                            className="bg-red-500 text-white px-3 py-1 rounded"
                                        >
                                            Delete
                                        </button>

                                    </div>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

            {editing && (
                <div className="fixed inset-0 text-[#3A001F] bg-black/50 z-50 flex items-center justify-center">

                    <div className="bg-white w-[95%] max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl p-6">

                        <h2 className="text-2xl font-bold mb-4">
                            Edit Product
                        </h2>

                        <input
                            value={editing.name}
                            onChange={(e) =>
                                setEditing({
                                    ...editing,
                                    name: e.target.value,
                                })
                            }
                            className="border p-2 rounded-lg w-full mb-3"
                        />

                        <button
                            onClick={updateProduct}
                            className="bg-green-500 text-white px-4 py-2 rounded"
                        >
                            Save
                        </button>

                        <button
                            onClick={() => setEditing(null)}
                            className="ml-2 bg-gray-500 text-white px-4 py-2 rounded"
                        >
                            Close
                        </button>

                    </div>

                </div>
            )}

            {viewProduct && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">

                    <div className="bg-white text-[#3A001F] rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6">

                        <div className="flex justify-between mb-6">
                            <h2 className="text-3xl font-bold">
                                Product Details
                            </h2>

                            <button
                                onClick={() => setViewProduct(null)}
                                className="text-red-500 text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Basic */}
                        <div className="grid md:grid-cols-2 gap-6">

                            <div>
                                <img
                                    src={viewProduct.images?.[0]}
                                    className="w-full h-80 object-cover rounded-lg"
                                />

                                <div className="flex gap-2 mt-3 flex-wrap">
                                    {viewProduct.images?.map((img, i) => (
                                        <img
                                            key={i}
                                            src={img}
                                            className="w-20 h-20 object-cover rounded"
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p><b>Name:</b> {viewProduct.name}</p>
                                <p><b>Category:</b> {viewProduct.category}</p>
                                <p><b>SubCategory:</b> {viewProduct.subCategory}</p>
                                <p><b>Stock:</b> {viewProduct.quantity}</p>
                                <p><b>Status:</b> {viewProduct.isPublished === false ? "Draft" : "Published"}</p>
                                <p><b>Base Price:</b> ₹{formatPrice(viewProduct.price)}</p>
                            </div>
                        </div>

                        {/* Materials */}
                        <div className="mt-8">
                            <h3 className="text-xl font-bold mb-3">
                                Materials
                            </h3>

                            {viewProduct.materials?.map((m, i) => (
                                <div key={i} className="border p-3 rounded mb-2">
                                    <p>Material: {m.metal}</p>
                                    <p>Purity: {m.purity}</p>
                                    <p>Weight: {m.weight}</p>
                                    <p>Rate: ₹{m.rate}</p>
                                </div>
                            ))}
                        </div>

                        {/* Variants */}
                        <div className="mt-8">
                            <h3 className="text-xl font-bold mb-3">
                                Variants
                            </h3>

                            {viewProduct.variantCombinations?.map((v, i) => {
                                console.log("VARIANT DATA =", v);

                                return (

                                    <div
                                        key={i}
                                        className="border rounded p-4 mb-3"
                                    >

                                        <p>
                                            <b>Variant:</b>{" "}
                                            {v.selections?.find(
                                                x => x.group === "Pair"
                                            )?.option || "N/A"}
                                        </p>

                                        <p>
                                            <b>Color:</b>{" "}
                                            {v.selections?.find(
                                                x => x.group === "Colors"
                                            )?.option || "N/A"}
                                        </p>

                                        <p><b>Material:</b> {v.metal}</p>
                                        <p><b>Stock:</b> {v.quantity}</p>
                                        <p><b>Price:</b> ₹{formatPrice(v.price)}</p>
                                        <p><b>Weight:</b> {v.weight}</p>
                                        <p><b>Rate:</b> ₹{v.rate}</p>
                                        <p><b>Making Charge:</b> {v.makingCharge ?? globalMakingCharge}%</p>

                                        <div className="flex gap-2 mt-2 flex-wrap">
                                            {v.images?.map((img, idx) => (
                                                <img
                                                    key={idx}
                                                    src={img}
                                                    className="w-16 h-16 rounded object-cover"
                                                />
                                            ))}

                                        </div>

                                    </div>

                                );
                            })}

                        </div>

                        {/* Description */}
                        <div className="mt-8 space-y-4">
                            <p><b>Inspiration:</b> {viewProduct.inspiration}</p>
                            <p><b>Design:</b> {viewProduct.design}</p>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminProducts;
