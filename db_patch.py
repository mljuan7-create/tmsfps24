import re

with open('main.py', 'r') as f:
    content = f.read()

# Replace the initial setup
db_pattern = re.compile(r'cur\.execute\("INSERT OR IGNORE INTO salas.*?cur\.execute\("INSERT OR IGNORE INTO librerias_ftp.*?\)', re.DOTALL)

new_db = '''
    # INVENTARIO REAL PARQUE ASTUR
    # Sala 1: GDC, Christie
    cur.execute("""INSERT OR IGNORE INTO salas 
        (id, nombre, ip_servidor, tipo_servidor, puerto_servidor, server_serial, ip_proyector, modelo_proyector, puerto_proyector, procesador_sonido, puerto_sonido, estado_reproduccion, almacenamiento_total_gb, almacenamiento_libre_gb)
        VALUES (1, 'Sala 1', '192.168.1.101', 'GDC SR-6400C', 80, 'GDC-001', '192.168.1.111', 'Christie CP4440-RGB', 3002, 'Dolby CP850', 8080, 'IDLE', 4000, 3100)
    """)
    # Salas 2 a 10: Dolby DSS220, NEC
    for i in range(2, 11):
        cur.execute(f"""INSERT OR IGNORE INTO salas 
            (id, nombre, ip_servidor, tipo_servidor, puerto_servidor, server_serial, ip_proyector, modelo_proyector, puerto_proyector, procesador_sonido, puerto_sonido, estado_reproduccion, almacenamiento_total_gb, almacenamiento_libre_gb)
            VALUES ({i}, 'Sala {i}', '192.168.1.10{i}', 'Dolby DSS220', 8080, 'DSS220-{i}', '192.168.1.11{i}', 'NEC', 7000, 'Dolby CP750', 61408, 'IDLE', 2000, 1500)
        """)
        
    # Librerías FTP Reales
    cur.execute("""INSERT OR IGNORE INTO librerias_ftp (libreria_key, nombre, ip, puerto, usuario, clave, ruta_raiz, tipo) VALUES
        ('lms_ymagis', 'LMS Ymagis', '192.168.168.4', 21, 'ftp', 'ftp', '/', 'FTP'),
        ('box_deluxe', 'Box By Deluxe', '192.168.168.2', 21, 'ftp', 'ftp', '/', 'FTP'),
        ('movietransit', 'MovieTransit', '192.168.168.111', 21, 'ftp', 'ftp', '/', 'FTP')
    """)
'''

if db_pattern.search(content):
    content = db_pattern.sub(new_db, content)
else:
    # Append it at the end just in case, but it's risky. Let's replace the whole init function if we can.
    init_func_pattern = re.compile(r'def init_database.*?# 5\. Insertar items por defecto', re.DOTALL)
    if init_func_pattern.search(content):
        # Already has it
        pass

with open('main.py', 'w') as f:
    f.write(content)
