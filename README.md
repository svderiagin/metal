# Разбор архитектуры METAL STORE

Это первая часть подробного разбора проекта: разделы 1–10. Она охватывает общую архитектуру, каталоги, маршрутизацию, React, Server/Client Components, корзину, данные каталога, checkout и все HTTP endpoints.

Проект проверен командами:

- `npm run lint` — успешно;
- `npm run build` — успешно;
- Next.js создаёт 157 статических страниц;
- 16 страниц категорий и 124 страницы товаров создаются через SSG;
- пять API endpoints остаются динамическими серверными маршрутами.

## 1. Назначение проекта

### Что это за приложение

`metal-frontend` — русскоязычная демонстрационная витрина магазина металлопроката, написанная как единое приложение на Next.js 16.

Название `frontend` немного обманчиво: здесь есть не только пользовательский интерфейс, но и небольшой серверный слой:

- страницы каталога;
- React-компоненты;
- браузерная корзина;
- оформление заказа;
- HTTP endpoints для заказов, платежей и форм;
- серверная валидация;
- интерфейсы репозитория, платёжного провайдера и уведомлений.

В терминах Spring это примерно маленькое приложение, в котором web UI и REST-контроллеры собраны в одном deployable-модуле. Но аналогия неточная: React-компоненты могут исполняться и на сервере, и в браузере, а Next.js сам управляет этой границей.

### Пользовательские сценарии

Реализованы:

1. Открытие главной страницы.
2. Просмотр каталога.
3. Просмотр категорий и подкатегорий.
4. Фильтрация и сортировка товаров.
5. Открытие страницы отдельного товара.
6. Добавление товара в корзину.
7. Изменение количества и удаление товара.
8. Сохранение корзины между перезагрузками.
9. Заполнение checkout-формы.
10. Создание заказа с оплатой банковской картой или по счёту.
11. Отправка контактной формы.
12. Отправка запроса на коммерческое предложение.

### Что реально работает

- каталог из 16 категорий;
- 62 подкатегории;
- 124 товара;
- статическая генерация страниц категорий и товаров;
- клиентская фильтрация;
- корзина в `localStorage`;
- клиентская и серверная валидация;
- создание заказа в development-режиме;
- хранение заказа в памяти процесса;
- сценарий заказа по счёту;
- защита серверной суммы от подмены клиентом;
- honeypot-поля в формах.

### Что является заглушкой

Не готово к production:

- заказы хранятся только в `Map` внутри Node.js-процесса;
- после перезапуска сервера заказы исчезают;
- production-репозиторий намеренно бросает ошибку;
- development-уведомления ничего не отправляют;
- production-уведомления намеренно не настроены;
- платёжный провайдер отсутствует;
- создание hosted payment session не работает;
- проверка webhook-подписи не реализована;
- идемпотентность webhook хранится только в памяти;
- реальные изображения товаров отсутствуют.

Объекты товаров содержат пути вроде `/images/products/armatura-a500s.svg`, но таких файлов в `public/` нет. Сейчас `ProductCard` и `ProductGallery` рисуют CSS-заглушки, поэтому интерфейс не пытается загружать отсутствующие изображения.

## 2. Общая архитектура

### Реальная архитектурная схема

```text
Browser
│
├── HTML и React UI, созданные Next.js
│   ├── статические страницы
│   │   ├── /
│   │   ├── /catalog
│   │   ├── /catalog/[categorySlug]
│   │   └── /catalog/[categorySlug]/[productSlug]
│   ├── Client Components
│   │   ├── фильтры каталога
│   │   ├── мобильное меню
│   │   ├── формы
│   │   ├── checkout
│   │   └── корзина
│   ├── CartContext
│   │   ├── React state
│   │   └── localStorage
│   └── fetch("/api/...")
│
└── Next.js server
    ├── Server Components и статическая генерация
    │   └── lib/catalog.ts
    │       └── data/*.ts
    └── Route Handlers
        ├── POST /api/orders
        │   ├── parseCreateOrderInput
        │   ├── createTrustedOrder
        │   ├── OrderRepository
        │   └── NotificationService
        ├── POST /api/payments/create
        │   ├── OrderRepository
        │   └── PaymentProvider (не настроен)
        ├── POST /api/payments/webhook
        │   ├── PaymentProvider.verifyWebhook (не настроен)
        │   └── OrderRepository
        ├── POST /api/contact
        │   ├── parseContactRequest
        │   └── NotificationService
        └── POST /api/quote
            ├── parseQuoteRequest
            └── NotificationService
```

### Почему это один проект

Next.js поддерживает паттерн Backend for Frontend: один проект может генерировать HTML, выполнять React Server Components, поставлять JavaScript браузеру, принимать HTTP-запросы через Route Handlers и обращаться к БД или внешним провайдерам.

Поэтому отдельное Spring Boot-приложение технически не обязательно. Это не означает, что Next.js заменяет Spring во всех задачах. Здесь серверная часть мала: нет полноценной БД, аутентификации, транзакций, сложной доменной модели и фоновых процессов.

### Где выполняется код

Клиентский код отмечен `"use client"`. Он использует события, React state, effects, `localStorage`, `sessionStorage`, `window`, `fetch` и клиентский router.

На сервере выполняются:

- Route Handlers из `app/api/`;
- `lib/server/*`;
- первоначальное выполнение Server Components;
- статическая генерация страниц;
- генерация metadata;
- серверный пересчёт заказа.

### Граница доверия

```text
Недоверенный browser JSON
          ↓
app/api/.../route.ts
          ↓
server validation
          ↓
доверенная серверная логика
```

Нельзя доверять `localStorage`, состоянию React, полям формы, рассчитанной браузером сумме, `productId`, количеству и факту redirect после оплаты. Пользователь полностью контролирует браузер, поэтому клиентская валидация нужна для удобства, а серверная — для безопасности.

## 3. Структура каталогов

### `app/`

Маршруты Next.js App Router:

- `app/layout.tsx` — общий корневой layout;
- `app/page.tsx` — главная страница `/`;
- `app/catalog/page.tsx` — `/catalog`;
- `app/catalog/[categorySlug]/page.tsx` — категория;
- `app/catalog/[categorySlug]/[productSlug]/page.tsx` — товар;
- `app/cart/page.tsx` — корзина;
- `app/checkout/page.tsx` — checkout;
- `app/api/**/route.ts` — HTTP endpoints;
- `app/loading.tsx` — общий loading UI;
- `app/not-found.tsx` — страница 404;
- `app/globals.css` — глобальные стили и импорт Tailwind;
- `app/favicon.ico` — favicon.

Папки задают URL-структуру соглашениями об именовании. Это приблизительно похоже на package с контроллерами в Spring, но маршруты определяются файловой системой.

### `components/`

Повторно используемые React-компоненты:

- `components/layout` — header, footer, навигация;
- `components/home` — секции главной страницы;
- `components/catalog` — карточки, сетки, фильтры;
- `components/cart` — UI корзины;
- `components/checkout` — оформление заказа;
- `components/forms` — контактная форма и запрос расчёта;
- `components/ui` — базовые `Button`, `Input`, `Select`, `Textarea`.

React-компонент обычно является функцией, а не объектом с длительным жизненным циклом.

### `context/`

`context/CartContext.tsx` предоставляет общее состояние корзины всему React-поддереву:

```text
CartProvider
├── Header
│   └── CartButton
├── pages
│   ├── AddToCartButton
│   ├── CartPageContent
│   └── CheckoutPageContent
└── Footer
```

Это не Spring DI container. Context передаёт конкретное значение вниз по React-дереву.

### `hooks/`

`hooks/useCart.ts` — custom hook, который инкапсулирует получение `CartContext` и проверяет наличие Provider.

### `data/`

- `categories.ts` — 16 категорий;
- `subcategories.ts` — 62 подкатегории;
- `services.ts` — 4 услуги;
- `products/*.ts` — 124 товара;
- `products/index.ts` — объединение товарных массивов.

Это не база данных. Данные входят прямо в исходный код и build приложения.

### `lib/`

- `lib/catalog.ts` — функции поиска по каталогу;
- `lib/currency.ts` — форматирование рублей;
- `lib/constants.ts` — navigation и storage keys;
- `lib/validation.ts` — клиентская валидация;
- `lib/server/validation.ts` — доверенная серверная валидация;
- `lib/server/orders.ts` — создание заказов и repository;
- `lib/server/payments.ts` — платёжный интерфейс;
- `lib/server/notifications.ts` — интерфейс уведомлений.

По смыслу это ближе всего к Java packages `service`, `repository`, `validation` и `integration`.

### `types/`

TypeScript-типы:

