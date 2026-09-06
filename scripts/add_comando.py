import re

with open("/app/applet/main.py", "r") as f:
    content = f.read()

endpoint_code = """
    # 7B. POST /api/salas/{sala_id}/comando (Enviar comandos SOAP a Dolby)
    @app.post("/api/salas/{sala_id}/comando")
    def enviar_comando_sala(sala_id: int, req: Dict[str, Any] = Body(...)):
        comando = req.get("comando")
        if comando not in ("play", "pause", "stop", "next", "previous"):
            raise HTTPException(status_code=400, detail="Comando inválido")

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM salas WHERE id = ?", (sala_id,))
        sala = cur.fetchone()
        conn.close()

        if not sala:
            raise HTTPException(status_code=404, detail="Sala no encontrada")

        if not MODO_SIMULACION and sala["tipo_servidor"] == "DOLBY DSS220":
            exito = dolby_send_command(sala["ip_servidor"], comando)
            return {"sala_id": sala_id, "comando": comando, "exito": exito, "modo": "PRODUCCION"}
        else:
            # Simulación: simplemente forzamos el toggle_estado si es play/stop
            if comando == "play":
                toggle_estado_sala(sala_id) # Para simular
            return {"sala_id": sala_id, "comando": comando, "exito": True, "modo": "SIMULACION"}
"""

content = content.replace("    # 8. GET /api/cola-ingestas (Estado oficial XSD de Dolby)", endpoint_code + "\n    # 8. GET /api/cola-ingestas (Estado oficial XSD de Dolby)")

with open("/app/applet/main.py", "w") as f:
    f.write(content)

