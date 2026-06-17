"use strict";

const STORAGE_KEY = "ecole-pwa-v1";
const APP_VERSION = 3;
const MAX_ATTACHMENT_SIZE = 750 * 1024;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const CATEGORIES = {
  homework: {
    label: "Devoirs", short: "Devoirs", icon: "✎", color: "#2457e6",
    eyebrow: "Le travail à faire", titleField: "work", subjectRef: "subjects", mainFields: ["work", "subject"],
    fields: [
      ["subject", "Matière", "text", false, "Ex. Mathématiques", "subjects"],
      ["work", "Travail demandé", "text", true, "Ex. exercices 4 et 5 page 82"],
      ["manual", "Manuel, page ou exercice", "text", false, "Ex. page 82, exercice 4"],
      ["estimatedTime", "Temps estimé", "text", false, "Ex. 30 minutes"]
    ]
  },
  tests: {
    label: "Contrôles et notes", short: "Contrôles", icon: "✓", color: "#f02f78",
    eyebrow: "Évaluations et résultats", titleField: "topic", subjectRef: "subjects", mainFields: ["topic", "subject"],
    fields: [
      ["subject", "Matière", "text", false, "Ex. Français", "subjects"],
      ["topic", "Sujet ou chapitre", "text", true, "Ex. dictée, chapitre 6"],
      ["revision", "Révisions", "textarea", false, "Points à revoir"],
      ["score", "Note obtenue", "text", false, "Ex. 15"],
      ["scale", "Barème", "text", false, "Ex. 20"],
      ["comment", "Commentaire", "textarea", false, "Appréciation ou observation"]
    ]
  },
  trips: {
    label: "Sorties scolaires", short: "Sorties", icon: "⌁", color: "#00a99d",
    eyebrow: "Activités hors de l’école", titleField: "name", mainFields: ["name", "location"],
    fields: [
      ["name", "Nom", "text", true, "Ex. visite du musée"],
      ["location", "Lieu", "text", false, "Adresse ou lieu"],
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
    eyebrow: "Matériel scolaire", titleField: "article", subjectRef: "subjects", mainFields: ["article", "use"],
    fields: [
      ["article", "Article", "text", true, "Ex. cahier 24 × 32"],
      ["use", "Matière ou usage", "text", false, "Ex. Arts plastiques", "subjects"],
      ["quantity", "Quantité à prévoir", "number", false, "1"],
      ["purchased", "Article acheté / déjà disponible", "checkbox", false],
      ["cost", "Coût", "text", false, "Ex. 4,50 €"],
      ["store", "Magasin ou note", "text", false, "Ex. papeterie"]
    ]
  },
  meetings: {
    label: "Rendez-vous école", short: "Rendez-vous", icon: "◇", color: "#009bd4",
    eyebrow: "Échanges avec l’école", titleField: "person", mainFields: ["person", "role"],
    fields: [
      ["person", "Personne rencontrée", "text", true, "Ex. Mme Martin"],
      ["role", "Rôle", "text", false, "Ex. enseignante"],
      ["reason", "Motif", "text", false, "Ex. bilan du trimestre"],
      ["location", "Lieu", "text", false, "Ex. salle 12"],
      ["questions", "Questions", "textarea", false, "Questions à poser"],
      ["report", "Compte rendu", "textarea", false, "Notes après le rendez-vous"]
    ]
  },
  documents: {
    label: "Documents scolaires", short: "Documents", icon: "▱", color: "#7b42d1",
    eyebrow: "École, administration et cantine", titleField: "documentType", mainFields: ["documentType", "service"],
    fields: [
      ["documentType", "Type de document", "text", true, "Ex. Cantine", "documentTypes"],
      ["service", "Service concerné", "text", false, "Ex. Administration", "services"],
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

const PRESET_AVATARS = [
  { label: "Fillette", src: "assets/avatars/afrique_fillette.webp" },
  { label: "Fillette", src: "assets/avatars/asie_petite_fillette.webp" },
  { label: "Fillette", src: "assets/avatars/europe_fillette.webp" },
  { label: "Ado fille", src: "assets/avatars/afrique_ado_fille.webp" },
  { label: "Ado fille", src: "assets/avatars/asie_ado_fille.webp" },
  { label: "Ado fille", src: "assets/avatars/europe_ado_fille.webp" },
  { label: "Ado garçon", src: "assets/avatars/afrique_ado_garcon.webp" },
  { label: "Ado garçon", src: "assets/avatars/asie_ado_garcon.webp" },
  { label: "Ado garçon", src: "assets/avatars/europe_ado_garcon.webp" }
];

let data = loadData();
let state = {
  view: "home",
  activeNav: "home",
  childId: data.children[0]?.id || null,
  category: "homework",
  calendarView: "gantt",
  filter: "all",
  focusDate: toISODate(new Date()),
  selectedDate: null,
  familyCalendarView: "gantt",
  familyFilter: "all",
  familyFocusDate: toISODate(new Date()),
  familySelectedDate: null,
  pendingConfirm: null,
  pendingAttachment: null,
  pendingAvatar: null,
  pendingAddDate: null,
  quickCategoryChosen: false
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

function isOverdue(item) {
  return !isDone(item) && Boolean(item.date) && item.date < toISODate(new Date());
}

function eventColor(item) {
  if (state.view === "home") {
    const child = data.children.find(entry => entry.id === item.childId);
    return child?.color || "#2457e6";
  }
  return CATEGORIES[item.category].color;
}

function refreshCurrentView() {
  if (state.view === "home") renderHome();
  else if (state.view === "child") renderChild();
  else if (state.view === "settings") {
    renderChildrenManagement();
    renderSettings();
  }
}

function timeShifts(dayItems) {
  const times = [...new Set(dayItems.filter(item => item.time).map(item => item.time))].sort();
  const shifts = {};
  dayItems.forEach(item => { shifts[item.id] = item.time ? Math.min(times.indexOf(item.time), 6) : 0; });
  return shifts;
}

function openModal(selector) {
  const dialog = $(selector);
  if (!dialog) return;
  if (dialog.open) dialog.close();
  dialog.showModal();
}

function startAddChild() {
  state.activeNav = "settings";
  showView("settings");
  openChildDialog();
}

function itemTitle(item) {
  const config = CATEGORIES[item.category];
  return item.title || item.details?.[config?.titleField] || config?.label || "Élément scolaire";
}

function itemDetails(item) {
  const details = item.details || {};
  if (item.category === "homework" || item.category === "tests") return details.subject || "";
  if (item.category === "trips" || item.category === "meetings") return details.location || details.reason || "";
  if (item.category === "supplies") return [details.use, details.quantity ? `QtÃ© ${details.quantity}` : "", details.purchased ? "achetÃ©" : "Ã  acheter"].filter(Boolean).join(" Â· ");
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

function syncLayoutClasses() {
  const childVisible = state.view === "child";
  document.body.classList.toggle("child-mode", childVisible);
  document.body.classList.toggle("task-form-mode", childVisible && !$("#categorySection").hidden);
}

function showView(view) {
  state.view = view;
  if (view === "home" || view === "settings") state.activeNav = view;
  if (view === "home") {
    state.familyCalendarView = "gantt";
    state.familySelectedDate = null;
  }
  $$(".view").forEach(section => section.hidden = section.id !== `${view}View`);
  syncLayoutClasses();
  $$("[data-nav]").forEach(button => button.classList.toggle("active", button.dataset.nav === state.activeNav));
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
    grid.innerHTML = `<button class="empty-state empty-action" id="homeAddChildButton" type="button" style="grid-column:1/-1"><strong>Bienvenue dans ÉCOLE</strong>Toucher pour ajouter un premier enfant.</button>`;
  } else {
    grid.innerHTML = data.children.map(child => {
      const upcoming = getUpcoming(child.id);
      const next = upcoming[0];
      const overdueCount = childItems(child.id).filter(isOverdue).length;
      const alert = getAlerts(child.id)[0];
      return `<button class="child-card" style="--child:${child.color}" data-open-child="${child.id}" type="button">
        ${avatarHTML(child)}
        <span class="child-info"><strong>${escapeHTML(child.name)}</strong><small>${escapeHTML(child.className)} · ${escapeHTML(child.school)}</small><span class="child-teacher">${escapeHTML(child.teacher || "Enseignant non renseigné")}</span></span>
        <span class="child-summary"><b>${upcoming.length}</b> élément${upcoming.length > 1 ? "s" : ""} à venir<span>${next ? `Prochain : ${escapeHTML(itemTitle(next))} · ${formatDate(next.date)}` : "Rien de prévu"}</span></span>
        ${overdueCount ? `<span class="child-overdue">⚠ ${overdueCount} en retard</span>` : ""}
        ${alert && !overdueCount ? `<span class="child-alert">${escapeHTML(getAlert(alert).text)} · ${escapeHTML(itemTitle(alert))}</span>` : ""}
        ${child.schoolPhone ? `<span class="child-school-phone">Tel. ecole : ${escapeHTML(child.schoolPhone)}</span>` : ""}
        <span class="enter-child-hint">Entrer dans son espace</span>
      </button>`;
    }).join("");
  }
  renderChildrenDots();
  $("#homeAddChildButton")?.addEventListener("click", startAddChild);
  $$("[data-open-child]", grid).forEach(button => button.addEventListener("click", () => openChild(button.dataset.openChild)));
  grid.onscroll = updateChildrenDots;
  renderFamilyAgenda();
}

function renderChildrenDots() {
  const dots = $("#childrenDots");
  dots.style.display = data.children.length > 1 ? "flex" : "none";
  dots.innerHTML = data.children.map((_, index) => `<span class="${index === 0 ? "active" : ""}"></span>`).join("");
}

function updateChildrenDots() {
  const grid = $("#childrenGrid");
  const card = $(".child-card", grid);
  if (!card) return;
  const index = Math.round(grid.scrollLeft / (card.offsetWidth + 14));
  $$("#childrenDots span").forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === index));
}

function openChild(id) {
  state.childId = id;
  state.filter = "all";
  showChildHome("top", "child");
}

function showChildHome(scrollTarget = "top", nav = "child") {
  state.activeNav = nav;
  state.calendarView = "gantt";
  state.selectedDate = null;
  $("#categorySection").hidden = true;
  $("#agendaSection").hidden = false;
  $("#schoolCards").hidden = true;
  $("#childCategoryZone").hidden = true;
  $("#agendaListSection").hidden = false;
  syncLayoutClasses();
  showView("child");
  const target = scrollTarget === "list" ? $("#agendaListSection") : scrollTarget === "agenda" ? $("#agendaSection") : $("#profileBanner");
  setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
}

function renderChild() {
  const child = currentChild();
  if (!child) {
    showView("home");
    return;
  }
  const upcoming = getUpcoming(child.id);
  $("#childView").style.setProperty("--accent", child.color || "#2457e6");
  $("#profileBanner").style.setProperty("--child", child.color);
  $("#profileBanner").innerHTML = `${avatarHTML(child)}<span><p class="eyebrow">Son espace scolaire</p><h2>${escapeHTML(child.name)}</h2><small>${escapeHTML(child.className)} · ${escapeHTML(child.school)}</small><small>${escapeHTML(child.teacher || "Enseignant non renseigné")}</small></span><span class="profile-count">${upcoming.length} à venir</span>`;
  $("#profileBanner").setAttribute("aria-label", `Ouvrir la carte de ${child.name}`);
  if (child.schoolPhone) $(".profile-count", $("#profileBanner")).previousElementSibling.insertAdjacentHTML("beforeend", `<small>Tel. ecole : ${escapeHTML(child.schoolPhone)}</small>`);
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
  $("#childCategoryZone").hidden = true;
  $("#agendaListSection").hidden = true;
  $("#categorySection").hidden = false;
  syncLayoutClasses();
  renderChild();
  if (itemId) fillItemForm(data.items.find(item => item.id === itemId));
  else resetItemForm();
  $("#categorySection").scrollIntoView({ behavior: "smooth", block: "start" });
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
    openItemSummary(button.dataset.ganttItem);
  }));
  $$("[data-toggle-item]", $("#calendar")).forEach(button => button.addEventListener("click", event => {
    event.stopPropagation();
    toggleItem(button.dataset.toggleItem);
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
    openItemSummary(button.dataset.familyGanttItem);
  }));
  $$("[data-toggle-item]", $("#familyCalendar")).forEach(button => button.addEventListener("click", event => {
    event.stopPropagation();
    toggleItem(button.dataset.toggleItem);
  }));
  $$("[data-family-add]", $("#familyCalendar")).forEach(button => button.addEventListener("click", addFromFamily));
  renderFamilyFilters();
  renderFamilyAgendaList(start, end);
}

