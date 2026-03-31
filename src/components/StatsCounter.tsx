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

  // Don't render until we have data, and show minimum thresholds for social proof
  const processed = stats?.totalProcessed || 0;
  const users = stats?.totalUsers || 0;

  // Only show if we have meaningful numbers
  if (processed < 10 && users < 5) return null;

  return (
    <div className="flex flex-wrap justify-center gap-12 mt-16 mb-4">
      <div className="text-center">
        <div className="text-3xl font-bold text-white">{formatNumber(processed)}+</div>
        <div className="text-xs text-gray-500 mt-1">Images Processed</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-white">{formatNumber(users)}+</div>
        <div className="text-xs text-gray-500 mt-1">Registered Users</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-white">&lt;3s</div>
        <div className="text-xs text-gray-500 mt-1">Average Processing</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-white">100%</div>
        <div className="text-xs text-gray-500 mt-1">Free to Try</div>
      </div>
    </div>
  );
}
