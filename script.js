// 今日の日付をデフォルトにセット
const dateInput = document.getElementById('date-input');
const today = new Date().toISOString().split('T')[0];
dateInput.value = today;

// 日記を読み込む
function loadEntries() {
  const data = localStorage.getItem('diary-entries');
  return data ? JSON.parse(data) : [];
}

// 日記を保存する
function saveEntries(entries) {
  localStorage.setItem('diary-entries', JSON.stringify(entries));
}

// 日付を日本語表示に変換
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${year}年${parseInt(month)}月${parseInt(day)}日`;
}

// 一覧を画面に表示する
function renderEntries() {
  const entries = loadEntries();
  const list = document.getElementById('entries-list');

  if (entries.length === 0) {
    list.innerHTML = '<p class="empty-message">まだ日記がありません。最初の一行を書いてみましょう！</p>';
    return;
  }

  // 新しい順に並べる
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  list.innerHTML = sorted.map(entry => `
    <div class="entry-card">
      <div class="entry-header">
        <div class="entry-meta">
          <span class="entry-date">${formatDate(entry.date)}</span>
          ${entry.title ? `<span class="entry-title">${escapeHtml(entry.title)}</span>` : ''}
        </div>
        <button class="delete-btn" onclick="deleteEntry('${entry.id}')" title="削除">✕</button>
      </div>
      <div class="entry-content">${escapeHtml(entry.content)}</div>
    </div>
  `).join('');
}

// XSS対策：HTMLエスケープ
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 保存ボタンの処理
document.getElementById('save-btn').addEventListener('click', () => {
  const date = dateInput.value;
  const title = document.getElementById('title-input').value.trim();
  const content = document.getElementById('content-input').value.trim();

  if (!content) {
    alert('日記の内容を入力してください。');
    return;
  }

  const entries = loadEntries();
  entries.push({
    id: Date.now().toString(),
    date,
    title,
    content
  });
  saveEntries(entries);

  // 入力欄をリセット
  document.getElementById('title-input').value = '';
  document.getElementById('content-input').value = '';
  dateInput.value = today;

  renderEntries();
});

// 削除処理
function deleteEntry(id) {
  if (!confirm('この日記を削除しますか？')) return;
  const entries = loadEntries().filter(e => e.id !== id);
  saveEntries(entries);
  renderEntries();
}

// 初回表示
renderEntries();
