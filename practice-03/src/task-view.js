import { getTaskStats } from "./task-service.js";

// Словарь приоритетов: в модели хранится код, на странице выводится подпись.
const PRIORITY_LABELS = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
};

// Здесь создаётся DOM, но не изменяется состояние приложения.
// Контракт карточки, селекторы и тексты описаны в методичке.
export function createTaskElement(task) {
  const card = document.createElement("li");
  card.className = "task-card";
  card.dataset.taskId = String(task.id);
  // Выполненная задача дополнительно получает класс оформления.
  card.classList.toggle("is-completed", task.completed === true);

  const title = document.createElement("h3");
  title.className = "task-title";
  // Именно textContent: название с разметкой выводится как текст.
  title.textContent = task.title;

  const status = document.createElement("p");
  status.className = "task-status";
  status.textContent = task.completed === true ? "Выполнена" : "В работе";

  const priority = document.createElement("p");
  priority.className = "task-priority";
  priority.textContent = PRIORITY_LABELS[task.priority] ?? task.priority;

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.dataset.action = "toggle";
  // Подпись кнопки постоянная, меняется только признак нажатия.
  toggleButton.setAttribute("aria-pressed", String(task.completed === true));
  const toggleLabel = document.createElement("span");
  toggleLabel.className = "action-label";
  toggleLabel.textContent = "Выполнена";
  toggleButton.append(toggleLabel);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.dataset.action = "delete";
  const deleteLabel = document.createElement("span");
  deleteLabel.className = "action-label";
  deleteLabel.textContent = "Удалить";
  deleteButton.append(deleteLabel);

  actions.append(toggleButton, deleteButton);
  card.append(title, status, priority, actions);

  // Обработчики здесь не назначаются: используется делегирование.
  return card;
}

export function renderTaskList(listElement, tasks) {
  const cards = tasks.map((task) => createTaskElement(task));
  // replaceChildren заменяет дочерние узлы, сам список сохраняется:
  // на нём находится делегированный обработчик события.
  listElement.replaceChildren(...cards);
}

export function renderSummary(summaryElement, tasks, visibleCount) {
  // Сводка считается по всему текущему массиву, а не по видимым карточкам.
  const { total, completed, pending, progress } = getTaskStats(tasks);

  summaryElement.querySelector('[data-stat="total"]').textContent = String(total);
  summaryElement.querySelector('[data-stat="completed"]').textContent = String(completed);
  summaryElement.querySelector('[data-stat="pending"]').textContent = String(pending);
  // toFixed() возвращает строку, поэтому применяется только при отображении.
  summaryElement.querySelector('[data-stat="progress"]').textContent = `${progress.toFixed(1)}%`;
  summaryElement.querySelector('[data-stat="visible"]').textContent = String(visibleCount);
}

export function renderEmptyState(messageElement, total, visibleCount) {
  if (visibleCount > 0) {
    messageElement.textContent = "";
    messageElement.hidden = true;
    return;
  }

  // Различаются два разных пустых состояния: пустой список и пустой фильтр.
  messageElement.textContent =
    total === 0 ? "Список задач пуст." : "Нет задач по выбранному фильтру.";
  messageElement.hidden = false;
}
