import { listar, crear, actualizar, borrar } from "../services/db.js";
import { esc, badge, table, toast, formModal, confirmar } from "../ui.js";
const campos = [{ k: "nombre", l: "Nombre" }, { k: "ruc", l: "RUC" }, { k: "telefono", l: "Teléfono" }, { k: "estado", l: "Estado", type: "select", opts: ["Activo", "Inactivo"] }];
export async function render(root) {
  const lista = await listar("proveedores");
  root.innerHTML = `<div class="head"><h1>Proveedores</h1><button class="btn" id="nuevo">+ Nuevo proveedor</button></div><input class="search" id="q" placeholder="Buscar proveedor..."><div id="t"></div>`;
  const t = root.querySelector("#t");
  const pintar = (f = "") => t.innerHTML = table(["N.°", "Nombre", "RUC", "Teléfono", "Estado", "Acciones"], lista.filter(p => (p.nombre + p.ruc).toLowerCase().includes(f.toLowerCase())).map((p, i) => [i + 1, esc(p.nombre), esc(p.ruc), esc(p.telefono), badge(p.estado, p.estado === "Activo" ? "g" : "r"), `<button class="mini" data-a="e" data-id="${p.id}">Editar</button> <button class="mini red" data-a="d" data-id="${p.id}">Eliminar</button>`]));
  pintar();
  root.querySelector("#q").oninput = e => pintar(e.target.value);
  root.querySelector("#nuevo").onclick = async () => { const d = await formModal("Nuevo proveedor", campos, { estado: "Activo" }); if (d) { await crear("proveedores", d); toast("Proveedor creado"); render(root); } };
  t.onclick = async e => {
    const b = e.target.closest("button"); if (!b) return; const p = lista.find(x => x.id === b.dataset.id);
    if (b.dataset.a === "e") { const d = await formModal("Editar proveedor", campos, p); if (d) { await actualizar("proveedores", p.id, d); render(root); } }
    else if (await confirmar("¿Eliminar proveedor?", p.nombre)) { await borrar("proveedores", p.id); render(root); }
  };
}
