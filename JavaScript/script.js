// App Variablen
let lists = {};
let listOrder = [];
let currentList = "";
let todos = [];
let filter = null;
let selectedColor = "#0a84ff";
let currentListColor = "#0a84ff";

// DOM Elemente
const list = document.getElementById("todoList");
const filterBtns = document.querySelectorAll(".filter-btn");
const counter = document.getElementById("counter");
const listTabs = document.getElementById("listTabs");
const listTitle = document.getElementById("listTitle");
const menuBtn = document.getElementById("menuBtn");
const menuDropdown = document.getElementById("menuDropdown");
const addListBtn = document.getElementById("addListBtn");
const addListModal = document.getElementById("addListModal");
const listNameInput = document.getElementById("listNameInput");
const listTypeSelect = document.getElementById("listTypeSelect");
const colorCircles = document.querySelectorAll(".color-circle");
const confirmAddListBtn = document.getElementById("confirmAddListBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const colorPreview = document.getElementById("colorPreview");
const input = document.getElementById("todoInput");
const addBtn = document.getElementById("addBtn");

/* -------------------------------   DATEN (LOCALSTORAGE)   ------------------------------- */
function loadData() {
    const savedData = localStorage.getItem('todo_app_data');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            lists = data.lists || {};
            listOrder = data.listOrder || [];
            currentList = data.currentList || "";
        } catch (e) {
            console.error("Fehler beim Laden:", e);
            resetToDefaults();
        }
    } else {
        resetToDefaults();
    }

    if (!lists[currentList] || listOrder.length === 0) {
        resetToDefaults();
    }

    todos = lists[currentList]?.todos || [];
    listTitle.textContent = currentList;
    currentListColor = lists[currentList]?.color || "#0a84ff";
    
    updateButtonColors(currentListColor);
    renderTabs();
    render();
}

function resetToDefaults() {
    lists = { "Meine Liste": { todos: [], type: "todo", color: "#0a84ff" } };
    listOrder = ["Meine Liste"];
    currentList = "Meine Liste";
    todos = [];
}

function saveData() {
    const data = { lists, listOrder, currentList };
    localStorage.setItem('todo_app_data', JSON.stringify(data));
}

/* -------------------------------   UI FUNKTIONEN   ------------------------------- */
function updateButtonColors(color) {
    currentListColor = color;
    addListBtn.style.background = color;
    addListBtn.style.boxShadow = `0 4px 0 ${adjustColor(color, -20)}`;

    addBtn.style.background = color;
    addBtn.style.boxShadow = `0 4px 0 ${adjustColor(color, -20)}`;

    menuBtn.style.background = color;
    menuBtn.style.boxShadow = `0 4px 0 ${adjustColor(color, -20)}`;

    filterBtns.forEach(btn => {
        if (!btn.classList.contains('active')) {
            btn.style.background = color;
            btn.style.boxShadow = `0 3px 0 ${adjustColor(color, -20)}`;
        } else {
            btn.style.border = "2px solid white";
        }
    });

    confirmAddListBtn.style.background = color;
    confirmAddListBtn.style.boxShadow = `0 4px 0 ${adjustColor(color, -20)}`;

    updateColorSelectionRing(color);
}

