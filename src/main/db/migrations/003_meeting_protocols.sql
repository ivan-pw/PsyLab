-- 003_meeting_protocols.sql
-- Протокол встречи — структурированная запись по итогам сессии.
-- На одну встречу — максимум один протокол (UNIQUE по meeting_id).
--
-- Подполя нечётко зафиксированы, но достаточны для типичной заметки
-- психолога после сессии:
--   summary           — ход сессии / о чём говорили
--   techniques        — применённые техники / методы
--   client_state      — состояние клиента (наблюдения)
--   homework          — домашнее задание / договорённости
--   plan_next         — планы на следующую встречу
--   private_notes     — приватные заметки терапевта
--
-- Все подполя nullable, кроме принадлежности встрече.
--
-- VIEW client_timeline пересоздаётся — там нельзя ALTER VIEW.
-- Новый kind = 'protocol' с превью COALESCE(summary, plan_next, ...).
--
-- FTS5: триггеры на INSERT/UPDATE/DELETE добавляют запись в search_index
-- с entity_type='protocol'.

PRAGMA foreign_keys = ON;

CREATE TABLE meeting_protocols (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id      INTEGER NOT NULL UNIQUE
                  REFERENCES meetings(id) ON DELETE CASCADE,
  client_id       INTEGER NOT NULL
                  REFERENCES clients(id) ON DELETE CASCADE,
  summary         TEXT,
  techniques      TEXT,
  client_state    TEXT,
  homework        TEXT,
  plan_next       TEXT,
  private_notes   TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);
CREATE INDEX idx_protocols_client ON meeting_protocols(client_id);
CREATE INDEX idx_protocols_meeting ON meeting_protocols(meeting_id);

-- ─── VIEW: добавляем kind='protocol' ────────────────────────────────────────
-- VIEW в SQLite перезапускаются через DROP + CREATE.
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
  'note', n.id, n.client_id, n.created_at,
  n.body, CAST(n.color_id AS TEXT), NULL, NULL
FROM notes n
UNION ALL
SELECT
  'protocol', p.id, p.client_id,
  -- Сортируем рядом со встречей: используем starts_at встречи как `at`.
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

-- ─── FTS5-триггеры на meeting_protocols ─────────────────────────────────────
CREATE TRIGGER protocols_ai_search AFTER INSERT ON meeting_protocols BEGIN
  INSERT INTO search_index (entity_type, entity_id, client_id, text)
  VALUES (
    'protocol', new.id, new.client_id,
    COALESCE(new.summary, '')       || ' ' ||
    COALESCE(new.techniques, '')    || ' ' ||
    COALESCE(new.client_state, '')  || ' ' ||
    COALESCE(new.homework, '')      || ' ' ||
    COALESCE(new.plan_next, '')     || ' ' ||
    COALESCE(new.private_notes, '')
  );
END;

CREATE TRIGGER protocols_au_search AFTER UPDATE ON meeting_protocols BEGIN
  DELETE FROM search_index WHERE entity_type='protocol' AND entity_id=old.id;
  INSERT INTO search_index (entity_type, entity_id, client_id, text)
  VALUES (
    'protocol', new.id, new.client_id,
    COALESCE(new.summary, '')       || ' ' ||
    COALESCE(new.techniques, '')    || ' ' ||
    COALESCE(new.client_state, '')  || ' ' ||
    COALESCE(new.homework, '')      || ' ' ||
    COALESCE(new.plan_next, '')     || ' ' ||
    COALESCE(new.private_notes, '')
  );
END;

CREATE TRIGGER protocols_ad_search AFTER DELETE ON meeting_protocols BEGIN
  DELETE FROM search_index WHERE entity_type='protocol' AND entity_id=old.id;
END;
