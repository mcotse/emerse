import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  processUploadedImage,
  generateResolution,
  type ResolutionName,
  IMAGE_RESOLUTIONS,
} from "@/lib/imageProcessing";

// Maximum file size: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 20MB limit" },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image and generate all variants
    const result = await processUploadedImage(buffer);

    // Return metadata and variant info (not the actual buffers for JSON response)
    return NextResponse.json({
      success: true,
      metadata: result.metadata,
      blurPlaceholder: result.blurPlaceholder,
      variants: result.variants.map((v) => ({
        resolution: v.resolution,
        width: v.width,
        height: v.height,
        format: v.format,
        size: v.size,
      })),
    });
  } catch (error) {
    console.error("Image processing error:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to resize an image on-the-fly
 * Usage: /api/images/process?url=<imageUrl>&resolution=<thumbnail|small|medium|large>
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");
  const resolution = searchParams.get("resolution") as ResolutionName | null;
  const format = (searchParams.get("format") as "webp" | "jpeg") || "webp";

  if (!imageUrl) {
    return NextResponse.json(
      { error: "Image URL required" },
      { status: 400 }
    );
  }

  if (!resolution || !(resolution in IMAGE_RESOLUTIONS)) {
    return NextResponse.json(
      { error: "Valid resolution required (thumbnail, small, medium, large, original)" },
      { status: 400 }
    );
  }

  try {
    // Fetch the original image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 400 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate the requested resolution
    const processed = await generateResolution(buffer, resolution, format);

    // Return the processed image
    return new NextResponse(new Uint8Array(processed.buffer), {
      headers: {
        "Content-Type": format === "webp" ? "image/webp" : "image/jpeg",
        "Content-Length": processed.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Image-Width": processed.width.toString(),
        "X-Image-Height": processed.height.toString(),
      },
    });
  } catch (error) {
    console.error("Image resize error:", error);
    return NextResponse.json(
      { error: "Failed to resize image" },
      { status: 500 }
    );
  }
}