- `cart.ts`;
- `category.ts`;
- `forms.ts`;
- `order.ts`;
- `product.ts`;
- `service.ts`.

Они описывают форму данных во время проверки TypeScript. Во время исполнения интерфейсы исчезают.

### `public/`

Статические файлы доступны от корня:

```text
public/file.svg → /file.svg
```

Сейчас здесь только стандартные SVG шаблона Next.js. Каталогов `public/images/categories` и `public/images/products` нет.

Аналогия — `src/main/resources/static` в Spring Boot.

### `docs/`

`docs/architecture.md` описывает архитектурные решения, правила изменения каталога, границы доверия, ограничения in-memory реализаций и production-требования.

## 4. Как Next.js строит маршруты

В App Router папки внутри `app` становятся URL-сегментами. URL появляется при наличии специального файла `page.tsx` или `route.ts`.

### `page.tsx`

```ts
export default function CatalogPage() {
  return <PageContainer>...</PageContainer>;
}
```

```text
app/catalog/page.tsx → /catalog
```

Это не HTTP controller в обычном смысле: результатом является UI, который Next.js преобразует в HTML и React payload.

### `layout.tsx`

`app/layout.tsx` оборачивает все страницы:

```tsx
<CartProvider>
  <Header/>
  <main>{children}</main>
  <Footer/>
</CartProvider>
```

`children` — открытая страница. Это немного похоже на layout в Thymeleaf, но layout является React-компонентом.

### Динамические сегменты

```text
app/catalog/[categorySlug]/page.tsx
```

URL `/catalog/armatura` даёт:

```ts
params = Promise.resolve({
  categorySlug: "armatura"
});
```

В Next.js 16 `params` является `Promise`, поэтому код выполняет:

```ts
const {categorySlug} = await params;
```

Для URL `/catalog/armatura/armatura-a500s-10` параметры содержат `categorySlug` и `productSlug`.

### Подкатегории

Отдельных страниц подкатегорий нет. Подкатегория передаётся query parameter:

```text
/catalog/armatura?subcategory=armatura-a500s
```

`CatalogResults` получает её через `useSearchParams()`.

### `generateStaticParams`

Категории и товары перечисляются через `generateStaticParams`, поэтому во время production build Next.js заранее создаёт HTML для 16 категорий и 124 товаров.

### `route.ts`

```ts
export async function POST(request: Request) {
  // ...
}
```

Это близко к Spring `@PostMapping`, но Route Handler использует стандартные Web API `Request` и `Response`, а не аннотации Spring MVC.

| Файл | URL | Что происходит | Где выполняется |
|---|---|---|---|
| `app/layout.tsx` | все UI-маршруты | Provider, header, footer | Server + client boundaries |
| `app/page.tsx` | `/` | Главная страница | Статически |
| `app/catalog/page.tsx` | `/catalog` | Общий каталог | Статически |
| `app/catalog/[categorySlug]/page.tsx` | `/catalog/armatura` | Категория и товары | SSG + browser filters |
| `app/catalog/[categorySlug]/[productSlug]/page.tsx` | `/catalog/armatura/armatura-a500s-10` | Страница товара | SSG |
| `app/cart/page.tsx` | `/cart` | Клиентская корзина | Static shell + browser |
| `app/checkout/page.tsx` | `/checkout` | Checkout | Static shell + browser |
| `app/order/success/page.tsx` | `/order/success` | Подтверждение | Static shell + browser |
| `app/api/orders/route.ts` | `POST /api/orders` | Создание заказа | Server |
| `app/api/payments/create/route.ts` | `POST /api/payments/create` | Payment session | Server |
| `app/api/payments/webhook/route.ts` | `POST /api/payments/webhook` | Webhook | Server |
| `app/api/contact/route.ts` | `POST /api/contact` | Контактная форма | Server |
| `app/api/quote/route.ts` | `POST /api/quote` | Запрос расчёта | Server |

## 5. React и компоненты

React-компонент — функция, которая по входным данным возвращает описание интерфейса:

```tsx
export function ProductGrid({products}: {products: Product[]}) {
  return (
    <div>
      {products.map(product =>
        <ProductCard key={product.id} product={product}/>
      )}
    </div>
  );
}
```

Это похоже на чистый Java-метод `View render(List<Product> products)`, но React возвращает не HTML-строку, а декларативное описание UI.

### JSX

```tsx
<h1 className="text-3xl">{product.name}</h1>
```

От HTML JSX отличается тем, что использует `className`, допускает JavaScript-выражения в `{}`, компоненты с большой буквы и функции-обработчики вроде `onClick={add}`.

### Props

Props — входные параметры:

```tsx
<ProductCard product={product}/>
```

```ts
function ProductCard({product}: {product: Product})
```

Это ближе всего к параметрам Java-метода.

### `children`

```tsx
<PageContainer>
  <h1>Каталог</h1>
</PageContainer>
```

`PageContainer` получает вложенный `<h1>` через `children`.

### Дерево страницы товара

```text
ProductPage
└── PageContainer
    ├── Breadcrumbs
    ├── ProductGallery
    ├── AddToCartButton
    │   ├── QuantitySelector
    │   │   └── Input
    │   └── Button
    ├── ProductSpecifications
    └── ProductGrid
        └── ProductCard[]
            └── AddToCartButton
```

Client Component перерисовывается при изменении state, props или используемого Context.

| Компонент | Вход | Локальное состояние | Действия |
|---|---|---|---|
| `ProductGrid` | `Product[]` | Нет | `map` товаров |
| `ProductCard` | `product` | Нет | Ищет category/subcategory |
| `CatalogResults` | товары, подкатегории | Фильтры, sort, limit | `filter`, `sort`, reset |
| `AddToCartButton` | `productId`, flags | quantity, added | `addItem` |
| `CartPageContent` | Context | Нет | Выбирает loading/empty/content |
| `CartItemRow` | `CartLine` | Нет | update/remove |
| `CheckoutForm` | Context | form, error, submitting | POST order/payment |
| `ContactForm` | Нет | sent, error, submitting | POST contact |
| `MobileNavigation` | Нет | `open` | Открытие/закрытие меню |

## 6. Server Components и Client Components

Компонент в `app` по умолчанию является Server Component — компонентом, выполняемым на сервере или во время build.

Примеры:

- `app/page.tsx`;
- `app/catalog/page.tsx`;
- `app/catalog/[categorySlug]/page.tsx`;
- `components/catalog/ProductCard.tsx`;
- `components/layout/Footer.tsx`.

Директива `"use client"` создаёт клиентскую границу. Такой компонент может использовать `useState`, `useEffect`, event handlers, DOM API, `window`, `localStorage` и `sessionStorage`.

`CartContext` обязан быть клиентским, потому что использует:

```ts
useState(...)
useEffect(...)
localStorage.getItem(...)
window.setTimeout(...)
```

Серверный компонент может передать клиентскому сериализуемые props:

```tsx
<CatalogResults
  products={products}
  subcategories={subcategories}
/>
```

Нельзя передать через эту границу соединение с БД, file handle, server secret или произвольный сложный экземпляр.

| Файл | Тип | Причина |
|---|---|---|
| `app/page.tsx` | Server | Читает статический каталог |
| `app/catalog/[categorySlug]/page.tsx` | Server | Params, metadata, static generation |
| `app/catalog/[categorySlug]/[productSlug]/page.tsx` | Server | Статическая товарная страница |
| `components/catalog/CatalogResults.tsx` | Client | Интерактивные фильтры |
| `context/CartContext.tsx` | Client | Browser storage и state |
| `components/cart/AddToCartButton.tsx` | Client | Click handler и state |
| `components/checkout/CheckoutForm.tsx` | Client | Форма, fetch, navigation |
| `app/api/orders/route.ts` | Server Route Handler | Trusted validation/repository |
| `lib/server/orders.ts` | Server-only по использованию | `node:crypto`, repository |

В `lib/server/*` нет `import "server-only"`. Файлы фактически импортируются только Route Handlers, но дополнительной compile-time защиты от случайного клиентского импорта нет.

## 7. Состояние приложения и корзина

`CartContextValue` определяет:

- `items`;
- `lines`;
- `hydrated`;
- `totalQuantity`;
- `totalAmount`;
- `addItem`;
- `updateQuantity`;
- `removeItem`;
- `clearCart`.

`app/layout.tsx` помещает весь интерфейс внутрь `CartProvider`.

React 19 позволяет писать:

```tsx
<CartContext value={value}>
```

В старых версиях React обычно использовалось `<CartContext.Provider value={value}>`.

### Почему Context — не Spring ApplicationContext

Context не сканирует компоненты, не создаёт сервисы, не управляет singleton/request/session scopes и не выполняет autowiring. Он передаёт конкретное значение вниз по React-дереву, а его изменение вызывает render потребителей.