function adjustColor(color, amount) {
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${(0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function updateColorSelectionRing(selectedColor) {
    colorCircles.forEach(circle => {
        circle.classList.remove("selected");
        circle.style.boxShadow = "none";
        if (circle.dataset.color === selectedColor) {
            circle.classList.add("selected");
            circle.style.boxShadow = `0 0 0 2px white, 0 0 0 4px ${selectedColor}`;
        }
    });
}

/* -------------------------------   MENU   ------------------------------- */
menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    menuDropdown.classList.toggle("show");
});
document.addEventListener("click", (e) => {
    if (!menuDropdown.contains(e.target) && e.target !== menuBtn && e.target !== addListBtn) {
        menuDropdown.classList.remove("show");
    }
});

/* -------------------------------   LISTENNAME BEARBEITEN   ------------------------------- */
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

    inputField.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        text-align: center;
        font-size: ${window.innerWidth <= 600 ? '28px' : '32px'};
        font-weight: 700;
        letter-spacing: -0.5px;
        padding: 0;
        margin: 0;
        border: 2px solid ${currentListColor};
        border-radius: 12px;
        background: #2a2a2e;
        color: white;
        outline: none;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    listTitle.style.position = "relative";
    listTitle.style.height = window.innerWidth <= 600 ? "40px" : "48px";
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
                listTitle.style.height = "";
                listTitle.style.position = "";
                return;
            }
            lists[newName] = lists[currentList];
            delete lists[currentList];
            const idx = listOrder.indexOf(currentList);
            listOrder.splice(idx, 1);
            listOrder.splice(idx, 0, newName);
            currentList = newName;
            saveData();
            renderTabs();
        }
        listTitle.textContent = currentList;
        listTitle.style.height = "";
        listTitle.style.position = "";
    };

    inputField.addEventListener("blur", saveEdit);
    inputField.addEventListener("keypress", e => { 
        if (e.key === "Enter") inputField.blur(); 
    });
    inputField.addEventListener("keydown", e => { 
        if (e.key === "Escape") {
            listTitle.textContent = currentList;
            listTitle.style.height = "";
            listTitle.style.position = "";
        }
    });
}

/* -------------------------------   COUNTER   ------------------------------- */
function updateCounter() {
    const done = todos.filter(t => t.erledigt).length;
    counter.textContent = `${done} von ${todos.length} erledigt`;
}

/* -------------------------------   TODOS BEARBEITEN   ------------------------------- */
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
        saveData();
        render();
    };

    inputField.addEventListener("blur", saveEdit);
    inputField.addEventListener("keypress", e => { if (e.key === "Enter") inputField.blur(); });
    inputField.addEventListener("keydown", e => { if (e.key === "Escape") render(); });
}

/* -------------------------------   KATEGORISIERUNG   ------------------------------- */
const internalSubCategories = {
    'Milchprodukte': ['milch', 'käse', 'joghurt', 'butter', 'sahne', 'quark', 'obers', 'topfen', 'frischkäse', 'mozzarella', 'feta', 'parmesan', 'gouda', 'emmentaler', 'camembert', 'brie', 'ricotta', 'hüttenkäse', 'schmelzkäse', 'margarine', 'eier', 'ei'],
    'Obst': ['apfel', 'birne', 'banane', 'orange', 'mandarine', 'zitrone', 'limette', 'traube', 'erdbeere', 'himbeere', 'heidelbeere', 'kirsche', 'pfirsich', 'marille', 'aprikose', 'melone', 'ananas', 'mango', 'kiwi', 'obst'],
    'Gemüse': ['tomate', 'gurke', 'salat', 'karotte', 'zwiebel', 'kartoffel', 'erdapfel', 'paprika', 'zucchini', 'aubergine', 'brokkoli', 'blumenkohl', 'kohl', 'kraut', 'spinat', 'lauch', 'sellerie', 'spargel', 'kürbis', 'pilz', 'champignon', 'knoblauch', 'ingwer', 'gemüse'],
    'Fleisch': ['fleisch', 'rind', 'schwein', 'kalb', 'lamm', 'huhn', 'hähnchen', 'pute', 'steak', 'schnitzel', 'fisch', 'lachs', 'thunfisch', 'garnelen', 'speck', 'schinken', 'bauch', 'ripperl', 'wammerl', 'beuschel'],
    'Wurst': ['wurst', 'salami', 'extrawurst', 'fleischwurst', 'käsekrainer', 'debreziner', 'bratwurst', 'wiener', 'frankfurter', 'leberkäse', 'pastete'],
    'Brot': ['brot', 'semmel', 'brötchen', 'weckerl', 'baguette', 'toast', 'vollkornbrot', 'mehl', 'nudel', 'pasta', 'spaghetti', 'reis', 'haferflocken', 'müsli', 'kuchen', 'torte', 'gebäck', 'kipferl', 'croissant', 'pizza'],
    'Getränke': ['wasser', 'saft', 'cola', 'bier', 'wein', 'sekt', 'limonade', 'energy', 'kaffee', 'tee', 'kakao', 'schnaps', 'wodka', 'whisky', 'most'],
    'Snacks': ['chips', 'flips', 'popcorn', 'cracker', 'salzstangen', 'nüsse', 'erdnuss', 'mandel', 'riegel', 'keks', 'gebäck', 'waffel', 'knabber'],
    'Süßigkeiten': ['schokolade', 'schoki', 'nougat', 'bonbon', 'lutscher', 'kaugummi', 'gummibärchen', 'lakritz', 'nutella', 'eis', 'eiscreme'],
    'Haushalt': ['papier', 'toilettenpapier', 'küchenpapier', 'taschentuch', 'tempo', 'reiniger', 'spülmittel', 'waschmittel', 'putzmittel', 'müllbeutel', 'schwamm', 'lappen', 'bürste', 'batterie', 'seife'],
    'Sonstiges': ['geschenk', 'buch', 'tier', 'hundefutter', 'katzenfutter', 'apotheke', 'medizin', 'kosmetik', 'shampoo', 'creme', 'deo']
};

