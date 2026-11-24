import TaskItem from './TaskItem.jsx';

export default function TaskList({ tasks, categories, hasTasks = true, onToggle, onEdit, onDelete }) {
  return (
    <section aria-label="Список задач">
      <h2>Задачи</h2>
      <p>Найдено: {tasks.length}</p>
      {tasks.length > 0 ? (
        <ul>
          {tasks.map(task => (
            <TaskItem
              key={task.id} task={task} categoryName={categories.find(category => category.id === task.categoryId)?.name}
              onToggle={onToggle} onEdit={onEdit} onDelete={onDelete}
            />
          ))}
        </ul>
      ) : <p>{hasTasks ? 'По выбранным фильтрам задач нет.' : 'Задач пока нет.'}</p>}
    </section>
  );
}