### Состояние

```ts
const [items, setItems] = useState<CartItem[]>([]);
```

`items` хранит только:

```ts
{
  productId: string;
  quantity: number;
}
```

Название и цена восстанавливаются из каталога.

### Восстановление из `localStorage`

Первый `useEffect`:

1. читает `metal-store-cart-v1`;
2. выполняет `JSON.parse`;
3. передаёт данные в `normalize`;
4. устанавливает `items`;
5. выставляет `hydrated = true`.

`normalize` удаляет неизвестные товары, некорректные количества и ограничивает quantity значением 999.

Пока storage не прочитан, страницы корзины и checkout показывают skeleton, чтобы пользователь не увидел кратковременное ложное состояние «корзина пуста».

### Сохранение

Второй `useEffect` сохраняет `items` после каждого изменения:

```ts
localStorage.setItem(
  CART_STORAGE_KEY,
  JSON.stringify(items)
);
```

### Операции

- `addItem` ищет товар через `find`, обновляет массив через `map` или добавляет элемент через spread;
- `updateQuantity` проверяет число, округляет вниз и ограничивает 999;
- `removeItem` использует `filter`;
- `clearCart` устанавливает пустой массив.

`lines` объединяет `CartItem` с данными товара и категории. Неизвестные ID игнорируются.

```ts
totalQuantity =
  items.reduce((sum, item) => sum + item.quantity, 0);

totalAmount =
  lines.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0
  );
```

### Поток добавления

```text
Click «Добавить в корзину»
  ↓
AddToCartButton.add()
  ↓
useCart().addItem(productId, q)
  ↓
CartProvider.setItems(previous => newItems)
  ↓
React планирует новый render
  ↓
useMemo пересчитывает lines и totals
  ↓
CartButton и страницы получают новые значения
  ↓
useEffect замечает изменение items
  ↓
JSON.stringify(items)
  ↓
localStorage.setItem(...)
```

## 8. Данные каталога и TypeScript-типы

```text
data/categories.ts       16 категорий
data/subcategories.ts    62 подкатегории
data/products/*.ts       124 товара
data/products/index.ts   единый массив products
data/services.ts         4 услуги
```

Связи построены через `categoryId` и `subcategoryId`, как foreign keys, но база данных их не контролирует.

`id` используется для внутренних связей и корзины. `slug` используется в URL:

```text
/catalog/armatura/armatura-a500s-10
```

`lib/catalog.ts` предоставляет:

```ts
getCategoryBySlug(slug)
getCategoryById(id)
getProductBySlug(slug)
getProductById(id)
getProductsByCategoryId(categoryId)
```

Используются `find` и `filter`. Отдельного repository для каталога нет, поскольку источник — статические массивы.

### TypeScript interfaces

```ts
export interface Product {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  inStock: boolean;
}
```

Интерфейс похож на Java DTO или record, но:

1. является compile-time контрактом;
2. исчезает после компиляции;
3. не создаёт constructor;
4. не выполняет runtime validation;
5. TypeScript использует структурную типизацию.

Поэтому входящий JSON принимается как `unknown`, а затем проверяется parser-функцией.

### Путь товара

```text
data/products/armatura.ts
  ↓
armaturaProducts
  ↓
data/products/index.ts
  ↓
products: Product[]
  ↓
lib/catalog.ts
  ↓
getProductBySlug("armatura-a500s-10")
  ↓
app/catalog/[categorySlug]/[productSlug]/page.tsx
  ↓
ProductPage
  ├── ProductGallery
  ├── ProductSpecifications
  └── AddToCartButton
  ↓
HTML пользователя
```

## 9. Оформление заказа

### Общий сценарий

1. `app/cart/page.tsx` создаёт страницу корзины.
2. `CartPageContent` читает клиентский Context.
3. `CartSummary` ведёт на `/checkout`.
4. `CheckoutForm` собирает данные пользователя.
5. `PaymentMethodSelector` выбирает `CARD` или `INVOICE`.
6. `CheckoutForm.submit` выполняет клиентскую валидацию.
7. Браузер отправляет `POST /api/orders`.
8. `parseCreateOrderInput` валидирует недоверенный JSON.
9. `createTrustedOrder` заново ищет товары и считает цены.
10. `orderRepository.save` сохраняет заказ.
11. Выполняется ветка счёта или карты.

### Запрос

```ts
fetch("/api/orders", {
  method: "POST",
  headers: {"content-type": "application/json"},
  body: JSON.stringify({
    items,
    customer: {...},
    delivery: {...},
    paymentMethod: form.paymentMethod
  })
});
```

Браузер передаёт product IDs и quantities, но не доверенную цену.

### Серверный пересчёт

`createTrustedOrder`:

1. ищет товар через `getProductById`;
2. берёт `product.price` из серверного каталога;
3. создаёт `OrderItem`;
4. вычисляет `subtotal`;
5. суммирует `totalAmount`.

```ts
subtotal: product.price * item.quantity
```

Клиентская `totalAmount` не передаётся в запросе. Сервер не принимает от клиента `finalPrice`, а сам загружает цены из доверенного источника.

### Создание заказа

```ts
reference: `MS-${randomBytes(6).toString("hex").toUpperCase()}`
status: "SUBMITTED"
paymentStatus: "PENDING"
createdAt: new Date().toISOString()
```

В development заказ сохраняется в `Map<string, Order>`.

### Оплата по счёту

После успешного заказа:

1. confirmation сохраняется в `sessionStorage`;
2. очищается корзина;
3. router переходит на `/order/success`;
4. `OrderSuccessContent` читает `sessionStorage`.

Реальный счёт и email не создаются: development notification service является no-op.

### Оплата картой

Браузер вызывает `POST /api/payments/create`. Сервер ищет заказ, проверяет `CARD`, перепроверяет сумму и вызывает `paymentProvider.createPayment(order)`.

Сейчас provider всегда бросает `PAYMENT_PROVIDER_NOT_CONFIGURED`, поэтому endpoint возвращает 503, корзина не очищается, а checkout показывает ошибку.

При подключённом provider выполнялось бы:

```ts
clearCart();
window.location.assign(payment.redirectUrl);
```

| Шаг | Файл/функция | Среда | Возможная ошибка |
|---|---|---|---|
| Корзина | `CartPageContent` | Browser | Storage пуст/повреждён |
| Форма | `CheckoutForm` | Browser | Невалидные поля |
| Request | `submit` | Browser | Network failure |
| Parsing | `POST /api/orders` | Server | 400 JSON |
| Validation | `parseCreateOrderInput` | Server | 400 validation |
| Цена | `createTrustedOrder` | Server | Unknown product |
| Сохранение | `orderRepository.save` | Server | 503 |
| Счёт | branch `INVOICE` | Browser | Уведомление no-op |
| Карта | `/api/payments/create` | Server | Сейчас всегда 503 |
| Webhook | `/api/payments/webhook` | Server | Сейчас всегда 401 |

## 10. API и Route Handlers

```text
HTTP request
  ↓
app/api/.../route.ts
  ↓
request.json() / raw request
  ↓
parser или ручная validation
  ↓
service/repository/provider
  ↓
Response.json(...) или Response
```

Spring-аналогия:

```text
@RestController
  ↓
DTO validation
  ↓
@Service
  ↓
@Repository / integration client
```

Отличия: нет аннотаций и DI container, зависимости импортируются как module-level singleton instances, validation написана вручную, отсутствуют transaction manager и глобальный exception handler.

### `POST /api/orders`

Файл: `app/api/orders/route.ts`.

Validation:

- body является object;
- 1–100 позиций;
- формат `productId`;
- quantity — integer 1–999;
- customer type;
- payment method;
- длины строк;
- email;
- phone;
- address;
- обязательные реквизиты компании.

Сервисы:

- `createTrustedOrder`;
- `orderRepository`;
- `notificationService`.

Успех — HTTP `201`. Ошибки:

- `400` — JSON или данные;
- `400` — неизвестный товар;
- `503` — repository/notification.

Endpoint не production-ready из-за in-memory repository и отсутствия уведомлений. Если сохранение успешно, а notification бросит ошибку, сервер вернёт 503, хотя заказ уже мог сохраниться. Транзакционной компенсации нет.

### `POST /api/payments/create`

Request:

```json
{
  "orderReference": "MS-ABCDEF012345"
}
```

Логика:

1. проверка reference;
2. поиск заказа;
3. проверка `paymentMethod === "CARD"`;
4. повторный расчёт суммы;
5. сравнение с `order.totalAmount`;
6. `paymentProvider.createPayment(order)`.

Коды:

- `400` — reference;
- `404` — заказ не найден;
- `409` — сумма не совпала;
- `503` — provider/repository не настроен.

Сейчас endpoint никогда не создаёт payment session.

### `POST /api/payments/webhook`

Webhook — входящий server-to-server запрос платёжного провайдера.

Весь `Request` передаётся в:

```ts
paymentProvider.verifyWebhook(request)
```

Будущий provider должен прочитать raw body, проверить cryptographic signature, извлечь event ID и order reference, а затем преобразовать статус.

Логика:

1. verification;
2. проверка `processedEventIds`;
3. поиск заказа;
4. обновление payment status;
5. сохранение event ID;
6. ответ 204.

Коды:

- `204` — обработано или duplicate;
- `404` — заказ не найден;
- `401` — verification/provider/repository error.

Сейчас provider отсутствует, signature verification не реализована, а идемпотентность теряется после restart.

Статус `PAID` правильно не устанавливается по browser redirect. Redirect ничего не доказывает; доверять можно только подписанному webhook.

### `POST /api/contact`

`parseContactRequest` проверяет object, name, email, optional phone, message и максимальные длины. Пробелы нормализуются, email переводится в lowercase.

Поле `website` является honeypot. Если бот его заполнит, сервер вернёт `{ok:true}`, но notification service не вызовет.

Коды:

- `200` — принято;
- `400` — JSON/validation;
- `503` — уведомления не настроены.

В development запрос успешен, но сообщение никуда не отправляется.

### `POST /api/quote`

`parseQuoteRequest` проверяет name, phone, email, optional company, message, `consent === true`, длины и honeypot.

Коды:

- `200` — принято;
- `400` — JSON/validation;
- `503` — уведомления не настроены.

В development это успешная no-op операция.

### Итог по endpoints

| Endpoint | Validation | Зависимость | Текущее состояние |
|---|---|---|---|
| `POST /api/orders` | Полная ручная | Repository + notifications | In-memory в development |
| `POST /api/payments/create` | Reference + order checks | PaymentProvider | Заглушка, 503 |
| `POST /api/payments/webhook` | Делегирована provider | Provider + repository | Заглушка, 401 |
| `POST /api/contact` | Ручная + honeypot | NotificationService | Dev success без отправки |
| `POST /api/quote` | Ручная + honeypot | NotificationService | Dev success без отправки |

## 11. Слои `lib`

Каталог `lib` содержит функции, которые не являются React-компонентами или страницами. Это наиболее близкая к привычной Java-архитектуре часть проекта.

```text
lib/
├── catalog.ts
├── constants.ts
├── currency.ts
├── validation.ts
└── server/
    ├── validation.ts
    ├── orders.ts
    ├── payments.ts
    └── notifications.ts
```

### `lib/catalog.ts`

Это единая точка чтения статического каталога:

```ts
export const getProductById = (id: string) =>
  products.find(item => item.id === id);
```

Файл импортирует исходные массивы из `data` и предоставляет функции:

- получения всех категорий, подкатегорий и товаров;
- поиска по `id` и `slug`;
- фильтрации по категории и подкатегории;
- подсчёта товаров;
- получения похожих товаров.

По смыслу это query service или очень простой read-only repository. Аналогия неточная: здесь нет внешнего хранилища, асинхронных запросов, кэша или persistence context.

`getProductBySlug` ищет товар только по product slug:

```ts
products.find(item => item.slug === slug)
```

Поэтому страница товара отдельно проверяет связь с категорией:

```ts
product.categoryId !== category.id
```

Это предотвращает отображение существующего товара под неправильным category URL.

### `lib/constants.ts`

Содержит:

- `CART_STORAGE_KEY`;
- `ORDER_STORAGE_KEY`;
- `mainNavigation`;
- `API_BASE_URL`.

`CART_STORAGE_KEY` и `ORDER_STORAGE_KEY` используются реально. `mainNavigation` используется desktop- и mobile-навигацией.

`API_BASE_URL` сейчас нигде не импортируется. Его fallback указывает на `http://localhost:8080/api`, но текущие формы используют относительные Next.js endpoints `/api/...`. Переменная `NEXT_PUBLIC_API_BASE_URL`, из которой читается значение, также отсутствует в `.env.example`. Это не активная часть текущего приложения, а неиспользуемый остаток или заготовка.

### `lib/currency.ts`

Форматирует число как рубли:

```ts
new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0
}).format(value);
```

Функция используется в карточках товаров, корзине и checkout summary. Это аналог небольшого stateless formatter utility в Java.

### `lib/validation.ts`

Клиентские helpers:

```ts
isValidEmail(value)
isValidPhone(value)
```

Они используются в `CheckoutForm` и `QuoteRequestForm`, чтобы быстро показать пользователю ошибку до HTTP-запроса.

Это не security boundary. Пользователь может обойти JavaScript браузера, поэтому Route Handlers применяют отдельную серверную валидацию из `lib/server/validation.ts`.

### `lib/server/validation.ts`

Здесь находятся:

- `parseCreateOrderInput`;
- `parseContactRequest`;
- `parseQuoteRequest`;
- внутренние type guards и нормализаторы.

Parser принимает `unknown`, проверяет реальную runtime-структуру и возвращает типизированный объект либо `null`.

```text
unknown JSON
   ↓
isRecord / typeof / Array.isArray
   ↓
нормализация строк
   ↓
проверка business constraints
   ↓
CreateOrderInput или null
```

По смыслу это сочетание Jackson deserialization, Bean Validation и ручного mapper, но без библиотек и аннотаций.

### `lib/server/orders.ts`

Содержит два разных вида логики:

1. абстракцию и реализации хранилища;
2. создание доверенного заказа.

#### `OrderRepository`

```ts
export interface OrderRepository {
  save(order: Order): Promise<void>;
  findByReference(reference: string): Promise<Order | null>;
  updatePaymentStatus(
    reference: string,
    status: PaymentStatus
  ): Promise<void>;
}
```

Это очень похоже на Java interface. Реализации:

- `DevelopmentOrderRepository`;
- `UnconfiguredOrderRepository`.

Development-реализация хранит заказы:

```ts
private readonly orders = new Map<string, Order>();
```

`Map` живёт в памяти одного Node.js-процесса. Это означает:

- данные исчезнут после restart;
- разные server instances не увидят заказы друг друга;
- serverless invocation может не найти только что созданный заказ;
- нет транзакций и durable persistence;
- нет защиты от concurrent updates.

Production-реализация намеренно бросает `ORDER_STORAGE_NOT_CONFIGURED`.

#### Выбор реализации

```ts
export const orderRepository: OrderRepository =
  process.env.NODE_ENV === "production"
    ? new UnconfiguredOrderRepository()
    : developmentRepository;
```

Реализация выбирается при загрузке модуля. `orderRepository` является module-level singleton: все импорты внутри одного процесса получают один объект.

Это ручной composition root, а не dependency injection:

- нет DI container;
- нет constructor injection;
- Route Handler импортирует готовый singleton;
- подмена реализации требует изменения модуля или дополнительной factory/configuration.

Для production нужно создать, например, `PostgresOrderRepository implements OrderRepository`, и выбирать его в composition-коде после настройки подключения.

#### `createTrustedOrder`

Функция:

- заново ищет продукты по ID;
- копирует серверные имя, SKU и цену;
- вычисляет subtotal и total;
- генерирует reference через `node:crypto`;
- устанавливает начальные статусы.

Это небольшой domain/service function. Она синхронна, потому что каталог сейчас является обычным массивом.

### `lib/server/payments.ts`

`PaymentProvider` — порт интеграции с платёжной системой:

```ts
export interface PaymentProvider {
  createPayment(order: Order): Promise<{
    paymentId: string;
    redirectUrl: string;
  }>;

  verifyWebhook(request: Request):
    Promise<VerifiedPaymentEvent>;
}
```

Сейчас единственная реализация — `UnconfiguredPaymentProvider`, которая всегда бросает ошибку.

Для подключения настоящего провайдера потребуется:

1. реализовать `createPayment` по официальному SDK;
2. передавать reference и серверную сумму;
3. настроить return/callback URL;
4. реализовать чтение raw webhook body;
5. проверить подпись через `PAYMENT_WEBHOOK_SECRET`;
6. преобразовать provider status в `PaymentStatus`;
7. обеспечить постоянную идемпотентность event ID.

Hosted payment page означает, что данные карты вводятся не в `CheckoutForm`, а на защищённой странице провайдера.

### `lib/server/notifications.ts`

`NotificationService` определяет:

```ts
sendContactRequest(...)
sendQuoteRequest(...)
sendOrderNotification(...)
```

Development-реализация делает `void request` или `void order`: параметр считается использованным, но фактического действия нет.

