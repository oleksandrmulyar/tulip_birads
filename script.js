const MAX_LESIONS = 20;
const CENTER = 150;
const OUTER_R = 120;
const INNER_R = 40;
const NIPPLE_R = 15;
const SIDES = ["right", "left"];
const SIDE_LABEL = { right: "Right", left: "Left" };

const FIELD_KEYS = ["tissue-structure", "bitype", "bpe", "parenchyma", "ducts", "skin", "nodes", "muscles"];

const BIRADS_OPTIONS = [
  { score: 1, label: "BI-RADS 1 — патології не виявлено" },
  { score: 2, label: "BI-RADS 2 — доброякісні зміни" },
  { score: 3, label: "BI-RADS 3 — ймовірно доброякісне" },
  { score: 4, label: "BI-RADS 4 — підозріле" },
  { score: 5, label: "BI-RADS 5 — висока ймовірність злоякісності" },
  { score: 6, label: "BI-RADS 6 — верифікований рак" },
];

const OPTIONS = {
  "tissue-structure": [
    "представлена переважно жировою тканиною",
    "представлена переважно фіброзною тканиною",
    "представлена фіброгландулярною тканиною",
    "представлена гетерогенною фіброгландулярною тканиною",
    "представлена переважно фіброзно-кістозно зміненою тканиною",
  ],
  bitype: [
    "Тип a — майже повністю жирова",
    "Тип b — розсіяна фіброгландулярна тканина",
    "Тип c — гетерогенно-щільна / з переважанням фіброзної тканини",
    "Тип d — виражено щільна",
  ],
  bpe: ["мінімальне", "слабке (mild)", "помірне (moderate)", "виражене (marked)"],
  parenchyma: [
    "однорідна, без патологічного накопичення контрасту",
    "неоднорідна без вогнищевого патологічного підсилення",
    "неоднорідної структури за рахунок фіброзних змін",
    "неоднорідної структури за рахунок множинних кістозних включень",
    "дифузне / регіонарне non-mass enhancement",
    "з ділянками патологічного накопичення контрасту",
  ],
  ducts: [
    "не розширені",
    "незначно розширені у ретроареолярних ділянках",
    "розширені, з однорідним вмістом",
    "розширені, з підозрою на патологічний вміст",
    "внутрішньопротокове підсилення (підозріле)",
  ],
  skin: [
    "не потовщені, без ознак інфільтрації",
    "незначне потовщення шкіри",
    "потовщення та підсилення шкіри",
    "ознаки інфільтрації підшкірної клітковини",
  ],
  nodes: [
    "не збільшені, збережена структура",
    "до 10 мм, збережена кортико-медулярна диференціація",
    "збільшені, потовщення кортикального шару",
    "без жирового синуса",
    "з патологічним накопиченням контрасту",
  ],
  muscles: ["без особливостей", "без ознак інфільтрації", "з ознаками інвазії"],
  lesionKind: ["focus", "mass", "non-mass enhancement"],
  massShape: ["округла", "овальна", "неправильна"],
  massMargin: ["чіткі", "нерівні", "спікулярні"],
  massInternal: ["однорідне", "неоднорідне", "rim enhancement", "dark internal septations"],
  nmeDistribution: ["фокальний", "лінійний", "сегментарний", "регіонарний", "множинний регіонарний", "дифузний"],
  nmeInternal: ["однорідний", "неоднорідний", "clumped", "clustered ring"],
  lesionInitial: ["повільне (slow)", "середнє (medium)", "швидке (fast)"],
  lesionDelayed: ["persistent (I тип)", "plateau (II тип)", "washout (III тип)"],
  lesionDwi: ["без обмеження дифузії", "з обмеженням дифузії"],
};

const sideState = {
  right: { lesions: [], seq: 1 },
  left: { lesions: [], seq: 1 },
};

initMaps();
initTemplateSelects();
initLesionControls();
initReportControls();
renderAll();

function initMaps() {
  drawCoronalMap(document.getElementById("map-right"));
  drawCoronalMap(document.getElementById("map-left"));
}

function initTemplateSelects() {
  for (const side of SIDES) {
    for (const key of FIELD_KEYS) {
      const select = document.getElementById(`${side}-${key}`);
      for (const value of OPTIONS[key]) {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = value;
        select.appendChild(opt);
      }
      select.addEventListener("change", renderReport);
    }
  }
}

function initLesionControls() {
  document.getElementById("add-right").addEventListener("click", () => addLesion("right"));
  document.getElementById("add-left").addEventListener("click", () => addLesion("left"));
}

