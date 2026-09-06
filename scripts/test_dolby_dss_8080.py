import socket
import sys

def test_dolby_soap(ip, port=8080):
    print(f"[*] Conectando al DSS220 en {ip}:{port}...")
    
    # Hemos cambiado el namespace de la peticion (v1_0) vs el del envoltorio (v1)
    # basándonos estrictamente en la sintaxis del WSDL.
    soap_body = """<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope 
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
    xmlns:v1="http://www.dolby.com/dcinema/ws/smi/v1_0">
    <soapenv:Header/>
    <soapenv:Body>
        <v1:getPlaybackStateRequest/>
    </soapenv:Body>
</soapenv:Envelope>"""

    http_req = (
        f"POST /dcinema/ws/smi/v1/PlaybackControlService HTTP/1.1\r\n"
        f"Host: {ip}:{port}\r\n"
        f"Content-Type: text/xml; charset=utf-8\r\n"
        f"Content-Length: {len(soap_body)}\r\n"
        f"SOAPAction: \"http://www.dolby.com/dcinema/ws/smi/v1/getPlaybackState\"\r\n"
        f"Connection: close\r\n\r\n"
        f"{soap_body}"
    )

    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(5.0)
        s.connect((ip, port))
        s.sendall(http_req.encode('utf-8'))
        
        response = b""
        while True:
            chunk = s.recv(4096)
            if not chunk: break
            response += chunk
            
        s.close()
        
        if response:
            resp_str = response.decode('utf-8', errors='ignore')
            parts = resp_str.split("\r\n\r\n", 1)
            print(f"[+] RESPUESTA DEL DOLBY: {parts[0].splitlines()[0]}")
            if len(parts) > 1:
                print(f"[+] DATOS XML: \n{parts[1][:500]}")
        else:
            print("[-] El Dolby no respondió nada.")
            
    except Exception as e:
        print(f"[-] ERROR: {e}")

if __name__ == "__main__":
    test_dolby_soap(sys.argv[1])
