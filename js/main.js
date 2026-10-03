import { onSesion, perfil, logout } from "./services/auth.js";
import { esc } from "./ui.js";
import { cuenta } from "./services/carrito.js";
const A = ["Administrador"], U = ["Usuario"];
// [título, archivo de la vista, roles con acceso]
const RUTAS = {
  panel: ["Panel principal", "dashboard", A], productos: ["Productos", "productos", A], proveedores: ["Proveedores", "proveedores", A],
  registrar: ["Registrar producto", "registrar", A], stock: ["Control de stock", "stock", A], calidad: ["Calidad", "calidad", A],
  trazabilidad: ["Trazabilidad", "trazabilidad", A], pedidos: ["Pedidos de clientes", "pedidos", A], usuarios: ["Usuarios y roles", "usuarios", A],
  reportes: ["Reportes", "reportes", A], negocio: ["Datos del negocio", "negocio", A],
  catalogo: ["Catálogo", "catalogo", U], carrito: ["Carrito", "carrito", U], mispedidos: ["Mis pedidos", "mispedidos", U]
};
const app = document.getElementById("app");
onSesion(async u => {
  if (!u) return location.replace("index.html");
  let p;
  try { p = await perfil(u); }
  catch (e) { app.innerHTML = `<main><p class="err">No se pudo cargar tu perfil (${esc(e.code || e.message)}). Revisa que las reglas de Firestore estén publicadas.</p><a class="btn" href="index.html">Volver</a></main>`; return; }
  if (p.estado !== "Activo") { await logout(); return; }
  const admin = p.rol === "Administrador", inicio = admin ? "panel" : "catalogo";
  const rutas = Object.entries(RUTAS).filter(([, r]) => r[2].includes(p.rol));
  app.innerHTML = `<aside><div class="logo">Insumos y Lotes<br><small>${esc(p.nombre)}</small><br><span class="rol ${admin ? "adm" : "usr"}">${admin ? "Modo administrador" : "Modo usuario"}</span></div>${rutas.map(([k, r]) => `<a href="#${k}" data-k="${k}">${r[0]}</a>`).join("")}<button id="salir">Cerrar sesión</button></aside><main id="vista"></main>`;
  document.getElementById("salir").onclick = async () => { await logout(); location.href = "index.html"; };
  const act = () => { const a = document.querySelector('aside a[data-k="carrito"]'); if (a) a.textContent = `Carrito (${cuenta(p.uid)})`; };
  addEventListener("carrito", act); act();
  const vista = document.getElementById("vista");
  const ir = async () => {
    let k = (location.hash || "#" + inicio).slice(1);
    if (!rutas.some(([n]) => n === k)) k = inicio; // un usuario no puede abrir pantallas de administrador
    document.querySelectorAll("aside a").forEach(a => a.classList.toggle("on", a.dataset.k === k));
    vista.innerHTML = '<p class="empty">Cargando…</p>';
    try { await (await import(`./views/${RUTAS[k][1]}.js`)).render(vista, p); }
    catch (e) { vista.innerHTML = `<p class="err">No se pudo cargar: ${esc(e.code || e.message)}</p>`; }
  };
  addEventListener("hashchange", ir); ir();
});
