"use strict";

const STORAGE_KEY = "ecole-pwa-v1";
const APP_VERSION = 1;
const MAX_ATTACHMENT_SIZE = 750 * 1024;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const CATEGORIES = {
  homework: {
    label: "Devoirs", short: "Devoirs", icon: "✎", color: "#2457e6",
    eyebrow: "Le travail à faire", titleField: "work", subjectRef: "subjects",
    fields: [
      ["subject", "Matière", "text", true, "Ex. Mathématiques", "subjects"],
      ["work", "Travail demandé", "text", true, "Ex. exercices 4 et 5 page 82"],
      ["manual", "Manuel, page ou exercice", "text", false, "Ex. page 82, exercice 4"],
      ["estimatedTime", "Temps estimé", "text", false, "Ex. 30 minutes"]
    ]
  },
  tests: {
    label: "Contrôles et notes", short: "Contrôles", icon: "✓", color: "#f02f78",
    eyebrow: "Évaluations et résultats", titleField: "topic", subjectRef: "subjects",
    fields: [
      ["subject", "Matière", "text", true, "Ex. Français", "subjects"],
      ["topic", "Sujet ou chapitre", "text", true, "Ex. dictée, chapitre 6"],
      ["revision", "Révisions", "textarea", false, "Points à revoir"],
      ["score", "Note obtenue", "text", false, "Ex. 15"],
      ["scale", "Barème", "text", false, "Ex. 20"],
      ["comment", "Commentaire", "textarea", false, "Appréciation ou observation"]
    ]
  },
  trips: {
    label: "Sorties scolaires", short: "Sorties", icon: "⌁", color: "#00a99d",
    eyebrow: "Activités hors de l’école", titleField: "name",
    fields: [
      ["name", "Nom", "text", true, "Ex. visite du musée"],
      ["location", "Lieu", "text", true, "Adresse ou lieu"],
      ["schedule", "Horaires", "text", false, "Ex. 8 h 30 - 16 h"],
      ["group", "Classe ou groupe", "text", false, "Ex. CM2 A"],
      ["companion", "Accompagnateur", "text", false, "Nom ou rôle"],
      ["cost", "Coût", "text", false, "Ex. 8 €"],
      ["equipment", "Matériel", "textarea", false, "Ce qu’il faut apporter"],
      ["picnic", "Pique-nique", "checkbox", false],
      ["authorization", "Autorisation signée", "checkbox", false]
    ]
  },
  supplies: {
    label: "Fournitures", short: "Fournitures", icon: "▤", color: "#f2a900",
    eyebrow: "Matériel scolaire", titleField: "article", subjectRef: "subjects",
    fields: [
      ["article", "Article", "text", true, "Ex. cahier 24 × 32"],
      ["use", "Matière ou usage", "text", false, "Ex. Arts plastiques", "subjects"],
      ["quantity", "Quantité", "number", false, "1"],
      ["purchased", "Acheté", "checkbox", false],
      ["cost", "Coût", "text", false, "Ex. 4,50 €"],
      ["store", "Magasin ou précision", "text", false, "Ex. papeterie"]
    ]
  },
  meetings: {
    label: "Rendez-vous école", short: "Rendez-vous", icon: "◇", color: "#009bd4",
    eyebrow: "Échanges avec l’école", titleField: "person",
    fields: [
      ["person", "Personne rencontrée", "text", true, "Ex. Mme Martin"],
      ["role", "Rôle", "text", false, "Ex. enseignante"],
      ["reason", "Motif", "text", true, "Ex. bilan du trimestre"],
      ["location", "Lieu", "text", false, "Ex. salle 12"],
      ["questions", "Questions", "textarea", false, "Questions à poser"],
      ["report", "Compte rendu", "textarea", false, "Notes après le rendez-vous"]
    ]
  },
  documents: {
    label: "Documents scolaires", short: "Documents", icon: "▱", color: "#7b42d1",
    eyebrow: "École, administration et cantine", titleField: "documentType",
    fields: [
      ["documentType", "Type de document", "text", true, "Ex. Cantine", "documentTypes"],
      ["service", "Service concerné", "text", true, "Ex. Administration", "services"],
      ["receivedDate", "Date de réception", "date", false],
      ["signatureRequired", "Signature nécessaire", "checkbox", false],
      ["submitted", "Remis", "checkbox", false]
    ]
  }
};

const DEFAULT_REFS = {
  classes: ["Petite section", "Moyenne section", "Grande section", "CP", "CE1", "CE2", "CM1", "CM2", "6e", "5e", "4e", "3e", "Seconde", "Première", "Terminale"],
  schools: [],
  teachers: [],
  subjects: ["Autres", "Mathématiques", "Français", "Lecture", "Histoire", "Géographie", "Sciences", "Anglais", "Arts", "Sport"],
  documentTypes: ["Autres", "Cantine", "Inscription", "Autorisation", "Certificat", "Assurance scolaire", "Transport", "Règlement", "Dossier administratif", "Bulletin", "Emploi du temps"],
  services: ["Autres", "Établissement", "Administration", "Cantine", "Transport"],
  frequencies: ["Une fois", "Chaque semaine", "Chaque mois"],
  reminderOptions: ["Aucun", "Le matin", "La veille", "2 jours avant", "1 semaine avant"],
  suggestions: ["À vérifier", "À apporter", "À signer", "À acheter"]
};

const FIELD_LABELS = {
  date: "Date", time: "Heure", reminder: "Rappel"
};

let data = loadData();
let state = {
  view: "home",
  childId: data.children[0]?.id || null,
  category: "homework",
  calendarView: "week",
  filter: "all",
  focusDate: toISODate(new Date()),
  selectedDate: null,
  familyCalendarView: "week",
  familyFilter: "all",
  familyFocusDate: toISODate(new Date()),
  familySelectedDate: null,
  pendingConfirm: null,
  pendingAttachment: null,
  pendingAvatar: null
};

function createDefaultData() {
  return {
    version: APP_VERSION,
    children: [],
    items: [],
    refs: structuredClone(DEFAULT_REFS),
    preferences: { defaultReminder: "La veille" }
  };
}

function loadData() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || !Array.isArray(parsed.children) || !Array.isArray(parsed.items)) return createDefaultData();
    return {
      version: APP_VERSION,
      children: parsed.children,
      items: parsed.items,
      refs: { ...structuredClone(DEFAULT_REFS), ...(parsed.refs || {}) },
      preferences: { defaultReminder: "La veille", ...(parsed.preferences || {}) }
    };
  } catch {
    return createDefaultData();
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    showToast("Stockage plein. Retirez une pièce jointe.");
    return false;
  }
  return true;
}

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowISO() {
  return new Date().toISOString();
}

