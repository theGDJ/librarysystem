// ============================================================
//  seed.js — populate the database with dummy data
//  Run once:  node seed.js     (safe: skips if data exists)
// ============================================================
const { db, makeCredentials } = require("./db");

const already = db.prepare("SELECT COUNT(*) AS n FROM books").get().n;
if (already > 0) {
  console.log(`Database already seeded (${already} books). Nothing to do.`);
  process.exit(0);
}

// ---------------- users ----------------
const people = [
  ["Dheeraj Guggala", "admin@library.com",  "admin123", "admin"],
  ["Aarav Sharma",    "aarav@library.com",  "user123",  "member"],
  ["Diya Patel",      "diya@library.com",   "user123",  "member"],
  ["Vihaan Reddy",    "vihaan@library.com", "user123",  "member"],
  ["Ananya Iyer",     "ananya@library.com", "user123",  "member"],
  ["Ishaan Gupta",    "ishaan@library.com", "user123",  "member"],
  ["Sara Khan",       "sara@library.com",   "user123",  "member"],
  ["Rohan Nair",      "rohan@library.com",  "user123",  "member"],
  ["Meera Joshi",     "meera@library.com",  "user123",  "member"],
];
const insUser = db.prepare(
  "INSERT INTO users (name, email, passhash, salt, role) VALUES (?,?,?,?,?)"
);
const userIds = {};
for (const [name, email, pass, role] of people) {
  const { salt, passhash } = makeCredentials(pass);
  const r = insUser.run(name, email, passhash, salt, role);
  userIds[email] = r.lastInsertRowid;
}

