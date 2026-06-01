import { APP_CONFIG, googleMapsRouteUrl, googleMapsSearchUrl } from "./config.js";
import { loadJson, loadString, saveJson, saveString, uid } from "./storage.js";
import { calculateBalances, formatJpy, formatTwd, normalizeExpense, optimizeTransfers, toTwd } from "./settlement.js";
import { deleteExpenseFromCloud, initFirebase, saveExpenseToCloud } from "./firebase-sync.js";

const state = {
  currentTab: "overview",
  currentTool: "calculator",
  rate: Number(loadString("rate", APP_CONFIG.defaultRate)) || APP_CONFIG.defaultRate,
  selectedMember: loadString("selectedMember", APP_CONFIG.members[0]),
  tripCode: loadString("tripCode", APP_CONFIG.tripId),
  expenses: loadJson("expenses", []),
  pendingUpserts: loadJson("pendingUpserts", []),
  pendingDeletes: loadJson("pendingDeletes", []),
  checklist: loadJson("checklist", {}),
  budget: loadJson("budget", Object.fromEntries(APP_CONFIG.budgetDefaults)),
  firebaseReady: false
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  initTheme();
  renderStaticContent();
  bindEvents();
  renderAll();
  registerServiceWorker();
  bootFirebase();
  updateCountdown();
  setInterval(updateCountdown, 60_000);
  window.addEventListener("online", () => {
    setSyncStatus("pending", "網路恢復，同步中");
    syncPending();
  });
  window.addEventListener("offline", () => setSyncStatus("offline", "離線，先本地暫存"));
});

function cacheElements() {
  Object.assign(els, {
    syncStatus: document.getElementById("syncStatus"),
    syncText: document.getElementById("syncText"),
    themeToggle: document.getElementById("themeToggle"),
    tripCodeInput: document.getElementById("tripCodeInput"),
    memberPicker: document.getElementById("memberPicker"),
    countdown: document.getElementById("countdown"),
    totalExpense: document.getElementById("totalExpense"),
    expenseCount: document.getElementById("expenseCount"),
    balanceSummary: document.getElementById("balanceSummary"),
    itineraryList: document.getElementById("itineraryList"),
    rateInput: document.getElementById("rateInput"),
    jpyInput: document.getElementById("jpyInput"),
    twdInput: document.getElementById("twdInput"),
    quickAmounts: document.getElementById("quickAmounts"),
    calcPerPerson: document.getElementById("calcPerPerson"),
    calcFourPeople: document.getElementById("calcFourPeople"),
    budgetGrid: document.getElementById("budgetGrid"),
    budgetPerPerson: document.getElementById("budgetPerPerson"),
    budgetTotal: document.getElementById("budgetTotal"),
    expenseForm: document.getElementById("expenseForm"),
    expenseFormTitle: document.getElementById("expenseFormTitle"),
    editingExpenseId: document.getElementById("editingExpenseId"),
    expenseTitle: document.getElementById("expenseTitle"),
    expenseAmount: document.getElementById("expenseAmount"),
    expenseCurrency: document.getElementById("expenseCurrency"),
    expensePayer: document.getElementById("expensePayer"),
    expenseCategory: document.getElementById("expenseCategory"),
    expenseNote: document.getElementById("expenseNote"),
    splitMembers: document.getElementById("splitMembers"),
    cancelEditExpense: document.getElementById("cancelEditExpense"),
    settlementList: document.getElementById("settlementList"),
    expenseList: document.getElementById("expenseList"),
    exportDataBtn: document.getElementById("exportDataBtn"),
    importDataInput: document.getElementById("importDataInput"),
    checklistRoot: document.getElementById("checklistRoot"),
    checkProgress: document.getElementById("checkProgress"),
    checkProgressBar: document.getElementById("checkProgressBar"),
    rolesList: document.getElementById("rolesList"),
    hotelInfo: document.getElementById("hotelInfo"),
    insuranceInfo: document.getElementById("insuranceInfo"),
    emergencySavedInfo: document.getElementById("emergencySavedInfo"),
    phraseList: document.getElementById("phraseList")
  });
}

function initTheme() {
  const saved = loadString("theme", "dark");
  document.documentElement.dataset.theme = saved;
}

