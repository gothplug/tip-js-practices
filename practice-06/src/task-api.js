import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

export function isTask(value) {
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

export function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

// Перенесено из ПР5. Фильтры проверяются до запроса; ошибка вызывающего кода —
// TypeError, запрос не выполняется. false остаётся логическим значением.
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

// Коллекция: массив data, схема каждого элемента, уникальные id, meta.total = длина.
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

// Одиночная задача из { data: task } — ответ GET, POST и PATCH.
function readTask(payload, label) {
  if (!payload || !isTask(payload.data)) {
    throw invalidResponse(`Ответ ${label} не содержит корректную задачу.`);
  }
  return payload.data;
}

function checkId(id) {
  if (!isPositiveSafeInteger(id)) {
    throw new TypeError("id задачи должен быть положительным целым числом.");
  }
}

// Методы результата:
// getTasks, getTaskById, getCategories, loadInitialData, createTask, updateTask,
// setTaskCompleted, deleteTask и resetDemoData.
// Последний аргумент каждого метода данных — { signal }.
// Модуль не работает с DOM и не формирует пользовательские сообщения.
export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") {
    throw new TypeError("createTaskApi ожидает клиент с методом requestJson.");
  }

  async function getTasks(filters = {}, { signal } = {}) {
    const query = normalizeFilters(filters);
    const payload = await client.requestJson("/tasks", { query, signal });
    const { items, meta } = readCollection(payload, isTask, "задач");
    return { tasks: items, meta };
  }

  async function getTaskById(id, { signal } = {}) {
    checkId(id);
    return readTask(await client.requestJson(`/tasks/${id}`, { signal }), `задачи ${id}`);
  }

  async function getCategories({ signal } = {}) {
    const payload = await client.requestJson("/categories", { signal });
    return readCollection(payload, isCategory, "категорий").items;
  }

  async function loadInitialData(filters = {}, options = {}) {
    // Оба запроса начинаются до общего ожидания — они независимы.
    const [taskResult, categories] = await Promise.all([
      getTasks(filters, options),
      getCategories(options),
    ]);
    return { tasks: taskResult.tasks, categories, meta: taskResult.meta };
  }

  // Тело создания: только title, priority, categoryId. id и completed назначает сервер.
  async function createTask(draft, { signal } = {}) {
    const payload = await client.requestJson("/tasks", { method: "POST", body: draft, signal });
    return readTask(payload, "создания");
  }

  // PATCH передаёт только изменяемые поля.
  async function updateTask(id, changes, { signal } = {}) {
    checkId(id);
    const payload = await client.requestJson(`/tasks/${id}`, {
      method: "PATCH",
      body: changes,
      signal,
    });
    return readTask(payload, `изменения задачи ${id}`);
  }

  async function setTaskCompleted(id, completed, { signal } = {}) {
    checkId(id);
    if (typeof completed !== "boolean") {
      throw new TypeError("completed должен быть boolean.");
    }
    const payload = await client.requestJson(`/tasks/${id}`, {
      method: "PATCH",
      body: { completed },
      signal,
    });
    return readTask(payload, `смены статуса задачи ${id}`);
  }

  // Успешное удаление — 204 без тела, клиент возвращает строго null.
  async function deleteTask(id, { signal } = {}) {
    checkId(id);
    const payload = await client.requestJson(`/tasks/${id}`, { method: "DELETE", signal });
    if (payload !== null) {
      throw invalidResponse("Ответ удаления должен быть пустым (204).");
    }
    return null;
  }

  // Команда восстановления набора: POST без тела.
  async function resetDemoData({ signal } = {}) {
    const payload = await client.requestJson("/debug/reset", { method: "POST", signal });
    const data = payload?.data;
    if (!data || data.reset !== true || !Number.isSafeInteger(data.total) || data.total < 0) {
      throw invalidResponse("Ответ восстановления данных не соответствует контракту.");
    }
    return { reset: data.reset, total: data.total };
  }

  return {
    getTasks,
    getTaskById,
    getCategories,
    loadInitialData,
    createTask,
    updateTask,
    setTaskCompleted,
    deleteTask,
    resetDemoData,
  };
}
