-- 002_search.sql
-- Включает глобальный поиск:
--  1. Backfill: переносит существующие записи в search_index.
--  2. Триггеры на clients / notes / anamneses / client_field_revisions,
--     которые поддерживают search_index в актуальном состоянии.
--
-- entity_type ∈ ('client','note','anamnesis','revision')
-- text — конкатенация полей, по которым ищем. Сама таблица search_index
-- создана в 001_init (FTS5 unicode61, remove_diacritics).
--
-- Важно: записи notes / anamneses / revisions удаляются триггерами явно,
-- а не через ON DELETE CASCADE от clients — CASCADE индекс не трогает.
-- Поэтому при удалении клиента сначала отрабатывают триггеры на
-- notes/anamneses/revisions (CASCADE их удаляет → AFTER DELETE срабатывает),
-- потом сам clients_ad чистит хвосты по client_id.

-- ─── Backfill ───────────────────────────────────────────────────────────────
INSERT INTO search_index (entity_type, entity_id, client_id, text)
SELECT 'client', id, id,
       full_name || ' ' || COALESCE(notes_short, '')
FROM clients;

INSERT INTO search_index (entity_type, entity_id, client_id, text)
SELECT 'note', id, client_id, body
FROM notes;

INSERT INTO search_index (entity_type, entity_id, client_id, text)
SELECT 'anamnesis', id, client_id,
       COALESCE(complaints, '')      || ' ' ||
       COALESCE(life_history, '')    || ' ' ||
       COALESCE(family_history, '')  || ' ' ||
       COALESCE(medical_history, '') || ' ' ||
       COALESCE(mental_history, '')  || ' ' ||
       COALESCE(substances, '')      || ' ' ||
       COALESCE(notes, '')
FROM anamneses;

INSERT INTO search_index (entity_type, entity_id, client_id, text)
SELECT 'revision', id, client_id, COALESCE(value, '')
FROM client_field_revisions
WHERE value IS NOT NULL AND value != '';

-- ─── Триггеры: clients ──────────────────────────────────────────────────────
CREATE TRIGGER clients_ai_search AFTER INSERT ON clients BEGIN
  INSERT INTO search_index (entity_type, entity_id, client_id, text)
  VALUES ('client', new.id, new.id, new.full_name || ' ' || COALESCE(new.notes_short, ''));
END;

CREATE TRIGGER clients_au_search AFTER UPDATE OF full_name, notes_short ON clients BEGIN
  DELETE FROM search_index WHERE entity_type='client' AND entity_id=old.id;
  INSERT INTO search_index (entity_type, entity_id, client_id, text)
  VALUES ('client', new.id, new.id, new.full_name || ' ' || COALESCE(new.notes_short, ''));
END;

CREATE TRIGGER clients_ad_search AFTER DELETE ON clients BEGIN
  -- Хвосты по client_id (на случай, если триггеры зависимых таблиц что-то
  -- не отловили). Безопасно: zero-row если уже чисто.
  DELETE FROM search_index WHERE client_id=old.id;
END;

-- ─── Триггеры: notes ────────────────────────────────────────────────────────
CREATE TRIGGER notes_ai_search AFTER INSERT ON notes BEGIN
  INSERT INTO search_index (entity_type, entity_id, client_id, text)
  VALUES ('note', new.id, new.client_id, new.body);
END;

CREATE TRIGGER notes_au_search AFTER UPDATE OF body ON notes BEGIN
  DELETE FROM search_index WHERE entity_type='note' AND entity_id=old.id;
  INSERT INTO search_index (entity_type, entity_id, client_id, text)
  VALUES ('note', new.id, new.client_id, new.body);
END;

CREATE TRIGGER notes_ad_search AFTER DELETE ON notes BEGIN
  DELETE FROM search_index WHERE entity_type='note' AND entity_id=old.id;
END;

-- ─── Триггеры: anamneses ────────────────────────────────────────────────────
CREATE TRIGGER anamneses_ai_search AFTER INSERT ON anamneses BEGIN
  INSERT INTO search_index (entity_type, entity_id, client_id, text)
  VALUES (
    'anamnesis', new.id, new.client_id,
    COALESCE(new.complaints, '')      || ' ' ||
    COALESCE(new.life_history, '')    || ' ' ||
    COALESCE(new.family_history, '')  || ' ' ||
    COALESCE(new.medical_history, '') || ' ' ||
    COALESCE(new.mental_history, '')  || ' ' ||
    COALESCE(new.substances, '')      || ' ' ||
    COALESCE(new.notes, '')
  );
END;

CREATE TRIGGER anamneses_au_search AFTER UPDATE ON anamneses BEGIN
  DELETE FROM search_index WHERE entity_type='anamnesis' AND entity_id=old.id;
  INSERT INTO search_index (entity_type, entity_id, client_id, text)
  VALUES (
    'anamnesis', new.id, new.client_id,
    COALESCE(new.complaints, '')      || ' ' ||
    COALESCE(new.life_history, '')    || ' ' ||
    COALESCE(new.family_history, '')  || ' ' ||
    COALESCE(new.medical_history, '') || ' ' ||
    COALESCE(new.mental_history, '')  || ' ' ||
    COALESCE(new.substances, '')      || ' ' ||
    COALESCE(new.notes, '')
  );
END;

CREATE TRIGGER anamneses_ad_search AFTER DELETE ON anamneses BEGIN
  DELETE FROM search_index WHERE entity_type='anamnesis' AND entity_id=old.id;
END;

-- ─── Триггеры: client_field_revisions ──────────────────────────────────────
-- Ревизии не редактируются, только INSERT и DELETE (CASCADE при удалении клиента).
CREATE TRIGGER revisions_ai_search AFTER INSERT ON client_field_revisions
WHEN new.value IS NOT NULL AND new.value != ''
BEGIN
  INSERT INTO search_index (entity_type, entity_id, client_id, text)
  VALUES ('revision', new.id, new.client_id, new.value);
END;

CREATE TRIGGER revisions_ad_search AFTER DELETE ON client_field_revisions BEGIN
  DELETE FROM search_index WHERE entity_type='revision' AND entity_id=old.id;
END;
