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

### Create S3 Bucket

1. Go to AWS S3 Console
2. Create a new bucket (e.g., `emerse-photos-yourname`)
3. Region: Choose closest to your users
4. Block all public access (we use presigned URLs)
5. Enable versioning (optional but recommended)

### Configure CORS

Add this CORS configuration to allow browser uploads:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Create IAM User

1. Go to IAM Console
2. Create a new user (e.g., `emerse-app`)
3. Attach policy with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::emerse-photos-yourname/*"
    }
  ]
}
```

4. Create access keys and add to `.env`:

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=emerse-photos-yourname
```

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
