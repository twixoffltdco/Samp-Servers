import { NextResponse } from "next/server";
import { fetchActiveServers, type ServersPayload } from "@/lib/radar";
import { MOCK_SERVERS } from "@/lib/mock-servers";

// Свежие данные для мониторинга: сам роут динамический,
// а апстрим кэшируется внутри fetchActiveServers на 60 секунд.
export const revalidate = 60;

function mockPayload(): ServersPayload {
  return {
    source: "mock",
    updatedAt: new Date().toISOString(),
    servers: MOCK_SERVERS,
  };
}

export async function GET() {
  try {
    const payload = await fetchActiveServers();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    // Мастер-лист недоступен (сеть, лимиты, CORS-прокси упал) — отдаём мок,
    // чтобы UI оставался рабочим. Причина пишется в консоль сервера.
    console.error("[api/servers] upstream failed, serving mock data:", error);
    return NextResponse.json(mockPayload(), {
      headers: { "Cache-Control": "no-store" },
    });
  }
}
