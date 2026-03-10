import React from "react";

export default function AboutMe() {
  return (
    <section dir="rtl" className="bg-[#202C28] min-h-screen font-Vazirmatn pt-32 pb-20">
      <div className="mx-auto max-w-3xl px-4 text-center">
        {/* عنوان */}
        <h2 className="text-[#E7F2E2] text-3xl sm:text-4xl font-semibold">
          من أنا
        </h2>

        {/* خط */}
        <div className="mx-auto mt-6 h-px w-64 sm:w-80 bg-[#E7F2E2]/30" />

        {/* الصورة */}
        <div className="mt-14 flex justify-center">
          <div className="relative h-32 w-32 sm:h-36 sm:w-36">
            <div className="absolute inset-0 rounded-full bg-black/40 blur-2xl" />

            <img
              src="/imgs/omer.JPG"
              alt="عمر المحيميد مصور فوتوغرافي"
              className="
                relative
                h-full w-full
                rounded-full
                object-cover
                object-[center_5%]
                ring-2 ring-[#D8AC4B]
              "
              loading="lazy"
            />
          </div>
        </div>

        {/* الاسم */}
        <h3 className="mt-10 text-[#D8AC4B] text-4xl sm:text-5xl font-bold">
          عمر المحيميد
        </h3>

        {/* المسمى */}
        <p className="mt-3 text-[#E7F2E2]/80 text-base sm:text-lg">
          مصور فوتوغرافي
        </p>

        {/* الوصف */}
        <p className="mt-8 text-[#E7F2E2]/75 text-sm sm:text-base leading-8 sm:leading-9">
        بدأت بشغف .. وانطلقت بحماس .. وتعاملت باحتراف .. واحترمت الوقت ..
        </p>
      </div>
    </section>
  );
}