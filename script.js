const themeToggleBtn = document.getElementById("themeToggleBtn");
const htmlEl = document.documentElement;
const addTaskBtn = document.getElementById("addTaskBtn");
const taskModal = document.getElementById("taskModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelTaskBtn = document.getElementById("cancelTaskBtn");
const taskForm = document.getElementById("taskForm");
const modalTitle = document.getElementById("modalTitle");
const searchInput = document.getElementById("searchInput");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

const taskIdInput = document.getElementById("taskId");
const taskTitleInput = document.getElementById("taskTitle");
const taskDescInput = document.getElementById("taskDesc");
const taskPriorityInput = document.getElementById("taskPriority");
const taskStatusInput = document.getElementById("taskStatus");

const columns = {
  todo: document.getElementById("todo"),
  "in-progress": document.getElementById("in-progress"),
  done: document.getElementById("done"),
};
const counters = {
  todo: document.getElementById("count-todo"),
  "in-progress": document.getElementById("count-in-progress"),
  done: document.getElementById("count-done"),
};

const statusFilters = document.querySelectorAll('input[name="statusFilter"]');
const priorityFilters = document.querySelectorAll(
  'input[name="priorityFilter"]',
);

let tasks = [];
let draggingTask = null;
let currentFilters = {
  status: "all",
  priority: "all",
  search: "",
};

function init() {
  lucide.createIcons();

  const savedTheme = localStorage.getItem("theme") || "dark";
  htmlEl.setAttribute("data-theme", savedTheme);

  const savedTasks = localStorage.getItem("tasks");
  if (savedTasks) {
    try {
      tasks = JSON.parse(savedTasks);
    } catch (e) {
      tasks = [];
    }
  }

  renderTasks();
  setupEventListeners();
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  updateCounters();
}

function showToast(msg) {
  toastMessage.textContent = msg;
  toast.classList.remove("hidden");
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

function setupEventListeners() {
  themeToggleBtn.addEventListener("click", () => {
    const currentTheme = htmlEl.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    htmlEl.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  });

  addTaskBtn.addEventListener("click", () => openModal());
  closeModalBtn.addEventListener("click", closeModal);
  cancelTaskBtn.addEventListener("click", closeModal);

  taskModal.addEventListener("click", (e) => {
    if (e.target === taskModal || e.target.classList.contains("modal-backdrop"))
      closeModal();
  });

  taskForm.addEventListener("submit", handleTaskSubmit);

  searchInput.addEventListener("input", (e) => {
    currentFilters.search = e.target.value.toLowerCase();
    renderTasks();
  });

  statusFilters.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      currentFilters.status = e.target.value;
      renderTasks();
    });
  });

  priorityFilters.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      currentFilters.priority = e.target.value;
      renderTasks();
    });
  });

  document.addEventListener("keydown", (e) => {
    const isInputActive =
      document.activeElement.tagName === "INPUT" ||
      document.activeElement.tagName === "TEXTAREA";
    const isModalOpen = !taskModal.classList.contains("hidden");

    if (
      !isInputActive &&
      !isModalOpen &&
      (e.key === "Enter" || e.key === "/")
    ) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  Object.values(columns).forEach((col) => {
    col.addEventListener("dragover", handleDragOver);
    col.addEventListener("dragleave", handleDragLeave);
    col.addEventListener("drop", handleDrop);
  });
}

function openModal(task = null) {
  if (task) {
    modalTitle.textContent = "Edit Task";
    taskIdInput.value = task.id;
    taskTitleInput.value = task.title;
    taskDescInput.value = task.description;
    taskPriorityInput.value = task.priority;
    taskStatusInput.value = task.status;
  } else {
    modalTitle.textContent = "Create New Task";
    taskForm.reset();
    taskIdInput.value = "";
    taskPriorityInput.value = "medium";
    taskStatusInput.value = "todo";
  }
  taskModal.classList.remove("hidden");
  taskTitleInput.focus();
}

function closeModal() {
  taskModal.classList.add("hidden");
}

function handleTaskSubmit(e) {
  e.preventDefault();

  const id = taskIdInput.value;
  const title = taskTitleInput.value.trim();
  const description = taskDescInput.value.trim();
  const priority = taskPriorityInput.value;
  const status = taskStatusInput.value;

  if (!title) return;

  if (id) {
    const index = tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], title, description, priority, status };
      showToast("Task updated");
    }
  } else {
    const newTask = {
      id: "task-" + Date.now(),
      title,
      description,
      priority,
      status,
      createdAt: new Date().toISOString(),
    };
    tasks.push(newTask);
    showToast("Task created");
  }

  saveTasks();
  renderTasks();
  closeModal();
}

