/* -------------------------------------------
   GRUNDSTILE
-------------------------------------------- */
body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    background: #000;
    color: white;
    display: flex;
    flex-direction: column;
    min-height: 100vh;

    /* 🔥 verhindert seitliches scrollen */
    overflow-x: hidden;
}

/* NAVBAR */
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #111;
    padding: 12px 20px;
    border-bottom: 1px solid #222;
}

.logo {
    font-weight: bold;
    font-size: 18px;
}

.nav-buttons {
    display: flex;
    gap: 10px;
    align-items: center;
}

/* BUTTONS */
button {
    padding: 10px 14px;
    border-radius: 10px;
    border: none;
    background: #0a84ff;
    color: white;
    cursor: pointer;
    box-shadow: 0 4px 0 #0060df;
}

button:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 #0060df;
}

/* MENU */
.menu {
    position: relative;
}

#menuDropdown {
    position: absolute;
    right: 0;
    top: 45px;
    background: #111;
    border: 1px solid #222;
    border-radius: 10px;
    padding: 8px;
    display: none;
    flex-direction: column;
    gap: 6px; /* 🔥 weniger Abstand */
    min-width: 180px;
    z-index: 100;
}

.menu:hover #menuDropdown {
    display: flex;
}

.list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    padding: 6px 0; /* 🔥 kleiner aber nicht 0 */
}

.list-item button {
    padding: 6px 8px;
    font-size: 13px;
}

/* APP */
.app {
    margin: 30px auto;
    width: 90%;
    max-width: 500px;
    background: #111;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
}

h1 {
    text-align: center;
    cursor: pointer;
    margin: 0 0 20px 0;
}

/* INPUT */
.input-area {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

input {
    flex: 1;
    padding: 14px;
    border-radius: 10px;
    border: none;
    background: #222;
    color: white;
    font-size: 18px;
}

/* 🔥 verhindert Zoom auf iPhone */
input, textarea {
    font-size: 16px;
}

/* FILTER */
.filters {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
    flex-wrap: wrap;
}

.filter-btn.active {
    background: #30d158;
    box-shadow: 0 4px 0 #1f9e3a;
}

/* COUNTER */
#counter {
    margin-bottom: 10px;
    color: #aaa;
}

/* LIST */
ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

li {
    display: flex;
    align-items: center;
    background: #1c1c1e;
    padding: 12px;
    border-radius: 10px;
    margin-bottom: 8px;
    justify-content: space-between;
    flex-wrap: wrap;
    transition: transform 0.15s ease;
}

/* 🔥 Drag Feedback */
li.dragging {
    transform: scale(1.05);
    background: #2c2c2e;
}

/* LEFT */
.li-left {
    display: flex;
    align-items: center;
    gap: 15px;
}

/* 🔥 Apple Checkbox */
li input[type="checkbox"] {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    appearance: none;
    background: #222;
    border: 2px solid #0a84ff;
    cursor: pointer;
    position: relative;
}

li input[type="checkbox"]:checked {
    background: #0a84ff;
}

li input[type="checkbox"]:checked::after {
    content: "✓";
    color: white;
    position: absolute;
    font-size: 14px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -55%);
}

/* TEXT */
li span {
    flex: 1;
    word-break: break-word;
    line-height: 22px;
    text-align: left;
    margin: 0 10px;
}

/* DRAG HANDLE */
.drag-handle {
    cursor: grab;
    color: #555;
    font-size: 24px;
}

/* EDIT */
.edit-input {
    flex: 1;
    padding: 5px 8px;
    margin: 0 10px;
    height: 32px;
    border-radius: 5px;
    border: 1px solid #0a84ff;
    background: #222;
    color: white;
}

/* ERLEDIGT */
.erledigt {
    text-decoration: line-through;
    color: #888;
}

/* DELETE */
li button.delete {
    background: #0a84ff;
}

/* FOOTER */
footer {
    margin-top: auto;
    text-align: center;
    font-size: 12px;
    color: #888;
    background: #111;
    padding: 15px;
    border-top: 1px solid #222;
}

/* MOBILE */
@media (max-width:600px){

.app{
margin:20px 10px;
padding:15px;
}

.input-area{
flex-direction:column;
}

.input-area button{
width:100%;
font-size:18px;
padding:14px;
}

h1{
font-size:22px;
}

li{
flex-direction:row;
align-items:center;
flex-wrap:wrap;
gap:10px;
}

li span{
flex:1;
text-align:left;
margin:0;
}

.navbar{
padding:10px 15px;
}

button{
padding:10px;
}

}