function familyCalendarDayHTML(date, monthMode = false, activeMonth = null) {
  const iso = toISODate(date);
  const events = data.items.filter(item => item.date === iso);
  const selected = state.familySelectedDate === iso || (!state.familySelectedDate && iso === state.familyFocusDate);
  const outside = monthMode && date.getMonth() !== activeMonth;
  const dots = events.slice(0, 6).map(item => `<i style="--dot:${data.children.find(entry => entry.id === item.childId)?.color || "#2457e6"}"></i>`).join("");
  if (monthMode) return `<button class="month-day ${selected ? "selected" : ""} ${outside ? "outside" : ""}" data-family-calendar-date="${iso}" type="button">${date.getDate()}<span class="day-dots">${dots}</span></button>`;
  return `<button class="calendar-day ${selected ? "selected" : ""}" data-family-calendar-date="${iso}" type="button"><small>${formatDate(date, { weekday: "short" })}</small><strong>${date.getDate()}</strong><span class="day-dots">${dots}</span></button>`;
}

function renderFamilyGantt(start, end) {
  const items = data.items
    .filter(item => item.date && item.date >= toISODate(start) && item.date <= toISODate(end))
    .filter(item => state.familyFilter === "all" || item.category === state.familyFilter)
    .sort(sortItems);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const rows = days.map(date => {
    const iso = toISODate(date);
    const dayItems = items.filter(item => item.date === iso);
    const today = iso === toISODate(new Date());
    const content = dayItems.length ? (() => {
      const shifts = timeShifts(dayItems);
      return dayItems.map(item => {
        const category = CATEGORIES[item.category];
        const child = data.children.find(entry => entry.id === item.childId);
        return `<div class="gantt-task-row ${isDone(item) ? "done" : ""}" style="--event:${child?.color || category.color};--shift:${shifts[item.id]}">
          <button class="gantt-check" data-toggle-item="${item.id}" type="button" aria-label="${isDone(item) ? "Réactiver" : "Marquer comme fait"}">${isDone(item) ? "✓" : ""}</button>
          <button class="gantt-task ${isDone(item) ? "done" : ""} ${isOverdue(item) ? "urgent-event" : ""}" data-family-gantt-item="${item.id}" style="--event:${child?.color || category.color}" type="button">
            <span>${category.icon}</span><strong>${escapeHTML(itemTitle(item))}</strong><small>${escapeHTML(child?.name || "")} · ${category.short}${item.time ? ` · ${escapeHTML(item.time)}` : ""}</small>
          </button>
        </div>`;
      }).join("");
    })() : `<button class="gantt-empty-day gantt-empty-static" data-family-add data-family-add-date="${iso}" type="button">Aucune tâche<br><small>Toucher pour ajouter</small></button>`;
    return `<article class="gantt-day ${today ? "today" : ""}">
      <button class="gantt-day-head" data-family-calendar-date="${iso}" type="button">
        <span>${formatDate(date, { weekday: "short" })}</span><strong>${date.getDate()}</strong>
      </button>
      <div class="gantt-day-items">${content}</div>
    </article>`;
  }).join("");
  $("#familyCalendar").className = "calendar gantt-calendar";
  $("#familyCalendar").innerHTML = `<div class="gantt-board gantt-vertical">${rows}</div>`;
}

