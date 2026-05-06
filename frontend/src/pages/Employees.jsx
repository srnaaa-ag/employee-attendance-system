import { useState, useCallback, useEffect } from "react";
import { getAllEmployees } from "../services/employeeService";
import { createEmployee } from "../services/api.js";
import EmployeeEditModal from "../components/EmployeeEditModal.jsx";
import CreateEmployeeModal from "../components/CreateEmployeeModal.jsx";
import "./Employees.css";

const faceBadgeClass = (kind) =>
  kind === "registered"
    ? "employees__badge employees__badge--ok"
    : "employees__badge employees__badge--warn";
const checkBadgeClass = (kind) =>
  kind === "ontime"
    ? "employees__badge employees__badge--ok"
    : "employees__badge employees__badge--warn";

function createDefaultWeek() {
  const work = { isOff: false, start: "08:00", end: "16:00" };
  const off = { isOff: true, start: "08:00", end: "16:00" };
  return {
    mon: { ...work },
    tue: { ...work },
    wed: { ...work },
    thu: { ...work },
    fri: { ...work },
    sat: { ...off },
    sun: { ...off },
  };
}

function cloneWeek(w) {
  const out = {};
  for (const k of Object.keys(w)) {
    out[k] = { ...w[k] };
  }
  return out;
}

function summarizeWeek(week) {
  const { mon, tue, wed, thu, fri, sat, sun } = week;
  const workingDays = [mon, tue, wed, thu, fri].filter((d) => !d.isOff);
  if (workingDays.length === 0) return "—";
  const { start, end } = workingDays[0];
  const same =
    workingDays.every((d) => d.start === start && d.end === end) &&
    [mon, tue, wed, thu, fri].every(
      (d) => d.isOff || (d.start === start && d.end === end),
    );
  const onlyWeekdaysOn =
    !mon.isOff &&
    !tue.isOff &&
    !wed.isOff &&
    !thu.isOff &&
    !fri.isOff &&
    sat.isOff &&
    sun.isOff;
  if (same && onlyWeekdaysOn) return `${start} – ${end} (Пон–Пет)`;
  if (same) return `${start} – ${end}`;
  return `${start} – ${end} (+други смени)`;
}

function buildDraft(emp) {
  return {
    id: emp.id,
    name: emp.name,
    dept: emp.dept,
    position: emp.position,
    week: cloneWeek(emp.week),
    photoFile: null,
    photoPreview: null,
    hadFacePhoto: emp.hasFacePhoto,
    photoCleared: false,
  };
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);

  function mapEmployeeFromBackend(e) {
    const week = createDefaultWeek();
    return {
      id: String(e.id),
      name: `${e.firstName} ${e.lastName}`,
      dept: e.department,
      position: e.position,
      hasFacePhoto: false,
      checkLabel: "—",
      checkKind: "ontime",
      week,
      time: summarizeWeek(week),
    };
  }

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDraft, setEditDraft] = useState(null);

  const openEditModal = useCallback((emp) => {
    setEditDraft(buildDraft(emp));
    setEditModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setEditDraft((d) => {
      if (d?.photoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(d.photoPreview);
      }
      return null;
    });
    setEditModalOpen(false);
  }, []);

  const saveEditModal = useCallback(() => {
    if (!editDraft) return;
    if (editDraft.photoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(editDraft.photoPreview);
    }
    const hasFacePhoto =
      editDraft.photoFile || editDraft.photoPreview
        ? true
        : editDraft.photoCleared
          ? false
          : editDraft.hadFacePhoto;
    setEmployees((list) =>
      list.map((e) => {
        if (e.id !== editDraft.id) return e;
        return {
          ...e,
          dept: editDraft.dept.trim() || e.dept,
          position: editDraft.position.trim() || e.position,
          week: cloneWeek(editDraft.week),
          time: summarizeWeek(editDraft.week),
          hasFacePhoto,
        };
      }),
    );
    setEditDraft(null);
    setEditModalOpen(false);
  }, [editDraft]);

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState({
    user: {
      email: "",
      password: "",
      role: "EMPLOYEE",
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
    },
  });

  const openCreateModal = () => {
    setCreateDraft({
      user: {
        email: "",
        password: "",
        role: "EMPLOYEE",
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
      },
    });
    setCreateModalOpen(true);
  };

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

    if (employee.allowed_latitude === "" || isNaN(employee.allowed_latitude)) {
      alert("Внесете валидна latitude");
      return;
    }

    if (
      employee.allowed_longitude === "" ||
      isNaN(employee.allowed_longitude)
    ) {
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
      const response = await createEmployee(createDraft);

      setCreateModalOpen(false);

      const data = await getAllEmployees();

      const mapped = Array.isArray(data)
        ? data.map(mapEmployeeFromBackend)
        : [];

      setEmployees(mapped);
    } catch (err) {
      console.error("Error creating employee:", err);
      alert(
        "Грешка при креирање на вработен: " + (err.message || "Unknown error"),
      );
    }
  };

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await getAllEmployees();
        const mapped = Array.isArray(data)
          ? data.map(mapEmployeeFromBackend)
          : [];
        setEmployees(mapped);
      } catch (err) {
        console.error("Error loading employees:", err);
      }
    };

    loadEmployees();
  }, []);

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
            >
              Импорт CSV/Excel
            </button>
          </div>

          <div className="employees__table-card">
            <h3 className="employees__table-head">Податоци за вработени</h3>
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
                  {employees.map((e) => {
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
                          <button
                            type="button"
                            className="employees__edit"
                            onClick={() => openEditModal(e)}
                          >
                            Уреди
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Edit Modal */}
      <EmployeeEditModal
        open={editModalOpen}
        draft={editDraft}
        onChange={setEditDraft}
        onClose={closeEditModal}
        onSave={saveEditModal}
      />

      {/* Create Modal */}
      <CreateEmployeeModal
        open={createModalOpen}
        draft={createDraft}
        onChange={setCreateDraft}
        onClose={() => setCreateModalOpen(false)}
        onSave={saveCreateModal}
      />
    </div>
  );
}
