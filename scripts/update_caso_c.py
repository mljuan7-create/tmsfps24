with open("/app/applet/main.py", "r") as f:
    content = f.read()

old_code = """            # CASO C: Ingesta Inmediata en Sala Desocupada ('IDLE') -> Ciclo Dolby XSD
            else:
                nuevo_libre = max(0.0, sala["almacenamiento_libre_gb"] - tamano_gb)
                cur.execute("UPDATE salas SET almacenamiento_libre_gb = ? WHERE id = ?", (nuevo_libre, s_id))

                cur.execute(\"\"\"
                INSERT INTO cola_ingestas (
                    sala_id, contenido_id, estado, dolby_xsd_state, modo_horario,
                    programado_para, creado_en, progreso, velocidad_mbs, advertencia, mensaje
                ) VALUES (?, ?, 'PENDING', 'PENDING', 'ahora', 'Inmediata', ?, 0.0, 0.0, NULL, ?)
                \"\"\", (
                    s_id, c_id, creado_en,
                    f"Iniciando handshake FTP DCI con {nombre_sala} ({sala['ip_servidor']})..."
                ))
                ingesta_id = cur.lastrowid
                tareas_para_simular.append(ingesta_id)

                ingestas_registradas.append({
                    "id": ingesta_id,
                    "sala_id": s_id,
                    "sala_nombre": nombre_sala,
                    "contenido_id": c_id,
                    "contenido_titulo": titulo_contenido,
                    "estado": "PENDING",
                    "dolby_xsd_state": "PENDING",
                    "modo": "ahora",
                    "progreso": 0.0
                })"""

new_code = """            # CASO C: Ingesta Inmediata en Sala Desocupada ('IDLE') -> Ciclo Dolby XSD
            else:
                nuevo_libre = max(0.0, sala["almacenamiento_libre_gb"] - tamano_gb)
                cur.execute("UPDATE salas SET almacenamiento_libre_gb = ? WHERE id = ?", (nuevo_libre, s_id))

                if not MODO_SIMULACION and sala["tipo_servidor"] == "DOLBY DSS220":
                    import re
                    ip_match = re.search(r'\((\d+\.\d+\.\d+\.\d+)\)', contenido['fuente_ftp'])
                    ftp_ip = ip_match.group(1) if ip_match else "192.168.168.4"
                    ftp_user, ftp_pass = "anonymous", "anonymous"
                    for lib in LIBRERIAS_FTP_CONFIG.values():
                        if lib["ip"] == ftp_ip:
                            ftp_user = lib["usuario"]
                            ftp_pass = lib["clave"]
                            break
                    
                    ruta_base = contenido.get('ruta_ymagis') or '/dcp'
                    ftp_url = f"ftp://{ftp_ip}{ruta_base}/{contenido['titulo']}/"
                    
                    tid = dolby_transfer_content(sala["ip_servidor"], ftp_url, ftp_user, ftp_pass)
                    mensaje = f"Ingesta SOAP iniciada. TransferID: {tid}" if tid else f"Fallo al iniciar ingesta SOAP en {sala['ip_servidor']}"
                    
                    cur.execute(\"\"\"
                    INSERT INTO cola_ingestas (
                        sala_id, contenido_id, estado, dolby_xsd_state, modo_horario,
                        programado_para, creado_en, progreso, velocidad_mbs, advertencia, mensaje
                    ) VALUES (?, ?, 'IN_PROGRESS', 'IN_PROGRESS', 'ahora', 'Inmediata', ?, 5.0, 0.0, NULL, ?)
                    \"\"\", (s_id, c_id, creado_en, mensaje))
                    ingesta_id = cur.lastrowid
                    
                    ingestas_registradas.append({
                        "id": ingesta_id,
                        "sala_id": s_id,
                        "sala_nombre": nombre_sala,
                        "contenido_id": c_id,
                        "contenido_titulo": titulo_contenido,
                        "estado": "IN_PROGRESS",
                        "dolby_xsd_state": "IN_PROGRESS",
                        "modo": "ahora",
                        "progreso": 5.0,
                        "transfer_id": tid
                    })
                else:
                    cur.execute(\"\"\"
                    INSERT INTO cola_ingestas (
                        sala_id, contenido_id, estado, dolby_xsd_state, modo_horario,
                        programado_para, creado_en, progreso, velocidad_mbs, advertencia, mensaje
                    ) VALUES (?, ?, 'PENDING', 'PENDING', 'ahora', 'Inmediata', ?, 0.0, 0.0, NULL, ?)
                    \"\"\", (
                        s_id, c_id, creado_en,
                        f"Iniciando handshake FTP DCI con {nombre_sala} ({sala['ip_servidor']})..."
                    ))
                    ingesta_id = cur.lastrowid
                    tareas_para_simular.append(ingesta_id)

                    ingestas_registradas.append({
                        "id": ingesta_id,
                        "sala_id": s_id,
                        "sala_nombre": nombre_sala,
                        "contenido_id": c_id,
                        "contenido_titulo": titulo_contenido,
                        "estado": "PENDING",
                        "dolby_xsd_state": "PENDING",
                        "modo": "ahora",
                        "progreso": 0.0
                    })"""

if old_code in content:
    with open("/app/applet/main.py", "w") as f:
        f.write(content.replace(old_code, new_code))
    print("Success")
else:
    print("Failed to find old code.")
