"use strict";

// Практическая работа № 1, задание 3. Вариант 4: totalTasks = 20, completedTasks = 11.
// Алгоритм работает для любого допустимого набора, а не только для своего варианта.

const totalTasks = 20;
const completedTasks = 11;

const MAX_TASKS = 1000;

function isTaskCount(value) {
  return typeof value === "number" && Number.isInteger(value);
}

function validate(total, completed) {
  if (!isTaskCount(total) || !isTaskCount(completed)) {
    return "Ошибка: количество задач должно быть целым числом.";
  }
  if (total < 0 || total > MAX_TASKS) {
    return `Ошибка: общее количество задач должно быть от 0 до ${MAX_TASKS}.`;
  }
  if (completed < 0) {
    return "Ошибка: количество выполненных задач не может быть отрицательным.";
  }
  if (completed > total) {
    return "Ошибка: выполнено больше задач, чем существует.";
  }
  return null;
}

const error = validate(totalTasks, completedTasks);

if (error !== null) {
  // При недопустимых данных обычная сводка не выводится.
  console.log(error);
} else if (totalTasks === 0 && completedTasks === 0) {
  console.log("Задач пока нет");
} else {
  const remainingTasks = totalTasks - completedTasks;
  const progress = (completedTasks / totalTasks) * 100;

  // Статус определяется по исходным количествам, а не по округлённому проценту.
  let status = "В работе";
  if (completedTasks === 0) {
    status = "Не начато";
  } else if (completedTasks === totalTasks) {
    status = "Завершено";
  }

  console.log(`Всего задач: ${totalTasks}`);
  console.log(`Выполнено: ${completedTasks}`);
  console.log(`Осталось: ${remainingTasks}`);
  console.log(`Прогресс: ${progress.toFixed(1)}%`);
  console.log(`Статус: ${status}`);
}
