export default function Loading() {
  return (
    <div className="min-h-[70vh] bg-navy pt-40" role="status" aria-label="Loading">
      <div className="shell">
        <div className="h-3 w-32 animate-pulse bg-white/10" />
        <div className="mt-6 h-12 w-2/3 animate-pulse bg-white/10" />
        <div className="mt-4 h-12 w-1/2 animate-pulse bg-white/10" />
      </div>
    </div>
  );
}
