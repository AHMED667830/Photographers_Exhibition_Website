export default function SiteCredit() {
  return (
    <div className="w-full text-center py-4 bg-[#202C28] border-t border-white/10">
      <p className="font-Vazirmatn text-xs sm:text-sm text-white/60">
        تم تطوير وبرمجة الموقع بواسطة{" "}
        <span className="text-[#D8AC4B] font-medium">أحمد , باسـل</span>
        {" "}— للتواصل:{" "}
        <a
          href="https://wa.me/966545987233"
          target="_blank"
          rel="noreferrer"
          className="text-[#D8AC4B] hover:underline"
        >
          واتساب
        </a>
      </p>
    </div>
  );
}