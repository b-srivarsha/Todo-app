(() => {
  "use strict";

  const STORAGE_KEY = "minimal-todo.tasks.v1";
  const DAY_MS = 86_400_000;
  const LEAVE_FALLBACK_MS = 600;
  const FILTER_OUT_DELAY_MS = 650;

  const FILTERS = {
    all: () => true,
    active: (task) => !task.done,
    completed: (task) => task.done,
  };

  const EMPTY_COPY = {
    all: ["Nothing on your list", "Add a task above to get started."],
    active: ["All caught up", "You have no active tasks. Enjoy the calm."],
    completed: ["Nothing completed yet", "Tasks you check off will show up here."],
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const $ = (id) => document.getElementById(id);
  const els = {
    app: $("app"),
    today: $("today"),
    form: $("task-form"),
    input: $("task-input"),
    due: $("task-due"),
    dueLabel: document.querySelector(".composer__due"),
    list: $("task-list"),
    template: $("task-template"),
    empty: $("empty-state"),
    emptyTitle: $("empty-title"),
    emptyText: $("empty-text"),
    progressText: $("progress-text"),
    progressPct: $("progress-pct"),
    progressTrack: $("progress-track"),
    progressFill: $("progress-fill"),
    filterButtons: document.querySelectorAll("[data-filter]"),
    counts: {
      all: document.querySelector('[data-count="all"]'),
      active: document.querySelector('[data-count="active"]'),
      completed: document.querySelector('[data-count="completed"]'),
    },
    clearBtn: $("clear-completed"),
  };

  let tasks = loadTasks();
  let currentFilter = "all";

  /* ---------- Persistence ---------- */

  function isValidTask(task) {
    return (
      task &&
      typeof task.id === "string" &&
      typeof task.title === "string" &&
      typeof task.done === "boolean" &&
      (task.due === null || typeof task.due === "string")
    );
  }

  function loadTasks() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.filter(isValidTask) : [];
    } catch {
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // Storage can be full or disabled (e.g. private mode); the app keeps working in memory.
    }
  }

  function createId() {
    if (window.crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  /* ---------- Dates ---------- */

  function parseLocalDate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function startOfToday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function describeDue(iso, done) {
    const date = parseLocalDate(iso);
    const diffDays = Math.round((date - startOfToday()) / DAY_MS);

    let label;
    if (diffDays === 0) label = "Today";
    else if (diffDays === 1) label = "Tomorrow";
    else if (diffDays === -1) label = "Yesterday";
    else {
      const sameYear = date.getFullYear() === new Date().getFullYear();
      label = date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        ...(sameYear ? {} : { year: "numeric" }),
      });
    }

    const overdue = !done && diffDays < 0;
    return {
      label: overdue ? `Overdue · ${label}` : label,
      overdue,
      soon: !done && diffDays >= 0 && diffDays <= 1,
    };
  }

  /* ---------- DOM helpers ---------- */

  function getTaskEl(id) {
    return els.list.querySelector(`[data-id="${CSS.escape(id)}"]`);
  }

  function applyTaskState(el, task) {
    el.classList.toggle("is-done", task.done);
    el.querySelector(".task__checkbox").checked = task.done;

    const dueEl = el.querySelector(".task__due");
    if (task.due) {
      const { label, overdue, soon } = describeDue(task.due, task.done);
      dueEl.hidden = false;
      dueEl.classList.toggle("is-overdue", overdue);
      dueEl.classList.toggle("is-soon", soon);
      el.querySelector(".task__due-label").textContent = label;
    } else {
      dueEl.hidden = true;
    }
  }

  function createTaskEl(task) {
    const el = els.template.content.firstElementChild.cloneNode(true);
    el.dataset.id = task.id;
    el.querySelector(".task__title").textContent = task.title;
    el.querySelector(".task__delete").setAttribute("aria-label", `Delete "${task.title}"`);
    applyTaskState(el, task);
    return el;
  }

  function playOnce(el, className) {
    if (reducedMotion.matches) return;
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
    const handler = (event) => {
      if (event.target !== el && !el.contains(event.target)) return;
      el.classList.remove(className);
      el.removeEventListener("animationend", handler);
    };
    el.addEventListener("animationend", handler);
    setTimeout(() => el.classList.remove(className), 800);
  }

  function animateOut(el) {
    if (el.classList.contains("is-leaving")) return;

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      el.remove();
      updateEmptyState();
    };

    if (reducedMotion.matches) {
      finish();
      return;
    }

    el.style.height = `${el.offsetHeight}px`;
    void el.offsetHeight;
    el.classList.add("is-leaving");
    el.style.height = "0px";

    el.addEventListener("transitionend", (event) => {
      if (event.target === el && event.propertyName === "height") finish();
    });
    setTimeout(finish, LEAVE_FALLBACK_MS);
  }

  function moveFocusAwayFrom(el) {
    if (!el.contains(document.activeElement)) return;
    const neighbor =
      el.nextElementSibling?.matches(".task:not(.is-leaving)") ? el.nextElementSibling
      : el.previousElementSibling?.matches(".task:not(.is-leaving)") ? el.previousElementSibling
      : null;
    (neighbor?.querySelector(".task__checkbox") ?? els.input).focus();
  }

  /* ---------- Rendering ---------- */

  function renderList() {
    const fragment = document.createDocumentFragment();
    tasks.filter(FILTERS[currentFilter]).forEach((task) => fragment.append(createTaskEl(task)));
    els.list.replaceChildren(fragment);
    updateEmptyState();
  }

  function updateEmptyState() {
    const isEmpty = els.list.children.length === 0;
    const [title, text] = EMPTY_COPY[currentFilter];
    els.emptyTitle.textContent = title;
    els.emptyText.textContent = text;
    els.empty.hidden = !isEmpty;
  }

  function updateMeta() {
    const total = tasks.length;
    const done = tasks.filter((t) => t.done).length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    els.progressText.textContent =
      total === 0 ? "No tasks yet" : `${done} of ${total} ${total === 1 ? "task" : "tasks"} done`;
    els.progressPct.textContent = `${pct}%`;
    els.progressFill.style.transform = `scaleX(${total ? done / total : 0})`;
    els.progressTrack.setAttribute("aria-valuenow", String(pct));

    els.counts.all.textContent = total;
    els.counts.active.textContent = total - done;
    els.counts.completed.textContent = done;

    els.clearBtn.hidden = done === 0;
    els.app.classList.toggle("is-all-done", total > 0 && done === total);
  }

  /* ---------- Actions ---------- */

  function addTask(title, due) {
    const task = { id: createId(), title, due: due || null, done: false, createdAt: Date.now() };
    tasks.unshift(task);
    saveTasks();

    if (currentFilter === "completed") {
      setFilter("all");
    } else {
      const el = createTaskEl(task);
      els.list.prepend(el);
      playOnce(el, "is-entering");
      updateEmptyState();
    }
    updateMeta();
  }

  function toggleTask(id, done) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.done = done;
    saveTasks();

    const el = getTaskEl(id);
    applyTaskState(el, task);
    if (done) playOnce(el, "just-completed");
    updateMeta();

    if (!FILTERS[currentFilter](task)) {
      setTimeout(() => {
        if (el.isConnected && !FILTERS[currentFilter](task)) {
          moveFocusAwayFrom(el);
          animateOut(el);
        }
      }, FILTER_OUT_DELAY_MS);
    }
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    updateMeta();

    const el = getTaskEl(id);
    if (el) {
      moveFocusAwayFrom(el);
      animateOut(el);
    }
  }

  function clearCompleted() {
    const doneIds = new Set(tasks.filter((t) => t.done).map((t) => t.id));
    tasks = tasks.filter((t) => !t.done);
    saveTasks();
    updateMeta();

    els.list.querySelectorAll(".task").forEach((el) => {
      if (doneIds.has(el.dataset.id)) {
        moveFocusAwayFrom(el);
        animateOut(el);
      }
    });
    if (document.activeElement === els.clearBtn || !document.body.contains(document.activeElement)) {
      els.input.focus();
    }
  }

  function setFilter(name) {
    if (!FILTERS[name]) return;
    currentFilter = name;
    els.filterButtons.forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.filter === name));
    });
    renderList();
  }

  /* ---------- Events ---------- */

  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = els.input.value.trim();
    if (!title) {
      playOnce(els.form, "is-shaking");
      els.input.focus();
      return;
    }
    addTask(title.slice(0, 200), els.due.value);
    els.form.reset();
    els.dueLabel.classList.remove("has-value");
    els.input.focus();
  });

  els.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.isComposing || event.keyCode === 229)) event.preventDefault();
  });

  // The native calendar indicator is hidden in favor of our own icon, so open the picker on click.
  els.dueLabel.addEventListener("click", () => {
    try {
      els.due.showPicker?.();
    } catch {
      // showPicker can throw outside a user gesture or in cross-origin iframes; focusing still works.
    }
  });

  els.due.addEventListener("input", () => {
    els.dueLabel.classList.toggle("has-value", Boolean(els.due.value));
  });

  els.list.addEventListener("change", (event) => {
    if (!event.target.matches(".task__checkbox")) return;
    const el = event.target.closest(".task");
    toggleTask(el.dataset.id, event.target.checked);
  });

  els.list.addEventListener("click", (event) => {
    const btn = event.target.closest(".task__delete");
    if (!btn) return;
    deleteTask(btn.closest(".task").dataset.id);
  });

  els.filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => setFilter(btn.dataset.filter));
  });

  els.clearBtn.addEventListener("click", clearCompleted);

  // Keep multiple open tabs in sync.
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    tasks = loadTasks();
    renderList();
    updateMeta();
  });

  /* ---------- Init ---------- */

  els.today.textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  renderList();
  updateMeta();
})();
