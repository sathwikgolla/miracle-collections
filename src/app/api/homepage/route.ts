import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { AdminHomepageConfig } from "@/lib/homepageTypes";

const DATA_FILE = path.join(process.cwd(), "src", "data", "adminHomepage.json");

function readHomepageConfig(): AdminHomepageConfig | null {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf8");
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.sections)) {
        return parsed as AdminHomepageConfig;
      }
    }
  } catch (error) {
    console.error("Error reading adminHomepage.json:", error);
  }
  return null;
}

function writeHomepageConfig(config: AdminHomepageConfig): boolean {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(config, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing adminHomepage.json:", error);
    return false;
  }
}

export async function GET() {
  const config = readHomepageConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Homepage configuration not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(config, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !Array.isArray(body.sections)) {
      return NextResponse.json(
        { error: "Invalid homepage configuration payload" },
        { status: 400 }
      );
    }

    const ok = writeHomepageConfig(body as AdminHomepageConfig);
    if (!ok) {
      return NextResponse.json(
        { error: "Failed to persist homepage configuration" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sectionsCount: body.sections.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in POST /api/homepage:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
