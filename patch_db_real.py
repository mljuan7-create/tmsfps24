import re
import sqlite3

with open('main.py', 'r') as f:
    content = f.read()

# Replace the initial setup
db_pattern = re.compile(r'cur\.execute\("""INSERT OR IGNORE INTO salas.*?cur\.execute\("""INSERT OR IGNORE INTO librerias_ftp.*?\)', re.DOTALL)

new_db = '''cur.execute("""INSERT OR IGNORE INTO salas 
        (id, nombre, ip_servidor, tipo_servidor, puerto_servidor, server_serial, ip_proyector, modelo_proyector, puerto_proyector, procesador_sonido, puerto_sonido, estado_reproduccion, almacenamiento_total_gb, almacenamiento_libre_gb)
        VALUES (1, 'Sala 1', '10.100.47.11', 'GDC SR-1000', 80, 'GDC-001', '10.100.47.13', 'Christie CP4450-RGB', 3002, 'Dolby CP850', 8080, 'IDLE', 4000, 3100)
    """)
    # Salas 2 a 10: Dolby DSS220, NEC
    for i in range(2, 11):
        if i in [2, 3, 4]: 
            modelo_prj = 'NEC NC 3200S'
        elif i in [6, 8, 10]:
            modelo_prj = 'NEC NC 2000C'
        else:
            modelo_prj = 'NEC NC 1200C'
            
        cur.execute(f"""INSERT OR IGNORE INTO salas 
            (id, nombre, ip_servidor, tipo_servidor, puerto_servidor, server_serial, ip_proyector, modelo_proyector, puerto_proyector, procesador_sonido, puerto_sonido, estado_reproduccion, almacenamiento_total_gb, almacenamiento_libre_gb)
            VALUES ({i}, 'Sala {i}', '10.100.47.{i}1', 'Dolby DSS220', 8080, 'DSS220-{i}', '10.100.47.{i}3', '{modelo_prj}', 43728, 'Dolby CP750', 61408, 'IDLE', 2000, 1500)
        """)
        
    # Librerías FTP Reales
    cur.execute("""INSERT OR IGNORE INTO librerias_ftp (libreria_key, nombre, ip, puerto, usuario, clave, ruta_raiz, tipo) VALUES
        ('lms_ymagis', 'LMS Ymagis', '192.168.168.4', 21, 'lmsuser', 'lmsuser', '/dcp/', 'FTP'),
        ('box_deluxe', 'Box By Deluxe', '192.168.168.2', 21, 'inbox', 'iGNFow2l8Q', '/', 'FTP'),
        ('movietransit', 'MovieTransit', '192.168.168.111', 21, 'ingest', 'ingest', '/', 'FTP')
    """)
'''

if db_pattern.search(content):
    content = db_pattern.sub(new_db, content)
else:
    print("Pattern not found!")

with open('main.py', 'w') as f:
    f.write(content)