function renderFamilyFilters() {
  const filters = [["all", "Tous"], ...Object.entries(CATEGORIES).map(([key, category]) => [key, category.short])];
  $("#familyFilterRow").innerHTML = filters.map(([key, label]) => `<button class="${state.familyFilter === key ? "active" : ""}" data-family-filter="${key}" type="button">${label}</button>`).join("");
  $$("[data-family-filter]", $("#familyFilterRow")).forEach(button => button.addEventListener("click", () => {
    state.familyFilter = button.dataset.familyFilter;
    renderFamilyAgenda();
  }));
}

function eventItemHTML(item, secondaryName = "") {
  const category = CATEGORIES[item.category];
  const done = isDone(item);
  const overdue = isOverdue(item);
  const meta = [secondaryName, itemDetails(item), item.time || "", done ? "terminé" : (overdue ? "en retard" : "")].filter(Boolean).join(" · ");
  return `<div class="event-row ${done ? "done" : ""} ${overdue ? "overdue" : ""}" style="--event:${eventColor(item)}">
    <button class="event-check" data-toggle-item="${item.id}" type="button" aria-label="${done ? "Décocher" : "Marquer comme fait"}">${done ? "✓" : ""}</button>
    <button class="event ${done ? "done" : ""} ${overdue ? "urgent-event" : ""}" style="--event:${eventColor(item)}" data-open-item="${item.id}" type="button">
      <span class="event-date"><b>${fromISO(item.date).getDate()}</b><small>${formatDate(item.date, { month: "short" }).toUpperCase()}</small></span>
      <span class="event-body"><strong>${escapeHTML(itemTitle(item))}</strong><small>${escapeHTML(meta)}</small></span>
      <span class="event-tag">${category.short}</span>
    </button>
  </div>`;
}

function overdueItemHTML(item, secondaryName = "") {
  const category = CATEGORIES[item.category];
  const done = isDone(item);
  const meta = [secondaryName, itemDetails(item), item.time || ""].filter(Boolean).join(" · ");
  return `<div class="overdue-item ${done ? "done" : ""}" style="--event:${eventColor(item)}">
    <button class="event-check" data-toggle-item="${item.id}" type="button" aria-label="${done ? "Décocher" : "Marquer comme fait"}">${done ? "✓" : ""}</button>
    <button class="event urgent-event ${done ? "done" : ""}" style="--event:${eventColor(item)}" data-open-item="${item.id}" type="button">
      <span class="event-date"><b>${fromISO(item.date).getDate()}</b><small>${formatDate(item.date, { month: "short" }).toUpperCase()}</small></span>
      <span class="event-body"><strong>${escapeHTML(itemTitle(item))}</strong><small>${escapeHTML(meta || category.short)}</small></span>
      <span class="event-tag">${category.short}</span>
    </button>
    <button class="reschedule-button" data-reschedule-item="${item.id}" type="button">↻ Reporter</button>
  </div>`;
}