function getInternalCategory(itemText) {
    const lowerText = itemText.toLowerCase().trim();
    const compoundPatterns = [
        { pattern: /(milch)(.*)(brot|semmel|weckerl)/i, category: 'Brot' },
        { pattern: /(vollkorn)(.*)(brot)/i, category: 'Brot' },
        { pattern: /(fleisch)(.*)(wurst)/i, category: 'Wurst' },
        { pattern: /(schoko)(.*)(lade|riegel)/i, category: 'Süßigkeiten' },
        { pattern: /(apfel)(.*)(saft)/i, category: 'Getränke' },
        { pattern: /(tomaten)(.*)(saft|mark)/i, category: 'Gemüse' },
        { pattern: /(schwein)(.*)(bauch|ripperl)/i, category: 'Fleisch' }
    ];

    for (const { pattern, category } of compoundPatterns) {
        if (pattern.test(lowerText)) return category;
    }

    const endKeywords = {
        'brot': 'Brot', 'semmel': 'Brot', 'weckerl': 'Brot',
        'milch': 'Milchprodukte', 'käse': 'Milchprodukte',
        'wurst': 'Wurst', 'fleisch': 'Fleisch', 'fisch': 'Fleisch',
        'apfel': 'Obst', 'tomate': 'Gemüse', 'kartoffel': 'Gemüse',
        'saft': 'Getränke', 'wasser': 'Getränke',
        'schokolade': 'Süßigkeiten', 'eis': 'Süßigkeiten',
        'papier': 'Haushalt', 'mittel': 'Haushalt'
    };

    for (const [ending, category] of Object.entries(endKeywords)) {
        if (lowerText.endsWith(ending)) return category;
    }

    for (const [category, keywords] of Object.entries(internalSubCategories)) {
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) return category;
        }
    }
    return 'Sonstiges';
}

function getMainCategory(itemText) {
    const internal = getInternalCategory(itemText);
    const foodCategories = ['Milchprodukte', 'Obst', 'Gemüse', 'Fleisch', 'Wurst', 'Brot', 'Getränke', 'Snacks', 'Süßigkeiten'];
    if (foodCategories.includes(internal)) return 'Lebensmittel';
    if (internal === 'Haushalt') return 'Haushalt';
    return 'Sonstiges';
}

function getFoodSortOrder(internalCategory) {
    const order = ['Milchprodukte', 'Obst', 'Gemüse', 'Fleisch', 'Wurst', 'Brot', 'Getränke', 'Snacks', 'Süßigkeiten'];
    return order.indexOf(internalCategory);
}

/* -------------------------------   ZAHLEN HERVORHEBEN (FIX)   ------------------------------- */
function highlightNumbers(text) {
    const numberPattern = /^(\d+(?:\.?\d*)?\s*(?:g|kg|ml|l|st|stk|dag|cm|dm|mm|m|dl|cl|pack|packung|dose|flasche|glas)?)\s*/i;
    const match = text.match(numberPattern);
    
    if (match) {
        const number = match[1].trim();
        const rest = text.slice(match[0].length).trimStart();
        return `<span class="quantity">${number}</span>${rest ? ' ' + rest : ''}`;
    }
    return text;
}

