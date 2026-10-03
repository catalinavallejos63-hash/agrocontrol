// Carrito del comprador: se guarda en este navegador (uno por usuario) hasta que realiza el pedido.
const K = uid => "carrito_" + uid;
export const leer = uid => { try { return JSON.parse(localStorage.getItem(K(uid))) || []; } catch { return []; } };
export const guardarCarrito = (uid, c) => { try { localStorage.setItem(K(uid), JSON.stringify(c)); } catch {} dispatchEvent(new Event("carrito")); };
export const cuenta = uid => leer(uid).reduce((a, i) => a + i.cantidad, 0);
export const vaciar = uid => guardarCarrito(uid, []);
export function agregar(uid, p, n = 1) {
  const c = leer(uid), i = c.find(x => x.productoId === p.id), nueva = (i ? i.cantidad : 0) + n;
  if (nueva > p.stock) return false;
  if (i) Object.assign(i, { cantidad: nueva, precio: p.precio, stock: p.stock });
  else c.push({ productoId: p.id, producto: p.nombre, precio: p.precio, stock: p.stock, cantidad: n });
  guardarCarrito(uid, c); return true;
}
