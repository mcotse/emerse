/**
 * Database client for Emerse.
 *
 * Requires DATABASE_URL environment variable to be set.
 * See MANUAL_SETUP.md for database configuration instructions.
 */

// Re-export types for use throughout the app
export type {
  User,
  Photo,
  Tag,
  PhotoTag,
  Share,
  SharePhoto,
  ProcessingStatus,
} from "../../prisma/prisma/client";

// Re-export Prisma utilities
export { Prisma } from "../../prisma/prisma/client";
