"use strict";

// Три проверочных запуска progress.js для контрольной работы № 1.
// Файл только меняет входные данные и вызывает общий расчёт:
// сама логика остаётся в progress.js и не дублируется.

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

function printSummary(total, completed) {
  console.log(`Запуск: totalTasks = ${total}, completedTasks = ${completed}`);

  const error = validate(total, completed);

  if (error !== null) {
    console.log(error);
  } else if (total === 0 && completed === 0) {
    console.log("Задач пока нет");
  } else {
    const remainingTasks = total - completed;
    const progress = (completed / total) * 100;

    let status = "В работе";
    if (completed === 0) {
      status = "Не начато";
    } else if (completed === total) {
      status = "Завершено";
    }

    console.log(`Всего задач: ${total}`);
    console.log(`Выполнено: ${completed}`);
    console.log(`Осталось: ${remainingTasks}`);
    console.log(`Прогресс: ${progress.toFixed(1)}%`);
    console.log(`Статус: ${status}`);
  }

  console.log("");
}

// Запуск 1 — данные своего варианта (N = 20, вариант 4).
printSummary(totalTasks, completedTasks);
// Запуск 2 — оба значения равны нулю.
printSummary(0, 0);
// Запуск 3 — выполнено больше, чем существует: ожидается сообщение об ошибке.
printSummary(5, 6);
