# PsyNote

>  [English version](./README.md)

Локальное настольное приложение для психолога: клиенты, встречи, заметки,
структурированные анамнезы, история изменений полей с таймлайном и
глобальный полнотекстовый поиск. Всё хранится локально в зашифрованной
SQLite (SQLCipher), доступ — по паролю. Никакая телеметрия и облако не
используются.

Платформы: **macOS**, **Windows**, **Linux**.

---

## Возможности

- **Клиенты** — карточка с историей изменений 6 полей (телефон, email,
  мессенджер, видео-ссылка, диагноз, медикаменты). Каждое изменение —
  новая ревизия, видна в таймлайне.
- **Структурированные анамнезы** — 7 подполей (жалобы, анамнез жизни,
  семейный / соматический / психический, ПАВ, заметки). Несколько
  снимков во времени.
- **Встречи** — `react-big-calendar` (месяц / неделя / день / agenda),
  цвет по статусу. Mini-календарь в сайдбаре.
- **Заметки** — цветные карточки с настраиваемой палитрой и текстовыми
  бейджами.
- **Таймлайн клиента** — единая лента: встречи + ревизии полей + анамнезы
  + заметки. Фильтры по типу.
- **Глобальный поиск** — FTS5 по всем сущностям, prefix-search и
  сниппеты. `⌘K` / `Ctrl+K`.
- **i18n** — ru / en, словари расширяемы (`react-i18next`).
- **Темы** — system / light / dark.
- **Шифрование** — SQLCipher, PBKDF2-SHA512 ×250 000 → 32-байтный ключ,
  соль в отдельном файле.
- **Автоблокировка** по таймауту неактивности (по умолчанию 15 минут).
- **Бэкапы** — ручной снапшот в `userData/backups/`, ротация.
- **Экспорт JSON** — расшифрованный дамп с явным предупреждением.
- **Корзина** — мягкое удаление клиента, восстановление или полное
  удаление.

## Стек

