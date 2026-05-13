import { createContext, useEffect, useState } from "react";

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState([]);

    // load from localStorage
    useEffect(() => {
        const data = JSON.parse(localStorage.getItem("wishlist")) || [];
        setWishlist(data);
    }, []);

    // save to localStorage
    useEffect(() => {
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
    }, [wishlist]);

    // ADD / REMOVE (toggle)
    const toggleWishlist = (product) => {
        const exists = wishlist.find((item) => item._id === product._id);

        if (exists) {
            setWishlist(wishlist.filter((item) => item._id !== product._id));
        } else {
            setWishlist([...wishlist, product]);
        }
    };

    const removeFromWishlist = (id) => {
        const updated = wishlist.filter((item) => item._id !== id);
        setWishlist(updated);
    };

    // check
    const isInWishlist = (id) => {
        return wishlist.some((item) => item._id === id);
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