Production-реализация бросает `NOTIFICATION_PROVIDER_NOT_CONFIGURED`.

Настоящая реализация могла бы отправлять email через внешний API. Секретный API key должен использоваться только в этом server-модуле, а не в Client Component.

## 12. Валидация и безопасность

### Почему входной JSON имеет тип `unknown`

`request.json()` может вернуть что угодно:

- object;
- array;
- string;
- `null`;
- object с неправильными полями;
- чрезвычайно длинные строки;
- отрицательное количество;
- несуществующий product ID.

TypeScript не проверяет JSON во время runtime. Поэтому Route Handler пишет:

```ts
let body: unknown;
body = await request.json();
```

Только после parser-функции значение считается доверенным по структуре.

### `parseCreateOrderInput`

Parser проверяет:

- верхний объект через `isRecord`;
- наличие массива `items`;
- от 1 до 100 строк;
- customer и delivery как objects;
- product ID по regex;
- quantity как целое число 1–999;
- customer type как `INDIVIDUAL | COMPANY`;
- payment method как `CARD | INVOICE`;
- длины всех строк;
- email и телефон;
- адрес доставки;
- обязательные поля компании.

`text` дополнительно выполняет:

```ts
value.trim().replace(/\s+/g, " ")
```

Это удаляет крайние пробелы и схлопывает последовательности whitespace.

Type guard:

```ts
const isCustomerType = (
  value: unknown
): value is CustomerType => ...
```

сообщает TypeScript: после успешной проверки значение можно считать `CustomerType`.

Текущая реализация хорошо защищает структуру и размеры, но это не полная application security:

- нет rate limiting;
- нет аутентификации;
- нет CSRF-механизма;
- нет проверки origin;
- нет общей максимальной длины HTTP body;
- нет observability/audit trail;
- нет схемной библиотеки вроде Zod;
- tax number проверяется только по длине, а не по формату и checksum.

### `parseContactRequest`

Проверяет имя, email, optional phone, сообщение, длины и honeypot.

Без неё атакующий мог бы отправлять массивы вместо строк, огромные payloads или некорректные контакты в notification integration.

### `parseQuoteRequest`

Дополнительно требует:

```ts
value.consent === true
```

Это технически подтверждает, что клиент передал согласие, но само по себе не является полноценным юридическим audit evidence: согласие нигде постоянно не сохраняется.

### Серверный пересчёт цены

Угроза:

```text
Browser DevTools
  ↓
изменить totalAmount или price
  ↓
купить товар дешевле
```

Защита: `/api/orders` игнорирует клиентскую сумму и получает каждую цену через `getProductById`.

Даже если пользователь изменит `localStorage`, он сможет изменить только ID и quantity. Сервер либо найдёт настоящий товар и настоящую цену, либо отклонит заказ.

### Honeypot

`ContactForm` и `QuoteRequestForm` содержат скрытое поле `website`.

Обычный пользователь его не заполняет. Простой бот, автоматически заполняющий все inputs, вероятно, заполнит.

Route Handler отвечает успехом, но не отправляет уведомление:

```ts
if (contact.website) {
  return Response.json({ok: true});
}
```

Это уменьшает простой spam, но не защищает от умных ботов. Для production понадобятся rate limiting, monitoring и, возможно, CAPTCHA/challenge.

### Hosted payment page

Checkout не содержит поля номера карты, CVV или срока действия. После создания server-side payment session браузер должен перейти на страницу провайдера.

Это уменьшает область обработки платёжных данных приложением. Но production-ready соответствие требованиям зависит от конкретной интеграции и конфигурации провайдера.

### Webhook verification

Browser redirect нельзя использовать как доказательство оплаты:

- пользователь может открыть success URL вручную;
- redirect можно остановить или повторить;
- browser контролируется пользователем;
- успешный redirect не гарантирует окончательный расчёт.

Поэтому статус `PAID` должен меняться только после подписанного server-to-server webhook.

Сейчас правильная абстракция есть:

```ts
paymentProvider.verifyWebhook(request)
```

но реальная signature verification отсутствует.

### Идемпотентность webhook

Провайдер может отправить одно событие несколько раз. `processedEventIds` предотвращает повторную обработку в пределах одного процесса.

Для production `Set` недостаточен. Event ID нужно сохранять в БД атомарно вместе с изменением заказа, иначе restart или второй instance обработает событие повторно.

### Серверные секреты

Только на сервере должны находиться:

- `PAYMENT_SECRET_KEY`;
- `PAYMENT_WEBHOOK_SECRET`;
- `NOTIFICATION_API_KEY`;
- credentials базы данных.

Переменные с префиксом `NEXT_PUBLIC_` могут попасть в browser bundle. Поэтому secret никогда не должен иметь такой префикс.

`.env.example` документирует имена переменных без настоящих значений:

```text
NEXT_PUBLIC_SITE_URL=
PAYMENT_PROVIDER=
PAYMENT_SECRET_KEY=
PAYMENT_WEBHOOK_SECRET=
NOTIFICATION_PROVIDER=
NOTIFICATION_API_KEY=
NOTIFICATION_RECIPIENT_EMAIL=
```

Шаблон безопасно хранить в Git, реальные `.env.local` или platform secrets — нет.

## 13. Асинхронность

### `Promise`

`Promise<T>` — объект, представляющий будущий результат асинхронной операции:

```ts
Promise<Order | null>
```

Promise может быть:

- pending;
- fulfilled;
- rejected.

Приблизительная Java-аналогия — `CompletableFuture<T>`. Аналогия ограничена: JavaScript обычно использует один event loop для orchestration и не создаёт отдельный поток на каждый Promise.

### `async`

Функция с `async` всегда возвращает Promise:

```ts
export async function POST(request: Request) {
  // ...
}
```

Даже:

```ts
async function value() {
  return 10;
}
```

фактически возвращает `Promise<number>`.

### `await`

`await` приостанавливает текущую async-функцию до завершения Promise:

```ts
const response = await fetch("/api/orders", ...);
const result = await response.json();
```

При этом JavaScript runtime не обязан блокировать весь browser tab или server process. Event loop может обрабатывать другие события и запросы.

Это похоже на последовательный код визуально, но операция остаётся асинхронной.

### Реальный browser flow

```text
CheckoutForm.submit()
  ↓
fetch("/api/orders") возвращает Promise
  ↓
submit временно приостанавливается на await
  ↓
browser может продолжать рисовать UI
  ↓
server возвращает response
  ↓
Promise выполняется
  ↓
submit продолжает выполнение
```

`submitting` блокирует кнопку не потому, что JavaScript поток заблокирован, а потому, что React отрисовал `disabled={true}`.

### `fetch`

`fetch` возвращает Promise объекта `Response`. HTTP 400 или 503 не отклоняет Promise автоматически.

Поэтому код отдельно проверяет:

```ts
if (!response.ok) {
  throw new Error(...);
}
```

Promise обычно отклоняется при сетевой ошибке, отмене или ошибке самого API, но не из-за обычного HTTP error status.

### `try/catch/finally`

В `CheckoutForm`:

- `try` выполняет requests;
- `catch` превращает ошибку в UI message;
- `finally` всегда снимает состояние `submitting`.

```ts
} finally {
  setSubmitting(false);
}
```

Route Handlers отдельно оборачивают `request.json()`, потому что malformed JSON вызывает exception.

### Асинхронные repository methods

Development repository сейчас работает синхронно внутри, но методы объявлены async:

```ts
async save(order: Order) {
  this.orders.set(order.reference, order);
}
```

Это сохраняет интерфейс, совместимый с будущей БД, где действительно понадобится I/O.

## 14. Импорты и экспорты

### Named export

```ts
export function useCart() {}
export const products = [];
```

Импортируется в фигурных скобках:

```ts
import {useCart} from "@/hooks/useCart";
```

Имя обычно должно совпадать с экспортом.

### Default export

Страницы используют:

```ts
export default function Home() {}
```

Импорт default export не требует фигурных скобок, и локальное имя можно выбрать:

```ts
import Link from "next/link";
```

Next.js ожидает default export компонента в `page.tsx` и `layout.tsx`.

### Type-only import

```ts
import type {Product} from "@/types/product";
```

Такой импорт нужен только TypeScript и удаляется из runtime JavaScript.

### Relative import

```ts
import {ProductCard} from "./ProductCard";
```

Путь считается относительно текущего файла.

### Alias `@/`

`tsconfig.json`:

```json
"paths": {
  "@/*": ["./*"]
}
```

Поэтому:

```ts
import {getProductById} from "@/lib/catalog";
```

означает импорт из корня проекта `lib/catalog.ts`.

Alias уменьшает цепочки вроде `../../../lib/catalog`.