function detailItemHTML(item) {
  const category = CATEGORIES[state.category];
  const done = isDone(item);
  const overdue = isOverdue(item);
  return `<article class="detail-item ${done ? "done" : ""} ${overdue ? "overdue" : ""}">
    <button class="check-button" data-toggle-item="${item.id}" type="button" aria-label="${done ? "Décocher" : "Marquer comme fait"}">${done ? "✓" : ""}</button>
    <span><strong class="item-title">${escapeHTML(itemTitle(item))}</strong><small class="item-meta">${overdue ? "⚠ en retard · " : ""}${formatDate(item.date, { weekday: "short", day: "numeric", month: "long" })}${item.time ? ` · ${escapeHTML(item.time)}` : ""}${item.reminder && item.reminder !== "Aucun" ? ` · rappel ${escapeHTML(item.reminder.toLowerCase())}` : ""}</small></span>
    <span class="event-tag" style="--event:${category.color}">${category.short}</span>
    <span class="item-actions"><button class="edit-button" data-edit-item="${item.id}" type="button">Modifier</button><button class="delete-button" data-delete-item="${item.id}" type="button">Supprimer</button></span>
  </article>`;
}

function renderFamilyAgendaList(periodStart, periodEnd) {
  const startISO = toISODate(periodStart);
  const endISO = toISODate(periodEnd);
  const periodItems = data.items
    .filter(item => item.date && item.date >= startISO && item.date <= endISO)
    .filter(item => state.familyFilter === "all" || item.category === state.familyFilter)
    .filter(item => !isOverdue(item))
    .sort(sortItems);
  const overdueItems = data.items
    .filter(isOverdue)
    .filter(item => state.familyFilter === "all" || item.category === state.familyFilter)
    .sort(sortItems);
  $("#familyAgendaCount").textContent = `${periodItems.length} élément${periodItems.length > 1 ? "s" : ""}`;
  $("#familyListCount").textContent = `${periodItems.length} élément${periodItems.length > 1 ? "s" : ""}`;
  const overdueBlock = overdueItems.length ? `<div class="overdue-block">
    <div class="overdue-head">⚠ En retard <span>${overdueItems.length}</span></div>
    ${overdueItems.map(item => overdueItemHTML(item, data.children.find(entry => entry.id === item.childId)?.name || "")).join("")}
  </div>` : "";
  const periodBlock = periodItems.length ? periodItems.map(item => {
    const child = data.children.find(entry => entry.id === item.childId);
    return eventItemHTML(item, child?.name || "");
  }).join("") : (overdueItems.length ? "" : `<button class="empty-state empty-action" data-family-add type="button"><strong>Aucun élément</strong>Toucher pour ajouter une tâche.</button>`);
  $("#familyAgendaList").innerHTML = overdueBlock + periodBlock;
  $$("[data-open-item]", $("#familyAgendaList")).forEach(button => button.addEventListener("click", () => openItemSummary(button.dataset.openItem)));
  $$("[data-toggle-item]", $("#familyAgendaList")).forEach(button => button.addEventListener("click", () => toggleItem(button.dataset.toggleItem)));
  $$("[data-reschedule-item]", $("#familyAgendaList")).forEach(button => button.addEventListener("click", () => openReschedule(button.dataset.rescheduleItem)));
  $$("[data-family-add]", $("#familyAgendaList")).forEach(button => button.addEventListener("click", addFromFamily));
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
  const rows = days.map(date => {
    const iso = toISODate(date);
    const dayItems = items.filter(item => item.date === iso);
    const today = iso === toISODate(new Date());
    const content = dayItems.length ? (() => {
      const shifts = timeShifts(dayItems);
      return dayItems.map(item => {
        const category = CATEGORIES[item.category];
        return `<div class="gantt-task-row ${isDone(item) ? "done" : ""}" style="--event:${category.color};--shift:${shifts[item.id]}">
          <button class="gantt-check" data-toggle-item="${item.id}" type="button" aria-label="${isDone(item) ? "Réactiver" : "Marquer comme fait"}">${isDone(item) ? "✓" : ""}</button>
          <button class="gantt-task ${isDone(item) ? "done" : ""} ${isOverdue(item) ? "urgent-event" : ""}" data-gantt-item="${item.id}" style="--event:${category.color}" type="button">
            <span>${category.icon}</span><strong>${escapeHTML(itemTitle(item))}</strong><small>${category.short}${item.time ? ` · ${escapeHTML(item.time)}` : ""}</small>
          </button>
        </div>`;
      }).join("");
    })() : `<button class="gantt-empty-day" data-calendar-date="${iso}" type="button">Aucune tâche<br><small>Toucher pour ajouter</small></button>`;
    return `<article class="gantt-day ${today ? "today" : ""}">
      <button class="gantt-day-head" data-calendar-date="${iso}" type="button" aria-label="Ajouter le ${formatDate(date, { day: "numeric", month: "long" })}">
        <span>${formatDate(date, { weekday: "short" })}</span><strong>${date.getDate()}</strong>
      </button>
      <div class="gantt-day-items">${content}</div>
    </article>`;
  }).join("");
  $("#calendar").className = "calendar gantt-calendar";
  $("#calendar").innerHTML = `<div class="gantt-board gantt-vertical">${rows}</div>`;
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
  const startISO = toISODate(periodStart);
  const endISO = toISODate(periodEnd);
  const periodItems = childItems()
    .filter(item => item.date && item.date >= startISO && item.date <= endISO)
    .filter(item => state.filter === "all" || item.category === state.filter)
    .filter(item => !isOverdue(item))
    .sort(sortItems);
  const overdueItems = childItems()
    .filter(isOverdue)
    .filter(item => state.filter === "all" || item.category === state.filter)
    .sort(sortItems);
  $("#agendaCount").textContent = `${periodItems.length} élément${periodItems.length > 1 ? "s" : ""}`;
  const overdueBlock = overdueItems.length ? `<div class="overdue-block">
    <div class="overdue-head">⚠ En retard <span>${overdueItems.length}</span></div>
    ${overdueItems.map(overdueItemHTML).join("")}
  </div>` : "";
  const periodBlock = periodItems.length ? periodItems.map(item => eventItemHTML(item)).join("")
    : (overdueItems.length ? "" : `<button class="empty-state empty-action" id="emptyAgendaAction" type="button"><strong>Aucune tâche</strong>Toucher pour choisir une catégorie.</button>`);
  $("#agendaList").innerHTML = overdueBlock + periodBlock;
  $$("[data-open-item]", $("#agendaList")).forEach(button => button.addEventListener("click", () => openItemSummary(button.dataset.openItem)));
  $$("[data-toggle-item]", $("#agendaList")).forEach(button => button.addEventListener("click", () => toggleItem(button.dataset.toggleItem)));
  $$("[data-reschedule-item]", $("#agendaList")).forEach(button => button.addEventListener("click", () => openReschedule(button.dataset.rescheduleItem)));
  $("#emptyAgendaAction")?.addEventListener("click", openQuickAdd);
}

