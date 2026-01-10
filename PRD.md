# Product Requirements Document: Emerse Photo Explorer

## Overview

Emerse is a Progressive Web App (PWA) for showcasing and exploring a personal photo portfolio. It enables users to upload, organize, and browse their work with an intuitive mobile-first interface featuring dynamic clustering and gesture-based navigation.

---

## Goals

1. **Showcase work** - Present photos professionally for portfolio purposes
2. **Explore past work** - Easily rediscover and browse historical photos
3. **Mobile-optimized** - PWA with native-like gestures and performance

---

## Core Features

### 1. Photo Upload & Storage
- Cloud storage via Amazon S3
- Multi-resolution compression on upload:
  - Thumbnail (150px)
  - Small (400px)
  - Medium (800px)
  - Large (1600px)
  - Original (full resolution)
- Progress indicator during upload
- Batch upload support

### 2. Photo Clustering & Organization
- Automatic clustering by:
  - **Date** - Group by day/week/month/year
  - **Location** - Group by GPS coordinates/city
  - **Person** - Face detection & grouping (future phase)
- User-switchable filter/ordering modes
- Smooth transitions between cluster views

### 3. Gesture-Based Grid Navigation
- **Pinch-to-zoom** interaction:
  - Zoom out → More photos, smaller thumbnails
  - Zoom in → Fewer photos, larger thumbnails
- Smooth, performant animations
- Multiple density levels (e.g., 2, 3, 4, 6, 8 columns)

### 4. Photo Viewer
- Full-screen photo view on tap
- Swipe navigation between photos
- Metadata display (date, location, camera info)
- Zoom and pan within photo

### 5. Progressive Web App
- Installable on mobile home screen
- Offline viewing of cached photos
- Service worker for asset caching
- Responsive design (mobile-first)

---

## Technical Requirements

| Category | Requirement |
|----------|-------------|
| Frontend | React/Next.js or similar modern framework |
| Styling | Tailwind CSS or CSS-in-JS |
| Storage | Amazon S3 with presigned URLs |
| Backend | Serverless (AWS Lambda) or lightweight API |
| Database | PostgreSQL or DynamoDB for metadata |
| Image Processing | Sharp.js or AWS Lambda for compression |
| Testing | Playwright for browser/e2e tests |
| PWA | Service worker, manifest.json, HTTPS |

---

## User Stories

1. As a user, I can upload photos and have them automatically compressed into multiple sizes
2. As a user, I can browse my photos in a grid that clusters by date
3. As a user, I can switch clustering mode to group by location
4. As a user, I can pinch to zoom out and see more photos at once
5. As a user, I can pinch to zoom in and see fewer, larger photos
6. As a user, I can tap a photo to view it full-screen
7. As a user, I can install the app on my phone's home screen
8. As a user, I can view recently loaded photos offline

---

## Work Breakdown Structure

### Phase 1: Foundation
| Task | Description | Priority |
|------|-------------|----------|
| 1.1 | Project setup (Next.js, TypeScript, Tailwind) | P0 |
| 1.2 | PWA configuration (manifest, service worker) | P0 |
| 1.3 | Playwright test infrastructure setup | P0 |
| 1.4 | Basic responsive layout/shell | P0 |
| 1.5 | Authentication setup (private by default) | P0 |
| 1.6 | Database schema design (photos, tags, shares) | P0 |

### Phase 2: Storage & Upload
| Task | Description | Priority |
|------|-------------|----------|
| 2.1 | S3 bucket setup with proper permissions | P0 |
| 2.2 | Image upload API endpoint | P0 |
| 2.3 | Client-side image compression (pre-upload) | P0 |
| 2.4 | Server-side multi-resolution generation | P0 |
| 2.5 | Upload progress UI with preview | P0 |
| 2.6 | Batch upload support | P1 |
| 2.7 | Database schema for photo metadata | P0 |

