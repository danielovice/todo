/* FIREBASE KONFIGURATION */
const firebaseConfig = {
    apiKey: "AIzaSyAd-m4ivSitRoH2IHjZS8N9TO4N6o3f0-c",
    authDomain: "todo-c28f9.firebaseapp.com",
    projectId: "todo-c28f9",
    storageBucket: "todo-c28f9.firebasestorage.app",
    messagingSenderId: "877149325722",
    appId: "1:877149325722:web:aecf751686620fd2715223",
    measurementId: "G-WF68HR6TLN"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

/* VARIABLEN */
let currentUser = null;
let isRegisterMode = false;
let lists = {};
let listOrder = [];
let currentList = "Meine Liste";
let filter = null;
let selectedColor = "#0a84ff";
let todos = [];

/* AUTH MODAL ELEMENTE */
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

/* APP ELEMENTE */
let input, addBtn, list, filterBtns, counter, listTabs, listTitle, menuBtn, menuDropdown, addListBtn;
let addListModal, listNameInput, listTypeSelect, colorCircles, confirmAddListBtn, closeModalBtn, colorPreview;

/* AUTH STATUS PRÜFEN */
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        authModal.style.display = "none";
        mainApp.style.display = "flex";
        initApp();
        await loadData();
    } else {
        currentUser = null;
        authModal.style.display = "flex";
        mainApp.style.display = "none";
    }
});

/* LOGIN/REGISTER TOGGLE */
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

/* PASSWORT ANZEIGEN */
function togglePassword() {
    const type = authPassword.type === "password" ? "text" : "password";
    authPassword.type = type;
}

/* LOGIN/REGISTER */
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
            const userCredential = await auth.createUserWithEmailAndPassword(username + "@todo.local", password);
            await userCredential.user.updateProfile({ displayName: username });
            
            await db.collection("users").doc(userCredential.user.uid).set({
                lists: { "Meine Liste": { todos: [], type: "todo", color: "#0a84ff" } },
                listOrder: ["Meine Liste"],
                currentList: "Meine Liste"
            });
            
            alert("Konto erstellt!");
        } else {
            await auth.signInWithEmailAndPassword(username + "@todo.local", password);
            if (rememberMe.checked) localStorage.setItem("rememberMe", "true");
        }
    } catch (error) {
        authError.textContent = getErrorMessage(error.code);
    }
    
    authSubmitBtn.classList.remove("loading");
    authSubmitBtn.textContent = isRegisterMode ? "Registrieren" : "Anmelden";
});

/* LOGOUT */
logoutBtn.addEventListener("click", () => {
    auth.signOut().then(() => location.reload());
});

/* FEHLERMELDUNGEN */
function getErrorMessage(code) {
    switch(code) {
        case "auth/user-not-found": return "Benutzer nicht gefunden!";
        case "auth/wrong-password": return "Falsches Passwort!";
        case "auth/email-already-in-use": return "Benutzername vergeben!";
        default: return "Fehler: " + code;
    }
}

/* DATEN LADEN */
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
                updateButtonColors(lists[currentList].color || "#0a84ff");
            }
            
            listTitle.textContent = currentList;
            renderTabs();
            render();
        }
    } catch (error) {
        console.error("Fehler:", error);
    }
}

/* DATEN SPEICHERN */
async function saveData() {
    if (!currentUser) return;
    
    try {
        await db.collection("users").doc(currentUser.uid).update({
            lists: lists,
            listOrder: listOrder,
            currentList: currentList
        });
    } catch (error) {
        console.error("Fehler:", error);
    }
}

/* APP INITIALISIEREN */
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
    
    setupEventListeners();
}