function openItemSummary(id) {
  const item = data.items.find(entry => entry.id === id);
  if (!item) return;
  const child = data.children.find(entry => entry.id === item.childId);
  const category = CATEGORIES[item.category];
  const alert = getAlert(item);
  const detailRows = summaryRows(item);
  $("#itemSummaryDialog").dataset.itemId = item.id;
  $("#summaryEyebrow").textContent = category.label;
  $("#summaryTitle").textContent = itemTitle(item);
  $("#summaryMain").style.setProperty("--summary", category.color);
  $("#summaryMain").innerHTML = `
    <span class="summary-icon">${category.icon}</span>
    <div>
      <strong>${escapeHTML(child?.name || "")}</strong>
      <small>${formatDate(item.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}${item.time ? ` Â· ${escapeHTML(item.time)}` : ""}</small>
      <small>${escapeHTML(item.reminder || "Aucun rappel")}${alert ? ` Â· ${escapeHTML(alert.text)}` : ""}</small>
    </div>
    <span class="event-tag" style="--event:${category.color}">${category.short}</span>
  `;
  $("#summaryDetails").innerHTML = detailRows.length ? detailRows.map(([label, value]) => `
    <div class="summary-row"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>
  `).join("") : `<div class="empty-state"><strong>Aucun dÃ©tail</strong>Seules les informations essentielles sont renseignÃ©es.</div>`;
  openModal("#itemSummaryDialog");
}

function summaryRows(item) {
  const details = item.details || {};
  const config = CATEGORIES[item.category];
  const rows = [];
  rows.push(["Statut", isDone(item) ? "Terminé" : "À faire"]);
  config.fields.forEach(([key, label, type]) => {
    const value = details[key];
    if (type === "checkbox") rows.push([label, value ? "Oui" : "Non"]);
    else if (value) rows.push([label, String(value)]);
  });
  if (item.note) rows.push(["Note", item.note]);
  if (item.attachment?.name) rows.push(["Pièce jointe", item.attachment.name]);
  return rows;
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
  const active = items.filter(item => !isDone(item));
  const done = items.filter(isDone);
  const activeBlock = active.length ? active.map(detailItemHTML).join("")
    : (done.length ? "" : `<div class="empty-state"><strong>Aucun élément</strong>Utilisez le formulaire pour ajouter le premier.</div>`);
  const doneBlock = done.length ? `<details class="done-group">
    <summary>Terminé <span>${done.length}</span></summary>
    <div class="detail-list done-list">${done.map(detailItemHTML).join("")}</div>
  </details>` : "";
  $("#categoryList").innerHTML = activeBlock + doneBlock;
  $$("[data-toggle-item]", $("#categoryList")).forEach(button => button.addEventListener("click", () => toggleItem(button.dataset.toggleItem)));
  $$("[data-edit-item]", $("#categoryList")).forEach(button => button.addEventListener("click", () => fillItemForm(data.items.find(item => item.id === button.dataset.editItem))));
  $$("[data-delete-item]", $("#categoryList")).forEach(button => button.addEventListener("click", () => requestDeleteItem(button.dataset.deleteItem)));
}

function buildItemFields(category) {
  const orderedMainKeys = [...(category.mainFields || [])];
  category.fields.filter(field => field[3]).forEach(field => {
    if (!orderedMainKeys.includes(field[0])) orderedMainKeys.push(field[0]);
  });
  const visibleKeys = new Set(orderedMainKeys);
  const main = orderedMainKeys.map(key => category.fields.find(field => field[0] === key)).filter(Boolean);
  const extras = category.fields.filter(field => !visibleKeys.has(field[0]));
  $("#mainFields").innerHTML = main.map(fieldHTML).join("");
  $("#extraFields").innerHTML = extras.map(fieldHTML).join("");
  $("#dateFields").innerHTML = [
    fieldHTML(["date", category === CATEGORIES.documents ? "Date limite" : category === CATEGORIES.supplies ? "Date nécessaire" : "Date", "date", true]),
    fieldHTML(["time", "Heure", "time", false]),
    `<fieldset class="button-choice-field field full"><legend>Rappel</legend><input data-item-field="reminder" type="hidden"><div class="choice-buttons reminder-choice-buttons">${data.refs.reminderOptions.map(option => `<button data-reminder-choice="${escapeHTML(option)}" type="button">${escapeHTML(option)}</button>`).join("")}</div></fieldset>`
  ].join("");
  $("#moreFieldsPanel").hidden = !extras.length;
  const noSuggestions = ["meetings", "trips", "documents"];
  const suggestions = noSuggestions.includes(state.category) ? [] : category.subjectRef ? data.refs[category.subjectRef] : data.refs.suggestions;
  const targetKey = state.category === "supplies" ? "use" : category.subjectRef ? "subject" : main[0]?.[0];
  const targetInput = $(`[data-item-field="${targetKey}"]`, $("#itemForm"));
  if (suggestions && suggestions.length && targetInput) {
    const box = document.createElement("div");
    box.className = "suggestion-inline";
    box.innerHTML = `<div class="suggestions">${suggestions.slice(0, 8).map(value => `<button data-suggestion="${escapeHTML(value)}" type="button">${escapeHTML(value)}</button>`).join("")}</div><small class="suggestion-hint">Touchez une suggestion, ou saisissez votre propre valeur — elle sera mémorisée.</small>`;
    targetInput.closest(".field").after(box);
    $$("[data-suggestion]", box).forEach(button => button.addEventListener("click", () => { targetInput.value = button.dataset.suggestion; }));
  }
  $$("[data-reminder-choice]", $("#dateFields")).forEach(button => button.addEventListener("click", () => setReminderChoice(button.dataset.reminderChoice)));
}

