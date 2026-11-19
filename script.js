// Практикум 11 (частина 2): збереження записів в IndexedDB (сховище moodEntries) + одноразова міграція з localStorage.
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

// ===== Практикум 11: localStorage (залишено для одноразової міграції) =====

// Ключ, під яким старі записи зберігались у localStorage (частина 1)
const STORAGE_KEY = 'moodEntries';

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

// Vue.reactive робить масив реактивним; спочатку порожній — його заповнює initStorage() з IndexedDB
const moodRecords = Vue.reactive([]);

// ===== Практикум 11: IndexedDB =====

const DB_NAME = 'MoodTrackerDB';
const STORE_NAME = 'moodEntries';

// Відкриває базу; onupgradeneeded створює сховище moodEntries (keyPath id, autoIncrement)
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Додає або оновлює запис (put); повертає ключ id (для нового запису його видає autoIncrement)
async function addItem(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const request = tx.objectStore(STORE_NAME).put(item);
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
  });
}

// Оновлення наявного запису — той самий put з тим самим id
const updateItem = addItem;

// Повертає всі записи зі сховища (readonly-транзакція)
async function getAllItems() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Видаляє запис за id (readwrite-транзакція)
async function deleteItem(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Одноразова міграція: якщо сховище порожнє, а в localStorage є записи — переносимо їх
// і ставимо прапорець migrated, щоб не повторювати перенесення при наступних запусках
async function migrateFromLocalStorage() {
  if (localStorage.getItem('migrated') === 'true') {
    return;
  }

  const saved = loadFromLocalStorage();
  const existing = await getAllItems();

  if (existing.length === 0 && saved.length > 0) {
    for (const record of saved) {
      await addItem(record);
    }
    console.log(`Перенесено записів із localStorage: ${saved.length}`);
  }

  localStorage.setItem('migrated', 'true');
}



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

// Показує повідомлення про помилку сховища (порожній рядок — ховає)
function showStorageError(message) {
  const box = document.querySelector('#storage-error');
  box.textContent = message;
  box.hidden = message === '';
}

// Видаляє запис за id: спочатку з IndexedDB, потім з масиву на екрані
async function removeRecord(id) {
  try {
    await deleteItem(id);
    const index = moodRecords.findIndex(record => record.id === id);
    if (index !== -1) {
      moodRecords.splice(index, 1);
    }
    updateSummary();
  } catch (error) {
    console.error(error);
    showStorageError('Не вдалося видалити запис.');
  }
}

// Надсилання форми: без перезавантаження сторінки
form.addEventListener('submit', async event => {
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

  try {
    // зберігаємо в IndexedDB; id видає autoIncrement
    const id = await addItem({ date, mood, note });

    // додаємо запис у реактивний масив, найновіші дати зверху
    moodRecords.push({ id, date, mood, note });
    moodRecords.sort((a, b) => b.date.localeCompare(a.date));
    updateSummary();

    // очищаємо форму та службові повідомлення
    form.reset();
    moodInput.setCustomValidity('');
    moodError.textContent = '';
    updateNoteCounter();
    formStatus.textContent = `Запис за ${date} додано та збережено`;
  } catch (error) {
    console.error(error);
    formStatus.textContent = 'Не вдалося зберегти запис.';
  }
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

// ===== Початкове завантаження з IndexedDB =====

// Мігрує старі дані, читає всі записи й заповнює реактивний масив;
// якщо IndexedDB недоступна (наприклад, у приватному режимі) — показуємо зрозуміле повідомлення
async function initStorage() {
  try {
    await migrateFromLocalStorage();
    const items = await getAllItems();
    items.sort((a, b) => b.date.localeCompare(a.date));
    moodRecords.splice(0, moodRecords.length, ...items);
    updateSummary();
  } catch (error) {
    console.error(error);
    showStorageError('Сховище IndexedDB недоступне: записи не будуть збережені.');
  }
}

initStorage();
