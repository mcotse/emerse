# Manual Setup Guide

This file contains all manual setup tasks that require human input. Complete these steps when you're ready to connect the app to real services.

**Status:** This file will be updated throughout development as new requirements are discovered.

---

## Prerequisites

- [ ] AWS Account
- [ ] Node.js 18+ installed
- [ ] Git configured

---

## 1. AWS S3 Setup

*To be documented when implementing Phase 2 (Storage & Upload)*

---

## 2. Authentication Setup

*To be documented when implementing Phase 1 (Foundation)*

---

## 3. Database Setup

### Option A: Local PostgreSQL (Development)

1. Install PostgreSQL locally or use Docker:
   ```bash
   docker run --name emerse-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=emerse -p 5432:5432 -d postgres:16
   ```

2. Set DATABASE_URL in `.env`:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/emerse"
   ```

3. Run migrations:
   ```bash
   npm run db:push
   ```

### Option B: Cloud PostgreSQL (Production)

1. Provision a PostgreSQL database (e.g., Supabase, Neon, AWS RDS, Railway)
2. Get the connection string and set it as DATABASE_URL
3. Run migrations: `npm run db:push`

### Option C: Prisma Accelerate (Recommended for production)

1. Create a Prisma Data Platform account: https://console.prisma.io
2. Set up Accelerate for your database
3. Get the Accelerate URL and set it as DATABASE_URL

### Schema

The database schema is defined in `prisma/schema.prisma`. Key tables:
- **User** - Authentication and ownership
- **Photo** - Photo metadata and S3 keys for all resolutions
- **Tag** - User-defined tags for organization
- **Share** - Public share links for galleries

---

## 4. Environment Variables

Create a `.env.local` file in the project root:

```bash
# To be populated as development progresses
```

---

## 5. Domain & Deployment

*To be documented when ready for production*

---

## Checklist

Use this checklist when completing all manual tasks:

- [ ] AWS S3 bucket created and configured
- [ ] AWS credentials generated
- [ ] Database provisioned
- [ ] Auth provider configured
- [ ] Environment variables set
- [ ] Domain configured (if applicable)
- [ ] SSL certificate (if applicable)

---

*Last updated: Initial placeholder*
