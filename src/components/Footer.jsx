import React from "react";
import { FaWhatsapp } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[#202C28]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
<div
  dir="rtl"
  className="h-24 sm:h-28 md:h-32 flex flex-row items-center justify-center gap-1"
>           <img
            src="/imgs/Pasted_Graphic.png" // حط اسمك/شعارك الذهبي هنا
            alt="Footer Logo"
            className="h-17  object-contain"
          />
          {/* WhatsApp */}
          <a
            href="https://wa.me/966564658880" // غيّر رقمك
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
            className="
            mx-8
              text-[#D8AC4B]
              hover:opacity-80
              transition
            "
          >
           <FaWhatsapp className="text-4xl sm:text-4xl" />
          </a>

       
         
        </div>
      </div>
    </footer>
  );
}