function toISODate(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function fromISO(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function startOfWeek(date) {
  const result = new Date(date);
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function formatDate(value, options = { day: "numeric", month: "short" }) {
  const date = typeof value === "string" ? fromISO(value) : value;
  return date ? new Intl.DateTimeFormat("fr-FR", options).format(date) : "Sans date";
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function currentChild() {
  return data.children.find(child => child.id === state.childId) || null;
}

function childItems(childId = state.childId) {
  return data.items.filter(item => item.childId === childId);
}

function isDone(item) {
  return item.status === "done";
}

function itemTitle(item) {
  const config = CATEGORIES[item.category];
  return item.title || item.details?.[config?.titleField] || config?.label || "Élément scolaire";
}

function itemDetails(item) {
  const details = item.details || {};
  if (item.category === "homework" || item.category === "tests") return details.subject || "";
  if (item.category === "trips" || item.category === "meetings") return details.location || details.reason || "";
  if (item.category === "supplies") return details.use || "";
  if (item.category === "documents") return details.service || "";
  return "";
}

function getUpcoming(childId, includeDone = false) {
  const today = toISODate(new Date());
  return childItems(childId)
    .filter(item => item.date && item.date >= today && (includeDone || !isDone(item)))
    .sort(sortItems);
}

function sortItems(a, b) {
  return `${a.date || "9999"}T${a.time || "23:59"}`.localeCompare(`${b.date || "9999"}T${b.time || "23:59"}`);
}

function getAlert(item) {
  if (isDone(item) || !item.date) return null;
  const today = fromISO(toISODate(new Date()));
  const due = fromISO(item.date);
  const days = Math.round((due - today) / 86400000);
  const details = item.details || {};
  if (days < 0) return { level: "urgent", text: "Élément en retard" };
  if (item.category === "documents" && details.signatureRequired && !details.submitted && days <= 2) return { level: "urgent", text: "Signature nécessaire" };
  if (item.category === "supplies" && !details.purchased && days <= 1) return { level: "urgent", text: "Fourniture non achetée" };
  if (item.category === "meetings" && days === 0) return { level: "urgent", text: "Rendez-vous aujourd’hui" };
  if (item.category === "tests" && days <= 2) return { level: days === 0 ? "urgent" : "notice", text: "Contrôle imminent" };
  if (item.category === "homework" && days <= 2) return { level: days === 0 ? "urgent" : "notice", text: "Devoir bientôt à rendre" };
  if (item.category === "documents" && days <= 3) return { level: days === 0 ? "urgent" : "notice", text: "Document bientôt à échéance" };
  return null;
}

function getAlerts(childId = null) {
  return data.items
    .filter(item => (!childId || item.childId === childId) && getAlert(item))
    .sort(sortItems);
}

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "EN";
}

function avatarHTML(child, className = "avatar") {
  return `<span class="${className}" style="--child:${child.color || "#2457e6"}">${child.avatar ? `<img src="${child.avatar}" alt="">` : escapeHTML(initials(child.name))}</span>`;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function showView(view) {
  state.view = view;
  document.body.classList.toggle("child-mode", view === "child");
  $$(".view").forEach(section => section.hidden = section.id !== `${view}View`);
  $$("[data-nav]").forEach(button => button.classList.toggle("active", button.dataset.nav === view || (view === "child" && button.dataset.nav === "agenda")));
  if (view === "home") renderHome();
  if (view === "child") renderChild();
  if (view === "settings") {
    renderChildrenManagement();
    renderSettings();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderHome() {
  const grid = $("#childrenGrid");
  if (!data.children.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><strong>Bienvenue dans ÉCOLE</strong>Ouvrez Réglages pour ajouter un enfant.</div>`;
  } else {
    grid.innerHTML = data.children.map(child => {
      const upcoming = getUpcoming(child.id);
      const next = upcoming[0];
      const alert = getAlerts(child.id)[0];
      return `<button class="child-card" style="--child:${child.color}" data-open-child="${child.id}" type="button">
        ${avatarHTML(child)}
        <span class="child-info"><strong>${escapeHTML(child.name)}</strong><small>${escapeHTML(child.className)} · ${escapeHTML(child.school)}</small><span class="child-teacher">${escapeHTML(child.teacher || "Enseignant non renseigné")}</span></span>
        <span class="child-summary"><b>${upcoming.length}</b> élément${upcoming.length > 1 ? "s" : ""} à venir<span>${next ? `Prochain : ${escapeHTML(itemTitle(next))} · ${formatDate(next.date)}` : "Rien de prévu"}</span></span>
        ${alert ? `<span class="child-alert">${escapeHTML(getAlert(alert).text)} · ${escapeHTML(itemTitle(alert))}</span>` : ""}
      </button>`;
    }).join("");
  }
  $$("[data-open-child]", grid).forEach(button => button.addEventListener("click", () => openChild(button.dataset.openChild)));
  renderFamilyAgenda();
}

function openChild(id) {
  state.childId = id;
  state.selectedDate = null;
  $("#categorySection").hidden = true;
  $("#agendaSection").hidden = false;
  $("#schoolCards").hidden = false;
  $("#agendaListSection").hidden = false;
  showView("child");
}

function renderChild() {
  const child = currentChild();
  if (!child) {
    showView("home");
    return;
  }
  const upcoming = getUpcoming(child.id);
  $("#profileBanner").style.setProperty("--child", child.color);
  $("#profileBanner").innerHTML = `${avatarHTML(child)}<span><p class="eyebrow">Son espace scolaire</p><h2>${escapeHTML(child.name)}</h2><small>${escapeHTML(child.className)} · ${escapeHTML(child.school)}</small><small>${escapeHTML(child.teacher || "Enseignant non renseigné")}</small></span><span class="profile-count">${upcoming.length} à venir</span>`;
  $("#schoolCards").innerHTML = Object.entries(CATEGORIES).map(([key, category]) => {
    const items = childItems().filter(item => item.category === key && !isDone(item)).sort(sortItems);
    const next = items[0];
    return `<button class="school-card ${state.category === key && !$("#categorySection").hidden ? "active" : ""}" style="--card:${category.color}" data-category="${key}" type="button">
      <span class="card-icon">${category.icon}</span><strong>${category.label}</strong><small>${next ? `${escapeHTML(itemTitle(next))} · ${formatDate(next.date)}` : "Aucun élément à venir"}</small><b>${items.length}</b>
    </button>`;
  }).join("");
  $$("[data-category]", $("#schoolCards")).forEach(button => button.addEventListener("click", () => openCategory(button.dataset.category)));
  renderAgenda();
  if (!$("#categorySection").hidden) renderCategory();
}

function openCategory(category, itemId = null) {
  state.category = category;
  $("#agendaSection").hidden = true;
  $("#schoolCards").hidden = true;
  $("#agendaListSection").hidden = true;
  $("#categorySection").hidden = false;
  renderChild();
  if (itemId) fillItemForm(data.items.find(item => item.id === itemId));
  else resetItemForm();
  $("#categorySection").scrollIntoView({ behavior: "smooth", block: "start" });
}

function showAgenda() {
  if (!currentChild()) {
    if (!data.children.length) {
      showView("settings");
      showToast("Ajoutez d’abord un enfant.");
      return;
    }
    state.childId = data.children[0].id;
  }
  $("#categorySection").hidden = true;
  $("#agendaSection").hidden = false;
  $("#schoolCards").hidden = false;
  $("#agendaListSection").hidden = false;
  showView("child");
  setTimeout(() => $("#agendaSection").scrollIntoView({ behavior: "smooth", block: "start" }), 0);
}

function renderAgenda() {
  $$("[data-calendar-view]").forEach(button => button.classList.toggle("active", button.dataset.calendarView === state.calendarView));
  const focus = fromISO(state.focusDate);
  let start;
  let end;
  if (state.calendarView === "day") {
    start = focus;
    end = focus;
    $("#periodLabel").textContent = formatDate(focus, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    $("#calendar").className = "calendar day-calendar";
    $("#calendar").innerHTML = `<button class="day-calendar-button" data-calendar-date="${toISODate(focus)}" type="button" aria-label="Ajouter une action le ${formatDate(focus, { day: "numeric", month: "long" })}"><strong>${focus.getDate()}</strong><span>${formatDate(focus, { weekday: "long", month: "long" })}</span><small>Toucher pour ajouter</small></button>`;
  } else if (state.calendarView === "week") {
    start = startOfWeek(focus);
    end = addDays(start, 6);
    $("#periodLabel").textContent = `${formatDate(start, { day: "numeric", month: "short" })} – ${formatDate(end, { day: "numeric", month: "short", year: "numeric" })}`;
    $("#calendar").className = "calendar week-calendar";
    $("#calendar").innerHTML = Array.from({ length: 7 }, (_, index) => calendarDayHTML(addDays(start, index))).join("");
  } else if (state.calendarView === "month") {
    start = new Date(focus.getFullYear(), focus.getMonth(), 1);
    end = endOfMonth(focus);
    const gridStart = startOfWeek(start);
    $("#periodLabel").textContent = formatDate(focus, { month: "long", year: "numeric" });
    $("#calendar").className = "calendar month-calendar";
    $("#calendar").innerHTML = `<div class="month-weekdays"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div><div class="month-grid">${Array.from({ length: 42 }, (_, index) => calendarDayHTML(addDays(gridStart, index), true, focus.getMonth())).join("")}</div>`;
  } else {
    start = startOfWeek(focus);
    end = addDays(start, 6);
    $("#periodLabel").textContent = `${formatDate(start, { day: "numeric", month: "short" })} – ${formatDate(end, { day: "numeric", month: "short", year: "numeric" })}`;
    renderGantt(start, end);
  }
  $$("[data-calendar-date]", $("#calendar")).forEach(button => button.addEventListener("click", () => {
    state.selectedDate = button.dataset.calendarDate;
    state.focusDate = button.dataset.calendarDate;
    openQuickAdd();
  }));
  $$("[data-gantt-item]", $("#calendar")).forEach(button => button.addEventListener("click", event => {
    event.stopPropagation();
    const item = data.items.find(entry => entry.id === button.dataset.ganttItem);
    openCategory(item.category, item.id);
  }));
  renderFilters();
  renderAgendaList(start, end);
}

function renderFamilyAgenda() {
  $$("[data-family-calendar-view]").forEach(button => button.classList.toggle("active", button.dataset.familyCalendarView === state.familyCalendarView));
  const focus = fromISO(state.familyFocusDate);
  let start;
  let end;
  if (state.familyCalendarView === "day") {
    start = focus;
    end = focus;
    $("#familyPeriodLabel").textContent = formatDate(focus, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    $("#familyCalendar").className = "calendar day-calendar";
    $("#familyCalendar").innerHTML = `<button class="day-calendar-button" data-family-calendar-date="${toISODate(focus)}" type="button"><strong>${focus.getDate()}</strong><span>${formatDate(focus, { weekday: "long", month: "long" })}</span><small>Voir cette journée</small></button>`;
  } else if (state.familyCalendarView === "week") {
    start = startOfWeek(focus);
    end = addDays(start, 6);
    $("#familyPeriodLabel").textContent = `${formatDate(start, { day: "numeric", month: "short" })} – ${formatDate(end, { day: "numeric", month: "short", year: "numeric" })}`;
    $("#familyCalendar").className = "calendar week-calendar";
    $("#familyCalendar").innerHTML = Array.from({ length: 7 }, (_, index) => familyCalendarDayHTML(addDays(start, index))).join("");
  } else if (state.familyCalendarView === "month") {
    start = new Date(focus.getFullYear(), focus.getMonth(), 1);
    end = endOfMonth(focus);
    const gridStart = startOfWeek(start);
    $("#familyPeriodLabel").textContent = formatDate(focus, { month: "long", year: "numeric" });
    $("#familyCalendar").className = "calendar month-calendar";
    $("#familyCalendar").innerHTML = `<div class="month-weekdays"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div><div class="month-grid">${Array.from({ length: 42 }, (_, index) => familyCalendarDayHTML(addDays(gridStart, index), true, focus.getMonth())).join("")}</div>`;
  } else {
    start = startOfWeek(focus);
    end = addDays(start, 6);
    $("#familyPeriodLabel").textContent = `${formatDate(start, { day: "numeric", month: "short" })} – ${formatDate(end, { day: "numeric", month: "short", year: "numeric" })}`;
    renderFamilyGantt(start, end);
  }
  $$("[data-family-calendar-date]", $("#familyCalendar")).forEach(button => button.addEventListener("click", () => {
    state.familySelectedDate = button.dataset.familyCalendarDate;
    state.familyFocusDate = button.dataset.familyCalendarDate;
    renderFamilyAgenda();
  }));
  $$("[data-family-gantt-item]", $("#familyCalendar")).forEach(button => button.addEventListener("click", event => {
    event.stopPropagation();
    editItemFromAnywhere(button.dataset.familyGanttItem);
  }));
  renderFamilyFilters();
  renderFamilyAgendaList(start, end);
}

function familyCalendarDayHTML(date, monthMode = false, activeMonth = null) {
  const iso = toISODate(date);
  const events = data.items.filter(item => item.date === iso);
  const selected = state.familySelectedDate === iso || (!state.familySelectedDate && iso === state.familyFocusDate);
  const outside = monthMode && date.getMonth() !== activeMonth;
  const dots = events.slice(0, 6).map(item => `<i style="--dot:${CATEGORIES[item.category].color}"></i>`).join("");
  if (monthMode) return `<button class="month-day ${selected ? "selected" : ""} ${outside ? "outside" : ""}" data-family-calendar-date="${iso}" type="button">${date.getDate()}<span class="day-dots">${dots}</span></button>`;
  return `<button class="calendar-day ${selected ? "selected" : ""}" data-family-calendar-date="${iso}" type="button"><small>${formatDate(date, { weekday: "short" })}</small><strong>${date.getDate()}</strong><span class="day-dots">${dots}</span></button>`;
}

function renderFamilyGantt(start, end) {
  const items = data.items
    .filter(item => item.date && item.date >= toISODate(start) && item.date <= toISODate(end))
    .filter(item => state.familyFilter === "all" || item.category === state.familyFilter)
    .sort(sortItems);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const rows = items.length ? items.map(item => {
    const child = data.children.find(entry => entry.id === item.childId);
    const dayIndex = Math.max(0, Math.round((fromISO(item.date) - start) / 86400000));
    const category = CATEGORIES[item.category];
    return `<div class="gantt-row">
      <span class="gantt-label"><b>${escapeHTML(child?.name || "")}</b><small>${escapeHTML(itemTitle(item))}</small></span>
      ${days.map(date => `<button class="gantt-cell ${toISODate(date) === toISODate(new Date()) ? "today" : ""}" data-family-calendar-date="${toISODate(date)}" type="button"></button>`).join("")}
      <button class="gantt-bar" data-family-gantt-item="${item.id}" style="--event:${category.color};left:${138 + dayIndex * 62 + 3}px;width:56px" type="button">${category.icon} ${escapeHTML(child?.name || "")}</button>
    </div>`;
  }).join("") : `<div class="gantt-row"><span class="gantt-label">Aucun élément</span>${days.map(date => `<button class="gantt-cell" data-family-calendar-date="${toISODate(date)}" type="button"></button>`).join("")}</div>`;
  $("#familyCalendar").className = "calendar gantt-calendar";
  $("#familyCalendar").innerHTML = `<div class="gantt-board"><div class="gantt-head"><span>Enfant · élément</span>${days.map(date => `<span>${formatDate(date, { weekday: "short" })}<br>${date.getDate()}</span>`).join("")}</div>${rows}</div>`;
}

function renderFamilyFilters() {
  const filters = [["all", "Tous"], ...Object.entries(CATEGORIES).map(([key, category]) => [key, category.short])];
  $("#familyFilterRow").innerHTML = filters.map(([key, label]) => `<button class="${state.familyFilter === key ? "active" : ""}" data-family-filter="${key}" type="button">${label}</button>`).join("");
  $$("[data-family-filter]", $("#familyFilterRow")).forEach(button => button.addEventListener("click", () => {
    state.familyFilter = button.dataset.familyFilter;
    renderFamilyAgenda();
  }));
}

function renderFamilyAgendaList(periodStart, periodEnd) {
  const startISO = toISODate(periodStart);
  const endISO = toISODate(periodEnd);
  const items = data.items
    .filter(item => item.date && (state.familySelectedDate ? item.date === state.familySelectedDate : item.date >= startISO && item.date <= endISO))
    .filter(item => state.familyFilter === "all" || item.category === state.familyFilter)
    .sort(sortItems);
  $("#familyAgendaCount").textContent = `${items.length} élément${items.length > 1 ? "s" : ""}`;
  $("#familyListCount").textContent = `${items.length} élément${items.length > 1 ? "s" : ""}`;
  $("#familyAgendaList").innerHTML = items.length ? items.map(item => {
    const child = data.children.find(entry => entry.id === item.childId);
    const category = CATEGORIES[item.category];
    const alert = getAlert(item);
    return `<button class="event ${isDone(item) ? "done" : ""} ${alert?.level === "urgent" ? "urgent-event" : ""}" style="--event:${category.color}" data-family-item="${item.id}" type="button">
      <span class="event-date"><b>${fromISO(item.date).getDate()}</b><small>${formatDate(item.date, { month: "short" }).toUpperCase()}</small></span>
      <span><strong>${escapeHTML(itemTitle(item))}</strong><small>${escapeHTML(child?.name || "")} · ${escapeHTML(itemDetails(item))}${alert ? ` · ${escapeHTML(alert.text)}` : ""}</small></span>
      <span class="event-tag">${category.short}</span>
    </button>`;
  }).join("") : `<div class="empty-state"><strong>Aucun élément</strong>Rien n’est prévu pour cette période.</div>`;
  $$("[data-family-item]", $("#familyAgendaList")).forEach(button => button.addEventListener("click", () => editItemFromAnywhere(button.dataset.familyItem)));
}

function calendarDayHTML(date, monthMode = false, activeMonth = null) {
  const iso = toISODate(date);
  const events = childItems().filter(item => item.date === iso);
  const selected = state.selectedDate === iso || (!state.selectedDate && iso === state.focusDate);
  const outside = monthMode && date.getMonth() !== activeMonth;
  const dots = events.slice(0, 5).map(item => `<i style="--dot:${CATEGORIES[item.category].color}"></i>`).join("");
  if (monthMode) return `<button class="month-day ${selected ? "selected" : ""} ${outside ? "outside" : ""}" data-calendar-date="${iso}" type="button">${date.getDate()}<span class="day-dots">${dots}</span></button>`;
  return `<button class="calendar-day ${selected ? "selected" : ""}" data-calendar-date="${iso}" type="button"><small>${formatDate(date, { weekday: "short" })}</small><strong>${date.getDate()}</strong><span class="day-dots">${dots}</span></button>`;
}

function renderGantt(start, end) {
  const items = childItems()
    .filter(item => item.date && item.date >= toISODate(start) && item.date <= toISODate(end))
    .filter(item => state.filter === "all" || item.category === state.filter)
    .sort(sortItems);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const rows = items.length ? items.map(item => {
    const dayIndex = Math.max(0, Math.round((fromISO(item.date) - start) / 86400000));
    const category = CATEGORIES[item.category];
    return `<div class="gantt-row">
      <span class="gantt-label">${escapeHTML(itemTitle(item))}</span>
      ${days.map(date => `<button class="gantt-cell ${toISODate(date) === toISODate(new Date()) ? "today" : ""}" data-calendar-date="${toISODate(date)}" type="button" aria-label="Ajouter le ${formatDate(date, { day: "numeric", month: "long" })}"></button>`).join("")}
      <button class="gantt-bar" data-gantt-item="${item.id}" style="--event:${category.color};left:${138 + dayIndex * 62 + 3}px;width:56px" type="button" title="${escapeHTML(itemTitle(item))}">${category.icon} ${escapeHTML(itemTitle(item))}</button>
    </div>`;
  }).join("") : `<div class="gantt-row"><span class="gantt-label">Aucun élément</span>${days.map(date => `<button class="gantt-cell" data-calendar-date="${toISODate(date)}" type="button" aria-label="Ajouter le ${formatDate(date, { day: "numeric", month: "long" })}"></button>`).join("")}</div>`;
  $("#calendar").className = "calendar gantt-calendar";
  $("#calendar").innerHTML = `<div class="gantt-board">
    <div class="gantt-head"><span>Élément</span>${days.map(date => `<span>${formatDate(date, { weekday: "short" })}<br>${date.getDate()}</span>`).join("")}</div>
    ${rows}
  </div>`;
}

function renderFilters() {
  const filters = [["all", "Tous"], ...Object.entries(CATEGORIES).map(([key, category]) => [key, category.short])];
  $("#filterRow").innerHTML = filters.map(([key, label]) => `<button class="${state.filter === key ? "active" : ""}" data-filter="${key}" type="button">${label}</button>`).join("");
  $$("[data-filter]", $("#filterRow")).forEach(button => button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    renderAgenda();
  }));
}

function renderAgendaList(periodStart, periodEnd) {
  const selected = state.selectedDate;
  const startISO = toISODate(periodStart);
  const endISO = toISODate(periodEnd);
  const items = childItems()
    .filter(item => item.date && (selected ? item.date === selected : item.date >= startISO && item.date <= endISO))
    .filter(item => state.filter === "all" || item.category === state.filter)
    .sort(sortItems);
  $("#agendaCount").textContent = `${items.length} élément${items.length > 1 ? "s" : ""}`;
  $("#agendaList").innerHTML = items.length ? items.map(item => {
    const category = CATEGORIES[item.category];
    return `<button class="event ${isDone(item) ? "done" : ""}" style="--event:${category.color}" data-agenda-item="${item.id}" type="button">
      <span class="event-date"><b>${fromISO(item.date).getDate()}</b><small>${formatDate(item.date, { month: "short" }).toUpperCase()}</small></span>
      <span><strong>${escapeHTML(itemTitle(item))}</strong><small>${escapeHTML(itemDetails(item))}${item.time ? ` · ${escapeHTML(item.time)}` : ""}${isDone(item) ? " · terminé" : ""}</small></span>
      <span class="event-tag">${category.short}</span>
    </button>`;
  }).join("") : `<div class="empty-state"><strong>Aucun élément</strong>La période et les filtres sélectionnés sont vides.</div>`;
  $$("[data-agenda-item]", $("#agendaList")).forEach(button => button.addEventListener("click", () => {
    const item = data.items.find(entry => entry.id === button.dataset.agendaItem);
    openCategory(item.category, item.id);
  }));
}

function renderCategory() {
  const category = CATEGORIES[state.category];
  const section = $("#categorySection");
  section.style.setProperty("--detail", category.color);
  $("#categoryEyebrow").textContent = category.eyebrow;
  $("#categoryTitle").textContent = category.label;
  const items = childItems().filter(item => item.category === state.category).sort(sortItems);
  $("#categoryCount").textContent = items.length;
  $("#categoryListTitle").textContent = category.label;
  $("#categoryListCount").textContent = items.length;
  buildItemFields(category);
  $("#categoryList").innerHTML = items.length ? items.map(item => `<article class="detail-item ${isDone(item) ? "done" : ""}">
    <button class="check-button" data-toggle-item="${item.id}" type="button" aria-label="Cocher l’élément">${isDone(item) ? "✓" : ""}</button>
    <span><strong class="item-title">${escapeHTML(itemTitle(item))}</strong><small class="item-meta">${formatDate(item.date, { weekday: "short", day: "numeric", month: "long" })}${item.time ? ` · ${escapeHTML(item.time)}` : ""}${item.reminder && item.reminder !== "Aucun" ? ` · rappel ${escapeHTML(item.reminder.toLowerCase())}` : ""}</small></span>
    <span class="event-tag" style="--event:${category.color}">${category.short}</span>
    <span class="item-actions"><button class="edit-button" data-edit-item="${item.id}" type="button">Modifier</button><button class="delete-button" data-delete-item="${item.id}" type="button">Supprimer</button></span>
  </article>`).join("") : `<div class="empty-state"><strong>Aucun élément</strong>Utilisez le formulaire pour ajouter le premier.</div>`;
  $$("[data-toggle-item]", $("#categoryList")).forEach(button => button.addEventListener("click", () => toggleItem(button.dataset.toggleItem)));
  $$("[data-edit-item]", $("#categoryList")).forEach(button => button.addEventListener("click", () => fillItemForm(data.items.find(item => item.id === button.dataset.editItem))));
  $$("[data-delete-item]", $("#categoryList")).forEach(button => button.addEventListener("click", () => requestDeleteItem(button.dataset.deleteItem)));
}

function buildItemFields(category) {
  const main = category.fields.slice(0, 2);
  const extras = category.fields.slice(2);
  $("#mainFields").innerHTML = main.map(fieldHTML).join("");
  $("#extraFields").innerHTML = extras.map(fieldHTML).join("");
  $("#dateFields").innerHTML = [
    fieldHTML(["date", category === CATEGORIES.documents ? "Date limite" : category === CATEGORIES.supplies ? "Date nécessaire" : "Date", "date", true]),
    fieldHTML(["time", "Heure", "time", false]),
    `<label class="field full"><span>Rappel</span><select data-item-field="reminder">${data.refs.reminderOptions.map(option => `<option>${escapeHTML(option)}</option>`).join("")}</select></label>`
  ].join("");
  $("#moreFieldsPanel").hidden = !extras.length;
  const suggestions = category.subjectRef ? data.refs[category.subjectRef] : data.refs.suggestions;
  $("#suggestionBox").hidden = !suggestions?.length;
  $("#suggestions").innerHTML = (suggestions || []).slice(0, 8).map(value => `<button data-suggestion="${escapeHTML(value)}" type="button">${escapeHTML(value)}</button>`).join("");
  $$("[data-suggestion]", $("#suggestions")).forEach(button => button.addEventListener("click", () => {
    const first = $("[data-item-field]", $("#mainFields"));
    if (first) first.value = button.dataset.suggestion;
  }));
}

function fieldHTML(field) {
  const [key, label, type, required, placeholder, ref] = field;
  if (type === "checkbox") return `<label class="checkbox-field field full"><input data-item-field="${key}" type="checkbox"><span>${escapeHTML(label)}</span></label>`;
  const list = ref ? ` list="ref_${ref}"` : "";
  const requiredAttr = required ? " required" : "";
  if (type === "textarea") return `<label class="field full"><span>${escapeHTML(label)}${required ? " *" : ""}</span><textarea data-item-field="${key}" rows="3" placeholder="${escapeHTML(placeholder || "")}"${requiredAttr}></textarea></label>`;
  return `<label class="field ${key === "date" || key === "time" ? "" : required ? "full" : ""}"><span>${escapeHTML(label)}${required ? " *" : ""}</span><input data-item-field="${key}" type="${type}" placeholder="${escapeHTML(placeholder || "")}"${list}${requiredAttr}></label>`;
}

function resetItemForm() {
  $("#itemForm").reset();
  $("#editingItemId").value = "";
  $("#itemNote").value = "";
  $("#itemAttachment").value = "";
  $("#attachmentStatus").textContent = "Une image légère ou un PDF.";
  $("#deleteInFormButton").hidden = true;
  $("#saveItemButton").textContent = `Ajouter`;
  state.pendingAttachment = null;
  const dateField = $('[data-item-field="date"]');
  if (dateField) dateField.value = state.selectedDate || state.focusDate;
  const reminderField = $('[data-item-field="reminder"]');
  if (reminderField) reminderField.value = data.preferences.defaultReminder;
}

function fillItemForm(item) {
  if (!item) return;
  buildItemFields(CATEGORIES[item.category]);
  $("#editingItemId").value = item.id;
  $$("[data-item-field]", $("#itemForm")).forEach(input => {
    const value = ["date", "time", "reminder"].includes(input.dataset.itemField) ? item[input.dataset.itemField] : item.details?.[input.dataset.itemField];
    if (input.type === "checkbox") input.checked = Boolean(value);
    else input.value = value ?? "";
  });
  $("#itemNote").value = item.note || "";
  $("#deleteInFormButton").hidden = false;
  $("#saveItemButton").textContent = "Enregistrer les modifications";
  $("#attachmentStatus").textContent = item.attachment ? `Pièce jointe enregistrée : ${item.attachment.name}` : "Une image légère ou un PDF.";
  state.pendingAttachment = item.attachment || null;
  $("#itemForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

function collectItemForm() {
  const details = {};
  $$("[data-item-field]", $("#itemForm")).forEach(input => {
    if (!["date", "time", "reminder"].includes(input.dataset.itemField)) details[input.dataset.itemField] = input.type === "checkbox" ? input.checked : input.value.trim();
  });
  const date = $('[data-item-field="date"]').value;
  const time = $('[data-item-field="time"]').value;
  const reminder = $('[data-item-field="reminder"]').value;
  const config = CATEGORIES[state.category];
  return {
    childId: state.childId,
    category: state.category,
    title: details[config.titleField] || config.label,
    date,
    time,
    status: statusFromDetails(state.category, details),
    reminder,
    note: $("#itemNote").value.trim(),
    attachment: state.pendingAttachment,
    details
  };
}

function statusFromDetails(category, details) {
  if (category === "supplies" && details.purchased) return "done";
  if (category === "documents" && details.submitted) return "done";
  return "todo";
}

function syncDetailsFromStatus(item) {
  if (item.category === "supplies") item.details.purchased = isDone(item);
  if (item.category === "documents") item.details.submitted = isDone(item);
}

function saveItem(event) {
  event.preventDefault();
  if (!currentChild()) return;
  const values = collectItemForm();
  const id = $("#editingItemId").value;
  if (id) {
    const item = data.items.find(entry => entry.id === id);
    if (!["supplies", "documents"].includes(item.category)) values.status = item.status;
    Object.assign(item, values, { updatedAt: nowISO() });
    showToast("Élément modifié.");
  } else {
    data.items.push({ id: uid("item"), ...values, createdAt: nowISO(), updatedAt: nowISO() });
    showToast("Élément ajouté.");
  }
  saveData();
  renderCategory();
  resetItemForm();
}

function toggleItem(id) {
  const item = data.items.find(entry => entry.id === id);
  if (!item) return;
  item.status = isDone(item) ? "todo" : "done";
  item.updatedAt = nowISO();
  syncDetailsFromStatus(item);
  saveData();
  renderCategory();
  showToast(isDone(item) ? "Élément terminé." : "Élément réactivé.");
}

function requestDeleteItem(id) {
  const item = data.items.find(entry => entry.id === id);
  if (!item) return;
  askConfirm("Supprimer cet élément ?", `« ${itemTitle(item)} » sera supprimé définitivement.`, () => {
    data.items = data.items.filter(entry => entry.id !== id);
    saveData();
    renderCategory();
    resetItemForm();
    showToast("Élément supprimé.");
  });
}

function editItemFromAnywhere(id) {
  const item = data.items.find(entry => entry.id === id);
  if (!item) return;
  state.childId = item.childId;
  showView("child");
  openCategory(item.category, item.id);
}

function renderChildrenManagement() {
  const list = $("#childrenManagementList");
  list.innerHTML = data.children.length ? data.children.map(child => `<article class="management-card" style="--child:${child.color}">
    ${avatarHTML(child)}<span><strong>${escapeHTML(child.name)}</strong><small>${escapeHTML(child.className)} · ${escapeHTML(child.school)}</small></span><button data-manage-child="${child.id}" type="button">Modifier</button>
  </article>`).join("") : `<div class="empty-state"><strong>Aucun enfant</strong>Ajoutez le premier profil scolaire.</div>`;
  $$("[data-manage-child]", list).forEach(button => button.addEventListener("click", () => openChildDialog(button.dataset.manageChild)));
}

function openChildDialog(id = null) {
  $("#childForm").reset();
  state.pendingAvatar = null;
  const child = data.children.find(entry => entry.id === id);
  $("#childId").value = child?.id || "";
  $("#childDialogTitle").textContent = child ? "Modifier l’enfant" : "Ajouter un enfant";
  $("#deleteChildButton").hidden = !child;
  $("#childName").value = child?.name || "";
  $("#childClass").value = child?.className || "";
  $("#childSchool").value = child?.school || "";
  $("#childTeacher").value = child?.teacher || "";
  $("#childColor").value = child?.color || "#2457e6";
  state.pendingAvatar = child?.avatar || null;
  updateAvatarPreview();
  $("#childDialog").showModal();
}

function updateAvatarPreview() {
  const name = $("#childName").value;
  const color = $("#childColor").value;
  const preview = $("#avatarPreview");
  preview.style.setProperty("--child", color);
  preview.innerHTML = state.pendingAvatar ? `<img src="${state.pendingAvatar}" alt="">` : escapeHTML(initials(name));
}

function saveChild(event) {
  event.preventDefault();
  if (!$("#childForm").reportValidity()) return;
  const id = $("#childId").value;
  const values = {
    name: $("#childName").value.trim(),
    className: $("#childClass").value.trim(),
    school: $("#childSchool").value.trim(),
    teacher: $("#childTeacher").value.trim(),
    color: $("#childColor").value,
    avatar: state.pendingAvatar,
    updatedAt: nowISO()
  };
  if (id) Object.assign(data.children.find(child => child.id === id), values);
  else {
    const child = { id: uid("child"), ...values, createdAt: nowISO() };
    data.children.push(child);
    state.childId = child.id;
  }
  addRefValue("classes", values.className);
  addRefValue("schools", values.school);
  addRefValue("teachers", values.teacher);
  saveData();
  $("#childDialog").close();
  renderDatalists();
  showView(state.view === "home" ? "home" : "settings");
  showToast(id ? "Profil modifié." : "Enfant ajouté.");
}

function requestDeleteChild() {
  const id = $("#childId").value;
  const child = data.children.find(entry => entry.id === id);
  if (!child) return;
  askConfirm("Supprimer cet enfant ?", `Le profil de ${child.name} et tous ses éléments scolaires seront supprimés.`, () => {
    data.children = data.children.filter(entry => entry.id !== id);
    data.items = data.items.filter(item => item.childId !== id);
    state.childId = data.children[0]?.id || null;
    saveData();
    $("#childDialog").close();
    showView("settings");
    showToast("Profil supprimé.");
  });
}

function renderSettings() {
  const groups = [
    ["subjects", "Matières", "Une matière supprimée déplace les éléments concernés vers « Autres »."],
    ["documentTypes", "Types de documents", "Cantine, certificats, bulletins et démarches."],
    ["services", "Services administratifs", "Établissement, cantine, transport et administration."],
    ["classes", "Classes", "Suggestions disponibles dans les profils enfants."],
    ["schools", "Établissements", "Établissements déjà utilisés."],
    ["teachers", "Enseignants", "Enseignants et professeurs principaux."],
    ["frequencies", "Fréquences", "Valeurs disponibles pour préparer de futurs éléments récurrents."],
    ["reminderOptions", "Délais de rappel", "Choix proposés dans les formulaires."],
    ["suggestions", "Suggestions rapides", "Raccourcis disponibles pour certaines catégories."]
  ];
  $("#settingsContent").innerHTML = `
    <section class="panel settings-group">
      <h2>Rappel par défaut</h2><p class="settings-help">Appliqué à chaque nouvel élément.</p>
      <label class="field"><span>Délai</span><select id="defaultReminderSelect">${data.refs.reminderOptions.map(option => `<option ${option === data.preferences.defaultReminder ? "selected" : ""}>${escapeHTML(option)}</option>`).join("")}</select></label>
    </section>
    ${groups.map(([key, title, help]) => `<section class="panel settings-group"><h2>${title}</h2><p class="settings-help">${help}</p>
      <div class="reference-list">${data.refs[key].map(value => `<span class="reference-chip"><button data-rename-ref="${key}|${escapeHTML(value)}" type="button" aria-label="Renommer">✎</button>${escapeHTML(value)}${value === "Autres" ? "" : `<button data-remove-ref="${key}|${escapeHTML(value)}" type="button" aria-label="Supprimer">×</button>`}</span>`).join("")}</div>
      <form class="inline-form" data-add-ref="${key}"><input placeholder="Nouvelle valeur" aria-label="Nouvelle valeur"><button class="primary-small">Ajouter</button></form>
    </section>`).join("")}
    <section class="panel settings-group"><h2>Données et sauvegarde</h2><p class="settings-help">Exportez régulièrement une copie JSON de vos données.</p>
      <div class="settings-actions">
        <button class="primary-button" id="exportButton" type="button">Exporter JSON</button>
        <button class="secondary-button" id="importButton" type="button">Importer JSON</button>
        <button class="secondary-button" id="clearDoneButton" type="button">Supprimer les terminés</button>
        <button class="danger-button" id="resetChildButton" type="button">Réinitialiser l’enfant</button>
        <button class="danger-button" id="resetAllButton" type="button">Réinitialisation complète</button>
      </div>
    </section>`;
  $("#defaultReminderSelect").addEventListener("change", event => {
    data.preferences.defaultReminder = event.target.value;
    saveData();
    showToast("Rappel par défaut enregistré.");
  });
  $$("[data-add-ref]").forEach(form => form.addEventListener("submit", event => {
    event.preventDefault();
    const input = $("input", form);
    addRefValue(form.dataset.addRef, input.value.trim());
    saveData();
    renderSettings();
    renderDatalists();
  }));
  $$("[data-remove-ref]").forEach(button => button.addEventListener("click", () => {
    const [key, value] = button.dataset.removeRef.split("|");
    removeRefValue(key, value);
  }));
  $$("[data-rename-ref]").forEach(button => button.addEventListener("click", () => {
    const [key, value] = button.dataset.renameRef.split("|");
    renameRefValue(key, value);
  }));
  $("#exportButton").addEventListener("click", exportData);
  $("#importButton").addEventListener("click", () => $("#importInput").click());
  $("#clearDoneButton").addEventListener("click", clearCompleted);
  $("#resetChildButton").addEventListener("click", resetCurrentChild);
  $("#resetAllButton").addEventListener("click", resetAll);
}

function addRefValue(key, value) {
  if (!value || !data.refs[key] || data.refs[key].some(item => item.toLocaleLowerCase() === value.toLocaleLowerCase())) return;
  data.refs[key].push(value);
  data.refs[key].sort((a, b) => a.localeCompare(b, "fr"));
}

function renameRefValue(key, oldValue) {
  const next = prompt(`Renommer « ${oldValue} » :`, oldValue)?.trim();
  if (!next || next === oldValue) return;
  if (data.refs[key].includes(next)) return showToast("Cette valeur existe déjà.");
  data.refs[key] = data.refs[key].map(value => value === oldValue ? next : value);
  updateItemsForRef(key, oldValue, next);
  saveData();
  renderSettings();
  renderDatalists();
  showToast("Valeur renommée partout.");
}

function removeRefValue(key, value) {
  askConfirm("Supprimer cette valeur ?", `Les éléments qui utilisent « ${value} » seront déplacés vers « Autres » lorsque cela s’applique.`, () => {
    data.refs[key] = data.refs[key].filter(entry => entry !== value);
    updateItemsForRef(key, value, "Autres");
    saveData();
    renderSettings();
    renderDatalists();
    showToast("Valeur supprimée.");
  });
}

function updateItemsForRef(key, oldValue, nextValue) {
  const fieldByRef = { subjects: ["subject", "use"], documentTypes: ["documentType"], services: ["service"] };
  (fieldByRef[key] || []).forEach(field => data.items.forEach(item => {
    if (item.details?.[field] === oldValue) {
      item.details[field] = nextValue;
      if (CATEGORIES[item.category]?.titleField === field) item.title = nextValue;
      item.updatedAt = nowISO();
    }
  }));
  if (key === "classes") data.children.forEach(child => { if (child.className === oldValue) child.className = nextValue; });
  if (key === "schools") data.children.forEach(child => { if (child.school === oldValue) child.school = nextValue; });
  if (key === "teachers") data.children.forEach(child => { if (child.teacher === oldValue) child.teacher = nextValue; });
  if (key === "reminderOptions") data.items.forEach(item => { if (item.reminder === oldValue) item.reminder = nextValue; });
}

function exportData() {
  const blob = new Blob([JSON.stringify({ ...data, exportedAt: nowISO() }, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `ecole-sauvegarde-${toISODate(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Sauvegarde exportée.");
}

async function importData(file) {
  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported.children) || !Array.isArray(imported.items) || !imported.refs) throw new Error();
    askConfirm("Importer cette sauvegarde ?", "Les données actuelles seront remplacées par le contenu du fichier.", () => {
      data = {
        version: APP_VERSION,
        children: imported.children,
        items: imported.items,
        refs: { ...structuredClone(DEFAULT_REFS), ...imported.refs },
        preferences: { defaultReminder: "La veille", ...(imported.preferences || {}) }
      };
      state.childId = data.children[0]?.id || null;
      saveData();
      renderDatalists();
      showView("home");
      showToast("Sauvegarde importée.");
    });
  } catch {
    showToast("Fichier JSON invalide.");
  }
}

function clearCompleted() {
  const count = data.items.filter(isDone).length;
  if (!count) return showToast("Aucun élément terminé.");
  askConfirm("Supprimer les éléments terminés ?", `${count} élément${count > 1 ? "s" : ""} seront supprimés définitivement.`, () => {
    data.items = data.items.filter(item => !isDone(item));
    saveData();
    renderSettings();
    showToast("Éléments terminés supprimés.");
  });
}

function resetCurrentChild() {
  const child = currentChild();
  if (!child) return showToast("Aucun enfant sélectionné.");
  askConfirm("Réinitialiser cet enfant ?", `Tous les éléments scolaires de ${child.name} seront supprimés. Le profil sera conservé.`, () => {
    data.items = data.items.filter(item => item.childId !== child.id);
    saveData();
    showToast("Enfant réinitialisé.");
  });
}

function resetAll() {
  askConfirm("Réinitialisation complète ?", "Tous les enfants, éléments et réglages personnalisés seront supprimés.", () => {
    data = createDefaultData();
    state.childId = null;
    saveData();
    renderDatalists();
    showView("home");
    showToast("Application réinitialisée.");
  });
}

function askConfirm(title, message, action) {
  state.pendingConfirm = action;
  $("#confirmTitle").textContent = title;
  $("#confirmMessage").textContent = message;
  $("#confirmDialog").showModal();
}

function renderDatalists() {
  [["classesList", "classes"], ["schoolsList", "schools"], ["teachersList", "teachers"]].forEach(([id, key]) => {
    $(`#${id}`).innerHTML = data.refs[key].map(value => `<option value="${escapeHTML(value)}"></option>`).join("");
  });
  Object.keys(data.refs).forEach(key => {
    let list = $(`#ref_${key}`);
    if (!list) {
      list = document.createElement("datalist");
      list.id = `ref_${key}`;
      document.body.append(list);
    }
    list.innerHTML = data.refs[key].map(value => `<option value="${escapeHTML(value)}"></option>`).join("");
  });
}

function shiftPeriod(direction) {
  const focus = fromISO(state.focusDate);
  if (state.calendarView === "day") focus.setDate(focus.getDate() + direction);
  if (state.calendarView === "week" || state.calendarView === "gantt") focus.setDate(focus.getDate() + direction * 7);
  if (state.calendarView === "month") focus.setMonth(focus.getMonth() + direction);
  state.focusDate = toISODate(focus);
  state.selectedDate = null;
  renderAgenda();
}

function shiftFamilyPeriod(direction) {
  const focus = fromISO(state.familyFocusDate);
  if (state.familyCalendarView === "day") focus.setDate(focus.getDate() + direction);
  if (state.familyCalendarView === "week" || state.familyCalendarView === "gantt") focus.setDate(focus.getDate() + direction * 7);
  if (state.familyCalendarView === "month") focus.setMonth(focus.getMonth() + direction);
  state.familyFocusDate = toISODate(focus);
  state.familySelectedDate = null;
  renderFamilyAgenda();
}

function openQuickAdd() {
  $("#quickCategoryGrid").innerHTML = Object.entries(CATEGORIES).map(([key, category]) => `<button class="quick-category" style="--category:${category.color}" data-quick-category="${key}" value="cancel">${category.icon}<br>${category.label}</button>`).join("");
  $$("[data-quick-category]", $("#quickCategoryGrid")).forEach(button => button.addEventListener("click", () => {
    $("#quickAddDialog").close();
    openCategory(button.dataset.quickCategory);
  }));
  $("#quickAddDialog").showModal();
}

function setupMobileViewport() {
  document.addEventListener("dblclick", event => event.preventDefault(), { passive: false });
  document.addEventListener("gesturestart", event => event.preventDefault(), { passive: false });

  const updateViewport = () => {
    const viewport = window.visualViewport;
    const height = viewport?.height || window.innerHeight;
    document.documentElement.style.setProperty("--visual-height", `${height}px`);
    document.body.classList.toggle("keyboard-open", Boolean(viewport && window.innerHeight - viewport.height > 140));
  };
  window.visualViewport?.addEventListener("resize", updateViewport);
  window.visualViewport?.addEventListener("scroll", updateViewport);
  window.addEventListener("resize", updateViewport);
  updateViewport();

  document.addEventListener("focusin", event => {
    if (!event.target.matches("input, select, textarea")) return;
    setTimeout(() => event.target.scrollIntoView({ behavior: "smooth", block: "center" }), 180);
  });
}

function readSmallFile(file, callback) {
  if (!file) return;
  if (file.size > MAX_ATTACHMENT_SIZE) {
    showToast("Fichier trop volumineux (750 Ko maximum).");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => callback(reader.result);
  reader.readAsDataURL(file);
}

function bindEvents() {
  $("#brandButton").addEventListener("click", () => showView("home"));
  $("#topSettingsButton").addEventListener("click", () => showView("settings"));
  $("#addChildSettingsButton").addEventListener("click", () => openChildDialog());
  $("#backHomeButton").addEventListener("click", () => showView("home"));
  $("#backAgendaButton").addEventListener("click", () => {
    $("#categorySection").hidden = true;
    $("#agendaSection").hidden = false;
    $("#schoolCards").hidden = false;
    $("#agendaListSection").hidden = false;
    renderChild();
  });
  $("#agendaAddButton").addEventListener("click", openQuickAdd);
  $("#itemForm").addEventListener("submit", saveItem);
  $("#deleteInFormButton").addEventListener("click", () => requestDeleteItem($("#editingItemId").value));
  $("#childForm").addEventListener("submit", saveChild);
  $("#deleteChildButton").addEventListener("click", requestDeleteChild);
  $("#childName").addEventListener("input", updateAvatarPreview);
  $("#childColor").addEventListener("input", updateAvatarPreview);
  $("#childAvatar").addEventListener("change", event => readSmallFile(event.target.files[0], result => {
    state.pendingAvatar = result;
    updateAvatarPreview();
  }));
  $("#itemAttachment").addEventListener("change", event => {
    const file = event.target.files[0];
    readSmallFile(file, result => {
      state.pendingAttachment = { name: file.name, type: file.type, data: result };
      $("#attachmentStatus").textContent = `Prêt : ${file.name}`;
    });
  });
  $$("[data-calendar-view]").forEach(button => button.addEventListener("click", () => {
    state.calendarView = button.dataset.calendarView;
    state.selectedDate = null;
    renderAgenda();
  }));
  $("#previousPeriodButton").addEventListener("click", () => shiftPeriod(-1));
  $("#nextPeriodButton").addEventListener("click", () => shiftPeriod(1));
  $("#todayButton").addEventListener("click", () => {
    state.focusDate = toISODate(new Date());
    state.selectedDate = null;
    renderAgenda();
  });
  $$("[data-family-calendar-view]").forEach(button => button.addEventListener("click", () => {
    state.familyCalendarView = button.dataset.familyCalendarView;
    state.familySelectedDate = null;
    renderFamilyAgenda();
  }));
  $("#familyPreviousPeriodButton").addEventListener("click", () => shiftFamilyPeriod(-1));
  $("#familyNextPeriodButton").addEventListener("click", () => shiftFamilyPeriod(1));
  $("#familyTodayButton").addEventListener("click", () => {
    state.familyFocusDate = toISODate(new Date());
    state.familySelectedDate = null;
    renderFamilyAgenda();
  });
  $$("[data-nav]").forEach(button => button.addEventListener("click", () => {
    if (button.dataset.nav === "agenda") showAgenda();
    else showView(button.dataset.nav);
  }));
  $("#confirmDialog").addEventListener("close", () => {
    if ($("#confirmDialog").returnValue === "confirm" && state.pendingConfirm) state.pendingConfirm();
    state.pendingConfirm = null;
  });
  $("#importInput").addEventListener("change", event => {
    if (event.target.files[0]) importData(event.target.files[0]);
    event.target.value = "";
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
}

renderDatalists();
bindEvents();
setupMobileViewport();
showView("home");
registerServiceWorker();
