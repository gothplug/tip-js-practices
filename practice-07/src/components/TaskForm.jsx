import { useState } from 'react';
import { validateTaskDraft } from '../domain/task-service.js';

function createDraft(task, categories) {
  return {
    title: task?.title ?? '',
    priority: task?.priority ?? 'medium',
    categoryId: String(task?.categoryId ?? categories[0]?.id ?? ''),
  };
}

export default function TaskForm({ categories, initialTask = null, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => createDraft(initialTask, categories));
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState('');

  function change(event) {
    const { name, value } = event.target;
    setDraft(previous => ({ ...previous, [name]: value }));
  }

  function submit(event) {
    event.preventDefault();
    setSaveError('');
    const result = validateTaskDraft(draft, categories);
    setErrors(result.errors);
    if (!result.valid) return;
    if (!onSave(result.value)) {
      setSaveError('Не удалось сохранить задачу.');
      return;
    }
    setDraft(createDraft(null, categories));
  }

  function field(name) {
    return {
      name, value: draft[name], onChange: change,
      'aria-invalid': Boolean(errors[name]),
      'aria-describedby': errors[name] ? `task-${name}-error` : undefined,
    };
  }

  return (
    <section aria-label="Форма задачи">
      <h2>{initialTask ? 'Редактировать задачу' : 'Новая задача'}</h2>
      <form noValidate onSubmit={submit}>
        <label>Название <input {...field('title')} required /></label>
        {errors.title && <p className="error" id="task-title-error">{errors.title}</p>}
        <label>Приоритет <select {...field('priority')}>
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select></label>
        {errors.priority && <p className="error" id="task-priority-error">{errors.priority}</p>}
        <label>Категория <select {...field('categoryId')}>
          {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select></label>
        {errors.categoryId && <p className="error" id="task-categoryId-error">{errors.categoryId}</p>}
        {saveError && <p role="alert">{saveError}</p>}
        <button type="submit">{initialTask ? 'Сохранить' : 'Создать'}</button>
        {initialTask && <button type="button" onClick={onCancel}>Отмена</button>}
      </form>
    </section>
  );
}
