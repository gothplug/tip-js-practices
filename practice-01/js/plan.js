"use strict";

// Практическая работа № 1, задание 4. План выполнения оставшихся задач по дням.
// Вариант 4: totalTasks = 20, completedTasks = 11, dailyLimit = 6.

const totalTasks = 20;
const completedTasks = 11;
const dailyLimit = 6;

const MAX_TASKS = 1000;

// Проверки те же, что в задании 3.
function validate(total, completed, limit) {
  if (
    typeof total !== "number" ||
    typeof completed !== "number" ||
    typeof limit !== "number" ||
    !Number.isInteger(total) ||
    !Number.isInteger(completed) ||
    !Number.isInteger(limit)
  ) {
    return "Ошибка: все количества должны быть целыми числами.";
  }
  if (total < 0 || total > MAX_TASKS) {
    return `Ошибка: общее количество задач должно быть от 0 до ${MAX_TASKS}.`;
  }
  if (completed < 0 || completed > total) {
    return "Ошибка: количество выполненных задач не может быть отрицательным или больше общего.";
  }
  // Проверка дневной нормы обязательна даже при отсутствии оставшихся задач.
  if (limit < 1 || limit > MAX_TASKS) {
    return `Ошибка: дневная норма должна быть целым числом от 1 до ${MAX_TASKS}.`;
  }
  return null;
}

const error = validate(totalTasks, completedTasks, dailyLimit);

if (error !== null) {
  console.log(error);
} else {
  let remaining = totalTasks - completedTasks;
  let dayNumber = 0;

  console.log(`Осталось задач: ${remaining}`);

  if (remaining === 0) {
    console.log("Все задачи уже выполнены.");
  }

  // В учебной модели каждый день рабочий, новая норма не превышается,
  // а за последний день нельзя выполнить больше, чем осталось.
  while (remaining > 0) {
    dayNumber += 1;
    const doneToday = Math.min(dailyLimit, remaining);
    remaining -= doneToday;
    console.log(`День ${dayNumber}: выполнено ${doneToday}, осталось ${remaining}`);
  }

  console.log(`Потребуется дней: ${dayNumber}`);
}