### Phase 3: Photo Grid & Clustering
| Task | Description | Priority |
|------|-------------|----------|
| 3.1 | Basic photo grid component | P0 |
| 3.2 | Virtualized scrolling for performance (1K-10K scale) | P0 |
| 3.3 | Date-based clustering logic | P0 |
| 3.4 | Cluster headers (e.g., "January 2024") | P0 |
| 3.5 | Location-based clustering | P1 |
| 3.6 | Cluster mode switcher UI | P1 |
| 3.7 | Smooth cluster transitions | P2 |

### Phase 3.5: Search & Tagging
| Task | Description | Priority |
|------|-------------|----------|
| 3.8 | Manual tagging UI on photos | P0 |
| 3.9 | Tag management (create, edit, delete) | P0 |
| 3.10 | Keyword search across tags/metadata | P0 |
| 3.11 | Search results view | P0 |
| 3.12 | Filter by tags in grid view | P1 |

### Phase 4: Gesture Navigation
| Task | Description | Priority |
|------|-------------|----------|
| 4.1 | Research: Playbook app UI/UX patterns | P0 |
| 4.2 | Pinch-to-zoom gesture detection | P0 |
| 4.3 | Dynamic column count based on zoom level | P0 |
| 4.4 | Smooth grid resize animations | P1 |
| 4.5 | Momentum/inertia on gesture release | P2 |

### Phase 5: Photo Viewer
| Task | Description | Priority |
|------|-------------|----------|
| 5.1 | Full-screen photo modal | P0 |
| 5.2 | Swipe between photos | P0 |
| 5.3 | Pinch-to-zoom within photo | P1 |
| 5.4 | Metadata panel (EXIF data) | P2 |
| 5.5 | Share functionality | P2 |

### Phase 6: Polish & Optimization
| Task | Description | Priority |
|------|-------------|----------|
| 6.1 | Lazy loading with blur-up placeholders | P1 |
| 6.2 | Offline support (service worker caching) | P1 |
| 6.3 | Performance optimization | P1 |
| 6.4 | Accessibility audit | P2 |
| 6.5 | Cross-browser testing | P1 |

### Phase 7: Public Sharing
| Task | Description | Priority |
|------|-------------|----------|
| 7.1 | Generate shareable portfolio links | P1 |
| 7.2 | Public gallery view (no auth required) | P1 |
| 7.3 | Share link management (revoke, expiry) | P1 |
| 7.4 | Customizable public gallery appearance | P2 |

### Future Phases
| Task | Description | Priority |
|------|-------------|----------|
| F.1 | Face detection & person clustering | P3 |
| F.2 | AI-powered tagging/search | P3 |
| F.3 | Album/collection creation | P2 |

---

## Research Items

1. **Playbook App** - Study their upload flow, compression UI, and grid interactions
2. **Google Photos/iOS Photos** - Reference for pinch-to-zoom grid behavior
3. **Image compression libraries** - Compare browser-image-compression, Sharp.js, Squoosh
4. **Virtualization** - Evaluate react-window, react-virtuoso, or tanstack-virtual

---

## Success Metrics

- Upload completes within 5 seconds for typical photo
- Grid scroll maintains 60fps
- Pinch-to-zoom gesture feels native
- PWA scores 90+ on Lighthouse
- Full test coverage for critical paths

---

## Decisions

| Question | Decision |
|----------|----------|
| Privacy model | Private by default with optional public sharing |
| Expected photo volume | Medium (1K-10K photos) |
| Face recognition | Deferred to future phase |
| Search/tagging | Include in Phase 1 |

---

## Development Workflow: Manual Tasks

**All tasks requiring human input are deferred.** This includes:
- AWS account setup and S3 bucket creation
- Credential generation (API keys, secrets)
- Third-party service integrations
- Domain/DNS configuration
- Environment variable setup
- Any external service provisioning

**Approach:**
1. **Assume it works** - Development proceeds with mock/placeholder configurations
2. **Document in `MANUAL_SETUP.md`** - All manual steps are collected in a single file with detailed, step-by-step instructions
3. **Batch execution** - User completes all manual tasks at once when ready

This allows uninterrupted development flow. The `MANUAL_SETUP.md` file will be updated throughout development as new manual requirements are discovered.
