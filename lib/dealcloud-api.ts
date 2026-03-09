function getTokenEndpoint(): string {
  // Allow override via env var — DealCloud token URL varies by deployment.
  // Common values:
  //   https://unifiedidentity6.dealcloud.com/connect/token   (SaaS)
  //   https://YOURSITE.dealcloud.com/connect/token           (on-prem / some tenants)
  if (process.env.DEALCLOUD_TOKEN_URL) return process.env.DEALCLOUD_TOKEN_URL;
  const siteUrl = process.env.DEALCLOUD_SITE_URL?.replace(/\/$/, '');
  if (siteUrl) return `${siteUrl}/connect/token`;
  return 'https://unifiedidentity6.dealcloud.com/connect/token';
}
const REQUEST_DELAY_MS = 500;
const MAX_RETRIES = 3;

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.DEALCLOUD_CLIENT_ID;
  const apiKey = process.env.DEALCLOUD_API_KEY;

  if (!clientId || !apiKey) {
    throw new Error('DEALCLOUD_CLIENT_ID and DEALCLOUD_API_KEY environment variables are required');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: apiKey,
    scope: 'api',
  });

  const tokenEndpoint = getTokenEndpoint();
  const res = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get access token from ${tokenEndpoint}: ${res.status} ${text}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  return cachedToken.accessToken;
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, options);

    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After');
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000;
      if (attempt < retries) {
        await delay(waitMs);
        continue;
      }
    }

    return res;
  }

  throw new Error('Max retries exceeded');
}

function getSiteUrl(): string {
  const siteUrl = process.env.DEALCLOUD_SITE_URL;
  if (!siteUrl) throw new Error('DEALCLOUD_SITE_URL environment variable is required');
  return siteUrl.replace(/\/$/, '');
}

async function apiRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const url = `${getSiteUrl()}${path}`;
  return fetchWithRetry(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

export async function createRows(
  entryTypeId: number,
  rows: Record<string, unknown>[],
): Promise<{ created: number; failed: number; results: unknown[]; sampleErrors: unknown[] }> {
  const res = await apiRequest(`/api/rest/v1/data/${entryTypeId}`, {
    method: 'POST',
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create rows: ${res.status} ${text}`);
  }

  const responseData = await res.json();
  // Handle both plain-array and wrapped { data: [...] } response formats
  const results = (
    Array.isArray(responseData)
      ? responseData
      : ((responseData as { data?: unknown[] }).data ?? [])
  ) as Array<Record<string, unknown>>;
  const created = results.filter(r => r != null && (r.EntryId as number) > 0).length;
  const failedRows = results.filter(r => r == null || (r.EntryId as number) <= 0);
  const sampleErrors = failedRows.slice(0, 3);
  return { created, failed: failedRows.length, results, sampleErrors };
}

export async function pushInBatches(
  entryTypeId: number,
  rows: Record<string, unknown>[],
  batchSize = 1000,
  onBatchDone?: (batchIndex: number, totalBatches: number, created: number, failed: number) => void,
): Promise<{ totalCreated: number; totalFailed: number }> {
  let totalCreated = 0;
  let totalFailed = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const batchIndex = Math.floor(i / batchSize);

    if (i > 0) await delay(REQUEST_DELAY_MS);

    const { created, failed } = await createRows(entryTypeId, batch);
    totalCreated += created;
    totalFailed += failed;

    onBatchDone?.(batchIndex, Math.ceil(rows.length / batchSize), created, failed);
  }

  return { totalCreated, totalFailed };
}

export async function queryRowsPage(
  entryTypeId: number,
  fieldIds: number[],
  skip = 0,
  limit = 1000,
): Promise<{ rows: unknown[]; total: number }> {
  const res = await apiRequest(`/api/rest/v1/data/${entryTypeId}/listrows`, {
    method: 'POST',
    body: JSON.stringify({ offset: skip, pageSize: Math.min(limit, 1000), fields: fieldIds }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to query rows: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { data: unknown[]; total: number };
  return { rows: data.data ?? [], total: data.total ?? 0 };
}

export async function fetchSchemaFields(entryTypeId: number): Promise<unknown[]> {
  const res = await apiRequest(`/api/rest/v1/schema/${entryTypeId}/fields`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch schema: ${res.status} ${text}`);
  }

  return res.json();
}

export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const token = await getAccessToken();
    return { success: true, message: `Connected. Token: ${token.slice(0, 10)}...` };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}
