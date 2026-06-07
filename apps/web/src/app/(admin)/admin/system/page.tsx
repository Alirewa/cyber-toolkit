export default function SystemPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-50">System Health</h1>
        <p className="mt-1 text-surface-400">Infrastructure monitoring and diagnostics</p>
      </div>
      <div className="rounded-xl border border-surface-800 bg-surface-900/50 p-8 text-center">
        <p className="text-surface-400">System metrics dashboard — coming in a future update.</p>
        <p className="text-sm text-surface-600 mt-2">Will include: CPU, memory, queue depths, DB connection pool, error rates.</p>
      </div>
    </div>
  );
}
