"use client";

import { signOut, useSession } from "next-auth/react";
import { ReactNode, useState } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}

function Header() {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-black/80">
      <div className="flex h-14 items-center justify-between px-4">
        <h1 className="text-lg font-semibold">Emerse</h1>
        <nav className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-900"
            aria-label="Upload photos"
          >
            <UploadIcon className="h-5 w-5" />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-900"
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