### Реальные цепочки импортов

#### Страница товара

```text
app/catalog/[categorySlug]/[productSlug]/page.tsx
  → lib/catalog.ts
    → data/products/index.ts
      → data/products/armatura.ts и остальные группы
```

#### Кнопка корзины

```text
components/cart/AddToCartButton.tsx
  → hooks/useCart.ts
    → context/CartContext.tsx
      → lib/catalog.ts
```

#### Создание заказа

```text
app/api/orders/route.ts
  → lib/server/validation.ts
  → lib/server/orders.ts
    → lib/catalog.ts
  → lib/server/notifications.ts
```

#### Checkout

```text
app/checkout/page.tsx
  → components/checkout/CheckoutPageContent.tsx
    → components/checkout/CheckoutForm.tsx
      → hooks/useCart.ts
      → lib/validation.ts
```

#### Общий layout

```text
app/layout.tsx
  → context/CartContext.tsx
  → components/layout/Header.tsx
    → components/cart/CartButton.tsx
  → components/layout/Footer.tsx
```

## 15. Полный жизненный цикл пользовательских действий

### Сценарий A: открытие страницы товара

Пример URL:

```text
/catalog/armatura/armatura-a500s-10
```

#### Во время build

```text
npm run build
  ↓
Next.js находит dynamic page
  ↓
generateStaticParams()
  ↓
getAllProducts()
  ↓
для prd-001 создаётся пара:
{
  categorySlug: "armatura",
  productSlug: "armatura-a500s-10"
}
  ↓
ProductPage({params})
  ↓
getCategoryBySlug("armatura")
getProductBySlug("armatura-a500s-10")
  ↓
проверка product.categoryId === category.id
  ↓
getRelatedProducts(...)
  ↓
создание статического HTML
```

`generateMetadata` аналогично получает товар и создаёт title/description.

#### При открытии пользователем

```text
Browser URL
  ↓
Next.js router
  ↓
заранее созданная страница ProductPage
  ↓
RootLayout
  ├── Header
  ├── PageContainer
  │   ├── Breadcrumbs
  │   ├── ProductGallery
  │   ├── ProductSpecifications
  │   └── AddToCartButton
  └── Footer
  ↓
HTML отображается
  ↓
React гидратирует Client Components
  ↓
AddToCartButton становится интерактивной
```

Если category или product не найдены либо не связаны, вызывается `notFound()`, и Next.js показывает `app/not-found.tsx`.

Данные товара не запрашиваются из API: они встроены в статическую страницу из TypeScript-каталога.

### Сценарий B: добавление и checkout

```text
ProductPage
  ↓
AddToCartButton.add()
  ↓
useCart().addItem(productId, quantity)
  ↓
CartProvider.setItems()
  ↓
render CartButton с новым количеством
  ↓
effect сохраняет items в localStorage
  ↓
пользователь открывает /cart
  ↓
CartPageContent получает lines
  ↓
переход на /checkout
  ↓
CheckoutPageContent
  ↓
CheckoutForm.submit()
  ↓
client validation
  ↓
POST /api/orders
  ↓
app/api/orders/route.ts
  ↓
parseCreateOrderInput
  ↓
createTrustedOrder
  ├── getProductById
  ├── server prices
  └── total calculation
  ↓
orderRepository.save
  ↓
notificationService.sendOrderNotification
  ↓
HTTP 201 + reference
```

Для `INVOICE`:

```text
sessionStorage confirmation
  ↓
clearCart()
  ↓
router.push("/order/success")
  ↓
OrderSuccessContent
  ↓
номер заказа и сообщение о счёте
```

Для `CARD`:

```text
POST /api/payments/create
  ↓
findByReference
  ↓
проверка CARD и суммы
  ↓
paymentProvider.createPayment
  ↓
сейчас: exception
  ↓
HTTP 503
  ↓
ошибка в CheckoutForm
  ↓
корзина остаётся
```

При будущей рабочей интеграции последняя ветка должна вернуть hosted URL, очистить корзину и выполнить `window.location.assign`.

## 16. Что происходит при запуске проекта

### `package.json`

Манифест npm-проекта:

- имя и версия;
- scripts;
- runtime dependencies;
- development dependencies.

Основные версии:

- Next.js 16.2.11;
- React 19.2.4;
- TypeScript 5;
- Tailwind CSS 4;
- ESLint 9.

### `package-lock.json`

Lock-файл фиксирует точные версии всего dependency tree. В текущем lock-файле 435 package entries.

Аналогия — зафиксированный dependency resolution, близкий по цели к Maven lock-механизмам, хотя стандартный Maven обычно разрешает версии иначе.

`package-lock.json` нужно коммитить, чтобы локальная установка и CI получали одинаковый dependency graph.

### `node_modules`

Каталог установленных npm packages. Приблизительно соответствует локальному набору Maven dependencies, но packages физически размещены внутри проекта.

Не редактируется вручную и восстанавливается через npm.

### `npm install`

Читает `package.json` и `package-lock.json`, скачивает dependencies и создаёт/обновляет `node_modules`.

Для максимально воспроизводимой CI-установки часто используется `npm ci`, но такого script в проекте нет.

### `npm run dev`

Запускает:

```text
next dev
```

Next.js поднимает development server, компилирует маршруты по требованию, следит за файлами и применяет Fast Refresh.

### Turbopack

Turbopack — bundler/compiler Next.js. Он:

- строит граф модулей;
- обрабатывает TypeScript, JSX и CSS;
- создаёт server/client bundles;
- пересобирает затронутые части;
- используется текущей production-сборкой, что видно по выводу `next build`.

Это отдалённо похоже на сочетание compiler, resource pipeline и incremental build system.

### Fast Refresh

Fast Refresh обновляет React-компоненты во время разработки без полной перезагрузки страницы и по возможности сохраняет state.

Состояние может сброситься или произойти full reload, если:

- изменился модуль, который Fast Refresh не может безопасно принять;
- файл экспортирует не только React-компоненты;
- изменилась граница server/client;
- произошла runtime или syntax error;
- изменение затронуло код, импортируемый вне React tree.

`context/CartContext.tsx` экспортирует и `CartContext`, и `CartProvider`. Кроме того, он является важной client boundary, используемой root layout. Поэтому некоторые его изменения могут инвалидировать границу Fast Refresh и привести к полной перезагрузке. Это не означает, что каждое изменение обязательно вызывает reload.

### Почему `next.config.ts` перезапускает dev server

`next.config.ts` определяет конфигурацию самого Next.js process и bundler. Это не обычный React-модуль страницы. Чтобы применить настройки маршрутизации, compiler или runtime, development server должен перечитать конфигурацию и перезапуститься.

В текущем проекте `nextConfig` пуст, но файл всё равно является конфигурационным entry point.

### `npm run lint`

Запускает ESLint:

```text
eslint
```

Конфигурация `eslint.config.mjs` подключает:

- Next.js Core Web Vitals rules;
- TypeScript rules;
- ignores для `.next`, `out`, `build`, `next-env.d.ts`.

Текущий lint проходит.

### `npm run build`

Выполняет production build:

1. компилирует приложение;
2. проверяет TypeScript;
3. собирает page data;
4. запускает static generation;
5. оптимизирует output.

Текущая сборка успешно создаёт:

- обычные static routes;
- 16 category SSG pages;
- 124 product SSG pages;
- пять dynamic Route Handlers.

### `.next`

Build-каталог Next.js:

- compiled server code;
- client chunks;
- generated type information;
- static pages;
- caches и manifests.

Это generated output, приблизительно похожий по роли на `target/`, но структура специфична для Next.js.

### `npm start`

Запускает:

```text
next start
```

Команда обслуживает уже собранное production-приложение и требует предварительного `npm run build`.

## 17. JavaScript и TypeScript в проекте

Ниже перечислены конструкции, которые реально встречаются в коде.

### `const`

Объявляет binding, который нельзя переназначить:

```ts
const product = getProductById(item.productId);
```

Ближайшая Java-аналогия — локальная `final` переменная. Важно: `const` запрещает переназначить переменную, но не делает object глубоко immutable.

### `let`

Переменная, которую можно переназначить:

```ts
let body: unknown;
body = await request.json();
```

Аналог обычной локальной Java-переменной.

### Function declaration

```ts
export function createTrustedOrder(input: CreateOrderInput) {}
```

Похожа на Java static method на уровне модуля. В JavaScript функции являются значениями и могут передаваться как аргументы.

### Arrow function

```ts
const isValidEmail = (value: string) => regex.test(value);
```

Ближайшая Java-аналогия — lambda. Но arrow function может быть обычной именованной переменной модуля, а не только callback.

### Object

