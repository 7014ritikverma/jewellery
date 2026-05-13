import { useEffect, useState } from "react";
import axios from "axios";

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [editing, setEditing] = useState(null);
    const token = localStorage.getItem("adminToken");

    const fetchProducts = () => {
        axios.get("http://localhost:5000/api/products")
            .then(res => setProducts(res.data));
    };

    const categoryData = {
        Rings: ["Gold", "Diamond", "Silver"],
        Necklace: ["Gold", "Pearl"],
        Bracelets: ["Silver", "Diamond"],
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // DELETE
    const deleteProduct = async (id) => {
        if (!window.confirm("Delete this product?")) return;

        await axios.delete(
            `http://localhost:5000/api/products/${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        fetchProducts();
    };

    // UPDATE
    const updateProduct = async () => {
        try {
            await axios.put(
                `http://localhost:5000/api/products/${editing._id}`,
                editing,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("Updated ✅");
            setEditing(null);
            fetchProducts();

        } catch (err) {
            console.log(err);
            alert("Update failed ❌");
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Products</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4  gap-6">

                {products.map(p => (
                    <div key={p._id} className="bg-white space-y-3 p-4 rounded-xl shadow">

                        <img
                            src={p.images?.[0]}
                            className="h-40 w-full object-cover rounded-lg mb-3"
                        />

                        {editing?._id === p._id ? (
                            <div className="space-y-2 ">

                                {/* NAME */}
                                <input
                                    value={editing.name}
                                    onChange={(e) =>
                                        setEditing({ ...editing, name: e.target.value })
                                    }
                                    className="border rounded-lg flex-wrap w-full p-2 "
                                />

                                {/* PRICE */}
                                <input
                                    value={editing.price}
                                    onChange={(e) =>
                                        setEditing({ ...editing, price: e.target.value })
                                    }
                                    className="border p-2 rounded-lg w-full"
                                />

                                {/* CATEGORY */}
                                <select
                                    value={editing.category}
                                    onChange={(e) =>
                                        setEditing({
                                            ...editing,
                                            category: e.target.value,
                                            subCategory: "" // reset subcategory
                                        })
                                    }
                                    className="border p-2 rounded-lg w-full"
                                >
                                    <option value="">Select Category</option>
                                    {Object.keys(categoryData).map((cat) => (
                                        <option key={cat}>{cat}</option>
                                    ))}
                                </select>

                                {/* SUBCATEGORY */}
                                <select
                                    value={editing.subCategory}
                                    onChange={(e) =>
                                        setEditing({ ...editing, subCategory: e.target.value })
                                    }
                                    className="border p-2 rounded-lg w-full"
                                >
                                    <option value="">Select SubCategory</option>

                                    {categoryData[editing.category]?.map((sub, i) => (
                                        <option key={i}>{sub}</option>
                                    ))}
                                </select>

                                {/* INSPIRATION */}
                                <textarea
                                    value={editing.inspiration || ""}
                                    onChange={(e) =>
                                        setEditing({ ...editing, inspiration: e.target.value })
                                    }
                                    placeholder="Inspiration"
                                    className="border p-2 rounded-lg w-full"
                                />

                                {/* DESIGN */}
                                <textarea
                                    value={editing.design?.join(",")}
                                    onChange={(e) =>
                                        setEditing({
                                            ...editing,
                                            design: e.target.value.split(",").map(i => i.trim())
                                        })
                                    }
                                    placeholder="Design"
                                    className="border p-2 rounded-lg w-full"
                                />

                                {/* IMAGES PREVIEW */}
                                <div className="flex gap-2 flex-wrap">
                                    {editing.images?.map((img, i) => (
                                        <div key={i} className="relative">
                                            <img src={img} className="h-16 w-16 rounded" />

                                            <button
                                                onClick={() => {
                                                    const newImgs = editing.images.filter((_, idx) => idx !== i);
                                                    setEditing({ ...editing, images: newImgs });
                                                }}
                                                className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* ADD NEW IMAGES */}
                                <input
                                    type="file"
                                    multiple
                                    onChange={async (e) => {
                                        const files = Array.from(e.target.files);
                                        const formData = new FormData();

                                        files.forEach(f => formData.append("images", f));

                                        const res = await axios.post(
                                            "http://localhost:5000/api/upload",
                                            formData
                                        );

                                        setEditing({
                                            ...editing,
                                            images: [...editing.images, ...res.data.urls],
                                        });
                                    }}
                                />

                                {/* BUTTONS */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={updateProduct}
                                        className="bg-green-500 text-white px-3 py-1 rounded"
                                    >
                                        Save
                                    </button>

                                    <button
                                        onClick={() => setEditing(null)}
                                        className="bg-gray-400 text-white px-3 py-1 rounded"
                                    >
                                        Cancel
                                    </button>
                                </div>

                            </div>
                        ) : (
                            <>
                                <h3 className="font-bold text-center">{p.name}</h3>
                                <p>₹{p.price}</p>
                                <p>{p.category} / {p.subCategory}</p>

                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={() => setEditing(p)}
                                        className="bg-blue-500 text-white px-3 py-1 rounded"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => deleteProduct(p._id)}
                                        className="bg-red-500 text-white px-3 py-1 rounded"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}

                    </div>
                ))}

            </div>
        </div>
    );
};

export default AdminProducts;