{{-- resources/views/cuadrillas/asignar.blade.php --}}
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Asignar cuadrilla a proyecto</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
<div class="container py-5" style="max-width: 640px;">
    <a href="{{ route('cuadrillas.index') }}" class="text-decoration-none">← Volver a cuadrillas</a>
    <h1 class="h3 mt-3 mb-4">Asignar cuadrilla a proyecto</h1>

    <div id="alerta"></div>

    <div class="card shadow-sm">
        <div class="card-body">
            <form id="form-asignar" novalidate>
                <input type="hidden" id="id_cuadrilla" value="{{ $idCuadrilla }}">

                <div class="mb-3">
                    <label class="form-label">Cuadrilla</label>
                    <input type="text" id="nombre-cuadrilla" class="form-control" value="Cargando…" disabled>
                </div>

                <div class="mb-3">
                    <label for="id_proyecto" class="form-label">Proyecto</label>
                    <select id="id_proyecto" class="form-select" required>
                        <option value="">Cargando proyectos…</option>
                    </select>
                    <div class="invalid-feedback" id="error-id_proyecto"></div>
                </div>

                <div class="row">
                    <div class="col-md-6 mb-3">
                        <label for="fecha_inicio" class="form-label">Fecha de inicio (opcional)</label>
                        <input type="date" id="fecha_inicio" class="form-control">
                        <div class="invalid-feedback" id="error-fecha_inicio"></div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label for="fecha_termino" class="form-label">Fecha de término (opcional)</label>
                        <input type="date" id="fecha_termino" class="form-control">
                        <div class="invalid-feedback" id="error-fecha_termino"></div>
                    </div>
                </div>

                <div class="d-flex justify-content-end gap-2">
                    <a href="{{ route('cuadrillas.index') }}" class="btn btn-outline-secondary">Cancelar</a>
                    <button type="submit" class="btn btn-primary" id="btn-guardar">Asignar cuadrilla</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
    const API = '/api';
    const idCuadrilla = document.getElementById('id_cuadrilla').value;
    const form = document.getElementById('form-asignar');
    const selectProyecto = document.getElementById('id_proyecto');
    const btnGuardar = document.getElementById('btn-guardar');
    const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };

    function mostrarAlerta(tipo, mensaje) {
        document.getElementById('alerta').innerHTML =
            `<div class="alert alert-${tipo}">${mensaje}</div>`;
    }

    function limpiarErrores() {
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    }

    function mostrarErrores(errores) {
        Object.entries(errores).forEach(([campo, mensajes]) => {
            const input = document.getElementById(campo);
            const feedback = document.getElementById(`error-${campo}`);
            if (input && feedback) {
                input.classList.add('is-invalid');
                feedback.textContent = mensajes[0];
            }
        });
    }

    async function cargarDatos() {
        try {
            const [resCuadrilla, resProyectos] = await Promise.all([
                fetch(`${API}/cuadrillas/${idCuadrilla}`, { headers }),
                fetch(`${API}/proyectos`, { headers }),
            ]);

            if (!resCuadrilla.ok || !resProyectos.ok) throw new Error();

            const cuadrilla = await resCuadrilla.json();
            const proyectos = await resProyectos.json();

            document.getElementById('nombre-cuadrilla').value = cuadrilla.nombre ?? `Cuadrilla #${idCuadrilla}`;

            selectProyecto.innerHTML = '<option value="">Selecciona un proyecto</option>' +
                proyectos.map(p => {
                    const opt = document.createElement('option');
                    opt.value = p.id_proyecto;
                    opt.textContent = p.nombre ?? `Proyecto #${p.id_proyecto}`;
                    return opt.outerHTML;
                }).join('');
        } catch {
            mostrarAlerta('danger', 'No se pudieron cargar los datos. Revisa que /api/cuadrillas/{id} y /api/proyectos respondan.');
            btnGuardar.disabled = true;
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        limpiarErrores();
        document.getElementById('alerta').innerHTML = '';

        if (!selectProyecto.value) {
            selectProyecto.classList.add('is-invalid');
            document.getElementById('error-id_proyecto').textContent = 'Selecciona un proyecto.';
            return;
        }

        const body = {
            id_cuadrilla: Number(idCuadrilla),
            id_proyecto: Number(selectProyecto.value),
            fecha_inicio: document.getElementById('fecha_inicio').value || null,
            fecha_termino: document.getElementById('fecha_termino').value || null,
        };

        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Asignando…';

        try {
            const res = await fetch(`${API}/asignaciones/asignar`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (res.status === 422 && data.errors) {
                mostrarErrores(data.errors);
                if (data.message && !data.errors) mostrarAlerta('danger', data.message);
            } else if (!res.ok) {
                mostrarAlerta('danger', data.message ?? 'No se pudo realizar la asignación.');
            } else {
                mostrarAlerta('success', data.message + ' Volviendo a la lista…');
                setTimeout(() => window.location.href = '{{ route('cuadrillas.index') }}', 1200);
                return;
            }
        } catch {
            mostrarAlerta('danger', 'Error de conexión con el servidor.');
        }

        btnGuardar.disabled = false;
        btnGuardar.textContent = 'Asignar cuadrilla';
    });

    cargarDatos();
</script>
</body>
</html>