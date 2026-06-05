"use client";

import { useEffect, useState } from "react";

function randomViewerCount() {
  return Math.floor(Math.random() * 7) + 3;
}

export default function LiveViewerBadge() {
  const [viewers, setViewers] = useState(6);

  useEffect(() => {
    setViewers(randomViewerCount());

    const interval = window.setInterval(() => {
      setViewers(randomViewerCount());
    }, 28000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-xs font-black text-green-700 shadow-md sm:text-sm">
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
      </span>

      <span>{viewers} pessoas estão vendo esta oferta agora</span>
    </div>
  );
}
