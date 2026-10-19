# Швеллер № 5: обработка изображения

Дата: 19 октября 2026. Инструмент: встроенный `image_gen`.

Текущий исходник — последнее фото владельца, сохранённое в `imports/shveller-5-user-reference.png`. Исходная иллюстрация поставщика сохранена отдельно: `public/images/catalog/rozmet/ca3c1dfb8c4559492ead.png`.
Итог для сайта: `public/images/catalog/shveller/shveller-5-clean.webp`, 1254 × 1254 px; WebP, quality 92, без изменения разрешения при экспорте.

Задание для текущего варианта: реалистично убрать ржавчину с фотографии владельца, улучшить чёткость, сохранить ракурс и фактуру горячекатаной стали. Размерные линии соответствуют перспективе торцевого сечения: 50 мм вдоль стенки, 32 мм вдоль полки, толщины 4,4 и 7 мм отдельно. Длина 11,7 м и теоретическая масса 4,84 кг/м подписаны на свободном фоне. Полный промпт — `imports/shveller-5-photo-prompt.txt`. Изображение — иллюстрация, не чертёж для изготовления.

Последующая корректировка по образцам владельца: левая торцевая грань выровнена по вертикали, линия 50 мм горизонтальная с вертикальными выносными линиями; 32 мм вертикально слева. Толщина стенки 4,4 мм обозначена выноской к торцу стенки снизу, 7 мм — короткой горизонтальной размерной линией по толщине полки. Финальные промпты встроенного `image_gen`: `imports/shveller-5-dimension-prompts.txt`.

Промпт предыдущего варианта до предоставления фото владельцем (больше не используется):

> Precise correction of TWO text labels ONLY in this existing steel channel technical illustration. This steel channel is rotated in the illustration, its web is the bottom flat piece. Replace the LEFT vertical dimension label '50 мм' with exactly '32 мм'. Replace the BOTTOM horizontal dimension label '32 мм' with exactly '50 мм'. Preserve the same arrows and their positions. Keep all other image content, the silver metal, perspective, geometry, quality and labels completely unchanged: '11 700 мм', '4,4 мм', '7 мм', '№ 5'. Do not add any watermark or manufacturer. Do not modify anything else. Output square full resolution.
