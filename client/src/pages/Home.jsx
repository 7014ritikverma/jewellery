

// import { motion } from "framer-motion";
// import { useNavigate } from "react-router-dom";

// import Products from "./Products";
// import Categories from "./Categories";

// const Home = () => {

//   const navigate = useNavigate();

//   return (

//     <div className="mt-24 bg-[#f8f8f8] overflow-hidden">

//       {/* HERO SECTION */}
//       <section className="relative h-[92vh] w-full overflow-hidden">

//         {/* BACKGROUND IMAGE */}
//         {/* BACKGROUND IMAGE */}
//         <img
//           src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1600&auto=format&fit=crop" className="w-full h-full object-cover object-center"
//         />

//         {/* OVERLAY */}
//         <div className="absolute inset-0 bg-black/55 backdrop-brightness-75"></div>

//         {/* CONTENT */}
//         <div className="absolute inset-0 flex items-center justify-center">

//           <motion.div
//             initial={{ opacity: 0, y: 80 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 1 }}
//             className="text-center px-6 max-w-5xl mx-auto"
//           >

//             {/* SMALL TAG */}
//             <motion.p
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               transition={{ delay: 0.4 }}
//               className="uppercase tracking-[8px] text-gray-200 mb-5 text-sm"
//             >
//               Luxury Jewellery Collection
//             </motion.p>

//             {/* HEADING */}
//             <motion.h1
//               initial={{ opacity: 0, scale: 0.9 }}
//               animate={{ opacity: 1, scale: 1 }}
//               transition={{ delay: 0.3, duration: 1 }}
//               className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6"
//             >
//               Shine With
//               <span className="text-[#d4af37]"> Elegance </span>

//             </motion.h1>

//             {/* DESCRIPTION */}
//             <motion.p
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               transition={{ delay: 0.8 }}
//               className="text-gray-200 text-lg md:text-xl max-w-2xl mx-auto mb-10"
//             >
//               Discover handcrafted luxury jewellery designed
//               to make every occasion unforgettable.
//             </motion.p>

//             {/* BUTTONS */}
//             <motion.div
//               initial={{ opacity: 0, y: 40 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 1 }}
//               className="flex flex-wrap justify-center gap-5"
//             >

//               <button
//                 onClick={() => navigate("/shop")}
//                 className="bg-[#6b0f1a] hover:bg-[#4e0912] text-white px-8 py-4 rounded-full text-lg shadow-2xl hover:scale-105 transition duration-300"
//               >
//                 Shop Now
//               </button>

//               <button
//                 onClick={() => navigate("/shop?type=new")}
//                 className="border border-white text-white px-8 py-4 rounded-full text-lg hover:bg-white hover:text-black transition duration-300"
//               >
//                 Explore New Arrival
//               </button>

//             </motion.div>

//           </motion.div>

//         </div>

//         {/* BOTTOM BLUR EFFECT */}
//         <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#f8f8f8] to-transparent"></div>

//       </section>

//       {/* FEATURE STRIP */}
//       <section className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-6 py-14">

//         {[
//           {
//             title: "Premium Quality",
//             desc: "Certified Jewellery"
//           },
//           {
//             title: "Fast Delivery",
//             desc: "Across India"
//           },
//           {
//             title: "Secure Payment",
//             desc: "100% Safe Checkout"
//           },
//           {
//             title: "24/7 Support",
//             desc: "Always Here For You"
//           }
//         ].map((item, i) => (

//           <motion.div
//             key={i}
//             whileHover={{ y: -8 }}
//             className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-2xl transition duration-300 text-center"
//           >

//             <h2 className="text-2xl font-bold text-[#6b0f1a] mb-3">
//               {item.title}
//             </h2>

//             <p className="text-gray-500">
//               {item.desc}
//             </p>

//           </motion.div>

//         ))}

//       </section>

//       {/* CATEGORY SECTION */}
//       <div className="max-w-7xl mx-auto px-6">

//         <div className="text-center mb-12">

//           <h2 className="text-5xl font-bold text-[#6b0f1a] mb-4">
//             Shop By Category
//           </h2>

//           <p className="text-gray-500 text-lg">
//             Explore our exclusive jewellery categories
//           </p>

//         </div>

//         <Categories />

//       </div>

//       {/* PRODUCTS SECTION */}
//       <section className="max-w-7xl mx-auto px-6 py-20">

//         <div className="flex justify-between items-center mb-12">

//           <div>

//             <h2 className="text-5xl font-bold text-[#6b0f1a] mb-3">
//               Trending Collection
//             </h2>

//             <p className="text-gray-500 text-lg">
//               Handpicked luxury jewellery for you
//             </p>

//           </div>

//           <button
//             onClick={() => navigate("/shop")}
//             className="hidden md:block border border-[#6b0f1a] text-[#6b0f1a] px-6 py-3 rounded-full hover:bg-[#6b0f1a] hover:text-white transition duration-300"
//           >
//             View All
//           </button>

