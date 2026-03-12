import { NextResponse } from 'next/server';
import { testSnowflakeConnection } from '@/lib/snowflake-client';

export async function GET() {
  const result = await testSnowflakeConnection();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
