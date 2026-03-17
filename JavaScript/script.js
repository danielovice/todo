/* -------------------------------
   VARIABLEN
--------------------------------- */
const input = document.getElementById("todoInput");
const addBtn = document.getElementById("addBtn");
const list = document.getElementById("todoList");
const filterBtns = document.querySelectorAll(".filter-btn");
const counter = document.getElementById("counter");

const listTabs = document.getElementById("listTabs");
const listTitle = document.getElementById("listTitle");

const menuBtn = document.getElementById("menuBtn");
const menuDropdown = document.getElementById("menuDropdown");
const addListBtn = document.getElementById("addListBtn");

let lists = {};
let currentList = "Meine Liste";
let filter = null;

/* -------------------------------
   LOCAL STORAGE LADEN
--------------------------------- */
const savedLists = localStorage.getItem("todoLists");
const savedCurrentList = localStorage.getItem("todoCurrentList");

lists = savedLists ? JSON.parse(savedLists) : { "Meine Liste": [] };

if (savedCurrentList && lists[savedCurrentList]) {
    currentList = savedCurrentList;
} else {
    currentList = Object.keys(lists)[0] || "Meine Liste";
}

listTitle.textContent = currentList;
let todos = lists[currentList];

/* -------------------------------
   MENÜ (Hamburger)
--------------------------------- */
menuBtn.addEventListener("click", () => {
    menuDropdown.style.display =
        menuDropdown.style.display === "flex" ? "none" : "flex";
});

/* -------------------------------
   LISTENNAME BEARBEITEN (Doppelklick)
--------------------------------- */
function startEditingListTitle() {
    const currentName = currentList;

    const inputField = document.createElement("input");
    inputField.type = "text";
    inputField.value = currentName;
    inputField.className = "edit-input";

    listTitle.textContent = "";
    listTitle.appendChild(inputField);
    inputField.focus();
    inputField.select();

    const saveEdit = () => {
        const newName = inputField.value.trim();
        if (newName && newName !== currentName) {
            if (lists[newName]) {
                alert("Eine Liste mit diesem Namen existiert bereits!");
                listTitle.textContent = currentList;
                return;
            }
            // Liste umbenennen
            lists[newName] = lists[currentList];
            delete lists[currentList];
            currentList = newName;
            saveLists();
            renderTabs();
        }
        listTitle.textContent = currentList;
    };

    inputField.addEventListener("blur", saveEdit);
    inputField.addEventListener("keypress", e => { if (e.key === "Enter") inputField.blur(); });
    inputField.addEventListener("keydown", e => { if (e.key === "Escape") listTitle.textContent = currentList; });
}

listTitle.addEventListener("dblclick", startEditingListTitle);

/* -------------------------------
   SPEICHERN
--------------------------------- */
function saveLists() {
    if (!Array.isArray(todos)) todos = [];
    lists[currentList] = todos;
    localStorage.setItem("todoLists", JSON.stringify(lists));
    localStorage.setItem("todoCurrentList", currentList);
}

/* -------------------------------
   COUNTER UPDATE
--------------------------------- */
function updateCounter() {
    const done = todos.filter(t => t.erledigt).length;
    counter.textContent = `${done} von ${todos.length} erledigt`;
}

/* -------------------------------
   TODOS BEARBEITEN (Doppelklick)
--------------------------------- */
function startEditing(spanElement, index) {
    if (todos[index].erledigt) return;

    const currentText = todos[index].text;
    const inputField = document.createElement("input");
    inputField.type = "text";
    inputField.value = currentText;
    inputField.className = "edit-input";

    spanElement.replaceWith(inputField);
    inputField.focus();
    inputField.select();

    const saveEdit = () => {
        const newText = inputField.value.trim();
        if (newText) todos[index].text = newText;
        saveLists();
        render();
    };

    inputField.addEventListener("blur", saveEdit);
    inputField.addEventListener("keypress", e => { if (e.key === "Enter") inputField.blur(); });
    inputField.addEventListener("keydown", e => { if (e.key === "Escape") render(); });
}

/* -------------------------------
   TODOS RENDERN (XSS-sicher)
--------------------------------- */
function render() {
    list.innerHTML = "";

    if (!todos || !Array.isArray(todos)) {
        todos = [];
        saveLists();
    }

    todos.forEach((todo, index) => {
        if (filter === "offen" && todo.erledigt) return;
        if (filter === "erledigt" && !todo.erledigt) return;

        const li = document.createElement("li");
        li.dataset.index = index;

        // Drag + Checkbox Container
        const leftDiv = document.createElement("div");
        leftDiv.className = "li-left";

        const dragHandle = document.createElement("div");
        dragHandle.className = "drag-handle";
        dragHandle.draggable = true;
        dragHandle.textContent = "⋮⋮";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.dataset.action = "toggle";
        checkbox.dataset.index = index;
        if (todo.erledigt) checkbox.checked = true;

        leftDiv.appendChild(dragHandle);
        leftDiv.appendChild(checkbox);

        // Todo Text
        const span = document.createElement("span");
        span.textContent = todo.text; // XSS-sicher
        if (todo.erledigt) span.classList.add("erledigt");
        span.addEventListener("dblclick", () => startEditing(span, index));

        // Delete Button
        const delBtn = document.createElement("button");
        delBtn.textContent = "X";
        delBtn.className = "delete";
        delBtn.dataset.action = "delete";
        delBtn.dataset.index = index;

        li.appendChild(leftDiv);
        li.appendChild(span);
        li.appendChild(delBtn);

        list.appendChild(li);
    });

    updateCounter();
}

