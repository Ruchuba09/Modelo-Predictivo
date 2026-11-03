import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

with psycopg.connect(
    host=os.getenv("DB_HOST"),
    port=os.getenv("DB_PORT"),
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
) as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM public.proyectos")
        filas = cur.fetchall()

        # nombres de las columnas
        columnas = [col.name for col in cur.description]
        print(columnas)

        for fila in filas:
            print(fila)
            
        cur.execute("SELECT * FROM public.proyectos")
        filas = cur.fetchall()

        # nombres de las columnas
        columnas = [col.name for col in cur.description]
        print(columnas)

        for fila in filas:
            print(fila)
        