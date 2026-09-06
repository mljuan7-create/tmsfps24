with open("/app/applet/main.py", "r") as f:
    content = f.read()

old_listar = """    @app.get("/api/salas")
    def listar_salas():
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM salas ORDER BY id ASC")
        rows = [dict(r) for r in cur.fetchall()]
        conn.close()
        return rows"""

new_listar = """    @app.get("/api/salas")
    def listar_salas():
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM salas ORDER BY id ASC")
        rows = [dict(r) for r in cur.fetchall()]
        
        if not MODO_SIMULACION:
            # Encuesta real a los servidores Dolby
            actualizados = False
            for row in rows:
                if row["tipo_servidor"] == "DOLBY DSS220":
                    res = dolby_get_playback_state(row["ip_servidor"])
                    if res.get("status") == "success":
                        estado_raw = res.get("state", "UNKNOWN")
                        # Mapear estados del Dolby a los de nuestra app (PLAYING, IDLE, PAUSED, STOPPED)
                        estado_mapped = estado_raw
                        if estado_raw in ("READY", "STOPPED", "UNKNOWN"):
                            estado_mapped = "IDLE"
                        
                        if estado_mapped != row["estado_reproduccion"] and estado_mapped in ("PLAYING", "IDLE", "PAUSED", "STOPPED"):
                            cur.execute("UPDATE salas SET estado_reproduccion = ? WHERE id = ?", (estado_mapped, row["id"]))
                            row["estado_reproduccion"] = estado_mapped
                            actualizados = True
            
            if actualizados:
                conn.commit()
                
        conn.close()
        return rows"""

content = content.replace(old_listar, new_listar)

with open("/app/applet/main.py", "w") as f:
    f.write(content)
