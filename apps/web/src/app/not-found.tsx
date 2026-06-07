import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-950 text-surface-100">
      <div className="text-center">
        <h1 className="mb-2 text-8xl font-bold text-cyber-500 font-mono">404</h1>
        <p className="mb-2 text-2xl font-semibold text-surface-200">Page not found</p>
        <p className="mb-8 text-surface-400">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/"
          className="rounded-lg bg-cyber-600 px-6 py-3 text-sm font-medium text-white hover:bg-cyber-500 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