function deleteTask(id) {
  if (confirm("Are you sure you want to delete this task?")) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    renderTasks();
    showToast("Task deleted");
  }
}

function renderTasks() {
  Object.values(columns).forEach((col) => (col.innerHTML = ""));

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      currentFilters.status === "all" || task.status === currentFilters.status;
    const matchesPriority =
      currentFilters.priority === "all" ||
      task.priority === currentFilters.priority;
    const matchesSearch =
      currentFilters.search === "" ||
      task.title.toLowerCase().includes(currentFilters.search) ||
      task.description.toLowerCase().includes(currentFilters.search);

    return matchesStatus && matchesPriority && matchesSearch;
  });

  filteredTasks.forEach((task) => {
    const tr = document.createElement("div");
    tr.className = "task-card";
    tr.draggable = true;
    tr.dataset.id = task.id;

    const dateStr = new Date(task.createdAt).toLocaleDateString();

    tr.innerHTML = `
            <div class="task-badges">
                <span class="badge priority-${task.priority}">${task.priority}</span>
            </div>
            <h3 class="task-title">${escapeHtml(task.title)}</h3>
            ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ""}
            <div class="task-footer">
                <div class="task-date">
                    <i data-lucide="calendar"></i> ${dateStr}
                </div>
                <div class="task-actions">
                    <button class="icon-btn edit-btn" title="Edit"><i data-lucide="edit-2"></i></button>
                    <button class="icon-btn delete-btn" title="Delete"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `;

    const editBtn = tr.querySelector(".edit-btn");
    const deleteBtn = tr.querySelector(".delete-btn");

    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openModal(task);
    });

    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteTask(task.id);
    });

    tr.addEventListener("dragstart", (e) => {
      draggingTask = tr;
      tr.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", task.id);

      setTimeout(() => (tr.style.opacity = "0.5"), 0);
    });

    tr.addEventListener("dragend", () => {
      draggingTask = null;
      tr.classList.remove("dragging");
      tr.style.opacity = "1";

      Object.values(columns).forEach((col) =>
        col.classList.remove("drag-over"),
      );
    });

    columns[task.status].appendChild(tr);
  });

  lucide.createIcons();
  updateCounters();
}

function updateCounters() {
  counters["todo"].textContent = tasks.filter(
    (t) => t.status === "todo",
  ).length;
  counters["in-progress"].textContent = tasks.filter(
    (t) => t.status === "in-progress",
  ).length;
  counters["done"].textContent = tasks.filter(
    (t) => t.status === "done",
  ).length;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  const column = e.currentTarget;
  column.classList.add("drag-over");

  const afterElement = getDragAfterElement(column, e.clientY);
  if (!draggingTask) return;

  if (afterElement == null) {
    column.appendChild(draggingTask);
  } else {
    column.insertBefore(draggingTask, afterElement);
  }
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove("drag-over");
}

function handleDrop(e) {
  e.preventDefault();
  const column = e.currentTarget;
  column.classList.remove("drag-over");

  const taskId = e.dataTransfer.getData("text/plain");
  const newStatus = column.dataset.status;

  if (taskId && newStatus) {
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex !== -1 && tasks[taskIndex].status !== newStatus) {
      tasks[taskIndex].status = newStatus;
      saveTasks();
    }

    reorderTasksBasedOnDOM();
  }
}

function reorderTasksBasedOnDOM() {
  const newTasksOrder = [];
  Object.values(columns).forEach((column) => {
    const cards = [...column.querySelectorAll(".task-card")];
    cards.forEach((card) => {
      const taskId = card.dataset.id;
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        newTasksOrder.push(task);
      }
    });
  });

  if (newTasksOrder.length === tasks.length) {
    tasks = newTasksOrder;
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }
  updateCounters();
}

function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll(".task-card:not(.dragging)"),
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY },
  ).element;
}

function escapeHtml(unsafe) {
  return (unsafe || "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", init);
