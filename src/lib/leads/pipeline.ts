import type { LeadMarketId } from "./types";

export type PipelineContact = {
  relevant: boolean;
  verificationStatus: "UNVERIFIED" | "PUBLIC_LISTING" | "VERIFIED";
  optedOut: boolean;
};

export type PipelineRecord = {
  suppressed: boolean;
  qualified: boolean;
  priority: "A" | "B" | "C" | "DISQUALIFIED";
  marketplaceEvidence: string;
  opportunity: string;
  contacts: PipelineContact[];
};

export type PipelineStats = {
  discovered: number;
  qualified: number;
  decisionMakers: number;
  verifiedContacts: number;
  marketplaceOpportunities: number;
  priorityA: number;
};

export function pipelineStats(records: PipelineRecord[]): PipelineStats {
  const active = records.filter((record) => !record.suppressed);
  return {
    discovered: records.length,
    qualified: active.filter((record) => record.qualified).length,
    decisionMakers: active.reduce(
      (total, record) => total + record.contacts.filter((contact) => contact.relevant && !contact.optedOut).length,
      0,
    ),
    verifiedContacts: active.reduce(
      (total, record) =>
        total +
        record.contacts.filter((contact) => contact.relevant && !contact.optedOut && contact.verificationStatus === "VERIFIED")
          .length,
      0,
    ),
    marketplaceOpportunities: active.filter(
      (record) => record.qualified && record.marketplaceEvidence.trim().length > 0 && record.opportunity.trim().length > 0,
    ).length,
    priorityA: active.filter((record) => record.qualified && record.priority === "A").length,
  };
}

export function pipelineLabels(market: LeadMarketId | "ALL") {
  if (market === "DUBAI") {
    return {
      title: "Dubai pipeline",
      description: "Ecommerce businesses headquartered in Dubai or operating substantial ecommerce there.",
      discovered: "Dubai businesses discovered",
      qualified: "Qualified Dubai companies",
      decisionMakers: "Dubai decision-makers identified",
      verifiedContacts: "Verified business contacts",
      marketplaceOpportunities: "Marketplace opportunities",
      priorityA: "Priority A prospects",
    };
  }
  if (market === "US") {
    return {
      title: "US pipeline",
      description: "Ecommerce brands with a verified United States headquarters or substantial US operating presence.",
      discovered: "US brands discovered",
      qualified: "Qualified US companies",
      decisionMakers: "US decision-makers identified",
      verifiedContacts: "Verified US business contacts",
      marketplaceOpportunities: "Marketplace opportunities",
      priorityA: "Priority A prospects",
    };
  }
  return {
    title: "Lead performance",
    description: "Combined view of the United States and Dubai pipelines. Exports stay available for either market.",
    discovered: "Companies discovered",
    qualified: "Qualified companies",
    decisionMakers: "Decision-makers identified",
    verifiedContacts: "Verified business contacts",
    marketplaceOpportunities: "Marketplace opportunities",
    priorityA: "Priority A prospects",
  };
}

export function toCsv(rows: Record<string, string | number>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0] ?? {});
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header] ?? "")).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function csvCell(value: string | number) {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Buffer) {
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function zipStored(files: { name: string; data: Buffer }[]) {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name);
    const crc = crc32(file.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 8);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(file.data.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(file.data.length, 20);
    central.writeUInt32LE(file.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    locals.push(local, name, file.data);
    centrals.push(central, name);
    offset += local.length + name.length + file.data.length;
  }
  const centralDir = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDir.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralDir, end]);
}

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function toXlsx(rows: Record<string, string | number>[]) {
  const headers = Object.keys(rows[0] ?? { Company: "" });
  const sheetRows = [headers, ...rows.map((row) => headers.map((header) => String(row[header] ?? "")))];
  const sheet = [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>`,
    ...sheetRows.map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => `<c r="${columnName(columnIndex)}${rowIndex + 1}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`)
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    }),
    `</sheetData></worksheet>`,
  ].join("");
  return zipStored([
    {
      name: "[Content_Types].xml",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
      ),
    },
    {
      name: "_rels/.rels",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      ),
    },
    {
      name: "xl/workbook.xml",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Leads" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      ),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
      ),
    },
    { name: "xl/worksheets/sheet1.xml", data: Buffer.from(sheet) },
  ]);
}

function columnName(index: number) {
  let n = index + 1;
  let name = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

export const EXPORT_COLUMNS = [
  "Market",
  "Company",
  "Country",
  "Emirate or US state",
  "City",
  "Headquarters location",
  "Operating locations",
  "Website",
  "Target marketplace",
  "Marketplace evidence",
  "Decision-maker",
  "Title",
  "Profile URL",
  "Business email",
  "Contact verification",
  "Opportunity",
  "Lead score",
  "Priority",
  "Recommended service",
  "Location status",
  "Location evidence",
  "Source URLs",
  "Date last verified",
  "Qualified",
  "Suppressed",
] as const;