```ts
const confirmation = {
  orderNumber: result.order.reference,
  email: form.email
};
```

Object — динамическая коллекция свойств. В TypeScript его compile-time форма может быть ограничена интерфейсом.

### Array

```ts
const items: OrderItem[] = [];
```

Ближе к Java `ArrayList<OrderItem>`, чем к фиксированному Java array: поддерживает `push`, `map`, `filter` и другие методы.

### `map`

Преобразует каждый элемент:

```ts
categories.map(category => ({
  categorySlug: category.slug
}))
```

Аналог `stream().map(...).toList()`.

### `filter`

Оставляет подходящие элементы:

```ts
products.filter(item => item.categoryId === categoryId)
```

Аналог `stream().filter(...)`.

### `find`

Возвращает первый элемент или `undefined`:

```ts
products.find(item => item.id === id)
```

Похож на `stream().filter(...).findFirst()`, но возвращает `T | undefined`, а не `Optional<T>`.

### `reduce`

Сворачивает массив в одно значение:

```ts
items.reduce((sum, item) => sum + item.subtotal, 0)
```

Аналог `mapToInt(...).sum()` или общего `reduce`.

### `flatMap`

Используется для генерации params и исключения отсутствующих элементов:

```ts
getAllProducts().flatMap(product => {
  return category ? [{...}] : [];
});
```

Похож на Java Stream `flatMap`.

### Destructuring

```ts
const {categorySlug, productSlug} = await params;
```

Извлекает свойства object в локальные переменные. Прямого полного аналога в обычных Java-классах нет; record patterns частично похожи.

В параметрах:

```ts
function ProductCard({product}: {product: Product})
```

object разбирается прямо при вызове функции.

### Spread syntax

```ts
{...order, paymentStatus: status}
[...prev, {productId, quantity}]
```

Создаёт поверхностную копию object или array. В Java потребовались бы copy constructor, builder или создание новой коллекции.

Spread является shallow: вложенные objects не копируются глубоко.

### Optional chaining

```ts
c?.slug
```

Если `c` равен `null` или `undefined`, выражение возвращает `undefined`.

Похоже по цели на безопасную цепочку через `Optional`, но гораздо короче и не создаёт `Optional`.

### Nullish coalescing

```ts
c?.slug ?? "catalog"
```

Fallback используется только для `null` или `undefined`. В отличие от `||`, пустая строка и `0` не считаются причиной для fallback.

### Template strings

```ts
`/catalog/${category.slug}`
```

Аналог string interpolation. В Java ближайшие варианты — конкатенация или `String.formatted`.

### Modules

Каждый `.ts`/`.tsx` файл с import/export является модулем со своей областью видимости.

Это приблизительно сочетание Java source file и package-level API, но один TypeScript-файл может экспортировать несколько функций, типов и objects.

### `async`/`await`

```ts
const response = await fetch("/api/orders");
```

Делает asynchronous flow визуально последовательным. Возвращаемое значение async-функции всегда обёрнуто в Promise.

### Generics

```ts
useState<CartItem[]>([])
createContext<CartContextValue | undefined>(undefined)
```

`CartItem[]` или `CartContextValue | undefined` передаётся как type parameter.

Похоже на Java generics, но TypeScript-типы стираются полностью и не обеспечивают runtime validation.

### Union types

```ts
type PaymentMethod = "CARD" | "INVOICE";
```

Значение может быть только одним из string literals. По назначению похоже на маленький Java enum, но runtime enum object не создаётся.

Другой пример:

```ts
OrderConfirmation | null | undefined
```

### Type narrowing

```ts
if (typeof value === "string") {
  // здесь TypeScript знает, что value — string
}
```

Похоже на Java pattern matching `instanceof`, но TypeScript анализирует множество условий и custom type guards.

### Callback

Функция, переданная другой функции:

```ts
products.filter(product => product.inStock)
```

Аналог Java lambda, переданной Stream API.

React callback:

```tsx
onChange={setQ}
```

Дочерний компонент вызывает функцию родителя, чтобы сообщить об изменении.

### Event handler

```tsx
onClick={add}
onSubmit={submit}
onChange={event => set(...)}
```

Это функция, которую React вызывает в ответ на browser event. Похоже на listener в Swing/JavaFX/Selenium-side JavaScript concepts, но handler участвует в React state flow.

### Ternary operator

```ts
inStock ? "В наличии" : "Под заказ"
```

Такой же условный оператор существует в Java.

### Short-circuit rendering

```tsx
{error && <p>{error}</p>}
```

Если `error` является непустой строкой, React отображает `<p>`. В Java UI code обычно потребовался бы обычный `if`.

## 18. Что изучать и в каком порядке

### Этап 1. Минимальный JavaScript

Изучить:

- `const` и `let`;
- object и array;
- functions и arrow functions;
- destructuring и spread;
- `map`, `filter`, `find`, `reduce`;
- modules;
- Promise и event loop.

Перечитать:

- `lib/catalog.ts`;
- `lib/currency.ts`;
- `data/products/index.ts`.

Упражнение: в отдельной временной ветке добавить в `lib/catalog.ts` функцию поиска товаров по SKU и вывести результат через временный `console.log` или маленький тест. Не менять существующие API функций.

### Этап 2. Минимальный TypeScript

Изучить:

- primitive types;
- interface и type;
- union types;
- optional fields;
- generics;
- `unknown`;
- type guards;
- type narrowing;
- структурную типизацию.

Перечитать:

- `types/product.ts`;
- `types/order.ts`;
- `lib/server/validation.ts`.

Упражнение: определить отдельный type guard для `PaymentMethod` и проверить его на нескольких значениях в изолированном файле.

### Этап 3. React

Изучить:

- component;
- JSX;
- props;
- `children`;
- state;
- render;
- events;
- controlled inputs;
- list keys.

Перечитать:

- `components/catalog/ProductGrid.tsx`;
- `components/catalog/ProductCard.tsx`;
- `components/cart/QuantitySelector.tsx`;
- `components/layout/PageContainer.tsx`.

Упражнение: добавить локальный переключатель компактного/подробного отображения в учебную копию компонента, не меняя доменную модель.

### Этап 4. Next.js App Router

Изучить:

- файловую маршрутизацию;
- `page.tsx`;
- `layout.tsx`;
- dynamic segments;
- async `params`;
- `generateStaticParams`;
- `generateMetadata`;
- `notFound`;
- `Link`.

Перечитать:

- `app/layout.tsx`;
- `app/catalog/page.tsx`;
- `app/catalog/[categorySlug]/page.tsx`;
- `app/catalog/[categorySlug]/[productSlug]/page.tsx`.

Упражнение: добавить в отдельной ветке простую статическую informational page, используя существующие `PageContainer` и `Breadcrumbs`.

### Этап 5. Клиентское состояние

Изучить:

- `useState`;
- `useEffect`;
- `useMemo`;
- `useCallback`;
- Context;
- custom hooks;
- hydration;
- browser storage.

Перечитать:

- `context/CartContext.tsx`;
- `hooks/useCart.ts`;
- `components/cart/*`.

Упражнение: добавить вычисляемое количество уникальных позиций, не сохраняя его отдельно в state.

### Этап 6. Route Handlers

Изучить:

- Web `Request` и `Response`;
- HTTP methods;
- JSON parsing;
- HTTP status codes;
- server-only boundaries;
- отличие UI route от API route.

Перечитать:

- `app/api/orders/route.ts`;
- `app/api/contact/route.ts`;
- `app/api/payments/create/route.ts`.

Упражнение: написать изолированный read-only health endpoint в учебной ветке, возвращающий только безопасную информацию.

### Этап 7. Формы и `fetch`

Изучить:

- controlled и uncontrolled inputs;
- `FormData`;
- submit event;
- `preventDefault`;
- loading/error/success states;
- `fetch`;
- `response.ok`.

Перечитать:

- `CheckoutForm.tsx`;
- `ContactForm.tsx`;
- `QuoteRequestForm.tsx`.

Упражнение: добавить клиентский счётчик символов сообщения, не меняя request contract.

### Этап 8. Валидация и безопасность

Изучить:

- runtime validation;
- type guards;
- trust boundary;
- input normalization;
- rate limiting;
- CSRF;
- webhook signatures;
- idempotency.

Перечитать:

- `lib/server/validation.ts`;
- `app/api/orders/route.ts`;
- `app/api/payments/webhook/route.ts`;
- `.env.example`.

Упражнение: составить table-driven unit tests для всех parser-функций: valid, missing field, wrong type, too long, boundary values.

### Этап 9. Production integrations

Изучить:

- SQL repository;
- migrations;
- transactions;
- email provider;
- hosted checkout;
- webhook verification;
- durable idempotency;
- secrets management;
- logging и monitoring.

