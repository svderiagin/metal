<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read
the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Работа с metal-frontend

- Перед изменениями: `git status --short`. Сохраняйте чужие незакоммиченные правки.
- Выбирайте навык по задаче; читайте только нужные разделы его ссылок:
  - [metal-frontend-catalog](.agents/skills/metal-frontend-catalog/SKILL.md): данные, маршруты, поиск, товарные таблицы, импорт.
  - [metal-frontend-ui](.agents/skills/metal-frontend-ui/SKILL.md): вёрстка, темы, навигация, изображения, информационные страницы.
  - [metal-frontend-orders](.agents/skills/metal-frontend-orders/SKILL.md): корзина, количества, пересчёт цен, формы, checkout и API.
  - [metal-frontend-quality](.agents/skills/metal-frontend-quality/SKILL.md): аудит, декомпозиция, тестовое покрытие и регрессия по скриншотам.
- Для пересекающейся задачи подключайте второй навык только в затронутой области.
- Проверки и генерация: [docs/development-workflow.md](docs/development-workflow.md). Объём проверки зависит от риска изменения.
- `README.md` содержит большой исторический разбор. Текущие детали подтверждайте кодом; не читайте README целиком по умолчанию.
- Аудит от 30.10.2026: [docs/development-audit-2026-10-30.md](docs/development-audit-2026-10-30.md). Это снимок состояния, а не актуальный список ошибок для каждой следующей задачи.
