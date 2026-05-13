// 

import { useState } from "react";
import axios from "axios";
import { useRef } from "react";

const AdminAddProduct = (props) => {
    const [form, setForm] = useState({
        name: "",
        price: "",
        category: "",
        subCategory: "",
        inspiration: "",
        design: "",
    });

    const [images, setImages] = useState([]); // ✅ multiple images
    const [preview, setPreview] = useState([]);
    const token = localStorage.getItem("adminToken");
    const fileInputRef = useRef(null);

    const categoryData = {
        Rings: ["Gold", "Diamond", "Silver"],
        Necklace: ["Gold", "Pearl", "Silver"],
        Bracelets: ["Silver", "Diamond", "Gold"],
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData();

            // ✅ multiple images append
            // images.forEach((file, index) => {
            //     formData.append("images", file);
            // });

            images.forEach((file) => {
                formData.append("images", file); // ✅ ONLY THIS
            });

            // 🔥 upload images
            const uploadRes = await axios.post(
                "http://localhost:5000/api/upload",
                formData
            );

            const imageUrls = uploadRes.data.urls;


            // 🔥 save product
            await axios.post(
                "http://localhost:5000/api/products",
                {
                    ...form,
                    images: imageUrls,
                    design: form.design
                        ? form.design.split(",").map(i => i.trim()).filter(i => i)
                        : [],
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            alert("Product Added ✅");

            // reset
            setForm({ name: "", price: "", category: "", subCategory: "", inspiration: "", design: "" });
            setImages([]);
            setPreview([]);

            props?.onSuccess && props.onSuccess();

        } catch (err) {
            console.log(err);
            alert("Error ❌");
        }
    };

    return (
        <div className="flex justify-center items-center">

            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-xl space-y-4"
            >
                <h2 className="text-2xl font-bold text-center mb-4">
                    Add New Product
                </h2>

                {/* Name */}
                <input
                    value={form.name}
                    placeholder="Product Name"
                    required
                    className="w-full border p-3 rounded-lg "
                    onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                    }
                />

                {/* Price */}
                <input
                    value={form.price}
                    placeholder="Price"
                    required
                    className="w-full border p-3 rounded-lg "
                    onChange={(e) =>
                        setForm({ ...form, price: e.target.value })
                    }
                />

                {/* Category */}
                <select
                    value={form.category}
                    className="w-full border p-3 rounded-lg "
                    required
                    onChange={(e) =>
                        setForm({ ...form, category: e.target.value, subCategory: "" })
                    }
                >
                    <option value="">Select Category</option>
                    {Object.keys(categoryData).map((cat) => (
                        <option key={cat}>{cat}</option>
                    ))}
                </select>

                {/* SubCategory */}
                <select
                    value={form.subCategory}
                    className="w-full border p-3 rounded-lg required"
                    required
                    onChange={(e) =>
                        setForm({ ...form, subCategory: e.target.value })
                    }
                >
                    <option value="">Select SubCategory</option>
                    {categoryData[form.category]?.map((sub, i) => (
                        <option key={i}>{sub}</option>
                    ))}
                </select>

                {/* Image Upload */}
                <div className="border-2 border-dashed p-4 rounded-lg text-center ">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        required
                        onChange={(e) => {
                            const files = Array.from(e.target.files).reverse(); // 🔥 FIX
                            setImages(files);


                            // preview generate
                            const previews = files.map((file) =>
                                URL.createObjectURL(file)
                            );
                            setPreview(previews);
                        }}
                    />
                </div>

                {/* Preview */}
                <div className="flex gap-2 flex-wrap">
                    {preview.map((img, i) => (
                        <div key={i} className="relative">
                            <img src={img} className="h-20 w-20 rounded-lg" />

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

                <textarea
                    placeholder="Inspiration Description"
                    className="w-full border p-3 rounded-lg"
                    required
                    onChange={(e) =>
                        setForm({ ...form, inspiration: e.target.value })
                    }
                />

                <textarea
                    placeholder="Design (comma separated)"
                    className="w-full border p-3 rounded-lg"
                    required
                    onChange={(e) =>
                        setForm({ ...form, design: e.target.value })
                    }
                />


                {/* Button */}
                <button className="w-full bg-[#6b0f1a] text-white py-3 rounded-lg hover:scale-105 transition">
                    Add Product
                </button>

            </form>

        </div>
    );
};

export default AdminAddProduct;