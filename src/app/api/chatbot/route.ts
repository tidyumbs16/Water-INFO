// app/api/chatbot/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "../../../../lib/db";

type Step = "idle" | "region" | "province" | "district";

interface SessionState {
  step: Step;
  region?: string;
  province?: string;
  district?: string;
}

// เก็บ state (demo: memory; production แนะนำ Redis/DB)
let userState: SessionState = { step: "idle" as Step };

// ✅ Helper: หา pattern วันที่ (YYYY-MM-DD)
function extractDateFromText(text: string): string | null {
  const regex = /\d{4}-\d{2}-\d{2}/;
  const match = text.match(regex);
  return match ? match[0] : null;
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    const text = String(message || "").trim();
    const lower = text.toLowerCase();

    if (!text) {
      return NextResponse.json({
        response: "โปรดพิมพ์ข้อความ เช่น ชื่อภูมิภาค หรือพิมพ์ 'ช่วยแนะนำ' เพื่อดูวิธีใช้งานครับ",
      });
    }

    // ✅ reset state
    if (
      lower.includes("ภาคอื่น") ||
      lower.includes("reset") ||
      lower.includes("เริ่มใหม่")
    ) {
      userState = { step: "idle" };
      return NextResponse.json({
        response:
          "🔄 เริ่มใหม่แล้วครับ โปรดพิมพ์ชื่อ 'ภูมิภาค' เช่น 'ภาคเหนือ' เพื่อเริ่มต้น",
      });
    }

    // ✅ แนะนำวิธีใช้งาน
    if (lower.includes("ช่วยแนะนำ") || lower.includes("ใช้งานยังไง")) {
      return NextResponse.json({
        response: `📘 วิธีใช้งาน Chatbot:
1) พิมพ์ชื่อ "ภูมิภาค" เช่น 'ภาคเหนือ'
2) เลือกจังหวัดที่อยู่ในภูมิภาคนั้น
3) เลือกเขตประปาที่ต้องการ
4) Bot จะแสดงข้อมูลค่าน้ำ (คุณภาพ, ปริมาณ, แรงดัน, ประสิทธิภาพ) ของวันปัจจุบัน
👉 คุณยังสามารถพิมพ์วันที่ เช่น 2025-09-01 เพื่อดูข้อมูลย้อนหลังได้`,
      });
    }

    const client = await pool!.connect();
    try {
      // 🟢 Step 1: idle → region
      if (userState.step === "idle") {
        const regionRes = await client.query(
          `SELECT DISTINCT region FROM districts WHERE region ILIKE $1 LIMIT 1`,
          [`%${text}%`]
        );
        if (regionRes.rows.length > 0) {
          const region = regionRes.rows[0].region;
          userState = { step: "region", region };
          return NextResponse.json({
            response: `✅ คุณเลือกภูมิภาค: ${region}\nโปรดพิมพ์ชื่อจังหวัดที่ต้องการดูครับ`,
          });
        }
        return NextResponse.json({
          response:
            "❌ ไม่พบภูมิภาคนี้ โปรดลองใหม่ เช่น 'ภาคกลาง' หรือ 'ภาคใต้'",
        });
      }

      // 🟢 Step 2: region → province
      if (userState.step === "region" && userState.region) {
        const provinceRes = await client.query(
          `SELECT DISTINCT province FROM districts WHERE region = $1 AND province ILIKE $2 LIMIT 1`,
          [userState.region, `%${text}%`]
        );
        if (provinceRes.rows.length > 0) {
          const province = provinceRes.rows[0].province;
          const districtsRes = await client.query(
            `SELECT name FROM districts WHERE province = $1 ORDER BY name ASC`,
            [province]
          );
          const districts = districtsRes.rows.map((r: any) => r.name).join(", ");
          userState = { step: "province", region: userState.region, province };
          return NextResponse.json({
            response: `📍 จังหวัด ${province} มีเขตดังนี้:\n${districts}\n\nโปรดพิมพ์ชื่อเขตที่คุณต้องการดูครับ`,
          });
        }
        return NextResponse.json({
          response: "❌ ไม่พบจังหวัดนี้ในภูมิภาคที่เลือก โปรดลองใหม่ครับ",
        });
      }

      // 🟢 Step 3: province → district (+ รองรับถามย้อนหลัง)
      if (userState.step === "province" && userState.province) {
        const districtRes = await client.query(
          `SELECT id, name FROM districts WHERE province = $1 AND name ILIKE $2 LIMIT 1`,
          [userState.province, `%${text}%`]
        );
        if (districtRes.rows.length > 0) {
          const d = districtRes.rows[0];
          userState = { ...userState, step: "district", district: d.name };

          // ✅ ตรวจสอบว่ามีการพิมพ์วันที่มาไหม
          const dateFromText = extractDateFromText(text);
          const dateQuery = dateFromText
            ? dateFromText
            : new Date().toISOString().split("T")[0]; // default = วันนี้

          const metricsRes = await client.query(
            `SELECT water_quality, water_volume, pressure, efficiency, date
             FROM district_metrics_daily
             WHERE district_id = $1 AND date::date = $2::date
             ORDER BY date DESC LIMIT 1`,
            [d.id, dateQuery]
          );

          if (metricsRes.rows.length > 0) {
            const m = metricsRes.rows[0];
            return NextResponse.json({
              response: `📊 ข้อมูลเขต ${d.name} (${userState.province})\nวันที่ ${m.date.toISOString().split("T")[0]}\n- คุณภาพน้ำ: ${m.water_quality}\n- ปริมาณน้ำ: ${m.water_volume}\n- แรงดัน: ${m.pressure}\n- ประสิทธิภาพ: ${m.efficiency}\n\n👉 หากต้องการเริ่มใหม่ให้พิมพ์ 'ภาคอื่น'`,
            });
          } else {
            return NextResponse.json({
              response: `⛔ เขต ${d.name} ไม่มีข้อมูลของวันที่ ${dateQuery}\n👉 หากต้องการเริ่มใหม่ให้พิมพ์ 'ภาคอื่น'`,
            });
          }
        }
        return NextResponse.json({
          response: "❌ ไม่พบเขตนี้ในจังหวัด โปรดลองใหม่ครับ",
        });
      }

      // 🟢 Step 4: อยู่ใน district แล้ว
      if (userState.step === "district") {
        return NextResponse.json({
          response: `ℹ️ ตอนนี้คุณกำลังดูข้อมูลของเขต ${userState.district} อยู่ครับ\n👉 หากต้องการเปลี่ยน โปรดพิมพ์ 'ภาคอื่น'`,
        });
      }
    } finally {
      client.release();
    }

    return NextResponse.json({
      response: "🤖 โปรดพิมพ์ชื่อภูมิภาคเพื่อเริ่มต้น เช่น 'ภาคเหนือ'",
    });
  } catch (err) {
    console.error("Chatbot error:", err);
    return NextResponse.json({
      response: "⚠️ เกิดข้อผิดพลาด ลองใหม่อีกครั้งครับ",
    });
  }
}
