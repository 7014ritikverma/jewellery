

import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { CartContext } from "../context/CartContext";
import { WishlistContext } from "../context/WishlistContext";

const Products = () => {
  const [products, setProducts] = useState([]);
  const location = useLocation();

  const { addToCart } = useContext(CartContext);
  const { toggleWishlist, isInWishlist } = useContext(WishlistContext);

  const query = new URLSearchParams(location.search);
  const category = query.get("category");
  const subCategory = query.get("subCategory");
  const type = query.get("type");


  // useEffect(() => {

  //   axios.get(`http://localhost:5000/api/products${location.search}`)
  //     .then(res => {
  //       let data = res.data;

  //       if (category) {
  //         data = data.filter(p => p.category === category);
  //       }

  //       if (subCategory) {
  //         data = data.filter(p => p.subCategory === subCategory);
  //       }

  //       setProducts(data);
  //     })
  //     .catch(err => console.log(err));
  // }, [category, subCategory]);

  useEffect(() => {

    let url = "http://localhost:5000/api/products";

    // 🔥 type query add
    if (type) {
      url += `?type=${type}`;
    }

    axios.get(url)
      .then(res => {

        let data = [...res.data];

        // CATEGORY FILTER
        if (category) {
          data = data.filter(
            p => p.category === category
          );
        }

        // SUBCATEGORY FILTER
        if (subCategory) {
          data = data.filter(
            p => p.subCategory === subCategory
          );
        }

        setProducts(data);

      })
      .catch(err => console.log(err));

  }, [category, subCategory, type]);

  return (
    <div className="p-10 mt-24 max-w-[95rem] mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">

      {products.length > 0 ? (
        products.map((p, i) => (
          <ProductCard
            key={i}
            product={p}
            addToCart={addToCart}
            toggleWishlist={toggleWishlist}
            isInWishlist={isInWishlist}
          />
        ))
      ) : (
        <h2>No Products Found ❌</h2>
      )}

    </div>
  );
};

export default Products;

