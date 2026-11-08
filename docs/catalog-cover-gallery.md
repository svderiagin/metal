# Титульные фотографии категорий

`CatalogCoverGallery` используется только в заголовках категорий и семейств
товаров. `ProductCatalogIntro` использует компактное фото рядом с заголовком
и коротким введением: 320 px на компьютере, 200 px на небольшом планшете
и 192 px на телефоне. На телефоне фото расположено под введением.
Подробные рекомендации находятся после товаров и доступны по ссылке из введения.
Размеры фото и положение фильтров сохраняются при открытии и закрытии просмотра.

Обычный клик открывает фото поверх страницы, в закруглённой рамке с затемнением
фона. Курсор — лупа. Полный кадр вписывается в экран с сохранением пропорций;
маленький исходник не растягивается сверх собственного размера.
Клик по фото, фону, крестик или Escape закрывает просмотр и возвращает фокус
на исходную фотографию. Tab остаётся внутри открытого просмотра.

Кнопка «100%» показывает исходник в масштабе 1:1, если он больше области
просмотра. Перемещение — перетаскиванием мышью/пальцем либо стрелками клавиатуры;
перетаскивание не закрывает окно. «Вписать» возвращает полный кадр.
Оригинал загружается при открытии; до этого используется оптимизированное фото.

## Добавление кадров

Галереи задаются в `data/catalog-cover-galleries.ts` по существующему `Category.id`
или `ProductType.id`. В `additional` идут упорядоченные пути фото без префикса
`/public`. Первым показывается `cover`, если он задан, или основное фото из
каталога. Пустые пути и дубликаты удаляются.
Не смешивайте разные виды проката, марки стали и товарные размеры ради наполнения.

При двух и более кадрах автоматически появляются стрелки и счётчик — на странице
и в увеличенном просмотре. Пролистывание циклическое; в режиме вписывания работают
также клавиши ←/→. Выбранный кадр сохраняется после закрытия, масштаб и перемещение
сбрасываются при переходе к следующему фото. Дополнительные кадры заранее
не загружаются все вместе. После добавления файлов обновите версии изображений
и выполните визуальную проверку по `docs/catalog-images.md`.
На странице многокадровая обложка заполняет рамку 2:1. В увеличенном просмотре
весь кадр виден в исходных пропорциях.

Просмотр фото товаров в строках/карточках таблицы остаётся в
`ProductImageViewer`; к нему эта галерея не относится.

## «Лист оцинкованный»

Восемь кадров хранятся в `public/images/catalog/listovoy-prokat/list_ocinkovanniy/cover/`.
Первым идёт горизонтальный кадр Harçelik. На странице используются оптимизированные
копии, а увеличенный просмотр показывает исходные файлы.

