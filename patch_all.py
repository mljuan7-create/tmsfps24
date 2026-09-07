import re
import sqlite3

# 1. UPDATE DB SCHEMA MANUALLY TO ENSURE COLUMNS EXIST
try:
    conn = sqlite3.connect('cinema_tms.db')
    cur = conn.cursor()
    try: cur.execute("ALTER TABLE salas ADD COLUMN volumen REAL DEFAULT 7.0")
    except: pass
    try: cur.execute("ALTER TABLE salas ADD COLUMN modo_automatico INTEGER DEFAULT 1")
    except: pass
    try: cur.execute("ALTER TABLE salas ADD COLUMN luces_estado TEXT DEFAULT 'OFF'")
    except: pass
    conn.commit()
    conn.close()
except Exception as e:
    print("DB Alter error:", e)


# 2. PATCH MAIN.PY
with open('main.py', 'r') as f:
    content = f.read()

schema_patch = """
    if "volumen" not in columnas_salas:
        cur.execute("ALTER TABLE salas ADD COLUMN volumen REAL DEFAULT 7.0")
    if "modo_automatico" not in columnas_salas:
        cur.execute("ALTER TABLE salas ADD COLUMN modo_automatico INTEGER DEFAULT 1")
    if "luces_estado" not in columnas_salas:
        cur.execute("ALTER TABLE salas ADD COLUMN luces_estado TEXT DEFAULT 'OFF'")
"""
if "ALTER TABLE salas ADD COLUMN volumen" not in content:
    content = content.replace('if "minutaje_actual_min" not in columnas_salas:\n        cur.execute("ALTER TABLE salas ADD COLUMN minutaje_actual_min INTEGER DEFAULT 0")', 
        'if "minutaje_actual_min" not in columnas_salas:\n        cur.execute("ALTER TABLE salas ADD COLUMN minutaje_actual_min INTEGER DEFAULT 0")' + schema_patch)

# Replace the executing command endpoint completely
start_idx = content.find('@app.post("/api/salas/{sala_id}/comando")')
if start_idx != -1:
    end_idx = content.find('# 6. POST /api/ingestas/cancelar', start_idx)
    if end_idx == -1: end_idx = content.find('@app.post("/api/kdms/cargar")', start_idx)
    if end_idx == -1: end_idx = len(content)
    
    new_endpoint = '''@app.post("/api/salas/{sala_id}/comando")
async def ejecutar_comando_sala(sala_id: int, req: dict):
    comando = req.get("comando")
    valor = req.get("valor")
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM salas WHERE id=?", (sala_id,))
    sala = cur.fetchone()
    
    if not sala:
        conn.close()
        return {"success": False, "error": "Sala no encontrada"}
        
    if comando == "volumen" and valor is not None:
        try:
            cur.execute("UPDATE salas SET volumen = ? WHERE id = ?", (valor, sala_id))
            conn.commit()
            if not MODO_SIMULACION:
                import asyncio
                reader, writer = await asyncio.open_connection(sala["ip_servidor"], 8080)
                writer.write(f"cp750.fader.level {int(valor * 10)}\\r\\n".encode('ascii'))
                await writer.drain()
                writer.close()
                await writer.wait_closed()
            conn.close()
            return {"success": True, "comando": "volumen", "valor": valor}
        except Exception as e:
            conn.close()
            return {"success": False, "error": str(e)}
            
    if comando == "modo_automatico":
        cur.execute("UPDATE salas SET modo_automatico = ? WHERE id = ?", (1 if valor else 0, sala_id))
        conn.commit()
        conn.close()
        return {"success": True}
        
    if comando == "macro":
        # Simulador de delay de dímeros para las luces (Fase amarilla en Dashboard)
        if valor in ["LUCES 100%", "LUCES 50%", "Techo ON", "Limpieza"]:
            import threading
            def turn_on_lights():
                c = get_db_connection()
                c.execute("UPDATE salas SET luces_estado = 'ON' WHERE id = ?", (sala_id,))
                c.commit()
                c.close()
            # Simula tiempo de rampa de dímero (2 segundos)
            threading.Timer(2.0, turn_on_lights).start()
        elif valor in ["LUCES 0%", "Techo OFF"]:
            cur.execute("UPDATE salas SET luces_estado = 'OFF' WHERE id = ?", (sala_id,))
            conn.commit()
        
        conn.close()
        return {"success": True, "macro": valor}
        
    conn.close()
    return {"success": True}

'''
    content = content[:start_idx] + new_endpoint + content[end_idx:]

with open('main.py', 'w') as f:
    f.write(content)