function setReminderChoice(value) {
  const input = $('[data-item-field="reminder"]');
  if (input) input.value = value;
  $$("[data-reminder-choice]", $("#dateFields")).forEach(button => button.classList.toggle("active", button.dataset.reminderChoice === value));
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
  $(".form-actions", $("#itemForm")).classList.remove("editing");
  $("#saveItemButton").textContent = "Enregistrer";
  state.pendingAttachment = null;
  const dateField = $('[data-item-field="date"]');
  if (dateField) dateField.value = state.selectedDate || state.focusDate;
  const reminderField = $('[data-item-field="reminder"]');
  if (reminderField) setReminderChoice(data.preferences.defaultReminder);
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
  setReminderChoice(item.reminder || data.preferences.defaultReminder);
  $("#itemNote").value = item.note || "";
  $("#deleteInFormButton").hidden = false;
  $(".form-actions", $("#itemForm")).classList.add("editing");
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
  if (!$("#itemForm").reportValidity()) return;
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
  CATEGORIES[values.category].fields.forEach(field => {
    if (field[5] && values.details[field[0]]) addRefValue(field[5], values.details[field[0]]);
  });
  if (!saveData()) return;
  renderDatalists();
  state.focusDate = values.date || state.focusDate;
  state.selectedDate = null;
  state.filter = "all";
  resetItemForm();
  if (guide.active && guide.awaiting === "item") { guide.awaiting = null; guide.show(); return; }
  showChildHome("list");
}

function cancelItemForm() {
  resetItemForm();
  showChildHome("agenda");
  if (guide.active && guide.awaiting === "item") {
    guide.awaiting = null;
    guide.next();
  }
}

function toggleItem(id) {
  const item = data.items.find(entry => entry.id === id);
  if (!item) return;
  item.status = isDone(item) ? "todo" : "done";
  item.updatedAt = nowISO();
  syncDetailsFromStatus(item);
  saveData();
  refreshCurrentView();
  showToast(isDone(item) ? "Élément terminé." : "Élément réactivé.");
}

function openReschedule(id) {
  const item = data.items.find(entry => entry.id === id);
  if (!item) return;
  $("#rescheduleDialog").dataset.itemId = id;
  $("#rescheduleMessage").textContent = `« ${itemTitle(item)} » est en retard. Choisissez une nouvelle date.`;
  $("#rescheduleDate").value = toISODate(new Date());
  openModal("#rescheduleDialog");
}

function applyReschedule(date) {
  const id = $("#rescheduleDialog").dataset.itemId;
  const item = data.items.find(entry => entry.id === id);
  if (!item || !date) return;
  item.date = date;
  item.updatedAt = nowISO();
  saveData();
  $("#rescheduleDialog").close();
  refreshCurrentView();
  showToast("Tâche reportée.");
}

