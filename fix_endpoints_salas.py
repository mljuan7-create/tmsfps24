with open('main.py', 'r') as f:
    content = f.read()

import re

# Add the missing /api/salas endpoint
api_salas_code = '''
    @app.get("/api/salas")
    def get_salas():
        conn = get_db_connection()
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT * FROM salas ORDER BY id ASC")
        rows = cur.fetchall()
        
        salas = []
        for row in rows:
            sala_dict = dict(row)
            # Add transient fields expected by the frontend
            sala_dict["estado_reproduccion"] = "IDLE"
            sala_dict["volumen"] = sala_dict.get("volumen", 7.0)
            sala_dict["estado_luces"] = sala_dict.get("luces_estado", "SALA")
            sala_dict["lampara_encendida"] = bool(sala_dict.get("lampara_encendida", False))
            sala_dict["minutaje_actual_min"] = 0
            sala_dict["tiempo_restante_min"] = 120
            sala_dict["duracion_total_min"] = 120
            sala_dict["spl_db"] = 85.0
            salas.append(sala_dict)
            
        conn.close()
        return salas

'''

# Insert it before the first @app.get
first_get_idx = content.find('@app.get("/api/librerias/contenido")')
if first_get_idx != -1:
    content = content[:first_get_idx] + api_salas_code + content[first_get_idx:]

with open('main.py', 'w') as f:
    f.write(content)
