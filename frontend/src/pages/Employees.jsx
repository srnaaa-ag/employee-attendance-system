import { useState, useCallback, useEffect } from "react";
import { useMatchMedia } from "../hooks/useMatchMedia";
import {
  getAllEmployees,
  registerEmployee,
  updateEmployee,
  deleteEmployee,
} from "../services/employeeService";
import EmployeeEditModal from "../components/EmployeeEditModal.jsx";
import CreateEmployeeModal from "../components/CreateEmployeeModal.jsx";
import ImportEmployeesCsvModal from "../components/ImportEmployeesCsvModal.jsx";
import "./Employees.css";

const faceBadgeClass = (kind) =>
    kind === "registered"
        ? "employees__badge employees__badge--ok"
        : "employees__badge employees__badge--warn";

const checkBadgeClass = (kind) =>
    kind === "ontime"
        ? "employees__badge employees__badge--ok"
        : "employees__badge employees__badge--warn";

function normalizeTime(value, fallback) {
  if (!value) return fallback;

  const text = String(value);

  if (/^\d{2}:\d{2}$/.test(text)) return text;
  if (/^\d{2}:\d{2}:\d{2}$/.test(text)) return text.slice(0, 5);

  return fallback;
}

function formatSchedule(start, end) {
  return `${normalizeTime(start, "08:00")} – ${normalizeTime(end, "16:00")}`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Не може да се прочита сликата."));

    reader.readAsDataURL(file);
  });
}

function mapEmployeeFromBackend(e) {
  const firstName = e.firstName ?? e.first_name ?? "";
  const lastName = e.lastName ?? e.last_name ?? "";
  const profilePicture = e.profilePicture ?? e.user?.profilePicture ?? null;

  const workStartTime = normalizeTime(
      e.work_start_time ?? e.workStartTime,
      "08:00"
  );

  const workEndTime = normalizeTime(
      e.work_end_time ?? e.workEndTime,
      "16:00"
  );

  const time =
      e.workScheduleLabel ??
      e.work_schedule_label ??
      formatSchedule(workStartTime, workEndTime);

  return {
    id: String(e.id),
    name: `${firstName} ${lastName}`.trim() || "Непознат вработен",

    firstName,
    lastName,

    dept: e.department ?? "—",
    position: e.position ?? "—",
    employmentDate: e.employmentDate ?? e.employment_date ?? "",

    allowedLatitude: Number(e.allowed_latitude ?? e.allowedLatitude ?? 41.9981),
    allowedLongitude: Number(
        e.allowed_longitude ?? e.allowedLongitude ?? 21.4254
    ),
    allowedRadiusMeters: Number(
        e.allowed_radius_meters ?? e.allowedRadiusMeters ?? 100
    ),

    workStartTime,
    workEndTime,

    email: e.email ?? e.user?.email ?? "",
    phone: e.phone ?? e.user?.phone ?? "",
    role: e.role ?? e.user?.role ?? "EMPLOYEE",

    profilePicture,
    hasFacePhoto:
        Boolean(e.hasFacePhoto) ||
        Boolean(profilePicture && String(profilePicture).trim().length > 0),

    ...(() => {
      const raw = e.todayCheckIn ?? e.today_check_in;
      const hasToday =
          raw != null && String(raw).trim() !== "";
      const label = hasToday
          ? normalizeTime(String(raw).trim(), String(raw).trim())
          : "—";
      return {
        checkLabel: label,
        checkKind: hasToday ? "ontime" : "warn",
      };
    })(),

    time,
  };
}

function buildDraft(emp) {
  return {
    id: emp.id,
    name: emp.name,

    firstName: emp.firstName ?? "",
    lastName: emp.lastName ?? "",

    dept: emp.dept,
    position: emp.position,
    employmentDate: emp.employmentDate ?? "",

    allowedLatitude: emp.allowedLatitude ?? 41.9981,
    allowedLongitude: emp.allowedLongitude ?? 21.4254,
    allowedRadiusMeters: emp.allowedRadiusMeters ?? 100,

    workStartTime: emp.workStartTime ?? "08:00",
    workEndTime: emp.workEndTime ?? "16:00",

    email: emp.email ?? "",
    phone: emp.phone ?? "",
    role: emp.role ?? "EMPLOYEE",

    photoFile: null,
    photoPreview: emp.profilePicture || null,
    originalProfilePicture: emp.profilePicture || null,
    hadFacePhoto: emp.hasFacePhoto,
    photoCleared: false,
  };
}

