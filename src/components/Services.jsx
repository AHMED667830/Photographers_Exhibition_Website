import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api";
import IntroLoader from "../components/IntroLoader";

const ASSET_BASE = import.meta.env.VITE_ASSET_BASE_URL;

const SERVICE_PHRASES = {
  أعراس: ["تغطيات تُخلد", "ذكريات تنبض بالحياة", "تبقى الفرحة حية"],
  تغطيات: ["صدارة المشهد"],
};

const MOBILE_RATIO = 9 / 16;
const DESKTOP_RATIO = 16 / 9;
const RATIO_TOLERANCE = 0.22;

const resolveUrl = (p) => {
  if (!p) return "";
  if (p.startsWith("http")) return p;

  let path = p.startsWith("/") ? p.slice(1) : p;
  if (!path.startsWith("uploads/")) path = `uploads/${path}`;

  const base = ASSET_BASE.endsWith("/") ? ASSET_BASE.slice(0, -1) : ASSET_BASE;
  return `${base}/${path}`;
};

function parseImageVal(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;

  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;

      return String(parsed)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } catch {
      return val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function loadImageSize(src) {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        src,
        width: img.naturalWidth || 0,
        height: img.naturalHeight || 0,
      });
    };

    img.onerror = () => {
      resolve(null);
    };

    img.src = src;
  });
}