// ---------------- books ----------------
// [title, author, genre, year, copies, description]
const B = [
  ["To Kill a Mockingbird", "Harper Lee", "Fiction", 1960, 4, "A young girl confronts prejudice in a small Southern town as her father defends an innocent man."],
  ["1984", "George Orwell", "Fiction", 1949, 5, "Winston Smith rebels against the Party in a totalitarian state where Big Brother is always watching."],
  ["The Great Gatsby", "F. Scott Fitzgerald", "Fiction", 1925, 3, "A mysterious millionaire throws lavish parties in pursuit of a lost love across the bay."],
  ["Pride and Prejudice", "Jane Austen", "Fiction", 1813, 4, "Elizabeth Bennet and Mr. Darcy spar their way toward one of literature's great romances."],
  ["The Catcher in the Rye", "J.D. Salinger", "Fiction", 1951, 3, "Holden Caulfield wanders New York City, wrestling with adolescence and phoniness."],
  ["Brave New World", "Aldous Huxley", "Fiction", 1932, 3, "A dystopia of engineered happiness raises the question: is comfort worth freedom?"],
  ["Moby-Dick", "Herman Melville", "Fiction", 1851, 2, "A whaling captain's monomaniacal hunt for the white whale that took his leg."],
  ["Jane Eyre", "Charlotte Brontë", "Fiction", 1847, 3, "An orphaned governess demands equality — and love — on her own terms."],
  ["Dune", "Frank Herbert", "Sci-Fi", 1965, 4, "On the desert planet Arrakis, Paul Atreides navigates politics, prophecy and giant sandworms."],
  ["The Hitchhiker's Guide to the Galaxy", "Douglas Adams", "Sci-Fi", 1979, 4, "Arthur Dent tours the galaxy after Earth is demolished for a bypass. Don't panic."],
  ["Ender's Game", "Orson Scott Card", "Sci-Fi", 1985, 3, "A gifted child trains in zero-gravity battle school to save humanity from an alien threat."],
  ["Foundation", "Isaac Asimov", "Sci-Fi", 1951, 3, "Hari Seldon's psychohistory predicts the fall of an empire — and plans for what follows."],
  ["Neuromancer", "William Gibson", "Sci-Fi", 1984, 2, "A washed-up hacker takes one last job in cyberspace's neon underbelly."],
  ["The Martian", "Andy Weir", "Sci-Fi", 2011, 4, "Stranded on Mars, an engineer science-tests his way through impossible odds."],
  ["Project Hail Mary", "Andy Weir", "Sci-Fi", 2021, 3, "A lone astronaut must save Earth — with a friend he never expected."],
  ["Snow Crash", "Neal Stephenson", "Sci-Fi", 1992, 2, "A pizza-delivering hacker chases a mind-virus through the Metaverse."],
  ["Sherlock Holmes: The Complete Stories", "Arthur Conan Doyle", "Mystery", 1892, 4, "The definitive collection of the world's only consulting detective."],
  ["Murder on the Orient Express", "Agatha Christie", "Mystery", 1934, 3, "A snowbound train, a locked compartment, and twelve suspects."],
  ["And Then There Were None", "Agatha Christie", "Mystery", 1939, 3, "Ten strangers on an island, killed one by one, per a nursery rhyme."],
  ["The Girl with the Dragon Tattoo", "Stieg Larsson", "Mystery", 2005, 3, "A journalist and a hacker dig into a wealthy family's forty-year-old disappearance."],
  ["Gone Girl", "Gillian Flynn", "Mystery", 2012, 3, "A wife vanishes; the husband becomes suspect number one. Twists follow."],
  ["The Name of the Rose", "Umberto Eco", "Mystery", 1980, 2, "A medieval monk investigates murders in a labyrinthine abbey library."],
  ["The Hobbit", "J.R.R. Tolkien", "Fantasy", 1937, 4, "Bilbo Baggins is recruited as a burglar for a quest to reclaim a dwarf kingdom."],
  ["Harry Potter and the Sorcerer's Stone", "J.K. Rowling", "Fantasy", 1997, 5, "An orphan discovers he's a wizard — and that a school called Hogwarts awaits."],
  ["A Game of Thrones", "George R.R. Martin", "Fantasy", 1996, 4, "Noble houses scheme for a throne while an ancient threat gathers in the north."],
  ["The Name of the Wind", "Patrick Rothfuss", "Fantasy", 2007, 3, "Kvothe recounts how the legend of the most notorious mage began."],
  ["Mistborn: The Final Empire", "Brandon Sanderson", "Fantasy", 2006, 3, "A street thief joins a crew plotting to overthrow an immortal emperor."],
  ["The Way of Kings", "Brandon Sanderson", "Fantasy", 2010, 2, "War rages on the shattered plains of Roshar in the first Stormlight volume."],
  ["Sapiens", "Yuval Noah Harari", "Non-fiction", 2011, 4, "A brief history of humankind — from savanna bands to global empires."],
  ["Educated", "Tara Westover", "Non-fiction", 2018, 3, "A survivalist family, no schooling — and a PhD from Cambridge."],
  ["Thinking, Fast and Slow", "Daniel Kahneman", "Non-fiction", 2011, 3, "A Nobel winner maps the two systems that drive how we think."],
  ["Atomic Habits", "James Clear", "Non-fiction", 2018, 5, "Tiny changes, remarkable results: a framework for building good habits."],
  ["The Immortal Life of Henrietta Lacks", "Rebecca Skloot", "Non-fiction", 2010, 2, "Her cells changed medicine; her family never knew."],
  ["Freakonomics", "Steven Levitt & Stephen Dubner", "Non-fiction", 2005, 3, "An economist's rogue questions about everyday life."],
  ["Outliers", "Malcolm Gladwell", "Non-fiction", 2008, 3, "Why do some people succeed so much more than others?"],
  ["Steve Jobs", "Walter Isaacson", "Biography", 2011, 3, "The definitive, unvarnished life of Apple's co-founder."],
  ["The Diary of a Young Girl", "Anne Frank", "Biography", 1947, 4, "A teenage voice from the annex, unchanged by history's cruelty."],
  ["Long Walk to Freedom", "Nelson Mandela", "Biography", 1994, 3, "From village boy to prisoner to president of a nation."],
  ["Leonardo da Vinci", "Walter Isaacson", "Biography", 2017, 2, "Curiosity incarnate: art, anatomy, engineering and obsession."],
  ["When Breath Becomes Air", "Paul Kalanithi", "Biography", 2016, 2, "A neurosurgeon confronts terminal cancer and the meaning of a life."],
  ["Sapiens: A Graphic History", "Yuval Noah Harari", "History", 2020, 2, "The big-history hit, retold in comics."],
  ["Guns, Germs, and Steel", "Jared Diamond", "History", 1997, 2, "Geography explains the fates of human societies."],
  ["The Silk Roads", "Peter Frankopan", "History", 2015, 2, "World history retold through the heart of Asia."],
  ["SPQR", "Mary Beard", "History", 2015, 2, "A thousand years of ancient Rome, told fresh."],
  ["Clean Code", "Robert C. Martin", "Technology", 2008, 4, "A handbook of agile software craftsmanship."],
  ["The Pragmatic Programmer", "Andrew Hunt & David Thomas", "Technology", 1999, 3, "Timeless career advice for people who build software."],
  ["Designing Data-Intensive Applications", "Martin Kleppmann", "Technology", 2017, 3, "The bible of data systems: storage, stream processing, reliability."],
  ["JavaScript: The Good Parts", "Douglas Crockford", "Technology", 2008, 3, "The subset of JavaScript worth mastering."],
  ["The Design of Everyday Things", "Don Norman", "Technology", 1988, 3, "Why doorknobs confuse us — and how design fixes it."],
  ["Introduction to Algorithms", "Cormen, Leiserson, Rivest & Stein", "Technology", 1990, 4, "The rigorous foundation every engineer should own."],
  ["Meditations", "Marcus Aurelius", "Philosophy", 180, 3, "A Roman emperor's private notes on discipline and mortality."],
  ["Man's Search for Meaning", "Viktor Frankl", "Philosophy", 1946, 4, "Meaning survives even the camps — a psychologist's testimony."],
  ["The Alchemist", "Paulo Coelho", "Philosophy", 1988, 4, "A shepherd follows his dream across the desert."],
  ["Zen and the Art of Motorcycle Maintenance", "Robert Pirsig", "Philosophy", 1974, 2, "A father-son road trip framing quality and value."],
  ["The Sun and Her Flowers", "Rupi Kaur", "Poetry", 2017, 3, "Illustrated poems of growth, heartbreak and home."],
  ["Milk and Honey", "Rupi Kaur", "Poetry", 2014, 3, "Short, devastating verses on abuse, love and healing."],
  ["Where the Sidewalk Ends", "Shel Silverstein", "Poetry", 1974, 2, "Childhood whimsy in poems and drawings."],
  ["The Odyssey", "Homer", "Poetry", -700, 3, "Ten years of wandering on the way home from Troy."],
];