| Файл | Источник |
| --- | --- |
| `harcelik.webp` | [Harçelik](https://www.harcelik.com/en/kategori/galvaniz-sac) · [фото](https://www.harcelik.com/harcelikpanel/Sayfalar/urunler/galvaniz-sac-126.webp) |
| `marketstal-warehouse.webp` | [Marketstal](https://marketstal.pl/blacha-ocynkowana-3-1500x3000-dx51d-z275) · [фото](https://marketstal.pl/userdata/public/gfx/8310/Blacha-ocynkowana-3%2C0-mm-1500x3000-DX51D-Z275-magazyn-1.webp) |
| `rolled-steel-sheet.jpg` | [RolledSteelSheet](https://www.rolledsteelsheet.com/sale-41382044-hot-dip-gi-galvanized-sheet-plate-dx51d-1-5mm-thick-4x8-rolled-hrb60.html) · [фото](https://www.rolledsteelsheet.com/photo/pl160978991-hot_dip_gi_galvanized_sheet_plate_dx51d_1_5mm_thick_4x8_rolled_hrb60.jpg) |
| `cs-carbon-steel.jpg` | [Shandong TISCO](https://www.cscarbonsteel.com/sale-35394406-mild-metal-galvanized-steel-sheet-plate-1mm-2mm-thick-baosteel.html) · [фото](https://www.cscarbonsteel.com/photo/pl138409441-mild_metal_galvanized_steel_sheet_plate_1mm_2mm_thick_baosteel.jpg) |
| `expo-snab.jpg` | [СтройЭкспоСнаб](https://expo-snab.kz/p60239579-list-otsinkovannyj-035mm.html) · [фото](https://images.satu.kz/93051994_w1280_h640_93051994.jpg) |
| `wuxi-gms.jpg` | [Wuxi GMS](https://wxgms1.en.made-in-china.com/product/CwdGiKBMwrYb/China-Saph440-Z275-Galvanized-Steel-Coil-and-Sheet-Saph-440-Material-Properties.html) · [фото](https://image.made-in-china.com/2f0j00RCwWGlBcHUzV/Saph440-Z275-Galvanized-Steel-Coil-and-Sheet-Saph-440-Material-Properties.jpg) |
| `marketstal-edges.webp` | [Marketstal](https://marketstal.pl/blacha-ocynkowana-3-1500x3000-dx51d-z275) · [фото](https://marketstal.pl/userdata/public/gfx/8306/Blacha-ocynkowana-3%2C0-mm-1500x3000-DX51D-Z275--krawedz.webp) |
| `marketstal-surface.webp` | [Marketstal](https://marketstal.pl/blacha-ocynkowana-3-1500x3000-dx51d-z275) · [фото](https://marketstal.pl/userdata/public/gfx/8307/Blacha-ocynkowana-3%2C0-mm-1500x3000-DX51D-Z275-zblizenie-powierzchni.webp) |

## Другие подкатегории листового проката

Фото лежат в `cover/` каждой подкатегории. В каждой серии первым идёт складской
кадр, затем идут другие ракурсы пачек, кромок и поверхности.

| Подкатегория | Файл | Источник |
| --- | --- | --- |
| Холоднокатаный | `marketstal-sheet-rack.webp` | [Marketstal](https://marketstal.pl/blacha-dc01-2-0-1500x3000-zimnowalcowana) · [фото](https://marketstal.pl/userdata/public/gfx/8558/Blacha-DC01-2%2C0x1500x3000-stalowa-zimnowalcowana-magazyn-1.webp) |
| Холоднокатаный | `maras-metal-banded-sheets.jpg` | [Maraş Metal](https://marasmetal.com.tr/hizmet-detay/levha) · [фото](https://marasmetal.com.tr/tema/genel/uploads/hizmetler/0132998_030-soguk-haddelenmis-levha-sac.jpeg) |
| Холоднокатаный | `marketstal-sheet-surface.webp` | [Marketstal](https://marketstal.pl/blacha-dc01-2-0-1500x3000-zimnowalcowana) · [фото](https://marketstal.pl/userdata/public/gfx/8556/Blacha-DC01-2%2C0x1500x3000-stalowa-zimnowalcowana-widok-tafli.webp) |
| Холоднокатаный | `marketstal-sheet-edges.webp` | [Marketstal](https://marketstal.pl/blacha-dc01-2-0-1500x3000-zimnowalcowana) · [фото](https://marketstal.pl/userdata/public/gfx/8557/Blacha-DC01-2%2C0x1500x3000-stalowa-zimnowalcowana-krawedz.webp) |
| Рифлёный | `sugar-steel-warehouse.jpg` | [Sugar Steel](https://sugarsteel.com/products/floor-tread-plate/) · [фото](https://sugarsteel.com/wp-content/uploads/1_-_IMG_2082.jpg) |
| Рифлёный | `marketstal-sheet-rack.webp` | [Marketstal](https://marketstal.pl/blacha-lezka-4-0-1250x2500-s235-ryflowana) · [фото](https://marketstal.pl/userdata/public/gfx/8608/Blacha-lezka-4%2C0x1250x2500-stalowa-ryflowana-S235-magazyn-1.webp.webp) |
| Рифлёный | `total-steel-stacks.jpg` | [Total Steel](https://totalsteel.com.au/floor-plates.html) · [фото](https://totalsteel.com.au/assets/images/product-images/floorplates/chq_plate.jpg) |
| Рифлёный | `stalserwis-sheet-edges.jpg` | [Stalserwis](https://www.stalserwis24.pl/asortyment/blachy/ryflowane/blacha-ryflowana-lezka-3-x-1000-x-2000/) · [фото](https://www.stalserwis24.pl/wp-content/uploads/2020/05/6-2.jpg) |
| Рифлёный | `sugar-steel-tread-detail.jpg` | [Sugar Steel](https://sugarsteel.com/products/floor-tread-plate/) · [фото](https://sugarsteel.com/wp-content/uploads/IMG_2169.jpg) |
| Горячекатаный | `morgan-warehouse.webp` | [Morgan Steel](https://www.morgansteel.com/products) · [фото](https://images.squarespace-cdn.com/content/v1/6121663d61b714478bb2d875/1651871511190-MHG4BVHUTVCJT4J7NIEA/PRODUCTS%2BPAGE%2B-%2BFLAT%2BROLLED%2B-%2B%2BHR%2B%282%29-min.jpg) |
| Горячекатаный | `huale-stacks.webp` | [Huale](https://hualesteel.com/production-lines) · [фото](https://hualesteel.com/assets/images/products/slitting-hot-rolled-sheet-02.webp) |
| Горячекатаный | `beshert-warehouse.jpg` | [Beshert Steel](https://www.beshertsteel.com/steel-types/hot-rolled/) · [фото](https://www.beshertsteel.com/assets/images/buckets/metal-types-hot-rolled.jpg) |
| Горячекатаный | `ural-sheet-surface.jpg` | [Уральская Стальная Компания](https://met-chel.ru/list-goryachekatanyij) · [фото](https://met-chel.ru/assets/images/products/126/34c1b67c1b8364b35a66474c0ef4cc2686e88408.jpg) |
| Горячекатаный | `marketstal-sheet-edges.webp` | [Marketstal](https://marketstal.pl/blacha-stalowa-12-0-1500x3000-s235-goracowalcowana) · [фото](https://marketstal.pl/userdata/public/gfx/8492/Blacha-stalowa-12%2C0x1500x3000-goracowalcowana-S235-krawedz.webp) |

## «Швеллер», «Уголок стальной» и «Квадрат стальной»

В каждой галерее первой идёт существующая обложка, затем четыре дополнительных
кадра со складскими ракурсами и деталями сечения. Дополнительные фото лежат в
`cover/` соответствующей категории. На странице кадры вписываются в формат 2:1
с обрезкой по центру, в просмотре открывается целый кадр.

| Категория | Файл | Источник |
| --- | --- | --- |
| Швеллер | `rigang-channel-bundle.avif` | [Rigang](https://rigangmaterials.com/products/steel-profile/channel-steel/) · [фото](https://rigangmaterials.com/wp-content/uploads/2026/08/Channel-Steel3.avif) |
| Швеллер | `gradstal-channel-stock.jpg` | [Град Сталь](https://gradstal.ru/catalog/shveller/) · [фото](https://www.gradstal.ru/images/shveller-1-large.jpg) |
| Швеллер | `artmetal-channel-ends.jpg` | [АртМеталлГрупп](https://artmetalgroup.ru/shveller/shveller-8-p) · [фото](https://artmetalgroup.ru/images/product/163/1719472037-7.jpg) |
| Швеллер | `eststeel-channel-profile.jpg` | [Eastern Steel](https://eststeel.com/en/products/c-channel/) · [фото](https://eststeel.com/images/c-channel-1.jpg) |
| Уголок стальной | `ostermaier-angle-rack.jpg` | [Ostermaier](https://www.metallbau-ostermaier.de/stahlhandel/) · [фото](https://image.jimcdn.com/app/cms/image/transf/dimension%3Dorigxorig%3Aformat%3Djpg/path/s402e4372dc922405/image/i7502f59e57049442/version/1537375756/winkelstahl-bandstahl-heb-hea-hem-vierkantstahl-eisen-stahl-verkauf-aresing-ostermaier-schrobenhausen-eisenhandel-in-der-n%C3%A4he-gerolsbach-waidhofen-m%C3%BChlried-steingriff-edelshausen-h%C3%B6rzhausen-weilach-schiltberg-dachau.jpg) |
| Уголок стальной | `kzmc-angle-bundles.jpg` | [КЗМЦ](https://kzmc.uz/product/nizkolegirovannyj_gorjachekatanyj_ravnopolochnyj_ugolok_250h250h25_18g2afd/) · [фото](https://kzmc.uz/media/uploads/images/load/nizkolegirovannyj_ugolok_2.jpg) |
| Уголок стальной | `marketstal-angle-profile.jpg` | [Marketstal](https://marketstal.pl/Katownik-goracowalcowany-40x40x4,0-mm-dl.-6m) · [фото](https://marketstal.pl/userdata/public/gfx/7355/Katownik-goracowalcowany-40x40x4%2C0-mm.jpg) |
| Уголок стальной | `stalmal-angle-ends.jpg` | [Stalmal](https://stalmal.olsztyn.pl/wyroby-hutnicze-olsztyn/katowniki) · [фото](https://stalmal.olsztyn.pl/lib/x3jbjm/katowniki-stalowe-liq1xqfx.jpg) |
| Квадрат стальной | `tianyuda-square-yard.jpg` | [Tianyuda](https://www.tydsteelplate.com/products_20/58.html) · [фото](https://www.tydsteelplate.com/static/upload/image/20210120/1611127553114487.jpg) |
| Квадрат стальной | `zhongji-square-bundles.jpg` | [Zhongji Metal](https://www.zhongjimetal-steel.com/ar/products/Steel-Rod/Carbon-Steel-Square-Bars.html) · [фото](https://usimg.bjyyb.net/sites/96500/96556/1759114171831118833566154752.jpg) |
| Квадрат стальной | `ozdemir-square-ends.jpg` | [Özdemir](https://www.ozdemirsac.com/Urun-Detay-st37-s235-kare-dolu-demir-101) · [фото](https://www.ozdemirsac.com/img/urunler/st37_st37-2_st37-3_s235j0_s235jr_s235j2_kare_dolu_demiri.jpg) |
| Квадрат стальной | `metalshoppen-square-profile.jpg` | [Metalshoppen](https://metalshoppen.dk/products/stal-firkant-12x12mm-ubehandlet) · [фото](https://metalshoppen.dk/cdn/shop/files/thumbnail_black_steel_square_bar_d8a8cc03-4f5c-4b1d-aff7-fb02618b5508.jpg?v=1699909739) |

Из файла Marketstal удалены метаданные EXIF с геолокацией. Пиксели и размеры
исходного кадра сохранены.

## Арматура, трубы, профнастил, сетка и балки

Шесть категорий и 20 видов продукции используют отдельные галереи. На общей
странице категории часть фотографий показывает её разные виды продукции.
Галерея вида доступна и на странице подкатегории с одним видом продукции.
Кадры подобраны по карточкам поставщиков и показывают форму, фактуру и упаковку
проката. Марку стали и соответствие партии подтверждают документы качества.

### Арматура и балки

Основное фото А500С в карточке вида, на странице подкатегории и странице семейства —
`a500c-balakovo-warehouse.jpg` (1920 × 1164), выбранное владельцем 07.11.2026.
Файл сохранён в исходных байтах; размеры для миниатюр создаёт Next.js Image,
увеличенный просмотр загружает оригинал. Прежнее основное фото сохранено для
существующих товарных иллюстраций.
Источник — [публикация о продукции МЗ «Балаково»](https://metall.life/news/1800),
[оригинал фотографии](https://metall.life/uploads/main/00t/8b9d755e4595cf7835cf87eaca606ff805745908054a948171307955963f8863/dsc09423_2.jpg).
Свободная лицензия на коммерческое использование не подтверждена. Это иллюстрация
вида продукции; фото не подтверждает наличие, производителя или параметры партии.

Проверка замены: исходник, карточка, обе страницы А500С, просмотр вписанного кадра
и 1:1 на desktop/mobile в обеих темах; оптимизированные миниатюры отдаются в AVIF,
оригинал — 1920 × 1164. Фокусные проверки: 13 unit прошли (2 пропуска без
необязательного архива поставщика), 12 E2E прошли, четыре эталона категории
обновлены после просмотра diff и повторно прошли сравнение. Снимки проверки:
`.tmp/a500c-image-review/`.

07.11.2026 по выбору владельца в галерею А500С добавлены складские кадры
S12 (`a500c-stock-van-metall.png`, 1000 × 1000) и S13
(`a500c-yard-metallobaza.jpg`, 3648 × 2736). Они идут четвёртым и пятым
после трёх существующих фотографий. Оригиналы сохранены без пересжатия,
Next.js Image создаёт миниатюры. S13 — общий складской ракурс; марка партии
на снимке не подтверждена. Варианты G02/G03 из подборки оставлены для возможных
карточек товаров: в категории и подкатегории они не добавлены.
Вручную просмотрены миниатюры и полные кадры на странице А500С при обычной
ширине и 450 px; S13 также открыт в масштабе 1:1. Снимок страницы:
`.tmp/a500c-selected-photos/s13-on-page.png`. Автоматические тесты не запускались
по просьбе владельца.

Для А400 (35ГС) и А400 (25Г2С) владелец 07.11.2026 выбрал общий крупный план
`a400-ribbed-detail-expo.jpg` для карточек и обложек.
Основным кадром титульной галереи категории «Арматура» выбран
`a400-warehouse-berlion.webp`, ранее пятый в галерее. Прежняя обложка
`/images/catalog/armatura.jpg` сохранена третьим кадром, а
`a400-production-veles.jpg` с двумя рабочими в жёлтых касках — вторым.
В галереях подкатегорий кадра с рабочими нет.
Вертикальное фото `a400-35gs-stock-moststal.jpg` исключено из галереи категории
«Арматура» по просьбе владельца; в подкатегории А400 (35ГС) оно сохранено.
В подкатегории А240 (А1) из галереи исключено второе фото
`a240-stock-citymet.jpg`; в общей категории «Арматура» этот кадр сохранён.
По выбору владельца 07.11.2026 четвёртым кадром А240 (А1) добавлен A07 —
`a240-stock-metall-dk.jpg` (750 × 750): связки гладких прутков на складе.
Оригинал сохранён без пересжатия; в миниатюре видна центральная часть,
в увеличенном просмотре — полный кадр.
Вручную просмотрены миниатюра и оригинал A07 на компьютере и узком экране.
Снимок страницы: `.tmp/a240-selected-photo/a07-on-page.jpg`.
Автоматические тесты не запускались по просьбе владельца.
Файлы сохранены без изменения исходных байтов и пропорций. Старые дополнительные
кадры и фотографии товарных иллюстраций сохранены. Новые кадры иллюстрируют вид
продукции и упаковку; конкретные марки 35ГС/25Г2С и принадлежность производства
ими не подтверждаются. Коммерческая лицензия не подтверждена.

Дополнительно владелец выбрал три кадра из галереи «Берлион», каждый 1400 × 933.
В А400 (35ГС) по просьбе владельца исключена вторая фотография — связка
`a400-bundle-berlion.webp`. После обложки осталось вертикальное складское фото
`a400-35gs-stock-moststal.jpg`. Другой складской кадр ранее перенесён из этой
галереи в категорию «Арматура» и сделан её основной обложкой.
Из галереи А400 (25Г2С) по просьбе владельца
исключены крупный план рифления `a400-ribs-berlion.webp` и складской кадр
`a400-warehouse-berlion.webp`; после обложки идут прежние фотографии поставщиков.
Прежние обложки
и дополнительные фотографии сохранены. Файлы скачаны без пересжатия и ретуши.
Поставщик использует эту общую галерею на страницах
[35ГС](https://berlion.ru/armatura/riflenaya/35gs-12mm) и
[25Г2С](https://berlion.ru/armatura/riflenaya/25g2s-25mm); изображения иллюстрируют
товарную группу, а не подтверждают марку стали, размер или наличие конкретной партии.
Условия коммерческого использования не подтверждены.
По выбору владельца 07.11.2026 добавлено по одному складскому кадру:
N26 (`rebar-warehouse-arcelormittal.jpg`, 945 × 630) третьим в А400 (35ГС),
N28 (`rebar-warehouse-made-in-china.jpg`, 750 × 750) четвёртым в А400 (25Г2С).
Файлы сохранены без пересжатия. Это иллюстрации рифлёной арматуры;
марки 35ГС/25Г2С и происхождение конкретной партии ими не подтверждаются.
N26 и N28 вручную просмотрены на страницах своих подкатегорий: миниатюры
и полные версионированные оригиналы 945 × 630 и 750 × 750. N28 также просмотрен
на узком экране. Автоматические тесты не запускались по просьбе владельца.
Вручную просмотрены новые кадры на сайте: миниатюры обеих подкатегорий и
увеличенные фотографии на компьютере и при ширине 390 px. Оригинал связки
открыт в масштабе 1:1. Автоматические тесты не запускались по просьбе владельца.

| Файл | Размер | Источник |
| --- | --- | --- |
| `a400-bundle-berlion.webp` | 1400 × 933 | [Галерея 35ГС, кадр 2](https://berlion.ru/armatura/riflenaya/35gs-12mm) · [оригинал](https://berlion.ru/images/catalog/armatura-a3-gallery-2.webp?v=80bf5c49) |
| `a400-ribs-berlion.webp` | 1400 × 933 | [Галерея 25Г2С, кадр 3](https://berlion.ru/armatura/riflenaya/25g2s-25mm) · [оригинал](https://berlion.ru/images/catalog/armatura-a3-gallery-3.webp?v=60293ec5) |
| `a400-warehouse-berlion.webp` | 1400 × 933 | [Галерея 35ГС, кадр 5](https://berlion.ru/armatura/riflenaya/35gs-12mm) · [оригинал](https://berlion.ru/images/catalog/armatura-a3-gallery-5.webp?v=a8f8152e) |
| `rebar-warehouse-arcelormittal.jpg` (N26) | 945 × 630 | [ArcelorMittal Canada, арматура](https://long-canada.arcelormittal.com/fr/barres-darmature/) · [оригинал](https://long-canada.arcelormittal.com/sites/default/files/styles/fb/public/2019-10/ARCELOR%20MITTAL_Contrecoeur_2juin-8973.jpg?itok=3uBvvrRj) |
| `rebar-warehouse-made-in-china.jpg` (N28) | 750 × 750 | [Карточка поставщика Made-in-China](https://m.made-in-china.com/product/High-Load-Bearing-Capacity-Steel-Bars-and-Threaded-Steel-Bars-Can-Be-Cut-and-Customized-6-8-10-12-14-16-18-20-22-25-28-32-2108164665.html) · [оригинал](https://image.made-in-china.com/2f0j00jZPoHIKJSbqD/High-Load-Bearing-Capacity-Steel-Bars-and-Threaded-Steel-Bars-Can-Be-Cut-and-Customized-6-8-10-12-14-16-18-20-22-25-28-32.jpg) |
| `a400-ribbed-detail-expo.jpg` | 1000 × 667 | [Карточка арматуры А3](https://expo-snab.kz/p54942527-armatura.html) · [фото](https://images.satu.kz/82121969_armatura-36-mm.jpg) |
| `a400-production-veles.jpg` | 1910 × 1000 | [Галерея на странице А400](https://metalloprokat.velesark.ru/armatura/a400s) · [фото](https://metalloprokat.velesark.ru/assets/template/images/work_photos/originals/2.jpg) |
| `a500c-warehouse-meg.webp` | 1024 × 576 | [Карточка поставщика](https://spb.metexpro.ru/catalog/chernyy-prokat/armatura/armatura-12-a500s/) · [фото](https://spb.metexpro.ru/static/handoff/assets/photos/cat/armatura.webp) |
| `a500c-bundle-tag.jpg` | 960 × 1280 | [Карточка поставщика](https://www.prom.uz/ads/armatura-a500s-34028-2016-rossiya-25/) · [фото](https://devel.prom.uz/upload/products/2026/1/12/1/2-2.jpg) |
| `a500c-stock-van-metall.png` (S12) | 1000 × 1000 | [Металлопт, А500С 16 мм](https://van-metall.ru/domodedovo/catalog-tovarov/armatura/armatura-a3-500c/armatura-a500s-f-16-0006-a/) · [оригинал](https://van-metall.ru/image/cache/catalog/armature/varilla-corrugada-3-8-hlf-romero-1000x1000.png) |
| `a500c-yard-metallobaza.jpg` (S13) | 3648 × 2736 | [Металлобаза ТД, арматура](https://metallobaza-td.ru/armatura-moskva/) · [оригинал](https://metallobaza-td.ru/img/11554908.jpg) |
| `a400-35gs-stock-moststal.jpg` | 607 × 1080 | [Карточка поставщика](https://moststal.ru/magazin/armatura-a3-a400-35gs-12-mm) · [фото](https://moststal.ru/assets/images/products/2318/a400.jpeg) |
| `a400-25g2s-stock-pkfsst.jpg` | 836 × 627 | [Карточка поставщика](https://pkfsst.ru/armatura-40-mm-a3-a400-riflenaya-25g2s) · [фото](https://pkfsst.ru/img/static/329276/armatura-a3-2.jpeg) |
| `a400-25g2s-bundles-metallmk.jpg` | 600 × 800 | [Карточка поставщика](https://metallmk.ru/armatura/armatura-riflenaya/armatura-16-mm-a3-a400-riflenaya-25g2s/) · [фото](https://metallmk.ru/image/catalog/products_images/products/armatura-riflenaya4.jpg) |
| `a240-stock-citymet.jpg` | 3130 × 2495 | [Карточка поставщика](https://citymet.ru/armatura-gladkaya-a1) · [фото](https://citymet.ru/assets/mgr/images/armatura-gladkaya-a1/armatura-gladkaya.jpg) |
| `a240-bundle-citymet.jpg` | 1342 × 890 | [Карточка поставщика](https://citymet.ru/armatura-gladkaya-a1) · [фото](https://citymet.ru/assets/mgr/images/armatura-gladkaya-a1/armatura-a1-2.jpg) |
| `a240-rods-metallrs.webp` | 963 × 1280 | [Карточка поставщика](https://metall-rs.ru/armatura-gladkaya/armatura-gladkaya-25-mm-a240) · [фото](https://metall-rs.ru/images/product/25/armatura-gladkaya-25-mm-a240-191746512067-1.webp) |
| `a240-stock-metall-dk.jpg` (A07) | 750 × 750 | [Металл-ДК, А240 и А240С](https://metall-dk.ru/articles/chem-otlichaetsya-armatura-a240-ot-a240s/) · [оригинал](https://metall-dk.ru/upload/medialibrary/585/duek18w2bpakw4n59dnhgrhazascnafi.jpg) |
| `normal-parallel-flanges-expo.jpg` | 1280 × 760 | [Карточка поставщика](https://expo-snab.kz/p58327210-balka-30b1-30b2.html) · [фото](https://images.satu.kz/89460171_balka-30b1-30b2.jpg) |
| `wide-flanges-betall.jpg` | 568 × 426 | [Карточка поставщика](https://proflist.moscow/shirokopolochnyj-dvutavr/sh1) · [фото](https://proflist.moscow/wp-content/uploads/1970/01/shirokopolochnyj-dvutavr-sh1_2.jpg) |
| `wide-stock-betall.jpg` | 568 × 426 | [Карточка поставщика](https://proflist.moscow/shirokopolochnyj-dvutavr/sh1) · [фото](https://proflist.moscow/wp-content/uploads/1970/01/shirokopolochnyj-dvutavr-sh1_3.jpg) |
| `monorail-taper-expo.jpg` | 777 × 764 | [Карточка поставщика](https://expo-snab.kz/p58327664-balka-monorelsovaya-24m.html) · [фото](https://images.satu.kz/89465245_balka-monorelsovaya-24m.jpg) |
| `column-stock-sda.jpg` | 1000 × 1000 | [Карточка поставщика](https://atyrau.sda.kz/shaped/ibeam/i-beam-k1-k2) · [фото](https://atyrau.sda.kz/assets/images/catalog/balki-pic.jpg) |

### Профильные и круглые трубы

Категория «Трубы профильные» использует существующий общий складской кадр `trubi-main.jpg`. Категория «Труба круглая» и шесть видов сохраняют свои текущие первые кадры. Обзорные галереи используют несколько фотографий из соответствующих видов.

В категории «Трубы профильные» оставлены три кадра: `trubi-main.jpg`,
`robmetalstal-square-warehouse.webp` и `marketstal-rectangular-bundle.jpg`.
По выбору владельца четвёртый кадр `stroy-partner-square-ends.jpg` убран из
категории и сохранён в подкатегории квадратных труб (теперь вторым, без дубликата).
Последний кадр `mecafluid-rectangular-ends.jpg` также убран из категории;
по дополнительному выбору владельца он убран и из подкатегории прямоугольных
труб как неподходящий кадр на белом фоне. В этой подкатегории оставлены три
фото: основное, `marketstal-rectangular-bundle.jpg` и
`gradstal-rectangular-stack.jpg`.

После переноса и удаления кадров состав галерей проверен вручную на сайте:
в категории и в обеих подкатегориях по три фото. Второй кадр квадратных труб
`robmetalstal-square-warehouse.webp` по выбору владельца убран из этой
подкатегории; в корневой категории он сохранён.
Кадр `stroy-partner-square-ends.jpg` проверен в миниатюре и увеличенном
просмотре на компьютере; у прямоугольных труб последний кадр —
`gradstal-rectangular-stack.jpg`. Автотесты по просьбе владельца не запускались.

| Тип | Файл | Источник | Примечание |
| --- | --- | --- | --- |
| Квадратная профильная | `robmetalstal-square-warehouse.webp` (1000 × 750) | [РобМеталлСталь](https://robmetalstal.ru/truba-profilnaya/truba-profilnaya-100x100h4) · [фото](https://robmetalstal.ru/images/product/270/270_1755241716-2159957.webp) | Квадратная профильная труба 100 × 100, ГОСТ 8639-82. Общий складской ракурс. |
| Квадратная профильная | `stroy-partner-square-ends.jpg` (914 × 690) | [Строй Партнёр](https://stroy-partner.spb.ru/truba-profilnaya-kvadratnaya) · [фото](https://static.tildacdn.com/tild3765-6535-4430-a566-653133306166/__.jpg) | Крупный план полых квадратных сечений. |
| Квадратная профильная | `metamoll-square-detail.jpg` (873 × 472) | [Метамолл](https://metamoll.ru/truba-kvadratnaya) · [фото](https://metamoll.ru/images/category/1753691297.jpg) | Квадратные полые профили по ГОСТ 8639-82, торцы под углом. |
| Прямоугольная профильная | `marketstal-rectangular-bundle.jpg` (2178 × 2178) | [Marketstal](https://marketstal.pl/Profil-stalowy-zamkniety-30x20x1%2C5x6000) · [фото](https://marketstal.pl/userdata/public/gfx/7891/profil-stalowy-30x20-1.jpg) | Прямоугольные стальные замкнутые профили 30 × 20 на складе. EXIF с геолокацией удалён без перекодирования. |
| Прямоугольная профильная | `gradstal-rectangular-stack.jpg` (1200 × 803) | [Град Сталь](https://gradstal.ru/catalog/truby_profilnye/) · [фото](https://gradstal.ru/images/truba-profilnaya-8-large.jpg) | Складской ракурс пачки с явно прямоугольными торцами. |
| Прямоугольная профильная | `mecafluid-rectangular-ends.jpg` (1181 × 1181) | [Mecafluid](https://www.mecafluid.eu/fr/catalog/tube-rectangulaire-acier-soude-electriquement-dimensions-80-x-40-x-4-mm~c4bfe7c4-083b-4472-bb0b-51d039287bd5) · [фото](https://www.mecafluid.eu/assets/8082ede3-946b-49ef-8725-31c086880330/599872-tuacserect-crop.jpg) | Чистый крупный план торцов стальной электросварной прямоугольной трубы 80 × 40. |
| ВГП | `prometey-black-vgp-bundle.webp` (1800 × 1200) | [Прометей](https://prometey-ural.ru/catalog/truby/truby_vgp/truba_32_du_3_2/) · [фото](https://prometey-ural.ru/upload/resize_cache/webp/iblock/c02/suub4y0okygwzj33sk119u8w4hhbufg4.webp) | ВГП Ду32 с тёмной сталью и торцами, складской ракурс. |
| ВГП | `aksvil-black-vgp-ends.jpg` (1252 × 717) | [Аксвил](https://aksvil.by/klientam/materialy-po-prokatu/trubi-stalniye-metallicheskie.html) · [фото](https://aksvil.by/images/_for-materials3/kak-vibrat-truby/vgp-truby.jpg) | Торцы ВГП малого диаметра. Снимок к разделу ВГП по ГОСТ 3262-75. |
| ВГП оцинкованная | `steel-expert-galvanized-vgp-ends.jpg` (1409 × 1817) | [Сталь-Эксперт](https://steel-ex.ru/otsinkovka/truba-otsinkovannaya/truba-vgp-otsinkovannaya-80kh4-0/) · [фото](https://steel-ex.ru/upload/iblock/c5a/c5a8afdbe7c8fb25b2afae2eecfb7930.jpg) | Крупный план оцинкованных ВГП по ГОСТ 3262-75. |
| ВГП оцинкованная | `lorber-galvanized-vgp-threads.jpg` (1200 × 1200) | [J. Lorber](https://www.jlorber.com/catalog/products/Plumbing/Pipe/dept-5U1) · [фото](https://www.jlorber.com/product-image/galvanized-pipe.jpg) | Резьбовые торцы оцинкованных водопроводных труб, категория Plumbing Pipe. |
| Электросварная | `metservis-welded-warehouse.jpg` (1000 × 1000) | [Метсервис](https://metservis63.ru/product/trubi/truba-krug/truba-elektrosvarnaya-pryamoshovnaya-kruglaya-76kh1-5/) · [фото](https://metservis63.ru/upload/iblock/363/x7we2yn8g9u2flz7slehnztt7a7x6nxu.jpg) | Пачки прямошовных электросварных труб на складе. |
| Электросварная | `stalnoy-dom-welded-ends.jpg` (800 × 533) | [Стальной Дом](https://stalnoydom.ru/catalog/truby_elektrosvarnye_kruglye_108x4-5_13187/) · [фото](https://stalnoydom.ru/upload/iblock/05d/trubaes_krneots-002.jpg) | Торцы и длина круглых неоцинкованных электросварных труб по ГОСТ 10704-91. |
| Электросварная | `ural-welded-stock.jpg` (800 × 483) | [Металл-Урал](https://petrozavodsk.metall-ural.ru/store/truby/truby-elektrosvarnye/truba-gost-10705-80/) · [фото](https://petrozavodsk.metall-ural.ru/uploadedFiles/eshopimages/big/truby-elektrosvarnye.JPG) | Чёрные электросварные трубы по ГОСТ 10705-80, складской ракурс сверху. |
| Электросварная оцинкованная | `marketstal-galvanized-welded-stock.jpg` (600 × 400) | [Marketstal](https://marketstal.pl/Rura-stalowa-ocynkowana-48-0x2-0x2-4mb-szew-napyl) · [фото](https://marketstal.pl/userdata/public/gfx/4877/Rura-ocynkowana-48%2C0x2%2C0x2%2C4-napylana-4.jpg) | Пачка круглой оцинкованной стальной трубы с обработанным сварным швом. |
| Электросварная оцинкованная | `hotoks-galvanized-welded-seam.webp` (1000 × 1000) | [Хотокс](https://hotoks-pkf.ru/catalog/truby-elektrosvarnye-otsinkovannye/truba-elektrosvarnaya-57kh3-5-mm-pryamoshovnaya-otsinkovannaya-gost-10704-91/) · [фото](https://hotoks-pkf.ru/upload/iblock/449/pjgv774zyheewi0ijj9acp57xt1nm6zu.webp) | Оцинкованная прямошовная труба по ГОСТ 10704-91. Виден продольный шов. |

### Профнастил и металлическая сетка

Складские и производственные фотографии опубликованы в папке `cover/` каждой категории. Для общего баннера «Профнастил» выбран кадр готовых стальных листов у линии прокатки. На страницах С8, С20 и Н75 фотографии сопоставлены с карточками профиля. С8-1150 имеет полную ширину 1200 мм, С20-1100 — 1150 мм, Н75-750 имеет рабочую ширину 750 мм. В галерее металлической сетки есть отдельные ракурсы ромбической рабицы, сварных рулонов и плоских карт.

Кадр зелёного С8 локально отретуширован с помощью ImageGen. За пределами
области водяного знака сохранены пиксели исходной фотографии.

| Раздел | Файл | Источник |
| --- | --- | --- |
| Профнастил | `profiled-steel-production.webp` | [Henan Tiga, стальной профнастил](https://cus-steel.en.made-in-china.com/product/KNnmpjdFGsVB/China-Australia-Woodland-Grey-Box-Profile-Colourful-Trapezoidal-Roofing-Sheet-for-Fencing.html) · [фото](https://image.made-in-china.com/2f0j00DSukqMrRsToG/Australia-Woodland-Grey-Box-Profile-Colourful-Trapezoidal-Roofing-Sheet-for-Fencing.webp) |
| С8 | `s8-coated-packs.webp` | [МетСтрой, С8-1150](https://metst.ru/tver/production/profnastil/s8-1150/) · [фото до ретуши](https://metst.ru/upload/iblock/06f/proflist_s8_6005.jpg) |
| С8 | `s8-coated-surface.jpg` | [Металлик и Ко, С8 1200 × 2000](https://metallik.ru/catalog/profnastil_c8/profnastil-s-8-kh-1200-kh-2000-ots-0-50-ral-6005-dvustor/) · [фото](https://metallik.ru/upload/uf/70b/37ox5geaa8fpy0d28jyhwzud1rgoc945.jpg) |
| С20 | `s20-galvanized-packs.webp` | [СтальТорг, С20](https://steeltorg.pro/ocinkovannyj-profnastil/profnastil-c21-ocinkovannyj-2000h1050h0-3-mm) · [фото](https://steeltorg.pro/images/product/513/1747986107-IMG-20250523-WA0013.webp) |
| С20 | `s20-coated-sheets.jpg` | [Металлик и Ко, С20 1150 × 2000](https://metallik.ru/catalog/profnastil_s20_stenovoy/profnastil-stenovoy-s-20-kh-1150-kh-2000-ots-0-50-ral-5021/) · [фото](https://metallik.ru/upload/uf/1ee/q8xxbxbjqz3bp0s3f3le83bf59xei0in.jpg) |
| Н75 | `n75-galvanized-packs.jpg` | [Айрон Полимер, Н75](https://ironpolimer.ru/ocinkovannyj-profnastil-n-75/) · [фото](https://ironpolimer.ru/assets/images/gallery/profnastil/ocinkovannyj-profnastil-n-75-1.jpg) |
| Н75 | `n75-galvanized-profile.jpg` | [Айрон Полимер, Н75](https://ironpolimer.ru/ocinkovannyj-profnastil-n-75/) · [фото](https://ironpolimer.ru/assets/images/gallery/profnastil/ocinkovannyj-profnastil-n-75.jpg) |
| Рабица | `rabitsa-warehouse-packs.jpg` | [Security Steel Fence, оцинкованная рабица](https://www.securitysteelfence.com/sale-48678891-playground_galvanized_chain_link_fence_wire_mesh_100_ft_roll_for_sale.html) · [фото](https://www.securitysteelfence.com/photo/pl187538750-playground_galvanized_chain_link_fence_wire_mesh_100_ft_roll_for_sale.jpg) |
| Рабица | `rabitsa-production-rolls.webp` | [Hongli, оцинкованная рабица](https://honglimetals.en.made-in-china.com/product/bZGTuNUSryas/China-Factory-Price-Wire-Mesh-Roll-Diamond-Chain-Link-Fence-Galvanized.html) · [фото](https://image.made-in-china.com/2f0j00oOriRgeUHnGc/Factory-Price-Wire-Mesh-Roll-Diamond-Chain-Link-Fence-Galvanized.webp) |
| Сварная сетка в рулонах | `welded-rolls-warehouse.jpg` | [Сталь ПРО, сварная сетка](https://steel-pro.ru/company/articles/setka_svarnaya_sposoby_proizvodstva_i_obrabotki_materiala/) · [фото](https://steel-pro.ru/upload/iblock/6a6/i73dm27gkb38c4qxk1wmpoih6ri8t7hh.jpg) |
| Сварная сетка в рулонах | `welded-rolls-packed.jpg` | [Enzar Metal, оцинкованная сварная сетка](https://www.weldedwiremeshpanel.com/cn/technology/galvanized-wire-mesh-welded.html) · [фото](https://www.weldedwiremeshpanel.com/img/welded-mesh-plastic-film.jpg) |
| Сварная сетка в картах | `welded-panels-stacks.webp` | [СМ-Сетка, кладочная сетка в картах](https://sm-setka.kz/product/1) · [фото](https://sm-setka.kz/assets/mash_light-MZmTjSta.webp) |
| Сварная сетка в картах | `welded-panels-edges.jpg` | [ProSteel, кладочная сетка ВР-1](https://prosteel.kz/p99710854-setka-kladochnaya.html) · [фото](https://images.satu.kz/183691994_setka-kladochnaya-vr-1.jpg) |

## Остальные категории каталога

«Листовой прокат» показывает складские фотографии горячекатаного, холоднокатаного,
оцинкованного и рифлёного листа из их собственных галерей. «Арматурные изделия»
объединяют ракурсы лягушек и открытых П-образных скоб. Для каждого из этих двух
видов на его странице сохранена отдельная галерея.

Фотографии показывают форму, поверхность, упаковку или применение продукции.
Основные файлы размещены в папке `cover/` соответствующей категории. Часть
предметных кадров используется из `illustration-sources/` и каталога Розмета.

| Раздел | Файл | Размер | Источник |
| --- | --- | --- | --- |
| Штакетник металлический | `grand-line-brown-fence.jpg` | 750 × 500 | [Krona, полукруглый Grand Line RAL 8017](https://krona-msk.ru/shop/katalog/shtaketnik-metallicheskiy-grand-line-slim-polukruglyy-pryamoy-poliester-dvukhstoronniy-0-4-mm-ral-8017/) · [фото](https://krona-msk.ru/upload/iblock/9c6/38c2p0bp9gxwlvo4q1g9ix0eq0ca57oz.jpg) |
| Штакетник металлический | `center-mk-graphite-fence.jpg` | 800 × 600 | [Центр Металлокровли, полукруглый RAL 7024](https://centermk.ru/projects/evroshtaketnik/shtaketnik-polukruglyy-234m-seryy-grafit-dvustoronniy-poliester/) · [фото](https://centermk.ru/upload/iblock/e0c/pefspldocj4g5cmdrjmi4mbbn5vwtoy2.jpg) |
| Штакетник металлический | `pmzabor-rounded-pickets.jpg` | 1000 × 666 | [ПМ Забор, планки RAL 8017](https://pmzabor.ru/shtaketnik-kruglyj-figurnyj-0-45-pe-double-ral-8017) · [фото](https://pmzabor.ru/images/o/shtaketnik-kruglyj-figurnyj-0-45-pe-double-ral-8017_1.jpg) |
| Полоса стальная | `changzeng-hot-rolled-flat-bundles.webp` | 750 × 750 | [Changzeng, пачки горячекатаной полосы](https://changzengsteel.en.made-in-china.com/product/tsLxBQKvZDWX/China-Hot-Rolled-Steel-Flat-Bars-Grade-ASTM-A36-1045-A105.html) · [фото](https://image.made-in-china.com/2f0j00eUjfGnRKHYqo/Hot-Rolled-Steel-Flat-Bars-Grade-ASTM-A36-1045-A105.webp) |
| Полоса стальная | `metals4u-flat-bar-end.jpg` | 1400 × 1400 | [metals4U, торец стальной полосы](https://www.metals4u.co.uk/materials/mild-steel/mild-steel-flat/flat-black/2056-p) · [фото](https://www.metals4u.co.uk/media/catalog/product/2/0/2056.jpg) |
| Полоса стальная | `carbon-flat-bar-yard.webp` | 768 × 768 | [Склад стальной полосы](https://m.made-in-china.com/product/Manufacture-Carbon-Steel-Flat-Bar-Barre-De-Fer-Plat-Flat-Bar-1924284001.html) · [фото](https://image.made-in-china.com/2f0j00WbjizavCCVfK/Manufacture-Carbon-Steel-Flat-Bar-Barre-De-Fer-Plat-Flat-Bar.webp) |
| Проволока | `modulstal-wire-coils.webp` | 1024 × 683 | [Modulstal, склад проволоки](https://modulstal.uz/product/provoloka) · [фото](https://modulstal.uz/media/photos/products/prov1.webp) |
| Проволока | `termolife-binding-wire.jpg` | 600 × 600 | [Термолайф, вязальная проволока ГОСТ 3282-74](https://termolife.pro/catalog/provoloka-vyazalnaya-1-2-mm-gost-3282-74/) · [фото](https://termolife.pro/upload/iblock/9eb/24dw16qfba7z7d2u8lkjh0h9fma7u4zw.jpg) |
| Проволока | `petrovich-binding-hook.jpg` | 1000 × 1000 | [Петрович, автоматический крючок ЗУБР](https://moscow.petrovich.ru/product/1084355/) · [фото](https://cs.p-static.ru/image/50945046/original.jpg) |
| Фиксаторы арматуры | `good-zon-rebar-chair.jpg` | 600 × 600 | [Good-Zon, опора под горизонтальную арматуру](https://good-zon.com.ua/ua/fiksator-zashitnogo-sloya) · [фото](https://good-zon.com.ua/image/cache/catalog/opalubka/867-600x600.jpg) |
| Фиксаторы арматуры | `sanpol-star-spacers.jpg` | 1024 × 768 | [Sanpol, звёздочки на вертикальной сетке](https://sanpol.ua/ua/catalogue/fiksatory-armatury/fiksator-zvezdochka/) · [фото](https://sanpol.ua/uploads/Catalogue/%D0%B7%D0%B2%D0%B5%D0%B7%D0%B4%D0%B4%D0%B4_1865_1494853226.JPG) |
| Фиксаторы арматуры | `stroybat-spacer-chair.jpg` | 1118 × 1118 | [Стройбат, фиксатор «Стульчик»](https://tssp.kz/product/fiksator-armatury-stulchik50-50-sht-strojbat-78649) · [фото](https://tssp.kz/_ipx/f_webp%26s_1600x1600/https%3A/storage.tssp.kz/uploads/images/product-images/78649_1-23c65916-7053-4b88-afd5-589e4a6c7e0d.jpg) |
| Заглушки для труб | `sbs-plastic-inserts.jpg` | 1600 × 1200 | [SBS, пластиковые заглушки квадратных и прямоугольных труб](https://www.sbs24.de/haushalt/stopfen/482/sbs-lamellenstopfen-fuer-vierkantrohre) · [фото](https://www.sbs24.de/media/image/b6/4c/94/sbs-lamellenstopfen-kunststoff-vierkantrohr-rechteck-quadrat-2668.jpg) |
| Заглушки для труб | `baalcke-rectangular-inserts.jpg` | 998 × 998 | [Baalcke, прямоугольные заглушки](https://www.design-shop-baalcke.de/Rechteckrohr-Lamellenstopfen-Kunststoff-Schwarz/LS-RE-3010) · [фото](https://design-baalcke.cstatic.com/media/1b/87/7e/1779962375/Lamellenstopfen%20Rechteckrohr.jpg?ts=1779962375) |
| Заглушки для труб | `nordsteel-elliptical-caps.jpg` | 1024 × 683 | [НордСталь, стальные эллиптические заглушки](https://nordstmgk.ru/tpost/z25pzn7cj1-zaglushki-stalnie-ellipticheskie) · [фото](https://static.tildacdn.com/tild6166-6139-4239-a165-346334393665/_.jpg) |
| Заглушки для труб | `metallservice-steel-cap.jpg` | 1200 × 800 | [Металлсервис, эллиптическая заглушка ГОСТ 17379-2001](https://www.vseinstrumenti.ru/product/ellipticheskaya-zaglushka-metallservis-stal-dn-57x3-du-50-pod-privarku-gost-17379-2001-1212823-9503426/) · [фото](https://cdn.vseinstrumenti.ru/images/goods/santehnicheskoe-oborudovanie/inzhenernaya-santehnika/9503426/1200x800/ellipticheskaya-zaglushka-metallservis-stal-dn-57x3-du-50-pod-privarku-gost-17379-2001-1212823_475709.jpg) |
| Лягушки арматурные | `ks-store-frog.jpg` | 560 × 504 | [Каркас Сервис, лягушка из рифлёной А500С](https://www.vseinstrumenti.ru/product/armaturnaya-lyagushka-ks-store-a500s-250x150x250x150x250-mm-diametr-8-mm-upakovka-50-shtuk-lag2515258m-12631709/) · [фото](https://cdn.vseinstrumenti.ru/images/goods/stroitelnye-materialy/metalloprokat/12631709/560x504/157759853.jpg) |
| Лягушки арматурные | `frog-on-grid.jpg` | 1500 × 1000 | [МногоСетки, лягушки на арматурной сетке](https://mnogosetki.ru/info/articles/statii-armaturnye-setki/primenenie-armaturnoy-lyagushki/) · [фото](https://mnogosetki.ru/upload/iblock/f27/f27a28db9621169c52b832a5171fe975.jpeg) |
| Лягушки арматурные | `ks-store-frog-stock.jpg` | 1280 × 960 | [Каркас Сервис, пачка арматурных лягушек](https://ks-store.ru/catalog/lyagushka_iz_riflenoy_armatury/1060/?offer=1076) · [фото](https://ks-store.ru/upload/iblock/753/ywql32aqds34sfkrsynbahtq2m7bacxs.jpeg) |
| Лягушки арматурные | `frog-installation-detail.jpg` | 700 × 525 | [МногоСетки, крупный план установленной лягушки](https://mnogosetki.ru/info/articles/statii-armaturnye-setki/primenenie-armaturnoy-lyagushki/) · [фото](https://mnogosetki.ru/upload/iblock/af8/af8d6ffac0f2be03e13350dffdd1e826.jpg) |
| Пэшки арматурные | `peshka-warehouse.jpg` | 810 × 1080 | [Каркас Сервис, пачки П-образных скоб из А500С](https://ks-store.ru/catalog/skoba_armaturnaya_iz_riflenoy_armatury/2678/) · [фото](https://ks-store.ru/upload/iblock/11a/rrj5jhyvmj43f2rv7zy3acvdq8t80y1k.jpg) |
| Пэшки арматурные | `garantstroy-rebar-stacks.jpg` | 1024 × 576 | [ГарантСтрой, гнутые арматурные изделия на производстве](https://gst-metall.ru/product/proizvodstvo-kompanii-garantstroy/) · [фото](https://gst-metall.ru/upload/medialibrary/b46/3him9c8o32y7e3m0mi2wwcyxodfusmtl.jpeg) |
| Пэшки арматурные | `garantstroy-bent-bars.jpg` | 461 × 1024 | [ГарантСтрой, крупный план изгиба скоб](https://gst-metall.ru/product/armaturnye-izdeliya/gnutye-elementy-iz-armatury/) · [фото](https://gst-metall.ru/upload/medialibrary/669/mp2aqs0eyxu8hhc9elu0hrjbnuy71i1f.jpeg) |
| Стройматериалы | `nova-foundation-installation.jpg` | 1280 × 720 | [Нова, применение профилированной мембраны](https://www.ccnova.ru/our-work/naro-fominsk-3.html) · [фото](https://www.ccnova.ru/upload/iblock/814/qtiuea8s0qw375ywuta2ssj8ss07idlr/Stroitelstvo_doma_Naro_Fominsk_foto_1.jpg) |
| Стройматериалы | `penoplex-fundament-50.jpg` | 800 × 670 | [ПЕНОПЛЭКС Фундамент 50 мм](https://shop.penoplex.ru/spb/catalog/teploizolyatsiya/penopleks-fundament-50kh585kh1185mm/) · [фото](https://shop.penoplex.ru/upload/iblock/5f1/b23keu4oy9vntu2ejnh6egs25d223phk.jpg) |
| Стройматериалы | `tn-planter-standard.jpg` | 560 × 504 | [Planter Standard 2×20 м](https://www.vseinstrumenti.ru/product/profilirovannaya-membrana-tehnonikol-planter-standard-2x20-m-tn362078-2808710/) · [фото](https://cdn.vseinstrumenti.ru/images/goods/stroitelnye-materialy/izolyatsionnye-materialy/2808710/560x504/56692886.jpg) |
| Стройматериалы | `geoarm-dornit-300.png` | 960 × 640 | [Дорнит 300, представитель марки материала](https://geoarm.ru/products/geotekstil-dornit/geotekstil-dornit-300) · [фото](https://geoarm.ru/storage/images/uploads/01KD5FGKCNXBKQKP7PYY58MG6X.png) |
| Стройматериалы | `tn-planterband.png` | 1800 × 1400 | [Planterband 10 м × 10 см](https://www.progress-polymer.ru/profilirovannaya-membrana/planterband-10m-h-10sm) · [фото](https://www.progress-polymer.ru/uploads/product/4900/4973/16116901428214_467783_planterband.png) |
| Винтовые сваи | `screw-pile-stacks.webp` | 750 × 1000 | [Склад производителя винтовых свай](https://vintovye-svai-s-ustanovkoy.ru/) · [фото](https://vintovye-svai-s-ustanovkoy.ru/userfiles/images/proizvodstvo-im1.webp) |
| Винтовые сваи | `screw-pile-yard.jpg` | 1920 × 1080 | [Металл-Архив, винтовые сваи на площадке](https://metal-archive.ru/novosti/7347-vintovye-svai-osobennosti-i-preimuschestva.html) · [фото](https://metal-archive.ru/uploads/posts/2020-07/1595079733_6024058_1920.jpg) |
| Петли для ворот | `sibrteh-teardrop-hinge.jpg` | 1200 × 800 | [Сибртех, каплевидная петля в разборе](https://www.vseinstrumenti.ru/product/kaplevidnaya-petlya-sibrteh-18-h-120-mm-s-podshipnikom-92030-970541/) · [фото](https://cdn.vseinstrumenti.ru/images/goods/krepezh/metizy/970541/1200x800/101584394.jpg) |
| Петли для ворот | `allure-weld-on-hinge.jpg` | 1000 × 1000 | [Аллюр, сварная каплевидная петля с подшипником](https://www.vseinstrumenti.ru/product/sharnir-petlya-pod-svarku-allyur-20x140-s-podshipnikom-kaplevidnaya-16969-17830475/) · [фото](https://cdn.vseinstrumenti.ru/images/goods/krepezh/metizy/17830475/1000x1000/188547689.jpg) |
| Отводы и фитинги | `rich-black-steel-elbows.webp` | 646 × 505 | [Rich Pipe Fitting, стальные приварные отводы](https://richpipefitting.en.made-in-china.com/product/GwktazPCgeVf/China-ASTM-Carbon-Steel-ANSI-DIN-90-Degree-Lr-Sr-Carbon-Steel-Pipe-Fitting-Butt-Weld-Elbows.html) · [фото](https://image.made-in-china.com/2f0j00ongWyhGBfVki/ASTM-Carbon-Steel-ANSI-DIN-90-Degree-Lr-Sr-Carbon-Steel-Pipe-Fitting-Butt-Weld-Elbows.webp) |

| Раздел | Существующий файл | Источник |
| --- | --- | --- |
| Фиксаторы арматуры | `ff1bc2efd0aa43170843.jpg` | [Розмет, фиксатор «Кубик»](https://rozmet.ru/production/stulchik/fiksator_opora_kubik_30_mm/) |
| Винтовые сваи | `f99763bb527bf6acf541.jpg` | [Розмет, оголовок внутренний](https://rozmet.ru/production/vintovye_svai/ogolovok_vnutrenniy_89mm_na_svayu_108mm/) |
| Петли для ворот | `62db5460b6e46e150b36.jpg` | [Розмет, гаражная петля с шаром](https://rozmet.ru/production/petli_dlya_vorot/petlya_garazhnaya_s_sharom_d_14_90mm_4_sht_rossiya_sibrtekh/) |
| Отводы и фитинги | `0d5eb4e1c59aad29975c.jpg` | [Розмет, оцинкованный бесшовный отвод](https://rozmet.ru/production/otvodi/otvod_besshovnyy_otsinkovannyy_krutoizognutyy_108_ots/) |
| Отводы и фитинги | `36a6e167a31fe76e85e7.jpg` | [Розмет, сгон Ду-20](https://rozmet.ru/production/otvodi/sgon_du_20/) |
| Отводы и фитинги | `65338ceb19822e4f03da.jpg` | [Розмет, стальной переход](https://rozmet.ru/production/otvodi/perekhod_stalnoy_76kh3_5_57kh3/) |

## Проверка

`tests/e2e/cover-gallery.spec.ts` проверяет четыре варианта подключения,
закрытие/фокус/клавиатуру, масштаб 1:1, перемещение, узкий экран, landscape
и отказ загрузки оригинала. `tests/unit/catalog-cover-gallery.test.ts` защищает
порядок кадров, цикл и условное появление навигации.
`cover-viewer.png` защищает оформление просмотра в четырёх проектах браузера.
Сценарии для многокадровых галерей проверяют циклическое переключение кадров,
клавиатуру и возврат фокуса после закрытия. Сценарий для оцинкованного листа
также проверяет сохранение выбранной фотографии на странице.