function renderStaticContent() {
  els.tripCodeInput.value = state.tripCode;
  els.rateInput.value = state.rate;
  els.hotelInfo.value = loadString("hotelInfo", "");
  els.insuranceInfo.value = loadString("insuranceInfo", "");

  renderMemberPicker();
  renderPayerOptions();
  renderSplitMembers();
  renderMapLinks();
  renderItinerary();
  renderQuickAmounts();
  renderBudgetInputs();
  renderChecklist();
  renderRoles();
  renderPhrases();
  refreshIcons();
}

function bindEvents() {
  els.themeToggle.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    saveString("theme", next);
  });

  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
  });
  document.querySelectorAll("[data-tab-link]").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      activateTab(item.dataset.tabLink);
    });
  });
  document.querySelectorAll(".tool-tab").forEach((button) => {
    button.addEventListener("click", () => activateTool(button.dataset.tool));
  });

  els.tripCodeInput.addEventListener("change", () => {
    state.tripCode = sanitizeTripCode(els.tripCodeInput.value);
    els.tripCodeInput.value = state.tripCode;
    saveString("tripCode", state.tripCode);
  });

  els.rateInput.addEventListener("input", () => {
    state.rate = Number(els.rateInput.value) || APP_CONFIG.defaultRate;
    saveString("rate", String(state.rate));
    updateTwdFromJpy();
    renderExpenseDerived();
    renderBudgetTotals();
  });
  els.jpyInput.addEventListener("input", updateTwdFromJpy);
  els.twdInput.addEventListener("input", updateJpyFromTwd);

  els.expenseForm.addEventListener("submit", handleExpenseSubmit);
  els.cancelEditExpense.addEventListener("click", resetExpenseForm);
  els.exportDataBtn.addEventListener("click", exportData);
  els.importDataInput.addEventListener("change", importData);

  els.hotelInfo.addEventListener("input", () => {
    saveString("hotelInfo", els.hotelInfo.value);
    renderEmergencySavedInfo();
  });
  els.insuranceInfo.addEventListener("input", () => {
    saveString("insuranceInfo", els.insuranceInfo.value);
    renderEmergencySavedInfo();
  });
}

async function bootFirebase() {
  if (!navigator.onLine) {
    setSyncStatus("offline", "離線，先本地暫存");
    return;
  }

  state.firebaseReady = await initFirebase({
    onStatus: setSyncStatus,
    onExpenses: (cloudExpenses) => {
      const merged = mergeCloudWithPending(cloudExpenses);
      state.expenses = merged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      saveJson("expenses", state.expenses);
      renderExpenseDerived();
    }
  });

  if (state.firebaseReady) syncPending();
}

function setSyncStatus(stateName, text) {
  els.syncStatus.dataset.state = stateName;
  els.syncText.textContent = text;
}

function activateTab(tab) {
  state.currentTab = tab;
  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `panel-${tab}`);
  });
  document.querySelector(".tabs").scrollIntoView({ behavior: "smooth", block: "start" });
  refreshIcons();
}

function activateTool(tool) {
  state.currentTool = tool;
  document.querySelectorAll(".tool-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === tool);
  });
  document.querySelectorAll(".tool-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `tool-${tool}`);
  });
}

function renderMemberPicker() {
  els.memberPicker.innerHTML = APP_CONFIG.members.map((member) => `
    <label class="member-option">
      <input type="radio" name="member" value="${escapeHtml(member)}" ${member === state.selectedMember ? "checked" : ""}>
      <span>${escapeHtml(member)}</span>
    </label>
  `).join("");

  els.memberPicker.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      state.selectedMember = input.value;
      saveString("selectedMember", state.selectedMember);
      els.expensePayer.value = state.selectedMember;
    });
  });
}

function renderPayerOptions() {
  els.expensePayer.innerHTML = APP_CONFIG.members.map((member) => (
    `<option value="${escapeHtml(member)}">${escapeHtml(member)}</option>`
  )).join("");
  els.expensePayer.value = state.selectedMember;
}

function renderSplitMembers() {
  els.splitMembers.innerHTML = APP_CONFIG.members.map((member) => `
    <label class="member-option">
      <input type="checkbox" value="${escapeHtml(member)}" checked>
      <span>${escapeHtml(member)}</span>
    </label>
  `).join("");
}

