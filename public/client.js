if (false) {
const io = require("socket.io-client");

// connect to server
const socket = io("http://localhost:5000");

// when connected
socket.on("connect", () => {
  console.log("Connected to server:", socket.id);

  // send message
  socket.emit("sendMessage", "Hello from client 🚀");
});

// receive message
socket.on("receiveMessage", (msg) => {
  console.log("Message from server:", msg);
});
}

const authPanel = document.getElementById("auth-panel");
const chatPanel = document.getElementById("chat-panel");
const authStatus = document.getElementById("auth-status");
const status = document.getElementById("status");
const messages = document.getElementById("messages");
const roomSelect = document.getElementById("room");
let socket;
let currentUser;
let currentRoom = "general";

function setStatus(message = "", isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

async function api(path, options = {}) {
  const token = localStorage.getItem("connectify_token");
  const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}

function renderMessage(message) {
  const item = document.createElement("article");
  item.className = `message${message.sender === currentUser.username ? " me" : ""}`;
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  item.innerHTML = `<span class="meta"></span><span></span>`;
  item.querySelector(".meta").textContent = `${message.sender} · ${time}`;
  item.querySelector("span:last-child").textContent = message.content;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
}

async function loadHistory(room) {
  const data = await api(`/api/messages/${encodeURIComponent(room)}`);
  messages.replaceChildren();
  data.messages.forEach(renderMessage);
}

function connectSocket() {
  socket?.disconnect();
  socket = io({ auth: { token: localStorage.getItem("connectify_token") } });
  socket.on("connect_error", (error) => setStatus(error.message, true));
  socket.on("receiveMessage", renderMessage);
  socket.on("messageBlocked", ({ reason }) => setStatus(reason, true));
  socket.on("messageError", ({ message }) => setStatus(message, true));
  socket.on("roomPresence", ({ room, users }) => {
    if (room === currentRoom) document.getElementById("presence").textContent = `${users.length} online: ${users.join(", ")}`;
  });
  socket.on("roomJoined", async ({ room }) => {
    currentRoom = room;
    roomSelect.value = room;
    setStatus(`Joined #${room}.`);
    await loadHistory(room);
  });
}

async function enterChat(user) {
  currentUser = user;
  document.getElementById("current-user").textContent = user.username;
  authPanel.classList.add("hidden");
  chatPanel.classList.remove("hidden");
  connectSocket();
  await loadHistory(currentRoom);
}

document.getElementById("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: document.getElementById("login-email").value, password: document.getElementById("login-password").value }) });
    localStorage.setItem("connectify_token", data.token);
    await enterChat(data.user);
  } catch (error) { authStatus.textContent = error.message; }
});

document.getElementById("show-signup").addEventListener("click", () => document.getElementById("signup-form").classList.toggle("hidden"));
document.getElementById("signup-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await api("/api/auth/signup", { method: "POST", body: JSON.stringify({ username: document.getElementById("signup-username").value, email: document.getElementById("signup-email").value, password: document.getElementById("signup-password").value }) });
    authStatus.textContent = "Account created. You can now log in.";
  } catch (error) { authStatus.textContent = error.message; }
});
document.getElementById("join-room").addEventListener("click", () => socket?.emit("joinRoom", roomSelect.value));
document.getElementById("message-form").addEventListener("submit", (event) => { event.preventDefault(); const input = document.getElementById("message-input"); socket?.emit("sendMessage", { content: input.value, room: currentRoom }); input.value = ""; });
document.getElementById("logout").addEventListener("click", () => { localStorage.removeItem("connectify_token"); socket?.disconnect(); location.reload(); });
(async () => { try { const data = await api("/api/auth/profile"); await enterChat(data.user); } catch { localStorage.removeItem("connectify_token"); } })();
