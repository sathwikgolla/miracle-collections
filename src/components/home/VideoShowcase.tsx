"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Lock, LogIn, Play, Sparkles, Video, X } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import type { YouTubeVideoItem } from "@/lib/adminTypes";
import { cn, handleImageError } from "@/lib/utils";

const CHANNEL_URL = "https://www.youtube.com/@MiracleCollections-b1f";

export function VideoShowcase() {
  const { user } = useStore();
  // ONLY whatever the admin posts will be loaded and displayed here
  const [videos, setVideos] = useState<YouTubeVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<{
    id: string;
    title: string;
    videoId: string;
    embedUrl: string;
    url: string;
    tag?: string;
    description?: string;
  } | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Directly connect to Admin storage & server API
  useEffect(() => {
    let mounted = true;

    const syncWithAdmin = async () => {
      // 1. Immediately read client localStorage for instant display
      try {
        const raw = localStorage.getItem("miracle_admin_videos");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && mounted) {
            setVideos(parsed.filter((v: YouTubeVideoItem) => v.active !== false));
            setLoading(false);
          }
        }
      } catch {}

      // 2. Fetch authoritative server data from /api/videos (persisted by admin)
      try {
        const res = await fetch("/api/videos");
        if (res.ok) {
          const serverVideos = await res.json();
          if (Array.isArray(serverVideos) && mounted) {
            const activeOnly = serverVideos.filter((v: YouTubeVideoItem) => v.active !== false);
            setVideos(activeOnly);
            try {
              localStorage.setItem("miracle_admin_videos", JSON.stringify(serverVideos));
            } catch {}
          }
        }
      } catch (err) {
        console.error("Failed to sync videos with server API:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    syncWithAdmin();
    window.addEventListener("miracle_videos_updated", syncWithAdmin);
    window.addEventListener("storage", syncWithAdmin);
    return () => {
      mounted = false;
      window.removeEventListener("miracle_videos_updated", syncWithAdmin);
      window.removeEventListener("storage", syncWithAdmin);
    };
  }, []);

  // Users can watch collection videos after logging in
  const handleWatchVideo = (video: YouTubeVideoItem) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    const cleanId = video.videoId || "KFCkU1PGMhI";
    setActiveVideo({
      id: video.id,
      title: video.title,
      videoId: cleanId,
      embedUrl: `https://www.youtube.com/embed/${cleanId}?autoplay=1`,
      url: video.url || `https://youtube.com/shorts/${cleanId}`,
      tag: video.tag,
      description: video.description,
    });
  };

  return (
    <section id="videos" className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 scroll-mt-24">
      <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-8 lg:p-10">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-50 text-rose-600">
                <Video size={18} />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Miracle Collections Studio
              </span>
              {user ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  <Sparkles size={11} /> Member Access Unlocked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                  <Lock size={10} /> Login to Stream
                </span>
              )}
            </div>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-black sm:text-3xl">
              Watch & Discover Collections
            </h2>
            <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
              Watch our latest sarees, lehengas, and ethnic styles in motion {user ? "" : "(Members exclusive)"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!user && (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-black"
              >
                <LogIn size={13} />
                <span>Log in to Watch</span>
              </Link>
            )}
            <a
              href={CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              suppressHydrationWarning
              className="inline-flex items-center gap-1.5 self-start rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-bold text-neutral-800 transition-colors hover:border-black hover:bg-neutral-50 sm:self-auto"
            >
              <span>Visit YouTube Channel</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        {/* Video Shorts Grid: Displays ONLY whatever the admin posts */}
        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100 overflow-hidden">
                <div className="aspect-[9/14] w-full bg-neutral-200" />
                <div className="p-4 space-y-2 bg-white">
                  <div className="h-4 w-3/4 rounded bg-neutral-200" />
                  <div className="h-3 w-1/2 rounded bg-neutral-100" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <Video size={28} />
            </div>
            <h3 className="mt-3 text-base font-bold text-neutral-900">
              New videos are coming soon.
            </h3>
            <p className="mt-1 text-xs text-neutral-500 max-w-md mx-auto">
              Our lookbook videos are curated by our store team. Check back shortly or subscribe to our official channel for latest arrivals.
            </p>
            <a
              href={CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-black transition-colors"
            >
              <span>Explore Miracle Collections YouTube</span>
              <ExternalLink size={13} />
            </a>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 sm:gap-6">
            {videos.map((video) => {
              const externalUrl = video.url || `https://youtube.com/shorts/${video.videoId}`;
              const displayTag = video.tag || "Ethnic Collection";

              return (
                <div
                  key={video.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-900 shadow-sm transition-all duration-300 hover:shadow-md"
                >
                  {/* Thumbnail Container */}
                  <div
                    onClick={() => handleWatchVideo(video)}
                    className="relative aspect-[9/14] w-full cursor-pointer overflow-hidden bg-neutral-800"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
                      alt={video.title}
                      onError={handleImageError}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                    {/* Category Tag */}
                    <div className="absolute left-3 top-3">
                      <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                        {displayTag}
                      </span>
                    </div>

                    {/* Shorts Badge or Lock Status */}
                    <div className="absolute right-3 top-3">
                      {user ? (
                        <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-xs">
                          {video.duration || "Shorts"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-black/80 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-300 backdrop-blur-xs">
                          <Lock size={10} /> Login
                        </span>
                      )}
                    </div>

                    {/* Center Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-all duration-300 group-hover:scale-110",
                          user ? "bg-rose-600/95 group-hover:bg-rose-600" : "bg-neutral-900/90 border border-white/20 group-hover:bg-black"
                        )}
                      >
                        {user ? (
                          <Play size={24} className="ml-1 fill-white" />
                        ) : (
                          <Lock size={20} className="text-amber-300" />
                        )}
                      </div>
                    </div>

                    {/* Bottom title & channel info */}
                    <div className="absolute inset-x-0 bottom-0 p-4 space-y-1">
                      <p className="text-sm font-bold leading-snug text-white line-clamp-2">
                        {video.title}
                      </p>
                      {video.description && (
                        <p className="text-[11px] text-neutral-300 line-clamp-2 leading-relaxed font-normal">
                          {video.description}
                        </p>
                      )}
                      <p className="pt-0.5 text-[11px] font-medium text-neutral-400">
                        @MiracleCollections {video.views ? `• ${video.views} views` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between border-t border-neutral-800 bg-neutral-950 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleWatchVideo(video)}
                      suppressHydrationWarning
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white transition-colors hover:text-rose-400"
                    >
                      {user ? (
                        <>
                          <Play size={13} className="fill-current" />
                          <span>Watch Now</span>
                        </>
                      ) : (
                        <>
                          <Lock size={12} className="text-amber-300" />
                          <span>Login to Watch</span>
                        </>
                      )}
                    </button>
                    <a
                      href={externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      suppressHydrationWarning
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-400 transition-colors hover:text-white"
                    >
                      <span>Open on YouTube</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Login Prompt Modal (Shown when guest attempts to watch) */}
      {showLoginPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowLoginPrompt(false)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowLoginPrompt(false)}
              aria-label="Close modal"
              className="absolute right-4 top-4 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-black"
            >
              <X size={18} />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Lock size={22} />
            </div>

            <h3 className="mt-4 text-xl font-black tracking-tight text-neutral-900">
              Sign In to Watch Collections
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-600 sm:text-sm">
              Our <strong>Watch & Discover Collections</strong> video lookbooks and motion showcases are exclusively available for registered Miracle Collections members. Please sign in or create an account to start streaming.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 text-sm font-bold text-white transition-colors hover:bg-black"
              >
                <LogIn size={15} />
                <span>Log In / Sign Up</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowLoginPrompt(false)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-300 px-5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Video Player Modal (For Authenticated Users) */}
      {activeVideo && user && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => setActiveVideo(null)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-black shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900 px-4 py-3 text-white">
              <div className="truncate pr-2">
                {activeVideo.tag && (
                  <span className="inline-block rounded bg-rose-600/80 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase mr-1.5">
                    {activeVideo.tag}
                  </span>
                )}
                <span className="truncate text-xs font-bold">
                  {activeVideo.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                aria-label="Close video"
                suppressHydrationWarning
                className="rounded-full p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Video iframe */}
            <div className="relative aspect-[9/16] w-full bg-black">
              <iframe
                src={activeVideo.embedUrl}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>

            {/* Modal Description & Footer */}
            <div className="border-t border-neutral-800 bg-neutral-900 px-4 py-3 space-y-2">
              {activeVideo.description && (
                <p className="text-xs text-neutral-300 leading-relaxed font-normal">
                  {activeVideo.description}
                </p>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60">
                <span className="text-[11px] text-neutral-400">
                  Miracle Collections Studio
                </span>
                <a
                  href={activeVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  suppressHydrationWarning
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 hover:underline"
                >
                  <span>View on YouTube</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
