# fin·flow — App de Finanzas Personal

## Stack
- **HTML/CSS/JS puro** — Single Page App, sin frameworks
- **Firebase** — Auth (Google + Email) + Firestore (sync en la nube)
- **Target** — iOS/Android via Capacitor (pendiente)
- **Fuentes** — DM Sans + DM Mono (Google Fonts)

## Estructura del proyecto

```
finflow/
├── public/
│   └── finflow-app.html      ← Archivo final (build output)
├── src/
│   ├── styles.css            ← Todo el CSS de la app
│   ├── body.html             ← HTML del body (screens, modales, overlays)
│   └── app.js                ← Todo el JS de la app (~178KB)
├── build.py                  ← Script que ensambla el HTML final
└── README.md
```

## Cómo trabajar

### Editar y compilar
```bash
# Editar los archivos en src/
# Luego compilar:
python3 build.py

# El resultado queda en public/finflow-app.html
# Abrirlo en el browser para probar
```

### Probar en el celular
```bash
cd public
python3 -m http.server 8080
# Abrir http://TU-IP:8080/finflow-app.html desde el celular
```

## Pantallas implementadas

| ID | Pantalla |
|---|---|
| `s-home` | Dashboard principal |
| `s-add` | Agregar / editar transacción |
| `s-allTx` | Todos los movimientos (con filtros) |
| `s-invest` | Inversiones |
| `s-budgets` | Presupuestos |
| `s-goals` | Metas de ahorro |
| `s-recurring` | Transacciones recurrentes |
| `s-cats` | Gestión de categorías |
| `s-monthly` | Resumen mensual (con donut chart) |
| `s-settings` | Configuración |
| `s-profile` | Perfil y cuenta |
| `s-split` | Split (gastos compartidos) |
| `s-split-group` | Detalle de grupo Split |
| `s-split-expense` | Nuevo gasto Split |
| `s-split-settings` | Configuración de Split |

## Firebase

```javascript
// Configuración activa en app.js
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB6DJpoQBHQWC0Rcf6V6d5AwYUP4u5P94g",
  authDomain: "gestor-de-gastos-22.firebaseapp.com",
  projectId: "gestor-de-gastos-22",
  // ...
};
const FIREBASE_ENABLED = true;
```

**Para testing local:** usar `python3 -m http.server 8080` 
(el login de Firebase no funciona desde `file://`)

## Estado del JS (app.js)

### Variables globales clave
```javascript
const SK = 'finflow_v3';        // localStorage key
let S = { ... };                // Estado completo de la app
let navStack = ['s-home'];      // Stack de navegación
let curScreen = 's-home';       // Pantalla activa
let _authUser = null;           // Usuario Firebase actual
let _syncDebounce = null;       // Debounce para sync
```

### Funciones principales
- `goTo(id)` / `goBack()` — Navegación
- `refreshHome()` — Refresca el dashboard
- `saveTx()` — Guardar transacción
- `openAdd(type)` / `openEdit(id)` — Formulario de tx
- `saveState()` — Guarda en localStorage + sync Firebase
- `initAuth()` — Inicializa Firebase Auth
- `initSplit()` — Inicializa módulo Split

### Módulos en app.js
1. **Constants & State** — SK, S inicial, categorías por defecto
2. **Utils** — `uid()`, `fmt()`, `sym()`, `getSep()`, etc.
3. **Navigation** — `goTo()`, `goBack()`, `showScreen()`
4. **Home** — `refreshHome()`, `filterTxs()`, `setFilter()`
5. **Transactions** — `saveTx()`, `openAdd()`, `openEdit()`, `deleteTx()`
6. **Budgets** — `renderBudgets()`, `saveBudget()`
7. **Goals** — `renderGoals()`, `quickAddToGoal()`, `openGoalHistory()`
8. **Recurring** — `applyRecurring()`, `saveRec()`
9. **Split** — `initSplit()`, `openAddSplitExpense()`, `saveSplitExpense()`
10. **Auth** — `initAuth()`, `authGoogle()`, `authEmailLogin()`, `skipAuth()`
11. **Settings** — Moneda, idioma, tema, exportar/importar
12. **Features** — Filtros allTx, alertas dashboard, historial metas

## Próximos pasos

- [ ] Empaquetar con Capacitor para iOS/Android
- [ ] Buscar usuarios registrados en Firebase para Split
- [ ] Push notifications para recurrentes
- [ ] Widget de balance para iOS
- [ ] Modo offline completo con Service Worker