function setupEventListeners() {
    menuBtn.addEventListener("click", e => {
        e.stopPropagation();
        menuDropdown.style.display = menuDropdown.style.display === "flex" ? "none" : "flex";
    });

    document.addEventListener("click", e => {
        if (!menuDropdown.contains(e.target) && e.target !== menuBtn) menuDropdown.style.display = "none";
    });

    listTitle.addEventListener("dblclick", startEditingListTitle);
    addBtn.addEventListener("click", addTodo);
    input.addEventListener("keypress", e => { if (e.key === "Enter") addTodo(); });

    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const value = btn.dataset.filter;
            if (value === "alle") {
                filter = null;
                filterBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
            } else if (filter === value) {
                filter = null;
                btn.classList.remove("active");
                filterBtns[0].classList.add("active");
            } else {
                filter = value;
                filterBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
            }
            render();
        });
    });

    closeModalBtn.addEventListener("click", () => addListModal.style.display = "none");
    addListModal.addEventListener("click", e => { if (e.target === addListModal) addListModal.style.display = "none"; });

    addListBtn.addEventListener("click", () => {
        listNameInput.value = "";
        listTypeSelect.value = "todo";
        colorCircles.forEach(c => c.classList.remove("selected"));
        colorCircles[5].classList.add("selected");
        selectedColor = "#0a84ff";
        colorPreview.style.color = selectedColor;
        addListModal.style.display = "flex";
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
        if (!name) { alert("Name eingeben!"); return; }
        if (lists[name]) { alert("Existiert bereits!"); return; }
        
        lists[name] = { todos: [], type: listTypeSelect.value, color: selectedColor };
        listOrder.push(name);
        currentList = name;
        todos = [];
        listTitle.textContent = name;
        updateButtonColors(selectedColor);
        saveData();
        renderTabs();
        render();
        addListModal.style.display = "none";
    });
}

function updateButtonColors(color) {
    addListBtn.style.background = color;
    addBtn.style.background = color;
    menuBtn.style.background = color;
    filterBtns.forEach(btn => {
        if (!btn.classList.contains('active')) btn.style.background = color;
    });
}

function addTodo() {
    const text = input.value.trim();
    if (!text) return;
    todos.push({ text, erledigt: false });
    input.value = "";
    saveData();
    render();
}

function startEditingListTitle() {
    const currentName = currentList;
    const inputField = document.createElement("input");
    inputField.type = "text";
    inputField.value = currentName;
    inputField.className = "edit-input";
    listTitle.textContent = "";
    listTitle.appendChild(inputField);
    inputField.focus();

    const saveEdit = () => {
        const newName = inputField.value.trim();
        if (newName && newName !== currentName && !lists[newName]) {
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
}

function render() {
    list.innerHTML = "";
    if (!todos || !Array.isArray(todos)) { todos = []; }

    todos.forEach((todo, index) => {
        if (filter === "offen" && todo.erledigt) return;
        if (filter === "erledigt" && !todo.erledigt) return;

        const li = document.createElement("li");
        li.dataset.index = index;

        const leftDiv = document.createElement("div");
        leftDiv.className = "li-left";

        const dragHandle = document.createElement("div");
        dragHandle.className = "drag-handle";
        dragHandle.textContent = "⋮⋮";

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

    const done = todos.filter(t => t.erledigt).length;
    counter.textContent = `${done} von ${todos.length} erledigt`;
}

function renderTabs() {
    listTabs.innerHTML = "";
    listOrder.forEach(name => {
        if (!lists[name]) return;
        
        const wrapper = document.createElement("div");
        wrapper.className = "list-item";
        
        const btn = document.createElement("button");
        btn.textContent = name;
        btn.style.background = lists[name].color || "#0a84ff";
        btn.onclick = () => {
            currentList = name;
            todos = lists[name].todos || [];
            listTitle.textContent = name;
            updateButtonColors(lists[name].color || "#0a84ff");
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
            listTitle.textContent = currentList;
            updateButtonColors(lists[currentList].color || "#0a84ff");
            saveData();
            renderTabs();
            render();
        };
        
        wrapper.appendChild(btn);
        wrapper.appendChild(del);
        listTabs.appendChild(wrapper);
    });
}

list.addEventListener("click", e => {
    const action = e.target.dataset.action;
    const index = e.target.dataset.index;
    if (!action || index === undefined) return;
    const idx = Number(index);
    if (action === "toggle") {
        todos[idx].erledigt = !todos[idx].erledigt;
        saveData();
        render();
    }
    if (action === "delete") {
        todos.splice(idx, 1);
        saveData();
        render();
    }
});
