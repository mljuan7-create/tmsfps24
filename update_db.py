import sqlite3
import re

# UPDATE EXISTING DATABASE
conn = sqlite3.connect('cinema_tms.db')
cur = conn.cursor()

# Update Sala 1
cur.execute("""
    UPDATE salas SET 
        tipo_servidor = 'GDC SR-1000',
        ip_servidor = '10.100.47.11',
        ip_ingesta_servidor = '192.168.168.11',
        modelo_proyector = 'CHRISTIE CP4450-RGB',
        ip_proyector = '10.100.47.13',
        ip_ingesta_proyector = '192.168.168.13',
        puerto_proyector = 3002
    WHERE id = 1
""")

# Update Salas 2-10
for i in range(2, 11):
    if i in [2, 3, 4]:
        modelo_prj = 'NEC NC 3200S'
    elif i in [6, 8, 10]:
        modelo_prj = 'NEC NC 2000C'
    else:
        modelo_prj = 'NEC NC 1200C'
        
    cur.execute(f"""
        UPDATE salas SET 
            tipo_servidor = 'DOLBY DSS220',
            ip_servidor = '10.100.47.{i}1',
            ip_ingesta_servidor = '192.168.168.{i}1',
            modelo_proyector = '{modelo_prj}',
            ip_proyector = '10.100.47.{i}3',
            ip_ingesta_proyector = '192.168.168.{i}3',
            puerto_proyector = 43728
        WHERE id = {i}
    """)

# Update Librerías FTP
cur.execute("DELETE FROM librerias_ftp")
ftp_data = [
    ('lms_ymagis', 'LMS Ymagis', '192.168.168.4', 21, 'lmsuser', 'lmsuser', '/dcp/', 'FTP'),
    ('box_deluxe', 'Box By Deluxe', '192.168.168.2', 21, 'inbox', 'iGNFow2l8Q', '/', 'FTP'),
    ('movietransit', 'MovieTransit', '192.168.168.111', 21, 'ingest', 'ingest', '/', 'FTP')
]
cur.executemany("""
    INSERT INTO librerias_ftp (libreria_key, nombre, ip, puerto, usuario, clave, ruta_raiz, tipo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
""", ftp_data)

conn.commit()
conn.close()
print("Database updated!")

# FIX MAIN.PY TO MATCH
with open('main.py', 'r') as f:
    content = f.read()

# I will just regex replace the exact strings in main.py for FTPs
# Ymagis
content = re.sub(r"'lms_ymagis', 'LMS Ymagis', '192\.168\.168\.4', 21, 'ftp', 'ftp', '/'", 
                 r"'lms_ymagis', 'LMS Ymagis', '192.168.168.4', 21, 'lmsuser', 'lmsuser', '/dcp/'", content)
# Box By Deluxe
content = re.sub(r"'box_deluxe', 'Box By Deluxe', '192\.168\.168\.2', 21, 'ftp', 'ftp', '/'",
                 r"'box_deluxe', 'Box By Deluxe', '192.168.168.2', 21, 'inbox', 'iGNFow2l8Q', '/'", content)
# MovieTransit
content = re.sub(r"'movietransit', 'MovieTransit', '192\.168\.168\.111', 21, 'ftp', 'ftp', '/'",
                 r"'movietransit', 'MovieTransit', '192.168.168.111', 21, 'ingest', 'ingest', '/'", content)

with open('main.py', 'w') as f:
    f.write(content)

