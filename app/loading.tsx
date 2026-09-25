export default function Loading() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200" aria-busy="true" aria-live="polite">
      <h1 className="sr-only">Loading ARCHAIA Cognitive Diagnostic Workspace...</h1>

      {/* Mode Banner Skeleton */}
      <div className="h-16 w-full rounded-2xl bg-[#0e111a]/80 border border-white/[0.08] animate-pulse flex items-center px-6 justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/40" />
          <div className="h-4 w-48 rounded-md bg-white/[0.06]" />
        </div>
        <div className="h-8 w-32 rounded-xl bg-white/[0.06]" />
      </div>

      {/* Hero Presentation Deck Skeleton */}
      <div className="card-shades relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-white/[0.08] space-y-4 animate-pulse">
        <div className="h-4 w-36 rounded-full bg-rose-500/20" />
        <div className="h-8 w-72 rounded-lg bg-white/[0.08]" />
        <div className="h-4 w-full max-w-xl rounded-md bg-white/[0.05]" />
        <div className="h-4 w-full max-w-md rounded-md bg-white/[0.05]" />
      </div>

      {/* 4 Diagnostic Arena Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-[#0e111a]/70 border border-white/[0.08] space-y-3 animate-pulse"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-6 rounded bg-white/[0.06]" />
              <div className="w-8 h-8 rounded-full bg-white/[0.06]" />
            </div>
            <div className="h-5 w-32 rounded bg-white/[0.08]" />
            <div className="h-3 w-full rounded bg-white/[0.04]" />
            <div className="h-3 w-3/4 rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}