/* -------------------------------   RENDERN   ------------------------------- */
function render() {
    list.innerHTML = "";
    if (!todos || !Array.isArray(todos)) todos = [];

    const currentListData = lists[currentList];
    const isShoppingList = currentListData && currentListData.type === 'shopping';

    if (isShoppingList) {
        let displayTodos = todos;
        if (filter === "offen") displayTodos = todos.filter(t => !t.erledigt);
        else if (filter === "erledigt") displayTodos = todos.filter(t => t.erledigt);
        
        const itemsWithIndex = displayTodos.map(todo => ({
            ...todo,
            originalIndex: todos.indexOf(todo)
        }));
        
        const categorizedItems = { 'Lebensmittel': [], 'Haushalt': [], 'Sonstiges': [] };
        
        itemsWithIndex.forEach(item => {
            const mainCat = getMainCategory(item.text);
            const internalCat = getInternalCategory(item.text);
            categorizedItems[mainCat].push({
                ...item,
                _internalCategory: internalCat,
                _sortOrder: getFoodSortOrder(internalCat)
            });
        });
        
        categorizedItems['Lebensmittel'].sort((a, b) => {
            if (a._sortOrder !== b._sortOrder) return a._sortOrder - b._sortOrder;
            return a.text.localeCompare(b.text);
        });
        categorizedItems['Haushalt'].sort((a, b) => a.text.localeCompare(b.text));
        categorizedItems['Sonstiges'].sort((a, b) => a.text.localeCompare(b.text));
        
        ['Lebensmittel', 'Haushalt', 'Sonstiges'].forEach(category => {
            if (categorizedItems[category].length > 0) {
                const categoryHeader = document.createElement('div');
                categoryHeader.className = 'category-header';
                categoryHeader.textContent = category;
                list.appendChild(categoryHeader);

                categorizedItems[category].forEach(item => createTodoElement(item, item.originalIndex, true));
            }
        });
    } else {
        todos.forEach((todo, index) => {
            if (filter === "offen" && todo.erledigt) return;
            if (filter === "erledigt" && !todo.erledigt) return;
            createTodoElement(todo, index, false);
        });
    }

    updateCounter();
    updateFilterButtons();
}

function createTodoElement(todo, index, isShoppingList = false) {
    const li = document.createElement("li");
    li.dataset.index = index;
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
    span.innerHTML = isShoppingList ? highlightNumbers(todo.text) : todo.text;
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

/* -------------------------------   FILTER BUTTONS   ------------------------------- */
function updateFilterButtons() {
    filterBtns.forEach(btn => {
        btn.classList.remove("active");
        btn.style.background = currentListColor;
        btn.style.boxShadow = `0 3px 0 ${adjustColor(currentListColor, -20)}`;
        btn.style.border = "2px solid transparent";
        btn.style.transform = "scale(1)";
        if (btn.dataset.filter === filter) {
            btn.classList.add("active");
            btn.style.border = "2px solid white";
            btn.style.transform = "scale(1.08)";
        }
    });
}

/* -------------------------------   TODOS HINZUFÜGEN   ------------------------------- */
function addTodo() {
    const text = input.value.trim();
    if (!text) return;
    todos.push({ text, erledigt: false });
    input.value = "";
    input.blur();
    lists[currentList].todos = todos;
    saveData();
    render();
}
addBtn.addEventListener("click", addTodo);
input.addEventListener("keypress", e => { if (e.key === "Enter") addTodo(); });

/* -------------------------------   EVENT DELEGATION   ------------------------------- */
list.addEventListener("click", e => {
    const target = e.target;
    const action = target.dataset.action;
    const index = target.dataset.index;
    if (!action || index === undefined) return;
    const idx = Number(index);

    if (action === "toggle" && todos[idx]) {
        todos[idx].erledigt = !todos[idx].erledigt;
        lists[currentList].todos = todos;
        saveData();
        render();
    }
    if (action === "delete" && todos[idx]) {
        todos.splice(idx, 1);
        lists[currentList].todos = todos;
        saveData();
        render();
    }
});

/* -------------------------------   FILTER   ------------------------------- */
filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const value = btn.dataset.filter;
        filter = (filter === value) ? null : value;
        saveData();
        render();
    });
});

