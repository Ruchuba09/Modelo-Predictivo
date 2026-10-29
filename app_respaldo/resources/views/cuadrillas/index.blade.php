{{-- resources/views/cuadrillas/index.blade.php --}}
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Cuadrillas</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
<div class="container py-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="h3 mb-0">Cuadrillas</h1>
    </div>

    <div id="alerta"></div>

    <div class="card shadow-sm">
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th class="text-end">Acciones</th>
                    </tr>
                </thead>
                <tbody id="tabla-cuadrillas">
                    <tr><td colspan="3" class="text-center text-muted py-4">Cargando cuadrillas…</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<script>
    const API = '/api';
    const tbody = document.getElementById('tabla-cuadrillas');

    function mostrarAlerta(tipo, mensaje) {
        document.getElementById('alerta').innerHTML =
            `<div class="alert alert-${tipo}">${mensaje}</div>`;
    }

    function escapar(texto) {
        const d = document.createElement('div');
        d.textContent = texto ?? '';
        return d.innerHTML;
    }

    async function cargarCuadrillas() {
        try {
            const res = await fetch(`${API}/cuadrillas`, { headers: { 'Accept': 'application/json' } });
            if (!res.ok) throw new Error();
            const cuadrillas = await res.json();

            if (!cuadrillas.length) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">Aún no hay cuadrillas registradas.</td></tr>';
                return;
            }

            tbody.innerHTML = cuadrillas.map(c => `
                <tr>
                    <td>${c.id_cuadrilla}</td>
                    <td>${escapar(c.nombre)}</td>
                    <td class="text-end">
                        <a href="/cuadrillas/${c.id_cuadrilla}/asignar" class="btn btn-sm btn-primary">
                            Asignar a proyecto
                        </a>
                    </td>
                </tr>
            `).join('');
        } catch {
            tbody.innerHTML = '';
            mostrarAlerta('danger', 'No se pudieron cargar las cuadrillas. Revisa que el endpoint /api/cuadrillas responda.');
        }
    }

    cargarCuadrillas();
</script>
</body>
</html>