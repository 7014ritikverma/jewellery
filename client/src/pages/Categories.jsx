import { useNavigate } from "react-router-dom";

const categories = [
    { name: "Rings", img: "https://images.unsplash.com/photo-1605100804763-247f67b3557e" },
    { name: "Necklace", img: "https://images.unsplash.com/photo-1617038220319-276d3cfab638" },
    { name: "Bracelets", img: "https://images.unsplash.com/photo-1689397136362-dce64e557fcc?q=80&w=580&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
];

const Categories = () => {
    const navigate = useNavigate();

    return (
        <div className="w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {categories.map((cat, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => navigate(`/shop?category=${cat.name}`)}
                        className="group relative h-[260px] overflow-hidden rounded-xl bg-[#f7eee8] text-left shadow-sm ring-1 ring-[#ead8cf] transition duration-500 hover:-translate-y-1 hover:shadow-2xl"
                    >
                        <img
                            src={cat.img}
                            alt={cat.name}
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-[#21070c]/80 via-[#6b0f1a]/20 to-transparent" />

                        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[3px] text-white/75">
                                Khushbu Collection
                            </p>

                            <div className="flex items-end justify-between gap-4">
                                <h3 className="font-serif text-3xl font-semibold text-white">
                                    {cat.name}
                                </h3>

                                <span className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[1px] text-[#6b0f1a]">
                                    Explore
                                </span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Categories;
