import { NextRequest, NextResponse } from 'next/server';
import { pollForRecord } from '@/lib/snowflake-client';

export interface PollRequestBody {
  /** Snowflake table to query (e.g. COMPANY or DB.SCHEMA.COMPANY) */
  table: string;
  /** Column name to match against (e.g. NAME) */
  column: string;
  /** The exact value to search for */
  value: string;
  /** ISO timestamp of when the record was pushed to DealCloud */
  pushTime: string;
}

export async function POST(req: NextRequest) {
  let body: PollRequestBody;
  try {
    body = (await req.json()) as PollRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { table, column, value, pushTime } = body;
  if (!table || !column || !value || !pushTime) {
    return NextResponse.json(
      { error: 'table, column, value, and pushTime are required' },
      { status: 400 },
    );
  }

  try {
    const result = await pollForRecord(table, column, value, pushTime);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
