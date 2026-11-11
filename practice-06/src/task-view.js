const PRIORITY_LABELS = Object.freeze({
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
});

function actionButton(action, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;
  const span = document.createElement("span");
  span.className = "action-label";
  span.textContent = label;
  button.append(span);
  return button;
}

function metaItem(className, text) {
  const node = document.createElement("span");
  node.className = className;
  node.textContent = text;
  return node;
}

// Карточка задачи. Данные с сервера считаются недоверенным текстом,
// поэтому выводятся только через textContent; обработчики здесь не назначаются.
export function createTaskElement(task, category) {
  const card = document.createElement("li");
  card.className = "task-card";
  card.dataset.taskId = String(task.id);
  card.classList.toggle("is-completed", task.completed === true);

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;

  const meta = document.createElement("p");
  meta.className = "task-meta";
  meta.append(
    metaItem("task-status", task.completed ? "Выполнена" : "В работе"),
    metaItem("task-priority", PRIORITY_LABELS[task.priority] ?? task.priority),
    metaItem("task-category", category?.name ?? `Категория № ${task.categoryId}`),
  );

  const actions = document.createElement("div");
  actions.className = "task-actions";
  const toggle = actionButton("toggle", task.completed ? "Вернуть в работу" : "Отметить выполненной");
  toggle.setAttribute("aria-pressed", String(task.completed === true));
  actions.append(
    toggle,
    actionButton("edit", "Изменить"),
    actionButton("delete", "Удалить"),
  );

  card.append(title, meta, actions);
  return card;
}

export function renderTaskList(list, tasks, categories) {
  const byId = new Map((categories ?? []).map((category) => [category.id, category]));
  // replaceChildren заменяет карточки целиком: повторная отрисовка не накапливает старые.
  list.replaceChildren(...tasks.map((task) => createTaskElement(task, byId.get(task.categoryId))));
}
