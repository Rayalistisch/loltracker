export default function SessionHistoryLoading() {
  return (
    <div className="max-w-4xl mx-auto py-6 px-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1.5">
          <div className="h-5 w-36 rounded bg-muted/60" />
          <div className="h-3 w-24 rounded bg-muted/40" />
        </div>
        <div className="h-8 w-28 rounded bg-muted/60" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-3 border-b border-border/40 pb-2">
        <div className="h-4 w-24 rounded bg-muted/60" />
        <div className="h-4 w-16 rounded bg-muted/40" />
        <div className="h-4 w-20 rounded bg-muted/40" />
      </div>

      {/* Summary row */}
      <div className="flex items-center gap-6 mb-3 px-1">
        <div className="h-3 w-20 rounded bg-muted/40" />
        <div className="h-3 w-12 rounded bg-muted/40" />
        <div className="h-3 w-10 rounded bg-muted/40" />
      </div>

      {/* Session rows */}
      <div className="space-y-0.5">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center h-16 rounded-sm bg-card border-y border-r border-border/30 border-l-2 border-l-muted/40" />
        ))}
      </div>
    </div>
  )
}
