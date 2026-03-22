/* ===================================
   🔥 FIREBASE KONFIGURATION
   =================================== */
const firebaseConfig = {
    apiKey: "AIzaSyAd-m4ivSitRoH2IHjZS8N9TO4N6o3f0-c",
    authDomain: "todo-c28f9.firebaseapp.com",
    projectId: "todo-c28f9",
    storageBucket: "todo-c28f9.firebasestorage.app",
    messagingSenderId: "877149325722",
    appId: "1:877149325722:web:aecf751686620fd2715223",
    measurementId: "G-WF68HR6TLN"
};

// Firebase initialisieren
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

/* ===================================
   VARIABLEN
   =================================== */
let currentUser = null;
let isRegisterMode = false;

// UI Elemente
const authModal = document.getElementById("authModal");
const mainApp = document.getElementById("mainApp");
const authTitle = document.getElementById("authTitle");
const authUsername = document.getElementById("authUsername");
const authPassword = document.getElementById("authPassword");
const rememberMe = document.getElementById("rememberMe");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authToggle = document.getElementById("authToggle");
const authError = document.getElementById("authError");
const logoutBtn = document.getElementById("logoutBtn");

// App Elemente
let input, addBtn, list, filterBtns, counter, listTabs, listTitle, menuBtn, menuDropdown, addListBtn;
let addListModal, listNameInput, listTypeSelect, colorCircles, confirmAddListBtn, closeModalBtn, colorPreview;
let autocompleteList;

let lists = {};
let listOrder = [];
let currentList = "Meine Liste";
let filter = null;
let selectedColor = "#0a84ff";
let todos = [];

/* ===================================
   🔥 AUTHENTIFIZIERUNG
   =================================== */

// Prüfen ob User bereits eingeloggt ist
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        if (authModal) authModal.style.display = "none";
        if (mainApp) mainApp.style.display = "flex";
        initApp();
        await loadData();
    } else {
        currentUser = null;
        if (authModal) authModal.style.display = "flex";
        if (mainApp) mainApp.style.display = "none";
    }
});

// Login/Register Toggle
function toggleAuthMode() {
    isRegisterMode = !isRegisterMode;
    if (isRegisterMode) {
        authTitle.textContent = "Registrieren";
        authSubmitBtn.textContent = "Registrieren";
        authToggle.textContent = "Anmelden";
    } else {
        authTitle.textContent = "Anmelden";
        authSubmitBtn.textContent = "Anmelden";
        authToggle.textContent = "Registrieren";
    }
    authError.textContent = "";
}

// Passwort anzeigen/verbergen
function togglePassword() {
    const type = authPassword.type === "password" ? "text" : "password";
    authPassword.type = type;
}

// Login/Register Submit
authSubmitBtn.addEventListener("click", async () => {
    const username = authUsername.value.trim();
    const password = authPassword.value.trim();
    
    if (!username || !password) {
        authError.textContent = "Bitte alle Felder ausfüllen!";
        return;
    }
    
    if (password.length < 6) {
        authError.textContent = "Passwort muss mindestens 6 Zeichen haben!";
        return;
    }
    
    authSubmitBtn.classList.add("loading");
    authSubmitBtn.textContent = "Laden...";
    
    try {
        if (isRegisterMode) {
            // Registrieren
            const userCredential = await auth.createUserWithEmailAndPassword(username + "@todo.local", password);
            await userCredential.user.updateProfile({ displayName: username });
            
            // Leere Datenbank erstellen
            await db.collection("users").doc(userCredential.user.uid).set({
                lists: { "Meine Liste": { todos: [], type: "todo", color: "#0a84ff" } },
                listOrder: ["Meine Liste"],
                currentList: "Meine Liste",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            alert("Konto erstellt! Du bist jetzt angemeldet.");
        } else {
            // Login
            await auth.signInWithEmailAndPassword(username + "@todo.local", password);
            
            if (rememberMe.checked) {
                localStorage.setItem("rememberMe", "true");
            } else {
                localStorage.removeItem("rememberMe");
            }
        }
    } catch (error) {
        authError.textContent = getErrorMessage(error.code);
    }
    
    authSubmitBtn.classList.remove("loading");
    authSubmitBtn.textContent = isRegisterMode ? "Registrieren" : "Anmelden";
});

// Logout
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        auth.signOut().then(() => {
            location.reload();
        });
    });
}

