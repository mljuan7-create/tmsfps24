import socket
import sys
import time

def test_dolby_cp750(ip, port=61408):
    """
    Prueba de conexión raw al Procesador de Sonido Dolby CP750.
    Basado en los scripts de auditoría de James Gardiner.
    El CP750 responde a comandos ASCII terminados en CRLF por el puerto 61408.
    """
    print(f"\n[*] ----------------------------------------------------")
    print(f"[*] INICIANDO TEST: Dolby CP750 -> {ip}:{port}")
    print(f"[*] ----------------------------------------------------")
    try:
        # Socket TCP
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(5.0) # Timeout prudencial de 5 segundos
        
        print("[*] 1. Estableciendo conexión TCP...")
        s.connect((ip, port))
        print("[+] Conexión establecida correctamente.")
        
        # Enviar comando de diagnóstico básico. 
        # Solicita la versión del sistema o el formato actual.
        comando = b"cp750.sys.info ?\r\n"
        print(f"[*] 2. Enviando payload ASCII: {comando.strip()}")
        s.sendall(comando)
        
        print("[*] 3. Esperando respuesta del equipo...")
        data = s.recv(1024)
        
        if data:
            respuesta = data.decode('ascii', errors='ignore').strip()
            print(f"[+] ÉXITO! Respuesta recibida del procesador:")
            print(f"    -> {respuesta}")
        else:
            print("[-] El equipo aceptó la conexión pero no devolvió datos.")
            
        s.close()
        return True
        
    except socket.timeout:
        print("[-] ERROR: Timeout. El equipo no respondió en el puerto 61408.")
        print("    -> Revisa que la IP sea correcta y el procesador esté encendido.")
    except ConnectionRefusedError:
        print("[-] ERROR: Conexión rechazada (Connection Refused).")
        print("    -> El puerto 61408 está cerrado o bloqueado por red.")
    except Exception as e:
        print(f"[-] ERROR INESPERADO: {e}")
    
    return False

def test_nec_projector(ip, port=7000):
    """
    Prueba de conexión básica al Proyector NEC (NC1200C / NC2000C / NC3200S).
    Utiliza el puerto de control TCP (habitualmente 7000 para API serial-over-IP).
    """
    print(f"\n[*] ----------------------------------------------------")
    print(f"[*] INICIANDO TEST: Proyector NEC -> {ip}:{port}")
    print(f"[*] ----------------------------------------------------")
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(5.0)
        
        print("[*] 1. Estableciendo conexión TCP (Control Port)...")
        s.connect((ip, port))
        print("[+] Conexión TCP establecida correctamente al Proyector NEC.")
        
        # Para NEC, enviar un comando de estado de lámpara básico o status request
        # El protocolo de NEC usa una cabecera hexadecimal específica, pero a nivel
        # de test de red, validar que el socket se abre y acepta comandos es el 90% del trabajo.
        payload_test = bytes.fromhex("00 00 00 00") # Payload "dummy" de test
        print(f"[*] 2. Enviando sondaje hexadecimal de prueba (0x00000000)...")
        s.sendall(payload_test)
        
        print("[*] 3. Esperando acuse de recibo de red...")
        data = s.recv(1024)
        if data:
            hex_data = " ".join([f"{b:02x}" for b in data])
            print(f"[+] ÉXITO! El proyector respondió:")
            print(f"    -> HEX: {hex_data}")
        else:
            print("[!] El puerto está abierto, pero el proyector cortó/ignoró el paquete dummy (Comportamiento normal de NEC ante comandos incompletos).")
            print("[+] CONFIRMADO: Comunicación de red con el proyector FUNCIONA.")
            
        s.close()
        return True

    except Exception as e:
        print(f"[-] ERROR al conectar con el proyector NEC: {e}")
    
    return False

if __name__ == "__main__":
    print("=========================================================")
    print("  HERRAMIENTA DE DIAGNÓSTICO FÍSICO - TMS PARQUE ASTUR   ")
    print("=========================================================")
    
    if len(sys.argv) < 2:
        print("Uso: python test_ping_cabina.py <IP_DEL_EQUIPO> [tipo: dolby | nec]")
        print("Ejemplo: python test_ping_cabina.py 10.100.47.21")
        sys.exit(1)
        
    target_ip = sys.argv[1]
    
    tipo = "ambos"
    if len(sys.argv) == 3:
        tipo = sys.argv[2].lower()
        
    if tipo in ["dolby", "ambos"]:
        test_dolby_cp750(target_ip, 61408)
        
    if tipo in ["nec", "ambos"]:
        test_nec_projector(target_ip, 7000)
        
    print("\n[i] Diagnóstico finalizado.")
