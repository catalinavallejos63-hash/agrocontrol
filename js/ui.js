export const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const badge = (t, k) => `<span class="badge ${k}">${esc(t)}</span>`;
export const estadoStock = n => n < 10 ? badge("Stock bajo", "r") : badge("Disponible", "g");
export const table = (cols, rows) => `<div class="card"><table><thead><tr>${cols.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${cols.length}" class="empty">Sin registros</td></tr>`}</tbody></table></div>`;
export const toast = (m, e) => { const t = document.createElement("div"); t.className = "toast" + (e ? " err" : ""); t.textContent = m; document.body.append(t); setTimeout(() => t.remove(), 2600); };
const modal = html => { const o = document.createElement("div"); o.className = "overlay"; o.innerHTML = html; document.body.append(o); return o; };
export const confirmar = (t, m) => new Promise(res => { const o = modal(`<div class="modal"><h3>${esc(t)}</h3><p>${esc(m)}</p><div class="row"><button class="btn out" data-n>Cancelar</button><button class="btn red" data-s>Confirmar</button></div></div>`); o.querySelector("[data-n]").onclick = () => { o.remove(); res(false); }; o.querySelector("[data-s]").onclick = () => { o.remove(); res(true); }; });
export const formModal = (t, campos, v = {}) => new Promise(res => {
  const o = modal(`<form class="modal"><h3>${esc(t)}</h3>${campos.map(c => `<label>${c.l}${c.type === "select" ? `<select name="${c.k}">${c.opts.map(x => `<option ${v[c.k] === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select>` : `<input name="${c.k}" type="${c.type || "text"}" value="${esc(v[c.k] ?? "")}" ${c.req === false ? "" : "required"} ${c.step ? `step="${c.step}"` : ""} ${c.min != null ? `min="${c.min}"` : ""}>`}</label>`).join("")}<div class="row"><button type="button" class="btn out" data-x>Cancelar</button><button class="btn">Guardar</button></div></form>`);
  o.querySelector("[data-x]").onclick = () => { o.remove(); res(null); };
  o.querySelector("form").onsubmit = e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); o.remove(); res(d); };
});
export const descargarCSV = (nombre, filas) => {
  if (!filas.length) return toast("No hay datos para exportar", 1);
  const k = Object.keys(filas[0]), q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const blob = new Blob(["\ufeff" + [k.join(","), ...filas.map(f => k.map(x => q(f[x])).join(","))].join("\n")], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nombre + ".csv"; a.click();
};
export const fecha = d => d ? new Date(d).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" }) : "";
export const soles = n => "S/ " + Number(n || 0).toFixed(2);
// Ventana de información. `html` debe venir ya escapado por quien la llama.
export const info = (t, html, txt, fn) => {
  const o = modal(`<div class="modal"><h3>${esc(t)}</h3><div>${html}</div><div class="row" style="margin-top:14px"><button class="btn out" data-x>Cerrar</button>${txt ? `<button class="btn" data-ok>${esc(txt)}</button>` : ""}</div></div>`);
  o.querySelector("[data-x]").onclick = () => o.remove();
  const ok = o.querySelector("[data-ok]"); if (ok) ok.onclick = () => { o.remove(); fn(); };
};

// ---- Búsqueda sin tildes ni mayúsculas ----
export const norm = s => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// ---- Imágenes referenciales (enlace) ----
export const safeUrl = u => /^https?:\/\/\S+$/i.test(String(u || "").trim());
export const imgTag = (url, cls = "thumb") => safeUrl(url)
  ? `<img data-ref class="${cls}" src="${esc(String(url).trim())}" alt="" loading="lazy" referrerpolicy="no-referrer">`
  : `<span class="${cls} vacia">Sin imagen</span>`;
// Si el enlace no carga, se cambia por un recuadro "Sin imagen".
document.addEventListener("error", e => {
  const i = e.target;
  if (i && i.tagName === "IMG" && i.hasAttribute("data-ref")) i.outerHTML = `<span class="${esc(i.className)} vacia">Sin imagen</span>`;
}, true);

// ---- Barra de filtros reutilizable (buscador + listas + "Limpiar filtros") ----
const LUPA = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>';
const EMBUDO = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.5V19l4 2v-8.5z"/></svg>';
export const filtros = ({ ph = "Buscar...", selects = [] } = {}) => `<div class="filtros"><label class="fq">${LUPA}<input data-f="q" placeholder="${esc(ph)}" autocomplete="off"></label>${selects.map(s => `<label class="fs">${esc(s.l)}<select data-f="${s.k}"><option value="">Todos</option>${s.opts.map(o => `<option>${esc(o)}</option>`).join("")}</select></label>`).join("")}<button type="button" class="btn out" data-limpiar>${EMBUDO} Limpiar filtros</button></div>`;
// Llama a cb({q, ...filtros}) al escribir/cambiar, y una vez al inicio.
export const conectarFiltros = (root, cb) => {
  const bar = root.querySelector(".filtros"), campos = () => [...bar.querySelectorAll("[data-f]")];
  const leer = () => Object.fromEntries(campos().map(e => [e.dataset.f, e.value.trim()]));
  bar.addEventListener("input", () => cb(leer()));
  bar.querySelector("[data-limpiar]").onclick = () => { campos().forEach(e => (e.value = "")); cb(leer()); };
  cb(leer());
};
export const unicos = a => [...new Set(a.filter(Boolean))].sort((x, y) => String(x).localeCompare(String(y), "es"));
