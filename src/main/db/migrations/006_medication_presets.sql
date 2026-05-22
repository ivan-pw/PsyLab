-- 006_medication_presets.sql
-- Настраиваемый список пресетов медикаментов. Используется как источник
-- автодополнения в поле «Медикаменты» на странице клиента.
--
-- В самом поле клиента значения хранятся как JSON-массив строк в колонках
-- `current_medications` / `client_field_revisions.value` (где field_key =
-- 'medications'). Эта таблица — только справочник для UI.

CREATE TABLE medication_presets (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE COLLATE NOCASE,
  sort_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_medication_presets_sort ON medication_presets(sort_order, id);
