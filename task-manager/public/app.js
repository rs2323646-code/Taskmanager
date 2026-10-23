const API = "/api";
let token = localStorage.getItem("token");
let currentUser = JSON.parse(localStorage.getItem("user") || "null");
let allTasks = [];

// ---------- TOASTS ----------
function toast(message, isError = false) {
  const box = document.getElementById("toastBox");
  const el = document.createElement("div");
  el.className = "toast" + (isError ? " error" : "");
  el.textContent = message;
  box.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ---------- MODAL HELPERS ----------
function openModal(id) {
  document.getElementById("overlay").classList.remove("hidden");
  document.getElementById(id).classList.remove("hidden");
}
function closeModals() {
  document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
  document.getElementById("overlay").classList.add("hidden");
}
function showLogin() { closeModals(); openModal("loginForm"); }
function showRegister() { closeModals(); openModal("registerForm"); }

function showNewTask() {
  document.getElementById("taskFormTitle").textContent = "Create Task";
  document.getElementById("taskFormEyebrow").textContent = "[ NEW ORDER ]";
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDesc").value = "";
  document.getElementById("taskPriority").value = "medium";
  document.getElementById("taskDueDate").value = "";
  document.getElementById("editingTaskId").value = "";
  closeModals();
  openModal("taskForm");
}

function showEditTask(task) {
  document.getElementById("taskFormTitle").textContent = "Edit Task";
  document.getElementById("taskFormEyebrow").textContent = "[ REVISE ORDER ]";
  document.getElementById("taskTitle").value = task.title;
  document.getElementById("taskDesc").value = task.description || "";
  document.getElementById("taskPriority").value = task.priority;
  document.getElementById("taskDueDate").value = task.dueDate ? task.dueDate.substring(0, 10) : "";
  document.getElementById("editingTaskId").value = task._id;
  closeModals();
  openModal("taskForm");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return "NO DUE DATE";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

// ---------- AUTH UI ----------
function updateAuthUI() {
  const greet = document.getElementById("userGreeting");
  if (currentUser) {
    greet.classList.remove("hidden");
    greet.textContent = `OPERATOR: ${currentUser.name}`;
    document.getElementById("loginBtn").classList.add("hidden");
    document.getElementById("registerBtn").classList.add("hidden");
    document.getElementById("logoutBtn").classList.remove("hidden");
    document.getElementById("newTaskBtn").classList.remove("hidden");
    document.getElementById("loggedOutState").classList.add("hidden");
    document.getElementById("board").classList.remove("hidden");
    loadTasks();
  } else {
    greet.classList.add("hidden");
    document.getElementById("loginBtn").classList.remove("hidden");
    document.getElementById("registerBtn").classList.remove("hidden");
    document.getElementById("logoutBtn").classList.add("hidden");
    document.getElementById("newTaskBtn").classList.add("hidden");
    document.getElementById("loggedOutState").classList.remove("hidden");
    document.getElementById("board").classList.add("hidden");
  }
}

async function register() {
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;

  if (!name || !email || !password) return toast("Fill in every field", true);

  const res = await fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  if (!res.ok) return toast(data.message, true);

  toast("Account created — log in now");
  closeModals();
  showLogin();
}

async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) return toast(data.message, true);

  token = data.token;
  currentUser = data.user;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(currentUser));
  closeModals();
  updateAuthUI();
  toast(`Welcome back, ${currentUser.name}`);
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  updateAuthUI();
  toast("Logged out");
}

// ---------- TASKS ----------
async function loadTasks() {
  const res = await fetch(`${API}/tasks`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return toast("Could not load tasks", true);
  allTasks = await res.json();
  renderBoard();
}

function renderBoard() {
  const cols = {
    "todo": document.getElementById("colTodo"),
    "in-progress": document.getElementById("colProgress"),
    "done": document.getElementById("colDone")
  };
  Object.values(cols).forEach(c => c.innerHTML = "");

  const counts = { "todo": 0, "in-progress": 0, "done": 0 };

  allTasks.forEach(t => {
    counts[t.status]++;
    const card = document.createElement("div");
    card.className = `task-card priority-${t.priority}`;
    card.innerHTML = `
      <h4>${escapeHtml(t.title)}</h4>
      ${t.description ? `<p>${escapeHtml(t.description)}</p>` : ""}
      <div class="task-meta">
        <span class="priority-tag ${t.priority}">${t.priority}</span>
        <span>${formatDate(t.dueDate)}</span>
      </div>
      <div class="task-actions">
        ${nextStatusButtons(t)}
        <button onclick='editTaskClick(${JSON.stringify(t).replace(/'/g, "&apos;")})'>Edit</button>
        <button class="danger" onclick="deleteTask('${t._id}')">Delete</button>
      </div>
    `;
    cols[t.status].appendChild(card);
  });

  document.getElementById("countTodo").textContent = counts["todo"];
  document.getElementById("countProgress").textContent = counts["in-progress"];
  document.getElementById("countDone").textContent = counts["done"];

  Object.entries(cols).forEach(([status, el]) => {
    if (el.children.length === 0) {
      el.innerHTML = `<div class="column-empty">— empty —</div>`;
    }
  });
}

function nextStatusButtons(task) {
  if (task.status === "todo") {
    return `<button onclick="moveTask('${task._id}', 'in-progress')">Start</button>`;
  }
  if (task.status === "in-progress") {
    return `<button onclick="moveTask('${task._id}', 'done')">Finish</button>`;
  }
  return `<button onclick="moveTask('${task._id}', 'todo')">Reopen</button>`;
}

function editTaskClick(task) {
  showEditTask(task);
}

async function moveTask(id, newStatus) {
  const res = await fetch(`${API}/tasks/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: newStatus })
  });
  const data = await res.json();
  if (!res.ok) return toast(data.message, true);
  toast(`Moved to ${newStatus.replace("-", " ")}`);
  loadTasks();
}

async function submitTask() {
  const title = document.getElementById("taskTitle").value.trim();
  const description = document.getElementById("taskDesc").value.trim();
  const priority = document.getElementById("taskPriority").value;
  const dueDate = document.getElementById("taskDueDate").value;
  const editingId = document.getElementById("editingTaskId").value;

  if (!title) return toast("Title is required", true);

  const url = editingId ? `${API}/tasks/${editingId}` : `${API}/tasks`;
  const method = editingId ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, description, priority, dueDate: dueDate || null })
  });
  const data = await res.json();
  if (!res.ok) return toast(data.message, true);

  toast(editingId ? "Task updated" : "Task deployed");
  closeModals();
  loadTasks();
}

async function deleteTask(id) {
  if (!confirm("Delete this task permanently?")) return;
  const res = await fetch(`${API}/tasks/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) return toast(data.message, true);
  toast("Task deleted");
  loadTasks();
}

// ---------- INIT ----------
updateAuthUI();
