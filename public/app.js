// ============================================================
//  app.js — Library SPA (vanilla JS, no frameworks)
// ============================================================
"use strict";

const $ = (s, el = document) => el.querySelector(s);
const api = async (url, opts = {}) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
};

const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
  ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const fmtDate = d => d ? new Date(d.replace(" ", "T") + "Z")
  .toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtDateTime = d => d ? new Date(d.replace(" ", "T") + "Z")
  .toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const daysUntil = d => Math.round((new Date(d.replace(" ", "T") + "Z") - Date.now()) / 86400000);

const GENRE_COLORS = {
  "Fiction":"linear-gradient(160deg,#0a84ff,#0055d4)",
  "Sci-Fi":"linear-gradient(160deg,#5e5ce6,#3634a3)",
  "Mystery":"linear-gradient(160deg,#1d1d1f,#48484a)",
  "Fantasy":"linear-gradient(160deg,#bf5af2,#8944ab)",
  "Non-fiction":"linear-gradient(160deg,#30d158,#1e8e3e)",
  "Biography":"linear-gradient(160deg,#ff9f0a,#c93400)",
  "History":"linear-gradient(160deg,#a2845e,#6b4f2a)",
  "Technology":"linear-gradient(160deg,#64d2ff,#0a84ff)",
  "Philosophy":"linear-gradient(160deg,#ff375f,#c1103f)",
  "Poetry":"linear-gradient(160deg,#ffd60a,#c78f00)",
};
const spineStyle = genre => ({ background: GENRE_COLORS[genre] || "linear-gradient(160deg,#8e8e93,#48484a)" });

let me = null;
let catalog = { q: "", genre: "", items: [] };

// ---------------- toasts ----------------
function toast(msg, isErr = false) {
  const el = document.createElement("div");
  el.className = "toast" + (isErr ? " err" : "");
  el.textContent = msg;
  $("#toasts").appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ---------------- sheet (modal) ----------------
function openSheet(html) {
  $("#sheet").innerHTML = html;
  $("#sheetWrap").hidden = false;
  document.body.style.overflow = "hidden";
}
function closeSheet() {
  $("#sheetWrap").hidden = true;
  document.body.style.overflow = "";
  $("#sheet").innerHTML = "";
}
$("#sheetBackdrop").addEventListener("click", closeSheet);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });

// ============================================================
//  LOGIN
// ============================================================
document.querySelectorAll(".demo-row").forEach(b =>
  b.addEventListener("click", () => {
    $("#email").value = b.dataset.email;
    $("#password").value = b.dataset.pass;
    $("#loginForm").requestSubmit();
  })
);

$("#loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = $("#loginBtn");
  const errBox = $("#loginError");
  btn.disabled = true; btn.textContent = "Signing in…";
  errBox.hidden = true;
  try {
    me = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ email: $("#email").value, password: $("#password").value }),
    });
    enterApp();
  } catch (err) {
    errBox.textContent = err.message;
    errBox.hidden = false;
    btn.disabled = false; btn.textContent = "Sign In";
  }
});

$("#logoutBtn").addEventListener("click", async () => {
  await api("/api/logout", { method: "POST" });
  location.reload();
});

async function boot() {
  try {
    const d = await api("/api/me");
    if (d.user) { me = d.user; enterApp(); }
  } catch { /* not signed in */ }
}

function enterApp() {
  $("#loginScene").style.display = "none";
  $("#app").hidden = false;
  $("#userName").textContent = me.name;
  $("#avatar").textContent = me.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  buildTabs();
  show(me.role === "admin" ? "dashboard" : "catalog");
}

// ============================================================
//  TABS / ROUTING
// ============================================================
const VIEWS = {
  catalog:   { label: "Catalog",  roles: ["member", "admin"], render: renderCatalog },
  myshelf:   { label: "My Shelf", roles: ["member", "admin"], render: renderMyShelf },
  dashboard: { label: "Dashboard", roles: ["admin"], render: renderDashboard },
  books:     { label: "Books",     roles: ["admin"], render: renderAdminBooks },
  members:   { label: "Members",   roles: ["admin"], render: renderMembers },
  loans:     { label: "Loans",     roles: ["admin"], render: renderAdminLoans },
};

