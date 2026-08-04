"use strict";

// ---------- 要素の取得 ----------
const form = document.getElementById("task-form");
const nameInput = document.getElementById("task-name");
const dueInput = document.getElementById("task-due");
const prioritySelect = document.getElementById("task-priority");
const formError = document.getElementById("form-error");
const taskList = document.getElementById("task-list");
const emptyMessage = document.getElementById("empty-message");

const PRIORITY_LABELS = { high: "高", medium: "中", low: "低" };
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

// ---------- localStorage ----------
const STORAGE_KEY = "todo-priority-app.tasks";

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    // 壊れたデータが混ざっていても落ちないよう、形を検証して取り込む
    return parsed
      .filter((t) => t && typeof t.name === "string" && t.name !== "")
      .map((t) => ({
        id: String(t.id ?? Date.now() + Math.random()),
        name: t.name,
        dueDate: typeof t.dueDate === "string" ? t.dueDate : "",
        priority: t.priority in PRIORITY_ORDER ? t.priority : "medium",
        completed: Boolean(t.completed),
      }));
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // プライベートモード等で保存できない場合も、画面上の動作は継続する
  }
}

// タスクの配列（localStorage から復元）
let tasks = loadTasks();

// ---------- タスク追加 ----------
form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();

  // 空欄（スペースのみ含む）は拒否
  if (name === "") {
    formError.hidden = false;
    nameInput.focus();
    return;
  }
  formError.hidden = true;

  tasks.push({
    id: String(Date.now()),
    name: name,
    dueDate: dueInput.value, // 未入力なら ""
    priority: prioritySelect.value,
    completed: false,
  });

  form.reset();
  prioritySelect.value = "medium";
  nameInput.focus();
  saveTasks();
  render();
});

// ---------- 完了の切り替え ----------
function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveTasks();
  render();
}

// ---------- 削除 ----------
function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  render();
}

// ---------- 描画 ----------
function render() {
  taskList.replaceChildren();

  // 未完了が上、同グループ内は優先度順（高→低）、同優先度は期限が近い順
  const sorted = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.priority !== b.priority) {
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    }
    return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");
  });

  for (const task of sorted) {
    taskList.appendChild(createTaskElement(task));
  }

  emptyMessage.hidden = tasks.length > 0;
}

function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task-item" + (task.completed ? " completed" : "");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-check";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label", "完了にする");
  checkbox.addEventListener("change", () => toggleTask(task.id));

  const badge = document.createElement("span");
  badge.className = "priority-badge priority-" + task.priority;
  badge.textContent = PRIORITY_LABELS[task.priority] || "中";

  const body = document.createElement("div");
  body.className = "task-body";

  const nameEl = document.createElement("div");
  nameEl.className = "task-name";
  nameEl.textContent = task.name; // textContent なので HTML を入力されても無害

  body.appendChild(nameEl);

  if (task.dueDate) {
    const dueEl = document.createElement("div");
    dueEl.className = "task-due";
    dueEl.textContent = "期限: " + task.dueDate.replaceAll("-", "/");
    // 期限切れ（未完了のみ）は赤字にする
    const today = new Date().toISOString().slice(0, 10);
    if (!task.completed && task.dueDate < today) {
      dueEl.classList.add("overdue");
      dueEl.textContent += "（期限切れ）";
    }
    body.appendChild(dueEl);
  }

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "🗑";
  deleteBtn.setAttribute("aria-label", "削除");
  deleteBtn.addEventListener("click", () => deleteTask(task.id));

  li.append(checkbox, badge, body, deleteBtn);
  return li;
}

// 初期表示
render();
