const categories = [
    { name: "Rings", img: "https://images.unsplash.com/photo-1605100804763-247f67b3557e" },
    { name: "Necklace", img: "https://images.unsplash.com/photo-1617038220319-276d3cfab638" },
    { name: "Bracelets", img: "https://images.unsplash.com/photo-1689397136362-dce64e557fcc?q=80&w=580&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
];

const Categories = () => {
    return (
        <div className="py-16 px-6">

            <h2 className="text-3xl font-bold text-center mb-10">Shop By Category</h2>

            <div className="grid md:grid-cols-3 gap-6">
                {categories.map((cat, i) => (
                    <div key={i} className="relative overflow-hidden rounded-xl group cursor-pointer">

                        <img src={cat.img} className="w-full h-80 object-cover group-hover:scale-110 transition duration-500" />

                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <h3 className="text-white text-2xl font-bold">{cat.name}</h3>
                        </div>

                    </div>
                ))}
            </div>

        </div>
    );
};

export default Categories;