function initReportControls() {
  const reportEl = document.getElementById("report-output");
  document.getElementById("copy-report").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(reportEl.value);
      alert("Текст скопійовано");
    } catch {
      alert("Не вдалося скопіювати автоматично. Скопіюйте вручну.");
    }
  });
}

function addLesion(side) {
  const state = sideState[side];
  if (state.lesions.length >= MAX_LESIONS) {
    alert(`Досягнуто ліміту ${MAX_LESIONS} утворень для ${side.toUpperCase()}`);
    return;
  }

  state.lesions.push({
    id: state.seq++,
    kind: OPTIONS.lesionKind[1],
    massShape: OPTIONS.massShape[0],
    massMargin: OPTIONS.massMargin[0],
    massInternal: OPTIONS.massInternal[0],
    nmeDistribution: OPTIONS.nmeDistribution[0],
    nmeInternal: OPTIONS.nmeInternal[0],
    sizeX: 10,
    sizeY: 8,
    clock: 12,
    nippleDist: 30,
    depth: 25,
    initial: OPTIONS.lesionInitial[0],
    delayed: OPTIONS.lesionDelayed[0],
    dwi: OPTIONS.lesionDwi[0],
    birads: "3",
  });
  renderAll();
}

function removeLesion(side, id) {
  sideState[side].lesions = sideState[side].lesions.filter((x) => x.id !== id);
  renderAll();
}

function updateLesion(side, id, field, value) {
  const lesion = sideState[side].lesions.find((x) => x.id === id);
  if (!lesion) return;
  lesion[field] = value;
  renderAll();
}

function renderAll() {
  renderLesionList("right");
  renderLesionList("left");
  renderMarkers("right");
  renderMarkers("left");
  renderSummaries();
  renderReport();
}

function optionsHtml(list, valueMode = false) {
  if (valueMode) return list.map((x) => `<option value="${x.score}">${x.label}</option>`).join("");
  return list.map((x) => `<option>${x}</option>`).join("");
}

function renderLesionList(side) {
  const wrap = document.getElementById(`lesions-${side}`);
  const count = document.getElementById(`count-${side}`);
  const lesions = sideState[side].lesions;
  count.textContent = `${lesions.length} / ${MAX_LESIONS}`;

  wrap.innerHTML = "";
  if (!lesions.length) {
    wrap.innerHTML = '<p class="empty">Утворення не додані.</p>';
    return;
  }

  for (const lesion of lesions) {
    const card = document.createElement("div");
    card.className = "lesion-card";
    card.innerHTML = `
      <div class="lesion-head">
        <strong>${SIDE_LABEL[side]} #${lesion.id}</strong>
        <button type="button" class="danger" data-remove="${lesion.id}">Видалити</button>
      </div>
      <div class="lesion-grid">
        <label>Тип утвору
          <select data-field="kind">${optionsHtml(OPTIONS.lesionKind)}</select>
        </label>
        <label>BI-RADS утвору
          <select data-field="birads">${optionsHtml(BIRADS_OPTIONS, true)}</select>
        </label>

        <div class="size-field">
          <span>Розмір (X×Y мм)</span>
          <div class="size-inputs">
            <input data-field="sizeX" type="number" min="0" max="120" value="${lesion.sizeX}" aria-label="Розмір X у мм" />
            <span class="sep">×</span>
            <input data-field="sizeY" type="number" min="0" max="120" value="${lesion.sizeY}" aria-label="Розмір Y у мм" />
          </div>
        </div>

        <label data-role="mass">Форма (mass)
          <select data-field="massShape">${optionsHtml(OPTIONS.massShape)}</select>
        </label>
        <label data-role="mass">Контури (mass)
          <select data-field="massMargin">${optionsHtml(OPTIONS.massMargin)}</select>
        </label>
        <label data-role="mass">Внутрішнє підсилення (mass)
          <select data-field="massInternal">${optionsHtml(OPTIONS.massInternal)}</select>
        </label>

        <label data-role="nme">Розподіл (NME)
          <select data-field="nmeDistribution">${optionsHtml(OPTIONS.nmeDistribution)}</select>
        </label>
        <label data-role="nme">Внутрішній патерн (NME)
          <select data-field="nmeInternal">${optionsHtml(OPTIONS.nmeInternal)}</select>
        </label>

        <label>Година (1-12)
          <input data-field="clock" type="number" min="1" max="12" value="${lesion.clock}" />
        </label>
        <label>Відстань від соска (мм)
          <input data-field="nippleDist" type="number" min="0" max="120" value="${lesion.nippleDist}" />
        </label>
        <label>Глибина в товщі (мм)
          <input data-field="depth" type="number" min="0" max="60" value="${lesion.depth}" />
        </label>
        <label>Початкова фаза накопичення
          <select data-field="initial">${optionsHtml(OPTIONS.lesionInitial)}</select>
        </label>
        <label>Відстрочена фаза (крива)
          <select data-field="delayed">${optionsHtml(OPTIONS.lesionDelayed)}</select>
        </label>
        <label>DWI утвору
          <select data-field="dwi">${optionsHtml(OPTIONS.lesionDwi)}</select>
        </label>
      </div>
    `;

    for (const control of card.querySelectorAll("select,input")) {
      const field = control.dataset.field;
      control.value = lesion[field];
      control.addEventListener("input", () => updateLesion(side, lesion.id, field, parseValue(field, control.value)));
    }

    const isMass = lesion.kind === "mass";
    const isNme = lesion.kind === "non-mass enhancement";
    card.querySelectorAll('[data-role="mass"]').forEach((el) => (el.style.display = isMass ? "flex" : "none"));
    card.querySelectorAll('[data-role="nme"]').forEach((el) => (el.style.display = isNme ? "flex" : "none"));

    card.querySelector("[data-remove]").addEventListener("click", () => removeLesion(side, lesion.id));
    wrap.appendChild(card);
  }
}

