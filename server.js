// ============================================================
//  server.js — Library Management System API + static frontend
//  Node.js + Express + SQLite
// ============================================================
const express = require("express");
const path = require("path");
const crypto = require("crypto");
const { db, verifyPassword } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------------- session helpers ----------------
const SESSION_DAYS = 7;

function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000)
    .toISOString().slice(0, 19).replace("T", " ");
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?,?,?)")
    .run(token, userId, expires);
  return token;
}

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || "").split(";").forEach(p => {
    const i = p.indexOf("=");
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1));
  });
  return out;
}

function currentUser(req) {
  const token = parseCookies(req).session;
  if (!token) return null;
  return db.prepare(`
    SELECT u.id, u.name, u.email, u.role
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `).get(token) || null;
}

function requireAuth(req, res, next) {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: "Not signed in" });
  req.user = user;
  next();
}
function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin access required" });
  next();
}

// ---------------- auth ----------------
app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  const row = db.prepare("SELECT * FROM users WHERE lower(email)=lower(?)").get(String(email).trim());
  if (!row || !verifyPassword(String(password), row.salt, row.passhash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const token = createSession(row.id);
  res.setHeader("Set-Cookie",
    `session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`);
  res.json({ id: row.id, name: row.name, email: row.email, role: row.role });
});

app.post("/api/logout", (req, res) => {
  const token = parseCookies(req).session;
  if (token) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  res.setHeader("Set-Cookie", "session=; HttpOnly; Path=/; Max-Age=0");
  res.json({ ok: true });
});

app.get("/api/me", (req, res) => {
  res.json({ user: currentUser(req) });
});

// ---------------- catalog ----------------
app.get("/api/genres", (req, res) => {
  res.json(db.prepare("SELECT DISTINCT genre FROM books ORDER BY genre").all().map(r => r.genre));
});

app.get("/api/books", (req, res) => {
  const { q = "", genre = "" } = req.query;
  let sql = `
    SELECT id, title, author, isbn, genre, year,
           copies_total, copies_available,
           CASE WHEN copies_available > 0 THEN 1 ELSE 0 END AS available,
           description
    FROM books WHERE 1=1`;
  const args = [];
  if (q) {
    sql += ` AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)`;
    const like = `%${q}%`;
    args.push(like, like, like);
  }
  if (genre) { sql += ` AND genre = ?`; args.push(genre); }
  sql += ` ORDER BY title COLLATE NOCASE`;
  res.json(db.prepare(sql).all(...args));
});

app.get("/api/books/:id", (req, res) => {
  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(req.params.id);
  if (!book) return res.status(404).json({ error: "Book not found" });
  res.json(book);
});

// ---------------- loans ----------------
const LOAN_DAYS = 14, MAX_ACTIVE = 5;

function loanRow(id) {
  return db.prepare(`
    SELECT l.*, b.title, b.author, b.genre, u.name AS borrower, u.email AS borrower_email,
      CASE
        WHEN l.returned_at IS NOT NULL THEN 'returned'
        WHEN l.due_date < datetime('now') THEN 'overdue'
        ELSE 'active'
      END AS status
    FROM loans l
    JOIN books b ON b.id = l.book_id
    JOIN users u ON u.id = l.user_id
    WHERE l.id = ?
  `).get(id);
}

app.get("/api/my/loans", requireAuth, (req, res) => {
  res.json(db.prepare(`
    SELECT l.*, b.title, b.author, b.genre,
      CASE
        WHEN l.returned_at IS NOT NULL THEN 'returned'
        WHEN l.due_date < datetime('now') THEN 'overdue'
        ELSE 'active'
      END AS status
    FROM loans l JOIN books b ON b.id = l.book_id
    WHERE l.user_id = ?
    ORDER BY l.returned_at IS NOT NULL, l.due_date ASC
  `).all(req.user.id));
});

