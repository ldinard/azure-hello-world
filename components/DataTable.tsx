import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { FieldDef } from '@/lib/dealcloud-schema';
import type { SampleRecord } from '@/lib/sample-data-generator';

interface DataTableProps {
  records: SampleRecord[];
  fields: FieldDef[];
}

const currencyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function formatCell(value: unknown, field: FieldDef): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>;

  if (field.fieldType === 'Boolean') {
    return value ? (
      <Badge variant="success">Yes</Badge>
    ) : (
      <Badge variant="destructive">No</Badge>
    );
  }

  if (field.fieldType === 'Choice') {
    const vals = String(value).split(', ').filter(Boolean);
    return (
      <div className="flex flex-wrap gap-1">
        {vals.map(v => <Badge key={v} variant="outline">{v}</Badge>)}
      </div>
    );
  }

  if (field.formatType === 'Currency' && typeof value === 'number') {
    return <span className="font-mono">{currencyFmt.format(value)}</span>;
  }

  if (field.formatType === 'Percentage' && typeof value === 'number') {
    return <span className="font-mono">{value}%</span>;
  }

  if (field.fieldType === 'Date' && typeof value === 'string') {
    return <span>{new Date(value).toLocaleDateString()}</span>;
  }

  return <span className="truncate">{String(value)}</span>;
}

export default function DataTable({ records, fields }: DataTableProps) {
  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No records — click &quot;Preview Data&quot; to generate
      </div>
    );
  }

  const visibleFields = fields.filter(f => !f.isSystemField);

  return (
    <ScrollArea className="w-full h-full">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/50 sticky top-0">
              <th className="text-left px-3 py-2 text-muted-foreground font-medium w-10">#</th>
              {visibleFields.map(f => (
                <th
                  key={f.fieldId}
                  className="text-left px-3 py-2 text-muted-foreground font-medium whitespace-nowrap"
                  style={{ minWidth: 140 }}
                >
                  {f.fieldName}
                  {f.required && <span className="text-destructive ml-0.5">*</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record, rowIdx) => (
              <tr key={rowIdx} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2 text-muted-foreground font-mono text-xs">{rowIdx + 1}</td>
                {visibleFields.map(f => (
                  <td
                    key={f.fieldId}
                    className="px-3 py-2 max-w-[250px] overflow-hidden"
                  >
                    {formatCell(record[f.apiName], f)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ScrollArea>
  );
}
