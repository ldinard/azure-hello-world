'use client';

import { useState, useCallback, useRef } from 'react';
import { entryTypes, getWritableFields } from '@/lib/dealcloud-schema';
import {
  generateSampleRecord,
  generateSampleRecords,
  toRowApiPayload,
  resetRunId,
} from '@/lib/sample-data-generator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import DataTable from '@/components/DataTable';
import SiteDataTable from '@/components/SiteDataTable';
import PushLog, { type LogEntry } from '@/components/PushLog';
import LatencyMonitor, { type LatencySession } from '@/components/LatencyMonitor';

type ConnectionStatus = 'idle' | 'checking' | 'connected' | 'error';

interface PushProgress {
  percent: number;
  created: number;
  batchNum: number;
  totalBatches: number;
}

const CLIENT_PREVIEW_LIMIT = 100;
const SMALL_PUSH_LIMIT = 100;

const typeLabel = (t: string) => (t === 'Person' ? 'P' : 'E');
const typeBadgeClass = (t: string) =>
  t === 'Person'
    ? 'bg-green-600/20 text-green-400 border-green-600/40'
    : 'bg-blue-600/20 text-blue-400 border-blue-600/40';

export default function Dashboard() {
  const [selectedId, setSelectedId] = useState(65535);
  const [recordCount, setRecordCount] = useState(10);
  const [countInput, setCountInput] = useState('10');
  const [sampleData, setSampleData] = useState<ReturnType<typeof generateSampleRecord>[]>([]);
  const [siteData, setSiteData] = useState<Record<string, unknown>[]>([]);
  const [siteTotal, setSiteTotal] = useState(0);
  const [siteLoaded, setSiteLoaded] = useState(0);
  const [pushLog, setPushLog] = useState<LogEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [activeTab, setActiveTab] = useState('preview');
  const [pushProgress, setPushProgress] = useState<PushProgress | null>(null);
  const [latencySession, setLatencySession] = useState<LatencySession | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const logIdRef = useRef(0);

  const selectedET = entryTypes.find(et => et.objectId === selectedId)!;
  const writableFields = getWritableFields(selectedId);
  const allFields = selectedET.fields;

  const addLog = useCallback(
    (type: LogEntry['type'], message: string, detail?: string) => {
      setPushLog(prev => [
        { id: logIdRef.current++, type, message, detail, timestamp: new Date() },
        ...prev,
      ]);
    },
    [],
  );

  // ── Connection test ─────────────────────────────────────────────────────────
  async function handleTestConnection() {
    setConnectionStatus('checking');
    try {
      const res = await fetch('/api/dealcloud/test');
      const data = (await res.json()) as { success: boolean; message: string };
      setConnectionStatus(data.success ? 'connected' : 'error');
      addLog(data.success ? 'success' : 'error', data.message);
    } catch {
      setConnectionStatus('error');
      addLog('error', 'Connection test failed');
    }
  }

  // ── Preview ─────────────────────────────────────────────────────────────────
  function handlePreview() {
    setIsGenerating(true);
    try {
      resetRunId();
      const count = Math.min(recordCount, CLIENT_PREVIEW_LIMIT);
      const records = generateSampleRecords(writableFields, count);
      setSampleData(records);
      setActiveTab('preview');
      addLog('info', `Generated ${count} sample record${count !== 1 ? 's' : ''} for preview`);
    } finally {
      setIsGenerating(false);
    }
  }

  // ── Small push (client-side generate → push-v2) ─────────────────────────────
  async function handleSmallPush() {
    setIsPushing(true);
    addLog('info', `Pushing ${recordCount} record${recordCount !== 1 ? 's' : ''} to DealCloud…`);
    setActiveTab('log');
    try {
      resetRunId();
      // Embed a unique latency marker into the first record's Name field so we
      // can later identify that exact record in Snowflake.
      const marker = `LATENCY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const pushTime = new Date().toISOString();
      const records = generateSampleRecords(writableFields, recordCount);
      const payloads = records.map(r => toRowApiPayload(r, writableFields));
      // Inject the marker into the first record's Name field (any text-like field)
      if (payloads[0]) {
        const nameKey = Object.keys(payloads[0]).find(k =>
          /^name$/i.test(k) || /name/i.test(k),
        );
        if (nameKey) {
          (payloads[0] as Record<string, unknown>)[nameKey] = marker;
        }
      }

      const res = await fetch('/api/dealcloud/push-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryTypeId: selectedId, rows: payloads }),
      });
      const data = (await res.json()) as {
        created: number;
        failed: number;
        error?: string;
        sampleErrors?: unknown[];
        batches?: { batch: number; created: number; failed: number; error?: string }[];
      };

      if (!res.ok) throw new Error(data.error ?? 'Push failed');
      addLog(
        data.failed > 0 ? 'warning' : 'success',
        `Push complete — ${data.created} created, ${data.failed} failed`,
      );
      if (data.created > 0) {
        setLatencySession({ pushTime, marker, entryTypeName: selectedET.objectName });
        addLog('info', `Latency monitor started — marker: ${marker}`);
        setActiveTab('latency');
      }
      if (data.failed > 0) {
        const batchError = data.batches?.find(b => b.error)?.error;
        if (batchError) {
          addLog('error', 'DealCloud error', batchError);
        } else if (data.sampleErrors?.length) {
          const sample = data.sampleErrors[0] as Record<string, unknown> | null;
          const dcErrors = sample?.Errors;
          if (dcErrors !== undefined) {
            addLog('error', 'DealCloud validation errors', JSON.stringify(dcErrors, null, 2));
          } else {
            addLog('error', 'Failed record (sample)', JSON.stringify(sample, null, 2));
          }
        } else {
          addLog('error', 'No error detail returned', JSON.stringify(data, null, 2));
        }
      }
    } catch (err) {
      addLog('error', 'Push failed', err instanceof Error ? err.message : String(err));
    } finally {
      setIsPushing(false);
    }
  }

  // ── Large push (server-side SSE) ────────────────────────────────────────────
  async function handleLargePush() {
    setIsPushing(true);
    setPushProgress(null);
    addLog('info', `Starting server-side generation of ${recordCount.toLocaleString()} records…`);
    setActiveTab('log');

    const largePushMarker = `LATENCY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const largePushTime = new Date().toISOString();

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/dealcloud/generate-and-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryTypeId: selectedId, count: recordCount }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6)) as Record<string, unknown>;

            if (event.type === 'start') {
              addLog('info', `Generating in batches — ${event.totalBatches} batch(es)`);
            } else if (event.type === 'batch_done') {
              setPushProgress({
                percent: Number(event.percent),
                created: Number(event.totalCreated),
                batchNum: Number(event.batchNum),
                totalBatches: Number(event.totalBatches ?? 0),
              });
              addLog(
                'success',
                `Batch ${event.batchNum}: ${event.created} created, ${event.failed} failed`,
              );
            } else if (event.type === 'batch_error') {
              addLog('error', `Batch ${event.batchIndex} error`, String(event.error));
            } else if (event.type === 'done') {
              addLog(
                'success',
                `Done — ${Number(event.totalCreated).toLocaleString()} created, ${Number(event.totalFailed).toLocaleString()} failed`,
              );
              setPushProgress(null);
              if (Number(event.totalCreated) > 0) {
                setLatencySession({
                  pushTime: largePushTime,
                  marker: largePushMarker,
                  entryTypeName: selectedET.objectName,
                });
                addLog('info', `Latency monitor started — marker: ${largePushMarker}`);
                setActiveTab('latency');
              }
            } else if (event.type === 'error') {
              addLog('error', 'Server error', String(event.error));
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        addLog('warning', 'Push cancelled by user');
      } else {
        addLog('error', 'Push failed', err instanceof Error ? err.message : String(err));
      }
      setPushProgress(null);
    } finally {
      setIsPushing(false);
      abortRef.current = null;
    }
  }

  function handleGenerateAndPush() {
    if (recordCount <= SMALL_PUSH_LIMIT) {
      handleSmallPush();
    } else {
      handleLargePush();
    }
  }

  function handleCancelPush() {
    abortRef.current?.abort();
  }

  // ── Fetch site data ─────────────────────────────────────────────────────────
  async function handleFetchSiteData() {
    setIsFetching(true);
    setSiteData([]);
    setSiteTotal(0);
    setSiteLoaded(0);
    addLog('info', `Fetching site data for ${selectedET.objectName}…`);
    setActiveTab('site');

    try {
      const fieldIds = allFields.map(f => f.fieldId);
      let skip = 0;
      const limit = 1000;
      let total = 0;
      const allRows: Record<string, unknown>[] = [];

      do {
        const res = await fetch('/api/dealcloud/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entryTypeId: selectedId, fieldIds, skip, limit }),
        });
        const data = (await res.json()) as { rows?: Record<string, unknown>[]; total?: number; error?: string };
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
        total = data.total ?? 0;
        allRows.push(...(data.rows ?? []));
        setSiteData([...allRows]);
        setSiteTotal(total);
        setSiteLoaded(allRows.length);
        skip += limit;
      } while (allRows.length < total);

      addLog('success', `Loaded ${allRows.length.toLocaleString()} of ${total.toLocaleString()} records`);
    } catch (err) {
      addLog('error', 'Fetch failed', err instanceof Error ? err.message : String(err));
    } finally {
      setIsFetching(false);
    }
  }

  // ── Input handling ──────────────────────────────────────────────────────────
  function handleCountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCountInput(e.target.value);
    const n = parseInt(e.target.value, 10);
    if (!isNaN(n)) setRecordCount(n);
  }

  function handleCountBlur() {
    const clamped = Math.max(1, Math.min(10_000_000, recordCount || 1));
    setRecordCount(clamped);
    setCountInput(String(clamped));
  }

  const pushButtonLabel =
    recordCount > SMALL_PUSH_LIMIT
      ? `Generate & Push ${recordCount.toLocaleString()}`
      : 'Generate & Push';

  const samplePayload = sampleData.slice(0, 5).map(r => toRowApiPayload(r, writableFields));

  const statusDot =
    connectionStatus === 'connected'
      ? 'bg-green-500'
      : connectionStatus === 'checking'
        ? 'bg-amber-500 animate-pulse'
        : connectionStatus === 'error'
          ? 'bg-red-500'
          : 'bg-gray-500';
  const statusText =
    connectionStatus === 'connected'
      ? 'Connected'
      : connectionStatus === 'checking'
        ? 'Checking…'
        : connectionStatus === 'error'
          ? 'Error'
          : 'Not tested';

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className="w-[260px] shrink-0 flex flex-col border-r border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h1 className="font-bold text-base">DealCloud Testing</h1>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {process.env.NEXT_PUBLIC_DEALCLOUD_SITE_URL ?? 'Configure DEALCLOUD_SITE_URL'}
          </p>
        </div>

        {/* Connection status */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot}`} />
            <span className="text-sm">{statusText}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={handleTestConnection}
            disabled={connectionStatus === 'checking'}
          >
            Test Connection
          </Button>
        </div>

        {/* Entry type list */}
        <div className="flex-1 overflow-hidden">
          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Entry Types
          </div>
          <ScrollArea className="h-[calc(100%-32px)]">
            <div className="px-2 pb-4 space-y-1">
              {entryTypes.map(et => (
                <button
                  key={et.objectId}
                  onClick={() => setSelectedId(et.objectId)}
                  className={`w-full text-left rounded-md px-3 py-2.5 transition-colors ${
                    selectedId === et.objectId
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded border text-xs font-bold shrink-0 ${
                        selectedId === et.objectId ? 'bg-white/20 border-white/30 text-white' : typeBadgeClass(et.objectType)
                      }`}
                    >
                      {typeLabel(et.objectType)}
                    </span>
                    <span className="font-medium text-sm truncate">{et.objectName}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 ml-7">
                    <span className="text-xs opacity-70">{et.fields.length} fields</span>
                    <span className="text-xs opacity-50">ID:{et.objectId}</span>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="shrink-0 flex items-center gap-3 px-5 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="font-semibold text-base">{selectedET.objectName}</h2>
            <span
              className={`inline-flex items-center justify-center w-5 h-5 rounded border text-xs font-bold ${typeBadgeClass(selectedET.objectType)}`}
            >
              {typeLabel(selectedET.objectType)}
            </span>
            <Badge variant="outline" className="font-mono text-xs">
              ID:{selectedET.objectId}
            </Badge>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Input
              type="number"
              min={1}
              max={10_000_000}
              value={countInput}
              onChange={handleCountChange}
              onBlur={handleCountBlur}
              className="w-32 font-mono"
              disabled={isPushing}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={isGenerating || isPushing}
            >
              {isGenerating ? 'Generating…' : 'Preview Data'}
            </Button>

            {isPushing ? (
              <Button variant="destructive" size="sm" onClick={handleCancelPush}>
                Cancel Push
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleGenerateAndPush}
                disabled={recordCount < 1 || isGenerating}
              >
                {pushButtonLabel}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleFetchSiteData}
              disabled={isFetching || isPushing}
            >
              {isFetching ? 'Fetching…' : 'Fetch Site Data'}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {isPushing && pushProgress && (
          <div className="shrink-0 px-5 py-2 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <Progress value={pushProgress.percent} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {pushProgress.percent}% · {pushProgress.created.toLocaleString()} created · Batch{' '}
                {pushProgress.batchNum}
                {pushProgress.totalBatches > 0 ? ` of ${pushProgress.totalBatches}` : ''}
              </span>
            </div>
          </div>
        )}

        {/* Field schema card */}
        <div className="shrink-0 px-5 py-2 border-b border-border">
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-xs text-muted-foreground mr-1">Fields:</span>
            {allFields.map(f => (
              <Badge key={f.fieldId} variant={f.required ? 'default' : 'outline'} className="text-xs">
                {f.fieldName}
                {f.required && '*'}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="shrink-0 px-5 pt-3">
              <TabsList>
                <TabsTrigger value="preview">
                  Preview
                  {sampleData.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                      {sampleData.length}
                      {recordCount > CLIENT_PREVIEW_LIMIT && ` of ${recordCount.toLocaleString()}`}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="site">
                  Site Data
                  {siteData.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                      {siteLoaded.toLocaleString()}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="side-by-side">Side-by-Side</TabsTrigger>
                <TabsTrigger value="payload">API Payload</TabsTrigger>
                <TabsTrigger value="log">
                  Activity Log
                  {pushLog.length > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                      {pushLog.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="latency">
                  Sync Latency
                  {latencySession && (
                    <span className="ml-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Preview */}
            <TabsContent value="preview" className="flex-1 overflow-hidden px-5 pb-4 mt-3">
              {recordCount > CLIENT_PREVIEW_LIMIT && sampleData.length > 0 && (
                <div className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-md px-3 py-2 mb-2">
                  Showing {sampleData.length} preview records. Full generation of{' '}
                  {recordCount.toLocaleString()} records will happen server-side on push.
                </div>
              )}
              <div className="h-full overflow-hidden border border-border rounded-md">
                <DataTable records={sampleData} fields={allFields} />
              </div>
            </TabsContent>

            {/* Site Data */}
            <TabsContent value="site" className="flex-1 overflow-hidden px-5 pb-4 mt-3">
              <div className="h-full border border-border rounded-md p-2 overflow-hidden">
                <SiteDataTable
                  rows={siteData}
                  fields={allFields}
                  loadedCount={siteLoaded}
                  totalCount={siteTotal}
                />
              </div>
            </TabsContent>

            {/* Side by side */}
            <TabsContent value="side-by-side" className="flex-1 overflow-hidden px-5 pb-4 mt-3">
              <div className="grid grid-cols-2 gap-4 h-full">
                <div className="border border-border rounded-md overflow-hidden">
                  <div className="text-xs font-medium px-3 py-1.5 border-b border-border bg-muted/50">
                    Sample Data
                  </div>
                  <div className="h-[calc(100%-32px)]">
                    <DataTable records={sampleData} fields={allFields} />
                  </div>
                </div>
                <div className="border border-border rounded-md overflow-hidden">
                  <div className="text-xs font-medium px-3 py-1.5 border-b border-border bg-muted/50">
                    Site Data
                  </div>
                  <div className="h-[calc(100%-32px)] p-2">
                    <SiteDataTable
                      rows={siteData}
                      fields={allFields}
                      loadedCount={siteLoaded}
                      totalCount={siteTotal}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* API Payload */}
            <TabsContent value="payload" className="flex-1 overflow-hidden px-5 pb-4 mt-3">
              <div className="h-full border border-border rounded-md overflow-hidden">
                <ScrollArea className="h-full">
                  {samplePayload.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                      No payload — click &quot;Preview Data&quot; first
                    </div>
                  ) : (
                    <div className="p-4">
                      <pre className="font-mono text-xs text-foreground whitespace-pre-wrap">
                        {JSON.stringify(samplePayload, null, 2)}
                      </pre>
                      {recordCount > 5 && (
                        <p className="text-xs text-muted-foreground mt-3">
                          … and {(recordCount - 5).toLocaleString()} more records would be included
                          in the full push.
                        </p>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            {/* Activity Log */}
            <TabsContent value="log" className="flex-1 overflow-hidden px-5 pb-4 mt-3">
              <div className="h-full border border-border rounded-md overflow-hidden">
                <ScrollArea className="h-full p-3">
                  <PushLog entries={pushLog} />
                </ScrollArea>
              </div>
            </TabsContent>

            {/* Sync Latency */}
            <TabsContent value="latency" className="flex-1 overflow-hidden px-5 pb-4 mt-3">
              <div className="h-full border border-border rounded-md overflow-hidden p-3">
                <LatencyMonitor session={latencySession} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
