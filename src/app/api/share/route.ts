import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";

// Gallery appearance customization options
export interface GallerySettings {
  theme: "dark" | "light" | "auto";
  layout: "grid" | "masonry" | "slideshow";
  columns: 2 | 3 | 4 | 6;
  showTitle: boolean;
  title?: string;
  showDescription: boolean;
  description?: string;
  showWatermark: boolean;
  allowDownload: boolean;
  accentColor?: string;
}

const DEFAULT_GALLERY_SETTINGS: GallerySettings = {
  theme: "dark",
  layout: "grid",
  columns: 3,
  showTitle: false,
  showDescription: false,
  showWatermark: true,
  allowDownload: false,
};

// In-memory store for shares (will be replaced with database)
const shares = new Map<
  string,
  {
    userId: string;
    photoIds: string[];
    createdAt: Date;
    expiresAt?: Date;
    viewCount: number;
    settings: GallerySettings;
  }
>();

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { photoIds, expiresInDays, settings: customSettings } = await request.json();

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { error: "At least one photo ID is required" },
        { status: 400 }
      );
    }

    // Generate unique share ID
    const shareId = nanoid(12);

    // Calculate expiry if specified
    let expiresAt: Date | undefined;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Merge custom settings with defaults
    const settings: GallerySettings = {
      ...DEFAULT_GALLERY_SETTINGS,
      ...customSettings,
    };

    // Store share
    shares.set(shareId, {
      userId: session.user.id,
      photoIds,
      createdAt: new Date(),
      expiresAt,
      viewCount: 0,
      settings,
    });

    const shareUrl = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/share/${shareId}`;

    return NextResponse.json({
      shareId,
      shareUrl,
      expiresAt: expiresAt?.toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create share" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shareId = searchParams.get("id");
  const listMode = searchParams.get("list");

  // List all shares for current user
  if (listMode === "true") {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userShares: Array<{
      id: string;
      photoIds: string[];
      createdAt: string;
      expiresAt?: string;
      viewCount: number;
      expired: boolean;
    }> = [];

    for (const [id, share] of shares.entries()) {
      if (share.userId === session.user.id) {
        const expired = share.expiresAt ? new Date() > share.expiresAt : false;
        userShares.push({
          id,
          photoIds: share.photoIds,
          createdAt: share.createdAt.toISOString(),
          expiresAt: share.expiresAt?.toISOString(),
          viewCount: share.viewCount,
          expired,
        });
      }
    }

    // Sort by creation date (newest first)
    userShares.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ shares: userShares });
  }

  // Get single share by ID
  if (!shareId) {
    return NextResponse.json({ error: "Share ID required" }, { status: 400 });
  }

  const share = shares.get(shareId);

  if (!share) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  // Check expiry
  if (share.expiresAt && new Date() > share.expiresAt) {
    return NextResponse.json({ error: "Share has expired" }, { status: 410 });
  }

  // Increment view count
  share.viewCount++;

  return NextResponse.json({
    photoIds: share.photoIds,
    createdAt: share.createdAt.toISOString(),
    viewCount: share.viewCount,
    settings: share.settings,
  });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const shareId = searchParams.get("id");

  if (!shareId) {
    return NextResponse.json({ error: "Share ID required" }, { status: 400 });
  }

  const share = shares.get(shareId);

  if (!share) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  // Check ownership
  if (share.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  shares.delete(shareId);

  return NextResponse.json({ success: true });
}
