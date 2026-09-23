/**
 * Campus Placement Agent - simple chat frontend.
 * No frameworks. Talks to the FastAPI backend, which forwards to the Foundry agent.
 *
 * Backend URL: set VITE_API_BASE_URL in a .env file (see .env.example).
 * Falls back to http://localhost:8000 for local development.
 */
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");
const REQUEST_TIMEOUT_MS = 60000;
const HEALTH_TIMEOUT_MS = 5000;
const HEALTH_INTERVAL_MS = 20000;

const SUGGESTIONS = [
  "What CGPA do I need to be eligible?",
  "Can I sit for placements with a backlog?",
  "Which companies are visiting?",
  "How does the placement process work?",
];

const $ = (id) => document.getElementById(id);
const chatMessages = $("chat-messages");
const chatInput = $("chat-input");
const sendBtn = $("send-btn");
const newChatBtn = $("new-chat-btn");
const statusDot = $("status-dot");
const statusText = $("status-text");
const landing = $("landing");
const chatScreen = $("chat-screen");
const startChatBtn = $("start-chat-btn");
const brandHome = $("brand-home");

let isSending = false;
let chatEpoch = 0; // bumps on "New chat" so late replies from an old chat are ignored
let activeController = null;

/* ---------- Screens ---------- */

// The two screens are tied to the URL (#chat) so the browser's
// Back/Forward buttons move between them.
let landingScrollY = 0;

function enterChatView() {
  if (!chatScreen.hidden) return;
  landingScrollY = window.scrollY;
  landing.hidden = true;
  chatScreen.hidden = false;
  newChatBtn.hidden = false;
  document.body.classList.add("in-chat");
  window.scrollTo(0, 0);
  if (!chatMessages.children.length) renderEmptyState();
  chatInput.focus();
}

function enterLandingView() {
  if (!landing.hidden) return;
  chatScreen.hidden = true;
  landing.hidden = false;
  newChatBtn.hidden = true;
  document.body.classList.remove("in-chat");
  window.scrollTo(0, landingScrollY);
}

function renderRoute() {
  if (location.hash === "#chat") enterChatView();
  else enterLandingView();
}

function showChat(prefillText) {
  if (location.hash !== "#chat") {
    history.pushState({ view: "chat", pushed: true }, "", "#chat");
  }
  enterChatView();
  if (prefillText) sendMessage(prefillText);
}

function showLanding() {
  if (history.state?.pushed) {
    // We came from the landing page, so step back to it (keeps history clean).
    history.back();
  } else {
    // Page was opened directly at #chat: replace the entry instead.
    history.replaceState(null, "", location.pathname + location.search);
    enterLandingView();
  }
}

window.addEventListener("popstate", renderRoute);
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
renderRoute(); // handles a refresh or a bookmark while on #chat

startChatBtn.addEventListener("click", () => showChat());
brandHome.addEventListener("click", showLanding);
document.querySelectorAll(".question[data-prompt]").forEach((btn) => {
  btn.addEventListener("click", () => showChat(btn.dataset.prompt));
});

/* ---------- Session ---------- */

function newId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionId() {
  let id = sessionStorage.getItem("cpa_session_id");
  if (!id) {
    id = newId();
    sessionStorage.setItem("cpa_session_id", id);
  }
  return id;
}

/* ---------- Markdown (safe subset) ---------- */

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Input is already HTML-escaped, so only our own tags end up in the output.
function inlineMd(s) {
  return s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}

