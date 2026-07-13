// Minimal RFC-4180-ish CSV parser: quoted fields, embedded commas/quotes/newlines.
// Registers are small flat files; no streaming needed.

export type CsvTable = { headers: string[]; rows: Record<string, string>[] };

export function parseCsv(text: string): CsvTable {
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      record.push(field);
      field = "";
    } else if (c === "\n") {
      record.push(field);
      field = "";
      records.push(record);
      record = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  const nonEmpty = records.filter((r) => r.some((f) => f.trim() !== ""));
  if (nonEmpty.length === 0) return { headers: [], rows: [] };

  const headers = nonEmpty[0].map((h) => h.trim());
  const rows = nonEmpty.slice(1).map((r) => {
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (r[idx] ?? "").trim();
    });
    return row;
  });
  return { headers, rows };
}

// Serialize back to RFC-4180 CSV. Fields containing commas, quotes, or
// newlines are quoted; everything else is written bare, matching how the
// registers are hand-maintained (minimal quoting keeps git diffs readable).
export function stringifyCsv(table: CsvTable): string {
  const esc = (v: string) =>
    /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const lines = [table.headers.map(esc).join(",")];
  for (const row of table.rows) {
    lines.push(table.headers.map((h) => esc(row[h] ?? "")).join(","));
  }
  return lines.join("\n") + "\n";
}
