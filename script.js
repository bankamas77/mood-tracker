// Практикум 11 (частина 1): збереження записів у localStorage (JSON.stringify / JSON.parse).
// Практикум 10: Vue 3 (CDN), список рендерить компонент MoodEntry.
// Практикум 6: основи JavaScript. Результат виводиться в консоль браузера.

// Перевірка підключення файлу
console.log('script.js підключено');

// ===== Дані варіанта: записи настрою (mood — число від 1 до 5) =====
// Початкові (демонстраційні) записи; також використовуються в демонстрації практикуму 6
const seedRecords = [
  { id: 5, date: '2026-09-23', mood: 5, note: 'Гарний день, все встигла зробити.' },
  { id: 4, date: '2026-09-22', mood: 3, note: 'Багато навчання, мало сну.' },
  { id: 3, date: '2026-09-21', mood: 4, note: 'Звичайний день.' },
  { id: 2, date: '2026-09-20', mood: 2, note: 'Дощ і нічого не хотілося.' },
  { id: 1, date: '2026-09-19', mood: 1, note: 'Не вийшло з першого разу, дратувало.' },
];

// ===== Практикум 11: localStorage =====

// Ключ, під яким масив записів зберігається в localStorage
const STORAGE_KEY = 'moodEntries';

// Зберігає масив записів у localStorage (тільки рядки, тому JSON.stringify)
function saveToLocalStorage(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// Читає масив записів із localStorage; при пошкоджених даних повертає порожній масив
function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Пошкоджені дані в localStorage:', error);
    return [];
  }
}

// Перший запуск (ключа ще немає) — зберігаємо демонстраційні записи, далі беремо збережене
if (localStorage.getItem(STORAGE_KEY) === null) {
  saveToLocalStorage(seedRecords);
}

// Vue.reactive робить масив реактивним: будь-яка зміна (push, sort) автоматично оновлює список
const moodRecords = Vue.reactive(loadFromLocalStorage());



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
console.log(`Кількість записів: ${seedRecords.length}`);
printRecords(seedRecords);

const averageMood = calcAverageMood(seedRecords);
console.log(`Середній настрій: ${averageMood}`);
console.log(`Висновок: ${classifyWeek(averageMood)}`);

// Потрійний оператор: чи був останній запис кращим за середнє
const lastMood = seedRecords[0].mood;
const comparison = lastMood > averageMood ? 'вище за середнє' : 'не вище за середнє';
console.log(`Останній запис (${moodToLabel(lastMood)}) — ${comparison}`);

// Виклик стрілкової функції з реальними даними
console.log(`Середній настрій словами: ${moodToLabel(Math.round(averageMood))}`);

// ===== Практикум 7: маніпуляція DOM =====
// Функцію renderMoodHistory (createElement + append) видалено: для списку записів
// її замінено Vue-компонентом MoodEntry (практикум 10). Статичної картки в HTML більше немає.

// ===== Практикум 10: Vue-компонент MoodEntry =====

// Компонент одного запису: отримує дані лише через props і не звертається до глобальних змінних
const MoodEntry = {
  props: ['id', 'date', 'mood', 'note'],
  emits: ['remove'],
  computed: {
    // похідне значення: емодзі обчислюється зі значення mood (1–5), окремо не зберігається
    emoji() {
      const emojis = ['❔', '😠', '😢', '😴', '😌', '😄'];
      return emojis[this.mood] || emojis[0];
    },
    // назва настрою за числом
    label() {
      const names = ['невідомо', 'Роздратований', 'Сумний', 'Втомлений', 'Спокійний', 'Радісний'];
      return names[this.mood] || names[0];
    },
    // клас рівня настрою (good / ok / hard)
    level() {
      return this.mood >= 4 ? 'good' : this.mood === 3 ? 'ok' : 'hard';
    },
  },
  template: `
    <article class="record" :class="['mood-' + mood, level]" :data-mood="mood">
      <h3>{{ date }}</h3>
      <p class="mood-badge">{{ emoji }} Настрій: {{ mood }} — {{ label }}</p>
      <p>{{ note || 'Без нотатки' }}</p>
      <button type="button" class="delete-btn" @click="$emit('remove', id)">Видалити</button>
    </article>
  `,
};

