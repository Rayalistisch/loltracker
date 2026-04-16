export default function AnalyticsLoading() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-pulse">
      <div className="h-8 w-32 rounded-lg bg-muted/60" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-border bg-card/80 h-64" />
        <div className="lg:col-span-2 grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card/40 h-28" />
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card/80 h-64" />
    </div>
  )
}
