import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * GET /api/photos/download
 * Download a single photo or get download URLs for multiple photos
 *
 * Query params:
 * - id: Single photo ID for direct download
 * - ids: Comma-separated photo IDs for batch download info
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const singleId = searchParams.get("id");
  const batchIds = searchParams.get("ids");

  try {
    // Single photo download
    if (singleId) {
      // In production, we would:
      // 1. Verify user owns the photo
      // 2. Get the original resolution URL from S3
      // 3. Either redirect or return presigned URL

      // For mock, return a placeholder image URL
      const downloadUrl = `https://picsum.photos/seed/${singleId.replace("photo-", "")}/1600/1600`;

      return NextResponse.json({
        success: true,
        downloadUrl,
        filename: `photo-${singleId}.jpg`,
      });
    }

    // Batch download
    if (batchIds) {
      const ids = batchIds.split(",").filter(Boolean);

      if (ids.length === 0) {
        return NextResponse.json(
          { error: "No photo IDs provided" },
          { status: 400 }
        );
      }

      if (ids.length > 50) {
        return NextResponse.json(
          { error: "Maximum 50 photos can be downloaded at once" },
          { status: 400 }
        );
      }

      // In production, we would generate a zip file URL
      // For now, return individual download URLs
      const downloads = ids.map((id) => ({
        id,
        url: `https://picsum.photos/seed/${id.replace("photo-", "")}/1600/1600`,
        filename: `photo-${id}.jpg`,
      }));

      return NextResponse.json({
        success: true,
        count: downloads.length,
        downloads,
      });
    }

    return NextResponse.json(
      { error: "Photo ID(s) required" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to prepare download" },
      { status: 500 }
    );
  }
}
