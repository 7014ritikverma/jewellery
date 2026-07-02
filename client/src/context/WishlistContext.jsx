import { createContext, useEffect, useState } from "react";

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState([]);
    const [hydrated, setHydrated] = useState(false);

    const getWishlistKey = (productOrId) => {
        if (typeof productOrId === "string") return productOrId;
        return String(productOrId?.wishlistKey || productOrId?._wishlistKey || productOrId?._id || productOrId?.id || "");
    };

    // load from localStorage
    useEffect(() => {
        try {
            const data = JSON.parse(localStorage.getItem("wishlist")) || [];
            setWishlist(Array.isArray(data) ? data : []);
        } catch {
            setWishlist([]);
        } finally {
            setHydrated(true);
        }
    }, []);

    // save to localStorage
    useEffect(() => {
        if (!hydrated) return;
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
    }, [wishlist, hydrated]);

    // ADD / REMOVE (toggle)
    const toggleWishlist = (product) => {
        const wishlistKey = getWishlistKey(product);
        const exists = wishlist.find((item) => getWishlistKey(item) === wishlistKey);

        if (exists) {
            setWishlist(wishlist.filter((item) => getWishlistKey(item) !== wishlistKey));
        } else {
            setWishlist([...wishlist, { ...product, wishlistKey }]);
        }
    };

    const removeFromWishlist = (id) => {
        const updated = wishlist.filter((item) => getWishlistKey(item) !== id && item._id !== id);
        setWishlist(updated);
    };

    // check
    const isInWishlist = (id) => {
        return wishlist.some((item) => getWishlistKey(item) === id || item._id === id);
    };

    return (
        <WishlistContext.Provider
            value={{
                wishlist,
                toggleWishlist,
                isInWishlist,
                removeFromWishlist
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
};
