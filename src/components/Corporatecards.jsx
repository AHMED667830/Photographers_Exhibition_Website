import React, { useEffect, useMemo, useRef, useState } from "react";

const logos = [
  { id: 1, src: "/imgs/Charitable_organizations/abna_charity.png", alt: "logo" },
  { id: 2, src: "/imgs/Charitable_organizations/alihsan_charity.png", alt: "logo" },
  { id: 3, src: "/imgs/Charitable_organizations/alwedad_orphan_care.png", alt: "logo" },
  { id: 4, src: "/imgs/Charitable_organizations/alzad_charity.png", alt: "logo" },
  { id: 5, src: "/imgs/Charitable_organizations/buraydah_quran_memorization.png", alt: "logo" },
  { id: 6, src: "/imgs/Charitable_organizations/damy_charity.png", alt: "logo" },
  { id: 7, src: "/imgs/Charitable_organizations/ekhaa.png", alt: "logo" },
  { id: 8, src: "/imgs/Charitable_organizations/kafaat.png", alt: "logo" },
  { id: 9, src: "/imgs/Charitable_organizations/kilayati_association.png", alt: "logo" },
  { id: 10, src: "/imgs/Charitable_organizations/saleh_alrajhi_endowment.png", alt: "logo" },
  { id: 11, src: "/imgs/Charitable_organizations/seha_qassim_health_services.png", alt: "logo" },
  { id: 12, src: "/imgs/Charitable_organizations/sunan_charity.png", alt: "logo" },

  { id: 13, src: "/imgs/Companies/alaqtar_real_estate.png", alt: "logo" },
  { id: 14, src: "/imgs/Companies/apexcare_clinics.png", alt: "logo" },
  { id: 15, src: "/imgs/Companies/basmah_telecom.png", alt: "logo" },
  { id: 16, src: "/imgs/Companies/dar_cafe.png", alt: "logo" },
  { id: 17, src: "/imgs/Companies/dr_cafe.png", alt: "logo" },
  { id: 18, src: "/imgs/Companies/dr_sulaiman_alhabib.png", alt: "logo" },
  { id: 19, src: "/imgs/Companies/gdc_media.png", alt: "logo" },
  { id: 20, src: "/imgs/Companies/maksib_real_estate.png", alt: "logo" },
  { id: 21, src: "/imgs/Companies/mawsilah_law.png", alt: "logo" },
  { id: 22, src: "/imgs/Companies/noon_education.png", alt: "logo" },
  { id: 23, src: "/imgs/Companies/nupco.png", alt: "logo" },
  { id: 24, src: "/imgs/Companies/petromin.png", alt: "logo" },
  { id: 25, src: "/imgs/Companies/qudurati.png", alt: "logo" },
  { id: 26, src: "/imgs/Companies/raghwa_car_services.png", alt: "logo" },
  { id: 27, src: "/imgs/Companies/sabakh_concrete.png", alt: "logo" },
  { id: 28, src: "/imgs/Companies/salam_veterinary_group.png", alt: "logo" },
  { id: 29, src: "/imgs/Companies/target_english.png", alt: "logo" },

  { id: 30, src: "/imgs/Government_agencies/ministry_of_culture.png", alt: "logo" },
  { id: 31, src: "/imgs/Government_agencies/ministry_of_education.png", alt: "logo" },
  { id: 32, src: "/imgs/Government_agencies/ministry_of_sport.png", alt: "logo" },
  { id: 33, src: "/imgs/Government_agencies/ministry_of_tourism.png", alt: "logo" },
  { id: 34, src: "/imgs/Government_agencies/qassim_cement.png", alt: "logo" },
  { id: 35, src: "/imgs/Government_agencies/qassim_health_cluster.png", alt: "logo" },
  { id: 36, src: "/imgs/Government_agencies/saudi_railway_polytechnic.png", alt: "logo" },
  { id: 37, src: "/imgs/Government_agencies/saudi_water_authority.png", alt: "logo" },

  { id: 38, src: "/imgs/Charitable_families/al_muhaimid_family.png", alt: "logo" },
  { id: 39, src: "/imgs/Charitable_families/al_rajhi_family_office.png", alt: "logo" },
  { id: 40, src: "/imgs/Charitable_families/al_saawi_family_fund.png", alt: "logo" },
  { id: 41, src: "/imgs/Charitable_families/al_tuwaijri_family.png", alt: "logo" },
  { id: 42, src: "/imgs/Charitable_families/al_yahya.png", alt: "logo" },
  { id: 43, src: "/imgs/Charitable_families/alfozan_family.png", alt: "logo" },
  { id: 44, src: "/imgs/Charitable_families/aljarbou_family_fund.png", alt: "logo" },
  { id: 45, src: "/imgs/Charitable_families/alkhamees_family.png", alt: "logo" },
];
// hook بسيط: يحدد إذا Desktop ولا Mobile
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)"); // lg
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

// ✅ يصلّح /public/... ويشيل أي // زايدة
const normalizePublicPath = (p = "") =>
  String(p)
    .trim()
    .replace(/^\/?public\//, "/") // /public/imgs/... => /imgs/...
    .replace(/\/{2,}/g, "/");     // // => /

export default function CorporateCards() {
  const isDesktop = useIsDesktop();
  const perPage = isDesktop ? 10 : 6;

  const pages = useMemo(() => chunk(logos, perPage), [perPage]);

  // بدون تعبئة: لو الصفحة ناقصة تظل ناقصة (بدون تكرار)
  const filledPages = pages;

  // نسوي looping لطيف: نضيف نسخة من أول صفحة في النهاية
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

  // لما نوصل لآخر "نسخة" (اللي هي نفس أول صفحة)، نرجع لأول صفحة بدون فلاش
  useEffect(() => {
    if (loopPages.length <= 1) return;
    if (index === loopPages.length - 1) {
      const t = setTimeout(() => {
        setAnimate(false);
        setIndex(0);
        requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
      }, 550);
      return () => clearTimeout(t);
    }
  }, [index, loopPages.length]);

  const gridClass = isDesktop ? "grid-cols-5 grid-rows-2" : "grid-cols-3 grid-rows-2";

  return (
    <section className="bg-[#192521] py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-white text-center font-Vazirmatn mb-8">عملاء يثقون بنا</h2>

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
                <div className={`grid ${gridClass} gap-y-10 gap-x-8 place-items-center py-10`}>
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
                     <img src={logo.src} alt={logo.alt} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* نقاط بسيطة */}
          {filledPages.length > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              {filledPages.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-6 rounded-full ${
                    i === (index % filledPages.length) ? "bg-white/70" : "bg-white/20"
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