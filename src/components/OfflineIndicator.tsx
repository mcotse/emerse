"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useOnlineStatus();

  // Show "back online" message briefly when reconnecting
  if (wasOffline && isOnline) {
    return (
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform">
        <div className="flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          <OnlineIcon className="h-4 w-4" />
          <span>Back online</span>
        </div>
      </div>
    );
  }

  // Show offline indicator when offline
  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform">
        <div className="flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          <OfflineIcon className="h-4 w-4" />
          <span>You&apos;re offline</span>
        </div>
      </div>
    );
  }

  return null;
}

function OfflineIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
      />
    </svg>
  );
}

function OnlineIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}
