-- 005_note_events.sql
-- Сейчас в таймлайн попадает «существующая» заметка (по created_at).
-- Изменения и удаления не видны: при UPDATE event не появляется, при DELETE
-- запись пропадает из VIEW.
--
-- Добавляем отдельный лог `note_events` (create/update/delete + snapshot body
-- и color_id на момент действия). Триггеры на notes автоматически пишут
-- события. Backfill для существующих заметок — синтетический 'create'
-- с их created_at, чтобы старая история не потерялась.
--
-- В VIEW client_timeline kind='note' заменяется на kind='note_event'.
-- aux1 хранит action, aux2 — color_id на момент события, extra — note_id
-- (на случай если заметка ещё жива и нужно подсветить её).

PRAGMA foreign_keys = ON;

CREATE TABLE note_events (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  -- Без FK на notes — событие должно пережить удаление самой заметки.
  note_id   INTEGER,
  action    TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  body      TEXT,
  color_id  INTEGER,
  at        TEXT NOT NULL
);
CREATE INDEX idx_note_events_client_at ON note_events(client_id, at DESC);

-- ─── Backfill: для уже существующих заметок добавляем синтетический 'create'
INSERT INTO note_events (client_id, note_id, action, body, color_id, at)
SELECT client_id, id, 'create', body, color_id, created_at
FROM notes;

-- ─── Триггеры на notes ──────────────────────────────────────────────────────
-- Используем strftime для DELETE/UPDATE timestamp: триггеры запускаются
-- автоматически, у нас нет «настоящего» now() в SQL, поэтому строим ISO.
-- На INSERT и UPDATE можно взять new.created_at / new.updated_at, что точнее.

CREATE TRIGGER notes_ai_event AFTER INSERT ON notes BEGIN
  INSERT INTO note_events (client_id, note_id, action, body, color_id, at)
  VALUES (new.client_id, new.id, 'create', new.body, new.color_id, new.created_at);
END;

CREATE TRIGGER notes_au_event AFTER UPDATE ON notes
WHEN (old.body IS NOT new.body) OR (old.color_id IS NOT new.color_id)
BEGIN
  INSERT INTO note_events (client_id, note_id, action, body, color_id, at)
  VALUES (new.client_id, new.id, 'update', new.body, new.color_id, new.updated_at);
END;

CREATE TRIGGER notes_ad_event AFTER DELETE ON notes BEGIN
  INSERT INTO note_events (client_id, note_id, action, body, color_id, at)
  VALUES (
    old.client_id, old.id, 'delete', old.body, old.color_id,
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  );
END;

-- ─── VIEW client_timeline: заменяем kind='note' на kind='note_event' ────────
DROP VIEW IF EXISTS client_timeline;
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
  'revision', r.id, r.client_id, r.changed_at,
  r.value, r.field_key,
  LAG(r.value) OVER (PARTITION BY r.client_id, r.field_key ORDER BY r.changed_at),
  r.note
FROM client_field_revisions r
UNION ALL
SELECT
  'anamnesis', a.id, a.client_id, a.taken_on,
  COALESCE(a.complaints, a.notes, a.life_history),
  NULL, NULL, NULL
FROM anamneses a
UNION ALL
SELECT
  'note_event', e.id, e.client_id, e.at,
  e.body, e.action, CAST(e.color_id AS TEXT), CAST(e.note_id AS TEXT)
FROM note_events e
UNION ALL
SELECT
  'protocol', p.id, p.client_id,
  (SELECT starts_at FROM meetings WHERE id = p.meeting_id),
  COALESCE(p.summary, p.plan_next, p.client_state, p.homework, p.techniques, p.private_notes),
  CAST(p.meeting_id AS TEXT),
  NULL,
  NULL
FROM meeting_protocols p
UNION ALL
SELECT
  'client_created', c.id, c.id, c.created_at,
  c.full_name, NULL, NULL, NULL
FROM clients c;
