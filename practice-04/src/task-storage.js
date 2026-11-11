export const STORAGE_VERSION = 1;

const PRIORITIES = ["low", "medium", "high"];
const MAX_TITLE_LENGTH = 100;

// Все функции принимают объект storage явно, чтобы их можно было проверить
// без обращения к глобальному window.localStorage.

// Одна задача сохранённой схемы. Значение не исправляется: название
// уже должно быть нормализовано (без краевых пробелов).
function isValidTask(task) {
  if (task === null || typeof task !== "object" || Array.isArray(task)) return false;
  if (!Number.isSafeInteger(task.id) || task.id <= 0) return false;
  if (typeof task.title !== "string") return false;
  if (task.title !== task.title.trim()) return false;
  if (task.title.length === 0 || task.title.length > MAX_TITLE_LENGTH) return false;
  if (typeof task.completed !== "boolean") return false;
  return PRIORITIES.includes(task.priority);
}

export function isValidTaskList(value) {
  if (!Array.isArray(value)) return false;

  const ids = new Set();
  for (const task of value) {
    if (!isValidTask(task) || ids.has(task.id)) return false;
    ids.add(task.id);
  }
  return true;
}

// Новые объекты задач: результат не разделяет ссылки с источником.
function copyTasks(tasks) {
  return tasks.map((task) => ({ ...task }));
}

export function loadTasks(storage, key, fallbackTasks) {
  const fallback = copyTasks(fallbackTasks);

  try {
    const raw = storage.getItem(key);
    if (raw === null) {
      return { ok: true, source: "initial", tasks: fallback };
    }

    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || parsed.version !== STORAGE_VERSION) {
      return {
        ok: false,
        source: "fallback",
        tasks: fallback,
        error: "Сохранённые данные имеют неизвестную версию. Загружен исходный набор.",
      };
    }

    if (!isValidTaskList(parsed.tasks)) {
      return {
        ok: false,
        source: "fallback",
        tasks: fallback,
        error: "Сохранённые задачи не прошли проверку схемы. Загружен исходный набор.",
      };
    }

    return { ok: true, source: "storage", tasks: copyTasks(parsed.tasks) };
  } catch (error) {
    // Сюда попадают и ошибка доступа к storage, и SyntaxError из JSON.parse.
    return {
      ok: false,
      source: "fallback",
      tasks: fallback,
      error: `Не удалось прочитать сохранённые данные (${error.message}). Загружен исходный набор.`,
    };
  }
}

export function saveTasks(storage, key, tasks) {
  if (!isValidTaskList(tasks)) {
    return { ok: false, error: "Список задач некорректен и не был сохранён." };
  }

  try {
    storage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, tasks }));
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: `Не удалось сохранить изменения (${error.message}). После перезагрузки они могут быть потеряны.`,
    };
  }
}

export function removeSavedTasks(storage, key) {
  try {
    // Удаляется ровно один ключ; clear() не используется.
    storage.removeItem(key);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Не удалось удалить сохранённые данные (${error.message}).` };
  }
}
