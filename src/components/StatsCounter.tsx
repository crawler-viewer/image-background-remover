"use client";

import { useEffect, useState } from "react";

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export function StatsCounter() {
  const [stats, setStats] = useState<{ totalProcessed: number; totalUsers: number } | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const processed = stats?.totalProcessed || 0;
  const users = stats?.totalUsers || 0;

  if (processed < 10 && users < 5) return null;

  return (
    <div className="mt-16 mb-4 flex flex-wrap justify-center gap-8 sm:gap-12">
      <div className="text-center">
        <div className="text-3xl font-bold text-neutral-950">{formatNumber(processed)}+</div>
        <div className="mt-1 text-xs text-neutral-500">Images Processed</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-neutral-950">{formatNumber(users)}+</div>
        <div className="mt-1 text-xs text-neutral-500">Registered Users</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-neutral-950">&lt;3s</div>
        <div className="mt-1 text-xs text-neutral-500">Average Processing</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-neutral-950">100%</div>
        <div className="mt-1 text-xs text-neutral-500">Free to Try</div>
      </div>
    </div>
  );
}
