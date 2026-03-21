# CashWise — App de Finanzas Personal

## Stack
- **HTML/CSS/JS puro** — Single Page App, sin frameworks
- **Firebase** — Auth (Google + Email) + Firestore (sync en la nube)
- **SheetJS** — Exportación/importación de Excel
- **Target** — iOS/Android via Capacitor (pendiente)
- **Fuentes** — DM Sans + DM Mono (Google Fonts)

## URLs
- **App live:** https://dantrux22.github.io/cashwise/public/finflow-app.html
- **Repo:** https://github.com/Dantrux22/cashwise
- **Firebase:** gestor-de-gastos-22

## Estructura del proyecto
```
CashWise/
├── public/
│   ├── finflow-app.html      ← Build output (NO editar directamente)
│   ├── auth-action.html      ← Página de verificación de email
│   ├── cashwise_icon.svg     ← Ícono de la app
│   └── manifest.json         ← PWA manifest
├── src/
│   ├── styles.css            ← Todo el CSS
│   ├── body.html             ← HTML del body
│   └── app.js                ← Todo el JS (~340KB)
├── cashwise/                 ← Repo Git para GitHub Pages
│   └── public/               ← Copia del build (sincronizada por build.py)
├── build.py                  ← Compila + copia al repo Git
└── README.md
```

## Cómo trabajar
```bash
# Editar archivos en src/
# Compilar y sincronizar al repo Git:
python3 build.py

# Probar en celular:
cd public && python3 -m http.server 8080
# Abrir http://TU-IP:8080/finflow-app.html
```

## Estado global (S)
```javascript
const SK = 'finflow_v3'; // localStorage key — NO cambiar
let S = {
  txs: [],           // Transacciones
  cats: {},          // Categorías por tipo
  budgets: [],       // Presupuestos
  goals: [],         // Metas de ahorro
  recurring: [],     // Transacciones recurrentes
  split: {           // Módulo Split
    groups: [],
    expenses: []
  },
  splitPrefs: {},
  currency, useComma, hidden, accent, lang, skipAuth,
  chartType,         // 'dual' | 'net'
  userName,          // Nombre del usuario logueado
  lastSync           // Timestamp último sync Firebase
}
```

## Pantallas

| ID | Pantalla |
|---|---|
| `s-home` | Dashboard con gráfico y movimientos |
| `s-add` | Agregar / editar transacción |
| `s-allTx` | Todos los movimientos (filtros) |
| `s-invest` | Inversiones |
| `s-budgets` | Presupuestos |
| `s-goals` | Metas de ahorro |
| `s-recurring` | Transacciones recurrentes |
| `s-cats` | Gestión de categorías |
| `s-monthly` | Resumen mensual con donut chart |
| `s-data` | Exportar / Importar datos |
| `s-settings` | Configuración |
| `s-profile` | Perfil y cuenta |
| `s-split` | Split — gastos compartidos |

## Features implementadas

### Dashboard
- Balance disponible (ingresos - gastos - inversiones)
- Cards de Ingresos / Gastos / Neto
- Gráfico dual (ingresos vs gastos acumulados) o neto acumulado
- Filtros: Semana / Mes / Año / Todo — filtran gráfico y lista
- Alertas de presupuesto y próximos vencimientos

### Autenticación
- Login con email + verificación obligatoria
- Login con Google (popup en desktop, redirect en Safari/iOS)
- Página `auth-action.html` procesa links de verificación
- Perfil guardado en Firestore `userProfiles/{uid}`

### Sincronización Firebase
- `saveState()` → sync automático a Firestore `users/{uid}`
- `syncWithFirestore(user)` → carga/sube datos al loguearse
- Inversiones restan del balance

### Split colaborativo
- Crear grupos con miembros por nombre + email
- Buscar usuarios registrados en Firebase por email
- Grupos guardados en Firestore `splitGroups/{id}`
- **Sincronización en tiempo real** via `onSnapshot`
- Al agregar/eliminar/saldar un gasto → se sube a Firestore automáticamente
- Todos los miembros ven los cambios al instante

### Exportación / Importación
- **Excel (.xlsx)** — formato idéntico a Monee (Account name | Category | Description | Person | Date | Amount | Recurring | Payment status)
- **CSV** — compatible con Excel y Google Sheets
- **PDF** — informe con tabla de movimientos
- **Importar desde Monee** — lee Excel exportado de Monee, mapea categorías automáticamente

## Firebase
```javascript
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB6DJpoQBHQWC0Rcf6V6d5AwYUP4u5P94g",
  authDomain: "gestor-de-gastos-22.firebaseapp.com",
  projectId: "gestor-de-gastos-22",
};
const FIREBASE_ENABLED = true;
```

### Reglas de Firestore
- `userProfiles/{uid}` — lectura pública (auth), escritura solo el propio uid
- `splitGroups/{id}` — lectura/escritura para owner y miembros en sharedWith
- `users/{uid}` — lectura/escritura solo el propio uid

## Próximos pasos

- [ ] Empaquetar con Capacitor para iOS/Android
- [ ] Push notifications con OneSignal
- [ ] Widget de balance para iOS
- [ ] Modo offline completo con Service Worker
