/** @typedef {{ user: object; employee: object }} RegistrationDraft */

export const CSV_TEMPLATE_HEADERS = [
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

/**
 * Прва линија на датотеката (со поддршка за наводници низ повеќе линии во теорија — само прв ред).
 */
function extractFirstRecordLine(text) {
  let line = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (c === '"') {
      inQuotes = !inQuotes;
      line += c;
      continue;
    }

    if (!inQuotes && (c === "\n" || c === "\r")) {
      if (c === "\r" && text[i + 1] === "\n") {
        i++;
      }
      break;
    }

    line += c;
  }

  return line;
}

export function detectDelimiter(text) {
  const first = extractFirstRecordLine(text);
  const commas = (first.match(/,/g) || []).length;
  const semis = (first.match(/;/g) || []).length;
  return semis > commas ? ";" : ",";
}

/**
 * @param {string} text
 * @param {string} delimiter
 * @returns {string[][]}
 */
export function parseDelimitedText(text, delimiter) {
  const rows = [];
  let row = [];
  let field = "";
  let i = 0;
  let inQuotes = false;
  const len = text.length;

  while (i < len) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (i + 1 < len && text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += c;
        i++;
      }
    } else if (c === '"') {
      inQuotes = true;
      i++;
    } else if (c === delimiter) {
      row.push(field);
      field = "";
      i++;
    } else if (c === "\n" || c === "\r") {
      row.push(field);
      field = "";
      if (c === "\r" && i + 1 < len && text[i + 1] === "\n") {
        i++;
      }
      i++;
      if (row.some((cell) => String(cell).trim() !== "")) {
        rows.push(row);
      }
      row = [];
    } else {
      field += c;
      i++;
    }
  }

  row.push(field);
  if (row.some((cell) => String(cell).trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

function normalizeHeaderKey(raw) {
  const t = String(raw ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");
  return HEADER_ALIASES[t] || t;
}

function stripBom(text) {
  if (text.charCodeAt(0) === 0xfeff) {
    return text.slice(1);
  }
  return text;
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
  if (!rows.length) {
    return {
      headers: [],
      items: [],
      headerError: "Датотеката е празна.",
      importableCount: 0,
      rowCount: 0,
    };
  }

  const headers = rows[0].map((c) => normalizeHeaderKey(c));

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

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
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
 * @param {string} fileText
 */
export function parseEmployeeCsv(fileText) {
  const text = stripBom(fileText);
  const delimiter = detectDelimiter(text);
  const rows = parseDelimitedText(text, delimiter);
  return buildImportItemsFromRows(rows);
}

export function downloadEmployeeCsvTemplate() {
  const header = CSV_TEMPLATE_HEADERS.join(",");
  const example =
      "ana.primer@firma.mk,lozinka456,Ана,Пример,IT,Developer,2024-06-01,,EMPLOYEE,08:00,16:00,41.9981,21.4254,100";
  const bom = "\ufeff";
  const body = `${bom}${header}\n${example}\n`;
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "vraboteni_primer.csv";
  a.click();
  URL.revokeObjectURL(url);
}
