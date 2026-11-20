#!/usr/bin/env python3
"""
fin·flow — Build script
Ensambla src/styles.css + src/body.html + src/app.js en public/finflow-app.html
"""
import os, re, subprocess, sys, json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).parent
SRC  = ROOT / 'src'
OUT  = ROOT / 'public'

def build():
    print("🔨 fin·flow build...")

    # Leer partes
    css  = (SRC / 'styles.css').read_text()
    body = (SRC / 'body.html').read_text()
    js   = (SRC / 'app.js').read_text()

    # Versión de build: se embebe en app.js y en public/version.json para que
    # checkForAppUpdate() pueda detectar un deploy nuevo y forzar la recarga
    # (GitHub Pages cachea finflow-app.html por 10 minutos — ver comentario ahí).
    build_version = datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')
    js = js.replace('__BUILD_VERSION__', build_version)

    # Validar JS con node --check
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
        f.write(js); fname = f.name
    r = subprocess.run(['node', '--check', fname], capture_output=True, text=True)
    os.unlink(fname)
    if r.returncode != 0:
        print(f"❌ Error de sintaxis en app.js:\n{r.stderr}")
        sys.exit(1)
    print("  ✅ app.js — sintaxis OK")

    # Ensamblar
    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<meta name="theme-color" content="#0f0f13">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="CashWise">
<link rel="manifest" href="manifest.json">
<title>CashWise</title>
<link rel="icon" type="image/svg+xml" href="cashwise_icon.svg">
<link rel="apple-touch-icon" href="cashwise_icon.svg">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
{css}
</style>
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js"></script>
</head>
<body>
{body}
<script>
{js}
</script>
</body>
</html>"""

    # Verificar balance de tags básicos
    checks = [
        ('<div', html.count('<div'), '</div>', html.count('</div>')),
    ]
    for open_t, open_n, close_t, close_n in checks:
        if open_n != close_n:
            print(f"  ⚠️  {open_t}: {open_n} opens, {close_n} closes (desbalanceado)")

    # Guardar
    OUT.mkdir(exist_ok=True)
    out_file = OUT / 'finflow-app.html'
    out_file.write_text(html)

    version_file = OUT / 'version.json'
    version_file.write_text(json.dumps({'v': build_version}))

    size_kb = len(html) // 1024
    lines = html.count('\n')
    print(f"  ✅ {out_file} — {lines} líneas, {size_kb}KB")
    print(f"  ✅ {version_file} — v{build_version}")
    print("✅ Build completado")
    return str(out_file)

if __name__ == '__main__':
    build()