/* -------------------------------   DRAG & DROP   ------------------------------- */
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
    items.forEach(li => {
        const idx = Number(li.dataset.index);
        if (todos[idx] !== undefined) newTodos.push(todos[idx]);
    });
    if (newTodos.length === todos.length) {
        todos = newTodos;
        lists[currentList].todos = todos;
        saveData();
        render();
    } else render();
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

/* -------------------------------   TOUCH DRAG (TODOS)   ------------------------------- */
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
    if (!hasMoved && moveY > 10 && moveY > moveX) {
        hasMoved = true;
        touchItem.classList.add("dragging");
    }
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
        items.forEach(li => {
            const idx = Number(li.dataset.index);
            if (todos[idx] !== undefined) newTodos.push(todos[idx]);
        });
        if (newTodos.length === todos.length) {
            todos = newTodos;
            lists[currentList].todos = todos;
            saveData();
            render();
        }
    }
    touchItem = null; hasMoved = false;
}

/* -------------------------------   LISTEN MENÜ & DRAG   ------------------------------- */
let listDragItem = null;
let listTouchStartY = 0;
let listHasMoved = false;
let listLongPressTimer = null;

function renderTabs() {
    listTabs.innerHTML = "";
    listOrder.forEach((name) => {
        if (!lists[name]) return;
        const wrapper = document.createElement("div");
        wrapper.className = "list-item";
        wrapper.dataset.name = name;
        
        const btn = document.createElement("button");
        btn.textContent = name;
        const listColor = lists[name].color || "#0a84ff";
        btn.style.background = listColor;
        btn.style.boxShadow = `0 2px 0 ${adjustColor(listColor, -20)}`;
        
        btn.onclick = () => {
            if (listHasMoved) return;
            currentList = name;
            todos = lists[name].todos || [];
            listTitle.textContent = name;
            updateButtonColors(listColor);
            renderTabs();
            render();
            saveData();
        };
        
        // FIX: Dynamische Schattenfarbe beim Greifen
        btn.addEventListener("touchstart", (e) => {
            listLongPressTimer = setTimeout(() => {
                listDragItem = btn;
                listTouchStartY = e.touches[0].clientY;
                listHasMoved = false;
                btn.classList.add("dragging");
                
                // Berechne RGBA aus Hex für korrekten Schatten
                const r = parseInt(listColor.slice(1,3), 16);
                const g = parseInt(listColor.slice(3,5), 16);
                const b = parseInt(listColor.slice(5,7), 16);
                btn.style.boxShadow = `0 15px 40px rgba(${r},${g},${b},0.4), 0 0 0 2px white`;
                
                document.body.style.overflow = 'hidden';
                document.body.style.touchAction = 'none';
            }, 500);
        });
        
        btn.addEventListener("touchmove", (e) => {
            if (!listDragItem) return;
            const touch = e.touches[0];
            const moveY = Math.abs(touch.clientY - listTouchStartY);
            if (moveY > 10) {
                listHasMoved = true;
                e.preventDefault();
                e.stopPropagation();
                const items = Array.from(listTabs.querySelectorAll(".list-item"));
                const touchY = touch.clientY;
                for (let item of items) {
                    const itemBtn = item.querySelector("button:first-child");
                    if (itemBtn === listDragItem) continue;
                    const rect = item.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    if (touchY < midY && item === items[0]) {
                        listTabs.insertBefore(listDragItem.closest(".list-item"), item);
                        break;
                    } else if (touchY > midY && item === items[items.length - 1]) {
                        listTabs.appendChild(listDragItem.closest(".list-item"));
                        break;
                    } else if (touchY > midY) {
                        listTabs.insertBefore(listDragItem.closest(".list-item"), item.nextSibling);
                        break;
                    }
                }
            }
        });
        
        btn.addEventListener("touchend", () => {
            clearTimeout(listLongPressTimer);
            document.body.style.overflow = '';
            document.body.style.touchAction = 'pan-y';
            if (listDragItem) {
                btn.classList.remove("dragging");
                // Originalen Schatten wiederherstellen
                const listColor = lists[wrapper.dataset.name].color || "#0a84ff";
                btn.style.boxShadow = `0 2px 0 ${adjustColor(listColor, -20)}`;
                
                if (listHasMoved) {
                    const newOrder = Array.from(listTabs.querySelectorAll(".list-item")).map(item => item.dataset.name);
                    listOrder = newOrder;
                    saveData();
                }
                listDragItem = null;
                listHasMoved = false;
            }
        });
        
        btn.addEventListener("touchcancel", () => {
            clearTimeout(listLongPressTimer);
            document.body.style.overflow = '';
            document.body.style.touchAction = 'pan-y';
            if (listDragItem) {
                btn.classList.remove("dragging");
                const listColor = lists[wrapper.dataset.name].color || "#0a84ff";
                btn.style.boxShadow = `0 2px 0 ${adjustColor(listColor, -20)}`;
                listDragItem = null;
                listHasMoved = false;
            }
        });
        
        const del = document.createElement("button");
        del.textContent = "X";
        del.onclick = e => {
            e.stopPropagation();
            if (!confirm(`Liste "${name}" löschen?`)) return;
            delete lists[name];
            listOrder = listOrder.filter(n => n !== name);
            
            if (listOrder.length === 0) {
                resetToDefaults();
            } else {
                currentList = listOrder[0];
            }
            todos = lists[currentList].todos || [];
            listTitle.textContent = currentList;
            const newColor = lists[currentList].color || "#0a84ff";
            updateButtonColors(newColor);
            saveData();
            renderTabs();
            render();
        };
        
        wrapper.appendChild(btn);
        wrapper.appendChild(del);
        listTabs.appendChild(wrapper);
    });
}