app.post("/api/borrow", requireAuth, (req, res) => {
  const { bookId } = req.body || {};
  const book = db.prepare("SELECT * FROM books WHERE id = ?").get(bookId);
  if (!book) return res.status(404).json({ error: "Book not found" });

  const activeCount = db.prepare(
    "SELECT COUNT(*) n FROM loans WHERE user_id=? AND returned_at IS NULL"
  ).get(req.user.id).n;
  if (activeCount >= MAX_ACTIVE)
    return res.status(400).json({ error: `Borrow limit reached (${MAX_ACTIVE} books max)` });

  const dup = db.prepare(
    "SELECT COUNT(*) n FROM loans WHERE user_id=? AND book_id=? AND returned_at IS NULL"
  ).get(req.user.id, bookId).n;
  if (dup) return res.status(400).json({ error: "You already have this book out" });

  if (book.copies_available <= 0)
    return res.status(400).json({ error: "No copies available right now" });

  const borrowed = new Date().toISOString().slice(0, 19).replace("T", " ");
  const due = new Date(Date.now() + LOAN_DAYS * 86400000).toISOString().slice(0, 19).replace("T", " ");
  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO loans (book_id, user_id, borrowed_at, due_date)
                VALUES (?,?,?,?)`).run(bookId, req.user.id, borrowed, due);
    db.prepare("UPDATE books SET copies_available = copies_available - 1 WHERE id = ?").run(bookId);
  });
  tx();
  res.json({ ok: true, loan: loanRow(db.prepare("SELECT last_insert_rowid() id").get().id) });
});

app.post("/api/return/:loanId", requireAuth, (req, res) => {
  const loan = db.prepare("SELECT * FROM loans WHERE id = ?").get(req.params.loanId);
  if (!loan) return res.status(404).json({ error: "Loan not found" });
  if (loan.returned_at) return res.status(400).json({ error: "Already returned" });
  if (req.user.role !== "admin" && loan.user_id !== req.user.id)
    return res.status(403).json({ error: "Not your loan" });

  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const tx = db.transaction(() => {
    db.prepare("UPDATE loans SET returned_at = ? WHERE id = ?").run(now, loan.id);
    db.prepare("UPDATE books SET copies_available = copies_available + 1 WHERE id = ?").run(loan.book_id);
  });
  tx();
  res.json({ ok: true, loan: loanRow(loan.id) });
});

// ---------------- admin: stats ----------------
app.get("/api/admin/stats", requireAuth, requireAdmin, (req, res) => {
  res.json({
    books:       db.prepare("SELECT COUNT(*) n FROM books").get().n,
    members:     db.prepare("SELECT COUNT(*) n FROM users WHERE role='member'").get().n,
    activeLoans: db.prepare("SELECT COUNT(*) n FROM loans WHERE returned_at IS NULL").get().n,
    overdue:     db.prepare("SELECT COUNT(*) n FROM loans WHERE returned_at IS NULL AND due_date < datetime('now')").get().n,
    returned:    db.prepare("SELECT COUNT(*) n FROM loans WHERE returned_at IS NOT NULL").get().n,
    topGenres:   db.prepare(`SELECT genre, COUNT(*) n FROM books GROUP BY genre ORDER BY n DESC LIMIT 5`).all(),
  });
});

// ---------------- admin: books CRUD ----------------
function validBook(b) {
  const errs = [];
  if (!b.title || !String(b.title).trim()) errs.push("Title is required");
  if (!b.author || !String(b.author).trim()) errs.push("Author is required");
  if (!b.genre || !String(b.genre).trim()) errs.push("Genre is required");
  const c = parseInt(b.copies_total, 10);
  if (!(c > 0)) errs.push("Copies must be at least 1");
  return errs;
}

app.post("/api/admin/books", requireAuth, requireAdmin, (req, res) => {
  const b = req.body || {};
  const errs = validBook(b);
  if (errs.length) return res.status(400).json({ error: errs.join(", ") });
  const copies = parseInt(b.copies_total, 10);
  const r = db.prepare(`
    INSERT INTO books (title, author, isbn, genre, year, copies_total, copies_available, description)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(
    String(b.title).trim(), String(b.author).trim(), (b.isbn || "").trim() || null,
    String(b.genre).trim(), b.year ? parseInt(b.year, 10) : null,
    copies, copies, (b.description || "").trim()
  );
  res.json({ ok: true, book: db.prepare("SELECT * FROM books WHERE id=?").get(r.lastInsertRowid) });
});

