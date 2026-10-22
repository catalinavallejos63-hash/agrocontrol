import { login, loginGoogle, registrar, recuperar, logout, perfil, fijarSesion, onSesion, ADMIN_EMAIL, nombreRol } from "./services/auth.js";
import { obtener } from "./services/db.js";
import { getAdditionalUserInfo } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
const $ = id => document.getElementById(id), f = $("f"), msg = $("msg");
let registro = false, ocupado = false;

const mostrar = (t, ok) => {
  msg.innerHTML = ""; if (!t) return;
  const d = document.createElement("div"); d.className = "msg" + (ok ? " ok" : ""); d.textContent = t; msg.append(d);
};
const MENSAJES = {
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/wrong-password": "Correo o contraseña incorrectos.",
  "auth/user-not-found": "Correo o contraseña incorrectos.",
  "auth/invalid-email": "El correo no es válido.",
  "auth/email-already-in-use": "Ese correo ya tiene una cuenta. Inicia sesión (o entra con Google).",
  "auth/weak-password": "La contraseña es muy débil.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos e inténtalo de nuevo.",
  "auth/network-request-failed": "Sin conexión a internet.",
  "auth/popup-blocked": "El navegador bloqueó la ventana de Google. Permite las ventanas emergentes para este sitio e inténtalo otra vez.",
  "auth/operation-not-allowed": "Este método de acceso no está activado. En Firebase: Authentication > Método de acceso (activa Google y Correo/Contraseña).",
  "auth/unauthorized-domain": () => `El dominio "${location.hostname}" no está autorizado. En Firebase: Authentication > Configuración > Dominios autorizados > agrégalo.`,
  "permission-denied": "Firestore rechazó la operación. Publica las reglas de firebase/firestore.rules en Firebase.",
  "unavailable": "No se pudo conectar con Firestore. Revisa que la base de datos esté creada y tu conexión."
};
const NO_CUENTA = ["auth/user-not-found", "auth/invalid-credential", "auth/wrong-password"];
const SILENCIO = ["auth/popup-closed-by-user", "auth/cancelled-popup-request"];
const texto = e => { const m = MENSAJES[e.code]; return typeof m === "function" ? m() : m || (e.code === "clave-debil" ? e.message : `Ocurrió un error (${e.code || e.message}).`); };

const bloquear = b => { ocupado = b; f.querySelectorAll("button").forEach(x => x.disabled = b); };
async function entrar(fn, conCorreo) {
  if (ocupado) return;
  mostrar(""); bloquear(true);
  try {
    await fijarSesion($("recordar").checked); // antes de iniciar sesión
    const c = await fn(), p = await perfil(c.user);
    if (p.estado !== "Activo") { await logout(); bloquear(false); return mostrar("Tu usuario está desactivado. Contacta al encargado."); }
    mostrar(`Bienvenido/a, ${p.nombre}. Entrando como ${nombreRol(p.rol)}…`, true);
    setTimeout(() => location.href = "app.html", 900);
  } catch (e) {
    console.error(e); bloquear(false);
    // Si intenta entrar con correo/contraseña y no hay una cuenta que coincida, lo llevamos directo a «Crear cuenta».
    if (conCorreo && NO_CUENTA.includes(e.code)) {
      const correo = f.correo.value, clave = f.clave.value;
      modo(true); f.correo.value = correo; f.clave.value = clave; f.nombre.focus();
      return mostrar("No encontramos una cuenta con esos datos. Crea tu cuenta para continuar (si ya te registraste, pulsa «Iniciar sesión» abajo y revisa tu contraseña).");
    }
    if (e.code === "sin-cuenta") {
      modo(true); if (e.correo) f.correo.value = e.correo; f.nombre.focus();
      return mostrar("Esa cuenta de Google aún no está registrada. Crea tu cuenta para continuar (también puedes usar «Continuar con Google» aquí).");
    }
    if (!SILENCIO.includes(e.code)) mostrar(texto(e));
  }
}

function modo(r) {
  registro = r; mostrar("");
  $("titulo").textContent = r ? "Crear cuenta" : "Iniciar sesión";
  $("sub").textContent = r ? "Regístrate para comprar insumos" : "Ingresa tus credenciales para continuar";
  $("enviar").textContent = r ? "Crear cuenta" : "Iniciar sesión";
  $("lNombre").hidden = $("lClave2").hidden = $("ayuda").hidden = !r;
  $("olvide").parentElement.hidden = r;
  f.nombre.required = f.clave2.required = r;
  f.clave.autocomplete = r ? "new-password" : "current-password";
  $("pregunta").textContent = r ? "¿Ya tienes cuenta?" : "¿Eres cliente y no tienes cuenta?";
  $("alt").textContent = r ? "Iniciar sesión" : "Crear cuenta";
}
$("alt").onclick = e => { e.preventDefault(); modo(!registro); };
$("ver").onclick = () => { const o = f.clave.type === "password"; f.clave.type = o ? "text" : "password"; $("ver").textContent = o ? "Ocultar" : "Mostrar"; };

f.onsubmit = e => {
  e.preventDefault();
  if (!registro) return entrar(() => login(f.correo.value, f.clave.value), true);
  if (f.clave.value !== f.clave2.value) return mostrar("Las contraseñas no coinciden.");
  entrar(() => registrar({ nombre: f.nombre.value, correo: f.correo.value, clave: f.clave.value }));
};
// Desde «Iniciar sesión», Google solo entra si la cuenta ya está registrada. Desde «Crear cuenta», Google la registra.
const tienePerfil = async u => (u.emailVerified && u.email?.toLowerCase() === ADMIN_EMAIL) || !!(await obtener("usuarios", u.uid));
const esNuevo = c => !!getAdditionalUserInfo(c)?.isNewUser;
const googleEntrar = async () => {
  const c = await loginGoogle();
  if (!registro && !(await tienePerfil(c.user))) {
    const correo = c.user.email;
    if (esNuevo(c)) await c.user.delete().catch(() => {}); // no dejamos una cuenta a medias en Authentication
    await logout().catch(() => {});
    const e = new Error("Cuenta de Google sin registrar"); e.code = "sin-cuenta"; e.correo = correo; throw e;
  }
  return c;
};
$("google").onclick = () => entrar(googleEntrar);
$("olvide").onclick = async e => {
  e.preventDefault();
  if (!f.correo.value) return mostrar("Escribe tu correo arriba y vuelve a pulsar «¿Olvidaste tu contraseña?».");
  try { await recuperar(f.correo.value); mostrar("Si ese correo tiene cuenta, te enviamos un enlace para restablecer la contraseña.", true); }
  catch (er) { mostrar(texto(er)); }
};

// Si ya hay una sesión guardada en este dispositivo, entra directo sin pedir la contraseña.
onSesion(async u => {
  if (!u || ocupado) return;
  try { const p = await perfil(u); if (p.estado === "Activo") location.replace("app.html"); } catch (e) { console.error(e); }
});
