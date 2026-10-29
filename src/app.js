import { STORAGE_KEY, MAX_COUNT, initialState, loadState, changeCount, remaining, startTimer, pauseTimer, resetTimer, settleTimer, rollDie, recordRoll, formatTime, validMinutes } from './model.js';

const $ = id => document.getElementById(id);
let state = initialState();
try { state = loadState(localStorage.getItem(STORAGE_KEY)); }
catch { $('storage-warning').hidden = false; }
let rolling = false;
let installPrompt = null;
let registration = null;
let offlineReady = false;
let storageUnavailable = false;
let displayedTime = '';

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { storageUnavailable = true; $('storage-warning').hidden = false; }
}

function renderCount() {
  $('count').textContent = state.count.toLocaleString('en-US');
  $('count').classList.toggle('long', state.count >= 10000);
  $('decrement').disabled = state.count === 0;
  $('increment').disabled = state.count === MAX_COUNT;
  $('reset-count').disabled = state.count === 0;
}

function renderDice() {
  if (state.dice.length) {
    const face = state.dice[0];
    $('die').dataset.face = face;
    $('die').setAttribute('aria-label', `骰子点数：${face}`);
    $('dice-result').textContent = `${face} 点 · ${['', '一点勇气，刚刚好', '好事，成双', '三分幸运，七分行动', '四平八稳，也是一种好运', '给今天一个击掌', '六六大顺，继续向前'][face]}`;
  } else {
    delete $('die').dataset.face;
    $('die').setAttribute('aria-label', '还未掷骰子');
    $('dice-result').textContent = '今天的好运，从这一掷开始';
  }
  $('dice-history').replaceChildren(...state.dice.map(face => {
    const item = document.createElement('li');
    item.textContent = face;
    return item;
  }));
  $('rolls').textContent = `${state.rolls.toLocaleString('en-US')} 次`;
}

function renderTimer() {
  const milliseconds = remaining(state);
  const time = formatTime(milliseconds);
  if (displayedTime !== time) {
    $('timer').textContent = time;
    displayedTime = time;
  }
  $('timer-progress').style.strokeDashoffset = String(100 - Math.min(100, milliseconds / (state.minutes * 60000) * 100));
  const running = state.endsAt !== null;
  const completed = milliseconds <= 0;
  $('timer-status').textContent = running ? '专注中 · 慢慢来' : completed ? '完成了，休息一下吧' : milliseconds < state.minutes * 60000 ? '已暂停 · 随时继续' : '留一段时间给自己';
  const action = running ? '暂停专注' : completed ? '再专注一次' : milliseconds < state.minutes * 60000 ? '继续专注' : '开始专注';
  if ($('toggle-timer').dataset.action !== action) {
    $('toggle-timer').dataset.action = action;
    $('toggle-timer').replaceChildren(document.createTextNode(action + ' '));
    const symbol = document.createElement('span');
    symbol.textContent = running ? 'Ⅱ' : '▶';
    symbol.setAttribute('aria-hidden', 'true');
    $('toggle-timer').append(symbol);
  }
  $('sessions').textContent = state.sessions.toLocaleString('en-US');
  document.querySelectorAll('[data-minutes]').forEach(button => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.minutes) === state.minutes));
    button.disabled = running;
  });
  const custom = ![5, 25, 45].includes(state.minutes);
  $('custom-duration').textContent = custom ? `${state.minutes} 分钟` : '自定义';
  $('custom-duration').setAttribute('aria-pressed', String(custom));
  $('custom-duration').disabled = running;
  $('completion').hidden = !completed;
  document.title = running ? `${time} · 专注中 · Pocket Lab` : 'Duo Pocket Lab · 口袋实验室';
}

function tick() {
  if (settleTimer(state)) persist();
  renderTimer();
}

$('increment').addEventListener('click', () => { changeCount(state, 1); persist(); renderCount(); });
$('decrement').addEventListener('click', () => { changeCount(state, -1); persist(); renderCount(); });
$('reset-count').addEventListener('click', () => $('reset-dialog').showModal());
$('confirm-reset').addEventListener('click', () => { state.count = 0; persist(); renderCount(); $('reset-dialog').close(); });

$('roll').addEventListener('click', () => {
  if (rolling) return;
  rolling = true;
  $('roll').disabled = true;
  $('die').classList.add('rolling');
  // Save immediately so backgrounding the app cannot lose a roll.
  recordRoll(state, rollDie());
  persist();
  renderDice();
  setTimeout(() => {
    rolling = false;
    $('roll').disabled = false;
    $('die').classList.remove('rolling');
  }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 430);
});

$('toggle-timer').addEventListener('click', () => {
  if (state.endsAt !== null) pauseTimer(state);
  else startTimer(state);
  persist();
  renderTimer();
});
$('reset-timer').addEventListener('click', () => { resetTimer(state); persist(); renderTimer(); });
document.querySelectorAll('[data-minutes]').forEach(button => button.addEventListener('click', () => {
  resetTimer(state, Number(button.dataset.minutes));
  persist(); renderTimer();
}));
$('custom-duration').addEventListener('click', () => {
  $('minutes-input').value = state.minutes;
  $('duration-dialog').showModal();
});
$('duration-form').addEventListener('submit', event => {
  event.preventDefault();
  const minutes = Number($('minutes-input').value);
  if (!validMinutes(minutes)) return;
  resetTimer(state, minutes); persist(); renderTimer();
  $('duration-dialog').close();
});

document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $(button.dataset.close).close()));
$('install').addEventListener('click', () => $('install-dialog').showModal());
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault(); installPrompt = event; $('native-install').hidden = false;
});
$('native-install').addEventListener('click', async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null; $('native-install').hidden = true;
});
window.addEventListener('appinstalled', () => { installPrompt = null; $('native-install').hidden = true; $('install-dialog').close(); });

function renderConnection() {
  $('connection').classList.toggle('ready', offlineReady);
  $('connection-text').textContent = offlineReady ? (navigator.onLine ? '离线已就绪' : '离线使用中') : navigator.onLine ? '联网使用 · 离线准备中' : '当前离线 · 尚未完成缓存';
}
window.addEventListener('online', renderConnection);
window.addEventListener('offline', renderConnection);

// A single saved state also keeps multiple tabs consistent. The latest action wins.
window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  state = loadState(event.newValue);
  if (settleTimer(state)) persist();
  renderCount(); renderDice(); renderTimer();
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
window.addEventListener('pageshow', tick);

async function setupOffline() {
  if (!('serviceWorker' in navigator)) {
    $('connection-text').textContent = '当前浏览器不支持离线缓存';
    return;
  }
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // First installation claims the page too; only reload for a requested update.
    if (reloading) window.location.reload();
  });
  function showUpdate() { $('update-notice').hidden = false; }
  $('update-app').addEventListener('click', () => {
    if (!registration?.waiting) return;
    persist(); reloading = true;
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  });
  try {
    registration = await navigator.serviceWorker.register('./sw.js');
    if (registration.waiting) showUpdate();
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate();
      });
    });
    await navigator.serviceWorker.ready;
    offlineReady = true;
    renderConnection();
  } catch {
    $('connection-text').textContent = navigator.onLine ? '联网使用 · 离线缓存暂不可用' : '当前离线 · 尚未完成缓存';
  }
}

renderCount(); renderDice(); tick(); persist(); renderConnection();
if (storageUnavailable) $('storage-warning').hidden = false;
setInterval(tick, 250);
setupOffline();