function buildTabs() {
  const tabs = Object.entries(VIEWS).filter(([, v]) => v.roles.includes(me.role));
  $("#tabs").innerHTML = tabs.map(([id, v]) =>
    `<button class="tab" data-view="${id}">${v.label}</button>`).join("");
  $("#tabs").querySelectorAll(".tab").forEach(b =>
    b.addEventListener("click", () => show(b.dataset.view)));
}

function show(view) {
  $("#tabs").querySelectorAll(".tab").forEach(b =>
    b.classList.toggle("on", b.dataset.view === view));
  const main = $("#main");
  main.innerHTML = "";
  const holder = document.createElement("div");
  holder.className = "view";
  main.appendChild(holder);
  VIEWS[view].render(holder);
}

// ============================================================
//  MEMBER: CATALOG
// ============================================================
async function renderCatalog(root) {
  root.innerHTML = `
    <div class="view-head">
      <div>
        <h2 class="view-title">Catalog</h2>
        <p class="view-sub" id="catCount">Loading…</p>
      </div>
    </div>
    <div class="toolbar">
      <div class="search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <input id="catQ" placeholder="Search title, author, or ISBN" value="${esc(catalog.q)}">
      </div>
      <div class="chips" id="catChips"></div>
    </div>
    <div class="book-grid" id="catGrid"></div>`;

  const genres = await api("/api/genres");
  const chips = $("#catChips");
  chips.innerHTML = `<button class="chip ${!catalog.genre ? "on" : ""}" data-g="">All</button>` +
    genres.map(g => `<button class="chip ${catalog.genre === g ? "on" : ""}" data-g="${esc(g)}">${esc(g)}</button>`).join("");
  chips.querySelectorAll(".chip").forEach(c =>
    c.addEventListener("click", () => { catalog.genre = c.dataset.g; renderCatalog(root); }));

  let t;
  $("#catQ").addEventListener("input", e => {
    clearTimeout(t);
    catalog.q = e.target.value;
    t = setTimeout(loadCatalog, 250);
  });

  await loadCatalog();

  async function loadCatalog() {
    const qs = new URLSearchParams();
    if (catalog.q) qs.set("q", catalog.q);
    if (catalog.genre) qs.set("genre", catalog.genre);
    const items = await api("/api/books?" + qs);
    catalog.items = items;
    $("#catCount").textContent = `${items.length} title${items.length === 1 ? "" : "s"}` +
      (catalog.genre ? ` in ${catalog.genre}` : "");

    const grid = $("#catGrid");
    if (!items.length) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="big">🔍</div>No books match your search.</div>`;
      return;
    }
    grid.innerHTML = items.map((b, i) => `
      <article class="book" style="animation-delay:${Math.min(i * 30, 400)}ms" data-id="${b.id}">
        <div class="book-top">
          <div class="spine" style="${Object.entries(spineStyle(b.genre)).map(([k,v])=>`${k}:${v}`).join(";")}">${esc(b.title[0] || "•")}</div>
          <div class="book-meta">
            <div class="book-title">${esc(b.title)}</div>
            <div class="book-author">${esc(b.author)}${b.year ? ` · ${b.year}` : ""}</div>
          </div>
        </div>
        <div class="book-desc">${esc(b.description)}</div>
        <div class="book-foot">
          <div>
            <div class="book-genre">${esc(b.genre)} · ${b.copies_available}/${b.copies_total} in</div>
          </div>
          ${b.available
            ? `<button class="btn btn-primary btn-sm" data-borrow="${b.id}">Borrow</button>`
            : `<span class="pill gray"><i></i>All out</span>`}
        </div>
      </article>`).join("");

    grid.querySelectorAll("[data-borrow]").forEach(btn =>
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        try {
          await api("/api/borrow", { method: "POST", body: JSON.stringify({ bookId: +btn.dataset.borrow }) });
          toast("Book borrowed — due in 14 days ✓");
          loadCatalog();
        } catch (err) { toast(err.message, true); btn.disabled = false; }
      }));
  }
}

// ============================================================
//  MEMBER: MY SHELF
// ============================================================
async function renderMyShelf(root) {
  const loans = await api("/api/my/loans");
  const active = loans.filter(l => l.status !== "returned");
  const history = loans.filter(l => l.status === "returned");

  root.innerHTML = `
    <div class="view-head">
      <div>
        <h2 class="view-title">My Shelf</h2>
        <p class="view-sub">${active.length} book${active.length === 1 ? "" : "s"} out · ${history.length} returned all-time</p>
      </div>
    </div>
    ${active.length ? `
    <div class="panel" style="background:transparent;box-shadow:none">
      <div class="loan-list">
        ${active.map(l => {
          const d = daysUntil(l.due_date);
          const overdue = l.status === "overdue";
          return `
          <div class="loan">
            <div class="spine" style="${Object.entries(spineStyle(l.genre)).map(([k,v])=>`${k}:${v}`).join(";")}">${esc(l.title[0] || "•")}</div>
            <div class="loan-main">
              <div class="loan-title">${esc(l.title)}</div>
              <div class="loan-sub">${esc(l.author)}</div>
              <div class="loan-sub ${overdue ? "overdue" : ""}">
                ${overdue ? `Overdue by ${-d} day${-d === 1 ? "" : "s"}` : `Due ${fmtDate(l.due_date)} · in ${d} day${d === 1 ? "" : "s"}`}
              </div>
            </div>
            ${overdue ? `<span class="pill red"><i></i>Overdue</span>` : `<span class="pill green"><i></i>On time</span>`}
            <button class="btn btn-ghost btn-sm" data-return="${l.id}">Return</button>
          </div>`;
        }).join("")}
      </div>
    </div>` : `
    <div class="panel"><div class="empty"><div class="big">📚</div>Nothing checked out.<br><span class="muted">Borrow something from the catalog.</span></div></div>`}

    ${history.length ? `
    <div class="panel" style="margin-top:28px">
      <div class="panel-head"><span class="panel-title">History</span><span class="muted">${history.length} returned</span></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Book</th><th>Borrowed</th><th>Returned</th></tr></thead>
        <tbody>${history.slice(0, 12).map(l => `
          <tr><td><b>${esc(l.title)}</b><div class="sub">${esc(l.author)}</div></td>
          <td>${fmtDate(l.borrowed_at)}</td><td>${fmtDate(l.returned_at)}</td></tr>`).join("")}
        </tbody></table></div>
    </div>` : ""}`;

  root.querySelectorAll("[data-return]").forEach(btn =>
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try {
        await api(`/api/return/${btn.dataset.return}`, { method: "POST" });
        toast("Returned — thank you ✓");
        renderMyShelf(root);
      } catch (err) { toast(err.message, true); btn.disabled = false; }
    }));
}

// ============================================================
//  ADMIN: DASHBOARD
// ============================================================
async function renderDashboard(root) {
  const s = await api("/api/admin/stats");
  root.innerHTML = `
    <div class="view-head">
      <div>
        <h2 class="view-title">Dashboard</h2>
        <p class="view-sub">The library at a glance.</p>
      </div>
    </div>
    <div class="stats">
      <div class="stat"><div class="k">Titles</div><div class="v blue">${s.books}</div></div>
      <div class="stat"><div class="k">Members</div><div class="v">${s.members}</div></div>
      <div class="stat"><div class="k">Books out</div><div class="v">${s.activeLoans}</div></div>
      <div class="stat"><div class="k">Overdue</div><div class="v ${s.overdue ? "red" : ""}">${s.overdue}</div></div>
      <div class="stat"><div class="k">All-time returns</div><div class="v">${s.returned}</div></div>
    </div>
    <div class="panel">
      <div class="panel-head"><span class="panel-title">Collection by genre</span></div>
      <div style="padding:22px; display:flex; flex-direction:column; gap:14px; max-width:560px">
        ${s.topGenres.map(g => {
          const pct = Math.round(g.n / s.books * 100);
          const color = GENRE_COLORS[g.genre] || "linear-gradient(90deg,#8e8e93,#c7c7cc)";
          return `<div>
            <div style="display:flex;justify-content:space-between;font-size:13.5px;margin-bottom:5px">
              <b>${esc(g.genre)}</b><span class="muted">${g.n} titles · ${pct}%</span>
            </div>
            <div class="genre-bar" style="background:rgba(0,0,0,.06)">
              <div class="genre-bar" style="background:${color};width:${pct}%;margin:0"></div>
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>`;
}

// ============================================================
//  ADMIN: BOOKS
// ============================================================
async function renderAdminBooks(root) {
  root.innerHTML = `
    <div class="view-head">
      <div>
        <h2 class="view-title">Books</h2>
        <p class="view-sub">Add, edit or retire titles.</p>
      </div>
      <button class="btn btn-primary" id="addBookBtn">＋ Add Book</button>
    </div>
    <div class="panel">
      <div class="panel-head">
        <span class="panel-title">All titles</span>
        <div class="search" style="min-width:240px;flex:1;max-width:320px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <input id="bq" placeholder="Search books">
        </div>
      </div>
      <div class="table-wrap" id="bookTable"></div>
    </div>`;

  $("#addBookBtn").addEventListener("click", () => bookSheet(null, root));
  $("#bq").addEventListener("input", () => loadBooks($("#bq").value));
  await loadBooks("");

  async function loadBooks(q) {
    const items = await api("/api/books?q=" + encodeURIComponent(q));
    $("#bookTable").innerHTML = `
      <table>
        <thead><tr><th>Title</th><th>Genre</th><th>Copies</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${items.map(b => `
          <tr>
            <td><b>${esc(b.title)}</b><div class="sub">${esc(b.author)}${b.year ? ` · ${b.year}` : ""}${b.isbn ? ` · ${esc(b.isbn)}` : ""}</div></td>
            <td>${esc(b.genre)}</td>
            <td class="mono">${b.copies_available} / ${b.copies_total}</td>
            <td>${b.available ? `<span class="pill green"><i></i>Available</span>` : `<span class="pill amber"><i></i>All out</span>`}</td>
            <td style="white-space:nowrap; text-align:right">
              <button class="btn btn-plain btn-sm" data-edit="${b.id}">Edit</button>
              <button class="btn btn-danger btn-sm" data-del="${b.id}">Delete</button>
            </td>
          </tr>`).join("")}
        </tbody></table>`;

    $("#bookTable").querySelectorAll("[data-edit]").forEach(b =>
      b.addEventListener("click", () => {
        const book = items.find(x => x.id === +b.dataset.edit);
        bookSheet(book, root);
      }));
    $("#bookTable").querySelectorAll("[data-del]").forEach(b =>
      b.addEventListener("click", () => {
        const book = items.find(x => x.id === +b.dataset.del);
        openSheet(`
          <h3>Delete “${esc(book.title)}”?</h3>
          <p class="sheet-msg">This removes the title from the catalog. Books that are checked out can't be deleted.</p>
          <div class="actions">
            <button class="btn btn-ghost" id="cancelDel">Cancel</button>
            <button class="btn btn-primary" id="confirmDel" style="background:var(--red)">Delete</button>
          </div>`);
        $("#cancelDel").onclick = closeSheet;
        $("#confirmDel").onclick = async () => {
          try {
            await api(`/api/admin/books/${book.id}`, { method: "DELETE" });
            closeSheet(); toast("Book deleted");
            renderAdminBooks(root);
          } catch (err) { closeSheet(); toast(err.message, true); }
        };
      }));
  }

  function bookSheet(book, ctx) {
    openSheet(`
      <h3>${book ? "Edit Book" : "Add Book"}</h3>
      <label class="field"><span>Title</span><input id="fTitle" value="${esc(book?.title || "")}"></label>
      <label class="field"><span>Author</span><input id="fAuthor" value="${esc(book?.author || "")}"></label>
      <div class="row2">
        <label class="field"><span>Genre</span><input id="fGenre" list="genreList" value="${esc(book?.genre || "")}">
          <datalist id="genreList">${Object.keys(GENRE_COLORS).map(g => `<option>${esc(g)}</option>`).join("")}</datalist>
        </label>
        <label class="field"><span>Year</span><input id="fYear" type="number" value="${book?.year || ""}"></label>
      </div>
      <div class="row2">
        <label class="field"><span>ISBN</span><input id="fIsbn" value="${esc(book?.isbn || "")}"></label>
        <label class="field"><span>Total copies</span><input id="fCopies" type="number" min="1" value="${book?.copies_total || 1}"></label>
      </div>
      <label class="field"><span>Description</span><textarea id="fDesc" rows="3">${esc(book?.description || "")}</textarea></label>
      <div class="actions">
        <button class="btn btn-ghost" id="cancelBook">Cancel</button>
        <button class="btn btn-primary" id="saveBook">${book ? "Save Changes" : "Add Book"}</button>
      </div>`);
    $("#cancelBook").onclick = closeSheet;
    $("#saveBook").onclick = async () => {
      const payload = {
        title: $("#fTitle").value, author: $("#fAuthor").value,
        genre: $("#fGenre").value, year: $("#fYear").value,
        isbn: $("#fIsbn").value, copies_total: $("#fCopies").value,
        description: $("#fDesc").value,
      };
      try {
        if (book) await api(`/api/admin/books/${book.id}`, { method: "PUT", body: JSON.stringify(payload) });
        else await api("/api/admin/books", { method: "POST", body: JSON.stringify(payload) });
        closeSheet(); toast(book ? "Changes saved ✓" : "Book added ✓");
        renderAdminBooks(ctx);
      } catch (err) { toast(err.message, true); }
    };
  }
}

// ============================================================
//  ADMIN: MEMBERS
// ============================================================
async function renderMembers(root) {
  const members = await api("/api/admin/members");
  root.innerHTML = `
    <div class="view-head">
      <div>
        <h2 class="view-title">Members</h2>
        <p class="view-sub">${members.length} accounts · ${members.filter(m => m.role === "member").length} members</p>
      </div>
    </div>
    <div class="panel"><div class="table-wrap"><table>
      <thead><tr><th>Name</th><th>Email</th><th>Out now</th><th>Total loans</th><th>Member since</th></tr></thead>
      <tbody>
        ${members.map(m => `
        <tr>
          <td><b>${esc(m.name)}</b>${m.role === "admin" ? ` <span class="pill blue"><i></i>Admin</span>` : ""}</td>
          <td class="mono">${esc(m.email)}</td>
          <td>${m.active_loans > 0 ? `<span class="pill amber"><i></i>${m.active_loans}</span>` : `<span class="muted">0</span>`}</td>
          <td class="mono">${m.total_loans}</td>
          <td>${fmtDate(m.created_at)}</td>
        </tr>`).join("")}
      </tbody></table></div></div>`;
}

// ============================================================
//  ADMIN: LOANS
// ============================================================
async function renderAdminLoans(root, filter = "active") {
  const loans = await api("/api/admin/loans");
  const filtered = loans.filter(l => filter === "all" ? true : l.status === filter);

  root.innerHTML = `
    <div class="view-head">
      <div>
        <h2 class="view-title">Loans</h2>
        <p class="view-sub">Everything ever checked out.</p>
      </div>
      <div class="chips">
        ${["active", "overdue", "returned", "all"].map(f =>
          `<button class="chip ${filter === f ? "on" : ""}" data-f="${f}">${f[0].toUpperCase() + f.slice(1)}</button>`).join("")}
      </div>
    </div>
    <div class="panel"><div class="table-wrap">
      ${filtered.length ? `
      <table>
        <thead><tr><th>Book</th><th>Borrower</th><th>Borrowed</th><th>Due</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${filtered.map(l => `
          <tr>
            <td><b>${esc(l.title)}</b><div class="sub">${esc(l.author)}</div></td>
            <td>${esc(l.borrower)}<div class="sub">${esc(l.borrower_email)}</div></td>
            <td>${fmtDate(l.borrowed_at)}</td>
            <td>${fmtDate(l.due_date)}</td>
            <td>${l.status === "overdue" ? `<span class="pill red"><i></i>Overdue</span>`
               : l.status === "active" ? `<span class="pill green"><i></i>Active</span>`
               : `<span class="pill gray"><i></i>Returned ${fmtDate(l.returned_at)}</span>`}</td>
            <td style="text-align:right">
              ${l.status !== "returned" ? `<button class="btn btn-ghost btn-sm" data-ret="${l.id}">Record return</button>` : ""}
            </td>
          </tr>`).join("")}
        </tbody></table>` : `<div class="empty">No ${filter} loans.</div>`}
    </div></div>`;

  root.querySelectorAll(".chip").forEach(c =>
    c.addEventListener("click", () => renderAdminLoans(root, c.dataset.f)));
  root.querySelectorAll("[data-ret]").forEach(b =>
    b.addEventListener("click", async () => {
      b.disabled = true;
      try {
        await api(`/api/return/${b.dataset.ret}`, { method: "POST" });
        toast("Return recorded ✓");
        renderAdminLoans(root, filter);
      } catch (err) { toast(err.message, true); b.disabled = false; }
    }));
}

boot();
