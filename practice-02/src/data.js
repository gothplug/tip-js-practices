// Общий контрольный набор. Для своего варианта ниже предусмотрен отдельный массив.
// Идентификатор задачи не совпадает с её индексом в массиве.
export const demoTasks = [
  { id: 1, title: "Изучить функции", completed: true, priority: "medium" },
  { id: 4, title: "Подготовить модель задач", completed: false, priority: "high" },
  { id: 7, title: "Проверить методы массивов", completed: false, priority: "low" },
  { id: 10, title: "Оформить README", completed: true, priority: "medium" },
];

// Индивидуальный вариант. Номер в журнале N = 20: ((20 - 1) % 8) + 1 = 4.
// Тема варианта 4 — «Подготовка семинара». Идентификаторы заданы методичкой:
// 11, 23, 37, 41, 58, 64. Изначально выполнены первые K = 3 задачи.
export const variantNumber = 4;
export const variantTasks = [
  { id: 11, title: "Определить тему семинара", completed: true, priority: "medium" },
  { id: 23, title: "Собрать материалы для доклада", completed: true, priority: "high" },
  { id: 37, title: "Подготовить слайды презентации", completed: true, priority: "low" },
  { id: 41, title: "Составить план выступления", completed: false, priority: "medium" },
  { id: 58, title: "Проверить оборудование в аудитории", completed: false, priority: "low" },
  { id: 64, title: "Разослать приглашения участникам", completed: false, priority: "high" },
];
