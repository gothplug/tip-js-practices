const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const MAX_TITLE_LENGTH = 100;

// Строка формы или число → положительное безопасное целое либо null.
// Пустая строка и строка из пробелов не превращаются в 0, а отклоняются.
function parseId(raw) {
  if (typeof raw === "string") {
    if (raw.trim() === "") return null;
    const id = Number(raw);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  }
  if (typeof raw === "number") {
    return Number.isSafeInteger(raw) && raw > 0 ? raw : null;
  }
  return null;
}

// Чистая проверка данных формы. DOM и показ сообщений выполняются в main.js.
// draft: { id, title, priority }; editingId: null либо id редактируемой задачи.
// Входные объекты не изменяются; все независимые ошибки возвращаются вместе.
export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  let id = null;

  if (editingId === null) {
    // Режим создания: id берётся из формы и должен быть свободен.
    id = parseId(draft?.id);
    if (id === null) {
      errors.id = "Укажите положительное целое число.";
    } else if (tasks.some((task) => task.id === id)) {
      errors.id = `Задача с id ${id} уже есть в списке.`;
    }
  } else {
    // Режим редактирования: draft.id не используется (поле заблокировано),
    // источником служит editingId, и такая задача обязана существовать.
    id = parseId(editingId);
    if (id === null || !tasks.some((task) => task.id === id)) {
      errors.id = `Редактируемая задача с id ${String(editingId)} не найдена.`;
    }
  }

  const rawTitle = draft?.title;
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  if (typeof rawTitle !== "string" || title.length === 0) {
    errors.title = "Введите название задачи (пробелы не считаются).";
  } else if (title.length > MAX_TITLE_LENGTH) {
    errors.title = `Название не должно быть длиннее ${MAX_TITLE_LENGTH} символов.`;
  }

  const priority = draft?.priority;
  if (!ALLOWED_PRIORITIES.has(priority)) {
    errors.priority = "Выберите приоритет: низкий, средний или высокий.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: { id, title, priority } };
}
