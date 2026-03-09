import { useState } from "react";
import { Link } from "react-router-dom";


export default function Header() {
  const [open, setOpen] = useState(false);

const links = [
  { label: "الرئيسية", to: "/" },
  { label: "من أنا", to: "/AboutMe" },
  { label: "الأعراس", to: "/services/1" },
  { label: "التغطيات", to: "/services/2" },
];
  return (
    <header className="font-Vazirmatn absolute w-full flex items-center justify-between p-4 z-50">
      {/* LOGO */}
      <div className="flex items-center">
        <a href="/">
        <img
          src="/imgs/logo.png"
          alt="logo"
          className="
      w-16
      sm:w-20
      md:w-24
      lg:w-20
      xl:w-20
      object-contain
      transition-all duration-300
    "
        />
        </a>
      </div>

      {/* DESKTOP NAV */}
     <nav className="hidden lg:flex flex-row-reverse absolute left-1/2 -translate-x-1/2 gap-8">
        {links.map((item) => (
          <Link
            key={item.label}
            to={item.to}
className="text-[#E7F2E2] hover:text-[#D8AC4B] transition duration-300 font-medium
text-base sm:text-lg md:text-xl"          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* BURGER BUTTON (MOBILE) */}
      <button
        className="lg:hidden text-3xl text-[#E7F2E2]"
        onClick={() => setOpen(true)}
      >
        ☰
      </button>

      {/* OVERLAY */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* SIDE MENU */}
      <aside dir="rtl"
        className={`fixed top-0 right-0 h-full w-72 sm:w-80
        transition-transform duration-300 ease-out
        ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ backgroundColor: "#202C28" }}
      >
        {/* HEADER */}
        <div  className="flex items-center justify-between p-4 border-b border-white/10">
          <span className="text-[#E7F2E2] font-bold text-lg">القائمة</span>
          <button 
            className="text-3xl text-[#E7F2E2]"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* LINKS */}
        <nav className="flex flex-col p-6 gap-4">
          {links.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              onClick={() => setOpen(false)}
              className="text-[#E7F2E2] hover:text-[#D8AC4B] transition duration-300 text-lg"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </header>
  );
}
