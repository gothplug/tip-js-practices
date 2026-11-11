import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isTask(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId),
  );
}

function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

// Фильтры проверяются до запроса. Ошибка вызывающего кода — TypeError,
// запрос при этом не выполняется. false остаётся логическим значением:
// строку "false" создаст URLSearchParams внутри buildUrl.
function normalizeFilters(filters) {
  if (filters === null || typeof filters !== "object" || Array.isArray(filters)) {
    throw new TypeError("Фильтры должны быть объектом.");
  }

  const query = {};
  for (const [name, value] of Object.entries(filters)) {
    if (!ALLOWED_FILTERS.has(name)) {
      throw new TypeError(`Неизвестный фильтр: ${name}.`);
    }
    if (value === undefined) continue;

    if (name === "completed") {
      if (typeof value !== "boolean") throw new TypeError("completed должен быть boolean.");
      query.completed = value;
    } else if (name === "priority") {
      if (!ALLOWED_PRIORITIES.has(value)) {
        throw new TypeError("priority должен быть low, medium или high.");
      }
      query.priority = value;
    } else if (name === "categoryId") {
      if (!isPositiveSafeInteger(value)) {
        throw new TypeError("categoryId должен быть положительным целым числом.");
      }
      query.categoryId = value;
    } else {
      if (typeof value !== "string") throw new TypeError("q должен быть строкой.");
      const q = value.trim();
      if (q.length > 100) throw new TypeError("q не должен быть длиннее 100 символов.");
      if (q !== "") query.q = q;
    }
  }
  return query;
}

// Проверка коллекции: массив data, схема каждого элемента, уникальные id
// и meta.total, равный длине data.
function readCollection(payload, isItem, label) {
  if (payload === null || typeof payload !== "object" || !Array.isArray(payload.data)) {
    throw invalidResponse(`Ответ ${label}: поле data должно быть массивом.`);
  }

  const ids = new Set();
  for (const item of payload.data) {
    if (!isItem(item)) {
      throw invalidResponse(`Ответ ${label}: элемент не соответствует схеме.`);
    }
    if (ids.has(item.id)) {
      throw invalidResponse(`Ответ ${label}: повторяющийся id ${item.id}.`);
    }
    ids.add(item.id);
  }

  const meta = payload.meta;
  if (meta === null || typeof meta !== "object" || meta.total !== payload.data.length) {
    throw invalidResponse(`Ответ ${label}: meta.total не совпадает с числом элементов.`);
  }

  return { items: payload.data, meta };
}

// client — объект, созданный createApiClient.
// Контракт результата:
// getTasks(filters) -> Promise<{ tasks, meta }>
// getTaskById(id) -> Promise<task>
// getCategories() -> Promise<category[]>
// loadInitialData(filters) -> Promise<{ tasks, categories, meta }>
export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("createTaskApi ожидает клиент с методом requestJson.");
  }

  async function getTasks(filters = {}) {
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", { query });
    const { items, meta } = readCollection(payload, isTask, "задач");
    return { tasks: items, meta };
  }

  async function getTaskById(id) {
    if (!isPositiveSafeInteger(id)) {
      throw new TypeError("id задачи должен быть положительным целым числом.");
    }
    const payload = await client.requestJson(`/tasks/${id}`);
    if (!payload || !isTask(payload.data)) {
      throw invalidResponse(`Ответ задачи ${id} не соответствует схеме.`);
    }
    return payload.data;
  }

  async function getCategories() {
    const payload = await client.requestJson("/categories");
    return readCollection(payload, isCategory, "категорий").items;
  }

  async function loadInitialData(filters = {}) {
    // Оба запроса начинаются до общего ожидания — они независимы.
    const tasksPromise = getTasks(filters);
    const categoriesPromise = getCategories();
    const [taskResult, categories] = await Promise.all([tasksPromise, categoriesPromise]);
    return { tasks: taskResult.tasks, categories, meta: taskResult.meta };
  }

  return { getTasks, getTaskById, getCategories, loadInitialData };
}
