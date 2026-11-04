# Исправление dev-зависимостей — 04.11.2026

После аудита `31cf129` оставались 16 moderate-предупреждений. Все они восходили
к одному advisory minimatch: [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249).
В дереве были 3.1.5 (ESLint, React/import/a11y plugins) и 10.2.6 (TypeScript parser).
Исправленный upstream — 11.0.1+, установлен и закреплён **11.0.4**.

## Решение

Обычное обновление пакетов не устраняет все цепочки: актуальные плагины продолжают
требовать callable API v3, а v11 предоставляет named exports и удаляет `makeRe`.
Глобальный override без адаптации может показать ноль audit findings, но сломать
редко вызываемые правила с glob-параметрами. Downgrade ESLint и отключение правил
не использовались.

- `minimatch@>=4 <11.0.1` переопределён на настоящий upstream 11.0.4.
- Для старого API добавлен локальный **dev-only** пакет
  `tools/minimatch-legacy`, доступный как корневая dev-зависимость `minimatch`.
  Override `minimatch@<4: $minimatch` направляет потребителей в этот пакет.
- Адаптер сохраняет вызываемый export, `Minimatch.match`, partial/defaults и helpers,
  делегируя сопоставление исправленному движку через alias `minimatch-modern`.
  Для `import/no-internal-modules` сохранён необходимый контракт `makeRe().test(path)`
  без генерации RegExp. Это не универсальный полифилл старых внутренних API.
- Старые движки удалены. Исключений audit, фальшивых версий upstream, postinstall
  патчей и глобальных module hooks нет. Runtime-пакеты приложения не менялись.
- CI теперь выполняет **полный `npm audit`**, включая инструменты разработки.

Описание границ и условий удаления адаптера:
[README](../tools/minimatch-legacy/README.md).

## Проверки

На Node **22.23.4**, npm **11.12.1**:

| Проверка | Результат |
| --- | --- |
| Чистый `npm ci` | Успех; отдельно проверена установка npm 10 на Node 22 для совместимости с CI |
| `npm ls minimatch minimatch-modern --all` | Корректное дерево, без invalid/missing dependencies; старых движков нет |
| Полный `npm audit --json` | **0** info/low/moderate/high/critical |
| ESLint | 225 файлов, 0 ошибок, 0 предупреждений; исходные файлы остаются в области проверки |
| `npm run test:unit` | **172 passed**, 0 failed, 3 ранее документированных skip; всего 175 |
| TypeScript | Пройден |
| `npm run test:build` | Production webpack-сборка Next.js 16.4.5, 687 страниц |
| `npm run test:e2e` | **86 passed**, 0 failed, 2 mobile-only skip в desktop-проектах |
| `npm run test:visual` | **48 passed**, 0 failed; все 60 PNG совпали без обновления эталонов |

Новые 7 проверок выполняют реальные glob-ветки React, доступности и импортов
с разрешёнными и запрещёнными примерами. Они также проверяют разрешение зависимости,
dotfiles/negation/partial matching, callable helpers и сохранение ESLint ignores.
Эталоны изображений и код магазина не обновлялись.

Источники API: [upstream changelog](https://github.com/isaacs/minimatch/blob/main/changelog.md),
[обсуждение обновления ESLint](https://github.com/eslint/eslint/issues/21463).
