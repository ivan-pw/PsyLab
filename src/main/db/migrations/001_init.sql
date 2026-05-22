-- 001_init.sql
-- Начальная схема PsyNote. Применяется однократно, когда PRAGMA user_version = 0.
-- См. plan.md §3 — здесь полный набор таблиц, индексов, VIEW таймлайна, FTS5 и сидов.

PRAGMA foreign_keys = ON;

-- ─── Клиенты ─────────────────────────────────────────────────────────────────
-- Поля current_* — это кэш последних значений из client_field_revisions.
-- Источник правды — таблица ревизий; current_* обновляются в репозитории
-- при добавлении новой ревизии (см. clientsRepo / revisionsRepo, этап 2).
CREATE TABLE clients (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name            TEXT NOT NULL,
  birth_date           TEXT,
  notes_short          TEXT,
  current_phone        TEXT,
  current_email        TEXT,
  current_messenger    TEXT,
  current_video_link   TEXT,
  current_diagnosis    TEXT,
  current_medications  TEXT,
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL,
  archived_at          TEXT
);
CREATE INDEX idx_clients_archived ON clients(archived_at);

-- ─── История значений полей клиента ──────────────────────────────────────────
-- field_key ∈ ('phone','email','messenger','video_link','diagnosis','medications')
-- value = NULL означает «поле очищено» — событие отображается в таймлайне
-- с прошлым значением (см. VIEW client_timeline, поле aux2 = LAG(value)).
CREATE TABLE client_field_revisions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id   INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  field_key   TEXT NOT NULL,
  value       TEXT,
  changed_at  TEXT NOT NULL,
  note        TEXT
);
CREATE INDEX idx_revisions_client_field ON client_field_revisions(client_id, field_key, changed_at DESC);
CREATE INDEX idx_revisions_client_time  ON client_field_revisions(client_id, changed_at DESC);

-- ─── Структурированный анамнез ──────────────────────────────────────────────
-- Каждая запись — самостоятельный «снимок» во времени.
-- Все подполя nullable, чтобы не заставлять заполнять всё сразу.
CREATE TABLE anamneses (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id         INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  taken_on          TEXT NOT NULL,
  complaints        TEXT,
  life_history      TEXT,
  family_history    TEXT,
  medical_history   TEXT,
  mental_history    TEXT,
  substances        TEXT,
  notes             TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);
CREATE INDEX idx_anamneses_client ON anamneses(client_id, taken_on DESC);

-- ─── Встречи ────────────────────────────────────────────────────────────────
CREATE TABLE meetings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id   INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  starts_at   TEXT NOT NULL,
  ends_at     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'done',
  comment     TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX idx_meetings_client    ON meetings(client_id);
CREATE INDEX idx_meetings_starts_at ON meetings(starts_at);

-- ─── Палитра цветов заметок ──────────────────────────────────────────────────
CREATE TABLE note_colors (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  hex        TEXT NOT NULL,
  label      TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ─── Заметки ────────────────────────────────────────────────────────────────
-- ON DELETE RESTRICT для color_id: цвет нельзя удалить, пока им помечены
-- заметки; UI предложит выбрать замену (см. settings.replaceColor).
CREATE TABLE notes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id   INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  color_id    INTEGER REFERENCES note_colors(id) ON DELETE RESTRICT,
  body        TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX idx_notes_client ON notes(client_id);

-- ─── Настройки приложения (key/value, value — это JSON) ──────────────────────
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ─── FTS5: глобальный поиск ─────────────────────────────────────────────────
-- entity_type ∈ ('client','note','anamnesis','revision')
-- Заполнение — триггерами на соответствующих таблицах (добавим в этапе 6 вместе
-- с UI поиска; на этапе 1 таблица создаётся пустой).
CREATE VIRTUAL TABLE search_index USING fts5(
  entity_type,
  entity_id UNINDEXED,
  client_id UNINDEXED,
  text,
  tokenize = 'unicode61 remove_diacritics 2'
);

-- ─── VIEW: лента событий клиента ────────────────────────────────────────────
-- Объединяет встречи, ревизии полей, анамнезы, заметки и факт создания клиента.
-- Для ревизий через LAG() подтягиваем прошлое значение (aux2) —
-- нужно, чтобы корректно показать «Очищен телефон, было: …».
CREATE VIEW client_timeline AS
SELECT
  'meeting'      AS kind,
  m.id           AS ref_id,
  m.client_id    AS client_id,
  m.starts_at    AS at,
  m.comment      AS payload_text,
  m.status       AS aux1,
  NULL           AS aux2,
  NULL           AS extra
FROM meetings m
UNION ALL
SELECT
  'revision',
  r.id,
  r.client_id,
  r.changed_at,
  r.value,
  r.field_key,
  LAG(r.value) OVER (PARTITION BY r.client_id, r.field_key ORDER BY r.changed_at),
  r.note
FROM client_field_revisions r
UNION ALL
SELECT
  'anamnesis',
  a.id,
  a.client_id,
  a.taken_on,
  COALESCE(a.complaints, a.notes, a.life_history),
  NULL,
  NULL,
  NULL
FROM anamneses a
UNION ALL
SELECT
  'note',
  n.id,
  n.client_id,
  n.created_at,
  n.body,
  CAST(n.color_id AS TEXT),
  NULL,
  NULL
FROM notes n
UNION ALL
SELECT
  'client_created',
  c.id,
  c.id,
  c.created_at,
  c.full_name,
  NULL,
  NULL,
  NULL
FROM clients c;

-- ─── Сиды: дефолтная палитра цветов ──────────────────────────────────────────
INSERT INTO note_colors (hex, label, sort_order) VALUES
  ('#ef4444', 'Срочно',  1),
  ('#eab308', 'Идея',    2),
  ('#22c55e', 'План',    3),
  ('#3b82f6', 'Заметка', 4);

-- ─── Сиды: дефолтные настройки ──────────────────────────────────────────────
-- value — это JSON-строка (см. settingsRepo).
INSERT INTO settings (key, value) VALUES
  ('locale',                 '"ru"'),
  ('theme',                  '"system"'),
  ('default_meeting_status', '"done"'),
  ('backup_enabled',         'true'),
  ('backup_keep_count',      '10'),
  ('autolock_minutes',       '15');
