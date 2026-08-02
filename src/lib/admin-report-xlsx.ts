import ExcelJS from "exceljs";
import type { ReportPayload } from "@/lib/admin-reports";

function safeSheetName(title: string, index: number) {
  const cleaned = title
    .replace(/[\\/*?[\]:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 28);
  return cleaned || `ورقة ${index + 1}`;
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF121012" },
  };
  row.alignment = { horizontal: "right", vertical: "middle", wrapText: true };
  row.height = 22;
}

function autosize(sheet: ExcelJS.Worksheet, colCount: number) {
  for (let i = 1; i <= colCount; i += 1) {
    const column = sheet.getColumn(i);
    let max = 12;
    column.eachCell({ includeEmpty: false }, (cell) => {
      const text = String(cell.value ?? "");
      max = Math.min(48, Math.max(max, text.length + 2));
    });
    column.width = max;
    column.alignment = { horizontal: "right", vertical: "middle", wrapText: true };
  }
}

export async function buildReportXlsxBuffer(
  report: ReportPayload,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Montader Admin";
  workbook.created = new Date(report.generatedAt);
  workbook.modified = new Date();
  workbook.title = report.title;

  const summarySheet = workbook.addWorksheet("الملخص", {
    views: [{ rightToLeft: true }],
    properties: { defaultRowHeight: 18 },
  });

  summarySheet.addRow(["التقرير", report.title]);
  summarySheet.addRow([
    "تاريخ التوليد",
    new Date(report.generatedAt).toLocaleString("en-GB"),
  ]);
  summarySheet.addRow(["النوع", report.type]);
  summarySheet.addRow([]);
  styleHeaderRow(summarySheet.addRow(["البند", "القيمة"]));

  for (const item of report.summary) {
    summarySheet.addRow([item.label, item.value]);
  }

  for (const section of report.sections) {
    summarySheet.addRow([]);
    const sectionHeader = summarySheet.addRow([section.title, ""]);
    sectionHeader.font = { bold: true, color: { argb: "FFFF6614" } };
    for (const row of section.rows) {
      summarySheet.addRow([row.label, row.value]);
    }
  }

  autosize(summarySheet, 2);

  const usedNames = new Set<string>(["الملخص"]);

  report.tables.forEach((table, index) => {
    let name = safeSheetName(table.title, index);
    if (usedNames.has(name)) {
      name = `${name.slice(0, 26)} ${index + 1}`;
    }
    usedNames.add(name);

    const sheet = workbook.addWorksheet(name, {
      views: [{ rightToLeft: true }],
      properties: { defaultRowHeight: 18 },
    });

    styleHeaderRow(sheet.addRow(table.headers));
    for (const row of table.rows) {
      sheet.addRow(row);
    }
    autosize(sheet, Math.max(table.headers.length, 1));
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
