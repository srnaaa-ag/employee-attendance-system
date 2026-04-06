# Employee Attendance System

Систем за автоматизирана евиденција на присуство на вработени со користење на:

* Face recognition
* Location verification

---

## Структура на проектот

* `backend/` – Spring Boot + PostgreSQL
* `frontend/` – React апликација
* `ai/` – Face recognition / AI логика

---

## Стартување

### Backend

1. Влези во `backend` папката
2. Стартувај ја Spring Boot апликацијата

### Frontend

1. Влези во `frontend` папката
2. Инсталирај dependencies
3. Стартувај ја апликацијата

### AI

1. Влези во `ai` папката
2. Активирај Python environment
3. Инсталирај dependencies

---

## Git Workflow

### 1. Клонирање на проектот

```bash
git clone URL-OD-REPO
cd employee-attendance-system
```

---

### 2. Префрлување на develop гранка

```bash
git checkout develop
git pull origin develop
```

---

### 3. Креирање на feature гранка

```bash
git checkout -b feature/ime-na-task
```

Примери:

```bash
feature/backend-setup
feature/frontend-setup
feature/auth-backend
feature/employee-module
```

---

### 4. Работа на код

```bash
git add .
git commit -m "kratok opis na promenite"
```

---

### 5. Пуштање на GitHub

```bash
git push -u origin feature/ime-na-task
```

---

### 6. Креирање Pull Request

На GitHub:

* base branch: `develop`
* compare: `feature/ime-na-task`

---

### 7. Merge

* Pull request се прегледува
* Се merge-ира во `develop`
* Гранката може да се избрише после merge

---

## Правила

* Не се работи директно на `main`
* Не се работи директно на `develop`
* Секој член работи во `feature/...` гранка
* Merge оди во `develop`

---

## Гранки

| Гранка        | Намена            |
| ------------- | ----------------- |
| `main`        | стабилна верзија  |
| `develop`     | главна работна    |
| `feature/...` | работа по таскови |