const insBook = db.prepare(
  `INSERT INTO books (title, author, isbn, genre, year, copies_total, copies_available, description)
   VALUES (?,?,?,?,?,?,?,?)`
);
const bookIds = [];
const genres = [...new Set(B.map(b => b[2]))];
let gi = 0;
for (const [title, author, genre, year, copies, desc] of B) {
  gi = (gi + 1) % genres.length;
  const isbn = `978-${String(Math.floor(Math.random() * 9) + 1)}-${String(Math.floor(Math.random() * 9000) + 1000)}-${String(Math.floor(Math.random() * 9000) + 1000)}-${Math.floor(Math.random() * 9)}`;
  const r = insBook.run(title, author, isbn, genre, year, copies, copies, desc);
  bookIds.push({ id: r.lastInsertRowid, copies });
}

// ---------------- loans ----------------
// helpers: work with dates as "YYYY-MM-DD HH:MM:SS"
function daysAgo(n) {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().slice(0, 19).replace("T", " ");
}
function plusDays(isoDate, n) {
  const d = new Date(isoDate.replace(" ", "T") + "Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

const members = ["aarav@library.com","diya@library.com","vihaan@library.com","ananya@library.com",
                 "ishaan@library.com","sara@library.com","rohan@library.com","meera@library.com"]
                .map(e => userIds[e]);

const insLoan = db.prepare(
  `INSERT INTO loans (book_id, user_id, borrowed_at, due_date, returned_at) VALUES (?,?,?,?,?)`
);

const rnd = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(42);
const pick = arr => arr[Math.floor(rnd() * arr.length)];

// ~28 returned (historical) loans spread over the past 120 days
let historical = 0;
for (let i = 0; i < 28; i++) {
  const book = pick(bookIds);
  const user = pick(members);
  const days = Math.floor(rnd() * 100) + 20;
  const borrowed = daysAgo(days);
  const kept = Math.floor(rnd() * 20) + 2;
  insLoan.run(book.id, user, borrowed, plusDays(borrowed, 14), plusDays(borrowed, kept));
  historical++;
}

// ~14 active loans; some overdue (borrowed > 14 days ago, not returned)
let active = 0;
const used = new Set();
for (let i = 0; i < 16 && active < 14; i++) {
  const book = pick(bookIds);
  const user = pick(members);
  const key = `${book.id}:${user}`;
  if (used.has(key) || book.copies <= 1) continue;
  used.add(key);
  const overdue = i < 3;                       // 3 overdue on purpose
  const days = overdue ? Math.floor(rnd() * 10) + 18 : Math.floor(rnd() * 10) + 1;
  const borrowed = daysAgo(days);
  insLoan.run(book.id, user, borrowed, plusDays(borrowed, 14), null);
  // decrement availability for active loans
  db.prepare("UPDATE books SET copies_available = copies_available - 1 WHERE id = ?").run(book.id);
  active++;
}

const counts = {
  users:  db.prepare("SELECT COUNT(*) n FROM users").get().n,
  books:  db.prepare("SELECT COUNT(*) n FROM books").get().n,
  loans:  db.prepare("SELECT COUNT(*) n FROM loans").get().n,
  active: db.prepare("SELECT COUNT(*) n FROM loans WHERE returned_at IS NULL").get().n,
};
console.log("Seeded:", JSON.stringify(counts));
console.log("Admin login  → admin@library.com / admin123");
console.log("Member login → aarav@library.com / user123");
