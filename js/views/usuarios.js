import { listar, actualizar } from "../services/db.js";
import { crearUsuario, ROLES } from "../services/auth.js";
import { esc, badge, table, toast, formModal, confirmar, filtros, conectarFiltros, norm } from "../ui.js";
export async function render(root, yo) {
  const us = await listar("usuarios");
  root.innerHTML = `<div class="head"><h1>Usuarios y roles</h1><button class="btn" id="n">+ Nuevo usuario</button></div>${filtros({ ph: "Buscar por nombre o correo...", selects: [{ k: "rol", l: "Rol", opts: ROLES }, { k: "est", l: "Estado", opts: ["Activo", "Inactivo"] }] })}<div id="t"></div>`;
  const t = root.querySelector("#t");
  conectarFiltros(root, f => {
    const l = us.filter(u => norm((u.nombre || "") + (u.correo || "")).includes(norm(f.q)) && (!f.rol || u.rol === f.rol) && (!f.est || u.estado === f.est));
    t.innerHTML = table(["N.°", "Nombre", "Correo", "Rol", "Estado", "Acciones"], l.map(u => [us.indexOf(u) + 1, esc(u.nombre), esc(u.correo), esc(u.rol), badge(u.estado, u.estado === "Activo" ? "g" : "r"), u.id === yo.uid ? '<span class="empty">Tú</span>' : `<button class="mini" data-a="r" data-id="${u.id}">Cambiar rol</button> <button class="mini ${u.estado === "Activo" ? "red" : ""}" data-a="e" data-id="${u.id}">${u.estado === "Activo" ? "Desactivar" : "Activar"}</button>`]));
  });
  root.querySelector("#n").onclick = async () => {
    const d = await formModal("Nuevo usuario", [{ k: "nombre", l: "Nombre" }, { k: "correo", l: "Correo", type: "email" }, { k: "clave", l: "Contraseña (mín. 8, letras y números)", type: "password" }, { k: "rol", l: "Rol", type: "select", opts: ROLES }]);
    if (d) try { await crearUsuario(d); toast("Usuario creado"); render(root, yo); } catch (e) { toast(e.code === "clave-debil" ? e.message : e.code === "auth/email-already-in-use" ? "Ese correo ya tiene cuenta" : (e.code || e.message), 1); }
  };
  t.onclick = async e => {
    const b = e.target.closest("button"); if (!b) return; const u = us.find(x => x.id === b.dataset.id), on = u.estado === "Activo";
    if (b.dataset.a === "r") { const d = await formModal("Cambiar rol de " + u.nombre, [{ k: "rol", l: "Rol", type: "select", opts: ROLES }], u); if (d) { await actualizar("usuarios", u.id, { rol: d.rol }); toast("Rol actualizado"); render(root, yo); } return; }
    if (await confirmar(on ? "¿Está seguro de desactivar este usuario?" : "¿Activar usuario?", on ? "El usuario quedará inactivo y no podrá acceder al sistema." : u.nombre)) { await actualizar("usuarios", u.id, { estado: on ? "Inactivo" : "Activo" }); render(root, yo); }
  };
}
