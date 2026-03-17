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
      resolve({
        src,
        width: 0,
        height: 0,
      });
    };
    img.src = src;
  });
}

async function classifyImagesByDevice(urls) {
  const sized = await Promise.all(urls.map(loadImageSize));

  const mobile = [];
  const desktop = [];

  for (const item of sized) {
    if (!item.src) continue;

    if (item.height > item.width) {
      mobile.push(item.src);
    } else {
      desktop.push(item.src);
    }
  }

  return {
    mobile,
    desktop,
    all: sized.map((x) => x.src).filter(Boolean),
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

  const [index, setIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [fading, setFading] = useState(false);

  const [mode, setMode] = useState("service");
  const [phraseIndex, setPhraseIndex] = useState(0);

  const intervalRef = useRef(null);
  const loadedRef = useRef(new Set());
  const textTimerRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      setReadySlides(false);

      const classified = await classifyImagesByDevice(allUrls);
      const mobile = classified.mobile;
      const desktop = classified.desktop;

      let chosen = [];

      if (isMobileScreen()) {
        chosen = mobile.length ? mobile : desktop.length ? desktop : classified.all;
      } else {
        chosen = desktop.length ? desktop : mobile.length ? mobile : classified.all;
      }

      if (!mounted) return;

      setSlides(chosen);
      setReadySlides(true);
    }

    run();

    return () => {
      mounted = false;
    };
  }, [allUrls]);

  const len = slides.length;
  const currentSrc = len ? slides[index % len] : "";
  const nextSrc = len ? slides[nextIndex % len] : "";

  useEffect(() => {
    setIndex(0);
    setNextIndex(len > 1 ? 1 : 0);
    setFading(false);
    loadedRef.current = new Set();
    if (slides[0]) loadedRef.current.add(slides[0]);
  }, [service?.id, len, slides]);

  useEffect(() => {
    if (!nextSrc || loadedRef.current.has(nextSrc)) return;

    const img = new Image();
    img.onload = () => loadedRef.current.add(nextSrc);
    img.src = nextSrc;
  }, [nextSrc]);

  useEffect(() => {
    if (len <= 1) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (fading) return;
      if (!nextSrc) return;
      if (!loadedRef.current.has(nextSrc)) return;

      setFading(true);
    }, 7500);

    return () => clearInterval(intervalRef.current);
  }, [len, nextSrc, fading]);

  const onNextTransitionEnd = (e) => {
    if (e.target !== e.currentTarget) return;
    if (!fading || len <= 1) return;

    const newIndex = nextIndex % len;
    setIndex(newIndex);
    setNextIndex((newIndex + 1) % len);
    setFading(false);
  };

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
            className={`absolute inset-0 block w-full h-full transition-all duration-[2600ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform will-change-opacity ${
              fading ? "opacity-0 scale-[1.08]" : "opacity-100 scale-[1.015]"
            }`}
          >
            <img
              src={currentSrc}
              alt={service.name}
              className="absolute inset-0 w-full h-full object-cover transform-gpu"
              loading={isFirst ? "eager" : "lazy"}
              fetchPriority={isFirst ? "high" : "auto"}
              decoding="async"
              onLoad={() => loadedRef.current.add(currentSrc)}
            />
          </div>

          {len > 1 && nextSrc ? (
            <div
              onTransitionEnd={onNextTransitionEnd}
              className={`absolute inset-0 block w-full h-full transition-all duration-[2600ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform will-change-opacity ${
                fading ? "opacity-100 scale-[1.015]" : "opacity-0 scale-[1.04]"
              }`}
            >
              <img
                src={nextSrc}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transform-gpu"
                loading="lazy"
                decoding="async"
                onLoad={() => loadedRef.current.add(nextSrc)}
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
              className={`absolute font-Vazirmatn text-white text-4xl md:text-6xl font-bold text-center transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${serviceClass}`}
            >
              {service.name}
            </h2>
          )}

          {showPhrase && (
            <h2
              className={`absolute font-Vazirmatn text-white text-4xl md:text-6xl font-bold text-center transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${phraseClass}`}
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
        <div className="w-full h-screen flex items-center justify-center text-white bg-[#202C28] font-Vazirmatn">
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