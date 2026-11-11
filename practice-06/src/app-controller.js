import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}

const API_METHODS = [
  "loadInitialData", "getTasks", "createTask", "updateTask",
  "setTaskCompleted", "deleteTask", "resetDemoData",
];
const VIEW_METHODS = [
  "setListState", "setTasks", "setCategories", "setTotal",
  "setFormTask", "showFormErrors", "setMutationPending", "notify",
];

function requireMethods(object, names, label) {
  if (!object || typeof object !== "object") {
    throw new TypeError(`Контроллеру нужна зависимость ${label}.`);
  }
  for (const name of names) {
    if (typeof object[name] !== "function") {
      throw new TypeError(`У зависимости ${label} нет метода ${name}.`);
    }
  }
}

// Отмена — ожидаемое управление потоком, а не ошибка для пользователя.
function isAbort(error) {
  return (error instanceof ApiError && error.kind === "aborted") || error?.name === "AbortError";
}

// view — адаптер из dom-app.js. Контроллер не должен обращаться к document.
// Обязательные методы результата:
// start, applyFilters, refresh, submit, beginEdit, cancelEdit,
// toggleTask, deleteTask, resetData и destroy.
export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  requireMethods(api, API_METHODS, "api");
  requireMethods(view, VIEW_METHODS, "view");
  if (typeof validateDraft !== "function") {
    throw new TypeError("validateDraft должен быть функцией.");
  }

  // Снимок последнего ответа сервера, а не собственный источник данных.
  let tasks = [];
  let categories = null; // null — справочник ещё не получен
  let filters = {};
  let editingId = null;
  let loadController = null;
  let loadSequence = 0;
  let mutationPending = false;

  // Загрузка списка с текущими фильтрами. Пока категорий нет, выполняется
  // начальная параллельная загрузка; затем — только GET /tasks.
  async function loadCurrentTasks() {
    // 1) отменить предыдущий запрос; 2) запомнить номер этого запуска.
    loadController?.abort();
    const controller = new AbortController();
    loadController = controller;
    const sequence = ++loadSequence;
    const initial = categories === null;

    view.setListState("loading");
    try {
      const options = { signal: controller.signal };
      const result = initial
        ? await api.loadInitialData(filters, options)
        : await api.getTasks(filters, options);

      // Устаревший ответ (пришёл после более нового запуска) не применяется,
      // даже если источник проигнорировал сигнал отмены.
      if (sequence !== loadSequence) return;

      if (initial) {
        categories = result.categories;
        view.setCategories(categories);
      }
      tasks = result.tasks;
      view.setTasks(tasks, categories);
      view.setTotal(result.meta?.total ?? tasks.length);
      view.setListState(tasks.length > 0 ? "ready" : "empty");
    } catch (error) {
      if (sequence !== loadSequence || controller.signal.aborted || isAbort(error)) return;
      view.setListState("error", messageForError(error));
    } finally {
      if (loadController === controller) loadController = null;
    }
  }

  // Общая схема мутации: блокировка → запрос → сообщение → повторный GET → разблокировка.
  async function runMutation(action, successMessage, onError) {
    if (mutationPending) return;
    mutationPending = true;
    view.setMutationPending(true);
    try {
      await action();
      view.notify(successMessage, "success");
      await loadCurrentTasks();
    } catch (error) {
      onError?.(error);
      view.notify(messageForError(error), "error");
    } finally {
      mutationPending = false;
      view.setMutationPending(false);
    }
  }

  function resetForm() {
    editingId = null;
    view.showFormErrors({});
    view.setFormTask(null);
  }

  function findTask(id) {
    return tasks.find((task) => task.id === id);
  }

  function start(initialFilters = {}) {
    filters = { ...initialFilters };
    return loadCurrentTasks();
  }

  function applyFilters(nextFilters = {}) {
    filters = { ...nextFilters };
    return loadCurrentTasks();
  }

  function refresh() {
    return loadCurrentTasks();
  }

  async function submit(draft) {
    if (categories === null) {
      view.notify("Категории ещё не загружены. Повторите загрузку списка.", "error");
      return;
    }

    // Клиентская проверка: при ошибке запрос не отправляется.
    const result = validateDraft(draft, categories);
    if (!result.valid) {
      view.showFormErrors(result.errors);
      return;
    }
    view.showFormErrors({});

    const id = editingId;
    const showServerErrors = (error) => {
      // Сервер проверяет данные повторно; его ошибки полей показываются у формы.
      if (error instanceof ApiError && error.code === "VALIDATION_ERROR" && error.details) {
        view.showFormErrors(error.details);
      }
    };

    if (id === null) {
      await runMutation(async () => {
        const created = await api.createTask(result.value);
        resetForm();
        return created;
      }, "Задача создана.", showServerErrors);
    } else {
      await runMutation(async () => {
        await api.updateTask(id, result.value);
        resetForm();
      }, `Задача № ${id} изменена.`, showServerErrors);
    }
  }

  function beginEdit(id) {
    const task = findTask(id);
    if (!task) {
      view.notify("Задача отсутствует в текущем списке. Обновите список.", "error");
      return;
    }
    editingId = task.id;
    view.showFormErrors({});
    view.setFormTask(task);
  }

  function cancelEdit() {
    resetForm();
  }

  function toggleTask(id) {
    const task = findTask(id);
    if (!task) {
      view.notify("Задача отсутствует в текущем списке. Обновите список.", "error");
      return Promise.resolve();
    }
    const completed = !task.completed;
    return runMutation(
      () => api.setTaskCompleted(id, completed),
      completed ? `Задача № ${id} выполнена.` : `Задача № ${id} возвращена в работу.`,
    );
  }

  function deleteTask(id) {
    return runMutation(async () => {
      await api.deleteTask(id);
      if (editingId === id) resetForm();
    }, `Задача № ${id} удалена.`);
  }

  function resetData() {
    return runMutation(async () => {
      await api.resetDemoData();
      resetForm();
    }, "Учебные данные восстановлены.");
  }

  function destroy() {
    loadSequence += 1;
    loadController?.abort();
    loadController = null;
  }

  return {
    start,
    applyFilters,
    refresh,
    submit,
    beginEdit,
    cancelEdit,
    toggleTask,
    deleteTask,
    resetData,
    destroy,
  };
}
