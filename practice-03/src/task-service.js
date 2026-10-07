// Прикладные операции над списком задач (ESM-модуль).
// Модуль содержит только чистые функции над переданными аргументами:
// входной массив и его объекты не изменяются ни при успехе, ни при ошибке,
// а успешные операции возвращают новый массив задач.
// console.log, DOM и глобальное изменяемое состояние здесь не используются.

// Допустимые приоритеты и границы названия зафиксированы моделью задачи.
const PRIORITIES = ["low", "medium", "high"];
const MAX_TITLE_LENGTH = 100;

// Внутренние проверки. Они не экспортируются: наружу виден только
// объект результата { ok: false, error } либо нормализованное значение.

// id — положительное безопасное целое. Приведение типов не выполняется:
// Number.isSafeInteger("4") === false, поэтому строка отклоняется.
function checkId(id) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    return {
      ok: false,
      error: "Идентификатор должен быть положительным безопасным целым числом",
    };
  }

  return { ok: true };
}

// Название — строка, после trim() длиной от 1 до 100 включительно.
// Проверка типа выполняется до вызова trim(), поэтому для null,
// undefined и числа метод trim() не вызывается.
function normalizeTitle(value) {
  if (typeof value !== "string") {
    return { ok: false, error: "Название задачи должно быть строкой" };
  }

  const title = value.trim();

  if (title.length === 0) {
    return { ok: false, error: "Название задачи не должно быть пустым" };
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return {
      ok: false,
      error: `Название задачи не должно быть длиннее ${MAX_TITLE_LENGTH} символов`,
    };
  }

  return { ok: true, title };
}

// Приоритет — строго одно из значений "low", "medium", "high".
// includes() сравнивает по строгому равенству, поэтому null, 1 и " high " отклоняются.
function checkPriority(priority) {
  if (!PRIORITIES.includes(priority)) {
    return {
      ok: false,
      error: `Приоритет должен быть одним из значений: ${PRIORITIES.join(", ")}`,
    };
  }

  return { ok: true };
}

export function createTask(id, title, priority = "medium") {
  const idResult = checkId(id);
  if (!idResult.ok) {
    return { ok: false, error: idResult.error };
  }

  const titleResult = normalizeTitle(title);
  if (!titleResult.ok) {
    return { ok: false, error: titleResult.error };
  }

  const priorityResult = checkPriority(priority);
  if (!priorityResult.ok) {
    return { ok: false, error: priorityResult.error };
  }

  // Каждый успешный вызов создаёт новый объект задачи.
  return {
    ok: true,
    task: {
      id,
      title: titleResult.title,
      completed: false,
      priority,
    },
  };
}

export function findTaskById(tasks, id) {
  // Строгое сравнение: "4" не совпадает с 4. Возвращается сам объект, не копия.
  return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
  return tasks.filter((task) => task.completed === false);
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed === true).length;
  const pending = total - completed;
  // Без предварительного округления: toFixed() применяется только при выводе.
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return { total, completed, pending, progress };
}

export function addTask(tasks, id, title, priority = "medium") {
  // Проверки полей выполняет createTask, чтобы правила не дублировались.
  const created = createTask(id, title, priority);
  if (!created.ok) {
    return { ok: false, error: created.error };
  }

  // Уникальность id проверяется поиском, а не изменением списка.
  if (findTaskById(tasks, id) !== undefined) {
    return { ok: false, error: `Задача с id ${id} уже присутствует в списке` };
  }

  // Новая запись добавляется в конец нового массива (spread исходного).
  return { ok: true, tasks: [...tasks, created.task] };
}

export function setTaskCompleted(tasks, id, completed) {
  const idResult = checkId(id);
  if (!idResult.ok) {
    return { ok: false, error: idResult.error };
  }

  // Принимается только boolean: "true", "false", 1, 0, null и undefined отклоняются.
  if (completed !== true && completed !== false) {
    return { ok: false, error: "Признак выполнения должен быть логическим значением" };
  }

  const task = findTaskById(tasks, id);
  if (task === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  // Новый массив и новый объект изменённой записи; остальные записи
  // переиспользуются. Повторная установка того же значения — тоже успех.
  return {
    ok: true,
    tasks: tasks.map((item) =>
      item.id === id ? { ...item, completed } : item,
    ),
  };
}

export function renameTask(tasks, id, title) {
  const idResult = checkId(id);
  if (!idResult.ok) {
    return { ok: false, error: idResult.error };
  }

  const titleResult = normalizeTitle(title);
  if (!titleResult.ok) {
    return { ok: false, error: titleResult.error };
  }

  const task = findTaskById(tasks, id);
  if (task === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  // Меняется только title: id, completed и priority сохраняются.
  return {
    ok: true,
    tasks: tasks.map((item) =>
      item.id === id ? { ...item, title: titleResult.title } : item,
    ),
  };
}

export function removeTask(tasks, id) {
  const idResult = checkId(id);
  if (!idResult.ok) {
    return { ok: false, error: idResult.error };
  }

  if (findTaskById(tasks, id) === undefined) {
    return { ok: false, error: `Задача с id ${id} не найдена` };
  }

  // filter() всегда возвращает новый массив и сохраняет порядок остальных записей.
  return { ok: true, tasks: tasks.filter((task) => task.id !== id) };
}