// Кореневий застосунок: records — той самий реактивний масив moodRecords
Vue.createApp({
  components: { MoodEntry },
  data() {
    return { records: moodRecords };
  },
  methods: {
    // подія remove від дочірнього компонента: видаляємо запис за id
    removeRecord,
  },
}).mount('#mood-history');

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

// Видаляє запис за id і зберігає масив у localStorage
function removeRecord(id) {
  const index = moodRecords.findIndex(record => record.id === id);
  if (index !== -1) {
    moodRecords.splice(index, 1);
    saveToLocalStorage(moodRecords);
    updateSummary();
  }
}

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

  // унікальний id: на одиницю більший за найбільший наявний
  const id = Math.max(0, ...moodRecords.map(record => record.id)) + 1;

  // додаємо новий запис у масив, найновіші дати зверху
  moodRecords.push({ id, date, mood, note });
  moodRecords.sort((a, b) => b.date.localeCompare(a.date));

  // зберігаємо після кожної зміни стану (як і в обробниках практикуму 8)
  saveToLocalStorage(moodRecords);

  // список перемальовує Vue сам; оновлюємо підсумок
  updateSummary();

  // очищаємо форму та службові повідомлення
  form.reset();
  moodInput.setCustomValidity('');
  moodError.textContent = '';
  updateNoteCounter();
  formStatus.textContent = `Запис за ${date} додано та збережено`;
});

// ===== Практикум 9: запит до API (fetch / async / await) =====

// API: JSONPlaceholder, коментарі до посту №1 (мок-дані):
// name — заголовок запису, body — текст нотатки, email — автор
// https://jsonplaceholder.typicode.com/comments?postId=1
const API_URL = 'https://jsonplaceholder.typicode.com/comments?postId=1';

const apiList = document.querySelector('#api-list');
const apiLoading = document.querySelector('#api-loading');
const apiError = document.querySelector('#api-error');
const reloadBtn = document.querySelector('#reload-btn');

// Робить першу літеру великою (name в API приходить з малої)
const capitalize = text => text.charAt(0).toUpperCase() + text.slice(1);

// Показує або ховає стан завантаження і блокує кнопку «Оновити»
function showLoading(isLoading) {
  apiLoading.hidden = !isLoading;
  reloadBtn.disabled = isLoading;
}

// Показує зрозуміле повідомлення про помилку (порожній рядок — ховає)
function showError(message) {
  apiError.textContent = message;
  apiError.hidden = message === '';
}

// Рендер списку записів із сервера (той самий підхід, що й у практикумі 7)
function renderApiRecords(comments) {
  apiList.innerHTML = '';

  for (const comment of comments) {
    const card = document.createElement('article');
    card.classList.add('record', 'api-record');

    const title = document.createElement('h3');
    title.textContent = capitalize(comment.name);

    const author = document.createElement('p');
    author.classList.add('mood-badge');
    author.textContent = comment.email;

    const note = document.createElement('p');
    note.textContent = comment.body;

    card.append(title, author, note);
    apiList.append(card);
  }
}

// Завантажує записи з API; обробляє помилки HTTP та мережі
async function loadComments() {
  showLoading(true);
  showError('');

  try {
    const response = await fetch(API_URL);

    // fetch не вважає 404/500 помилкою, тому перевіряємо статус вручну
    if (!response.ok) {
      throw new Error(`Сервер відповів кодом ${response.status}`);
    }

    const data = await response.json();

    if (data.length === 0) {
      apiList.innerHTML = '';
      showError('Записів поки немає.');
      return;
    }

    renderApiRecords(data);
  } catch (error) {
    apiList.innerHTML = '';
    showError('Записи тимчасово недоступні');
    console.error(error);
  } finally {
    showLoading(false);
  }
}

// Кнопка «Оновити» повторює запит без перезавантаження сторінки
reloadBtn.addEventListener('click', loadComments);

// Перше завантаження при відкритті сторінки
loadComments();
