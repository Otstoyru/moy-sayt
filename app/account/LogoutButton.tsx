"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex h-10 items-center justify-center rounded-full border border-border px-4 text-sm font-medium hover:border-brand hover:text-brand"
    >
      Выйти
    </button>
  );
}
