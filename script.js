// Практикум 6: основи JavaScript. Результат виводиться в консоль браузера.

// Перевірка підключення файлу
console.log('script.js підключено');

// ===== Дані варіанта: записи настрою (mood — число від 1 до 5) =====
const moodRecords = [
  { date: '2026-09-23', mood: 5, note: 'Гарний день, все встигла зробити.' },
  { date: '2026-09-22', mood: 3, note: 'Багато навчання, мало сну.' },
  { date: '2026-09-21', mood: 4, note: 'Звичайний день.' },
  { date: '2026-09-20', mood: 2, note: 'Дощ і нічого не хотілося.' },
  { date: '2026-09-19', mood: 1, note: 'Не вийшло з першого разу, дратувало.' },
];

// Назви рівнів настрою (індекс масиву = рівень, 0 не використовується)
const moodNames = ['', 'Роздратований', 'Сумний', 'Втомлений', 'Спокійний', 'Радісний'];

// Стрілкова функція: перетворює числовий рівень настрою на текстову назву
const moodToLabel = mood => (mood >= 1 && mood <= 5 ? moodNames[mood] : 'невідомо');

// Рахує середній настрій за період класичним циклом for
function calcAverageMood(records) {
  if (records.length === 0) {
    return 0;
  }
  let sum = 0; // накопичувач суми — змінюється, тому let
  for (let i = 0; i < records.length; i++) {
    sum += records[i].mood;
  }
  return sum / records.length;
}

// Виводить кожен запис у консоль (цикл for...of)
function printRecords(records) {
  for (const record of records) {
    console.log(`${record.date}: ${record.mood} — ${moodToLabel(record.mood)}`);
  }
}

// Класифікує середній настрій за допомогою if / else if / else
function classifyWeek(average) {
  if (average >= 3.5) {
    return 'гарний тиждень';
  } else if (average >= 2.5) {
    return 'звичайний тиждень';
  } else {
    return 'важкий тиждень';
  }
}

// ===== Виконання =====
console.log(`Кількість записів: ${moodRecords.length}`);
printRecords(moodRecords);

const averageMood = calcAverageMood(moodRecords);
console.log(`Середній настрій: ${averageMood}`);
console.log(`Висновок: ${classifyWeek(averageMood)}`);

// Потрійний оператор: чи був останній запис кращим за середнє
const lastMood = moodRecords[0].mood;
const comparison = lastMood > averageMood ? 'вище за середнє' : 'не вище за середнє';
console.log(`Останній запис (${moodToLabel(lastMood)}) — ${comparison}`);

// Виклик стрілкової функції з реальними даними
console.log(`Середній настрій словами: ${moodToLabel(Math.round(averageMood))}`);

// ===== Практикум 7: маніпуляція DOM =====

// Видаляємо статичний приклад картки з розмітки
const staticExample = document.querySelector('.static-example');
if (staticExample) {
  staticExample.remove();
}

// Повертає клас за рівнем настрою (good / ok / hard)
const moodLevel = mood => (mood >= 4 ? 'good' : mood === 3 ? 'ok' : 'hard');

// Створює картку запису через createElement і додає її в контейнер
function renderMoodHistory(records) {
  const container = document.querySelector('#mood-history');
  container.innerHTML = '';

  for (const record of records) {
    const card = document.createElement('article');
    card.classList.add('record', `mood-${record.mood}`, moodLevel(record.mood));
    card.dataset.mood = record.mood;

    const title = document.createElement('h3');
    title.textContent = record.date;

    const badge = document.createElement('p');
    badge.classList.add('mood-badge');
    badge.textContent = `Настрій: ${record.mood} — ${moodToLabel(record.mood)}`;

    const note = document.createElement('p');
    note.textContent = record.note || 'Без нотатки';

    card.append(title, badge, note);
    container.append(card);
  }
}

renderMoodHistory(moodRecords);

// Оновлює підсумок через textContent за поточним масивом
function updateSummary() {
  const average = calcAverageMood(moodRecords);
  document.querySelector('#records-count').textContent = `Записів за тиждень: ${moodRecords.length}`;
  document.querySelector('.big-number').textContent = `${average.toFixed(1)} з 5`;
  document.querySelector('#avg-mood').textContent = `Середній настрій: ${moodToLabel(Math.round(average))}`;
}

updateSummary();

// ===== Практикум 8: події та форма =====

const form = document.querySelector('#mood-entry-form');
const dateInput = document.querySelector('#mood-date');
const moodInput = document.querySelector('#mood-value');
const noteInput = document.querySelector('#mood-note');
const moodError = document.querySelector('#mood-error');
const noteCounter = document.querySelector('#note-counter');
const formStatus = document.querySelector('#form-status');

// Сьогоднішня дата як значення за замовчуванням (формат РРРР-ММ-ДД)
const today = new Date().toLocaleDateString('en-CA');
dateInput.defaultValue = today;
dateInput.value = today;

// Перевірка настрою на подію input: ціле число від 1 до 5
function validateMood() {
  const value = moodInput.value;
  const number = Number(value);
  let message = '';

  if (value !== '' && (!Number.isInteger(number) || number < 1 || number > 5)) {
    message = 'Настрій має бути цілим числом від 1 до 5';
  }

  moodInput.setCustomValidity(message);
  moodError.textContent = message;
}

// Лічильник символів нотатки: оновлюється на кожне натискання клавіші
function updateNoteCounter() {
  const left = noteInput.maxLength - noteInput.value.length;
  noteCounter.textContent = `Залишилось символів: ${left}`;
  noteCounter.classList.toggle('near-limit', left <= 20);
}

moodInput.addEventListener('input', validateMood);
noteInput.addEventListener('input', updateNoteCounter);

// Надсилання форми: без перезавантаження сторінки
form.addEventListener('submit', event => {
  event.preventDefault();

  // зчитуємо значення полів
  const date = dateInput.value;
  const mood = Number(moodInput.value);
  const note = noteInput.value.trim();

  // додаткова перевірка перед додаванням
  validateMood();
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // новий об'єкт у тому ж форматі, що й у масиві; додаємо в масив
  moodRecords.push({ date, mood, note });
  // найновіші дати зверху (рядки РРРР-ММ-ДД порівнюються коректно)
  moodRecords.sort((a, b) => b.date.localeCompare(a.date));

  // перемальовуємо список і підсумок
  renderMoodHistory(moodRecords);
  updateSummary();

  // очищаємо форму та службові повідомлення
  form.reset();
  moodInput.setCustomValidity('');
  moodError.textContent = '';
  updateNoteCounter();
  formStatus.textContent = `Запис за ${date} додано`;
});