function renderMapLinks() {
  document.querySelectorAll("[data-place-link]").forEach((link) => {
    const place = APP_CONFIG.places[link.dataset.placeLink];
    if (!place) return;
    link.href = googleMapsSearchUrl(place.query);
    if (!link.textContent.trim()) link.textContent = place.label;
  });

  document.querySelectorAll("[data-map-route]").forEach((link) => {
    const stops = APP_CONFIG.routes[link.dataset.mapRoute];
    if (stops) link.href = googleMapsRouteUrl(stops);
  });
}

function renderItinerary() {
  els.itineraryList.innerHTML = APP_CONFIG.itinerary.map((day, index) => `
    <article class="day-card ${index === 0 ? "open" : ""}">
      <div class="day-header" role="button" tabindex="0">
        <div class="day-num">${day.day}</div>
        <div>
          <h3>${escapeHtml(day.title)}</h3>
          <div class="day-sub">${escapeHtml(day.subtitle)}</div>
        </div>
        <button class="icon-btn" type="button" aria-label="展開行程"><i data-lucide="plus"></i></button>
      </div>
      <div class="day-body">
        <ul class="activity-list">
          ${day.activities.map(([time, title, text, icon]) => `
            <li>
              <div class="activity-time">${escapeHtml(time)}</div>
              <div>
                <div class="activity-title"><i data-lucide="${icon}"></i>${escapeHtml(title)}</div>
                <p>${escapeHtml(text)}</p>
              </div>
            </li>
          `).join("")}
        </ul>
        <div class="day-actions button-row">
          <a class="ghost-btn" href="${googleMapsRouteUrl(APP_CONFIG.routes[day.id] || APP_CONFIG.routes.day1)}" target="_blank" rel="noreferrer">
            <i data-lucide="map"></i>開啟今日路線
          </a>
        </div>
      </div>
    </article>
  `).join("");

  els.itineraryList.querySelectorAll(".day-header").forEach((header) => {
    header.addEventListener("click", () => header.closest(".day-card").classList.toggle("open"));
    header.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        header.closest(".day-card").classList.toggle("open");
      }
    });
  });
}

function renderQuickAmounts() {
  const quick = [
    ["LoL A 區", 12000],
    ["LoL B 區", 9000],
    ["晚餐", 3500],
    ["住宿", 30000],
    ["名鐵", 1230]
  ];
  els.quickAmounts.innerHTML = quick.map(([label, amount]) => (
    `<button type="button" data-jpy="${amount}">${label} ${formatJpy(amount)}</button>`
  )).join("");
  els.quickAmounts.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      els.jpyInput.value = button.dataset.jpy;
      updateTwdFromJpy();
    });
  });
  updateTwdFromJpy();
}

function updateTwdFromJpy() {
  const twd = toTwd(Number(els.jpyInput.value), "JPY", state.rate);
  els.twdInput.value = Math.round(twd);
  renderCalculatorResult(twd);
}

function updateJpyFromTwd() {
  const twd = Number(els.twdInput.value) || 0;
  els.jpyInput.value = state.rate ? Math.round(twd / state.rate) : 0;
  renderCalculatorResult(twd);
}

function renderCalculatorResult(twd) {
  els.calcPerPerson.textContent = `每人 ${formatTwd(twd)}`;
  els.calcFourPeople.textContent = `四人合計 ${formatTwd(twd * APP_CONFIG.members.length)}`;
}

function renderBudgetInputs() {
  els.budgetGrid.innerHTML = APP_CONFIG.budgetDefaults.map(([name]) => `
    <label class="field">
      <span>${escapeHtml(name)} / 人 TWD</span>
      <input type="number" min="0" step="100" data-budget="${escapeHtml(name)}" value="${Number(state.budget[name] || 0)}">
    </label>
  `).join("");
  els.budgetGrid.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      state.budget[input.dataset.budget] = Number(input.value) || 0;
      saveJson("budget", state.budget);
      renderBudgetTotals();
    });
  });
  renderBudgetTotals();
}

function renderBudgetTotals() {
  const perPerson = Object.values(state.budget).reduce((sum, value) => sum + (Number(value) || 0), 0);
  els.budgetPerPerson.textContent = formatTwd(perPerson);
  els.budgetTotal.textContent = formatTwd(perPerson * APP_CONFIG.members.length);
}

