# Library Management System

A full-stack library application with **user and admin roles** — browse, search,
borrow and return books; admins manage the collection, members and every loan.
Clean, minimal, Apple-ish UI. No frameworks — vanilla JS frontend, Express +
SQLite backend, real SQL schema.

## Quick start

```bash
npm install
npm run dev        # seeds the database, then starts the server
```

Open **http://localhost:3000**

> `npm run dev` seeds only if the database is empty. To reseed from scratch:
> delete `library.db` and run `node seed.js`.

## Demo accounts

| Role   | Email               | Password  |
|--------|---------------------|-----------|
| Admin  | `admin@library.com` | `admin123`|
| Member | `aarav@library.com` | `user123` |

(All seeded members use the password `user123`.)

## What's inside

- **Members** — search/filter the catalog, borrow (14-day loans, max 5),
  return, view active loans and full history.
- **Admin** — dashboard stats (titles, members, active/overdue loans, genre
  mix), full book CRUD with safety checks (can't delete checked-out books,
  can't reduce copies below what's out), member overview, loan ledger with
  overdue filters, and recording returns on behalf of members.

## Tech

| Layer     | Choice |
|-----------|--------|
| Server    | Node.js + Express |
| Database  | SQLite via `better-sqlite3` (real SQL, foreign keys, transactions, indexes) |
| Auth      | Session tokens (httpOnly cookies) + scrypt password hashing |
| Frontend  | Vanilla HTML/CSS/JS SPA, zero frameworks |

## Schema

```
users(id, name, email UNIQUE, passhash, salt, role, created_at)
books(id, title, author, isbn UNIQUE, genre, year, copies_total, copies_available, description, …)
loans(id, book_id → books, user_id → users, borrowed_at, due_date, returned_at)
sessions(token PK, user_id → users, created_at, expires_at)
```

Business rules enforced server-side: loan period 14 days, max 5 concurrent
loans per member, no duplicate active loans, copies availability maintained
transactionally, admins-only endpoints return 403 for members.

## Seeded dummy data

9 users (1 admin + 8 members), 58 book titles across 10 genres, 42 loans
(14 active, 3 deliberately overdue, 28 historical returns).