app.put("/api/admin/books/:id", requireAuth, requireAdmin, (req, res) => {
  const book = db.prepare("SELECT * FROM books WHERE id=?").get(req.params.id);
  if (!book) return res.status(404).json({ error: "Book not found" });
  const b = req.body || {};
  const errs = validBook(b);
  if (errs.length) return res.status(400).json({ error: errs.join(", ") });

  const checkedOut = book.copies_total - book.copies_available;
  const copies = parseInt(b.copies_total, 10);
  if (copies < checkedOut)
    return res.status(400).json({ error: `${checkedOut} copies are checked out — can't set total below that` });

  db.prepare(`
    UPDATE books SET title=?, author=?, isbn=?, genre=?, year=?, copies_total=?,
                     copies_available=?, description=? WHERE id=?
  `).run(
    String(b.title).trim(), String(b.author).trim(), (b.isbn || "").trim() || null,
    String(b.genre).trim(), b.year ? parseInt(b.year, 10) : null,
    copies, copies - checkedOut, (b.description || "").trim(), book.id
  );
  res.json({ ok: true, book: db.prepare("SELECT * FROM books WHERE id=?").get(book.id) });
});

app.delete("/api/admin/books/:id", requireAuth, requireAdmin, (req, res) => {
  const book = db.prepare("SELECT * FROM books WHERE id=?").get(req.params.id);
  if (!book) return res.status(404).json({ error: "Book not found" });
  const out = book.copies_total - book.copies_available;
  if (out > 0)
    return res.status(400).json({ error: `Can't delete — ${out} cop${out === 1 ? "y is" : "ies are"} still checked out` });
  db.prepare("DELETE FROM books WHERE id=?").run(book.id);
  res.json({ ok: true });
});

// ---------------- admin: members & loans ----------------
app.get("/api/admin/members", requireAuth, requireAdmin, (req, res) => {
  res.json(db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.created_at,
           COUNT(l.id) FILTER (WHERE l.returned_at IS NULL) AS active_loans,
           COUNT(l.id) AS total_loans
    FROM users u
    LEFT JOIN loans l ON l.user_id = u.id
    GROUP BY u.id
    ORDER BY u.role DESC, u.name COLLATE NOCASE
  `).all());
});

app.get("/api/admin/loans", requireAuth, requireAdmin, (req, res) => {
  res.json(db.prepare(`
    SELECT l.*, b.title, b.author, u.name AS borrower, u.email AS borrower_email,
      CASE
        WHEN l.returned_at IS NOT NULL THEN 'returned'
        WHEN l.due_date < datetime('now') THEN 'overdue'
        ELSE 'active'
      END AS status
    FROM loans l
    JOIN books b ON b.id = l.book_id
    JOIN users u ON u.id = l.user_id
    ORDER BY l.returned_at IS NOT NULL, l.due_date ASC
    LIMIT 400
  `).all());
});

// admin: check out on behalf of a member
app.post("/api/admin/borrow", requireAuth, requireAdmin, (req, res) => {
  const { bookId, userId } = req.body || {};
  const book = db.prepare("SELECT * FROM books WHERE id=?").get(bookId);
  const user = db.prepare("SELECT * FROM users WHERE id=?").get(userId);
  if (!book || !user) return res.status(404).json({ error: "Book or member not found" });
  if (book.copies_available <= 0) return res.status(400).json({ error: "No copies available" });
  const dup = db.prepare(
    "SELECT COUNT(*) n FROM loans WHERE user_id=? AND book_id=? AND returned_at IS NULL"
  ).get(userId, bookId).n;
  if (dup) return res.status(400).json({ error: `${user.name} already has this book` });

  const borrowed = new Date().toISOString().slice(0, 19).replace("T", " ");
  const due = new Date(Date.now() + LOAN_DAYS * 86400000).toISOString().slice(0, 19).replace("T", " ");
  const tx = db.transaction(() => {
    db.prepare("INSERT INTO loans (book_id, user_id, borrowed_at, due_date) VALUES (?,?,?,?)")
      .run(bookId, userId, borrowed, due);
    db.prepare("UPDATE books SET copies_available = copies_available - 1 WHERE id=?").run(bookId);
  });
  tx();
  res.json({ ok: true });
});

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Library system running → http://localhost:${PORT}`)
);
