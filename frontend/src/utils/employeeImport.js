import * as XLSX from "xlsx";

/** @typedef {{ user: object; employee: object }} RegistrationDraft */

export const IMPORT_TEMPLATE_HEADERS = [
  "email",
  "password",
  "first_name",
  "last_name",
  "department",
  "position",
  "employment_date",
  "phone",
  "role",
  "work_start_time",
  "work_end_time",
  "allowed_latitude",
  "allowed_longitude",
  "allowed_radius_meters",
];

const HEADER_ALIASES = {
  e_mail: "email",
  "e-mail": "email",
  mail: "email",
  pass: "password",
  lozinka: "password",
  ime: "first_name",
  firstname: "first_name",
  prezime: "last_name",
  lastname: "last_name",
  dept: "department",
  odel: "department",
  otdel: "department",
  pozicija: "position",
  datum: "employment_date",
  datum_vrabotuvanje: "employment_date",
  tel: "phone",
  telefon: "phone",
  lat: "allowed_latitude",
  lng: "allowed_longitude",
  lon: "allowed_longitude",
  radius: "allowed_radius_meters",
  radius_m: "allowed_radius_meters",
};

const REQUIRED = [
  "email",
  "password",
  "first_name",
  "last_name",
  "department",
  "position",
  "employment_date",
];

const ALLOWED_ROLES = new Set(["EMPLOYEE", "ADMIN", "SUPER_ADMIN"]);

const TEMPLATE_EXAMPLE_ROW = [
  "ana.primer@firma.mk",
  "lozinka456",
  "Ана",
  "Пример",
  "IT",
  "Developer",
  "2024-06-01",
  "",
  "EMPLOYEE",
  "08:00",
  "16:00",
  41.9981,
  21.4254,
  100,
];

