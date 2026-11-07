"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { cn, discountPercent, handleImageError } from "@/lib/utils";

export function ProductImageZoom({
  images,
  price,
  mrp,
  alt,
}: {
  images: string[];
  price: number;
  mrp: number;
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCanHover(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
    }
  }, []);

  const pct = discountPercent(mrp, price);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canHover) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  const next = () => setActive((a) => (a + 1) % images.length);
  const prev = () => setActive((a) => (a - 1 + images.length) % images.length);

  return (
    <>
      <div className="relative overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <div
          className="relative aspect-square w-full cursor-zoom-in overflow-hidden touch-manipulation"
          onMouseMove={onMove}
          onMouseEnter={() => {
            if (canHover) setIsHovered(true);
          }}
          onMouseLeave={() => {
            setIsHovered(false);
            setOrigin("50% 50%");
          }}
          onClick={() => setZoom(true)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[active]}
            alt={alt}
            decoding="async"
            onError={handleImageError}
            className="h-full w-full object-cover transition-transform duration-200"
            style={{
              transformOrigin: origin,
              transform: canHover && isHovered && !zoom ? "scale(1.6)" : "scale(1)",
            }}
          />
          <span className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-[11px] font-semibold text-white">
            <ZoomIn size={12} />
            <span className="hidden xs:inline">Click to zoom</span>
            <span className="xs:inline sm:hidden">Zoom</span>
          </span>
          {images.length > 1 && (
            <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white sm:hidden">
              {active + 1} / {images.length}
            </span>
          )}
        </div>
        {pct > 0 && (
          <span className="absolute left-2.5 top-2.5 sm:left-3 sm:top-3 rounded bg-green-700 px-2 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold text-white">
            {pct}% OFF
          </span>
        )}

        {/* Prev/next */}
        {images.length > 1 && (
          <>
            <button suppressHydrationWarning onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 flex h-8 w-8 sm:h-9 sm:w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow transition-colors hover:bg-white touch-manipulation"
            >
              <ChevronLeft size={18} className="sm:size-5" />
            </button>
            <button suppressHydrationWarning onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Next image"
              className="absolute right-2 top-1/2 flex h-8 w-8 sm:h-9 sm:w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow transition-colors hover:bg-white touch-manipulation"
            >
              <ChevronRight size={18} className="sm:size-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-2.5 sm:mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar touch-pan-x snap-x">
          {images.map((img, i) => (
            <button suppressHydrationWarning key={i}
              onClick={() => setActive(i)}
              className={cn(
                "h-14 w-14 sm:h-16 sm:w-16 shrink-0 snap-start overflow-hidden rounded-md border bg-white transition-all touch-manipulation",
                active === i
                  ? "border-black ring-1 ring-black opacity-100"
                  : "border-neutral-200 opacity-70 hover:border-neutral-400 hover:opacity-100"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt=""
                loading="lazy"
                decoding="async"
                onError={handleImageError}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen zoom modal */}
      {zoom && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-3 sm:p-6"
          onClick={() => setZoom(false)}
        >
          <button suppressHydrationWarning onClick={() => setZoom(false)}
            aria-label="Close zoom"
            className="absolute right-3 top-3 sm:right-5 sm:top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 touch-manipulation"
          >
            <X size={20} />
          </button>
          {images.length > 1 && (
            <>
              <button suppressHydrationWarning onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous image"
                className="absolute left-2 sm:left-4 top-1/2 z-10 flex h-10 w-10 sm:h-12 sm:w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 touch-manipulation"
              >
                <ChevronLeft size={22} className="sm:size-6" />
              </button>
              <button suppressHydrationWarning onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next image"
                className="absolute right-2 sm:right-4 top-1/2 z-10 flex h-10 w-10 sm:h-12 sm:w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 touch-manipulation"
              >
                <ChevronRight size={22} className="sm:size-6" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
                {active + 1} / {images.length}
              </div>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[active]}
            alt={alt}
            decoding="async"
            onError={handleImageError}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[82vh] max-w-[92vw] select-none object-contain"
          />
        </div>
      )}
    </>
  );
}
