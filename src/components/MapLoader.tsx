"use client";

import dynamic from "next/dynamic";

const DaNangMap = dynamic(() => import("@/components/DaNangMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full bg-slate-100 py-12 px-4 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl">
        <div className="flex h-[560px] items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            <p className="text-sm text-slate-500 dark:text-white/50">Đang tải bản đồ...</p>
          </div>
        </div>
      </div>
    </div>
  ),
});

export default function MapLoader() {
  return <DaNangMap />;
}
