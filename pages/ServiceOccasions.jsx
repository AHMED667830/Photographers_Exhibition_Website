import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../api";
import FastImage from "../components/FastImage";

const ASSET_BASE = import.meta.env.VITE_ASSET_BASE_URL;

const resolveUrl = (p) => {
  if (!p) return "";
  if (p.startsWith("http")) return p;

  let path = p.startsWith("/") ? p.slice(1) : p;
  if (!path.startsWith("uploads/")) path = `uploads/${path}`;

  const base = ASSET_BASE.endsWith("/") ? ASSET_BASE.slice(0, -1) : ASSET_BASE;
  return `${base}/${path}`;
};

async function fetchServices() {
  const res = await api.get("/services");
  return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
}

async function fetchOccasions(serviceId) {
  // ملاحظة: حذفنا ?t=Date.now() لأنه يكسر الكاش ويجبر طلب جديد دائمًا
  const res = await api.get(`/services/${serviceId}/occasions`);
  return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
}

function pickServiceName(services, serviceId) {
  const s = services?.find((x) => String(x.id) === String(serviceId));
  return s?.name || "الخدمة";
}

function parseImageVal(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;

  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "string") {
        try {
          const doubleParsed = JSON.parse(parsed);
          if (Array.isArray(doubleParsed)) return doubleParsed;
        } catch (e) {}
        return parsed.split(",").map((s) => s.trim()).filter(Boolean);
      }
    } catch (err) {
      const clean = val.replace(/^["'\[]+|["'\]]+$/g, "");
      return clean.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function formatDate(d) {
  if (!d) return "";
  return String(d);
}

function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      {Array.from({ length: pages }).map((_, i) => {
        const n = i + 1;
        const active = n === page;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={[
              "w-12 h-12 rounded-md font-Vazirmatn font-semibold transition",
              active
                ? "bg-[#D8AC4B] text-[#202C28]"
                : "bg-[#D8AC4B]/85 text-white hover:opacity-90",
            ].join(" ")}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

function pickOccasionThumbs(o) {
  const images = parseImageVal(
    o?.thumbnailsSmall || o?.thumbnails || o?.thumbs || o?.images
  );
  if (images.length > 0) return images;

  const singleStr = o?.thumbnailSmall || o?.thumbnail || o?.coverSmall || o?.cover;
  if (singleStr && typeof singleStr === "string") {
    const singleParsed = parseImageVal(singleStr);
    if (singleParsed.length > 0) return singleParsed;
    return [singleStr];
  }
  return [];
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="h-[320px] md:h-[260px] bg-black/20 animate-pulse border border-white/10"
        />
      ))}
    </div>
  );
}

/* ===================== OccasionCard (SLIDER FIXED) ===================== */
function OccasionCard({ occasion, serviceId, onHoverPrefetch }) {
  const title = occasion?.title || occasion?.name || "بدون عنوان";
  const date = formatDate(occasion?.date);

  const rawThumbs = pickOccasionThumbs(occasion);
  const urls = useMemo(() => rawThumbs.map(resolveUrl).filter(Boolean), [rawThumbs]);

  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(false);

  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  const currentSrc = urls[index] || "";
  const nextSrc = urls.length > 0 ? urls[(index + 1) % urls.length] : "";

  // reset عند تغيير المناسبة / الصور
  useEffect(() => {
    setIndex(0);
    setFade(false);
  }, [urls.length, occasion?.id]);

  // preload للصورة القادمة
  useEffect(() => {
    if (!nextSrc) return;
    const img = new Image();
    img.src = nextSrc;
  }, [nextSrc]);

  // loop
  useEffect(() => {
    // تنظيف أي مؤقتات قديمة
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (urls.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setFade(true);

      timeoutRef.current = setTimeout(() => {
        setIndex((i) => (i + 1) % urls.length);
        setFade(false);
      }, 900);
    }, 4000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [urls.length]);

  return (
    <Link
      to={`/services/${serviceId}/occasions/${occasion.id}`}
      onMouseEnter={() => onHoverPrefetch?.(occasion.id)}
      className="group relative overflow-hidden border border-white/10"
    >
      <div className="relative w-full h-[320px] md:h-[260px]">
        {/* الحالية */}
        <FastImage
          src={currentSrc}
          alt={title}
          eager={false}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            fade ? "opacity-0" : "opacity-100"
          }`}
        />

        {/* القادمة */}
        {urls.length > 1 && (
          <FastImage
            src={nextSrc}
            alt=""
            eager={false}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              fade ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        <div className="absolute inset-0 bg-black/10" />

   

        <div
          className={[
            "absolute left-0 right-0 bottom-0",
            "px-4 py-3",
            "bg-black/45 text-white transition",
            "opacity-100",
            "lg:opacity-0 lg:group-hover:opacity-100 z-10",
          ].join(" ")}
        >
          <div className="font-Vazirmatn font-semibold text-center">{title}</div>
          {date ? (
            <div className="font-Vazirmatn text-xs text-white/80 text-center mt-1">
              {date}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export default function ServiceOccasions() {
  const { serviceId } = useParams();
  const qc = useQueryClient();

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
    staleTime: 60_000,
  });

  const { data: occasions = [], isFetching } = useQuery({
    queryKey: ["occasions", serviceId],
    queryFn: () => fetchOccasions(serviceId),
    staleTime: 60_000,
    enabled: !!serviceId,
  });

  const PER_PAGE = 12;
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil((occasions?.length || 0) / PER_PAGE));

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return (occasions || []).slice(start, start + PER_PAGE);
  }, [occasions, page]);

  const serviceName = pickServiceName(services, serviceId);

  const prefetchPhotos = useCallback(
    (occasionId) => {
      qc.prefetchQuery({
        queryKey: ["photos", occasionId],
        queryFn: async () => {
          const res = await api.get(`/uploads-manager/photos/occasion/${occasionId}`);
          return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        },
        staleTime: 60_000,
      });
    },
    [qc]
  );

  return (
    <section className="min-h-screen bg-[#202C28] font-Vazirmatn">
      {/* الهيدر والفوتر شلناهم من هنا لأن Layout في App.jsx بيعرضهم */}

      <div className="pt-24 sm:pt-28 pb-6 text-center text-[#E7F2E2]">
        <h1 className="text-3xl sm:text-4xl font-semibold">{serviceName}</h1>
        <div className="mx-auto mt-4 h-px w-56 bg-white/35" />
      </div>

      <div dir="rtl" className="mx-auto max-w-6xl px-0 pb-10">
        {isFetching && occasions.length === 0 ? (
          <GridSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              {pageItems.map((o) => (
                <OccasionCard
                  key={o.id}
                  occasion={o}
                  serviceId={serviceId}
                  onHoverPrefetch={prefetchPhotos}
                />
              ))}
            </div>

            <Pagination page={page} pages={pages} onChange={setPage} />
          </>
        )}
      </div>
    </section>
  );
}