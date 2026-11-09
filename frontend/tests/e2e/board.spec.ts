import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("hydrated")) {
      hydrationErrors.push(message.text());
    }
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator(".board-column")).toHaveCount(5);
  expect(hydrationErrors).toEqual([]);
});

test("shows one populated board with exactly five columns", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "راه‌اندازی محصول جدید" })).toBeVisible();
  await expect(page.locator(".board-column")).toHaveCount(5);
  await expect(page.locator("body")).toHaveCSS("font-family", "Vazirmatn, sans-serif");
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check("16px Vazirmatn", "فارسی"))).toBe(
    true,
  );
  const columnColors = await page.locator(".board-column").evaluateAll((columns) =>
    columns.map((column) => getComputedStyle(column).backgroundColor),
  );
  expect(columnColors).toEqual([
    "rgb(240, 239, 247)",
    "rgb(242, 240, 233)",
    "rgb(237, 241, 244)",
    "rgb(243, 239, 235)",
    "rgb(237, 242, 238)",
  ]);
  const designTokens = await page.locator("body").evaluate((body) => {
    const styles = getComputedStyle(body);
    const root = getComputedStyle(document.documentElement);
    return {
      background: root.getPropertyValue("--background").trim(),
      surface: root.getPropertyValue("--surface").trim(),
      text: root.getPropertyValue("--text-primary").trim(),
      accent: root.getPropertyValue("--accent").trim(),
      bodyFont: styles.fontFamily,
      topbar: getComputedStyle(document.querySelector(".topbar")!).backgroundColor,
      hero: getComputedStyle(document.querySelector(".page-heading")!).backgroundImage,
      card: getComputedStyle(document.querySelector(".task-card")!).backgroundColor,
    };
  });
  expect(designTokens).toEqual({
    background: "#f4f5f9",
    surface: "#fff",
    text: "#181925",
    accent: "#7568e8",
    bodyFont: "Vazirmatn, sans-serif",
    topbar: "rgb(25, 26, 39)",
    hero: expect.stringContaining("linear-gradient"),
    card: "rgb(255, 255, 255)",
  });
  await expect(page.getByRole("region", { name: "ایده‌ها" })).toContainText(
    "بازطراحی صفحه اصلی",
  );
  await expect(page.getByRole("region", { name: "در صف" })).toContainText(
    "طراحی کتابخانه‌ی اجزا",
  );
});

test("renames a column and adds then deletes a card", async ({ page }) => {
  await page.getByRole("button", { name: "تغییر نام ایده‌ها" }).click();
  const renameInput = page.getByRole("textbox", { name: "تغییر نام ایده‌ها" });
  await renameInput.fill("ایده‌های تازه");
  await renameInput.press("Enter");
  await expect(page.getByRole("region", { name: "ایده‌های تازه" })).toBeVisible();

  await page.getByRole("button", { name: "افزودن کارت به ایده‌های تازه" }).click();
  await page.getByRole("textbox", { name: "عنوان کارت" }).fill("آزمون کارت جدید");
  await page.getByRole("textbox", { name: "جزئیات کارت" }).fill("جزئیات آزمایشی");
  await page
    .getByRole("region", { name: "ایده‌های تازه" })
    .getByRole("button", { name: "افزودن کارت", exact: true })
    .click();
  const newCard = page.getByRole("article", { name: "آزمون کارت جدید" });
  await expect(newCard).toContainText("جزئیات آزمایشی");
  await newCard.getByRole("button", { name: "حذف آزمون کارت جدید" }).click();
  await expect(newCard).toHaveCount(0);
});

test("moves a card to another column by dragging its handle", async ({ page }) => {
  const handle = page.getByRole("button", { name: "جابجایی بازطراحی صفحه اصلی" });
  const destination = page.getByRole("region", { name: "در صف" });
  const from = await handle.boundingBox();
  const to = await destination.boundingBox();
  if (!from || !to) throw new Error("Drag targets are not visible");

  const startX = from.x + from.width / 2;
  const startY = from.y + from.height / 2;
  const endX = to.x + to.width / 2;
  const endY = to.y + 75;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + (endX - startX) * 0.35, startY + (endY - startY) * 0.35, {
    steps: 5,
  });
  await page.mouse.move(startX + (endX - startX) * 0.7, startY + (endY - startY) * 0.7, {
    steps: 5,
  });
  await page.mouse.move(endX, endY, { steps: 5 });
  await page.mouse.up();

  await expect(page.getByRole("region", { name: "ایده‌ها" })).not.toContainText(
    "بازطراحی صفحه اصلی",
  );
  await expect(page.getByRole("region", { name: "در صف" })).toContainText(
    "بازطراحی صفحه اصلی",
  );
  await expect(destination.getByRole("article", { name: "بازطراحی صفحه اصلی" })).toBeVisible();
});

test("keeps all five columns accessible on a narrow screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const boardScroll = page.locator(".board-scroll");
  const dimensions = await boardScroll.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));

  expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);
  const finalColumn = page.getByRole("region", { name: "تکمیل‌شده" });
  await finalColumn.scrollIntoViewIfNeeded();
  await expect(finalColumn).toBeVisible();
});
