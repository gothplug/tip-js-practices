import { ApiError } from './errors.js';

const FILTER_NAMES = ['completed', 'priority', 'categoryId', 'q'];
const PRIORITIES = ['low', 'medium', 'high'];

export function parsePositiveId(raw) {
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}

function invalidQuery(message) {
  return new ApiError(400, 'INVALID_QUERY', message);
}

export function parseFilters(searchParams) {
  const seen = new Set();
  for (const name of searchParams.keys()) {
    if (!FILTER_NAMES.includes(name)) throw invalidQuery(`Неизвестный параметр «${name}».`);
    if (seen.has(name)) throw invalidQuery(`Параметр «${name}» передан несколько раз.`);
    seen.add(name);
  }

  const rawCompleted = searchParams.get('completed');
  if (rawCompleted !== null && rawCompleted !== 'true' && rawCompleted !== 'false') {
    throw invalidQuery('Параметр completed должен быть true или false.');
  }
  const completed = rawCompleted === null ? null : rawCompleted === 'true';

  const priority = searchParams.get('priority');
  if (priority !== null && !PRIORITIES.includes(priority)) {
    throw invalidQuery('Параметр priority должен быть low, medium или high.');
  }

  const rawCategoryId = searchParams.get('categoryId');
  const categoryId = parsePositiveId(rawCategoryId);
  if (rawCategoryId !== null && categoryId === null) {
    throw invalidQuery('Параметр categoryId должен быть положительным безопасным целым без ведущих нулей.');
  }

  const q = (searchParams.get('q') ?? '').trim();
  if (q.length > 100) throw invalidQuery('Параметр q должен содержать не больше 100 символов.');
  return { completed, priority, categoryId, q };
}
