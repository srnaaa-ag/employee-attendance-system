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

```bash
git clone URL-OD-REPO
cd employee-attendance-system
```

2. Префрли се на develop:

```bash
git checkout develop
git pull origin develop
```

3. Креирај своја гранка:

```bash
git checkout -b feature/ime-na-task
```

4. Работи на кодот, потоа:

```bash
git add .
git commit -m "kratok opis na promenite"
```

5. Пушти ја гранката:

```bash
git push -u origin feature/ime-na-task
```

6. На GitHub направи Pull Request:

* base: `develop`
* compare: `feature/ime-na-task`

7. По одобрување, гранката се merge-ира во `develop`
