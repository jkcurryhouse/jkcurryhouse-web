import Link from "next/link";
import { type ReactNode } from "react";
import { Logo, Monogram } from "@/components/brand/Logo";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-section-gradient flex flex-col items-center justify-center px-4 py-24">
      {/* Corner ornaments */}
      <div className="fixed inset-6 border border-gold/10 pointer-events-none hidden md:block" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" aria-label="JK Curryhouse — home" className="inline-flex flex-col items-center gap-4 hover:brightness-110 transition-[filter]">
            <Monogram size={96} priority />
            <Logo size="md" showMonogram={false} />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-100 shadow-2xl p-8 md:p-10">
          <div className="mb-8">
            <h1 className="font-display text-2xl text-charcoal-900 mb-1">{title}</h1>
            <p className="text-gray-500 text-sm font-body">{subtitle}</p>
            <div className="w-10 h-0.5 bg-gold mt-3" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
