import { auth } from "../config/firebase.js";
import { firebaseConfig } from "../config/firebase-config.js";
import { obtener, guardar } from "./db.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendEmailVerification, sendPasswordResetEmail, updateProfile, setPersistence, browserLocalPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Esta cuenta (con el correo verificado) es siempre Administrador. Las reglas de Firestore lo vuelven a comprobar en el servidor.
export const ADMIN_EMAIL = "catalinavallejos63@gmail.com";
export const ROLES = ["Administrador", "Usuario"];

// Las contraseñas NUNCA se guardan en Firestore: Firebase Authentication las almacena cifradas (hash scrypt con sal) y viajan por HTTPS.
export function validarClave(c) {
  if (!c || c.length < 8 || !/[A-Za-z]/.test(c) || !/\d/.test(c)) {
    const e = new Error("La contraseña debe tener mínimo 8 caracteres, con letras y números."); e.code = "clave-debil"; throw e;
  }
}
// "Recordar este dispositivo": la sesión queda guardada en el navegador y no se cierra hasta que pulses «Cerrar sesión».
// Si no se marca, la sesión se borra al cerrar la pestaña/navegador (útil en equipos compartidos).
export const fijarSesion = recordar => setPersistence(auth, recordar ? browserLocalPersistence : browserSessionPersistence);
export const login = (correo, clave) => signInWithEmailAndPassword(auth, correo.trim(), clave);
export const loginGoogle = () => { const p = new GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" }); return signInWithPopup(auth, p); };
export const recuperar = correo => sendPasswordResetEmail(auth, correo.trim());
export const logout = () => signOut(auth);
export const onSesion = cb => onAuthStateChanged(auth, cb);

export async function registrar({ nombre, correo, clave }) {
  validarClave(clave);
  const c = await createUserWithEmailAndPassword(auth, correo.trim(), clave);
  await updateProfile(c.user, { displayName: nombre.trim() });
  sendEmailVerification(c.user).catch(() => {});
  return c;
}

const esDuenio = u => u.emailVerified && u.email?.toLowerCase() === ADMIN_EMAIL;

// Perfil en Firestore (usuarios/{uid}) con el rol: "Administrador" o "Usuario" (comprador).
export async function perfil(u) {
  let p = await obtener("usuarios", u.uid);
  if (!p) {
    p = { nombre: u.displayName || u.email.split("@")[0], correo: u.email, rol: esDuenio(u) ? "Administrador" : "Usuario", estado: "Activo" };
    await guardar("usuarios", u.uid, p);
  } else if (esDuenio(u) && (p.rol !== "Administrador" || p.estado !== "Activo")) {
    p = { ...p, rol: "Administrador", estado: "Activo" };
    await guardar("usuarios", u.uid, { rol: p.rol, estado: p.estado });
  }
  if (p.rol !== "Administrador") p.rol = "Usuario"; // roles antiguos (Consulta, Almacenero…) pasan a Usuario
  return { ...p, uid: u.uid };
}

// Crea la cuenta en Authentication con una app secundaria para no cerrar la sesión del administrador.
export async function crearUsuario({ nombre, correo, clave, rol }) {
  validarClave(clave);
  const sec = initializeApp(firebaseConfig, "sec" + Date.now()), a = getAuth(sec);
  const c = await createUserWithEmailAndPassword(a, correo.trim(), clave);
  await guardar("usuarios", c.user.uid, { nombre, correo: correo.trim(), rol, estado: "Activo" });
  await signOut(a);
}
