import { useEffect, useRef, useState } from "react";
import { registerEmployee } from "../services/employeeService.js";
import {
  downloadEmployeeExcelTemplate,
  parseEmployeeExcel,
} from "../utils/employeeImport.js";

export default function ImportEmployeesExcelModal({
  open,
  onClose,
  onImported,
}) {
  const panelRef = useRef(null);
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [parseResult, setParseResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importLog, setImportLog] = useState(null);

  useEffect(() => {
    if (open) {
      setFileName("");
      setParseResult(null);
      setImportLog(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape" && !importing) onClose();
    };

    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, importing]);

  if (!open) return null;

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportLog(null);

    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result;
      if (!(buffer instanceof ArrayBuffer)) {
        setParseResult({
          headers: [],
          items: [],
          headerError: "Не може да се прочита датотеката.",
          importableCount: 0,
          rowCount: 0,
        });
        return;
      }
      setParseResult(parseEmployeeExcel(buffer));
    };
    reader.onerror = () => {
      setParseResult({
        headers: [],
        items: [],
        headerError: "Не може да се прочита датотеката.",
        importableCount: 0,
        rowCount: 0,
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.headerError || !parseResult.importableCount) {
      return;
    }

    setImporting(true);

    const toRun = parseResult.items.filter((it) => it.draft);

    const ok = [];
    const fail = [];

    for (const it of toRun) {
      try {
        await registerEmployee(it.draft);
        ok.push(it.line);
      } catch (err) {
        const msg = err?.message || String(err);
        fail.push({ line: it.line, message: msg });
      }
    }

    setImporting(false);
    setImportLog({ ok, fail });

    if (onImported) {
      onImported();
    }
  };

  const errRows = parseResult?.items?.filter((it) => it.errors.length) ?? [];
  const canImport =
      parseResult &&
      !parseResult.headerError &&
      parseResult.importableCount > 0 &&
      !importing;

  return (
      <div
          className="emp-modal"
          role="presentation"
          onMouseDown={(e) => e.target === e.currentTarget && !importing && onClose()}
      >
        <div
            className="emp-modal__panel emp-modal__panel--wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="excel-import-title"
            ref={panelRef}
            onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="emp-modal__header">
            <h2 id="excel-import-title" className="emp-modal__title">
              Импорт на вработени (Excel)
            </h2>
            <button
                type="button"
                className="emp-modal__x"
                onClick={() => !importing && onClose()}
                disabled={importing}
                aria-label="Затвори"
            >
              ×
            </button>
          </div>

          <div className="emp-modal__body">
            <p className="emp-modal__hint">
              Поддржани формати: <strong>.xlsx</strong> и <strong>.xls</strong>. Користи го
              првиот лист во датотеката. За датуми и време, препорачано е формат{" "}
              <strong>YYYY-MM-DD</strong> и <strong>HH:MM</strong>.
            </p>

            <div className="employees__import-actions">
              <button
                  type="button"
                  className="employees__btn employees__btn--outline"
                  onClick={() => downloadEmployeeExcelTemplate()}
              >
                Преземи пример (.xlsx)
              </button>
              <button
                  type="button"
                  className="employees__btn employees__btn--primary"
                  onClick={handlePickFile}
                  disabled={importing}
              >
                Избери датотека…
              </button>
              <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="emp-modal__file"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
              />
            </div>

            {fileName ? (
                <p className="emp-modal__hint emp-modal__hint--info">
                  Датотека: <strong>{fileName}</strong>
                </p>
            ) : null}

            {parseResult?.headerError ? (
                <p className="employees__import-error">{parseResult.headerError}</p>
            ) : null}

            {parseResult && !parseResult.headerError ? (
                <p className="emp-modal__hint">
                  Редови со податоци: <strong>{parseResult.rowCount}</strong>. Валидни за
                  увоз: <strong>{parseResult.importableCount}</strong>.
                  {errRows.length ? (
                      <>
                          {" "}
                          Со грешки: <strong>{errRows.length}</strong>.
                      </>
                  ) : null}
                </p>
            ) : null}

            {errRows.length > 0 ? (
                <div className="employees__import-preview-wrap">
                  <h3 className="employees__import-preview-title">Грешки по ред</h3>
                  <ul className="employees__import-error-list">
                    {errRows.slice(0, 40).map((it) => (
                        <li key={it.line}>
                          Ред {it.line}: {it.errors.join("; ")}
                        </li>
                    ))}
                  </ul>
                  {errRows.length > 40 ? (
                      <p className="emp-modal__hint">… и уште {errRows.length - 40} редови.</p>
                  ) : null}
                </div>
            ) : null}

            {importLog ? (
                <div className="employees__import-summary">
                  <h3 className="employees__import-preview-title">Резултат</h3>
                  <p className="emp-modal__hint--info">
                    Успешно зачувани: <strong>{importLog.ok.length}</strong>. Неуспешни:{" "}
                    <strong>{importLog.fail.length}</strong>.
                  </p>
                  {importLog.fail.length ? (
                      <ul className="employees__import-error-list">
                        {importLog.fail.map((f) => (
                            <li key={f.line}>
                              Ред {f.line}: {f.message}
                            </li>
                        ))}
                      </ul>
                  ) : null}
                </div>
            ) : null}
          </div>

          <div className="emp-modal__footer">
            <button
                type="button"
                className="employees__btn employees__btn--outline"
                onClick={onClose}
                disabled={importing}
            >
              {importLog ? "Затвори" : "Откажи"}
            </button>
            <button
                type="button"
                className="employees__btn employees__btn--primary"
                onClick={handleImport}
                disabled={!canImport}
            >
              {importing ? "Увезувам…" : "Импортирај валидни редови"}
            </button>
          </div>
        </div>
      </div>
  );
}
