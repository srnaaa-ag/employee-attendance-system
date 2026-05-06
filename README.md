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
<<<<<<< HEAD

## Git Workflow

### 1. Клонирање на проектот

=======

## Branch правила

* `main` – стабилна верзија
* `develop` – главна работна гранка
* `feature/...` – гранки за функционалности

---

## Git Workflow

Репозиториумот е поставен и workflow е дефиниран.

### Важно

* не се работи директно на `main`
* не се работи директно на `develop`
* секој член работи во своја `feature/...` гранка
* pull request се прави кон `develop`

---

### Чекори за работа

1. Клонирај го репозиториумот:

>>>>>>> origin/develop
```bash
git clone URL-OD-REPO
cd employee-attendance-system
```

<<<<<<< HEAD
---

### 2. Префрлување на develop гранка
=======
2. Префрли се на develop:
>>>>>>> origin/develop

```bash
git checkout develop
git pull origin develop
```

<<<<<<< HEAD
---

### 3. Креирање на feature гранка
=======
3. Креирај своја гранка:
>>>>>>> origin/develop

```bash
git checkout -b feature/ime-na-task
```

<<<<<<< HEAD
Примери:

```bash
feature/backend-setup
feature/frontend-setup
feature/auth-backend
feature/employee-module
```

---

### 4. Работа на код
=======
4. Работи на кодот, потоа:
>>>>>>> origin/develop

```bash
git add .
git commit -m "kratok opis na promenite"
```

<<<<<<< HEAD
---

### 5. Пуштање на GitHub
=======
5. Пушти ја гранката:
>>>>>>> origin/develop

```bash
git push -u origin feature/ime-na-task
```

<<<<<<< HEAD
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
=======
6. На GitHub направи Pull Request:

* base: `develop`
* compare: `feature/ime-na-task`

7. По одобрување, гранката се merge-ира во `develop`
>>>>>>> origin/develop
