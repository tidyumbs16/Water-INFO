import { NextResponse } from "next/server";
import { getDistrictById } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
    { params }: { params: { stationId: string } }
) {
   const { stationId } = params;
  try {
    const district = await getDistrictById(stationId);

    if (!district) {
      return NextResponse.json(
        { error: `District with ID ${stationId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(district);
  } catch (error) {
    console.error(`Error fetching district with ID ${stationId}:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch district data", details: errorMessage },
      { status: 500 }
    );
  }
}
