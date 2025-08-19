import "@/scripts/dailyMetricsCron";

export async function GET() {
  return new Response("Cron job started", { status: 200 });
}
export async function POST() {
  return new Response("Cron job started", { status: 200 });
}