// Собственные проверки ПР5 (раздел 7.5 методички и проверка варианта 4).
// API запускается на свободном временном порту, как в integration.checks.js.
// Запуск: node checks/own.checks.js
import assert from "node:assert/strict";
import { createApiServer } from "../api/server.mjs";
import { ApiError, buildUrl, createApiClient } from "../src/api-client.js";
import { createTaskApi } from "../src/task-api.js";
import { variantFilters } from "../src/variant.js";

let passed = 0;
let failed = 0;

async function check(name, action) {
  try {
    await action();
    passed += 1;
    console.log(`OK: ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL: ${name}`);
    console.error(error.stack ?? error.message);
  }
}

async function expectApiError(action, kind) {
  let caught;
  try {
    await action();
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof ApiError, "Ожидался экземпляр ApiError");
  assert.equal(caught.kind, kind);
  return caught;
}

const server = createApiServer();
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
const client = createApiClient({ baseUrl, timeoutMs: 1000 });
const api = createTaskApi(client);

try {
  await check("С1. Вариант 4: priority=medium даёт [1, 10, 19, 28]", async () => {
    assert.equal(
      buildUrl(baseUrl, "/tasks", variantFilters),
      `${baseUrl}/tasks?priority=medium`,
    );
    const { tasks, meta } = await api.getTasks(variantFilters);
    assert.deepEqual(tasks.map((task) => task.id), [1, 10, 19, 28]);
    assert.equal(meta.total, 4);
    assert.ok(tasks.every((task) => task.priority === "medium"));
    assert.deepEqual(meta.filters, {
      completed: null,
      priority: "medium",
      categoryId: null,
      q: "",
    });
  });

  await check("С2. Своя комбинация: completed=false, categoryId=2, q=ПОДГОТОВ", async () => {
    const { tasks, meta } = await api.getTasks({
      completed: false,
      categoryId: 2,
      q: "  ПОДГОТОВ  ",
    });
    // Поиск без учёта регистра, пробелы по краям убраны до запроса.
    assert.deepEqual(tasks.map((task) => task.id), [4, 22]);
    assert.deepEqual(meta.filters, {
      completed: false,
      priority: null,
      categoryId: 2,
      q: "ПОДГОТОВ",
    });
  });

  await check("С3. Неизвестная категория: 404 CATEGORY_NOT_FOUND с видом http", async () => {
    const error = await expectApiError(() => client.requestJson("/categories/999"), "http");
    assert.equal(error.status, 404);
    assert.equal(error.code, "CATEGORY_NOT_FOUND");
    assert.deepEqual(error.details, { id: 999 });
    assert.equal(error.url, `${baseUrl}/categories/999`);
  });

  await check("С4. Несуществующий маршрут: 404 ROUTE_NOT_FOUND, а не network", async () => {
    const error = await expectApiError(() => client.requestJson("/unknown"), "http");
    assert.equal(error.status, 404);
    assert.equal(error.code, "ROUTE_NOT_FOUND");
  });

  await check("С5. Уже отменённый сигнал даёт aborted без ожидания тайм-аута", async () => {
    const controller = new AbortController();
    controller.abort();
    const startedAt = performance.now();
    await expectApiError(() => client.requestJson("/debug/delay", {
      query: { ms: 500 },
      signal: controller.signal,
      timeoutMs: 1000,
    }), "aborted");
    assert.ok(performance.now() - startedAt < 200, "Отмена должна сработать сразу");
  });

  await check("С6. Ответ укладывается в тайм-аут: delay 50 мс при лимите 1000 мс", async () => {
    assert.deepEqual(
      await client.requestJson("/debug/delay", { query: { ms: 50 }, timeoutMs: 1000 }),
      { data: { delayedMs: 50 } },
    );
  });

  await check("С7. Граница q: 100 символов допустимы, 101 отклоняется до запроса", async () => {
    const result = await api.getTasks({ q: "я".repeat(100) });
    assert.equal(result.meta.total, 0);
    await assert.rejects(() => api.getTasks({ q: "я".repeat(101) }), TypeError);
  });
} finally {
  await new Promise((resolve) => server.close(resolve));
}

console.log(`\nИтог собственных проверок: успешно ${passed}, ошибок ${failed}.`);
if (failed > 0) process.exitCode = 1;
