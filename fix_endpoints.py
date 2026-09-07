with open('main.py', 'r') as f:
    lines = f.readlines()

import re

# Find the start of the messed up endpoint
start_idx = -1
for i, line in enumerate(lines):
    if line.strip().startswith('@app.post("/api/salas/{sala_id}/comando")'):
        start_idx = i
        break

if start_idx != -1:
    # Find end index
    end_idx = -1
    for i in range(start_idx, len(lines)):
        if lines[i].strip() == 'if __name__ == "__main__":':
            end_idx = i
            break
            
    if end_idx != -1:
        new_endpoint = '''    @app.post("/api/salas/{sala_id}/comando")
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
            if valor in ["LUCES 100%", "LUCES 50%", "Techo ON", "Limpieza"]:
                import threading
                def turn_on_lights():
                    c = get_db_connection()
                    c.execute("UPDATE salas SET luces_estado = 'ON' WHERE id = ?", (sala_id,))
                    c.commit()
                    c.close()
                threading.Timer(2.0, turn_on_lights).start()
            elif valor in ["LUCES 0%", "Techo OFF"]:
                cur.execute("UPDATE salas SET luces_estado = 'OFF' WHERE id = ?", (sala_id,))
                conn.commit()
            
            conn.close()
            return {"success": True, "macro": valor}
            
        conn.close()
        return {"success": True}
'''
        lines = lines[:start_idx] + [new_endpoint, '\n'] + lines[end_idx:]

with open('main.py', 'w') as f:
    f.writelines(lines)
