import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";

export interface Album {
  id: string;
  userId: string;
  name: string;
  description?: string;
  coverPhotoId?: string;
  photoIds: string[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
}

// In-memory store for albums (will be replaced with database)
const albums = new Map<string, Album>();

/**
 * GET /api/albums - List all albums or get single album
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const albumId = searchParams.get("id");

  // Get single album by ID
  if (albumId) {
    const album = albums.get(albumId);

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    // Check ownership or public status
    if (album.userId !== session.user.id && !album.isPublic) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      id: album.id,
      name: album.name,
      description: album.description,
      coverPhotoId: album.coverPhotoId,
      photoIds: album.photoIds,
      photoCount: album.photoIds.length,
      createdAt: album.createdAt.toISOString(),
      updatedAt: album.updatedAt.toISOString(),
      isPublic: album.isPublic,
      isOwner: album.userId === session.user.id,
    });
  }

  // List all user's albums
  const userAlbums: Array<{
    id: string;
    name: string;
    description?: string;
    coverPhotoId?: string;
    photoCount: number;
    createdAt: string;
    updatedAt: string;
    isPublic: boolean;
  }> = [];

  for (const album of albums.values()) {
    if (album.userId === session.user.id) {
      userAlbums.push({
        id: album.id,
        name: album.name,
        description: album.description,
        coverPhotoId: album.coverPhotoId,
        photoCount: album.photoIds.length,
        createdAt: album.createdAt.toISOString(),
        updatedAt: album.updatedAt.toISOString(),
        isPublic: album.isPublic,
      });
    }
  }

  // Sort by updated date (newest first)
  userAlbums.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return NextResponse.json({ albums: userAlbums });
}

/**
 * POST /api/albums - Create a new album
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, photoIds, isPublic } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Album name is required" },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "Album name must be 100 characters or less" },
        { status: 400 }
      );
    }

    const albumId = nanoid(12);
    const now = new Date();

    const album: Album = {
      id: albumId,
      userId: session.user.id,
      name: name.trim(),
      description: description?.trim(),
      coverPhotoId: photoIds?.[0],
      photoIds: Array.isArray(photoIds) ? photoIds : [],
      createdAt: now,
      updatedAt: now,
      isPublic: Boolean(isPublic),
    };

    albums.set(albumId, album);

    return NextResponse.json({
      id: album.id,
      name: album.name,
      description: album.description,
      photoCount: album.photoIds.length,
      createdAt: album.createdAt.toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create album" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/albums - Update an album
 */
export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, name, description, coverPhotoId, photoIds, isPublic } =
      await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Album ID is required" },
        { status: 400 }
      );
    }

    const album = albums.get(id);

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    if (album.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update fields if provided
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Album name cannot be empty" },
          { status: 400 }
        );
      }
      album.name = name.trim();
    }

    if (description !== undefined) {
      album.description = description?.trim() || undefined;
    }

    if (coverPhotoId !== undefined) {
      album.coverPhotoId = coverPhotoId;
    }

    if (photoIds !== undefined && Array.isArray(photoIds)) {
      album.photoIds = photoIds;
      // Update cover if not set
      if (!album.coverPhotoId && photoIds.length > 0) {
        album.coverPhotoId = photoIds[0];
      }
    }

    if (isPublic !== undefined) {
      album.isPublic = Boolean(isPublic);
    }

    album.updatedAt = new Date();

    return NextResponse.json({
      id: album.id,
      name: album.name,
      description: album.description,
      coverPhotoId: album.coverPhotoId,
      photoCount: album.photoIds.length,
      updatedAt: album.updatedAt.toISOString(),
      isPublic: album.isPublic,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update album" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/albums - Delete an album
 */
export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const albumId = searchParams.get("id");

  if (!albumId) {
    return NextResponse.json(
      { error: "Album ID is required" },
      { status: 400 }
    );
  }

  const album = albums.get(albumId);

  if (!album) {
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }

  if (album.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  albums.delete(albumId);

  return NextResponse.json({ success: true });
}

/**
 * PATCH /api/albums - Add/remove photos from album
 */
export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, action, photoIds } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Album ID is required" },
        { status: 400 }
      );
    }

    if (!action || !["add", "remove"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'add' or 'remove'" },
        { status: 400 }
      );
    }

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json(
        { error: "Photo IDs are required" },
        { status: 400 }
      );
    }

    const album = albums.get(id);

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    if (album.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (action === "add") {
      // Add photos (avoiding duplicates)
      const existingSet = new Set(album.photoIds);
      for (const photoId of photoIds) {
        if (!existingSet.has(photoId)) {
          album.photoIds.push(photoId);
          existingSet.add(photoId);
        }
      }
      // Set cover if not set
      if (!album.coverPhotoId && album.photoIds.length > 0) {
        album.coverPhotoId = album.photoIds[0];
      }
    } else {
      // Remove photos
      const removeSet = new Set(photoIds);
      album.photoIds = album.photoIds.filter((id) => !removeSet.has(id));
      // Update cover if removed
      if (album.coverPhotoId && removeSet.has(album.coverPhotoId)) {
        album.coverPhotoId = album.photoIds[0];
      }
    }

    album.updatedAt = new Date();

    return NextResponse.json({
      id: album.id,
      photoCount: album.photoIds.length,
      coverPhotoId: album.coverPhotoId,
      updatedAt: album.updatedAt.toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update album photos" },
      { status: 500 }
    );
  }
}