function normalizeHeaderKey(raw) {
  const t = String(raw ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
  return HEADER_ALIASES[t] || t;
}

function parseNumber(val, fallback) {
  if (val == null || String(val).trim() === "") {
    return fallback;
  }
  const n = Number(String(val).replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

function normalizeTime(raw, fallback) {
  const t = String(raw ?? "").trim();
  if (!t) return fallback;
  if (/^\d{1,2}:\d{2}$/.test(t)) {
    const [h, m] = t.split(":");
    return `${h.padStart(2, "0")}:${m}`;
  }
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(t)) {
    return t.slice(0, 5);
  }
  return t;
}

function formatIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function excelSerialToIsoDate(serial) {
  const parsed = XLSX.SSF.parse_date_code(serial);
  if (!parsed) return null;
  const m = String(parsed.m).padStart(2, "0");
  const d = String(parsed.d).padStart(2, "0");
  return `${parsed.y}-${m}-${d}`;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function cellToString(value) {
  if (value == null || value === "") return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatIsoDate(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 0 && value < 1) {
      const totalMinutes = Math.round(value * 24 * 60);
      const hours = Math.floor(totalMinutes / 60) % 24;
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
    if (value >= 25569 && value < 80000) {
      const fromSerial = excelSerialToIsoDate(value);
      if (fromSerial) return fromSerial;
    }
    return String(value).replace(",", ".");
  }

  return String(value).trim();
}

function normalizeDate(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return "";

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

  const dmy = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(s);
  if (dmy) {
    const dd = dmy[1].padStart(2, "0");
    const mm = dmy[2].padStart(2, "0");
    return `${dmy[3]}-${mm}-${dd}`;
  }

  return s;
}

/**
 * @param {unknown[][]} rawRows
 * @returns {string[][]}
 */
function rowsToStringMatrix(rawRows) {
  return rawRows.map((row) => {
    const cells = Array.isArray(row) ? row : [];
    const normalized = cells.map((cell) => cellToString(cell));
    while (
        normalized.length > 0 &&
        normalized[normalized.length - 1] === ""
    ) {
      normalized.pop();
    }
    return normalized;
  });
}

/**
 * @param {string[][]} rows
 * @returns {{
 *   headers: string[];
 *   items: { line: number; errors: string[]; draft: RegistrationDraft | null }[];
 *   headerError?: string;
 *   importableCount: number;
 *   rowCount: number;
 * }}
 */
export function buildImportItemsFromRows(rows) {
  const dataRows = rows.filter((row) =>
      row.some((cell) => String(cell ?? "").trim() !== "")
  );

  if (!dataRows.length) {
    return {
      headers: [],
      items: [],
      headerError: "Датотеката е празна.",
      importableCount: 0,
      rowCount: 0,
    };
  }

  const headers = dataRows[0].map((c) => normalizeHeaderKey(c));

  const missing = REQUIRED.filter((k) => !headers.includes(k));
  if (missing.length) {
    return {
      headers,
      items: [],
      headerError: `Недостигаат задолжителни колони: ${missing.join(", ")}.`,
      importableCount: 0,
      rowCount: 0,
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const items = [];

  for (let r = 1; r < dataRows.length; r++) {
    const cells = dataRows[r];
    const line = r + 1;
    const obj = {};

    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      if (!key) continue;
      obj[key] = cells[c] != null ? String(cells[c]) : "";
    }

    const errors = [];

    if (!String(obj.email || "").trim()) {
      errors.push("празен email");
    } else if (!emailRegex.test(String(obj.email).trim())) {
      errors.push("невалиден email");
    }

    const pw = String(obj.password || "").trim();
    if (!pw) {
      errors.push("празна лозинка");
    } else if (pw.length < 6) {
      errors.push("лозинка < 6 знаци");
    }

    if (!String(obj.first_name || "").trim()) {
      errors.push("празно име");
    }
    if (!String(obj.last_name || "").trim()) {
      errors.push("празно презиме");
    }
    if (!String(obj.department || "").trim()) {
      errors.push("празен оддел");
    }
    if (!String(obj.position || "").trim()) {
      errors.push("празна позиција");
    }

    const empDate = normalizeDate(obj.employment_date);
    if (!empDate || !/^\d{4}-\d{2}-\d{2}$/.test(empDate)) {
      errors.push("невалиден датум (користи YYYY-MM-DD или ДД.ММ.ГГГГ)");
    }

    const role = String(obj.role || "EMPLOYEE")
        .trim()
        .toUpperCase();
    if (obj.role != null && String(obj.role).trim() !== "" && !ALLOWED_ROLES.has(role)) {
      errors.push(`невалидна улога: ${role}`);
    }

    const lat = parseNumber(obj.allowed_latitude, 41.9981);
    const lng = parseNumber(obj.allowed_longitude, 21.4254);
    const rad = parseNumber(obj.allowed_radius_meters, 100);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      errors.push("lat/lng мора да бидат броеви");
    }
    if (!Number.isFinite(rad) || rad <= 0) {
      errors.push("радиусот мора да е > 0");
    }

    const ws = normalizeTime(obj.work_start_time, "08:00");
    const we = normalizeTime(obj.work_end_time, "16:00");
    if (!/^\d{2}:\d{2}$/.test(ws) || !/^\d{2}:\d{2}$/.test(we)) {
      errors.push("работно време (HH:MM)");
    }

    let draft = null;
    if (!errors.length) {
      draft = {
        user: {
          email: String(obj.email).trim(),
          password: pw,
          phone: String(obj.phone || "").trim(),
          role: role || "EMPLOYEE",
          profilePicture: null,
        },
        employee: {
          first_name: String(obj.first_name).trim(),
          last_name: String(obj.last_name).trim(),
          department: String(obj.department).trim(),
          position: String(obj.position).trim(),
          employment_date: empDate,
          allowed_latitude: lat,
          allowed_longitude: lng,
          allowed_radius_meters: rad,
          work_start_time: ws,
          work_end_time: we,
        },
      };
    }

    items.push({ line, errors, draft });
  }

  const importableCount = items.filter((it) => it.draft != null).length;

  return {
    headers,
    items,
    importableCount,
    rowCount: items.length,
  };
}

/**
 * @param {ArrayBuffer} buffer
 */
export function parseEmployeeExcel(buffer) {
  try {
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return {
        headers: [],
        items: [],
        headerError: "Excel датотеката нема листови.",
        importableCount: 0,
        rowCount: 0,
      };
    }

    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
      raw: true,
    });

    const rows = rowsToStringMatrix(rawRows);
    return buildImportItemsFromRows(rows);
  } catch {
    return {
      headers: [],
      items: [],
      headerError: "Не може да се прочита Excel датотеката.",
      importableCount: 0,
      rowCount: 0,
    };
  }
}

export function downloadEmployeeExcelTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    IMPORT_TEMPLATE_HEADERS,
    TEMPLATE_EXAMPLE_ROW,
  ]);

  ws["!cols"] = IMPORT_TEMPLATE_HEADERS.map((h) => ({
    wch: Math.max(h.length + 2, 14),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Vraboteni");
  XLSX.writeFile(wb, "vraboteni_primer.xlsx");
}