function preloadImage(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

async function preloadImages(urls = []) {
  await Promise.all(urls.map(preloadImage));
}

function getRatioScore(width, height, targetRatio) {
  if (!width || !height) return Number.MAX_SAFE_INTEGER;
  const ratio = width / height;
  return Math.abs(ratio - targetRatio);
}

async function pickImagesByDevice(urls) {
  const sized = (await Promise.all(urls.map(loadImageSize))).filter(Boolean);

  if (!sized.length) {
    return {
      mobile: [],
      desktop: [],
      all: [],
    };
  }

  // فلترة فقط مع الحفاظ على الترتيب الأصلي
  const mobile = sized.filter(
    (img) => getRatioScore(img.width, img.height, MOBILE_RATIO) <= RATIO_TOLERANCE
  );

  const desktop = sized.filter(
    (img) => getRatioScore(img.width, img.height, DESKTOP_RATIO) <= RATIO_TOLERANCE
  );

  return {
    mobile: mobile.map((x) => x.src),
    desktop: desktop.map((x) => x.src),
    all: sized.map((x) => x.src),
  };
}

function isMobileScreen() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

async function fetchServices() {
  const res = await api.get(`/services/?t=${Date.now()}`);
  return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
}

function SkeletonServices() {
  return (
    <div className="w-full snap-y snap-mandatory">
      {[1, 2, 3].map((i) => (
        <div key={i} className="w-full h-screen snap-start bg-black/20 animate-pulse" />
      ))}
    </div>
  );
}

function ServiceCard({ service, isFirst, onHoverPrefetch }) {
  const raw = service.coverImages || service.coverImage;

  const allUrls = useMemo(() => {
    const arr = parseImageVal(raw);
    return arr.map(resolveUrl).filter(Boolean);
  }, [raw]);

  const [slides, setSlides] = useState([]);
  const [readySlides, setReadySlides] = useState(false);

  const phrases = SERVICE_PHRASES[service.name] || [
    "توثيق احترافي",
    "لحظات تبقى",
    "تفاصيل تليق بذكراك",
  ];

  const [activeIndex, setActiveIndex] = useState(0);
  const [incomingIndex, setIncomingIndex] = useState(null);
  const [isFading, setIsFading] = useState(false);

  const [mode, setMode] = useState("service");
  const [phraseIndex, setPhraseIndex] = useState(0);

  const intervalRef = useRef(null);
  const fadeTimeoutRef = useRef(null);
  const textTimerRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setReadySlides(false);

      const picked = await pickImagesByDevice(allUrls);

      let chosen = [];

      if (isMobileScreen()) {
        chosen = picked.mobile.length ? picked.mobile : picked.all;
      } else {
        chosen = picked.desktop.length ? picked.desktop : picked.all;
      }

      if (!mounted) return;

      if (!chosen.length) {
        setSlides([]);
        setActiveIndex(0);
        setIncomingIndex(null);
        setIsFading(false);
        setReadySlides(true);
        return;
      }

      await preloadImages(chosen);

      if (!mounted) return;

      setSlides(chosen);
      setActiveIndex(0);
      setIncomingIndex(chosen.length > 1 ? 1 : null);
      setIsFading(false);
      setReadySlides(true);
    }

    run();

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        run();
      }, 150);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      mounted = false;
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
    };
  }, [allUrls]);

  const len = slides.length;
  const currentSrc = len ? slides[activeIndex % len] : "";
  const nextRealIndex =
    len > 1
      ? incomingIndex !== null
        ? incomingIndex % len
        : (activeIndex + 1) % len
      : null;
  const nextSrc = nextRealIndex !== null ? slides[nextRealIndex] : "";

  useEffect(() => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!readySlides || len <= 1) return;

    intervalRef.current = setInterval(async () => {
      if (isFading) return;

      const nextIndexToShow = (activeIndex + 1) % len;
      const nextImage = slides[nextIndexToShow];

      await preloadImage(nextImage);

      setIncomingIndex(nextIndexToShow);
      setIsFading(true);

      fadeTimeoutRef.current = setTimeout(() => {
        setActiveIndex(nextIndexToShow);
        setIncomingIndex((nextIndexToShow + 1) % len);
        setIsFading(false);
      }, 1100);
    }, 7500);

    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
        fadeTimeoutRef.current = null;
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [readySlides, len, slides, activeIndex, isFading]);

  useEffect(() => {
    if (textTimerRef.current) clearTimeout(textTimerRef.current);

    if (mode === "service") {
      textTimerRef.current = setTimeout(() => {
        setMode("service-exit");
      }, 2200);
    }

    if (mode === "service-exit") {
      textTimerRef.current = setTimeout(() => {
        setPhraseIndex(0);
        setMode("phrase");
      }, 800);
    }

    if (mode === "phrase") {
      textTimerRef.current = setTimeout(() => {
        setMode("phrase-exit");
      }, 1800);
    }

    if (mode === "phrase-exit") {
      textTimerRef.current = setTimeout(() => {
        if (phraseIndex < phrases.length - 1) {
          setPhraseIndex((prev) => prev + 1);
          setMode("phrase");
        } else {
          setMode("service");
        }
      }, 550);
    }

    return () => clearTimeout(textTimerRef.current);
  }, [mode, phraseIndex, phrases.length]);

  useEffect(() => {
    setMode("service");
    setPhraseIndex(0);
  }, [service?.id]);

  const showService = mode === "service" || mode === "service-exit";
  const showPhrase = mode === "phrase" || mode === "phrase-exit";

  const serviceClass =
    mode === "service"
      ? "opacity-100 translate-x-0 scale-100"
      : "opacity-0 translate-x-14 md:translate-x-20 scale-[0.985]";

  const phraseClass =
    mode === "phrase"
      ? "opacity-100 translate-x-0 scale-100"
      : "opacity-0 translate-x-14 md:translate-x-20 scale-[0.985]";

  return (
    <Link
      to={`/services/${service.id}`}
      onMouseEnter={() => onHoverPrefetch(service.id)}
      className="relative overflow-hidden block w-full h-screen snap-start bg-[#202C28]"
    >
      {!readySlides ? (
        <div className="absolute inset-0 bg-[#202C28]" />
      ) : currentSrc ? (
        <>
          <div
            className={`absolute inset-0 block w-full h-full transition-opacity duration-[1100ms] ease-in-out ${
              isFading ? "opacity-0" : "opacity-100"
            }`}
          >
            <img
              src={currentSrc}
              alt={service.name}
              className="absolute inset-0 w-full h-full object-cover"
              loading={isFirst ? "eager" : "lazy"}
              fetchPriority={isFirst ? "high" : "auto"}
              decoding="async"
              draggable="false"
            />
          </div>

          {len > 1 && nextSrc ? (
            <div
              className={`absolute inset-0 block w-full h-full transition-opacity duration-[1100ms] ease-in-out ${
                isFading ? "opacity-100" : "opacity-0"
              }`}
            >
              <img
                src={nextSrc}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                draggable="false"
              />
            </div>
          ) : null}
        </>
      ) : (
        <div className="absolute inset-0 bg-[#202C28]" />
      )}

      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

      <div className="absolute inset-0 flex items-center justify-center translate-y-8 md:translate-y-12 z-10">
        <div className="relative flex items-center justify-center min-h-[90px] md:min-h-[110px] min-w-[320px] md:min-w-[500px] px-4">
          {showService && (
            <h2
              className={`font-Vazirmatn absolute text-center text-4xl font-bold text-white transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] md:text-6xl ${serviceClass}`}
            >
              {service.name}
            </h2>
          )}

          {showPhrase && (
            <h2
              className={`font-Vazirmatn absolute text-center text-4xl font-bold text-white transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] md:text-6xl ${phraseClass}`}
            >
              {phrases[phraseIndex]}
            </h2>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Services() {
  const qc = useQueryClient();

  const { data: services = [], isFetching } = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
    retry: 1,
  });

  const prefetchOccasions = (serviceId) => {
    qc.prefetchQuery({
      queryKey: ["occasions", serviceId],
      queryFn: async () => {
        const res = await api.get(`/services/${serviceId}/occasions`);
        return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      },
    });
  };

  const ready = services.length > 0 || !isFetching;

  return (
    <>
      <IntroLoader ready={ready} />

      {isFetching && services.length === 0 ? (
        <SkeletonServices />
      ) : services.length === 0 ? (
        <div className="font-Vazirmatn flex h-screen w-full items-center justify-center bg-[#202C28] text-white">
          لا توجد خدمات
        </div>
      ) : (
        <div className="w-full snap-y snap-mandatory">
          {services.map((s, idx) => (
            <ServiceCard
              key={s.id}
              service={s}
              isFirst={idx === 0}
              onHoverPrefetch={prefetchOccasions}
            />
          ))}
        </div>
      )}
    </>
  );
}