// Fehlermeldungen
function getErrorMessage(code) {
    switch(code) {
        case "auth/user-not-found": return "Benutzer nicht gefunden!";
        case "auth/wrong-password": return "Falsches Passwort!";
        case "auth/email-already-in-use": return "Benutzername bereits vergeben!";
        case "auth/weak-password": return "Passwort zu schwach!";
        case "auth/invalid-email": return "Ungültiger Benutzername!";
        default: return "Fehler: " + code;
    }
}

/* ===================================
   🔥 DATEN LADEN/SPEICHERN (FIREBASE)
   =================================== */

async function loadData() {
    try {
        const doc = await db.collection("users").doc(currentUser.uid).get();
        if (doc.exists) {
            const data = doc.data();
            lists = data.lists || {};
            listOrder = data.listOrder || ["Meine Liste"];
            currentList = data.currentList || "Meine Liste";
            
            if (lists[currentList]) {
                todos = lists[currentList].todos || [];
                const listColor = lists[currentList].color || "#0a84ff";
                updateButtonColors(listColor);
            }
            
            if (listTitle) listTitle.textContent = currentList;
            renderTabs();
            render();
        }
    } catch (error) {
        console.error("Fehler beim Laden:", error);
    }
}

async function saveData() {
    if (!currentUser) return;
    
    try {
        await db.collection("users").doc(currentUser.uid).update({
            lists: lists,
            listOrder: listOrder,
            currentList: currentList,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error("Fehler beim Speichern:", error);
    }
}

/* ===================================
   APP INITIALISIERUNG
   =================================== */

function initApp() {
    input = document.getElementById("todoInput");
    addBtn = document.getElementById("addBtn");
    list = document.getElementById("todoList");
    filterBtns = document.querySelectorAll(".filter-btn");
    counter = document.getElementById("counter");
    listTabs = document.getElementById("listTabs");
    listTitle = document.getElementById("listTitle");
    menuBtn = document.getElementById("menuBtn");
    menuDropdown = document.getElementById("menuDropdown");
    addListBtn = document.getElementById("addListBtn");
    
    addListModal = document.getElementById("addListModal");
    listNameInput = document.getElementById("listNameInput");
    listTypeSelect = document.getElementById("listTypeSelect");
    colorCircles = document.querySelectorAll(".color-circle");
    confirmAddListBtn = document.getElementById("confirmAddListBtn");
    closeModalBtn = document.getElementById("closeModalBtn");
    colorPreview = document.getElementById("colorPreview");
    autocompleteList = document.getElementById("autocompleteList");
    
    setupEventListeners();
}

function setupEventListeners() {
    if (!menuBtn || !menuDropdown) return;
    
    // Menü
    menuBtn.addEventListener("click", e => {
        e.stopPropagation();
        menuDropdown.style.display = menuDropdown.style.display === "flex" ? "none" : "flex";
    });

    document.addEventListener("click", e => {
        if (!menuDropdown.contains(e.target) && e.target !== menuBtn) menuDropdown.style.display = "none";
    });

    // Listenname bearbeiten
    if (listTitle) {
        listTitle.addEventListener("dblclick", startEditingListTitle);
    }

    // Todos hinzufügen
    if (addBtn && input) {
        addBtn.addEventListener("click", addTodo);
        input.addEventListener("keypress", e => { if (e.key === "Enter") addTodo(); });
    }

    // Filter
    if (filterBtns) {
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
                saveData();
                render();
            });
        });
    }

    // Modal
    if (closeModalBtn && addListModal) {
        closeModalBtn.addEventListener("click", () => {
            addListModal.style.display = "none";
        });

        addListModal.addEventListener("click", (e) => {
            if (e.target === addListModal) addListModal.style.display = "none";
        });
    }

    // Neue Liste
    if (addListBtn) {
        addListBtn.addEventListener("click", () => {
            if (!listNameInput || !listTypeSelect) return;
            listNameInput.value = "";
            listTypeSelect.value = "todo";
            if (colorCircles) {
                colorCircles.forEach(c => c.classList.remove("selected"));
                if (colorCircles[5]) colorCircles[5].classList.add("selected");
            }
            selectedColor = "#0a84ff";
            if (colorPreview) colorPreview.style.color = selectedColor;
            if (addListModal) addListModal.style.display = "flex";
        });
    }

    // Farbe auswählen
    if (colorCircles) {
        colorCircles.forEach(circle => {
            circle.addEventListener("click", () => {
                colorCircles.forEach(c => c.classList.remove("selected"));
                circle.classList.add("selected");
                selectedColor = circle.dataset.color;
                if (colorPreview) colorPreview.style.color = selectedColor;
            });
        });
    }

    // Liste bestätigen
    if (confirmAddListBtn) {
        confirmAddListBtn.addEventListener("click", () => {
            if (!listNameInput) return;
            const name = listNameInput.value.trim();
            if (!name) {
                alert("Bitte einen Namen eingeben!");
                return;
            }
            if (lists[name]) {
                alert("Liste existiert bereits!");
                return;
            }
            const type = listTypeSelect ? listTypeSelect.value : "todo";
            
            lists[name] = { todos: [], type: type, color: selectedColor };
            listOrder.push(name);
            currentList = name;
            todos = lists[name].todos;
            if (listTitle) listTitle.textContent = name;
            
            updateButtonColors(selectedColor);
            saveData();
            renderTabs();
            render();
            if (addListModal) addListModal.style.display = "none";
        });
    }

    // Autocomplete
    if (input) {
        input.addEventListener('input', (e) => {
            showAutocomplete(e.target.value);
        });

        input.addEventListener('blur', () => {
            setTimeout(() => {
                if (autocompleteList) {
                    autocompleteList.classList.remove('show');
                    autocompleteList.innerHTML = '';
                }
            }, 200);
        });
    }
}

