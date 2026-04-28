import MapLoader from "@/components/MapLoader";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* Hero */}
      <div className="bg-linear-to-b from-sky-100 via-white to-slate-100 px-4 pt-16 pb-10 text-center dark:from-sky-950 dark:via-slate-900 dark:to-slate-950">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-sky-500/10 px-4 py-1.5 mb-6 dark:border-sky-500/20 dark:bg-sky-500/10">
          <span className="h-2 w-2 animate-pulse rounded-full bg-sky-500 dark:bg-sky-400" />
          <span className="text-xs font-medium tracking-wide text-sky-700 dark:text-sky-300">
            Đà Nẵng, Việt Nam
          </span>
        </div>
        <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-900 md:text-6xl dark:text-white">
          Khám Phá{" "}
          <span className="text-sky-600 dark:text-sky-400">Đà Nẵng</span>
        </h1>
        <p className="mx-auto max-w-xl text-lg text-slate-600 dark:text-white/50">
          Dự báo thời tiết & lên lịch trình du lịch thông minh
        </p>

        <div className="mt-6">
          <Link
            href="/lich-trinh"
            className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-violet-500 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-opacity hover:opacity-95"
          >
            📅 Lịch trình gợi ý
          </Link>
        </div>

        {/* Quick stats */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {[
            { emoji: "🏖️", label: "Bãi biển", value: "Mỹ Khê" },
            { emoji: "🌉", label: "Nổi tiếng", value: "Cầu Vàng" },
            { emoji: "🐉", label: "Biểu tượng", value: "Cầu Rồng" },
            { emoji: "🛕", label: "Tâm linh", value: "Linh Ứng" },
          ].map((item) => (
            <div
              key={item.label}
              className="min-w-[100px] rounded-2xl border border-slate-200/80 bg-white/80 px-5 py-3 text-center shadow-sm dark:border-white/10 dark:bg-white/5"
            >
              <div className="mb-1 text-xl">{item.emoji}</div>
              <div className="text-xs text-slate-500 dark:text-white/40">
                {item.label}
              </div>
              <div className="text-sm font-semibold text-slate-800 dark:text-white">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <MapLoader />

      {/* Footer */}
      <div className="py-8 text-center text-xs text-slate-400 dark:text-white/20">
        © 2025 Đà Nẵng Travel · Powered by OpenStreetMap & CartoDB
      </div>
    </main>
  );
}
