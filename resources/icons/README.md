# Иконки

`icon.svg` — заглушка-логотип «P в круге», 512×512.

`electron-builder` ожидает форматы:
- macOS: `resources/icon.icns` (с несколькими разрешениями внутри);
- Windows: `resources/icon.ico` (тоже multi-resolution);
- Linux/general: `resources/icon.png` (1024×1024).

Сборка из `icon.svg`:

```bash
# Растровый PNG для Linux/общего фоллбэка
magick -background none icon.svg -resize 1024x1024 ../icon.png

# Windows .ico (несколько разрешений)
magick -background none icon.svg \
  -define icon:auto-resize=16,24,32,48,64,128,256 ../icon.ico

# macOS .icns — нужен iconutil (входит в Xcode Command Line Tools)
mkdir -p icon.iconset
for size in 16 32 64 128 256 512; do
  magick -background none icon.svg -resize "${size}x${size}" \
    icon.iconset/icon_${size}x${size}.png
  d=$((size*2))
  magick -background none icon.svg -resize "${d}x${d}" \
    icon.iconset/icon_${size}x${size}@2x.png
done
iconutil -c icns icon.iconset -o ../icon.icns
rm -rf icon.iconset
```

После генерации сохраняем `icon.icns`, `icon.ico`, `icon.png` в
`resources/` (на одном уровне с `icons/`), `electron-builder.yml` уже
ссылается на эти пути.
