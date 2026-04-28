This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Lịch trình du lịch + API Python (port 8000)

Trang **Lịch trình gợi ý**: [http://localhost:3000/lich-trinh](http://localhost:3000/lich-trinh)

Frontend gọi backend qua proxy Next.js: `/api/travel-proxy/api/...` → `TRAVEL_BACKEND_URL` (mặc định `http://127.0.0.1:8000`).

Thêm vào `.env.local`:

```bash
TRAVEL_BACKEND_URL=http://127.0.0.1:8000
```

Backend cần expose các route: `GET /api/weather`, `GET /api/districts`, v.v.

#### Schema BE (đã ghép vào FE)

| Endpoint | Response (rút gọn) |
|----------|-------------------|
| `GET /api/districts` | `[{ district_id, district_name }]` — 53 điểm, `district_name` dạng `My_Khe_Beach` |
| `GET /api/weather` | `[{ district, date, summary: { temp_min, temp_max, temp_avg, humidity_avg, rain_total, wind_max, rain_prob_avg } }]` |
| `GET /api/weather/{district}` | `{ district, forecasts: [{ date, hourly: [...] }] }` |
| `GET /api/weather/{district}/{date}` | `{ district, date, hourly: [{ hour, temperature_c, humidity_percent, wind_speed_m_s, rain_mm, rain_probability, description }] }` |
| `GET /api/actual/{district}/{date}` | JSON DW hoặc `{ detail: "..." }` |

Tọa độ map: `src/lib/api-district-map.ts` (`API_DISTRICT_TO_SPOT_ID`). Chấm điểm summary: `scoreFromBackendSummary` trong `src/lib/itinerary-scoring.ts`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
