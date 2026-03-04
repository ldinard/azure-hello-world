import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { entryTypeId } = (await req.json()) as { entryTypeId: number };
    if (!entryTypeId) {
      return NextResponse.json({ error: 'entryTypeId is required' }, { status: 400 });
    }

    const siteUrl = process.env.DEALCLOUD_SITE_URL?.replace(/\/$/, '');
    if (!siteUrl) {
      return NextResponse.json({ error: 'DEALCLOUD_SITE_URL not configured' }, { status: 500 });
    }

    // Get token
    const tokenRes = await fetch('https://unifiedidentity6.dealcloud.com/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.DEALCLOUD_CLIENT_ID ?? '',
        client_secret: process.env.DEALCLOUD_API_KEY ?? '',
        scope: 'api',
      }).toString(),
    });

    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      return NextResponse.json({ error: `Token error: ${tokenRes.status} ${txt}` }, { status: 502 });
    }

    const { access_token } = (await tokenRes.json()) as { access_token: string };

    // Minimal push — single record with only Name
    const url = `${siteUrl}/api/rest/v1/data/${entryTypeId}`;
    const body = JSON.stringify([{ EntryId: -1, Name: `Test-${Date.now().toString(36)}` }]);

    const pushRes = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    const responseBody = await pushRes.text();
    const responseHeaders: Record<string, string> = {};
    pushRes.headers.forEach((v, k) => { responseHeaders[k] = v; });

    return NextResponse.json({
      status: pushRes.status,
      headers: responseHeaders,
      body: responseBody,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
