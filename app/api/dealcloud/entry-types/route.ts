import { NextResponse } from 'next/server';
import { fetchEntryTypes } from '@/lib/dealcloud-api';

export async function GET() {
  try {
    const entryTypes = await fetchEntryTypes();
    return NextResponse.json({ entryTypes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
