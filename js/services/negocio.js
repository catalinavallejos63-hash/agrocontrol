import { obtener } from "./db.js";
// Datos del negocio (WhatsApp, Yape, cuenta bancaria) que el administrador edita en «Datos del negocio».
export const cargarNegocio = async () => { try { return (await obtener("config", "negocio")) || {}; } catch { return {}; } };
export const urlWA = (num, texto) => {
  let n = String(num || "").replace(/\D/g, ""); if (n.length === 9) n = "51" + n; // Perú por defecto
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(texto)}` : "";
};
export const METODOS = ["Yape", "Plin", "Transferencia bancaria", "Contra entrega (efectivo)"];
export const PASOS = ["Pendiente", "Confirmado", "En preparación", "Entregado"];
export const ETQ = { Pendiente: "Pedido recibido", Confirmado: "Pago confirmado", "En preparación": "En preparación", Entregado: "Entregado", Rechazado: "Rechazado" };
export const COLOR = { Pendiente: "a", Confirmado: "g", "En preparación": "a", Entregado: "g", Rechazado: "r" };
export const itemsDe = p => p.items || [{ producto: p.producto, cantidad: p.cantidad, precio: 0 }]; // tolera pedidos del formato anterior
