"use strict";

// Практическая работа № 1, задание 2. Типы и преобразования.
// Для каждого выражения сначала записан прогноз, затем проверка результата.

console.log("1) \"8\" + 2");
console.log("Значение:", "8" + 2, "| Тип результата:", typeof ("8" + 2));
// Прогноз: "82", string. Оператор + со строкой выполняет конкатенацию.

console.log("2) \"8\" - 2");
console.log("Значение:", "8" - 2, "| Тип результата:", typeof ("8" - 2));
// Прогноз: 6, number. Оператора вычитания для строк нет, значение приводится к числу.

console.log("3) Number(\"8\") + 2");
console.log("Значение:", Number("8") + 2, "| Тип результата:", typeof (Number("8") + 2));
// Прогноз: 10, number. Явное преобразование выполняется до сложения.

console.log("4) \"12\" > \"3\"");
console.log("Значение:", "12" > "3", "| Тип результата:", typeof ("12" > "3"));
// Прогноз: false, boolean. Две строки сравниваются посимвольно: "1" < "3".

console.log("5) 12 === \"12\"");
console.log("Значение:", 12 === "12", "| Тип результата:", typeof (12 === "12"));
// Прогноз: false, boolean. Строгое сравнение учитывает тип, преобразования нет.

console.log("6) Number(\"\")");
console.log("Значение:", Number(""), "| Тип результата:", typeof Number(""));
// Прогноз: 0, number. Пустая строка преобразуется в ноль.

console.log("7) Number(\"text\")");
console.log("Значение:", Number("text"), "| Тип результата:", typeof Number("text"));
// Прогноз: NaN, number. Нечисловая строка даёт NaN, тип остаётся number.

console.log("8) Boolean(\"false\")");
console.log("Значение:", Boolean("false"), "| Тип результата:", typeof Boolean("false"));
// Прогноз: true, boolean. Непустая строка всегда истинна, содержимое не разбирается.

console.log("9) typeof null");
const typeOfNull = typeof null;
console.log("Значение:", typeOfNull, "| Тип результата:", typeof typeOfNull);
// Прогноз: "object", string. Историческая особенность языка: typeof null даёт "object",
// а типом самого результата этого выражения будет строка.

console.log("10) typeof NaN");
const typeOfNaN = typeof NaN;
console.log("Значение:", typeOfNaN, "| Тип результата:", typeof typeOfNaN);
// Прогноз: "number", string. NaN имеет тип number, а тип результата typeof — строка.
