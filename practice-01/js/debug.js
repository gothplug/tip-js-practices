"use strict";

// Практическая работа № 1, задание 5. Исправленная версия программы.
// Исходный вариант и разбор ошибок приведены в README, раздел 7.

const plannedText = "8";
const completedText = "3";
const additionalText = "2";

// Ошибка была в сложении строк: "3" + "2" давало "32", а не 5.
const completedTotal = Number(completedText) + Number(additionalText);
const remainingTasks = plannedText - completedTotal;

console.log("Выполнено:", completedTotal);
console.log("Осталось:", remainingTasks);

let controlSum = 0;

// Ошибка была в границе цикла: taskNumber < 4 не включало четвёртую задачу.
for (let taskNumber = 1; taskNumber <= 4; taskNumber += 1) {
  controlSum += taskNumber;
}

console.log("Контрольная сумма:", controlSum);
