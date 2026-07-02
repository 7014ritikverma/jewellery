import { useEffect, useState } from "react";
import { FiChevronUp } from "react-icons/fi";

const BackToTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 360);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[#5c0b2a] text-white shadow-[0_10px_28px_rgba(92,11,42,0.28)] ring-1 ring-white/40 transition duration-200 hover:bg-[#74123a] focus:outline-none focus:ring-2 focus:ring-[#d8a1ad] sm:bottom-7 sm:right-7 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <FiChevronUp size={24} />
    </button>
  );
};

export default BackToTopButton;
