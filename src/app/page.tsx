import MapLoader from "@/components/MapLoader";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950">
      {/* Hero */}
      <div className="bg-linear-to-b from-sky-950 via-slate-900 to-slate-950 px-4 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span className="text-sky-300 text-xs font-medium tracking-wide">
            Đà Nẵng, Việt Nam
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-3 tracking-tight">
          Khám Phá <span className="text-sky-400">Đà Nẵng</span>
        </h1>
        <p className="text-white/50 text-lg max-w-xl mx-auto">
          Dự báo thời tiết & lên lịch trình du lịch thông minh
        </p>

        {/* Quick stats */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          {[
            { emoji: "🏖️", label: "Bãi biển", value: "Mỹ Khê" },
            { emoji: "🌉", label: "Nổi tiếng", value: "Cầu Vàng" },
            { emoji: "🐉", label: "Biểu tượng", value: "Cầu Rồng" },
            { emoji: "🛕", label: "Tâm linh", value: "Linh Ứng" },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-center min-w-[100px]"
            >
              <div className="text-xl mb-1">{item.emoji}</div>
              <div className="text-white/40 text-xs">{item.label}</div>
              <div className="text-white font-semibold text-sm">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <MapLoader />

      {/* Footer */}
      <div className="text-center py-8 text-white/20 text-xs">
        © 2025 Đà Nẵng Travel · Powered by OpenStreetMap & CartoDB
      </div>
    </main>
  );
}
