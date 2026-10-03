import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Detecta automáticamente redes, antivirus o extensiones que bloquean la conexión normal y usa "long polling" en su lugar.
export const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
