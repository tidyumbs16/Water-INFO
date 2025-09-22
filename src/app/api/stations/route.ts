import { NextResponse } from "next/server";
import { getDistrictById } from "../../../../lib/db";

export async function GET(request: Request, context: any) {
  const { stationId } = context.params;

  try {
    const district = await getDistrictById(stationId);

    if (!district) {
      return NextResponse.json(
        { error: `District with ID ${stationId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(district);
  } catch (err) {
    console.error(`Error fetching district ${stationId}:`, err);
    return NextResponse.json(
      { error: "Failed to fetch district data" },
      { status: 500 }
    );
  }
}