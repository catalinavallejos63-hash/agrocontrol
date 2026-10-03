import { db } from "../config/firebase.js";
import { collection, getDocs, addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, increment, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
const mapa = s => s.docs.map(d => ({ id: d.id, ...d.data() }));
export const listar = async c => mapa(await getDocs(collection(db, c)));
// Lista solo los documentos donde campo == valor (lo usa el comprador para ver únicamente sus pedidos).
export const listarDe = async (c, campo, valor) => mapa(await getDocs(query(collection(db, c), where(campo, "==", valor))));
export const obtener = async (c, id) => { const s = await getDoc(doc(db, c, id)); return s.exists() ? { id: s.id, ...s.data() } : null; };
export const crear = (c, data) => addDoc(collection(db, c), { ...data, creado: serverTimestamp() });
export const guardar = (c, id, data) => setDoc(doc(db, c, id), data, { merge: true });
export const actualizar = (c, id, data) => updateDoc(doc(db, c, id), data);
export const borrar = (c, id) => deleteDoc(doc(db, c, id));
export { increment };
