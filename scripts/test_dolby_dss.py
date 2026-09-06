import socket
import sys
import xml.etree.ElementTree as ET

def test_dolby_soap(ip, port=61408):
    """
    Realiza una petición SOAP básica al Servidor Dolby DSS220.
    Basado en los esquemas XSD proporcionados: http://www.dolby.com/dcinema/ws/smi/v1/...
    Intenta solicitar el estado de transporte (TransportState).
    """
    print(f"\n[*] ----------------------------------------------------")
    print(f"[*] INICIANDO TEST SOAP: Dolby DSS220 -> {ip}:{port}")
    print(f"[*] ----------------------------------------------------")
    
    # Envelope SOAP mínimo basado en los namespaces estándar de Dolby SMI
    # Intentamos una petición getPlaybackState (asumiendo el endpoint PlaybackControlService)
    soap_body = """<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope 
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
    xmlns:v1="http://www.dolby.com/dcinema/ws/smi/v1">
    <soapenv:Header/>
    <soapenv:Body>
        <v1:getPlaybackStateRequest/>
    </soapenv:Body>
</soapenv:Envelope>"""

    # Construir la petición HTTP POST manual
    # La API de Dolby normalmente escucha en /dcinema/ws/smi/v1/PlaybackControlService
    http_request = (
        f"POST /dcinema/ws/smi/v1/PlaybackControlService HTTP/1.1\r\n"
        f"Host: {ip}:{port}\r\n"
        f"Content-Type: text/xml; charset=utf-8\r\n"
        f"Content-Length: {len(soap_body)}\r\n"
        f"SOAPAction: \"\"\r\n"
        f"Connection: close\r\n\r\n"
        f"{soap_body}"
    )

    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(5.0)
        
        print("[*] 1. Estableciendo conexión TCP...")
        s.connect((ip, port))
        print("[+] Conexión TCP (Puerto 61408) establecida.")
        
        print("[*] 2. Enviando petición HTTP POST con sobre SOAP (getPlaybackState)...")
        s.sendall(http_request.encode('utf-8'))
        
        print("[*] 3. Esperando respuesta SOAP del Servidor Dolby...")
        response = b""
        while True:
            chunk = s.recv(4096)
            if not chunk:
                break
            response += chunk
            
        s.close()
        
        if response:
            resp_str = response.decode('utf-8', errors='ignore')
            print("\n[+] RESPUESTA RECIBIDA:")
            
            # Separar cabeceras HTTP del cuerpo XML
            parts = resp_str.split("\r\n\r\n", 1)
            headers = parts[0]
            xml_body = parts[1] if len(parts) > 1 else ""
            
            # Mostrar la primera línea de las cabeceras (ej. HTTP/1.1 200 OK)
            print(f"    -> Status: {headers.splitlines()[0]}")
            
            if xml_body:
                print(f"    -> Body: {xml_body[:300]}... [truncado]")
                
                # Intentar buscar el estado basándonos en tu XSD
                if "PLAYING" in xml_body:
                    print("    -> [!] ESTADO DETECTADO EN XML: PLAYING")
                elif "STOPPED" in xml_body:
                    print("    -> [!] ESTADO DETECTADO EN XML: STOPPED")
                elif "READY" in xml_body:
                    print("    -> [!] ESTADO DETECTADO EN XML: READY")
                elif "Fault" in xml_body:
                    print("    -> [!] ERROR SOAP DETECTADO (Fault). La ruta o método podría requerir autenticación o ser distinto.")
            else:
                print("    -> Respuesta HTTP sin cuerpo (Cuerpo vacío).")
                
            return True
        else:
            print("[-] Conexión cerrada sin enviar respuesta.")
            
    except Exception as e:
        print(f"[-] ERROR: {e}")
        
    return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 test_dolby_dss.py <IP_SERVIDOR_DOLBY>")
        sys.exit(1)
        
    test_dolby_soap(sys.argv[1])