async function handleExpenseSubmit(event) {
  event.preventDefault();
  const checked = [...els.splitMembers.querySelectorAll("input:checked")].map((input) => input.value);
  if (!checked.length) {
    alert("至少要選一位分攤成員。");
    return;
  }

  const existingId = els.editingExpenseId.value;
  const existing = state.expenses.find((expense) => expense.id === existingId);
  const expense = normalizeExpense({
    id: existingId || uid("exp"),
    title: els.expenseTitle.value,
    amount: els.expenseAmount.value,
    currency: els.expenseCurrency.value,
    payer: els.expensePayer.value,
    category: els.expenseCategory.value,
    splitAmong: checked,
    note: els.expenseNote.value,
    createdAt: existing?.createdAt || Date.now()
  }, APP_CONFIG.members);

  upsertLocalExpense(expense);
  resetExpenseForm();
  await saveExpense(expense);
}

function upsertLocalExpense(expense) {
  const index = state.expenses.findIndex((item) => item.id === expense.id);
  if (index >= 0) state.expenses.splice(index, 1, expense);
  else state.expenses.unshift(expense);
  saveJson("expenses", state.expenses);
  renderExpenseDerived();
}

async function saveExpense(expense) {
  if (!state.firebaseReady || !navigator.onLine) {
    queueUpsert(expense);
    setSyncStatus("pending", "待同步");
    return;
  }

  try {
    setSyncStatus("pending", "同步中");
    await saveExpenseToCloud(expense);
    removePendingUpsert(expense.id);
    setSyncStatus("synced", "已同步");
  } catch (error) {
    console.error(error);
    queueUpsert(expense);
    setSyncStatus("error", "同步失敗，已本地暫存");
  }
}

async function deleteExpense(id) {
  state.expenses = state.expenses.filter((expense) => expense.id !== id);
  saveJson("expenses", state.expenses);
  renderExpenseDerived();

  if (!state.firebaseReady || !navigator.onLine) {
    queueDelete(id);
    setSyncStatus("pending", "刪除待同步");
    return;
  }

  try {
    setSyncStatus("pending", "同步刪除");
    await deleteExpenseFromCloud(id);
    removePendingDelete(id);
    setSyncStatus("synced", "已同步");
  } catch (error) {
    console.error(error);
    queueDelete(id);
    setSyncStatus("error", "刪除同步失敗");
  }
}

async function syncPending() {
  if (!state.firebaseReady || !navigator.onLine) return;
  try {
    setSyncStatus("pending", "同步待辦中");
    for (const expense of state.pendingUpserts) {
      await saveExpenseToCloud(expense);
    }
    for (const id of state.pendingDeletes) {
      await deleteExpenseFromCloud(id);
    }
    state.pendingUpserts = [];
    state.pendingDeletes = [];
    saveJson("pendingUpserts", state.pendingUpserts);
    saveJson("pendingDeletes", state.pendingDeletes);
    setSyncStatus("synced", "已同步");
  } catch (error) {
    console.error(error);
    setSyncStatus("error", "待同步失敗");
  }
}

function queueUpsert(expense) {
  state.pendingUpserts = state.pendingUpserts.filter((item) => item.id !== expense.id);
  state.pendingUpserts.push(expense);
  state.pendingDeletes = state.pendingDeletes.filter((id) => id !== expense.id);
  saveJson("pendingUpserts", state.pendingUpserts);
  saveJson("pendingDeletes", state.pendingDeletes);
}

function queueDelete(id) {
  state.pendingDeletes = [...new Set([...state.pendingDeletes, id])];
  state.pendingUpserts = state.pendingUpserts.filter((item) => item.id !== id);
  saveJson("pendingDeletes", state.pendingDeletes);
  saveJson("pendingUpserts", state.pendingUpserts);
}

function removePendingUpsert(id) {
  state.pendingUpserts = state.pendingUpserts.filter((item) => item.id !== id);
  saveJson("pendingUpserts", state.pendingUpserts);
}

function removePendingDelete(id) {
  state.pendingDeletes = state.pendingDeletes.filter((item) => item !== id);
  saveJson("pendingDeletes", state.pendingDeletes);
}

function mergeCloudWithPending(cloudExpenses) {
  const map = new Map(cloudExpenses.map((expense) => [expense.id, expense]));
  state.pendingUpserts.forEach((expense) => map.set(expense.id, expense));
  state.pendingDeletes.forEach((id) => map.delete(id));
  return [...map.values()];
}

