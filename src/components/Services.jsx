import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api";
import IntroLoader from "../components/IntroLoader";

const ASSET_BASE = import.meta.env.VITE_ASSET_BASE_URL;

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

async function fetchServices() {
  const res = await api.get(`/services/?t=${Date.now()}`);
  return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
}

/* ===== Skeleton ===== */
function SkeletonServices() {
  return (
    <div className="w-full snap-y snap-mandatory">
      {[1, 2, 3].map((i) => (
        <div key={i} className="w-full h-screen snap-start bg-black/20 animate-pulse" />
      ))}
    </div>
  );
}

/* ===== ServiceCard (Crossfade using TransitionEnd) ===== */
function ServiceCard({ service, isFirst, onHoverPrefetch }) {
  const raw = service.coverImages || service.coverImage;

  const urls = useMemo(() => {
    const arr = parseImageVal(raw);
    return arr.map(resolveUrl).filter(Boolean);
  }, [raw]);

  const len = urls.length;

  const [index, setIndex] = useState(0);     // current
  const [nextIndex, setNextIndex] = useState(1); // next
  const [fading, setFading] = useState(false);

  const intervalRef = useRef(null);
  const loadedRef = useRef(new Set());

  const currentSrc = len ? urls[index % len] : "";
  const nextSrc = len ? urls[nextIndex % len] : "";

  // reset on service change / images change
  useEffect(() => {
    setIndex(0);
    setNextIndex(1);
    setFading(false);
    loadedRef.current = new Set();
    if (urls[0]) loadedRef.current.add(urls[0]);
  }, [service?.id, len]); // eslint-disable-line

  // preload next
  useEffect(() => {
    if (!nextSrc || loadedRef.current.has(nextSrc)) return;

    const img = new Image();
    img.onload = () => loadedRef.current.add(nextSrc);
    img.src = nextSrc;
  }, [nextSrc]);

  // loop: فقط يبدأ الفيد، والـ swap يتم في transitionEnd
  useEffect(() => {
    if (len <= 1) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      // لا تبدأ فيد إذا لسه فيد شغال
      if (fading) return;

      // لا تبدأ فيد إلا إذا next محمّلة
      if (!nextSrc) return;
      if (!loadedRef.current.has(nextSrc)) return;

      setFading(true);
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [len, nextSrc, fading]);

  // لما يخلص الـ transition على صورة الـ next (وهي ظاهرة) نبدّل المؤشرات
  const onNextTransitionEnd = () => {
    if (!fading) return;

    // ثبت الـ next كـ current
    setIndex(nextIndex);

    // جهز التالي اللي بعده
    const ni = len ? (nextIndex + 1) % len : 0;
    setNextIndex(ni);

    // رجّع الحالة عشان الدورة تكمل
    setFading(false);
  };

  return (
    <Link
      to={`/services/${service.id}`}
      onMouseEnter={() => onHoverPrefetch(service.id)}
      className="relative overflow-hidden block w-full h-screen snap-start"
    >
      {/* current image */}
      {currentSrc ? (
        <img
          src={currentSrc}
          alt={service.name}
          className={`absolute inset-0 w-full h-[150vh] object-cover transition-opacity duration-[900ms] ${
            fading ? "opacity-0" : "opacity-100"
          }`}
          loading={isFirst ? "eager" : "lazy"}
          fetchPriority={isFirst ? "high" : "auto"}
          decoding="async"
          onLoad={() => loadedRef.current.add(currentSrc)}
        />
      ) : (
        <div className="absolute inset-0 bg-[#202C28]" />
      )}

      {/* next image */}
      {len > 1 && nextSrc ? (
        <img
          src={nextSrc}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[900ms] ${
            fading ? "opacity-100" : "opacity-0"
          }`}
          loading="lazy"
          decoding="async"
          onLoad={() => loadedRef.current.add(nextSrc)}
          onTransitionEnd={onNextTransitionEnd}
        />
      ) : null}

      {/* overlay */}
      <div className="absolute inset-0 bg-black/40 transition" />

      <h2 className="absolute inset-0 flex items-center justify-center text-white text-4xl md:text-6xl font-bold">
        {service.name}
      </h2>
    </Link>
  );
}

/* ===== PAGE ===== */
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
        <div className="w-full h-screen flex items-center justify-center text-white bg-[#202C28]">
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