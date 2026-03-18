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

try {
    lists = savedLists ? JSON.parse(savedLists) : { "Meine Liste": [] };
} catch {
    lists = { "Meine Liste": [] };
}

if (savedCurrentList && lists[savedCurrentList]) {
    currentList = savedCurrentList;
} else {
    currentList = Object.keys(lists)[0] || "Meine Liste";
}

listTitle.textContent = currentList;
let todos = lists[currentList];

/* -------------------------------
   SCROLL CHECK
--------------------------------- */
function checkScroll() {
    const body = document.body;
    const html = document.documentElement;

    const pageHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight);
    const viewportHeight = window.innerHeight;

    body.classList.toggle("no-scroll", pageHeight <= viewportHeight);
}

window.addEventListener("load", checkScroll);
window.addEventListener("resize", checkScroll);

/* -------------------------------
   MENÜ
--------------------------------- */
menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    menuDropdown.style.display =
        menuDropdown.style.display === "flex" ? "none" : "flex";
});

document.addEventListener("click", (e) => {
    if (!menuDropdown.contains(e.target) && e.target !== menuBtn) {
        menuDropdown.style.display = "none";
    }
});

/* -------------------------------
   LIST TITLE EDIT (nur dblclick)
--------------------------------- */
function startEditingListTitle() {
    const inputField = document.createElement("input");
    inputField.value = currentList;
    inputField.className = "edit-input";

    listTitle.textContent = "";
    listTitle.appendChild(inputField);
    inputField.focus();

    inputField.addEventListener("blur", () => {
        const newName = inputField.value.trim();
        if (newName && !lists[newName]) {
            lists[newName] = lists[currentList];
            delete lists[currentList];
            currentList = newName;
            saveLists();
            renderTabs();
        }
        listTitle.textContent = currentList;
    });
}

listTitle.addEventListener("dblclick", startEditingListTitle);

/* -------------------------------
   SPEICHERN
--------------------------------- */
function saveLists() {
    lists[currentList] = todos;
    localStorage.setItem("todoLists", JSON.stringify(lists));
    localStorage.setItem("todoCurrentList", currentList);
}

/* -------------------------------
   COUNTER
--------------------------------- */
function updateCounter() {
    const done = todos.filter(t => t.erledigt).length;
    counter.textContent = `${done} von ${todos.length} erledigt`;
}

/* -------------------------------
   TODO EDIT
--------------------------------- */
function startEditing(span, index) {
    if (todos[index].erledigt) return;

    const inputField = document.createElement("input");
    inputField.value = todos[index].text;
    inputField.className = "edit-input";

    span.replaceWith(inputField);
    inputField.focus();

    inputField.addEventListener("blur", () => {
        const val = inputField.value.trim();
        if (val) todos[index].text = val;
        saveLists();
        render();
    });
}

/* -------------------------------
   RENDER
--------------------------------- */
function render() {
    list.innerHTML = "";

    todos.forEach((todo, index) => {

        if (filter === "offen" && todo.erledigt) return;
        if (filter === "erledigt" && !todo.erledigt) return;

        const li = document.createElement("li");
        li.dataset.index = index;

        const left = document.createElement("div");
        left.className = "li-left";

        const drag = document.createElement("div");
        drag.className = "drag-handle";
        drag.draggable = true;
        drag.textContent = "⋮⋮";

        drag.addEventListener("touchstart", handleTouchStart, { passive: false });
        drag.addEventListener("touchmove", handleTouchMove, { passive: false });
        drag.addEventListener("touchend", handleTouchEnd, { passive: false });

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.dataset.action = "toggle";
        checkbox.dataset.index = index;
        checkbox.checked = todo.erledigt;

        left.appendChild(drag);
        left.appendChild(checkbox);

        const span = document.createElement("span");
        span.textContent = todo.text;
        if (todo.erledigt) span.classList.add("erledigt");

        span.addEventListener("dblclick", () => startEditing(span, index));

        const del = document.createElement("button");
        del.textContent = "✕";
        del.className = "delete";
        del.dataset.action = "delete";
        del.dataset.index = index;

        li.appendChild(left);
        li.appendChild(span);
        li.appendChild(del);

        list.appendChild(li);
    });

    updateCounter();
    checkScroll();
}

/* -------------------------------
   ADD TODO
--------------------------------- */
function addTodo() {
    const text = input.value.trim();
    if (!text) return;

    todos.push({ text, erledigt: false });
    input.value = "";
    input.blur();

    saveLists();
    render();
}

addBtn.addEventListener("click", addTodo);
input.addEventListener("keypress", e => { if (e.key === "Enter") addTodo(); });

/* -------------------------------
   CLICK EVENTS
--------------------------------- */
list.addEventListener("click", e => {
    const action = e.target.dataset.action;
    const index = e.target.dataset.index;
    if (!action) return;

    const idx = Number(index);

    if (action === "toggle") {
        e.target.classList.add("animate");
        setTimeout(() => e.target.classList.remove("animate"), 200);
        todos[idx].erledigt = !todos[idx].erledigt;
    }

    if (action === "delete") {
        todos.splice(idx, 1);
    }

    saveLists();
    render();
});

/* -------------------------------
   TOUCH DRAG
--------------------------------- */
let touchItem = null;
let touchStartY = 0;
let hasMoved = false;

function handleTouchStart(e) {
    touchItem = e.target.closest("li");
    touchStartY = e.touches[0].clientY;
    hasMoved = false;
}

function handleTouchMove(e) {
    if (!touchItem) return;

    if (Math.abs(e.touches[0].clientY - touchStartY) > 10) {
        hasMoved = true;
        e.preventDefault();
    }
}

function handleTouchEnd() {
    touchItem = null;
}

/* -------------------------------
   LISTEN TABS
--------------------------------- */
function renderTabs() {
    listTabs.innerHTML = "";

    for (const name in lists) {
        const wrap = document.createElement("div");
        wrap.className = "list-item";

        const btn = document.createElement("button");
        btn.textContent = name;

        btn.onclick = () => {
            currentList = name;
            todos = lists[name];
            listTitle.textContent = name;
            renderTabs();
            render();
        };

        const del = document.createElement("button");
        del.textContent = "✕";
        del.className = "delete";

        del.onclick = (e) => {
            e.stopPropagation();
            delete lists[name];

            currentList = Object.keys(lists)[0] || "Meine Liste";
            if (!lists[currentList]) lists[currentList] = [];

            todos = lists[currentList];
            listTitle.textContent = currentList;

            saveLists();
            renderTabs();
            render();
        };

        wrap.appendChild(btn);
        wrap.appendChild(del);
        listTabs.appendChild(wrap);
    }
}

/* -------------------------------
   NEUE LISTE
--------------------------------- */
addListBtn.addEventListener("click", () => {
    const name = prompt("Name:");
    if (!name || lists[name]) return;

    lists[name] = [];
    currentList = name;
    todos = lists[name];

    saveLists();
    renderTabs();
    render();
});

/* -------------------------------
   START
--------------------------------- */
renderTabs();
render();
