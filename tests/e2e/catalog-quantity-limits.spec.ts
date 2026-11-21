import type {Locator} from "@playwright/test";
import {beamReferenceMassKg} from "../../lib/beam";
import {getAllProductVariants} from "../../lib/catalog";
import {isDemonstrationProduct} from "../../lib/catalogOffer";
import {isProfilePipeVariant} from "../../lib/profilePipe";
import type {ProductVariant} from "../../types/product";
import {expect, productPath, test, visibleProduct} from "../browser";

const variantsByPage = Map.groupBy(getAllProductVariants(), variant => productPath(variant, false));
const formatMetres = new Intl.NumberFormat("ru-RU", {useGrouping: false, maximumFractionDigits: 2});
const formatTons = new Intl.NumberFormat("ru-RU", {useGrouping: false, maximumFractionDigits: 6});

function maximumMeasurement(variant: ProductVariant) {
  const mass = isDemonstrationProduct(variant) ? undefined : variant.weightPerMeterKg ?? beamReferenceMassKg(variant);
  if (!mass) return {meters: null, tons: 999};
  const pipe = variant.subcategoryId === "cat-trk-sub-1" ? variant.lengthMeters : undefined;
  const meters = pipe ? Math.floor(999_000 / (mass * pipe)) * pipe : 999_000 / mass;
  return {meters, tons: pipe ? meters * mass / 1_000 : 999};
}

async function expectFits(input: Locator) {
  const dimensions = await input.evaluate((element: HTMLInputElement) => {
    const style = getComputedStyle(element);
    const context = document.createElement("canvas").getContext("2d")!;
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const available = element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const width = context.measureText(element.value).width;
    return {value: element.value, available, width, clipped: width > available + 1
      || element.scrollWidth > element.clientWidth + 1};
  });
  expect(dimensions.clipped, `${dimensions.value} needs ${dimensions.width}px of ${dimensions.available}px`).toBe(false);
}

for (const [path, variants] of variantsByPage) {
  test(`quantity limits in every catalog row at ${path}`, async ({page, isMobile}) => {
    test.setTimeout(120_000);
    await page.setViewportSize({width: isMobile ? 320 : 1280, height: 1000});
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready.then(() => true));
    const search = page.getByLabel("Поиск товаров", {exact: true}).filter({visible: true}).first();

    for (const variant of variants) await test.step(variant.id, async () => {
      const row = visibleProduct(page, variant.id);
      if (variant.categoryId === "cat-trp" && !isProfilePipeVariant(variant)) {
        const summary = page.locator("summary").filter({hasText: "Другие позиции — параметры уточняются"});
        const legacy = summary.locator("xpath=..");
        if (await legacy.getAttribute("open") === null) await summary.click();
        if (!await row.isVisible()) await legacy.getByLabel("Поиск товаров", {exact: true}).fill(variant.name);
      } else if (!await row.isVisible()) await search.fill(variant.name);
      await expect(row).toBeVisible();

      const inputs = row.getByRole("textbox");
      expect(await inputs.count()).toBeGreaterThan(0);
      for (const input of await inputs.all()) {
        const accepted = await input.evaluate(element => {
          const clipboardData = new DataTransfer();
          clipboardData.setData("text/plain", "1\n2");
          return element.dispatchEvent(new ClipboardEvent("paste", {clipboardData, bubbles: true, cancelable: true}));
        });
        expect(accepted, "a pasted range of cells cannot become a single number").toBe(false);
        await input.fill("1e3");
        await input.blur();
        await expect(input).toHaveValue("1e3");
        await expect(input).toHaveAttribute("aria-invalid", "true");
      }

      const tons = row.getByRole("textbox", {name: /^Вес заказа в тоннах для /});
      if (await tons.count()) {
        const meters = row.getByRole("textbox", {name: /^Длина заказа для /});
        const {meters: maximumMeters, tons: maximumTons} = maximumMeasurement(variant);
        const displayedTons = formatTons.format(maximumTons);
        const displayedMeters = maximumMeters === null ? "" : formatMetres.format(maximumMeters);

        await tons.fill("999");
        await tons.blur();
        await expect(tons).toHaveValue(displayedTons);
        await expect(meters).toHaveValue(displayedMeters);
        await expectFits(tons);
        await expectFits(meters);

        await tons.fill("1000");
        await expect(tons).toHaveValue(displayedTons);
        await expect(row).not.toContainText("Значение ограничено максимумом");
        await tons.blur();
        await expect(meters).toHaveValue(displayedMeters);
        if (maximumMeters !== null) {
          await meters.fill(String(Math.ceil(maximumMeters) + 1));
          await expect(meters).toHaveValue(displayedMeters);
          await expectFits(meters);
          await meters.blur();
          await expect(tons).toHaveValue(displayedTons);
        } else {
          await meters.fill("10000");
          await meters.blur();
          await expect(meters).toHaveValue("9999");
          await expect(tons).toHaveValue("");
        }
        await expect(row).not.toContainText("Значение ограничено максимумом");
        return;
      }

      for (const input of await inputs.all()) {
        const isPipeLength = (await input.getAttribute("aria-label"))?.startsWith("Длина одной трубы");
        const maximum = isPipeLength ? variant.lengthRangeMeters![1] : 999;
        await input.fill("9999");
        await input.blur();
        await expect(input).toHaveValue(formatMetres.format(maximum));
        await expect(row).not.toContainText("Значение ограничено максимумом");
        await expect(input).not.toHaveAttribute("aria-invalid", "true");
        await expectFits(input);
      }
      if (variant.lengthRangeMeters) {
        const maxTotalLength = 999 * variant.lengthRangeMeters[1];
        const length = row.getByLabel(/^Заказ в метрах для /);
        expect(Number((await length.textContent())?.replace(/\s/gu, ""))).toBe(maxTotalLength);
      }
    });
  });
}

