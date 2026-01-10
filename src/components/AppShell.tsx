"use client";

import { signOut, useSession } from "next-auth/react";
import { ReactNode, useState } from "react";
import type { ClusterMode } from "@/app/page";
import { useDarkMode } from "@/hooks/useDarkMode";
import type { PhotoWithDate, Tag } from "@/lib/clustering";
import { SearchBar } from "./SearchBar";
import { OfflineIndicator } from "./OfflineIndicator";
import { MobileNav } from "./MobileNav";

interface AppShellProps {
  children: ReactNode;
  onUploadClick?: () => void;
  onTagsClick?: () => void;
  onSharesClick?: () => void;
  onAlbumsClick?: () => void;
  clusterMode?: ClusterMode;
  onClusterModeChange?: (mode: ClusterMode) => void;
  photos?: PhotoWithDate[];
  tags?: Tag[];
  onSearch?: (query: string) => void;
}

export function AppShell({
  children,
  onUploadClick,
  onTagsClick,
  onSharesClick,
  onAlbumsClick,
  clusterMode,
  onClusterModeChange,
  photos,
  tags,
  onSearch,
}: AppShellProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white dark:bg-black">
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-black focus:px-4 focus:py-2 focus:text-white dark:focus:bg-white dark:focus:text-black"
      >
        Skip to main content
      </a>
      <Header
        onUploadClick={onUploadClick}
        onTagsClick={onTagsClick}
        onSharesClick={onSharesClick}
        onAlbumsClick={onAlbumsClick}
        clusterMode={clusterMode}
        onClusterModeChange={onClusterModeChange}
        photos={photos}
        tags={tags}
        onSearch={onSearch}
      />
      <main id="main-content" className="flex min-h-0 flex-1 flex-col" tabIndex={-1}>
        {children}
      </main>
      <OfflineIndicator />
    </div>
  );
}

interface HeaderProps {
  onUploadClick?: () => void;
  onTagsClick?: () => void;
  onSharesClick?: () => void;
  onAlbumsClick?: () => void;
  clusterMode?: ClusterMode;
  onClusterModeChange?: (mode: ClusterMode) => void;
  photos?: PhotoWithDate[];
  tags?: Tag[];
  onSearch?: (query: string) => void;
}

function Header({ onUploadClick, onTagsClick, onSharesClick, onAlbumsClick, clusterMode, onClusterModeChange, photos, tags, onSearch }: HeaderProps) {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const { effectiveTheme, toggleTheme, mounted } = useDarkMode();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-black/80">
      <div className="flex h-14 items-center gap-4 px-4">
        <h1 className="text-lg font-semibold">Emerse</h1>
        {photos && tags && onSearch && (
          <SearchBar
            photos={photos}
            tags={tags}
            onSearch={onSearch}
            className="hidden flex-1 sm:block sm:max-w-xs"
          />
        )}
        <nav className="ml-auto flex items-center gap-1 sm:gap-2">
          {/* Cluster mode switcher - visible on all screens */}
          {clusterMode && onClusterModeChange && (
            <div className="flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => onClusterModeChange("month")}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  clusterMode === "month"
                    ? "bg-white text-black shadow-sm dark:bg-gray-700 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => onClusterModeChange("day")}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  clusterMode === "day"
                    ? "bg-white text-black shadow-sm dark:bg-gray-700 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() => onClusterModeChange("location")}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  clusterMode === "location"
                    ? "bg-white text-black shadow-sm dark:bg-gray-700 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Location
              </button>
            </div>
          )}

          {/* Desktop nav buttons - hidden on mobile */}
          <button
            type="button"
            onClick={onTagsClick}
            className="hidden h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 sm:flex"
            aria-label="Manage tags"
          >
            <TagIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onAlbumsClick}
            className="hidden h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 sm:flex"
            aria-label="Manage albums"
          >
            <AlbumIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onSharesClick}
            className="hidden h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 sm:flex"
            aria-label="Manage shares"
          >
            <ShareIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onUploadClick}
            className="hidden h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 sm:flex"
            aria-label="Upload photos"
          >
            <UploadIcon className="h-5 w-5" />
          </button>
          {mounted && (
            <button
              type="button"
              onClick={toggleTheme}
              className="hidden h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 sm:flex"
              aria-label={`Switch to ${effectiveTheme === "dark" ? "light" : "dark"} mode`}
            >
              {effectiveTheme === "dark" ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
          )}
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-900"
              aria-label="User menu"
            >
              <UserIcon className="h-5 w-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                <div className="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
                  <p className="text-sm font-medium">{session?.user?.name}</p>
                  <p className="text-xs text-gray-500">{session?.user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>

          {/* Mobile nav - hamburger menu */}
          <MobileNav
            onUploadClick={onUploadClick}
            onTagsClick={onTagsClick}
            onSharesClick={onSharesClick}
            onAlbumsClick={onAlbumsClick}
          />
        </nav>
      </div>
    </header>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
      />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
      />
    </svg>
  );
}

function AlbumIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
      />
    </svg>
  );
}
