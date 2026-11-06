with psycopg.connect("host=localhost dbname=mi_base user=postgres password=tu_password") as conn:
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO usuarios (nombre, email) VALUES (%s, %s)",
            ("Ana", "ana@correo.com"),
        )
        cur.execute("SELECT id, nombre FROM usuarios")
        for fila in cur.fetchall():
            print(fila)
    # el "with conn" hace commit automáticamente al salir sin errores