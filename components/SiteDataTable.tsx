'use client';

import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import type { FieldDef } from '@/lib/dealcloud-schema';

interface SiteDataTableProps {
  rows: Record<string, unknown>[];
  fields: FieldDef[];
  loadedCount: number;
  totalCount: number;
}

const PAGE_SIZE = 50;

// Build a map: fieldId (string) or apiName -> fieldDef
function buildFieldMap(fields: FieldDef[]): Map<string, FieldDef> {
  const map = new Map<string, FieldDef>();
  for (const f of fields) {
    map.set(String(f.fieldId), f);
    map.set(f.apiName, f);
  }
  return map;
}

function getColumns(rows: Record<string, unknown>[], fieldMap: Map<string, FieldDef>): string[] {
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0]).filter(k => k !== 'EntryId');
  return keys;
}

function getHeader(key: string, fieldMap: Map<string, FieldDef>): string {
  const f = fieldMap.get(key);
  return f ? f.fieldName : key;
}

function formatCell(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return <span className="font-mono text-xs">{JSON.stringify(value)}</span>;
  return String(value);
}

export default function SiteDataTable({ rows, fields, loadedCount, totalCount }: SiteDataTableProps) {
  const [page, setPage] = useState(0);
  const fieldMap = buildFieldMap(fields);
  const columns = getColumns(rows, fieldMap);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No data — click &quot;Fetch Site Data&quot; to load
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          {loadedCount.toLocaleString()} loaded of {totalCount.toLocaleString()} total
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setPage(0)} disabled={page === 0}>First</Button>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setPage(p => p - 1)} disabled={page === 0}>Prev</Button>
          <span className="px-2">{page + 1} / {totalPages || 1}</span>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Next</Button>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>Last</Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 sticky top-0">
                <th className="text-left px-3 py-2 text-muted-foreground font-medium font-mono text-xs whitespace-nowrap" style={{ minWidth: 100 }}>
                  Entry ID
                </th>
                {columns.map(col => (
                  <th
                    key={col}
                    className="text-left px-3 py-2 text-muted-foreground font-medium whitespace-nowrap"
                    style={{ minWidth: 140 }}
                  >
                    {getHeader(col, fieldMap)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => (
                <tr key={i} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                    {String(row['EntryId'] ?? '—')}
                  </td>
                  {columns.map(col => (
                    <td key={col} className="px-3 py-2 max-w-[250px] overflow-hidden">
                      {formatCell(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  );
}