function renderExpenseDerived() {
  const rows = calculateBalances(state.expenses, APP_CONFIG.members, state.rate);
  const transfers = optimizeTransfers(rows.balances);

  els.totalExpense.textContent = formatTwd(rows.total);
  els.expenseCount.textContent = String(state.expenses.length);

  els.balanceSummary.innerHTML = rows.balances.map((row) => {
    const className = row.amount > 0 ? "positive" : row.amount < 0 ? "negative" : "neutral";
    const label = row.amount > 0 ? "應收" : row.amount < 0 ? "應付" : "已平衡";
    return `<div class="balance-pill"><span>${escapeHtml(row.member)} · ${label}</span><strong class="${className}">${formatTwd(Math.abs(row.amount))}</strong></div>`;
  }).join("");

  els.settlementList.innerHTML = transfers.length
    ? transfers.map((item) => `<div class="settlement-item"><span>${escapeHtml(item.from)} 轉給 ${escapeHtml(item.to)}</span><strong>${formatTwd(item.amount)}</strong></div>`).join("")
    : `<div class="empty-state">目前沒有需要轉帳的差額。</div>`;

  renderExpenseList();
}

function renderExpenseList() {
  if (!state.expenses.length) {
    els.expenseList.innerHTML = `<div class="empty-state">還沒有支出。新增第一筆代墊吧。</div>`;
    return;
  }

  els.expenseList.innerHTML = state.expenses.map((expense) => {
    const amountText = expense.currency === "JPY"
      ? `${formatJpy(expense.amount)} · 約 ${formatTwd(toTwd(expense.amount, "JPY", state.rate))}`
      : formatTwd(expense.amount);
    const split = expense.splitAmong?.join("、") || "四人";
    return `
      <article class="expense-item" data-id="${escapeHtml(expense.id)}">
        <div>
          <h4>${escapeHtml(expense.title)}</h4>
          <p>${amountText} · ${escapeHtml(expense.payer)} 先付 · ${escapeHtml(expense.category)} · 分攤：${escapeHtml(split)}</p>
          ${expense.note ? `<p>${escapeHtml(expense.note)}</p>` : ""}
        </div>
        <div class="expense-actions">
          <button class="icon-btn edit-expense" type="button" title="編輯"><i data-lucide="pencil"></i></button>
          <button class="icon-btn delete-expense" type="button" title="刪除"><i data-lucide="trash-2"></i></button>
        </div>
      </article>
    `;
  }).join("");

  els.expenseList.querySelectorAll(".edit-expense").forEach((button) => {
    button.addEventListener("click", () => editExpense(button.closest(".expense-item").dataset.id));
  });
  els.expenseList.querySelectorAll(".delete-expense").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.closest(".expense-item").dataset.id;
      const expense = state.expenses.find((item) => item.id === id);
      if (confirm(`刪除「${expense?.title || "這筆支出"}」？`)) deleteExpense(id);
    });
  });
  refreshIcons();
}

function editExpense(id) {
  const expense = state.expenses.find((item) => item.id === id);
  if (!expense) return;
  els.expenseFormTitle.textContent = "編輯代墊";
  els.editingExpenseId.value = expense.id;
  els.expenseTitle.value = expense.title;
  els.expenseAmount.value = expense.amount;
  els.expenseCurrency.value = expense.currency;
  els.expensePayer.value = expense.payer;
  els.expenseCategory.value = expense.category;
  els.expenseNote.value = expense.note || "";
  els.splitMembers.querySelectorAll("input").forEach((input) => {
    input.checked = expense.splitAmong.includes(input.value);
  });
  activateTab("tools");
  activateTool("expenses");
  els.expenseForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetExpenseForm() {
  els.expenseForm.reset();
  els.expenseFormTitle.textContent = "新增代墊";
  els.editingExpenseId.value = "";
  els.expensePayer.value = state.selectedMember;
  els.expenseCurrency.value = "JPY";
  els.splitMembers.querySelectorAll("input").forEach((input) => {
    input.checked = true;
  });
}

function renderChecklist() {
  els.checklistRoot.innerHTML = Object.entries(APP_CONFIG.checklist).map(([section, items]) => `
    <div class="check-section">
      <h4>${escapeHtml(section)}</h4>
      <div class="check-list">
        ${items.map((item) => {
          const key = `${section}:${item}`;
          const checked = Boolean(state.checklist[key]);
          return `<label class="check-item ${checked ? "done" : ""}">
            <input type="checkbox" data-check="${escapeHtml(key)}" ${checked ? "checked" : ""}>
            <span>${escapeHtml(item)}</span>
          </label>`;
        }).join("")}
      </div>
    </div>
  `).join("");

  els.checklistRoot.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      state.checklist[input.dataset.check] = input.checked;
      saveJson("checklist", state.checklist);
      input.closest(".check-item").classList.toggle("done", input.checked);
      updateChecklistProgress();
    });
  });
  updateChecklistProgress();
}