function parseValue(field, value) {
  if (["clock", "nippleDist", "depth", "sizeX", "sizeY"].includes(field)) return Number(value) || 0;
  return value;
}

function lesionColor(id) {
  const hue = (id * 53) % 360;
  return `hsl(${hue} 75% 45%)`;
}

function lesionRadius(lesion) {
  const avg = (Number(lesion.sizeX) + Number(lesion.sizeY)) / 2;
  return clamp(4 + avg * 0.18, 4, 16);
}

function renderMarkers(side) {
  const coronal = document.getElementById(`map-${side}`);
  const sag = document.getElementById(`sag-markers-${side}`);
  coronal.querySelectorAll(".lesion-marker, .lesion-label").forEach((el) => el.remove());
  sag.innerHTML = "";

  for (const lesion of sideState[side].lesions) {
    const color = lesionColor(lesion.id);
    const r = lesionRadius(lesion);
    const c = coronalPoint(side, lesion.clock, lesion.nippleDist);
    addMarker(coronal, c.x, c.y, lesion.id, r, color);
    const s = sagittalPoint(side, lesion.nippleDist, lesion.depth);
    addMarker(sag, s.x, s.y, lesion.id, r, color);
  }
}

function coronalPoint(side, clock, distMm) {
  const dist = clamp(distMm, 0, OUTER_R - 6);
  const angle = clockToAngle(clock, side);
  return polarToCartesian(CENTER, CENTER, dist, angle);
}

function sagittalPoint(side, nippleDist, depth) {
  const xMin = 44;
  const xMax = 146;
  const yMin = 36;
  const yMax = 228;
  const tN = clamp(nippleDist, 0, 120) / 120;
  const tD = clamp(depth, 0, 60) / 60;
  let x = xMax - tN * (xMax - xMin);
  if (side === "left") x = 220 - x;
  const y = yMin + tD * (yMax - yMin);
  return { x, y };
}

function addMarker(svgOrGroup, x, y, id, radius, color) {
  const ns = "http://www.w3.org/2000/svg";
  const c = document.createElementNS(ns, "circle");
  c.setAttribute("cx", x);
  c.setAttribute("cy", y);
  c.setAttribute("r", radius);
  c.setAttribute("class", "lesion-marker");
  c.style.fill = color;

  const t = document.createElementNS(ns, "text");
  t.setAttribute("x", x + radius + 2);
  t.setAttribute("y", y - radius);
  t.setAttribute("class", "lesion-label");
  t.textContent = String(id);

  svgOrGroup.appendChild(c);
  svgOrGroup.appendChild(t);
}

function biradsLabel(score) {
  return BIRADS_OPTIONS.find((x) => x.score === Number(score))?.label || "BI-RADS ?";
}

function getSideSummary(side) {
  const lesions = sideState[side].lesions;
  if (!lesions.length) return { score: 1, label: "BI-RADS 1 — без утворів", lesionId: null };

  let max = lesions[0];
  for (const lesion of lesions) {
    if (Number(lesion.birads) > Number(max.birads)) max = lesion;
  }
  return { score: Number(max.birads), label: biradsLabel(max.birads), lesionId: max.id };
}

function renderSummaries() {
  for (const side of SIDES) {
    const s = getSideSummary(side);
    const suffix = s.lesionId ? ` (визначає утвір #${s.lesionId})` : "";
    document.getElementById(`${side}-summary`).textContent = `${s.label}${suffix}`;
  }
}