/* -------------------------------
   TODOS HINZUFÜGEN
--------------------------------- */
function addTodo() {
    const text = input.value.trim();
    if (!text) return;
    todos.push({ text: text, erledigt: false });
    input.value = "";
/* 🔥 Tastatur schließen */
    input.blur();
   
    saveLists();
    render();
}

addBtn.addEventListener("click", addTodo);
input.addEventListener("keypress", e => { if (e.key === "Enter") addTodo(); });

/* -------------------------------
   EVENT DELEGATION
--------------------------------- */
list.addEventListener("click", e => {
    const action = e.target.dataset.action;
    const index = e.target.dataset.index;
    if (!action || index === undefined) return;

    const idx = Number(index);

    if (action === "toggle" && todos[idx]) {
        todos[idx].erledigt = !todos[idx].erledigt;
        saveLists();
        render();
    }

    if (action === "delete" && todos[idx]) {
        todos.splice(idx, 1);
        saveLists();
        render();
    }
});

/* -------------------------------
   FILTER BUTTONS
--------------------------------- */
filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const value = btn.dataset.filter;
        if (filter === value) {
            filter = null;
            btn.classList.remove("active");
        } else {
            filter = value;
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        }
        render();
    });
});

/* -------------------------------
   DRAG & DROP
--------------------------------- */
let draggedItemIndex = null;

list.addEventListener("dragstart", e => {
    const handle = e.target.closest(".drag-handle");
    if (!handle) return;
    const li = handle.closest("li");
    if (!li) return;
    draggedItemIndex = Number(li.dataset.index);
    li.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", draggedItemIndex);
});

list.addEventListener("dragend", e => {
    const li = e.target.closest("li");
    if (li) li.classList.remove("dragging");
    draggedItemIndex = null;
});

list.addEventListener("dragover", e => {
    e.preventDefault();
    const after = getDragAfterElement(list, e.clientY);
    const dragging = document.querySelector(".dragging");
    if (!dragging) return;
    if (after == null) list.appendChild(dragging);
    else list.insertBefore(dragging, after);
});

list.addEventListener("drop", () => {
    const items = Array.from(list.children);
    const newTodos = [];
    items.forEach(li => {
        const idx = Number(li.dataset.index);
        if (todos[idx]) newTodos.push(todos[idx]);
    });
    if (newTodos.length === todos.length) {
        todos = newTodos;
        saveLists();
        render();
    } else render();
});

function getDragAfterElement(container, y) {
    const elements = [...container.querySelectorAll("li:not(.dragging)")];
    return elements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/* -------------------------------
   LISTEN MENÜ RENDER
--------------------------------- */
function renderTabs() {
    listTabs.innerHTML = "";
    for (const name in lists) {
        const wrapper = document.createElement("div");
        wrapper.className = "list-item";

        const btn = document.createElement("button");
        btn.textContent = name;

        btn.onmouseover = () => { menuDropdown.style.display = "flex"; };
        btn.onmouseleave = () => { menuDropdown.style.display = "none"; };

        btn.onclick = () => {
            saveLists();
            currentList = name;
            todos = lists[name];
            listTitle.textContent = name;
            menuDropdown.style.display = "none";
            renderTabs();
            render();
        };

        const del = document.createElement("button");
        del.textContent = "🗑";

        del.onclick = () => {
            if (!confirm("Liste löschen?")) return;
            delete lists[name];
            if (name === currentList) {
                const remaining = Object.keys(lists);
                if (remaining.length > 0) currentList = remaining[0];
                else {
                    currentList = "Meine Liste";
                    lists[currentList] = [];
                }
                todos = lists[currentList];
                listTitle.textContent = currentList;
                saveLists();
            }
            renderTabs();
            render();
        };

        wrapper.appendChild(btn);
        wrapper.appendChild(del);
        listTabs.appendChild(wrapper);
    }
}

/* -------------------------------
   NEUE LISTE HINZUFÜGEN
--------------------------------- */
addListBtn.addEventListener("click", () => {
    const name = prompt("Name der Liste:");
    if (!name) return;
    lists[name] = [];
    currentList = name;
    todos = lists[name];
    listTitle.textContent = name;
    saveLists();
    renderTabs();
    render();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}


/* -------------------------------
   TOUCH DRAG (FIXED)
--------------------------------- */
let touchItem = null;
let isDragging = false;

list.addEventListener("touchstart", e => {
    const handle = e.target.closest(".drag-handle");
    if (!handle) return; // 🔥 NUR wenn man am Handle ist!

    const li = handle.closest("li");
    if (!li) return;

    touchItem = li;
    isDragging = true;
    li.classList.add("dragging");
});

list.addEventListener("touchmove", e => {
    if (!isDragging || !touchItem) return;

    e.preventDefault();

    const touch = e.touches[0];
    const after = getDragAfterElement(list, touch.clientY);

    if (after == null) list.appendChild(touchItem);
    else list.insertBefore(touchItem, after);
}, { passive: false });

list.addEventListener("touchend", () => {
    if (!touchItem) return;

    touchItem.classList.remove("dragging");

    const items = Array.from(list.children);
    const newTodos = [];

    items.forEach(li => {
        const idx = Number(li.dataset.index);
        if (todos[idx]) newTodos.push(todos[idx]);
    });

    if (newTodos.length === todos.length) {
        todos = newTodos;
        saveLists();
        render();
    }

    touchItem = null;
    isDragging = false;
});



/* -------------------------------
   START
--------------------------------- */
renderTabs();
render();