function updateChecklistProgress() {
  const total = Object.values(APP_CONFIG.checklist).flat().length;
  const done = Object.keys(state.checklist).filter((key) => state.checklist[key]).length;
  els.checkProgress.textContent = `${done} / ${total}`;
  els.checkProgressBar.style.width = total ? `${Math.round((done / total) * 100)}%` : "0%";
}

function renderRoles() {
  els.rolesList.innerHTML = APP_CONFIG.roles.map(([name, role]) => `
    <div class="role-item"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(role)}</span></div>
  `).join("");
  renderEmergencySavedInfo();
}

function renderEmergencySavedInfo() {
  const hotel = loadString("hotelInfo", "");
  const insurance = loadString("insuranceInfo", "");
  els.emergencySavedInfo.innerHTML = `
    <p><strong>飯店：</strong>${hotel ? escapeHtml(hotel) : "尚未填寫"}</p>
    <p><strong>旅平險：</strong>${insurance ? escapeHtml(insurance) : "尚未填寫"}</p>
  `;
}

function renderPhrases() {
  els.phraseList.innerHTML = APP_CONFIG.phrases.map(([zh, jp, romaji]) => `
    <article class="phrase-card">
      <h3>${escapeHtml(zh)}</h3>
      <p class="jp">${escapeHtml(jp)}</p>
      <p class="romaji">${escapeHtml(romaji)}</p>
    </article>
  `).join("");
}

function updateCountdown() {
  const target = new Date(APP_CONFIG.matchDateIso).getTime();
  const diff = target - Date.now();
  if (diff <= 0) {
    els.countdown.textContent = "開賽中";
    return;
  }
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  els.countdown.textContent = `${days} 天 ${hours} 小時`;
}

function exportData() {
  const payload = {
    exportedAt: new Date().toISOString(),
    tripId: APP_CONFIG.tripId,
    expenses: state.expenses,
    pendingUpserts: state.pendingUpserts,
    pendingDeletes: state.pendingDeletes,
    checklist: state.checklist,
    budget: state.budget,
    rate: state.rate,
    selectedMember: state.selectedMember,
    hotelInfo: loadString("hotelInfo", ""),
    insuranceInfo: loadString("insuranceInfo", "")
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `nagoya-trip-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    if (Array.isArray(payload.expenses)) {
      state.expenses = payload.expenses;
      saveJson("expenses", state.expenses);
    }
    if (payload.checklist) {
      state.checklist = payload.checklist;
      saveJson("checklist", state.checklist);
    }
    if (payload.budget) {
      state.budget = payload.budget;
      saveJson("budget", state.budget);
    }
    if (payload.rate) {
      state.rate = Number(payload.rate);
      saveString("rate", String(state.rate));
      els.rateInput.value = state.rate;
    }
    if (payload.selectedMember) {
      state.selectedMember = payload.selectedMember;
      saveString("selectedMember", state.selectedMember);
    }
    if (payload.hotelInfo) saveString("hotelInfo", payload.hotelInfo);
    if (payload.insuranceInfo) saveString("insuranceInfo", payload.insuranceInfo);
    renderStaticContent();
    renderAll();
    if (confirm("匯入完成。要把匯入的支出同步到 Firebase 嗎？")) {
      state.pendingUpserts = state.expenses;
      saveJson("pendingUpserts", state.pendingUpserts);
      syncPending();
    }
  } catch (error) {
    console.error(error);
    alert("匯入失敗，請確認 JSON 檔案格式。");
  } finally {
    event.target.value = "";
  }
}

function renderAll() {
  renderExpenseDerived();
  renderBudgetTotals();
  renderEmergencySavedInfo();
  updateChecklistProgress();
  refreshIcons();
}

function sanitizeTripCode(value) {
  return (value || APP_CONFIG.tripId)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9-]/g, "") || APP_CONFIG.tripId;
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./sw.js").catch((error) => {
    console.warn("Service worker registration failed", error);
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}