function renderMarkdown(raw) {
  const text = raw
    .replace(/【[^】]*】/g, "") // strip Foundry file-search citation markers like 【4:0†source】
    .replace(/\r\n/g, "\n")
    .trim();
  const lines = escapeHtml(text).split("\n");

  let html = "";
  let para = [];
  let list = null;
  let table = [];
  let code = null;

  const flushPara = () => {
    if (para.length) html += `<p>${inlineMd(para.join("<br>"))}</p>`;
    para = [];
  };
  const flushList = () => {
    if (list) html += `</${list}>`;
    list = null;
  };
  const splitRow = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => inlineMd(c.trim()));
  const flushTable = () => {
    if (!table.length) return;
    if (table.length >= 2 && /^\s*\|?\s*:?-{2,}/.test(table[1])) {
      const head = splitRow(table[0]).map((c) => `<th>${c}</th>`).join("");
      const body = table
        .slice(2)
        .map((r) => `<tr>${splitRow(r).map((c) => `<td>${c}</td>`).join("")}</tr>`)
        .join("");
      html += `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
    } else {
      table.forEach((r) => (html += `<p>${inlineMd(r)}</p>`));
    }
    table = [];
  };
  const flushAll = () => { flushPara(); flushList(); flushTable(); };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (code) {
        html += `<pre><code>${code.join("\n")}</code></pre>`;
        code = null;
      } else {
        flushAll();
        code = [];
      }
      continue;
    }
    if (code) { code.push(line); continue; }

    if (/^\s*\|.*\|\s*$/.test(line)) { flushPara(); flushList(); table.push(line); continue; }
    flushTable();

    if (!line.trim()) { flushPara(); flushList(); continue; }

    const heading = line.match(/^\s*#{1,6}\s+(.*)$/);
    if (heading) { flushPara(); flushList(); html += `<h4>${inlineMd(heading[1])}</h4>`; continue; }

    const ul = line.match(/^\s*[-*•]\s+(.*)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ul || ol) {
      flushPara();
      const tag = ul ? "ul" : "ol";
      if (list !== tag) { flushList(); html += `<${tag}>`; list = tag; }
      html += `<li>${inlineMd((ul || ol)[1])}</li>`;
      continue;
    }

    flushList();
    para.push(line);
  }
  if (code) html += `<pre><code>${code.join("\n")}</code></pre>`;
  flushAll();
  return html;
}

/* ---------- Rendering ---------- */

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderEmptyState() {
  const wrap = document.createElement("div");
  wrap.className = "empty-state";
  wrap.id = "empty-state";
  wrap.innerHTML = `
    <h2>What would you like to know?</h2>
    <p>Ask about eligibility, CGPA and backlog rules, visiting companies, or any step of the placement process.</p>
    <div class="suggestions"></div>
  `;
  const box = wrap.querySelector(".suggestions");
  SUGGESTIONS.forEach((q) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = q;
    chip.addEventListener("click", () => sendMessage(q));
    box.appendChild(chip);
  });
  chatMessages.appendChild(wrap);
}

function removeEmptyState() {
  $("empty-state")?.remove();
}

function renderUserMessage(text) {
  const row = document.createElement("div");
  row.className = "row user";
  row.innerHTML = `
    <div class="user-wrap">
      <div class="bubble-user"></div>
      <div class="msg-meta"><span class="msg-time">${formatTime()}</span></div>
    </div>
  `;
  row.querySelector(".bubble-user").textContent = text;
  chatMessages.appendChild(row);
  scrollToBottom();
}

function renderAgentMessage(text) {
  const row = document.createElement("div");
  row.className = "row";
  row.innerHTML = `
    <span class="avatar" aria-hidden="true">CA</span>
    <div class="agent-text">
      <div class="agent-body"></div>
      <div class="msg-meta">
        <span class="msg-time">${formatTime()}</span>
        <button class="msg-action" type="button">Copy</button>
      </div>
    </div>
  `;
  row.querySelector(".agent-body").innerHTML = renderMarkdown(text || "The agent returned an empty reply.");

  const copyBtn = row.querySelector(".msg-action");
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = "Copied";
    } catch {
      copyBtn.textContent = "Copy failed";
    }
    setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
  });

  chatMessages.appendChild(row);
  scrollToBottom();
}

function renderErrorMessage(message, retryText) {
  const row = document.createElement("div");
  row.className = "row";
  row.innerHTML = `
    <span class="avatar error" aria-hidden="true">!</span>
    <div class="agent-text error">
      <div class="agent-body"><p></p></div>
      <div class="msg-meta">
        <span class="msg-time">${formatTime()}</span>
        <button class="msg-action" type="button">Try again</button>
      </div>
    </div>
  `;
  row.querySelector("p").textContent = message;
  row.querySelector(".msg-action").addEventListener("click", () => {
    if (isSending) return;
    row.remove();
    sendMessage(retryText, { isRetry: true });
  });
  chatMessages.appendChild(row);
  scrollToBottom();
}

function renderTyping() {
  const row = document.createElement("div");
  row.className = "row";
  row.id = "typing-row";
  row.innerHTML = `
    <span class="avatar" aria-hidden="true">CA</span>
    <div class="agent-text" aria-label="The agent is typing">
      <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
    </div>
  `;
  chatMessages.appendChild(row);
  scrollToBottom();
}

function removeTyping() {
  $("typing-row")?.remove();
}

/* ---------- Composer ---------- */

function autoResize() {
  chatInput.style.height = "auto";
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, 140)}px`;
}

function updateSendState() {
  sendBtn.disabled = isSending || !chatInput.value.trim();
}

chatInput.addEventListener("input", () => {
  autoResize();
  updateSendState();
});

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener("click", () => sendMessage());

/* ---------- Sending ---------- */

function describeError(err) {
  if (err.name === "TimeoutError" || err.name === "AbortError") {
    return "The agent took too long to reply. Try again, or ask a shorter question.";
  }
  if (!navigator.onLine) {
    return "You're offline. Check your internet connection and try again.";
  }
  if (err.status) {
    return err.detail
      ? `The agent returned an error (${err.status}): ${err.detail}`
      : `The agent returned an error (${err.status}). Try again in a moment.`;
  }
  return `Can't reach the placement agent at ${API_BASE_URL}. Check that the backend is running, then try again.`;
}

async function sendMessage(overrideText, { isRetry = false } = {}) {
  const text = (overrideText ?? chatInput.value).trim();
  if (!text || isSending) return;

  const epoch = chatEpoch;
  isSending = true;
  updateSendState();
  removeEmptyState();

  if (overrideText === undefined) {
    chatInput.value = "";
    autoResize();
  }
  if (!isRetry) renderUserMessage(text);
  renderTyping();

  const controller = new AbortController();
  activeController = controller;
  const timer = setTimeout(() => controller.abort(new DOMException("Timed out", "TimeoutError")), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, session_id: getSessionId() }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const detail = typeof body?.detail === "string" ? body.detail : "";
      throw Object.assign(new Error("Bad response"), { status: res.status, detail });
    }

    const data = await res.json();
    if (epoch !== chatEpoch) return;
    removeTyping();
    renderAgentMessage(data.response);
    setStatus("on");
  } catch (err) {
    if (epoch !== chatEpoch) return; // user started a new chat; drop silently
    removeTyping();
    renderErrorMessage(describeError(err), text);
  } finally {
    clearTimeout(timer);
    if (activeController === controller) activeController = null;
    if (epoch === chatEpoch) {
      isSending = false;
      updateSendState();
      chatInput.focus();
    }
  }
}

newChatBtn.addEventListener("click", () => {
  chatEpoch += 1;
  activeController?.abort();
  activeController = null;
  isSending = false;

  sessionStorage.removeItem("cpa_session_id");
  chatMessages.innerHTML = "";
  chatInput.value = "";
  autoResize();
  updateSendState();
  renderEmptyState();
  chatInput.focus();
});

/* ---------- Health check ---------- */

function setStatus(state) {
  statusDot.className = `status-dot ${state}`;
  statusText.textContent =
    state === "on" ? "Agent online" : state === "off" ? "Agent offline" : "Checking…";
  statusDot.title = statusText.textContent;
}

async function checkHealth() {
  if (document.hidden) return;
  try {
    const res = await fetch(`${API_BASE_URL}/`, { signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) });
    setStatus(res.ok ? "on" : "off");
  } catch {
    setStatus("off");
  }
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) checkHealth();
});
window.addEventListener("online", checkHealth);
window.addEventListener("offline", () => setStatus("off"));

checkHealth();
setInterval(checkHealth, HEALTH_INTERVAL_MS);