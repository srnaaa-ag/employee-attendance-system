import pdfMake from "pdfmake/build/pdfmake.min.js";
import "pdfmake/build/vfs_fonts.js";

/**
 * @param {{
 *   filename: string;
 *   rows: Array<{
 *     fullName: string;
 *     presentDays: number;
 *     approvedLeaveDays: number;
 *     workedHoursFormatted: string;
 *     lateCount: number;
 *     warning: string;
 *   }>;
 *   fromDate: string;
 *   toDate: string;
 *   deptLabel: string;
 *   warningFullMonthOfTo: boolean;
 * }} options
 */
export function downloadReportPdf({
  filename,
  rows,
  fromDate,
  toDate,
  deptLabel,
  warningFullMonthOfTo,
}) {
  const tableHeader = [
    { text: "Вработен", style: "tableHeader" },
    { text: "Денови присуство", style: "tableHeader" },
    { text: "Одобрено отсуство (ден.)", style: "tableHeader" },
    { text: "Работни часови", style: "tableHeader" },
    { text: "Доцнења", style: "tableHeader" },
    { text: "Предупредување", style: "tableHeader" },
  ];

  const tableBody = [tableHeader];

  if (rows.length === 0) {
    tableBody.push([
      {
        text: "Нема податоци за избраните филтри.",
        colSpan: 6,
        alignment: "center",
        color: "#666666",
      },
      "",
      "",
      "",
      "",
      "",
    ]);
  } else {
    for (const r of rows) {
      tableBody.push([
        r.fullName ?? "—",
        String(r.presentDays ?? 0),
        String(r.approvedLeaveDays ?? 0),
        r.workedHoursFormatted ?? "0:00",
        String(r.lateCount ?? 0),
        r.warning || "—",
      ]);
    }
  }

  const content = [
    { text: "Извештаи и статистики", style: "title" },
    { text: `Период: ${fromDate} – ${toDate}`, style: "meta" },
    { text: `Оддел: ${deptLabel}`, style: "meta", margin: [0, 0, 0, 10] },
  ];

  if (warningFullMonthOfTo) {
    content.push({
      text:
          "Напомена: „Предупредување“ според доцнења за целиот месец на датумот „До“. „Доцнења“ остануваат за периодот Од–До.",
      style: "note",
      margin: [0, 0, 0, 10],
    });
  }

  content.push({
    table: {
      headerRows: 1,
      widths: ["*", "auto", "auto", "auto", "auto", "*"],
      body: tableBody,
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => "#d4d8e2",
      vLineColor: () => "#d4d8e2",
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 4,
      paddingBottom: () => 4,
    },
  });

  const generatedAt = new Date().toLocaleString("mk-MK", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const docDefinition = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [28, 36, 28, 40],
    defaultStyle: {
      font: "Roboto",
      fontSize: 9,
      color: "#333333",
    },
    styles: {
      title: {
        fontSize: 16,
        bold: true,
        color: "#243c7c",
        margin: [0, 0, 0, 8],
      },
      meta: {
        fontSize: 10,
        color: "#555555",
      },
      note: {
        fontSize: 8,
        italics: true,
        color: "#666666",
      },
      tableHeader: {
        bold: true,
        fillColor: "#243c7c",
        color: "#ffffff",
        fontSize: 8,
      },
    },
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: `Генерирано: ${generatedAt}`, alignment: "left", fontSize: 7, color: "#888888" },
        {
          text: `Страна ${currentPage} / ${pageCount}`,
          alignment: "right",
          fontSize: 7,
          color: "#888888",
        },
      ],
      margin: [28, 0, 28, 0],
    }),
    content,
  };

  pdfMake.createPdf(docDefinition).download(filename);
}
