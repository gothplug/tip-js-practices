const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const MAX_TITLE_LENGTH = 100;

// Значение select приходит строкой; пустая строка не превращается в 0.
function parseCategoryId(raw) {
  if (typeof raw === "number") return raw;
  if (typeof raw === "string" && raw.trim() !== "") return Number(raw);
  return NaN;
}

// Возвращает { valid, value, errors }.
// value содержит нормализованные title, priority и числовой categoryId.
// Функция не читает DOM и не изменяет входные объекты.
export function validateTaskDraft(draft, categories) {
  const errors = {};

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

  const categoryId = parseCategoryId(draft?.categoryId);
  const known = Array.isArray(categories)
    && categories.some((category) => category.id === categoryId);
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0 || !known) {
    errors.categoryId = "Выберите категорию из списка.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, value: null, errors };
  }

  return { valid: true, value: { title, priority, categoryId }, errors: {} };
}