//         </div>

//         <Products />

//       </section>

//     </div>
//   );
// };

// export default Home;

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import Products from "./Products";
import Categories from "./Categories";

const Home = () => {

  const navigate = useNavigate();

  return (

    <div className="bg-[#f7f1eb] min-h-screen overflow-hidden pt-28 md:pt-36">

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 md:px-14 py-8 md:py-16 grid grid-cols-1 md:grid-cols-2 items-center gap-10 md:gap-20">

        {/* LEFT SIDE */}
        <motion.div
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="relative flex justify-center items-center order-2 md:order-1"
        >

          {/* BIG BACKGROUND CIRCLE */}
          <div className="absolute w-[280px] h-[280px] sm:w-[420px] sm:h-[420px] md:w-[540px] md:h-[540px] bg-[#d9d4cf] rounded-full blur-3xl opacity-60"></div>

          {/* MAIN IMAGE BOX */}
          <div className="relative w-[280px] sm:w-[380px] md:w-[520px] h-[360px] sm:h-[500px] md:h-[620px] rounded-[40px] md:rounded-[60px] overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.25)] border border-white/40">

            {/* IMAGE */}
            <img
              src="https://i.pinimg.com/736x/92/48/bc/9248bcb8e9b4cec255ea2f5dbf891209.jpg"
              className="w-full h-full object-cover hover:scale-105 transition duration-700"
            />

            {/* DARK OVERLAY */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

          </div>

          {/* DISCOUNT BADGE */}
          <motion.div
            animate={{
              scale: [1, 1.08, 1]
            }}
            transition={{
              repeat: Infinity,
              duration: 2
            }}
            className="absolute bottom-4 right-[-2vw] md:right-[-3vw] bg-[#6b3b24] text-white w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full flex flex-col items-center justify-center shadow-2xl border-4 border-white"
          >

            <span className="text-[10px] sm:text-xs tracking-[2px]">
              UP TO
            </span>

            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold">
              40%
            </h2>

            <span className="text-[10px] sm:text-sm tracking-[2px]">
              OFF
            </span>

          </motion.div>

        </motion.div>

        {/* RIGHT SIDE */}
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="order-1 md:order-2 text-center md:text-left md:pl-8"
        >

          {/* SMALL TEXT */}
          <p className="uppercase tracking-[4px] md:tracking-[6px] text-[#8b6b52] mb-4 text-xs sm:text-sm">

            Luxury Jewellery Collection

          </p>

          {/* HEADING */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif leading-[1.1] text-[#5b3b2c] mb-6 md:mb-8">

            Luxe Rings
            <br />

            For Every
            <br />

            Occasion

          </h1>

          {/* DESCRIPTION */}
          <p className="text-[#8b6b52] text-base sm:text-lg leading-7 md:leading-8 mb-8 md:mb-10 max-w-lg mx-auto md:mx-0">

            Elevate your look with our stunning range
            of meticulously crafted luxury jewellery.

          </p>

          {/* BUTTON */}
          <button
            onClick={() => navigate("/shop")}
            className="bg-[#6b3b24] hover:bg-[#4d2917] text-white px-7 sm:px-10 py-3 sm:py-4 rounded-full text-base sm:text-lg tracking-wide shadow-xl hover:scale-105 transition duration-300"
          >

            BUY NOW

          </button>

          {/* WEBSITE TEXT */}
          <p className="mt-10 md:mt-16 text-[#8b6b52] tracking-[2px] md:tracking-[4px] text-xs sm:text-sm">

            WWW.KHUSHBUJEWELLERS.COM

          </p>

        </motion.div>

      </section>

      {/* CATEGORY SECTION */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 md:px-14 py-14">

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">

          <div className="text-center md:text-left">

            <p className="uppercase tracking-[4px] text-[#8b6b52] text-xs sm:text-sm mb-2">
              Explore Collection
            </p>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#5b3b2c]">
              Shop By Category
            </h2>

          </div>

          <button
            onClick={() => navigate("/shop")}
            className="border border-[#6b3b24] text-[#6b3b24] px-6 py-3 rounded-full hover:bg-[#6b3b24] hover:text-white transition"
          >
            View All
          </button>

        </div>

        <Categories />

      </section>

      {/* PRODUCTS SECTION */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 md:px-14 py-14">

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">

          <div className="text-center md:text-left">

            <p className="uppercase tracking-[4px] text-[#8b6b52] text-xs sm:text-sm mb-2">
              Trending Collection
            </p>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#5b3b2c]">
              Featured Products
            </h2>

          </div>

          <button
            onClick={() => navigate("/shop")}
            className="border border-[#6b3b24] text-[#6b3b24] px-6 py-3 rounded-full hover:bg-[#6b3b24] hover:text-white transition"
          >
            View All
          </button>

        </div>

        <Products />

      </section>

    </div>
  );
};

export default Home;