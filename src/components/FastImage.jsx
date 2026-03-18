import { useEffect, useState } from "react";

export default function FastImage({
  src,
  alt = "",
  className = "",
  eager = false,
  onLoad,
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  return (
    <div className={`overflow-hidden ${className}`}>
      {/* Skeleton */}
      <div
        className={[
          "absolute inset-0 bg-black/25 animate-pulse transition-opacity duration-500",
          loaded || failed ? "opacity-0" : "opacity-100",
        ].join(" ")}
      />

      {!failed ? (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={eager ? "high" : "auto"}
          onLoad={(e) => {
            setLoaded(true);
            onLoad?.(e);
          }}
          onError={() => {
            setFailed(true);
            setLoaded(true);
          }}
          className={[
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-700",
            loaded ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
      ) : (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white/80 text-sm">
          Failed to load image
        </div>
      )}
    </div>
  );
}