Перечитать:

- `lib/server/orders.ts`;
- `lib/server/payments.ts`;
- `lib/server/notifications.ts`;
- `docs/architecture.md`.

Упражнение: сначала реализовать `OrderRepository` поверх тестовой БД и contract tests для repository. После этого подключать payment provider.

## 19. Словарь терминов

**React** — библиотека для декларативного построения интерфейса из компонентов. React пересчитывает описание UI при изменении state и обновляет нужные части DOM.

**Next.js** — framework поверх React, добавляющий маршрутизацию, Server Components, static generation, server rendering, Route Handlers, build и deployment conventions.

**Component** — функция или другой React construct, описывающий часть интерфейса. Компоненты можно вкладывать и переиспользовать.

**JSX** — синтаксис, похожий на HTML внутри JavaScript/TypeScript. JSX компилируется в вызовы React runtime.

**Props** — входные данные компонента, переданные родителем. Компонент не должен изменять props напрямую.

**State** — изменяемые данные конкретного экземпляра UI. Изменение state планирует новый render.

**Hook** — функция React с именем, начинающимся с `use`, которая подключает state, Context, effects или другую React-возможность.

**Context** — механизм передачи значения через React-дерево без ручной передачи props на каждом уровне.

**Provider** — компонент или Context provider, задающий значение Context для вложенного дерева.

**Render** — вызов React-компонента для вычисления текущего описания интерфейса. Render не обязательно означает полную перерисовку DOM.

**Hydration** — подключение React в браузере к HTML, уже созданному сервером. После hydration начинают работать handlers и клиентский state.

**Server Component** — компонент, выполняемый сервером или во время build. Он не может напрямую использовать browser APIs и интерактивные hooks.

**Client Component** — компонент внутри границы `"use client"`, который поставляется браузеру и может использовать state, effects и события.

**Route Handler** — серверная функция в `route.ts`, обрабатывающая HTTP method через Web `Request` и `Response`.

**App Router** — система Next.js, в которой маршруты и layouts определяются структурой каталога `app`.

**Slug** — человекочитаемый URL-идентификатор, например `armatura-a500s-10`.

**Layout** — общий UI-wrapper для маршрутов. Корневой layout проекта добавляет Provider, header, main и footer.

**localStorage** — browser key-value storage без автоматического срока действия. Данные контролируются пользователем и не являются доверенными.

**sessionStorage** — browser storage, ограниченный текущей вкладкой и её сессией. Здесь используется для временного подтверждения заказа.

**Promise** — объект будущего результата асинхронной операции.

**Callback** — функция, переданная другому коду для последующего вызова.

**Event handler** — callback, запускаемый в ответ на событие пользователя или браузера.

**Repository** — абстракция чтения и сохранения domain objects. Текущий order repository хранит данные только в памяти.

**Provider** — в интеграционном смысле адаптер внешнего сервиса, например `PaymentProvider`. Это другое значение слова, не React Context Provider.

**Webhook** — HTTP-запрос, который внешний сервис отправляет серверу при наступлении события. Платёжный webhook должен иметь проверяемую подпись.

**SSG** — Static Site Generation: создание HTML во время build, а не при каждом пользовательском запросе.

**Fast Refresh** — development-механизм обновления React-кода без полной перезагрузки страницы, когда это безопасно.

**Turbopack** — bundler и incremental build engine, используемый текущей версией Next.js.

## 20. Итоговая карта проекта

### Компактная карта ключевых файлов

```text
metal-frontend/
├── package.json                 dependencies и команды
├── package-lock.json            зафиксированный dependency graph
├── tsconfig.json                TypeScript и alias @/*
├── next.config.ts               Next.js configuration
├── eslint.config.mjs            lint rules
├── postcss.config.mjs           Tailwind PostCSS plugin
├── .env.example                 шаблон environment variables
├── .editorconfig                форматирование файлов
│
├── app/
│   ├── layout.tsx               root layout + CartProvider
│   ├── page.tsx                 главная
│   ├── globals.css              Tailwind + global styles
│   ├── loading.tsx              loading UI
│   ├── not-found.tsx            404
│   ├── catalog/
│   │   ├── page.tsx             общий каталог
│   │   └── [categorySlug]/
│   │       ├── page.tsx         категория
│   │       └── [productSlug]/
│   │           └── page.tsx     товар
│   ├── cart/page.tsx            корзина
│   ├── checkout/page.tsx        checkout shell
│   ├── order/success/page.tsx   confirmation shell
│   └── api/
│       ├── orders/route.ts
│       ├── payments/create/route.ts
│       ├── payments/webhook/route.ts
│       ├── contact/route.ts
│       └── quote/route.ts
│
├── components/
│   ├── layout/                  header, footer, navigation
│   ├── home/                    homepage sections
│   ├── catalog/                 grids, cards, filters
│   ├── cart/                    cart UI
│   ├── checkout/                checkout flow
│   ├── forms/                   contact и quote
│   └── ui/                      basic controls
│
├── context/
│   └── CartContext.tsx          cart state + localStorage
├── hooks/
│   └── useCart.ts               Context access
│
├── data/
│   ├── categories.ts
│   ├── subcategories.ts
│   ├── services.ts
│   └── products/                124 product objects
│
├── lib/
│   ├── catalog.ts               catalog queries
│   ├── currency.ts              RUB formatting
│   ├── constants.ts             keys и navigation
│   ├── validation.ts            client validation
│   └── server/
│       ├── validation.ts        trusted parsers
│       ├── orders.ts            trusted order + repository
│       ├── payments.ts          payment port
│       └── notifications.ts     notification port
│
├── types/                       compile-time contracts
├── public/                      static assets
└── docs/architecture.md         architecture decisions
```

### 10 файлов для первого чтения

1. `README.md` — текущая общая карта.
2. `package.json` — технологии и команды.
3. `app/layout.tsx` — корень UI и Provider.
4. `app/catalog/[categorySlug]/[productSlug]/page.tsx` — полная Server Component страница.
5. `types/product.ts` — модель товара.
6. `lib/catalog.ts` — доступ к каталогу.
7. `context/CartContext.tsx` — клиентское состояние.
8. `components/checkout/CheckoutForm.tsx` — форма и HTTP flow.
9. `app/api/orders/route.ts` — доверенная HTTP-граница.
10. `lib/server/orders.ts` — серверная цена и repository abstraction.

### Рекомендуемый порядок чтения

```text
package.json
  ↓
app/layout.tsx
  ↓
app/page.tsx
  ↓
types/product.ts
  ↓
data/products/armatura.ts
  ↓
data/products/index.ts
  ↓
lib/catalog.ts
  ↓
app/catalog/[categorySlug]/page.tsx
  ↓
app/catalog/[categorySlug]/[productSlug]/page.tsx
  ↓
components/catalog/ProductCard.tsx
  ↓
context/CartContext.tsx
  ↓
hooks/useCart.ts
  ↓
components/cart/*
  ↓
components/checkout/CheckoutForm.tsx
  ↓
lib/server/validation.ts
  ↓
app/api/orders/route.ts
  ↓
lib/server/orders.ts
  ↓
payments и notifications
```

### Пять контрольных вопросов

1. Почему `totalAmount` из `CartContext` нельзя использовать как окончательную сумму заказа на сервере?
2. Почему `CartContext` должен быть Client Component, а product page может оставаться Server Component?
3. Чем `app/catalog/[categorySlug]/page.tsx` отличается от `app/api/orders/route.ts`?
4. Что произойдёт с development-заказом после перезапуска Node.js-процесса?
5. Почему browser redirect после оплаты не позволяет установить `paymentStatus = "PAID"`?

### Пять практических заданий

1. **Простое:** добавить чистую функцию поиска товара по SKU и unit tests для неё.
2. **React:** показать в корзине число уникальных позиций без добавления нового state.
3. **TypeScript:** написать table-driven tests для `parseCreateOrderInput`.
4. **Next.js/API:** добавить безопасный health endpoint и проверить его через `curl`.
5. **Архитектурное:** реализовать постоянный `OrderRepository` и contract tests, сохранив текущий интерфейс и не связывая Route Handler с конкретной БД.

## Главный архитектурный вывод

Проект сознательно разделяет две области:

```text
Удобство пользователя
React state, localStorage, client validation

              ≠

Доверенная бизнес-операция
server validation, server catalog prices,
repository, payment webhook
```

Клиентский код отвечает за быстрый интерактивный интерфейс. Route Handlers отвечают за всё, что имеет бизнес- или security-значение. Текущая архитектура уже задаёт правильные интерфейсы для repository, payments и notifications, но их production-реализации ещё предстоит подключить.
