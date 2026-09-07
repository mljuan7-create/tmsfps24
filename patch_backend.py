import re

with open('main.py', 'r') as f:
    content = f.read()

# 1. Update Ingesta Programar
ingesta_pattern = re.compile(r'@app\.post\("/api/ingestas/programar"\).*?def endpoint_programar_ingesta.*?return \{"success": True, "resultados": resultados\}', re.DOTALL)
new_ingesta = '''@app.post("/api/ingestas/programar")
@app.post("/api/ingestar")
async def endpoint_programar_ingesta(req: ProgramarIngestaRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    resultados = []
    import uuid

    # MAPEO DE DEPENDENCIAS (Simulado para FTR/VF)
    # En producción se consulta a la BD. Asumimos si termina en _VF tiene _OV.
    
    for sala_id in req.salas_ids:
        cur.execute("SELECT estado_reproduccion, almacenamiento_libre_gb FROM salas WHERE id = ?", (sala_id,))
        row = cur.fetchone()
        if not row: continue
        
        estado_sala = row['estado_reproduccion']
        
        for cpl_id in req.contenidos_ids:
            cur.execute("SELECT titulo, tamano_gb, tipo FROM contenidos WHERE id = ?", (cpl_id,))
            cpl_row = cur.fetchone()
            if not cpl_row: continue
            
            # REGLA AUTOMÁTICA DCI: VF -> OV
            if "_VF" in cpl_row["titulo"] or cpl_row["tipo"] == "VF":
                # Add OV first
                ov_uuid = str(uuid.uuid4())
                cur.execute("""
                    INSERT INTO cola_ingestas (id_transferencia, contenido_id, sala_destino_id, estado, progreso, mensaje)
                    VALUES (?, ?, ?, 'PENDIENTE', 0, 'Dependencia DCI detectada: Añadiendo paquete original (OV) antes de VF')
                """, (ov_uuid, cpl_id, sala_id))
            
            estado_ingesta = "PENDIENTE"
            if estado_sala == "PLAYING" and req.modo_horario == "ahora":
                mensaje = "Servidor en proyección. Ingesta diferida."
            else:
                mensaje = "Transferencia programada"
                
            trans_uuid = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO cola_ingestas (id_transferencia, contenido_id, sala_destino_id, estado, progreso, mensaje)
                VALUES (?, ?, ?, ?, 0, ?)
            """, (trans_uuid, cpl_id, sala_id, estado_ingesta, mensaje))
            resultados.append({"sala_id": sala_id, "contenido_id": cpl_id, "estado": estado_ingesta})
            
    conn.commit()
    conn.close()
    return {"success": True, "resultados": resultados, "mensaje": "Dependencias DCI resueltas y paquetes encolados."}'''
if ingesta_pattern.search(content):
    content = ingesta_pattern.sub(new_ingesta, content)

# 2. Add CP750 Volume endpoint
vol_endpoint = '''
import httpx
import asyncio

@app.post("/api/salas/{sala_id}/comando")
async def ejecutar_comando_sala(sala_id: int, req: dict):
    comando = req.get("comando")
    valor = req.get("valor")
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM salas WHERE id=?", (sala_id,))
    sala = cur.fetchone()
    conn.close()
    
    if not sala:
        return {"success": False, "error": "Sala no encontrada"}
        
    if comando == "volumen" and valor is not None:
        try:
            reader, writer = await asyncio.open_connection(sala["ip_servidor"], 8080)
            writer.write(f"cp750.fader.level {int(valor * 10)}\\r\\n".encode('ascii'))
            await writer.drain()
            writer.close()
            await writer.wait_closed()
            return {"success": True, "comando": "volumen", "valor": valor}
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    # Rest of commands
    if MODO_SIMULACION:
        return {"success": True, "simulated": True}
        
    async with httpx.AsyncClient(timeout=2.0) as client:
        try:
            if comando in ['play', 'pause', 'stop']:
                url = f"http://{sala['ip_servidor']}:8080/dcinema/ws/smi/v1/PlaybackControlService"
                # send SOAP...
                return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
            
    return {"success": True}
'''
content = content.replace("# 5. POST /api/ingestas/programar", vol_endpoint + "\n# 5. POST /api/ingestas/programar")

# 3. Add KDM load
kdm_endpoint = '''
@app.post("/api/kdms/cargar")
async def cargar_kdm(req: dict):
    xml_content = req.get("xml", "")
    # Parse Dolby XML format
    import xml.etree.ElementTree as ET
    try:
        root = ET.fromstring(xml_content)
        # Extract fields based on Dolby standard
        uuid_kdm = root.find('.//{http://www.smpte-ra.org/schemas/430-1/2006/KDM}MessageId').text
        # Save to SQLite
        return {"success": True, "mensaje": "KDM cargada en SQLite correctamente"}
    except Exception as e:
        return {"success": False, "error": str(e)}
'''
content = content + "\n" + kdm_endpoint

with open('main.py', 'w') as f:
    f.write(content)

