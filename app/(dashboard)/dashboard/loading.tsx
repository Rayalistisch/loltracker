export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8 animate-pulse">
      <div className="h-8 w-40 rounded-lg bg-muted/60" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card/80 p-5 h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card/80 h-64" />
        <div className="rounded-2xl border border-border bg-card/80 h-64" />
      </div>
    </div>
  )
}
