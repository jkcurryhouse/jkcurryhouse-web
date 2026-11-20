import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found | JK Curryhouse Chippenham",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-section-gradient flex items-center justify-center px-6 pt-16">
      <div className="text-center max-w-lg">
        {/* Decorative */}
        <div className="font-display text-[120px] md:text-[160px] font-bold text-white/5 leading-none select-none">
          404
        </div>
        <div className="-mt-8 relative z-10">
          <p className="eyebrow mb-4">Page Not Found</p>
          <h1 className="font-display text-4xl md:text-5xl text-white mb-4">
            This dish isn&apos;t<br />on the menu
          </h1>
          <div className="gold-divider" />
          <p className="text-gray-400 mt-6 mb-10 font-body text-sm leading-relaxed">
            The page you&apos;re looking for has moved or doesn&apos;t exist.
            Let us help you find what you&apos;re after.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/"    className="btn-primary">Back to Home</Link>
            <Link href="/menu" className="btn-outline">View Menu</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
