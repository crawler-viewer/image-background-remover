/** Static before/after demo for the homepage hero (no JS). */
export default function HeroDemo() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
      <div className="grid grid-cols-2">
        {/* Before — busy product-like mock */}
        <div className="relative border-r border-black/8">
          <div
            className="aspect-[4/3] w-full"
            style={{
              background:
                "linear-gradient(145deg, #e7e5e4 0%, #d6d3d1 40%, #a8a29e 100%)",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="relative h-[62%] w-[48%] rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-lg shadow-black/20">
                <div className="absolute inset-x-2 top-2 h-2 rounded-full bg-white/20" />
                <div className="absolute bottom-3 left-1/2 h-3 w-3/5 -translate-x-1/2 rounded bg-white/15" />
              </div>
            </div>
          </div>
          <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
            Before
          </span>
        </div>

        {/* After — checker + cutout on white option feel */}
        <div className="relative">
          <div
            className="aspect-[4/3] w-full"
            style={{
              background:
                "repeating-conic-gradient(#e7e5e4 0% 25%, #f5f5f4 0% 50%) 50% / 12px 12px",
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="relative h-[62%] w-[48%] rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-md">
                <div className="absolute inset-x-2 top-2 h-2 rounded-full bg-white/20" />
                <div className="absolute bottom-3 left-1/2 h-3 w-3/5 -translate-x-1/2 rounded bg-white/15" />
              </div>
            </div>
          </div>
          <span className="absolute right-2 top-2 rounded-md bg-emerald-700 px-2 py-0.5 text-[10px] font-medium text-white">
            After
          </span>
        </div>
      </div>
      <p className="border-t border-black/6 px-3 py-2 text-center text-[11px] text-neutral-500">
        Transparent PNG · or one-click pure white JPG for marketplaces
      </p>
    </div>
  );
}
