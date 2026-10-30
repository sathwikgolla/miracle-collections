import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Home, Video } from "lucide-react";
import { VideoShowcase } from "@/components/home/VideoShowcase";

export const metadata: Metadata = {
  title: "YouTube Videos — Miracle Collections Studio",
  description: "Watch our latest ethnic collections, lookbooks, and fashion styles in motion on Miracle Collections.",
};

export default function VideosPage() {
  return (
    <main className="flex-1 pb-16">
      {/* Breadcrumb Header */}
      <div className="border-b border-neutral-100 bg-[#FAF7F2]">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 text-xs text-neutral-500 sm:px-6">
          <Link href="/" className="flex items-center gap-1 transition-colors hover:text-black">
            <Home size={13} />
            <span>Home</span>
          </Link>
          <ChevronRight size={12} className="text-neutral-400" />
          <span className="flex items-center gap-1 font-semibold text-neutral-900">
            <Video size={13} className="text-rose-600" />
            <span>YouTube Videos</span>
          </span>
        </div>
      </div>

      {/* Dedicated Video Showcase */}
      <VideoShowcase />
    </main>
  );
}