/* ===================================
   APP FUNKTIONEN
   =================================== */

function updateButtonColors(color) {
    if (!addListBtn || !addBtn || !menuBtn) return;
    
    addListBtn.style.background = color;
    addListBtn.style.boxShadow = `0 4px 0 ${adjustColor(color, -20)}`;
    addBtn.style.background = color;
    addBtn.style.boxShadow = `0 4px 0 ${adjustColor(color, -20)}`;
    menuBtn.style.background = color;
    menuBtn.style.boxShadow = `0 4px 0 ${adjustColor(color, -20)}`;
    
    if (filterBtns) {
        filterBtns.forEach(btn => {
            if (!btn.classList.contains('active')) {
                btn.style.background = color;
                btn.style.boxShadow = `0 3px 0 ${adjustColor(color, -20)}`;
            }
        });
    }
}

function adjustColor(color, amount) {
    const num = parseInt(color.replace("#",""), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${(0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function updateCounter() {
    if (!counter) return;
    const done = todos.filter(t => t.erledigt).length;
    counter.textContent = `${done} von ${todos.length} erledigt`;
}

function startEditingListTitle() {
    if (!currentList || !listTitle) return;
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
            const idx = listOrder.indexOf(currentList);
            listOrder.splice(idx, 1);
            listOrder.splice(idx, 0, newName);
            currentList = newName;
            saveData();
            renderTabs();
        }
        listTitle.textContent = currentList;
    };

    inputField.addEventListener("blur", saveEdit);
    inputField.addEventListener("keypress", e => { if (e.key === "Enter") inputField.blur(); });
    inputField.addEventListener("keydown", e => { if (e.key === "Escape") listTitle.textContent = currentList; });
}

function startEditing(spanElement, index) {
    if (!todos[index] || todos[index].erledigt) return;
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

function addTodo() {
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    todos.push({ text, erledigt: false });
    input.value = "";
    input.blur();
    saveData();
    render();
}

function render() {
    if (!list) return;
    list.innerHTML = "";
    if (!todos || !Array.isArray(todos)) { todos = []; saveData(); }

    const currentListData = lists[currentList];
    const isShoppingList = currentListData && currentListData.type === 'shopping';

    if (isShoppingList) {
        const categorizedItems = getItemsByCategory(todos);
        const displayOrder = ['Lebensmittel', 'Haushalt', 'Sonstiges'];
        
        displayOrder.forEach(category => {
            if (categorizedItems[category].length > 0) {
                const categoryHeader = document.createElement('div');
                categoryHeader.className = 'category-header';
                categoryHeader.textContent = category;
                list.appendChild(categoryHeader);

                categorizedItems[category].forEach(todo => {
                    const originalIndex = todos.indexOf(todo);
                    createTodoElement(todo, originalIndex, isShoppingList);
                });
            }
        });
    } else {
        todos.forEach((todo, index) => {
            if (filter === "offen" && todo.erledigt) return;
            if (filter === "erledigt" && !todo.erledigt) return;
            createTodoElement(todo, index, isShoppingList);
        });
    }

    updateCounter();
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

function highlightNumbers(text) {
    const numberPattern = /^(\d+\.?\d*\s*(g|kg|ml|l|st|stk|dag|cm|dm|mm|m|dl|cl|pack|packung|dose|flasche|glas)?\s*)/i;
    const match = text.match(numberPattern);
    
    if (match) {
        const number = match[1];
        const rest = text.slice(number.length);
        return `<span class="quantity">${number}</span>${rest}`;
    }
    
    return text;
}

function getInternalCategory(itemText) {
    const lowerText = itemText.toLowerCase().trim();
    const keywords = {
        'Milchprodukte': ['milch', 'käse', 'joghurt', 'butter', 'eier', 'ei', 'sahne', 'quark'],
        'Obst': ['apfel', 'birne', 'banane', 'orange', 'obst', 'traube', 'erdbeere'],
        'Gemüse': ['tomate', 'gurke', 'salat', 'kartoffel', 'gemüse', 'karotte', 'zwiebel'],
        'Fleisch': ['fleisch', 'huhn', 'fisch', 'bauch', 'ripperl', 'schwein', 'rind'],
        'Wurst': ['wurst', 'salami', 'schinken', 'extrawurst'],
        'Brot': ['brot', 'semmel', 'weckerl', 'mehl', 'nudel', 'pasta', 'reis'],
        'Getränke': ['wasser', 'saft', 'bier', 'kaffee', 'tee', 'cola', 'wein'],
        'Snacks': ['chips', 'kekse', 'nüsse', 'riegel', 'popcorn'],
        'Süßigkeiten': ['schokolade', 'eis', 'nutella', 'bonbon', 'lakritz'],
        'Haushalt': ['papier', 'reiniger', 'waschmittel', 'spülmittel', 'müllbeutel'],
        'Sonstiges': []
    };
    
    for (const [category, words] of Object.entries(keywords)) {
        for (const word of words) {
            if (lowerText.includes(word)) return category;
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

function getItemsByCategory(items) {
    const mainCategories = { 'Lebensmittel': [], 'Haushalt': [], 'Sonstiges': [] };
    
    items.forEach(item => {
        const mainCat = getMainCategory(item.text);
        mainCategories[mainCat].push(item);
    });
    
    return mainCategories;
}

function showAutocomplete(value) {
    if (!autocompleteList) return;
    if (!value || value.length < 2) {
        autocompleteList.classList.remove('show');
        autocompleteList.innerHTML = '';
        return;
    }
    
    const allItems = new Set();
    for (const listName in lists) {
        if (lists[listName].type === 'shopping') {
            lists[listName].todos.forEach(todo => allItems.add(todo.text));
        }
    }
    
    const suggestions = Array.from(allItems).filter(item => 
        item.toLowerCase().includes(value.toLowerCase()) && 
        item.toLowerCase() !== value.toLowerCase()
    ).slice(0, 5);
    
    if (suggestions.length === 0) {
        autocompleteList.classList.remove('show');
        autocompleteList.innerHTML = '';
        return;
    }
    
    autocompleteList.innerHTML = '';
    suggestions.forEach(suggestion => {
        const div = document.createElement('div');
        div.className = 'autocomplete-item';
        const regex = new RegExp(`(${value})`, 'gi');
        div.innerHTML = suggestion.replace(regex, '<span class="match">$1</span>');
        div.addEventListener('click', () => {
            if (input) input.value = suggestion;
            autocompleteList.classList.remove('show');
        });
        autocompleteList.appendChild(div);
    });
    
    autocompleteList.classList.add('show');
}

function renderTabs() {
    if (!listTabs) return;
    listTabs.innerHTML = "";
    
    listOrder.forEach((name) => {
        if (!lists[name]) return;
        
        const wrapper = document.createElement("div");
        wrapper.className = "list-item";
        
        const btn = document.createElement("button");
        btn.textContent = name;
        
        const listColor = lists[name].color || "#0a84ff";
        btn.style.background = listColor;
        btn.style.boxShadow = `0 2px 0 ${adjustColor(listColor, -20)}`;
        
        btn.onclick = () => {
            saveData();
            currentList = name;
            todos = lists[name].todos || [];
            if (listTitle) listTitle.textContent = name;
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
            listOrder = listOrder.filter(n => n !== name);
            currentList = listOrder[0] || "Meine Liste";
            if (!lists[currentList]) lists[currentList] = { todos: [], type: "todo", color: "#0a84ff" };
            todos = lists[currentList].todos || [];
            if (listTitle) listTitle.textContent = currentList;
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

if (list) {
    list.addEventListener("click", e => {
        const action = e.target.dataset.action;
        const index = e.target.dataset.index;
        if (!action || index === undefined) return;
        const idx = Number(index);
        if (action === "toggle" && todos[idx]) {
            todos[idx].erledigt = !todos[idx].erledigt;
            saveData();
            render();
        }
        if (action === "delete" && todos[idx]) {
            todos.splice(idx, 1);
            saveData();
            render();
        }
    });
}