function requestDeleteItemFromSummary() {
  const id = $("#itemSummaryDialog").dataset.itemId;
  const item = data.items.find(entry => entry.id === id);
  if (!item) return;
  closeItemSummary();
  askConfirm("Supprimer cette tâche ?", `« ${itemTitle(item)} » sera supprimée définitivement.`, () => {
    data.items = data.items.filter(entry => entry.id !== id);
    saveData();
    refreshCurrentView();
    showToast("Tâche supprimée.");
  });
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

function closeItemSummary() {
  $("#itemSummaryDialog").close("cancel");
}

function openChildSummary() {
  const child = currentChild();
  if (!child) return;
  $("#childSummaryTitle").textContent = child.name;
  $("#childSummaryMain").style.setProperty("--summary", child.color || "#2457e6");
  $("#childSummaryMain").innerHTML = `
    ${avatarHTML(child, "avatar summary-avatar")}
    <div>
      <strong>${escapeHTML(child.name)}</strong>
      <small>${escapeHTML(child.className)} · ${escapeHTML(child.school)}</small>
      <small>${escapeHTML(child.teacher || "Enseignant non renseigné")}</small>
    </div>
    <span class="profile-count">${getUpcoming(child.id).length} à venir</span>
  `;
  $("#childSummaryDetails").innerHTML = [
    ["Classe", child.className],
    ["Établissement", child.school],
    ["Téléphone école", child.schoolPhone || "Non renseigné"],
    ["Enseignant", child.teacher || "Non renseigné"]
  ].map(([label, value]) => `<div class="summary-row"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`).join("");
  openModal("#childSummaryDialog");
}

function closeChildSummary() {
  $("#childSummaryDialog").close("cancel");
}

function editCurrentChildFromSummary() {
  const child = currentChild();
  if (!child) return;
  closeChildSummary();
  state.activeNav = "settings";
  showView("settings");
  openChildDialog(child.id);
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
  $("#childSchoolPhone").value = child?.schoolPhone || "";
  $("#childTeacher").value = child?.teacher || "";
  $("#childColor").value = child?.color || "#2457e6";
  state.pendingAvatar = child?.avatar || null;
  renderChildClassChoices();
  renderPresetAvatars();
  updateAvatarPreview();
  openModal("#childDialog");
}

function renderPresetAvatars() {
  $("#presetAvatarGrid").innerHTML = PRESET_AVATARS.map(avatar => `
    <button class="preset-avatar ${state.pendingAvatar === avatar.src ? "active" : ""}" data-preset-avatar="${avatar.src}" type="button" aria-label="${escapeHTML(avatar.label)}" title="${escapeHTML(avatar.label)}">
      <img src="${avatar.src}" alt="${escapeHTML(avatar.label)}">
    </button>
  `).join("");
  $$("[data-preset-avatar]", $("#presetAvatarGrid")).forEach(button => button.addEventListener("click", () => {
    state.pendingAvatar = button.dataset.presetAvatar;
    $("#childAvatar").value = "";
    renderPresetAvatars();
    updateAvatarPreview();
  }));
}

function renderChildClassChoices() {
  const selected = $("#childClass").value;
  $("#childClassChoices").innerHTML = data.refs.classes.map(value => `<button class="${value === selected ? "active" : ""}" data-child-class-choice="${escapeHTML(value)}" type="button">${escapeHTML(value)}</button>`).join("");
  $$("[data-child-class-choice]", $("#childClassChoices")).forEach(button => button.addEventListener("click", () => {
    $("#childClass").value = button.dataset.childClassChoice;
    renderChildClassChoices();
  }));
}

function closeChildDialog() {
  $("#childForm").reset();
  state.pendingAvatar = null;
  $("#childDialog").close("cancel");
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
  const isFirstChild = !id && data.children.length === 0;
  const values = {
    name: $("#childName").value.trim(),
    className: $("#childClass").value.trim(),
    school: $("#childSchool").value.trim(),
    schoolPhone: $("#childSchoolPhone").value.trim(),
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
  const guideChild = guide.active && guide.awaiting === "child";
  if (guideChild) guide.awaiting = null;
  $("#childDialog").close();
  renderDatalists();
  if (guideChild) { showToast("Enfant ajouté."); guide.next(); return; }
  showView(isFirstChild || state.view === "home" ? "home" : "settings");
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
      <div class="choice-buttons settings-reminder-buttons">${data.refs.reminderOptions.map(option => `<button class="${option === data.preferences.defaultReminder ? "active" : ""}" data-default-reminder="${escapeHTML(option)}" type="button">${escapeHTML(option)}</button>`).join("")}</div>
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
        <button class="secondary-button" id="guideReplayButton" type="button">Revoir le guide</button>
        <button class="danger-button" id="clearAllItemsButton" type="button">Supprimer toutes les tâches</button>
        <button class="danger-button" id="resetChildButton" type="button">Réinitialiser l’enfant</button>
        <button class="danger-button" id="resetAllButton" type="button">Réinitialisation complète</button>
      </div>
    </section>`;
  $$("[data-default-reminder]").forEach(button => button.addEventListener("click", () => {
    data.preferences.defaultReminder = button.dataset.defaultReminder;
    saveData();
    renderSettings();
    showToast("Rappel par défaut enregistré.");
  }));
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
  $("#guideReplayButton").addEventListener("click", () => guide.start(true));
  $("#clearAllItemsButton").addEventListener("click", clearAllItems);
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

function clearAllItems() {
  const count = data.items.length;
  if (!count) return showToast("Aucune tâche à supprimer.");
  askConfirm("Supprimer toutes les tâches ?", `${count} tâche${count > 1 ? "s" : ""} de tous les enfants seront supprimées définitivement. Les profils seront conservés.`, () => {
    data.items = [];
    saveData();
    state.selectedDate = null;
    state.familySelectedDate = null;
    renderSettings();
    showToast("Toutes les tâches ont été supprimées.");
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
  openModal("#confirmDialog");
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
  state.quickCategoryChosen = false;
  $("#quickCategoryGrid").innerHTML = Object.entries(CATEGORIES).map(([key, category]) => `<button class="quick-category" type="button" style="--category:${category.color}" data-quick-category="${key}">${category.icon}<br>${category.label}</button>`).join("");
  $$("[data-quick-category]", $("#quickCategoryGrid")).forEach(button => button.addEventListener("click", () => {
    const category = button.dataset.quickCategory;
    state.quickCategoryChosen = true;
    $("#quickAddDialog").close();
    requestAnimationFrame(() => openCategory(category));
  }));
  openModal("#quickAddDialog");
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
    if (event.target.matches('input[type="date"], input[type="time"]')) return;
    if (!document.body.classList.contains("keyboard-open")) return;
    setTimeout(() => event.target.scrollIntoView({ behavior: "auto", block: "nearest" }), 220);
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

function openChildPicker() {
  $("#childPickerGrid").innerHTML = data.children.map(child => `<button class="child-pick" type="button" data-pick-child="${child.id}" style="--child:${child.color}">${avatarHTML(child)}<span>${escapeHTML(child.name)}</span></button>`).join("");
  $$("[data-pick-child]", $("#childPickerGrid")).forEach(button => button.addEventListener("click", () => {
    const id = button.dataset.pickChild;
    $("#childPickerDialog").close();
    requestAnimationFrame(() => {
      state.childId = id;
      state.focusDate = state.pendingAddDate || state.focusDate;
      state.selectedDate = state.pendingAddDate || state.focusDate;
      showChildHome("agenda", "child");
      state.selectedDate = state.pendingAddDate || state.focusDate;
      openQuickAdd();
    });
  }));
  openModal("#childPickerDialog");
}

function addFromFamily(event) {
  if (!data.children.length) { startAddChild(); return; }
  state.pendingAddDate = event?.currentTarget?.dataset.familyAddDate || state.familySelectedDate || state.familyFocusDate;
  if (data.children.length === 1) {
    state.childId = data.children[0].id;
    state.focusDate = state.pendingAddDate || state.focusDate;
    state.selectedDate = state.pendingAddDate || state.focusDate;
    showChildHome("agenda", "child");
    state.selectedDate = state.pendingAddDate || state.focusDate;
    openQuickAdd();
    return;
  }
  openChildPicker();
}

function openGuideTaskChoice() {
  guide.awaiting = "item";
  $("#guideOverlay").hidden = true;
  if (!state.childId) state.childId = data.children[0]?.id || null;
  if (!state.childId) { guide.next(); return; }
  showChildHome("agenda", "child");
  requestAnimationFrame(openQuickAdd);
}

const GUIDE_STEPS = [
  { kind: "panel", title: "Bienvenue dans ÉCOLE", text: "On prépare l’appli ensemble en une minute : un enfant, une première action, puis l’accueil famille et l’espace enfant.", next: "Créer le premier enfant" },
  { kind: "child" },
  { kind: "spot", prep: () => showView("home"), target: "#childrenGrid", title: "Accueil familial", text: "Ici, chaque grande carte représente un enfant. Touchez une carte pour entrer dans son espace." },
  { kind: "spot", prep: () => showChildHome("agenda", "child"), target: "#agendaSection", title: "L’agenda de l’enfant", text: "La semaine apparaît en Gantt vertical. Les tâches se voient dans le calendrier puis dans la liste dessous." },
  { kind: "spot", target: "#agendaAddButton", title: "Ajouter une première tâche", text: "On choisit d’abord le hub : devoir, contrôle, sortie, fourniture, rendez-vous ou document.", next: "Choisir la catégorie", action: openGuideTaskChoice },
  { kind: "spot", prep: () => showChildHome("list", "child"), target: "#agendaListSection", title: "Tâche enregistrée", text: "Après l’enregistrement, la tâche revient ici dans le Gantt et dans la liste. Vous pouvez la cocher quand elle est faite." },
  { kind: "spot", prep: () => showView("home"), target: "#familyAgendaSection", title: "L’agenda de la famille", text: "Sur l’accueil, l’agenda regroupe tous les enfants et colore les tâches par enfant." },
  { kind: "panel", title: "C’est prêt !", text: "Tout est en place. Vous pourrez revoir ce guide à tout moment depuis les Réglages.", next: "Terminer" }
];

const guide = {
  active: false, review: false, i: 0, awaiting: null, steps: [],
  start(review = false) {
    this.review = review;
    this.steps = review ? GUIDE_STEPS.filter(step => step.kind !== "child" && !step.action) : GUIDE_STEPS;
    if (review && !state.childId) state.childId = data.children[0]?.id || null;
    this.active = true;
    this.i = 0;
    this.awaiting = null;
    showView("home");
    this.show();
  },
  show() {
    const step = this.steps[this.i];
    if (!step) return this.finish();
    if (step.kind === "child") { this.awaiting = "child"; $("#guideOverlay").hidden = true; openChildDialog(); return; }
    if (step.kind === "item") {
      this.awaiting = "item";
      $("#guideOverlay").hidden = true;
      if (!state.childId) state.childId = data.children[0]?.id || null;
      if (!state.childId) { this.next(); return; }
      state.category = "homework";
      showView("child");
      openCategory("homework");
      return;
    }
    this.awaiting = null;
    if (step.prep) step.prep();
    this.renderStep(step);
  },
  renderStep(step) {
    const overlay = $("#guideOverlay");
    const spot = $("#guideSpot");
    const bubble = $("#guideBubble");
    $("#guideProgress").textContent = `Étape ${this.i + 1} / ${this.steps.length}`;
    $("#guideTitle").textContent = step.title;
    $("#guideText").textContent = step.text;
    $("#guideNext").textContent = step.next || (this.i === this.steps.length - 1 ? "Terminer" : "Suivant");
    overlay.hidden = false;
    const el = step.target ? $(step.target) : null;
    if (step.kind === "spot" && el) {
      overlay.classList.remove("dim");
      el.scrollIntoView({ behavior: "auto", block: "center" });
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        spot.hidden = false;
        spot.style.left = `${Math.max(4, r.left - 6)}px`;
        spot.style.top = `${Math.max(4, r.top - 6)}px`;
        spot.style.width = `${r.width + 12}px`;
        spot.style.height = `${r.height + 12}px`;
        bubble.classList.add("anchored");
        const roomBelow = window.innerHeight - r.bottom;
        bubble.style.top = roomBelow > 230 ? `${r.bottom + 16}px` : `${Math.max(12, r.top - 16 - bubble.offsetHeight)}px`;
      });
    } else {
      overlay.classList.add("dim");
      spot.hidden = true;
      bubble.classList.remove("anchored");
      bubble.style.top = "";
    }
  },
  next() {
    const step = this.steps[this.i];
    if (step?.action) {
      this.i++;
      step.action();
      return;
    }
    this.i++;
    if (this.i >= this.steps.length) return this.finish();
    this.show();
  },
  skip() { this.finish(); },
  end(targetView) {
    this.active = false;
    this.awaiting = null;
    $("#guideOverlay").hidden = true;
    $("#guideSpot").hidden = true;
    data.preferences.guideSeen = true;
    saveData();
    showView(targetView);
  },
  finish() { this.end("home"); },
  stop() { this.end(data.children.length ? "home" : "settings"); }
};

function bindEvents() {
  $("#brandButton").addEventListener("click", () => showView("home"));
  $("#topSettingsButton").addEventListener("click", () => showView("settings"));
  $("#addChildSettingsButton").addEventListener("click", () => openChildDialog());
  $("#backHomeButton").addEventListener("click", () => showView("home"));
  $("#profileBanner").addEventListener("click", openChildSummary);
  $("#backAgendaButton").addEventListener("click", cancelItemForm);
  $("#agendaAddButton").addEventListener("click", openQuickAdd);
  $("#itemForm").addEventListener("submit", saveItem);
  $("#cancelItemButton").addEventListener("click", cancelItemForm);
  $("#deleteInFormButton").addEventListener("click", () => requestDeleteItem($("#editingItemId").value));
  $("#summaryBackButton").addEventListener("click", closeItemSummary);
  $("#summaryCloseButton").addEventListener("click", closeItemSummary);
  $("#summaryEditButton").addEventListener("click", () => {
    const id = $("#itemSummaryDialog").dataset.itemId;
    closeItemSummary();
    editItemFromAnywhere(id);
  });
  $("#summaryDeleteButton").addEventListener("click", requestDeleteItemFromSummary);
  $("#fabAddButton").addEventListener("click", openQuickAdd);
  $("#rescheduleCancel").addEventListener("click", () => $("#rescheduleDialog").close("cancel"));
  $("#rescheduleConfirm").addEventListener("click", () => applyReschedule($("#rescheduleDate").value));
  $$("[data-reschedule]", $("#rescheduleDialog")).forEach(button => button.addEventListener("click", () => {
    const today = new Date();
    applyReschedule(toISODate(button.dataset.reschedule === "tomorrow" ? addDays(today, 1) : today));
  }));
  $("#childSummaryBackButton").addEventListener("click", closeChildSummary);
  $("#childSummaryCloseButton").addEventListener("click", closeChildSummary);
  $("#childSummaryEditButton").addEventListener("click", editCurrentChildFromSummary);
  $("#childForm").addEventListener("submit", saveChild);
  $("#childDialog").addEventListener("close", () => { if (guide.active && guide.awaiting === "child") guide.stop(); });
  $("#quickAddDialog").addEventListener("close", () => {
    if (guide.active && guide.awaiting === "item" && !state.quickCategoryChosen) {
      guide.awaiting = null;
      showChildHome("agenda");
      guide.next();
    }
  });
  $("#guideNext").addEventListener("click", () => guide.next());
  $("#guideSkip").addEventListener("click", () => guide.skip());
  $("#cancelChildButton").addEventListener("click", closeChildDialog);
  $("#cancelChildFormButton").addEventListener("click", closeChildDialog);
  $("#deleteChildButton").addEventListener("click", requestDeleteChild);
  $("#childName").addEventListener("input", updateAvatarPreview);
  $("#childClass").addEventListener("input", renderChildClassChoices);
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
    if (button.dataset.nav === "child") showChildHome("top", "child");
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
if (!data.preferences.guideSeen && !data.children.length) {
  guide.start();
} else if (data.children.length) {
  showView("home");
} else {
  startAddChild();
}
registerServiceWorker();
