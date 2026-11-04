# Локальный шрифт интерфейса

`InterVariable.woff2` подготовлен из уже находящегося в проекте
`imports/shveller-image-template/fonts/Inter-variable.ttf`: Inter 4.001,
SHA-256 `29160a80ff49ddcab2c97711247e08b1fab27a484a329ce8b813d820dc559031`.
Лицензия SIL Open Font License 1.1 сохранена в `OFL.txt`.
Проект шрифта: https://rsms.me/inter/.

Сохранены оси `wght` 100–900 и `opsz` 14–32. В интерфейсе основные начертания:
400 для чтения, 500 для значений и компактных действий, 600 для карточек и
подзаголовков, 700 для заголовка страницы и основных цен.

Латиница, кириллица, комбинируемые знаки, пунктуация, валюты, стрелки и
математические обозначения включены в один WOFF2 размером 246 152 байта.
Остальные символы используют системный fallback. Next.js `next/font/local`
отдаёт файл с сайта и добавляет fallback Arial с согласованными метриками.

Для воспроизведения нужны FontTools с поддержкой Brotli во временном Python venv,
без добавления зависимостей приложения. Из корня проекта:

```sh
python -m fontTools.subset imports/shveller-image-template/fonts/Inter-variable.ttf \
  --output-file=app/fonts/InterVariable.woff2 --flavor=woff2 \
  --unicodes='U+0000-024F,U+0300-036F,U+0400-052F,U+1C80-1C8F,U+1E00-1EFF,U+2000-214F,U+2190-23FF,U+25A0-25FF,U+FEFF,U+FFFD' \
  --layout-features='*' --name-IDs='*' --name-legacy --name-languages='*' \
  --notdef-glyph --notdef-outline --recommended-glyphs
```

Размеры и роли текста определены в `app/typography.css`.
Правила применения: `docs/typography.md`.
