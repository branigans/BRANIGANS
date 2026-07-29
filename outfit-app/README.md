# Branigans Style — app de combinaciones de outfit

App de estilo de vida con suscripción de pago: los usuarios suben una foto de su
outfit, describen cada prenda y su paleta de colores exacta, y otros usuarios
pueden descubrir esas combinaciones y seguirlos. No hay likes ni comentarios,
solo **feed** y **followers**. Todo el contenido (feed, subir outfit, perfiles)
está detrás de una suscripción de pago con Stripe.

Está separada del sitio estático de Branigans que vive en la raíz del repo
(`index.html`, `apps-script/`) — esa parte no se toca.

## Estructura

```
outfit-app/
  server/   API REST (Node + Express + Prisma/Postgres)
  web/      Frontend (React + Vite)
```

## Cómo funciona

- **Cuentas**: registro/login con email + contraseña (JWT).
- **Suscripción**: al registrarse, el usuario cae en la pantalla de suscripción.
  Sin suscripción activa (`active`/`trialing` en Stripe) no puede ver el feed,
  subir outfits ni ver perfiles — el backend lo bloquea con `402` y el
  frontend redirige a `/suscripcion`.
- **Outfits**: cada publicación tiene una foto + una lista de prendas, y cada
  prenda tiene un nombre libre (ej. "playera de algodón cuello redondo") y una
  paleta de colores (ej. azul claro, azul celeste, azul zafiro), más una lista
  opcional de tiendas favoritas.
- **Follows**: seguir/dejar de seguir perfiles, sin reacciones.
- **Fotos**: se suben a Cloudinary y se sirven públicamente desde ahí.

## 1. Configurar Stripe

1. Crea un producto de suscripción en el [Dashboard de Stripe](https://dashboard.stripe.com/products)
   con el precio que quieras cobrar (mensual/anual) y copia el **Price ID** (`price_...`).
2. En **Developers → API keys**, copia la **Secret key** (`sk_test_...` en modo prueba).
3. En **Developers → Webhooks**, crea un endpoint apuntando a
   `https://TU_DOMINIO_API/api/stripe/webhook` escuchando estos eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   Copia el **Signing secret** (`whsec_...`).
4. Para probar en local, usa la [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```
   stripe listen --forward-to localhost:4000/api/stripe/webhook
   ```

## 2. Configurar Cloudinary (almacenamiento de fotos)

1. Crea una cuenta gratis en [cloudinary.com](https://cloudinary.com).
2. En el Dashboard, copia los tres valores de **Product Environment Credentials**:
   `Cloud name`, `API Key` y `API Secret`.
3. Pégalos en `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`.

Las fotos se suben a la carpeta `branigans-style` dentro de esa cuenta de Cloudinary.

## 3. Configurar la base de datos (Postgres)

La app usa Postgres para que los datos **no se borren** en cada despliegue
(a diferencia de un archivo SQLite local, que vive en el disco temporal del
servidor y desaparece con cada redeploy).

- **Render**: crea un recurso "PostgreSQL" nuevo, copia su "Internal Database URL".
- **Railway**: en el mismo proyecto, "New" → "Database" → "Add PostgreSQL". Railway
  genera la variable automáticamente; en el servicio del backend, agrega
  `DATABASE_URL` referenciando esa base (Railway te deja seleccionarla directo).

Pega esa URL de conexión en `DATABASE_URL`.

## 4. Levantar el backend

```bash
cd outfit-app/server
cp .env.example .env
# completa .env con tu DATABASE_URL de Postgres, tus claves de Stripe, las de Cloudinary y JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run dev
```

La API queda en `http://localhost:4000`.

## 5. Levantar el frontend

```bash
cd outfit-app/web
npm install
npm run dev
```

La app queda en `http://localhost:5173` (el proxy de Vite reenvía `/api` al backend).

## 6. Despliegue

- **Backend**: cualquier host de Node (Render, Railway, Fly.io) con el recurso
  de Postgres del paso 3 conectado.
- **Frontend**: `npm run build` en `web/` genera `dist/`, listo para cualquier
  hosting estático (Vercel, Netlify, GitHub Pages). Configura la variable
  `CLIENT_URL` del backend con la URL pública del frontend, y ajusta el proxy
  de `/api` en el hosting del frontend (o reemplaza `BASE` en `web/src/api.js`
  por la URL completa de la API).
- Actualiza `success_url`/`cancel_url` en `server/src/routes/stripe.js` si el
  frontend queda en otras rutas.

## Notas

- Las contraseñas se guardan como hash con bcrypt; nunca en texto plano.
- El JWT dura 30 días; no hay refresh tokens (suficiente para un MVP).
- El estado de suscripción se sincroniza vía webhook de Stripe, no confiando
  solo en la respuesta del checkout — así se refleja también si el usuario
  cancela o si un pago falla.
