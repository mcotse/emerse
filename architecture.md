# Emerse Architecture

## System Overview

Emerse is a Progressive Web App (PWA) for personal photo portfolio management built with Next.js 16, React, and TypeScript.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser/PWA)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   AppShell  │  │  PhotoGrid  │  │ PhotoViewer │  │ UploadModal │        │
│  │  (Layout)   │  │(Virtualized)│  │ (Gestures)  │  │ (Compress)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  SearchBar  │  │  TagFilter  │  │ TagManager  │  │AlbumManager │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │                         Custom Hooks                              │      │
│  │  usePinchZoom | useImageCompression | useDarkMode | usePhotoDelete│      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │                      Service Worker (Serwist)                     │      │
│  │              Offline Caching | Background Sync | PWA              │      │
│  └──────────────────────────────────────────────────────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NEXT.JS SERVER (App Router)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                        Middleware (Auth)                         │       │
│  │         NextAuth.js | JWT Sessions | Route Protection            │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                          API Routes                              │       │
│  │  /api/auth/*    │  /api/upload  │  /api/share  │  /api/photos/* │       │
│  │  /api/albums    │  /api/images/process                          │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                           Pages                                  │       │
│  │      /           │    /login     │   /share/[id]  │  /settings  │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                                      │
                    │                                      │
                    ▼                                      ▼
┌──────────────────────────────┐          ┌──────────────────────────────────┐
│        PostgreSQL            │          │           Amazon S3              │
│    (Prisma ORM)              │          │       (Photo Storage)            │
├──────────────────────────────┤          ├──────────────────────────────────┤
│  User     │  Photo           │          │                                  │
│  Tag      │  PhotoTag        │          │  uploads/{userId}/{timestamp}/   │
│  Share    │  SharePhoto      │          │    ├── original.jpg              │
│                              │          │    ├── large.jpg    (1600px)     │
└──────────────────────────────┘          │    ├── medium.jpg   (800px)      │
                                          │    ├── small.jpg    (400px)      │
                                          │    └── thumbnail.jpg (150px)     │
                                          │                                  │
                                          └──────────────────────────────────┘
```

---

## Core Data Flows

### 1. Authentication Flow

```
┌──────────┐    ┌───────────────┐    ┌──────────────┐    ┌──────────┐
│  User    │───▶│  /login page  │───▶│ NextAuth.js  │───▶│   JWT    │
│          │    │  LoginForm    │    │  Credentials │    │  Token   │
└──────────┘    └───────────────┘    └──────────────┘    └──────────┘
                                              │
                                              ▼
                                     ┌──────────────┐
                                     │  Session     │
                                     │  (user.id)   │
                                     └──────────────┘

Protected Routes: All routes except /login, /share/*, /api/auth/*
```

### 2. Photo Upload Flow

```
┌─────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────┐
│  User   │──▶│ UploadModal │──▶│ Compress    │──▶│ POST        │──▶│ S3  │
│ selects │   │ drag-drop   │   │ (browser-   │   │ /api/upload │   │     │
│ files   │   │ preview     │   │  image-     │   │ presigned   │   │     │
└─────────┘   └─────────────┘   │  compress)  │   │ URL         │   │     │
                                └─────────────┘   └─────────────┘   └─────┘
                                      │                                  │
                                      │ Max 2MB target                   │
                                      │ Max 2048px                       │
                                      ▼                                  │
                                ┌─────────────┐                          │
                                │ Progress UI │◀─────────────────────────┘
                                │ per file    │      Direct upload
                                └─────────────┘
```

### 3. Photo Grid Display Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Photos    │───▶│  Filter by  │───▶│  Cluster    │───▶│ Virtualized │
│   (state)   │    │    Tags     │    │  by Mode    │    │    Grid     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                             │
                          ┌──────────────────┼──────────────────┐
                          ▼                  ▼                  ▼
                   ┌───────────┐      ┌───────────┐      ┌───────────┐
                   │  By Month │      │  By Day   │      │By Location│
                   │ "Jan 2024"│      │ "Today"   │      │ "New York"│
                   └───────────┘      └───────────┘      └───────────┘

Grid Features:
- @tanstack/react-virtual for row virtualization
- Pinch-to-zoom: 2-8 columns
- Blur-up placeholder loading
- CSS containment for performance
```

### 4. Photo Viewer Flow

```
┌───────────┐    ┌───────────────────────────────────────────────────┐
│ Tap Photo │───▶│                  PhotoViewer                      │
└───────────┘    │  ┌─────────────────────────────────────────────┐  │
                 │  │              Full-screen Image               │  │
                 │  │                                              │  │
                 │  │   ◀ Swipe Left/Right ▶                       │  │
                 │  │   Pinch to Zoom (1x-4x)                      │  │
                 │  │   Double-tap for 2x                          │  │
                 │  │                                              │  │
                 │  └─────────────────────────────────────────────┘  │
                 │                                                   │
                 │  ┌─────────────────────────────────────────────┐  │
                 │  │  Metadata Panel (slide-in)                  │  │
                 │  │  - Date taken        - Camera/Lens          │  │
                 │  │  - Dimensions        - Aperture/ISO         │  │
                 │  │  - Location          - Tags (editable)      │  │
                 │  └─────────────────────────────────────────────┘  │
                 └───────────────────────────────────────────────────┘

Navigation: Arrow keys | Swipe | Prev/Next buttons | Escape to close
```

### 5. Share Flow

```
┌──────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  User    │───▶│ Click Share │───▶│ POST        │───▶│ Generate    │
│  in      │    │ in Viewer   │    │ /api/share  │    │ nanoid(12)  │
│  Viewer  │    │             │    │             │    │ share link  │
└──────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                              │
                                                              ▼
                                                      ┌───────────────┐
                                                      │ /share/[id]   │
                                                      │ Public page   │
                                                      │ (no auth)     │
                                                      └───────────────┘

Share Settings:
- Theme: dark/light/auto
- Layout: grid/masonry/slideshow
- Columns: 2/3/4/6
- Expiry: optional (days)
- Allow download: yes/no
```

### 6. Search Flow

```
┌──────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  User    │───▶│  SearchBar  │───▶│searchPhotos │───▶│SearchResults│
│  types   │    │ w/ suggest  │    │ multi-field │    │ grid view   │
└──────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                      │
                      ▼
              Search Fields:
              - Tags (name match)
              - Camera model
              - Lens
              - Location
              - Date
              - Aperture, ISO, focal length
```

---

## Component Hierarchy

```
App
├── SessionProvider (NextAuth)
│   └── Layout (RootLayout)
│       ├── ServiceWorkerRegistration
│       └── Page (Home)
│           ├── AppShell
│           │   ├── Header
│           │   │   ├── Logo/Title
│           │   │   ├── SearchBar
│           │   │   ├── ClusterModeSwitcher (Month|Day|Location)
│           │   │   ├── DarkModeToggle
│           │   │   └── UserMenu (sign out)
│           │   ├── TagFilter (horizontal scroll)
│           │   └── {children}
│           │
│           ├── ClusteredPhotoGrid
│           │   └── VirtualizedPhotoGrid
│           │       └── PhotoGridItem (with blur placeholder)
│           │
│           ├── PhotoViewer (modal)
│           │   ├── Image (zoomable)
│           │   ├── Navigation controls
│           │   ├── MetadataPanel
│           │   └── TagInput
│           │
│           ├── UploadModal
│           │   ├── Dropzone
│           │   ├── FilePreview
│           │   └── ProgressBar
│           │
│           ├── TagManager (modal)
│           ├── ShareManager (modal)
│           └── AlbumManager (modal)
│
└── /share/[id] (public page, no auth)
    └── Public gallery view
```

---

## Database Schema (Prisma)

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│     User     │       │    Photo     │       │     Tag      │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (cuid)    │◀──┐   │ id (cuid)    │   ┌──▶│ id (cuid)    │
│ email        │   │   │ userId    ───┼───┘   │ userId    ───┼───┐
│ name         │   │   │ s3KeyOriginal│       │ name         │   │
│ createdAt    │   │   │ s3KeyLarge   │       │ color        │   │
│ updatedAt    │   │   │ s3KeyMedium  │       └──────────────┘   │
└──────────────┘   │   │ s3KeySmall   │                          │
       │           │   │ s3KeyThumb   │       ┌──────────────┐   │
       │           │   │ filename     │       │   PhotoTag   │   │
       │           │   │ mimeType     │       ├──────────────┤   │
       │           │   │ fileSize     │◀──────│ photoId      │   │
       │           │   │ width/height │       │ tagId     ───┼───┘
       │           │   │ takenAt      │       └──────────────┘
       │           │   │ lat/lng      │
       │           │   │ city/country │       ┌──────────────┐
       │           │   │ camera info  │       │    Share     │
       │           │   │ EXIF data    │       ├──────────────┤
       │           │   │ status       │   ┌──▶│ id (cuid)    │
       │           │   └──────────────┘   │   │ userId    ───┼───┐
       │           │          │           │   │ slug         │   │
       │           └──────────┼───────────┘   │ title        │   │
       │                      │               │ isActive     │   │
       │                      │               │ expiresAt    │   │
       │                      ▼               │ viewCount    │   │
       │               ┌──────────────┐       └──────────────┘   │
       │               │  SharePhoto  │              │           │
       │               ├──────────────┤              │           │
       │               │ shareId   ───┼──────────────┘           │
       │               │ photoId      │                          │
       │               │ sortOrder    │                          │
       └───────────────┼──────────────┼──────────────────────────┘
                       └──────────────┘
```

---

## Key Libraries

| Category | Library | Purpose |
|----------|---------|---------|
| Framework | Next.js 16 | App Router, SSR, API routes |
| Styling | Tailwind CSS v4 | Utility-first CSS |
| Auth | NextAuth.js v5 | JWT sessions, credentials provider |
| Database | Prisma v7 | Type-safe ORM for PostgreSQL |
| Storage | @aws-sdk/client-s3 | S3 uploads with presigned URLs |
| Virtualization | @tanstack/react-virtual | Efficient list rendering |
| Compression | browser-image-compression | Client-side image resize |
| PWA | Serwist | Service worker, offline cache |
| IDs | nanoid | Short unique IDs for shares |

---

## Performance Optimizations (Planned P0)

1. **Progressive Image Loading** - Low-res default, high-res on demand
2. **Responsive srcset** - Serve optimal size per device
3. **Preload Adjacent Images** - In viewer, preload N+1 and N-1
4. **WebP/AVIF Support** - Modern formats for smaller files
5. **Service Worker Caching** - Cache-first for images
6. **IndexedDB Cache** - Offline photo metadata + thumbnails
7. **CDN Edge Caching** - CloudFront in front of S3
8. **Memory Management** - Release images when scrolled away
9. **Prefetch on Hover** - Start loading before click
10. **Code Splitting** - Lazy load modals and heavy components
11. **Virtualized Grid Tuning** - CSS containment, debounced resize
12. **Background Upload Queue** - Persist and retry uploads

---

## Security Model

- **Private by default**: All routes require authentication
- **Public exceptions**: `/login`, `/share/*`, `/api/auth/*`
- **Presigned URLs**: Direct S3 upload, no server relay
- **JWT Sessions**: Stateless auth tokens
- **User isolation**: All data scoped to `userId`
- **Share expiry**: Optional time-limited public links
