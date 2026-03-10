import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import api from "../api";

const ASSET_BASE = import.meta.env.VITE_ASSET_BASE_URL;

const resolveUrl = (p) => {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;

  let path = p.startsWith("/") ? p.slice(1) : p;
  if (!path.startsWith("uploads/")) {
    path = `uploads/${path}`;
  }

  const base = ASSET_BASE.endsWith("/") ? ASSET_BASE.slice(0, -1) : ASSET_BASE;
  return `${base}/${path}`;
};

async function fetchOccasions(serviceId) {
  const res = await api.get(`/services/${serviceId}/occasions`);
  return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
}

async function fetchPhotos(occasionId) {
  const res = await api.get(`/uploads-manager/photos/occasion/${occasionId}?t=${Date.now()}`);
  return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
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
        } catch {}
        return parsed.split(",").map((s) => s.trim()).filter(Boolean);
      }
    } catch {
      const clean = val.replace(/^["'\[]+|["'\]]+$/g, "");
      return clean.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function pickPhotoUrl(p) {
  const src =
    p?.url ||
    p?.imageUrl ||
    p?.photoUrl ||
    p?.path ||
    p?.file ||
    p?.image ||
    p?.src ||
    "";

  if (!src) return "";

  const filename = src.split("/").pop();
  const base = ASSET_BASE.endsWith("/") ? ASSET_BASE : ASSET_BASE + "/";
  return `${base}uploads/${filename}`;
}

function pickOccasionCover(o) {
  const parsedArr = parseImageVal(o?.thumbnailsSmall || o?.thumbnails || o?.thumbs);
  if (parsedArr.length > 0) return parsedArr[0];

  const singleStr = o?.thumbnailSmall || o?.thumbnail || o?.coverSmall || o?.cover;
  if (singleStr && typeof singleStr === "string") {
    const singleParsed = parseImageVal(singleStr);
    return singleParsed[0] || singleStr;
  }
  return "";
}

function getWeekdayName(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  const names = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  return names[d.getDay()];
}

function normalizeBoolean(val, fallback = true) {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    if (val.toLowerCase() === "true") return true;
    if (val.toLowerCase() === "false") return false;
    if (val === "1") return true;
    if (val === "0") return false;
  }
  if (typeof val === "number") return val === 1;
  return fallback;
}

function pickOccasionVideoUrl(occasion) {
  return (
    occasion?.videoUrl ||
    occasion?.video_url ||
    occasion?.youtubeUrl ||
    occasion?.youtube_url ||
    ""
  );
}

function extractYoutubeVideoId(url = "") {
  if (!url) return "";

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v) return v;

      const parts = parsed.pathname.split("/").filter(Boolean);

      const embedIndex = parts.indexOf("embed");
      if (embedIndex !== -1 && parts[embedIndex + 1]) {
        return parts[embedIndex + 1];
      }

      const shortsIndex = parts.indexOf("shorts");
      if (shortsIndex !== -1 && parts[shortsIndex + 1]) {
        return parts[shortsIndex + 1];
      }
    }

    if (parsed.hostname.includes("youtu.be")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0]) return parts[0];
    }

    return "";
  } catch {
    return "";
  }
}

function getYoutubeEmbedUrl(url = "") {
  const id = extractYoutubeVideoId(url);
  if (!id) return "";
  return `https://www.youtube.com/embed/${id}`;
}

