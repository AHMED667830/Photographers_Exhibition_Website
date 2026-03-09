import React, { useEffect, useMemo, useRef, useState } from "react";

const logos = [
  { id: 1, src: "/imgs/Companies/alaqtar_real_estate.jpg", alt: "Alaqtar Real Estate" },
  { id: 2, src: "/imgs/Companies/apexcare_clinics.png", alt: "Apexcare Clinics" },
  { id: 3, src: "/imgs/Companies/basmah_telecom.png", alt: "Basmah Telecom" },
  { id: 4, src: "/imgs/Companies/dar_cafe.png", alt: "Dar Cafe" },
  { id: 5, src: "/imgs/Companies/dr_cafe.png", alt: "Dr Cafe" },
  { id: 6, src: "/imgs/Companies/dr_sulaiman_alhabib.png", alt: "Dr Sulaiman Al Habib" },
  { id: 7, src: "/imgs/Companies/gdc_media.png", alt: "GDC Media" },
  { id: 8, src: "/imgs/Companies/maksib_real_estate.png", alt: "Maksib Real Estate" },
  { id: 9, src: "/imgs/Companies/mawsilah_law.png", alt: "Mawsilah Law" },
  { id: 10, src: "/imgs/Companies/noon_education.png", alt: "Noon Education" },
  { id: 11, src: "/imgs/Companies/nupco.png", alt: "Nupco" },
  { id: 12, src: "/imgs/Companies/petromin.png", alt: "Petromin" },
  { id: 13, src: "/imgs/Companies/qudurati.png", alt: "Qudurati" },
  { id: 14, src: "/imgs/Companies/raghwa_car_services.png", alt: "Raghwa Car Services" },
  { id: 15, src: "/imgs/Companies/sabakh_concrete.png", alt: "Sabakh Concrete" },
  { id: 16, src: "/imgs/Companies/salam_veterinary_group.png", alt: "Salam Veterinary Group" },
  { id: 17, src: "/imgs/Companies/target_english.png", alt: "Target English" },
];

// hook بسيط: يحدد إذا Desktop ولا Mobile
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return isDesktop;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const normalizePublicPath = (p = "") =>
  String(p)
    .trim()
    .replace(/^\/?public\//, "/")
    .replace(/\/{2,}/g, "/");

export default function CorporateCards() {
  const isDesktop = useIsDesktop();
  const perPage = isDesktop ? 10 : 6;

  const pages = useMemo(() => chunk(logos, perPage), [perPage]);
  const filledPages = pages;

  const loopPages = useMemo(() => {
    if (filledPages.length <= 1) return filledPages;
    return [...filledPages, filledPages[0]];
  }, [filledPages]);

  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    setIndex(0);
    setAnimate(true);
  }, [perPage]);

  useEffect(() => {
    if (loopPages.length <= 1) return;

    timerRef.current = setInterval(() => {
      setIndex((prev) => prev + 1);
    }, 3000);

    return () => clearInterval(timerRef.current);
  }, [loopPages.length]);

  useEffect(() => {
    if (loopPages.length <= 1) return;
    if (index === loopPages.length - 1) {
      const t = setTimeout(() => {
        setAnimate(false);
        setIndex(0);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => setAnimate(true))
        );
      }, 550);
      return () => clearTimeout(t);
    }
  }, [index, loopPages.length]);

  const gridClass = isDesktop
    ? "grid-cols-5 grid-rows-2"
    : "grid-cols-3 grid-rows-2";

  return (
    <section className="bg-[#192521] py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-white text-center font-Vazirmatn mb-8">
          عملاء يثقون بنا
        </h2>

        <div className="relative overflow-hidden">
          <div
            className="flex"
            style={{
              transform: `translateX(-${index * 100}%)`,
              transition: animate ? "transform 550ms ease" : "none",
            }}
          >
            {loopPages.map((page, pageIdx) => (
              <div key={pageIdx} className="w-full shrink-0">
                <div
                  className={`grid ${gridClass} gap-y-10 gap-x-8 place-items-center py-10`}
                >
                  {page.map((logo) => (
                    <div
                      key={logo.id}
                      className="
                        w-[92px] h-[72px]
                        sm:w-[110px] sm:h-[80px]
                        md:w-[120px] md:h-[86px]
                        flex items-center justify-center
                      "
                    >
                      <img
                        src={normalizePublicPath(logo.src)}
                        alt={logo.alt}
                        className="max-w-full max-h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filledPages.length > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              {filledPages.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-6 rounded-full ${
                    i === (index % filledPages.length)
                      ? "bg-white/70"
                      : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}