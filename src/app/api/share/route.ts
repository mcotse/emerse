import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";

// In-memory store for shares (will be replaced with database)
// Structure: { shareId: { userId, photoIds, createdAt, expiresAt? } }
const shares = new Map<
  string,
  {
    userId: string;
    photoIds: string[];
    createdAt: Date;
    expiresAt?: Date;
    viewCount: number;
  }
>();

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { photoIds, expiresInDays } = await request.json();

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

    // Store share
    shares.set(shareId, {
      userId: session.user.id,
      photoIds,
      createdAt: new Date(),
      expiresAt,
      viewCount: 0,
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
  });
}
