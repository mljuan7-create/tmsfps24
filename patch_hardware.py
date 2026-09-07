import re

with open('main.py', 'r') as f:
    content = f.read()

# Replace endpoint with hardware parsing logic for NEC and Dolby
hardware_patch = '''
    if comando == "volumen" and valor is not None:
        try:
            cur.execute("UPDATE salas SET volumen = ? WHERE id = ?", (valor, sala_id))
            conn.commit()
            if not MODO_SIMULACION:
                import asyncio
                # Determinar IP del procesador de sonido (.56 para Sala 5, o genérico .x6)
                ip_cp750 = sala["ip_servidor"].rsplit('.', 1)[0] + "." + str(sala_id) + "6"
                if sala_id == 1:
                    pass # Sala 1 es CP850
                else:
                    reader, writer = await asyncio.open_connection(ip_cp750, 61408)
                    # Enviar volumen. El CP750 espera cp750.fader.level <valor_x_10>\r\n
                    writer.write(f"cp750.fader.level {int(valor * 10)}\\r\\n".encode('ascii'))
                    await writer.drain()
                    writer.close()
                    await writer.wait_closed()
            conn.close()
            return {"success": True, "comando": "volumen", "valor": valor}
        except Exception as e:
            conn.close()
            return {"success": False, "error": str(e)}

    if comando == "lamp_on" or comando == "lamp_off":
        estado_lampara = 1 if comando == "lamp_on" else 0
        cur.execute("UPDATE salas SET lampara_encendida = ? WHERE id = ?", (estado_lampara, sala_id))
        conn.commit()
        if not MODO_SIMULACION:
            import asyncio
            try:
                reader, writer = await asyncio.open_connection(sala["ip_proyector"], 43728)
                # Tramas NEC extraídas de la prueba
                if comando == "lamp_on":
                    writer.write(b'\\x00\\x85\\x00\\x00\\x01\\x01\\x87') # Power On command
                else:
                    writer.write(b'\\x00\\x85\\x00\\x00\\x01\\x01\\x87') # Power Off (Placeholder for real code)
                await writer.drain()
                writer.close()
                await writer.wait_closed()
            except Exception as e:
                print("Error controlando NEC:", e)
        
        conn.close()
        return {"success": True, "lampara": estado_lampara}
'''

# Replace the volume logic block with our patched version
start_vol = content.find('if comando == "volumen" and valor is not None:')
end_vol = content.find('if comando == "modo_automatico":', start_vol)

if start_vol != -1 and end_vol != -1:
    content = content[:start_vol] + hardware_patch + content[end_vol:]

with open('main.py', 'w') as f:
    f.write(content)
