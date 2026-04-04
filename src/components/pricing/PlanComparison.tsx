import { comparisonRows } from "@/lib/pricing";

export function PlanComparison() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-5xl rounded-[28px] border border-black/8 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
        <h2 className="text-2xl font-bold">Compare plans</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Choose the plan that matches your workflow and monthly volume.
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-black/8">
          <div className="grid grid-cols-5 gap-4 border-b border-black/8 bg-stone-50 px-4 py-3 text-xs uppercase tracking-[0.18em] text-neutral-500">
            <div>Feature</div>
            <div>Guest</div>
            <div>Free</div>
            <div>Pro</div>
            <div>Business</div>
          </div>
          {comparisonRows.map((row) => (
            <div key={row.label} className="grid grid-cols-5 gap-4 border-b border-black/8 px-4 py-4 text-sm last:border-b-0">
              <div className="text-neutral-700">{row.label}</div>
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
