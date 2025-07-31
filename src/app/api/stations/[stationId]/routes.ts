// app/api/stations/[stationId]/route.ts
// API Route for fetching a single station by ID

import { NextResponse } from 'next/server';
// IMPORTANT: Verify the relative path to lib/db.ts
// This file is nested deeper, so it needs more '../'
import { getStationById } from '../../../../../lib/db'; // Go up 5 levels

export const dynamic = 'force-dynamic'; // Force this Route to be Dynamic (no caching)

interface StationParams {
  params: {
    stationId: string;
  };
}

export async function GET(request: Request, { params }: StationParams) {
  try {
    const { stationId } = params;

    if (!stationId) {
      return NextResponse.json({ error: 'Missing stationId parameter' }, { status: 400 });
    }

    const station = getStationById(stationId);

    if (!station) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 });
    }

    return NextResponse.json(station);
  } catch (error) {
    console.error('Error fetching station by ID:', error);
    return NextResponse.json({ error: 'Failed to fetch station', details: (error as Error).message }, { status: 500 });
  }
}
