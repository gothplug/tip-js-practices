const PRIORITIES = ['low', 'medium', 'high'];

export function validateTaskDraft(draft, categories) {
  const title = typeof draft?.title === 'string' ? draft.title.trim() : '';
  const priority = draft?.priority;
  const rawCategory = draft?.categoryId;
  const categoryId = typeof rawCategory === 'string' && /^[1-9]\d*$/.test(rawCategory)
    ? Number(rawCategory)
    : rawCategory;
  const errors = {};

  if (!title) errors.title = 'Введите название задачи.';
  else if (title.length > 100) errors.title = 'Название должно содержать не больше 100 символов.';
  if (!PRIORITIES.includes(priority)) errors.priority = 'Выберите приоритет.';
  if (!Number.isSafeInteger(categoryId) || !categories.some(category => category.id === categoryId)) {
    errors.categoryId = 'Выберите категорию из списка.';
  }

  return { valid: Object.keys(errors).length === 0, value: { title, priority, categoryId }, errors };
}

export function selectTasks(tasks, { q, completed, priority, categoryId }) {
  const query = q.trim().toLocaleLowerCase('ru-RU');
  return tasks.filter(task => (
    (!completed || task.completed === (completed === 'true'))
    && (!priority || task.priority === priority)
    && (!categoryId || task.categoryId === Number(categoryId))
    && (!query || task.title.toLocaleLowerCase('ru-RU').includes(query))
  ));
}

export function getTaskStats(tasks) {
  const completed = tasks.filter(task => task.completed).length;
  return { total: tasks.length, completed, active: tasks.length - completed };
}

export function addTask(tasks, { title, priority, categoryId }, id) {
  if (!Number.isSafeInteger(id) || id <= 0 || tasks.some(task => task.id === id)) {
    throw new RangeError('Нужен уникальный положительный целый id.');
  }
  return [...tasks, { id, title, completed: false, priority, categoryId }];
}

export function updateTask(tasks, id, { title, priority, categoryId }) {
  return tasks.map(task => (task.id === id ? { ...task, title, priority, categoryId } : task));
}

export function toggleTask(tasks, id) {
  return tasks.map(task => (task.id === id ? { ...task, completed: !task.completed } : task));
}

export function removeTask(tasks, id) {
  return tasks.filter(task => task.id !== id);
}
