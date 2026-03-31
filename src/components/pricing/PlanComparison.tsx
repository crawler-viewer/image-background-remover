import { comparisonRows } from "@/lib/pricing";

export function PlanComparison() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-5xl rounded-3xl border border-gray-800 bg-gray-900/50 p-6">
        <h2 className="text-2xl font-bold">Compare plans</h2>
        <p className="mt-2 text-sm text-gray-400">
          Choose the plan that matches your workflow and monthly volume.
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-800">
          <div className="grid grid-cols-5 gap-4 border-b border-gray-800 bg-gray-950/70 px-4 py-3 text-xs uppercase tracking-[0.18em] text-gray-500">
            <div>Feature</div>
            <div>Guest</div>
            <div>Free</div>
            <div>Pro</div>
            <div>Business</div>
          </div>
          {comparisonRows.map((row) => (
            <div key={row.label} className="grid grid-cols-5 gap-4 border-b border-gray-800/80 px-4 py-4 text-sm last:border-b-0">
              <div className="text-gray-300">{row.label}</div>
              <div>{row.guest}</div>
              <div>{row.free}</div>
              <div>{row.pro}</div>
              <div>{row.business}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
