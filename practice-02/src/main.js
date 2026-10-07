import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
  createTask,
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";

// Снимок исходных данных: по нему проверяется, что операции не изменяют входные массивы.
const demoSnapshot = JSON.stringify(demoTasks);
const variantSnapshot = JSON.stringify(variantTasks);

function printTasks(label, tasks) {
  console.log(`\n${label}`);
  console.table(tasks);
}

function printSummary(label, tasks) {
  const { total, completed, pending, progress } = getTaskStats(tasks);

  console.log(`${label}: всего ${total}; выполнено ${completed}; осталось ${pending}`);
  if (total === 0) {
    console.log("Задач пока нет");
  } else {
    console.log(`Прогресс: ${progress.toFixed(1)}%`);
  }
}

// Применяет операцию к состоянию: при успехе заменяет массив, при отказе сохраняет прежний.
function apply(label, state, result) {
  if (result.ok) {
    console.log(`${label}: успех, в списке ${result.tasks.length} записей`);
    return result.tasks;
  }

  console.log(`${label}: отказ — ${result.error}. Состояние не изменено.`);
  return state;
}

// ---------------------------------------------------------------------------
// Общий сценарий из раздела 6.5: общий контрольный набор demoTasks.
// ---------------------------------------------------------------------------
console.log("=== Общий сценарий (demoTasks) ===");

let currentTasks = demoTasks;

printTasks("Исходные задачи:", currentTasks);
console.log("Названия задач:", getTaskTitles(currentTasks));

const initialPending = getPendingTasks(currentTasks).map((task) => task.id);
console.log("Идентификаторы невыполненных задач:", initialPending);
printSummary("Исходная сводка", currentTasks);

currentTasks = apply(
  "1. Добавление задачи id = 20",
  currentTasks,
  addTask(currentTasks, 20, "Добавить проверку", "high"),
);
printSummary("Сводка после добавления", currentTasks);

currentTasks = apply(
  "2. Выполнение задачи id = 4",
  currentTasks,
  setTaskCompleted(currentTasks, 4, true),
);
printSummary("Сводка после изменения статуса", currentTasks);

currentTasks = apply(
  "3. Переименование задачи id = 10",
  currentTasks,
  renameTask(currentTasks, 10, "Подготовить инструкцию запуска"),
);
printSummary("Сводка после переименования", currentTasks);

currentTasks = apply(
  "4. Удаление задачи id = 7",
  currentTasks,
  removeTask(currentTasks, 7),
);
printSummary("Сводка после удаления", currentTasks);

printTasks("Итоговые задачи:", currentTasks);
console.log(
  "Идентификаторы итогового массива:",
  currentTasks.map((task) => task.id),
);
console.log(
  "Единственная невыполненная задача:",
  getPendingTasks(currentTasks).map((task) => task.id),
);

// Обработанные отказы: состояние после них не меняется.
const rejectedDuplicate = addTask(currentTasks, 20, "Повторный идентификатор", "low");
console.log(`\nОтказ 1 (повторяющийся id = 20): ${rejectedDuplicate.error}`);
const rejectedStatus = setTaskCompleted(currentTasks, 4, "true");
console.log(`Отказ 2 (статус строкой "true"): ${rejectedStatus.error}`);
const rejectedMissing = removeTask(currentTasks, 777);
console.log(`Отказ 3 (отсутствующая задача id = 777): ${rejectedMissing.error}`);

console.log(
  "Массив после отказов не изменился:",
  currentTasks.map((task) => task.id).join(", "),
);
console.log("Исходный demoTasks сохранился:", JSON.stringify(demoTasks) === demoSnapshot);

// ---------------------------------------------------------------------------
// Отдельный сценарий индивидуального варианта (раздел 7).
// ---------------------------------------------------------------------------
console.log(`\n=== Сценарий варианта ${variantNumber} (variantTasks) ===`);

let variantState = variantTasks;

printTasks("Исходные задачи варианта:", variantState);
printSummary("Исходная сводка варианта", variantState);

variantState = apply(
  "1. Добавление задачи id = 80",
  variantState,
  addTask(variantState, 80, "Провести репетицию семинара", "high"),
);
printSummary("Сводка после добавления", variantState);

variantState = apply(
  "2. Выполнение задачи id = 11",
  variantState,
  setTaskCompleted(variantState, 11, true),
);

variantState = apply(
  "3. Переименование задачи id = 23",
  variantState,
  renameTask(variantState, 23, "Собрать материалы для доклада и раздатки"),
);

variantState = apply(
  "4. Удаление задачи id = 37",
  variantState,
  removeTask(variantState, 37),
);

const repeatedAdd = addTask(variantState, 80, "Повторная задача", "low");
console.log(`5. Повторное добавление id = 80: отказ — ${repeatedAdd.error}`);

printTasks("Итоговые задачи варианта:", variantState);
printSummary("Итоговая сводка варианта", variantState);
console.log(
  "Исходный variantTasks сохранился:",
  JSON.stringify(variantTasks) === variantSnapshot,
);

// Демонстрация создания задачи без участия списка.
const created = createTask(99, "  Проверить терминологию  ", undefined);
console.log(
  "\ncreateTask(99, ...) без приоритета:",
  created.ok ? created.task : created.error,
);
console.log(
  "findTaskById(demoTasks, 4) находит задачу с id 4:",
  findTaskById(demoTasks, 4)?.title,
);