const measuredOrders = getAllProductVariants().filter(variant => variant.unit === "ton" && !isDemonstrationProduct(variant)
  && !variant.quoteOnly && variant.priceQualifier !== "from" && !!variant.price && !!variant.pricePerTon && !!variant.weightPerMeterKg
  && (variant.inStock || (variant.imported && variant.availability === "UNKNOWN")));

for (const [category, variants] of Map.groupBy(measuredOrders, variant => variant.categoryId)) {
  test(`999 tonnes in each measured cart row for ${category}`, async ({page, isMobile}) => {
    test.setTimeout(120_000);
    await page.setViewportSize({width: isMobile ? 320 : 1280, height: 1000});
    const storageKey = "metal-store-cart-v1";
    const items = variants.map(variant => {
      const meters = variant.lengthMeters ?? 10;
      return {productId: variant.id, quantity: meters, measurement: {meters, inputMode: "meter",
        weightTons: meters * variant.weightPerMeterKg! / 1_000, estimatedTotal: 0, pricePerTon: 0}};
    });
    await page.addInitScript(({storageKey, items}) => {
      localStorage.setItem(storageKey, JSON.stringify(items));
    }, {storageKey, items});
    await page.goto("/cart");
    await page.evaluate(() => document.fonts.ready.then(() => true));

    for (const variant of variants) await test.step(variant.id, async () => {
      const row = page.locator(`[data-cart-row="${variant.id}"]`);
      const meters = row.getByRole("textbox", {name: /^Длина /});
      const tons = row.getByRole("textbox", {name: /^Масса /});
      const maximum = maximumMeasurement(variant);
      await tons.focus();
      const startingTons = await tons.inputValue();
      await tons.fill("1e3");
      await expect(tons).toHaveValue(startingTons);
      await tons.fill("999");
      await expect(tons).toHaveValue(formatTons.format(maximum.tons));
      await expectFits(tons);
      await tons.press("Enter");
      await meters.focus();
      const displayed = formatMetres.format(maximum.meters!);
      await expect(meters).toHaveValue(displayed);
      await expectFits(meters);
      await meters.fill("1,2.3");
      await expect(meters).toHaveValue(displayed);
      await meters.blur();
      await expectFits(meters);
      await expect(row.getByRole("alert")).toHaveCount(0);
      const saved = await page.evaluate(({storageKey, id}) => {
        const rows = JSON.parse(localStorage.getItem(storageKey)!);
        return rows.find((item: {productId: string}) => item.productId === id).measurement;
      }, {storageKey, id: variant.id});
      expect(saved).toMatchObject({inputMode: "ton", meters: expect.closeTo(maximum.meters!, 9),
        weightTons: expect.closeTo(maximum.tons, 10)});
    });
  });
}
