"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BackButton({ fallbackHref, label = "Back" }: { fallbackHref: string; label?: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
      className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-[#1c2024]"
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}

export function BackLink({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-[#1c2024]">
      <ArrowLeft size={16} />
      {label}
    </Link>
  );
}
