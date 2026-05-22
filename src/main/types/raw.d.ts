/**
 * src/main/types/raw.d.ts
 *
 * Объявления типов для Vite-импортов `?raw`, чтобы TS знал, что такие
 * импорты возвращают строку. Используется для встраивания SQL-миграций
 * в бандл main-процесса.
 */
declare module '*?raw' {
  const src: string
  export default src
}

declare module '*.sql?raw' {
  const src: string
  export default src
}