- Electron 33 + electron-vite + electron-builder
- React 18 + TypeScript (strict)
- SQLite через `better-sqlite3-multiple-ciphers` (SQLCipher-совместимый)
- TanStack Query, React Router (Hash), Zustand
- Tailwind CSS + shadcn/ui (Radix UI), lucide-react, sonner
- zod (валидация IPC-payload'ов)
- vitest

---

## Запуск из исходников (dev)

Требования: **Node ≥ 20**, **pnpm ≥ 10**.

```bash
git clone <repo-url> psynote
cd psynote
pnpm install
pnpm dev
```

`pnpm dev` сначала пересобирает нативный модуль под текущий Electron
(`electron-rebuild -f -w better-sqlite3-multiple-ciphers`), затем
запускает `electron-vite dev` с HMR.

### Системные зависимости

| ОС | Требуется |
|---|---|
| macOS | Xcode Command Line Tools (`xcode-select --install`) |
| Windows | Visual Studio Build Tools с C++ workload, Python 3 |
| Linux | `build-essential`, `python3`, `libsqlite3-dev` (для сборки нативных модулей) |

На Linux дополнительно может понадобиться `libnss3`, `libgbm1`,
`libxshmfence1` — стандартные runtime-зависимости Electron.

### Первый запуск

1. Создаётся пароль (минимум 6 символов).
2. БД и соль ложатся в `app.getPath('userData')` (см. ниже).
3. Появляется EULA — без согласия дальше не пускает.

---

## Сборка дистрибутивов

```bash
pnpm build       # сборка main + preload + renderer в out/
pnpm dist:mac    # release/ → .dmg (без подписи)
pnpm dist:win    # release/ → .exe (NSIS, без подписи)
```

Иконки (`icon.png` / `icon.ico` / `icon.icns`) лежат в [`resources/`](./resources/).

Артефакты пишутся в `release/`. Подпись (Apple Developer ID / Windows
code-signing) — отдельный этап, в MVP не выполняется.

---

## Установка собранного приложения

### macOS (`.dmg`)

Дистрибутив не подписан Apple Developer ID и не нотаризован, поэтому
Gatekeeper заблокирует первый запуск:

- «PsyNote нельзя открыть, разработчик не идентифицирован», или
- «PsyNote повреждён и не может быть открыт» (если файл пришёл через
  AirDrop / архив / браузер — Apple вешает атрибут «карантин»).

**Самый простой фикс** — после перетаскивания `PsyNote.app` в
`/Applications/`:

```bash
xattr -dr com.apple.quarantine /Applications/PsyNote.app
codesign --force --deep --sign - /Applications/PsyNote.app
```

Первая команда снимает карантинный xattr (`is damaged` уйдёт). Вторая
делает ad-hoc подпись локально (без покупки сертификата) — после этого
запуск разрешён без правого клика.

**Альтернатива без Terminal**:

1. Правый клик по `PsyNote.app` → «Открыть» → в диалоге снова «Открыть».
2. Если кнопки нет — Системные настройки → Конфиденциальность и
   безопасность → внизу «PsyNote было заблокировано» → «Открыть всё
   равно».

Этот путь не работает только при сообщении «is damaged» — там помогает
первая команда выше.

### Windows (`.exe`, NSIS-инсталлятор)

SmartScreen покажет «Защитник Windows предотвратил запуск неизвестного
приложения» — нажать «Подробнее» → «Выполнить в любом случае».

Установщик создаст ярлык в меню «Пуск» и (опционально) на рабочем
столе.

### Linux

`electron-builder` поддерживает таргеты `AppImage` / `deb` / `rpm`.
В текущем `electron-builder.yml` таргеты Linux не настроены — добавить
вручную при необходимости, после чего:

```bash
pnpm build && pnpm exec electron-builder --linux
```

Запуск `AppImage`:

```bash
chmod +x PsyNote-*.AppImage
./PsyNote-*.AppImage
```

---

## Где хранятся данные

Стандартная директория `app.getPath('userData')`:

| ОС | Путь |
|---|---|
| macOS | `~/Library/Application Support/psynote/` |
| Windows | `%APPDATA%\psynote\` (обычно `C:\Users\<user>\AppData\Roaming\psynote\`) |
| Linux | `~/.config/psynote/` |

Содержимое:

- `psynote.db` — зашифрованная SQLite (SQLCipher).
- `psynote.salt` — 16-байт соль для PBKDF2. **Без неё ключ из пароля
  не вывести.**
- `psynote.db-wal` / `psynote.db-shm` — служебные журналы SQLite.
- `backups/psynote-<ISO>.db` (+ парный `*.salt`) — ручные снапшоты.

Никакие данные никуда не отправляются — ни в облако, ни в телеметрию.

---

## Экспорт и резервные копии

- **Бэкап** — Настройки → «Сделать бэкап». Копирует `psynote.db` +
  `psynote.salt` в `userData/backups/`. Ротация по количеству.
- **Экспорт JSON** — Настройки → «Экспорт в JSON». Перед запуском
  диалог-предупреждение, затем системный «Save As». Полученный файл —
  расшифрованный дамп всех таблиц + `schema_version` + `generated_at`.
  Подходит для миграции и переноса. **Хранить только в защищённом
  месте, удалять после использования.**

---

## Тесты и проверки

```bash
pnpm typecheck      # tsc для main + renderer
pnpm lint           # eslint
pnpm format         # prettier --write
pnpm test           # vitest run
pnpm test:watch
```

---

## Структура проекта

```
src/
├── main/           # Electron main: окно, IPC, БД, миграции, бэкапы
│   ├── ipc/        # обработчики по доменам (auth/clients/notes/...)
│   ├── db/         # connection, migrator, миграции, репозитории
│   └── services/   # crypto, backup, exportJson
├── preload/        # contextBridge → window.api
├── shared/         # общие типы, zod-схемы, контракт api
└── renderer/       # React-приложение
    ├── pages/      # Unlock, ClientsList, ClientDetail, Calendar, Settings
    ├── components/ # Layout, Timeline, ClientFields, Notes, Settings, …
    ├── hooks/      # useClients, useMeetings, useAnamneses, useNotes, …
    ├── api/        # обёртки над window.api
    ├── lib/        # utils, format, i18n, queryClient
    ├── store/      # zustand (auth, theme, locale)
    └── locales/    # ru.json, en.json
```


---

## Безопасность

- БД зашифрована SQLCipher, ключ выведен из пароля (PBKDF2-SHA512,
  250 000 итераций).
- Соль — отдельный файл `psynote.salt` рядом с `psynote.db`. Без неё
  файл БД бесполезен.
- Пароль нигде не хранится. **Восстановление пароля невозможно —
  потеря пароля = потеря данных.**
- Автоблокировка по таймауту неактивности.
- Экспорт JSON — единственный нешифрованный вывод; требует явного
  подтверждения.

---

## Лицензия

[PolyForm Small Business License 1.0.0](./LICENSE) с дополнительным
ограничением: бесплатно — только при штате ≤ 1 человека **и** годовой
выручке ≤ $30 000. Прочее использование — по отдельному соглашению с
правообладателем. Полный текст и условия — в файле [LICENSE](./LICENSE).
