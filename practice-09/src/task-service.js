// Все фильтры объединяются через И. Исходный массив не изменяется.
export function selectTasks(tasks, { completed, priority, categoryId, q }) {
  const query = q.toLocaleLowerCase('ru-RU');
  return tasks.filter(task => (
    (completed === null || task.completed === completed)
    && (priority === null || task.priority === priority)
    && (categoryId === null || task.categoryId === categoryId)
    && (!query || task.title.toLocaleLowerCase('ru-RU').includes(query))
  ));
}

export function findTask(tasks, id) {
  return tasks.find(task => task.id === id) ?? null;
}
