import { useEffect, useState } from "react";
import { FiArrowUp } from "react-icons/fi";

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="الرجوع للأعلى"
      className={`
        fixed bottom-6 right-6 sm:bottom-8 sm:right-8
        z-50

        h-12 w-12 sm:h-14 sm:w-14
        rounded-full

        bg-[#202C28]/90
        backdrop-blur-md

        border border-[#D8AC4B]/30

        text-[#D8AC4B]

        shadow-[0_10px_40px_rgba(0,0,0,0.35)]
        
        transition-all duration-300 ease-out

        hover:scale-110
        hover:shadow-[0_0_20px_rgba(216,172,75,0.4)]

        active:scale-95

        flex items-center justify-center

        ${visible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-6 pointer-events-none"
        }
      `}
    >
      <FiArrowUp className="text-lg sm:text-xl" />
    </button>
  );
}