/* -------------------------------   MODAL   ------------------------------- */
addListBtn.addEventListener("click", () => {
    listNameInput.value = "";
    listTypeSelect.value = "todo";
    colorCircles.forEach(c => {
        c.classList.remove("selected");
        c.style.boxShadow = "none";
    });
    colorCircles[5].classList.add("selected");
    selectedColor = "#0a84ff";
    colorPreview.style.color = selectedColor;
    updateColorSelectionRing(selectedColor);
    addListModal.style.display = "flex";
});

closeModalBtn.addEventListener("click", () => {
    addListModal.style.display = "none";
});

listTypeSelect.addEventListener("change", () => {
    if (listTypeSelect.value === "shopping") {
        listNameInput.value = "Einkaufsliste";
        selectedColor = "#34c759";
        colorCircles.forEach(c => { c.classList.remove("selected"); c.style.boxShadow = "none"; });
        const greenCircle = document.querySelector('.color-circle[data-color="#34c759"]');
        if (greenCircle) {
            greenCircle.classList.add("selected");
            colorPreview.style.color = "#34c759";
            updateColorSelectionRing("#34c759");
        }
    } else {
        listNameInput.value = "";
        selectedColor = "#0a84ff";
        colorCircles.forEach(c => { c.classList.remove("selected"); c.style.boxShadow = "none"; });
        colorCircles[5].classList.add("selected");
        colorPreview.style.color = "#0a84ff";
        updateColorSelectionRing("#0a84ff");
    }
});

colorCircles.forEach(circle => {
    circle.addEventListener("click", () => {
        selectedColor = circle.dataset.color;
        colorPreview.style.color = selectedColor;
        updateColorSelectionRing(selectedColor);
    });
});

confirmAddListBtn.addEventListener("click", () => {
    const name = listNameInput.value.trim();
    if (!name) { alert("Bitte einen Namen eingeben!"); return; }
    if (lists[name]) { alert("Liste existiert bereits!"); return; }
    const type = listTypeSelect.value;
    lists[name] = { todos: [], type: type, color: selectedColor };
    listOrder.push(name);
    currentList = name;
    todos = lists[name].todos;
    listTitle.textContent = name;
    updateButtonColors(selectedColor);
    saveData();
    renderTabs();
    render();
    addListModal.style.display = "none";
});

addListModal.addEventListener("click", (e) => {
    if (e.target === addListModal) addListModal.style.display = "none";
});

/* -------------------------------   START   ------------------------------- */
loadData();
