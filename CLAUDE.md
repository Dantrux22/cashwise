# CLAUDE.md — fin·flow

## Instrucciones generales
- Siempre responder en español
- Este es el proyecto fin·flow (ver README.md para contexto completo)

## Reglas de trabajo
- **NUNCA** editar `public/finflow-app.html` directamente — es el build output
- Siempre editar en `src/` (app.js, body.html, styles.css)
- Después de cada cambio en JS: `node --check src/app.js`
- Para compilar: `python3 build.py`
- Para probar: `python3 -m http.server 8080` desde `/public`
- No duplicar IDs en body.html
- Todo cambio de datos modifica `S` y llama `saveState()`
