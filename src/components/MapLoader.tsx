"use client";

import dynamic from "next/dynamic";

const DaNangMap = dynamic(() => import("@/components/DaNangMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full bg-slate-950 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="h-[560px] rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white/50 text-sm">Đang tải bản đồ...</p>
          </div>
        </div>
      </div>
    </div>
  ),
});

export default function MapLoader() {
  return <DaNangMap />;
}