function emptyCreateDraft() {
  return {
    user: {
      email: "",
      password: "",
      phone: "",
      role: "EMPLOYEE",
      profilePicture: null,
    },
    employee: {
      first_name: "",
      last_name: "",
      department: "",
      position: "",
      employment_date: "",
      allowed_latitude: 41.9981,
      allowed_longitude: 21.4254,
      allowed_radius_meters: 100.0,
      work_start_time: "08:00",
      work_end_time: "16:00",
    },
  };
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const mobileEmployees = useMatchMedia("(max-width: 768px)");
  const [employeeQuery, setEmployeeQuery] = useState("");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDraft, setEditDraft] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState(emptyCreateDraft());

  const [importCsvOpen, setImportCsvOpen] = useState(false);

  const filteredEmployees = employees.filter((e) =>
      String(e.name ?? "")
          .toLowerCase()
          .includes(employeeQuery.trim().toLowerCase())
  );

  const loadEmployees = useCallback(async () => {
    try {
      const data = await getAllEmployees();
      const mapped = Array.isArray(data) ? data.map(mapEmployeeFromBackend) : [];
      setEmployees(mapped);
    } catch (err) {
      console.error("Error loading employees:", err);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const openEditModal = useCallback((emp) => {
    setEditDraft(buildDraft(emp));
    setEditModalOpen(true);
  }, []);

  const handleDeactivateEmployee = useCallback(
      async (emp) => {
        const message =
            `Да го отстраниме „${emp.name}“ од активните вработени?\n\n` +
            "Корисникот нема да може да се најави. Историските податоци " +
            "(евиденција, извештаи) остануваат во системот.";
        if (!window.confirm(message)) {
          return;
        }

        try {
          await deleteEmployee(emp.id);
          await loadEmployees();
        } catch (err) {
          console.error("Error deactivating employee:", err);
          alert(
              "Грешка при отстранување: " +
              (err.message || "Unknown error")
          );
        }
      },
      [loadEmployees]
  );

  const closeEditModal = useCallback(() => {
    if (editSaving) return;

    setEditDraft((d) => {
      if (d?.photoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(d.photoPreview);
      }
      return null;
    });

    setEditModalOpen(false);
  }, [editSaving]);

  const openCreateModal = useCallback(() => {
    setCreateDraft(emptyCreateDraft());
    setCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setCreateModalOpen(false);
  }, []);

  const saveEditModal = useCallback(async () => {
    if (!editDraft) return;

    if (!editDraft.workStartTime) {
      alert("Почетокот на работното време е задолжителен.");
      return;
    }

    if (!editDraft.workEndTime) {
      alert("Крајот на работното време е задолжителен.");
      return;
    }

    if (
        editDraft.allowedLatitude === "" ||
        editDraft.allowedLatitude == null ||
        Number.isNaN(Number(editDraft.allowedLatitude))
    ) {
      alert("Внесете валидна latitude (одбери точка на мапата).");
      return;
    }

    if (
        editDraft.allowedLongitude === "" ||
        editDraft.allowedLongitude == null ||
        Number.isNaN(Number(editDraft.allowedLongitude))
    ) {
      alert("Внесете валидна longitude (одбери точка на мапата).");
      return;
    }

    const radius = Number(editDraft.allowedRadiusMeters);
    if (
        editDraft.allowedRadiusMeters === "" ||
        Number.isNaN(radius) ||
        radius <= 0
    ) {
      alert("Радиусот мора да биде поголем од 0.");
      return;
    }

    setEditSaving(true);

    try {
      let nextProfilePicture = editDraft.originalProfilePicture || null;

      if (editDraft.photoCleared) {
        nextProfilePicture = "";
      }

      if (editDraft.photoFile) {
        nextProfilePicture = await fileToDataUrl(editDraft.photoFile);
      }

      const payload = {
        first_name: editDraft.firstName || "",
        last_name: editDraft.lastName || "",
        department: editDraft.dept,
        position: editDraft.position,
        employment_date:
            editDraft.employmentDate || new Date().toISOString().slice(0, 10),

        allowed_latitude: editDraft.allowedLatitude,
        allowed_longitude: editDraft.allowedLongitude,
        allowed_radius_meters: editDraft.allowedRadiusMeters,

        work_start_time: editDraft.workStartTime,
        work_end_time: editDraft.workEndTime,

        user: {
          email: editDraft.email,
          phone: editDraft.phone,
          role: editDraft.role || "EMPLOYEE",
          profilePicture: nextProfilePicture,
        },
      };

      const updated = await updateEmployee(editDraft.id, payload);
      const mapped = mapEmployeeFromBackend(updated);

      setEmployees((list) =>
          list.map((e) => (e.id === editDraft.id ? mapped : e))
      );

      if (editDraft.photoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(editDraft.photoPreview);
      }

      setEditDraft(null);
      setEditModalOpen(false);
    } catch (err) {
      console.error("Error updating employee:", err);
      alert(
          "Грешка при ажурирање на вработен: " +
          (err.message || "Unknown error")
      );
    } finally {
      setEditSaving(false);
    }
  }, [editDraft]);

  const saveCreateModal = async () => {
    const { user, employee } = createDraft;

    if (!user.email.trim()) {
      alert("Email е задолжителен");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(user.email)) {
      alert("Внесете валиден email");
      return;
    }

    if (!user.password.trim()) {
      alert("Лозинка е задолжителна");
      return;
    }

    if (user.password.length < 6) {
      alert("Лозинката мора да има најмалку 6 карактери");
      return;
    }

    if (!employee.first_name.trim()) {
      alert("Името е задолжително");
      return;
    }

    if (!employee.last_name.trim()) {
      alert("Презимето е задолжително");
      return;
    }

    if (!employee.department.trim()) {
      alert("Одделот е задолжителен");
      return;
    }

    if (!employee.position.trim()) {
      alert("Позицијата е задолжителна");
      return;
    }

    if (!employee.employment_date) {
      alert("Датумот на вработување е задолжителен");
      return;
    }

    if (!employee.work_start_time) {
      alert("Почетокот на работното време е задолжителен");
      return;
    }

    if (!employee.work_end_time) {
      alert("Крајот на работното време е задолжителен");
      return;
    }

    if (employee.allowed_latitude === "" || isNaN(employee.allowed_latitude)) {
      alert("Внесете валидна latitude");
      return;
    }

    if (employee.allowed_longitude === "" || isNaN(employee.allowed_longitude)) {
      alert("Внесете валидна longitude");
      return;
    }

    if (
        employee.allowed_radius_meters === "" ||
        isNaN(employee.allowed_radius_meters) ||
        employee.allowed_radius_meters <= 0
    ) {
      alert("Радиусот мора да биде поголем од 0");
      return;
    }

    try {
      await registerEmployee(createDraft);

      setCreateModalOpen(false);
      setCreateDraft(emptyCreateDraft());

      await loadEmployees();
    } catch (err) {
      console.error("Error creating employee:", err);
      alert(
          "Грешка при креирање на вработен: " +
          (err.message || "Unknown error")
      );
    }
  };

  return (
      <div className="employees-page">
        <section
            className="employees__shell"
            aria-labelledby="employees-main-title"
        >
          <h2 id="employees-main-title" className="employees__titlebar">
            Управување со вработени
          </h2>

          <div className="employees__body">
            <div className="employees__toolbar">
              <div className="employees__search-wrap">
                <span className="employees__search-icon" aria-hidden>
                  🔍
                </span>
                <input
                    type="search"
                    className="employees__search-input"
                    placeholder="Пребарај вработен"
                    value={employeeQuery}
                    onChange={(e) => setEmployeeQuery(e.target.value)}
                />
              </div>
              <button
                  type="button"
                  className="employees__btn employees__btn--primary"
                  onClick={openCreateModal}
              >
                + Внеси нов вработен
              </button>

              <button
                  type="button"
                  className="employees__btn employees__btn--outline"
                  onClick={() => setImportCsvOpen(true)}
              >
                Импорт CSV
              </button>
            </div>

            <div className="employees__table-card">
              <h3 className="employees__table-head">Податоци за вработени</h3>

              {mobileEmployees ? (
                  <div className="employees__cards">
                    {filteredEmployees.length === 0 ? (
                        <p className="employees__empty">Нема активни вработени.</p>
                    ) : (
                        filteredEmployees.map((e) => {
                          const faceKind = e.hasFacePhoto ? "registered" : "update";
                          const faceLabel = e.hasFacePhoto ? "Регистрирано" : "Ажурирај";

                          return (
                              <article key={e.id} className="employees__card">
                                <div className="employees__card-top">
                                  <h4 className="employees__card-name">{e.name}</h4>
                                  <span className={checkBadgeClass(e.checkKind)}>{e.checkLabel}</span>
                                </div>

                                <div className="employees__card-row">
                                  <span className="employees__card-k">Оддел</span>
                                  <span className="employees__card-v">{e.dept}</span>
                                </div>
                                <div className="employees__card-row">
                                  <span className="employees__card-k">Позиција</span>
                                  <span className="employees__card-v">{e.position}</span>
                                </div>
                                <div className="employees__card-row">
                                  <span className="employees__card-k">Лице</span>
                                  <span className={faceBadgeClass(faceKind)}>{faceLabel}</span>
                                </div>
                                <div className="employees__card-row">
                                  <span className="employees__card-k">Работно време</span>
                                  <span className="employees__card-v employees__cell-mono">{e.time}</span>
                                </div>

                                <div className="employees__card-actions">
                                  <button
                                      type="button"
                                      className="employees__edit"
                                      onClick={() => openEditModal(e)}
                                  >
                                    Уреди
                                  </button>
                                  <button
                                      type="button"
                                      className="employees__remove"
                                      onClick={() => handleDeactivateEmployee(e)}
                                  >
                                    Отстрани
                                  </button>
                                </div>
                              </article>
                          );
                        })
                    )}
                  </div>
              ) : (
                  <div className="employees__table-scroll">
                    <table className="employees__table">
                      <thead>
                      <tr>
                        <th scope="col">Име и презиме</th>
                        <th scope="col">Оддел</th>
                        <th scope="col">Позиција</th>
                        <th scope="col">Лице</th>
                        <th scope="col">Работно време</th>
                        <th scope="col">Check in денес</th>
                        <th scope="col" className="employees__th-actions">
                          Акции
                        </th>
                      </tr>
                      </thead>

                      <tbody>
                      {filteredEmployees.map((e) => {
                        const faceKind = e.hasFacePhoto ? "registered" : "update";
                        const faceLabel = e.hasFacePhoto
                            ? "Регистрирано"
                            : "Ажурирај";

                        return (
                            <tr key={e.id}>
                              <td className="employees__cell-strong">{e.name}</td>
                              <td>{e.dept}</td>
                              <td>{e.position}</td>

                              <td>
                              <span className={faceBadgeClass(faceKind)}>
                                {faceLabel}
                              </span>
                              </td>

                              <td className="employees__cell-mono">{e.time}</td>

                              <td>
                              <span className={checkBadgeClass(e.checkKind)}>
                                {e.checkLabel}
                              </span>
                              </td>

                              <td className="employees__cell-actions">
                                <div className="employees__action-btns">
                                  <button
                                      type="button"
                                      className="employees__edit"
                                      onClick={() => openEditModal(e)}
                                  >
                                    Уреди
                                  </button>
                                  <button
                                      type="button"
                                      className="employees__remove"
                                      onClick={() => handleDeactivateEmployee(e)}
                                  >
                                    Отстрани
                                  </button>
                                </div>
                              </td>
                            </tr>
                        );
                      })}
                      {filteredEmployees.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="employees__empty employees__empty--table">
                              Нема активни вработени.
                            </td>
                          </tr>
                      ) : null}
                      </tbody>
                    </table>
                  </div>
              )}
            </div>
          </div>
        </section>

        <EmployeeEditModal
            open={editModalOpen}
            draft={editDraft}
            onChange={setEditDraft}
            onClose={closeEditModal}
            onSave={saveEditModal}
        />

        <CreateEmployeeModal
            open={createModalOpen}
            draft={createDraft}
            onChange={setCreateDraft}
            onClose={closeCreateModal}
            onSave={saveCreateModal}
        />

        <ImportEmployeesCsvModal
            open={importCsvOpen}
            onClose={() => setImportCsvOpen(false)}
            onImported={loadEmployees}
        />
      </div>
  );
}