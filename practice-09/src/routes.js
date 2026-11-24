import { Router } from 'express';
import { ApiError } from './errors.js';
import { parseFilters, parsePositiveId } from './validation.js';

function methodNotAllowed(req, res, next) {
  res.set('Allow', 'GET, HEAD, OPTIONS');
  next(new ApiError(405, 'METHOD_NOT_ALLOWED', 'Метод не поддерживается для этого пути.'));
}

export function createRouter(store) {
  const router = Router({ caseSensitive: true });
  router.get('/health', (req, res) => res.json({ data: { status: 'ok' } }));

  router.get('/categories', (req, res) => {
    const data = store.listCategories();
    res.json({ data, meta: { total: data.length } });
  });

  router.get('/tasks', (req, res) => {
    const { searchParams } = new URL(req.originalUrl, 'http://localhost');
    const filters = parseFilters(searchParams);
    const data = store.listTasks(filters);
    res.json({ data, meta: { total: data.length, filters } });
  });

  router.get('/tasks/:id', (req, res) => {
    const id = parsePositiveId(req.params.id);
    if (id === null) throw new ApiError(400, 'INVALID_ID', 'Некорректный идентификатор задачи.');
    const task = store.getTask(id);
    if (!task) throw new ApiError(404, 'TASK_NOT_FOUND', 'Задача не найдена.', { id });
    res.json({ data: task });
  });

  for (const path of ['/health', '/categories', '/tasks', '/tasks/:id']) {
    router.all(path, methodNotAllowed);
  }

  // Express декодирует параметры пути до проверки HTTP-метода.
  router.use((error, req, res, next) => {
    if (error instanceof URIError && error.status === 400 && req.method !== 'GET' && req.method !== 'HEAD') {
      return methodNotAllowed(req, res, next);
    }
    next(error);
  });
  return router;
}
