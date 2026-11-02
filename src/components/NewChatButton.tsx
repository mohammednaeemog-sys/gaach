"use client";

import { useRouter } from "next/navigation";

// Starts a fresh Tree Advisor chat. A plain link to /assistant does nothing when
// the address is already /assistant, so this adds a new key to the address.
export function NewChatButton({ className, children }: { className?: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <button type="button" className={className} onClick={() => router.push(`/assistant?k=${Date.now().toString(36)}`)}>
      {children}
    </button>
  );
}
