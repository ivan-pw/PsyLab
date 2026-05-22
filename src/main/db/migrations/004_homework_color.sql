-- 004_homework_color.sql
-- Добавляем дефолтный цвет «Домашка» в палитру заметок.
-- Идемпотентно: если такая подпись уже есть — пропускаем.

INSERT INTO note_colors (hex, label, sort_order)
SELECT '#a855f7', 'Домашка',
       COALESCE((SELECT MAX(sort_order) FROM note_colors), 0) + 1
WHERE NOT EXISTS (
  SELECT 1 FROM note_colors WHERE label = 'Домашка'
);
