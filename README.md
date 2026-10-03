# Control de Insumos y Lotes

Sistema web (HTML + JavaScript + Firebase) con dos modos de acceso:

| Rol | Qué ve y qué puede hacer |
| --- | --- |
| **Administrador** | Todo: panel, productos, proveedores, registrar insumos, stock, calidad, trazabilidad, pedidos de clientes, usuarios y roles, reportes. |
| **Usuario** (comprador) | Catálogo con precios y detalles, carrito de compras, método de pago (Yape, Plin, transferencia o contra entrega), pedido por la web o por WhatsApp y seguimiento de su compra. |

Al iniciar sesión se lee el rol guardado en Firestore (`usuarios/{uid}.rol`) y el menú lateral muestra **Modo administrador** o **Modo usuario**.
La cuenta `catalinavallejos63@gmail.com` entra siempre como Administrador (con correo verificado; con Google ya viene verificado). Cualquier otra persona que se registre queda como Usuario, y un administrador puede cambiarle el rol desde «Usuarios y roles».

## Seguridad de las contraseñas
- Las contraseñas **no se guardan en Firestore ni en este repositorio**: las maneja Firebase Authentication, que las almacena cifradas (hash con sal) y las recibe por HTTPS.
- La app exige mínimo 8 caracteres con letras y números al crear cuentas.
- Los permisos reales se aplican en `firebase/firestore.rules` (servidor). El menú oculto en pantalla es solo comodidad.

## Puesta en marcha (una sola vez)
1. **Firebase Console** → proyecto `agrocontrol-d6bae`.
2. **Authentication → Método de acceso**: activa **Google** y **Correo electrónico/contraseña**.
3. **Authentication → Configuración → Dominios autorizados**: deja `localhost` y agrega `TU-USUARIO.github.io`.
4. **Firestore Database**: crea la base (modo producción) → **Reglas** → pega el contenido de `firebase/firestore.rules` → **Publicar**.
5. Prueba en local con un servidor (no con doble clic): VS Code «Live Server» o `npx serve`.
6. Entra como administrador → **Datos del negocio** y completa WhatsApp, Yape y cuenta bancaria. Luego registra productos con su **precio** (solo los productos con precio y stock aparecen en el catálogo).
7. Entra con Google usando `catalinavallejos63@gmail.com`: verás «Modo administrador».

## Subir a GitHub y publicar
```bash
git init
git add .
git commit -m "Control de insumos y lotes"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/insumos-lotes.git
git push -u origin main
```
Luego en GitHub: **Settings → Pages → Deploy from a branch → `main` / root**. Tu sitio quedará en `https://TU-USUARIO.github.io/insumos-lotes/` (agrega `TU-USUARIO.github.io` a los dominios autorizados, paso 3).

> La `apiKey` de `firebase-config.js` es pública por diseño en apps web; lo que protege los datos son las reglas de Firestore.

## Estructura
- `index.html` login/registro · `app.html` sistema · `css/` estilos
- `js/services/auth.js` (Authentication y roles) · `js/services/db.js` (Firestore)
- `js/views/` una pantalla por archivo · `firebase/firestore.rules` reglas de seguridad

Colecciones: `usuarios`, `proveedores`, `productos`, `lotes`, `movimientos`, `pedidos`, `config`.

Seguimiento del pedido: Pedido recibido → Pago confirmado (descuenta stock) → En preparación → Entregado. Cada lote se crea al registrar un producto y aparece en Calidad y Trazabilidad.
