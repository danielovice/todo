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

// Modal Elemente
const addListModal = document.getElementById("addListModal");
const listNameInput = document.getElementById("listNameInput");
const listTypeSelect = document.getElementById("listTypeSelect");
const colorCircles = document.querySelectorAll(".color-circle");
const confirmAddListBtn = document.getElementById("confirmAddListBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const colorPreview = document.getElementById("colorPreview");

let lists = {};
let currentList = "Meine Liste";
let filter = null;
let selectedColor = "#0a84ff";

/* -------------------------------
   LOCAL STORAGE LADEN
--------------------------------- */
const savedLists = localStorage.getItem("todoLists");
const savedCurrentList = localStorage.getItem("todoCurrentList");

try {
    lists = savedLists ? JSON.parse(savedLists) : { "Meine Liste": { todos: [], type: "todo", color: "#0a84ff" } };
} catch (e) {
    lists = { "Meine Liste": { todos: [], type: "todo", color: "#0a84ff" } };
}

// Alte Struktur migrieren
for (const key in lists) {
    if (!lists[key].todos && Array.isArray(lists[key])) {
        lists[key] = { todos: lists[key], type: "todo", color: "#0a84ff" };
    }
}

if (savedCurrentList && lists[savedCurrentList]) {
    currentList = savedCurrentList;
} else {
    currentList = Object.keys(lists)[0] || "Meine Liste";
}

listTitle.textContent = currentList;
if (lists[currentList]) {
    const listColor = lists[currentList].color || "#0a84ff";
    updateButtonColors(listColor);
    let todos = lists[currentList].todos || [];
}

/* -------------------------------
   BUTTON FARBEN AKTUALISIEREN
--------------------------------- */
function updateButtonColors(color) {
    // "+" Button (addListBtn)
    addBtn.style.background = color;
    addBtn.style.boxShadow = `0 4px 0 ${adjustColor(color, -20)}`;
    
    // "Hinzufügen" Button
    addBtn.style.background = color;
    addBtn.style.boxShadow = `0 4px 0 ${adjustColor(color, -20)}`;
    
    // Filter Buttons (wenn nicht aktiv)
    filterBtns.forEach(btn => {
        if (!btn.classList.contains('active')) {
            btn.style.background = color;
            btn.style.boxShadow = `0 3px 0 ${adjustColor(color, -20)}`;
        }
    });
}

function adjustColor(color, amount) {
    const num = parseInt(color.replace("#",""), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${(0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/* -------------------------------
   SCROLL VERHALTEN
--------------------------------- */
function checkScroll() {
    const body = document.body;
    const html = document.documentElement;
    const pageHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight);
    const viewportHeight = window.innerHeight;
    if (pageHeight <= viewportHeight) body.classList.add("no-scroll");
    else body.classList.remove("no-scroll");
}

window.addEventListener("load", checkScroll);
window.addEventListener("resize", checkScroll);

/* -------------------------------
   MENÜ
--------------------------------- */
menuBtn.addEventListener("click", e => {
    e.stopPropagation();
    menuDropdown.style.display = menuDropdown.style.display === "flex" ? "none" : "flex";
});

document.addEventListener("click", e => {
    if (!menuDropdown.contains(e.target) && e.target !== menuBtn) menuDropdown.style.display = "none";
});

/* -------------------------------
   LISTENNAME BEARBEITEN
--------------------------------- */
let lastTapTitle = 0;
function handleTouchEditTitle() {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTitle;
    if (tapLength < 300 && tapLength > 0) startEditingListTitle();
    lastTapTitle = currentTime;
}

listTitle.addEventListener("dblclick", startEditingListTitle);
listTitle.addEventListener("touchend", handleTouchEditTitle);

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

/* -------------------------------
   SPEICHERN
--------------------------------- */
function saveLists() {
    if (!Array.isArray(todos)) todos = [];
    lists[currentList].todos = todos;
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
   TODOS BEARBEITEN
--------------------------------- */
let lastTapTodo = 0;
function handleTouchEdit(span, index) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTapTodo;
    if (tapLength < 300 && tapLength > 0) startEditing(span, index);
    lastTapTodo = currentTime;
}

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
   KATEGORISIERUNG
--------------------------------- */
const itemCategories = {
    'milch': 'Milchprodukte', 'käse': 'Milchprodukte', 'joghurt': 'Milchprodukte',
    'butter': 'Milchprodukte', 'sahne': 'Milchprodukte', 'quark': 'Milchprodukte',
    'äpfel': 'Obst & Gemüse', 'apfel': 'Obst & Gemüse', 'bananen': 'Obst & Gemüse',
    'banane': 'Obst & Gemüse', 'tomaten': 'Obst & Gemüse', 'tomate': 'Obst & Gemüse',
    'salat': 'Obst & Gemüse', 'gurke': 'Obst & Gemüse', 'karotten': 'Obst & Gemüse',
    'fleisch': 'Fleisch & Wurst', 'wurst': 'Fleisch & Wurst', 'schinken': 'Fleisch & Wurst',
    'brot': 'Brot & Backwaren', 'brötchen': 'Brot & Backwaren', 'toast': 'Brot & Backwaren',
    'wasser': 'Getränke', 'saft': 'Getränke', 'cola': 'Getränke', 'bier': 'Getränke',
    'kaffee': 'Getränke', 'tee': 'Getränke', 'chips': 'Snacks', 'schokolade': 'Snacks',
    'kekse': 'Snacks', 'pizza': 'Tiefkühl', 'eis': 'Tiefkühl', 'pommes': 'Tiefkühl',
    'toilettenpapier': 'Haushalt', 'spülmittel': 'Haushalt', 'waschmittel': 'Haushalt',
    'shampoo': 'Drogerie', 'duschgel': 'Drogerie', 'zahnpasta': 'Drogerie'
};

function getCategoryForItem(itemText) {
    const lowerText = itemText.toLowerCase();
    if (itemCategories[lowerText]) return itemCategories[lowerText];
    for (const [key, category] of Object.entries(itemCategories)) {
        if (lowerText.includes(key)) return category;
    }
    return 'Sonstiges';
}

function getItemsByCategory(items) {
    const categorized = {};
    items.forEach(item => {
        if (item.erledigt) return;
        const category = getCategoryForItem(item.text);
        if (!categorized[category]) categorized[category] = [];
        categorized[category].push(item);
    });
    return categorized;
}

/* -------------------------------
   RENDERN
--------------------------------- */
function render() {
    list.innerHTML = "";
    if (!todos || !Array.isArray(todos)) { todos = []; saveLists(); }

    const currentListData = lists[currentList];
    const isShoppingList = currentListData && currentListData.type === 'shopping';

    if (isShoppingList) {
        const categorizedItems = getItemsByCategory(todos);
        const sortedCategories = Object.keys(categorizedItems).sort();

        sortedCategories.forEach(category => {
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'category-header';
            categoryHeader.textContent = category;
            list.appendChild(categoryHeader);

            categorizedItems[category].forEach(todo => {
                const originalIndex = todos.indexOf(todo);
                createTodoElement(todo, originalIndex);
            });
        });

        const completedItems = todos.filter(t => t.erledigt);
        if (completedItems.length > 0) {
            const completedHeader = document.createElement('div');
            completedHeader.className = 'category-header';
            completedHeader.textContent = 'Erledigt';
            completedHeader.style.color = '#636366';
            list.appendChild(completedHeader);

            completedItems.forEach(todo => {
                const originalIndex = todos.indexOf(todo);
                createTodoElement(todo, originalIndex);
            });
        }
    } else {
        todos.forEach((todo, index) => {
            if (filter === "offen" && todo.erledigt) return;
            if (filter === "erledigt" && !todo.erledigt) return;
            createTodoElement(todo, index);
        });
    }

    updateCounter();
    checkScroll();
}

function createTodoElement(todo, index) {
    const li = document.createElement("li");
    li.dataset.index = index;
    li.style.transition = "transform 0.15s ease-out, box-shadow 0.15s ease-out";

    const leftDiv = document.createElement("div");
    leftDiv.className = "li-left";

    const dragHandle = document.createElement("div");
    dragHandle.className = "drag-handle";
    dragHandle.draggable = true;
    dragHandle.textContent = "⋮⋮";
    dragHandle.addEventListener("touchstart", handleTouchStart, { passive: false });
    dragHandle.addEventListener("touchmove", handleTouchMove, { passive: false });
    dragHandle.addEventListener("touchend", handleTouchEnd, { passive: false });

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.dataset.action = "toggle";
    checkbox.dataset.index = index;
    if (todo.erledigt) checkbox.checked = true;

    leftDiv.appendChild(dragHandle);
    leftDiv.appendChild(checkbox);

    const span = document.createElement("span");
    span.textContent = todo.text;
    if (todo.erledigt) span.classList.add("erledigt");
    span.addEventListener("dblclick", e => { e.stopPropagation(); startEditing(span, index); });
    span.addEventListener("touchend", e => { e.stopPropagation(); handleTouchEdit(span, index); });

    const delBtn = document.createElement("button");
    delBtn.textContent = "X";
    delBtn.className = "delete";
    delBtn.dataset.action = "delete";
    delBtn.dataset.index = index;

    li.appendChild(leftDiv);
    li.appendChild(span);
    li.appendChild(delBtn);
    list.appendChild(li);
}

/* -------------------------------
   TODOS HINZUFÜGEN
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
   FILTER
--------------------------------- */
filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const value = btn.dataset.filter;
        if (filter === value) { filter = null; btn.classList.remove("active"); }
        else { filter = value; filterBtns.forEach(b => b.classList.remove("active")); btn.classList.add("active"); }
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
    items.forEach(li => { const idx = Number(li.dataset.index); if (todos[idx] !== undefined) newTodos.push(todos[idx]); });
    if (newTodos.length === todos.length) { todos = newTodos; saveLists(); render(); } else render();
});

function getDragAfterElement(container, y) {
    const elements = [...container.querySelectorAll("li:not(.dragging)")];
    return elements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset, element: child };
        else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/* -------------------------------
   TOUCH DRAG
--------------------------------- */
let touchItem = null, touchStartY = 0, touchStartX = 0, hasMoved = false;

function handleTouchStart(e) {
    const handle = e.target.closest(".drag-handle");
    if (!handle) return;
    const li = handle.closest("li");
    if (!li) return;
    touchItem = li;
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    hasMoved = false;
}

function handleTouchMove(e) {
    if (!touchItem) return;
    const touch = e.touches[0];
    const moveY = Math.abs(touch.clientY - touchStartY);
    const moveX = Math.abs(touch.clientX - touchStartX);
    if (!hasMoved && moveY > 10 && moveY > moveX) { hasMoved = true; touchItem.classList.add("dragging"); }
    if (!hasMoved) return;
    e.preventDefault();
    const after = getDragAfterElement(list, touch.clientY);
    if (after == null) list.appendChild(touchItem);
    else list.insertBefore(touchItem, after);
}

function handleTouchEnd() {
    if (!touchItem) return;
    touchItem.classList.remove("dragging");
    if (hasMoved) {
        const items = Array.from(list.children), newTodos = [];
        items.forEach(li => { const idx = Number(li.dataset.index); if (todos[idx] !== undefined) newTodos.push(todos[idx]); });
        if (newTodos.length === todos.length) { todos = newTodos; saveLists(); render(); }
    }
    touchItem = null; hasMoved = false;
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
        
        const listColor = lists[name].color || "#0a84ff";
        btn.style.background = listColor;
        btn.style.boxShadow = `0 2px 0 ${adjustColor(listColor, -20)}`;
        
        btn.onclick = () => {
            saveLists();
            currentList = name;
            todos = lists[name].todos || [];
            listTitle.textContent = name;
            updateButtonColors(listColor);
            renderTabs();
            render();
        };
        
        const del = document.createElement("button");
        del.textContent = "X";
        del.onclick = e => {
            e.stopPropagation();
            if (!confirm(`Liste "${name}" löschen?`)) return;
            delete lists[name];
            currentList = Object.keys(lists)[0] || "Meine Liste";
            if (!lists[currentList]) lists[currentList] = { todos: [], type: "todo", color: "#0a84ff" };
            todos = lists[currentList].todos || [];
            listTitle.textContent = currentList;
            const newColor = lists[currentList].color || "#0a84ff";
            updateButtonColors(newColor);
            saveLists();
            renderTabs();
            render();
        };
        
        wrapper.appendChild(btn);
        wrapper.appendChild(del);
        listTabs.appendChild(wrapper);
    }
}

/* -------------------------------
   MODAL FUNKTIONEN
--------------------------------- */
addListBtn.addEventListener("click", () => {
    listNameInput.value = "";
    listTypeSelect.value = "todo";
    colorCircles.forEach(c => c.classList.remove("selected"));
    colorCircles[5].classList.add("selected");
    selectedColor = "#0a84ff";
    colorPreview.style.color = selectedColor;
    addListModal.style.display = "flex";
    // KEIN focus() - Tastatur öffnet sich nicht automatisch
});

closeModalBtn.addEventListener("click", () => {
    addListModal.style.display = "none";
});

// Wenn Listentyp geändert wird
listTypeSelect.addEventListener("change", () => {
    if (listTypeSelect.value === "shopping") {
        listNameInput.value = "Einkaufsliste"; // 🔥 Automatischer Name!
    } else {
        listNameInput.value = "";
    }
});

colorCircles.forEach(circle => {
    circle.addEventListener("click", () => {
        colorCircles.forEach(c => c.classList.remove("selected"));
        circle.classList.add("selected");
        selectedColor = circle.dataset.color;
        colorPreview.style.color = selectedColor;
    });
});

confirmAddListBtn.addEventListener("click", () => {
    const name = listNameInput.value.trim();
    if (!name) {
        alert("Bitte einen Namen eingeben!");
        return;
    }
    if (lists[name]) {
        alert("Liste existiert bereits!");
        return;
    }
    const type = listTypeSelect.value;
    
    lists[name] = { todos: [], type: type, color: selectedColor };
    currentList = name;
    todos = lists[name].todos;
    listTitle.textContent = name;
    
    updateButtonColors(selectedColor);
    
    saveLists();
    renderTabs();
    render();
    addListModal.style.display = "none";
});

addListModal.addEventListener("click", (e) => {
    if (e.target === addListModal) addListModal.style.display = "none";
});

/* -------------------------------
   SERVICE WORKER
--------------------------------- */
if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js").catch(err => console.log("SW Fehler:", err));

/* -------------------------------
   START
--------------------------------- */
renderTabs();
render();