function renderReport() {
  const lines = ["### MRI молочних залоз (BI-RADS)", "", ...sideBlock("right"), "", ...sideBlock("left")];
  document.getElementById("report-output").value = lines.join("\n");
}

function lesionText(l) {
  let morph = "";
  if (l.kind === "mass") {
    morph = `mass: форма ${l.massShape}, контури ${l.massMargin}, внутрішнє підсилення ${l.massInternal}`;
  } else if (l.kind === "non-mass enhancement") {
    morph = `non-mass enhancement: розподіл ${l.nmeDistribution}, патерн ${l.nmeInternal}`;
  } else {
    morph = "focus";
  }

  return `- #${l.id}: ${morph}; розміри ${l.sizeX}×${l.sizeY} мм; BI-RADS утвору: ${biradsLabel(l.birads)}; локалізація ${l.clock} год, ${l.nippleDist} мм від соска, глибина ${l.depth} мм; динаміка: initial ${l.initial}, delayed ${l.delayed}; DWI: ${l.dwi}.`;
}

function sideBlock(side) {
  const get = (key) => document.getElementById(`${side}-${key}`).value;
  const lesions = sideState[side].lesions;
  const lesionLines = lesions.length ? lesions.map(lesionText) : ["- патологічних солідних вогнищ не виявлено."];
  const summary = getSideSummary(side);

  return [
    `${SIDE_LABEL[side]} breast:`,
    `Будова залозистої тканини: ${get("tissue-structure")}.`,
    `Тип тканини (BI-RADS): ${get("bitype")}.`,
    `Фонове контрастування (BPE): ${get("bpe")}.`,
    `Паренхіма: ${get("parenchyma")}.`,
    "Утворення:",
    ...lesionLines,
    `Протоки: ${get("ducts")}.`,
    `Шкіра і підшкірна клітковина: ${get("skin")}.`,
    `Пахвові лімфатичні вузли: ${get("nodes")}.`,
    `Грудні м'язи: ${get("muscles")}.`,
    `Сумарний висновок для залози: ${summary.label}${summary.lesionId ? ` (відповідає утвору #${summary.lesionId})` : ""}.`,
  ];
}

function drawCoronalMap(svg) {
  const ns = "http://www.w3.org/2000/svg";
  const sectors = [
    { start: -90, end: 0 },
    { start: 0, end: 90 },
    { start: 90, end: 180 },
    { start: 180, end: 270 },
  ];

  for (const s of sectors) {
    const path = document.createElementNS(ns, "path");
    path.setAttribute("class", "sector");
    path.setAttribute("d", donutSectorPath(CENTER, CENTER, INNER_R, OUTER_R, s.start, s.end));
    svg.appendChild(path);
  }

  svg.appendChild(line(ns, CENTER, CENTER - OUTER_R, CENTER, CENTER + OUTER_R, "axis"));
  svg.appendChild(line(ns, CENTER - OUTER_R, CENTER, CENTER + OUTER_R, CENTER, "axis"));
  svg.appendChild(circle(ns, CENTER, CENTER, OUTER_R, "ring-outer"));
  svg.appendChild(circle(ns, CENTER, CENTER, INNER_R, "ring-inner"));
  svg.appendChild(circle(ns, CENTER, CENTER, NIPPLE_R, "ring-nipple"));
}

function clockToAngle(clock, side) {
  const c = clamp(Number(clock) || 12, 1, 12);
  const angle = ((c % 12) * 30) - 90;
  return side === "left" ? -angle - 180 : angle;
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSectorPath(cx, cy, innerR, outerR, startDeg, endDeg) {
  const outerStart = polarToCartesian(cx, cy, outerR, endDeg);
  const outerEnd = polarToCartesian(cx, cy, outerR, startDeg);
  const innerStart = polarToCartesian(cx, cy, innerR, startDeg);
  const innerEnd = polarToCartesian(cx, cy, innerR, endDeg);
  const largeArc = endDeg - startDeg <= 180 ? "0" : "1";
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

function circle(ns, cx, cy, r, className) {
  const el = document.createElementNS(ns, "circle");
  el.setAttribute("cx", cx);
  el.setAttribute("cy", cy);
  el.setAttribute("r", r);
  el.setAttribute("class", className);
  return el;
}

function line(ns, x1, y1, x2, y2, className) {
  const el = document.createElementNS(ns, "line");
  el.setAttribute("x1", x1);
  el.setAttribute("y1", y1);
  el.setAttribute("x2", x2);
  el.setAttribute("y2", y2);
  el.setAttribute("class", className);
  return el;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
