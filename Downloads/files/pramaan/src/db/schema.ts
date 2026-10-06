import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  uuid,
  index,
} from "drizzle-orm/pg-core";

export type StandardSection = {
  clause: string;
  title: string;
  summary: string;
};

export type Citation = {
  kind: "standard" | "doc" | "lab";
  ref: string;
  label: string;
  clause?: string;
};

/* ------------------------------ standards ------------------------------ */
export const standards = pgTable(
  "standards",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(), // e.g. "IS 456:2000"
    title: text("title").notNull(),
    category: text("category").notNull(), // construction | electrical | electronics | hallmark | food | plastics | mechanical | consumer
    status: text("status").notNull().default("current"),
    mandatory: boolean("mandatory").notNull().default(false),
    scheme: text("scheme").notNull().default("Voluntary"),
    qco: text("qco"), // quality control order note
    summary: text("summary").notNull(),
    keywords: text("keywords").array().notNull().default([]),
    sections: jsonb("sections")
      .$type<StandardSection[]>()
      .notNull()
      .default([]),
    related: text("related").array().notNull().default([]),
    editions: integer("editions").notNull().default(1),
  },
  (t) => [
    index("standards_category_idx").on(t.category),
    index("standards_mandatory_idx").on(t.mandatory),
  ],
);

/* ---------------------------- knowledge docs --------------------------- */
export const knowledgeDocs = pgTable(
  "knowledge_docs",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    kind: text("kind").notNull(), // scheme | process | faq | consumer | concept | fees | hallmark | labs
    title: text("title").notNull(),
    body: text("body").notNull(),
    bodyHi: text("body_hi"),
    keywords: text("keywords").array().notNull().default([]),
    refs: jsonb("refs").$type<Citation[]>().notNull().default([]),
  },
  (t) => [index("docs_kind_idx").on(t.kind)],
);

/* -------------------------------- labs --------------------------------- */
export const labs = pgTable(
  "labs",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    kind: text("kind").notNull(), // BIS Laboratory | Recognized Laboratory | AHC
    capabilities: text("capabilities").array().notNull().default([]),
    standards: text("standards").array().notNull().default([]),
    phone: text("phone"),
    email: text("email"),
  },
  (t) => [index("labs_state_idx").on(t.state)],
);

/* ------------------------------ licences ------------------------------- */
export const licences = pgTable("licences", {
  id: serial("id").primaryKey(),
  markNo: text("mark_no").notNull().unique(), // CM/L-xxxx | R-xxxx | HM/C-xxxx | HUID
  type: text("type").notNull(), // isi | crs | jeweller | huid
  holder: text("holder").notNull(),
  product: text("product").notNull(),
  standardCode: text("standard_code"),
  status: text("status").notNull().default("valid"),
  issuedOn: text("issued_on").notNull(),
  validTill: text("valid_till").notNull(),
  city: text("city").notNull(),
});

/* ------------------------------ chat log -------------------------------- */
export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  locale: text("locale").notNull().default("en"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: serial("id").primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // user | assistant
    content: text("content").notNull(),
    intent: text("intent"),
    citations: jsonb("citations").$type<Citation[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("messages_session_idx").on(t.sessionId)],
);

/* ------------------------------ complaints ------------------------------ */
export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  ticket: text("ticket").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  category: text("category").notNull(),
  product: text("product").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("registered"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
