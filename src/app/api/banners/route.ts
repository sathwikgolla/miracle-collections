import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { AdminBanner } from "@/lib/adminTypes";
import { SEED_BANNERS } from "@/data/adminSeed";

const DATA_FILE = path.join(process.cwd(), "src", "data", "adminBanners.json");

function readBanners(): AdminBanner[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.error("Error reading adminBanners.json:", error);
  }
  return SEED_BANNERS;
}

function writeBanners(banners: AdminBanner[]): boolean {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(banners, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing adminBanners.json:", error);
    return false;
  }
}

export async function GET() {
  const banners = readBanners();
  return NextResponse.json(banners, {
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
        { error: "Expected an array of banners" },
        { status: 400 }
      );
    }

    const ok = writeBanners(body);
    if (!ok) {
      return NextResponse.json(
        { error: "Failed to persist banners to server storage" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, count: body.length });
  } catch (error) {
    console.error("Error in POST /api/banners:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
