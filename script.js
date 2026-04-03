import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDX5m9hzA2iFvXkTvhVshdVGU14r0S800w",
  authDomain: "diary-app-19dcf.firebaseapp.com",
  projectId: "diary-app-19dcf",
  storageBucket: "diary-app-19dcf.firebasestorage.app",
  messagingSenderId: "849843717278",
  appId: "1:849843717278:web:72f47f8f4871c1a804e78f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 今日の日付をデフォルトにセット
const dateInput = document.getElementById('date-input');
const today = new Date().toISOString().split('T')[0];
dateInput.value = today;

// 編集中のIDを管理
let editingId = null;
let currentUser = null;

// ログイン状態を監視
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');
    renderEntries();
  } else {
    currentUser = null;
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('app-screen').classList.add('hidden');
  }
});

// 新規登録
document.getElementById('signup-btn').addEventListener('click', async () => {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const errorEl = document.getElementById('auth-error');
  errorEl.textContent = '';
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (e) {
    errorEl.textContent = getErrorMessage(e.code);
  }
});

// ログイン
document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const errorEl = document.getElementById('auth-error');
  errorEl.textContent = '';
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    errorEl.textContent = getErrorMessage(e.code);
  }
});

// ログアウト
document.getElementById('logout-btn').addEventListener('click', async () => {
  await signOut(auth);
});

// エラーメッセージを日本語に
function getErrorMessage(code) {
  switch (code) {
    case 'auth/invalid-email': return 'メールアドレスの形式が正しくありません。';
    case 'auth/user-not-found': return 'このメールアドレスは登録されていません。';
    case 'auth/wrong-password': return 'パスワードが間違っています。';
    case 'auth/email-already-in-use': return 'このメールアドレスはすでに使用されています。';
    case 'auth/weak-password': return 'パスワードは6文字以上にしてください。';
    case 'auth/invalid-credential': return 'メールアドレスまたはパスワードが間違っています。';
    default: return 'エラーが発生しました。もう一度お試しください。';
  }
}

// 日付を日本語表示に変換
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${year}年${parseInt(month)}月${parseInt(day)}日`;
}

// XSS対策：HTMLエスケープ
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 一覧を画面に表示する
async function renderEntries() {
  if (!currentUser) return;
  const list = document.getElementById('entries-list');
  list.innerHTML = '<p class="empty-message">読み込み中...</p>';

  const entriesRef = collection(db, 'users', currentUser.uid, 'entries');
  const q = query(entriesRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    list.innerHTML = '<p class="empty-message">まだ日記がありません。最初の一行を書いてみましょう！</p>';
    return;
  }

  list.innerHTML = snapshot.docs.map(docSnap => {
    const entry = docSnap.data();
    const id = docSnap.id;
    return `
      <div class="entry-card">
        <div class="entry-header">
          <div class="entry-meta">
            <span class="entry-date">${formatDate(entry.date)}</span>
            ${entry.title ? `<span class="entry-title">${escapeHtml(entry.title)}</span>` : ''}
          </div>
          <div class="entry-actions">
            <button class="edit-btn" onclick="window.editEntry('${id}', '${entry.date}', \`${escapeHtml(entry.title || '')}\`, \`${escapeHtml(entry.content)}\`)">編集</button>
          </div>
        </div>
        <div class="entry-content">${escapeHtml(entry.content)}</div>
      </div>
    `;
  }).join('');
}

// 保存ボタンの処理
document.getElementById('save-btn').addEventListener('click', async () => {
  const date = dateInput.value;
  const title = document.getElementById('title-input').value.trim();
  const content = document.getElementById('content-input').value.trim();

  if (!content) {
    alert('日記の内容を入力してください。');
    return;
  }

  const entriesRef = collection(db, 'users', currentUser.uid, 'entries');

  if (editingId) {
    await updateDoc(doc(db, 'users', currentUser.uid, 'entries', editingId), { date, title, content });
    editingId = null;
    const saveBtn = document.getElementById('save-btn');
    saveBtn.textContent = '保存する';
    saveBtn.style.background = '';
    document.getElementById('delete-edit-btn').classList.add('hidden');
  } else {
    await addDoc(entriesRef, { date, title, content });
  }

  document.getElementById('title-input').value = '';
  document.getElementById('content-input').value = '';
  dateInput.value = today;

  renderEntries();
});

// 編集モードに入る
window.editEntry = (id, date, title, content) => {
  editingId = id;
  dateInput.value = date;
  document.getElementById('title-input').value = title;
  document.getElementById('content-input').value = content;

  const saveBtn = document.getElementById('save-btn');
  saveBtn.textContent = '更新する';
  saveBtn.style.background = '#4a7a5c';

  document.getElementById('delete-edit-btn').classList.remove('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 削除処理
window.deleteEntry = async (id) => {
  if (!confirm('この日記を削除しますか？')) return;
  await deleteDoc(doc(db, 'users', currentUser.uid, 'entries', id));
  renderEntries();
};

// 編集中の削除ボタン
document.getElementById('delete-edit-btn').addEventListener('click', async () => {
  if (!editingId) return;
  if (!confirm('この日記を削除しますか？')) return;
  await deleteDoc(doc(db, 'users', currentUser.uid, 'entries', editingId));
  editingId = null;
  document.getElementById('title-input').value = '';
  document.getElementById('content-input').value = '';
  dateInput.value = today;
  const saveBtn = document.getElementById('save-btn');
  saveBtn.textContent = '保存する';
  saveBtn.style.background = '';
  document.getElementById('delete-edit-btn').classList.add('hidden');
  renderEntries();
});
