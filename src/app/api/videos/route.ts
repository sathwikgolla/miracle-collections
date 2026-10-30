import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { YouTubeVideoItem } from "@/lib/adminTypes";
import { SEED_YOUTUBE_VIDEOS } from "@/data/adminSeed";

const DATA_FILE = path.join(process.cwd(), "src", "data", "adminVideos.json");

function readVideos(): YouTubeVideoItem[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.error("Error reading adminVideos.json:", error);
  }
  return SEED_YOUTUBE_VIDEOS;
}

function writeVideos(videos: YouTubeVideoItem[]): boolean {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(videos, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing adminVideos.json:", error);
    return false;
  }
}

export async function GET() {
  const videos = readVideos();
  return NextResponse.json(videos, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Expected an array of videos" },
        { status: 400 }
      );
    }

    const ok = writeVideos(body);
    if (!ok) {
      return NextResponse.json(
        { error: "Failed to persist videos to server storage" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, count: body.length });
  } catch (error) {
    console.error("Error in POST /api/videos:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
