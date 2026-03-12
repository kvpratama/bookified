export default function DashboardLoading() {
  return (
    <div className="flex flex-col min-h-screen max-w-7xl mx-auto w-full px-4 sm:px-6 py-12">
      {/* Title Area */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4 border-b border-border pb-8">
        <div>
          <div className="animate-pulse bg-muted rounded-md h-12 w-64" />
          <div className="animate-pulse bg-muted rounded-md h-5 w-48 mt-4" />
        </div>
        <div className="animate-pulse bg-muted rounded-md h-11 w-36" />
      </div>

      {/* Continue Reading Section */}
      <div className="mb-12">
        <div className="animate-pulse bg-muted rounded-xl border border-border h-48 md:h-52 w-full" />
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
        <div className="animate-pulse bg-muted rounded-md h-11 flex-1 w-full" />
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="animate-pulse bg-muted rounded-md h-10 w-24" />
          <div className="animate-pulse bg-muted rounded-md h-10 w-20" />
        </div>
      </div>

      {/* Section Heading */}
      <div className="mb-6">
        <div className="animate-pulse bg-muted rounded-md h-3 w-32" />
      </div>

      {/* Grid of 4 Book Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10 mb-16">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col">
            <div className="animate-pulse bg-muted aspect-3/4 w-full mb-4" />
            <div className="flex flex-col gap-2">
              <div className="animate-pulse bg-muted rounded-md h-5 w-3/4" />
              <div className="animate-pulse bg-muted rounded-md h-4 w-1/2" />
              <div className="animate-pulse bg-muted rounded-md h-3 w-2/5 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