export default function OccasionDetails() {
  const { serviceId, occasionId } = useParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [occasionId]);

  const { data: occasions = [] } = useQuery({
    queryKey: ["occasions", serviceId],
    queryFn: () => fetchOccasions(serviceId),
    enabled: !!serviceId,
    staleTime: 60_000,
  });

  const occasion = useMemo(() => {
    return occasions.find((o) => String(o.id) === String(occasionId)) || {};
  }, [occasions, occasionId]);

  const { data: photos = [] } = useQuery({
    queryKey: ["photos", occasionId],
    queryFn: () => fetchPhotos(occasionId),
    enabled: !!occasionId,
    staleTime: 60_000,
  });

  const photoUrls = useMemo(() => photos.map(pickPhotoUrl).filter(Boolean), [photos]);

  const title = occasion.title || occasion.name || "التغطية";
  const desc = occasion.description || "";
  const date = occasion.date || "";
  const day = occasion.day || occasion.weekday || getWeekdayName(date);
  const cover = resolveUrl(pickOccasionCover(occasion));
  const videoUrl = pickOccasionVideoUrl(occasion);
  const youtubeEmbedUrl = getYoutubeEmbedUrl(videoUrl);

  const showBlessing = normalizeBoolean(occasion?.showBlessing, true);

  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const metaImage = cover || photoUrls[0] || "";

  return (
    <section className="min-h-screen bg-[#202C28] font-Vazirmatn">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc || `شاهد تفاصيل تغطية ${title}`} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc || `شاهد تفاصيل تغطية ${title}`} />
        <meta property="og:url" content={pageUrl} />
        {metaImage ? <meta property="og:image" content={metaImage} /> : null}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={desc || `شاهد تفاصيل تغطية ${title}`} />
        {metaImage ? <meta name="twitter:image" content={metaImage} /> : null}
      </Helmet>

      <div dir="rtl" className="relative h-[100vh] min-h-[380px] bg-[#202C28] overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
        ) : (
          <div className="absolute inset-0 bg-[#202C28]" />
        )}

        <div className="absolute inset-0 bg-black/45" />

        <div className="absolute inset-0 flex items-center justify-center px-4 z-10">
          <h1 className="translate-y-8 md:translate-y-12 text-[#E7F2E2] text-3xl md:text-5xl font-bold text-center">
            {title}
          </h1>
        </div>
      </div>

      <div dir="rtl" className="relative z--20 -mt-16 sm:-mt-30 md:-mt-20 lg:-mt-30 pointer-events-none">
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 800 300"
            preserveAspectRatio="none"
            className="block w-full h-[220px] sm:h-[245px] md:h-[300px] lg:h-[340px]"
          >
            <path
              d="M0,115 C0,40 100,-10 220,10 C340,30 420,50 480,60 L480,150 L0,150 Z"
              fill="#DCA849"
            />
            <path
              d="M0,115 C150,140 300,100 450,60 C580,25 700,35 770,60 C790,68 800,85 800,110 L800,300 L0,300 Z"
              fill="#DCE8D4"
            />
          </svg>
        </div>
      </div>

      <div dir="rtl" className="relative z-10 bg-[#DEE9D9] -mt-20 sm:-mt-24 md:-mt-28 lg:-mt-28">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="flex justify-between text-[#3C635A] font-semibold text-lg">
            <div>{day || " "}</div>
            <div>{date || " "}</div>
          </div>

          {showBlessing ? (
            <div className="mt-8 flex justify-center">
              <img
                src="/imgs/ppp.png"
                alt="بارك الله لهما"
                className="max-w-[100%] h-auto"
                loading="lazy"
              />
            </div>
          ) : null}

          {desc ? (
            <div className="mt-6 text-center text-[#3C635A] leading-8 text-lg whitespace-pre-line">
              {desc}
            </div>
          ) : null}

          {youtubeEmbedUrl ? (
            <div className="mt-10">
              <div className="rounded-md overflow-hidden border border-[#3C635A]/20 bg-black">
                <iframe
                  className="w-full aspect-video"
                  src={youtubeEmbedUrl}
                  title={title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          ) : null}

          <div className="mt-10 space-y-5 overflow-hidden h-full">
            {photoUrls.map((src, i) => (
              <img
                key={src + i}
                src={src}
                alt=""
                className="block w-full h-full rounded"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-20 -mt-14 sm:-mt-18 md:-mt-22 lg:-mt-28 pointer-events-none">
        <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
          <div className="w-full overflow-hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 800 300"
              preserveAspectRatio="none"
              className="block w-full h-[220px] sm:h-[260px] md:h-[300px] lg:h-[340px] scale-x-[-1] scale-y-[-1]"
            >
              <path
                d="M0,115 C0,40 100,-10 220,10 C340,30 420,50 480,60 L480,150 L0,150 Z"
                fill="#DCA849"
              />
              <path
                d="M0,115 C150,140 300,100 450,60 C580,25 700,35 770,60 C790,68 800,85 800,110 L800,300 L0,300 Z"
                fill="#DCE8D4"
              />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}