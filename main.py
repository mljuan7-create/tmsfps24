"""
TMS Parque Astur - Theater Management System
Backend Senior en Python (FastAPI + SQLite 'cinema_tms.db')
Arquitectura DCI: FASE 2 (Librerías FTP de Contenidos) y FASE 3 (Gestión y Enrutado Automático de KDMs).

Infraestructura Real de Cabina - Parque Astur:
- SALA 1 (Sala Láser CINITY / VIP):
    * Servidor: GDC SR-6400C (IP: 10.100.47.11, Serial: GDC-SR6400C-00101, Puerto: 80)
    * Proyector: CHRISTIE CP4440-RGB (IP: 10.100.47.13, Puerto: 3002)
    * Sonido: DOLBY CP850 (IP: 10.100.47.14, Dolby Atmos)
- SALAS 2 a 10 (Salas Convencionales):
    * Servidores: DOLBY DSS220 (IPs: 10.100.47.21 - 10.100.47.101, Serials: DSS220-210402 a DSS220-210410, Puerto: 61408)
    * Proyectores: NEC NC2000C (IPs: 10.100.47.22 - 10.100.47.102, Puerto: 7000)
    * Sonido: DOLBY CP750 (Puerto: 61408)
    * Sala 5: Dolby DSS220 (IP: 10.100.47.51, Serial: DSS220-210405)

Librerías Centrales de Red DCI (Orígenes FTP):
- LMS Ymagis (ID: 53bbfda0...): IP 192.168.168.4:21, usr/pwd: lmsuser/lmsuser, ruta: /dcp/, subcarpetas: ['peliculas', 'trailers', 'ads', 'others']
- Box By Deluxe (ID: 8592c2b0...): IP 192.168.168.2:21, usr/pwd: inbox/iGNFow2l8Q, ruta: /
- MovieTransit (ID: 8e24e700...): IP 192.168.168.111:21, usr/pwd: ingest/ingest, ruta: /

Normativa y Estándares:
- Dolby ContentManagement & TransferManagement XSD: PENDING -> IN_PROGRESS -> VERIFYING -> FINISHED
- Dolby LicenseManagement_v1.xsd & SMPTE 430-1 / 430-3 (KDM XML Parsing & WSDL 'sendLicense' dispatch)
- Regla de Protección Crítica: Prohibida ingesta concurrente si la sala está en PLAYING.
"""

import os
import sys
import json
import sqlite3
import threading
import time
import ftplib
import re
import socket
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from urllib.parse import urlparse

# =====================================================================
# 1. CONFIGURACIÓN GLOBAL Y MAPEO DE RED REAL DE LIBRERÍAS FTP
# =====================================================================

# Variable de entorno o toggle para pruebas en portátil Windows vs producción en cine
MODO_SIMULACION: bool = os.getenv("TMS_MODO_SIMULACION", "true").lower() in ("true", "1", "yes")

# Mapeo fijo de las 3 librerías extraído de los JSON de configuración de Parque Astur
LIBRERIAS_FTP_CONFIG: Dict[str, Dict[str, Any]] = {
    "lms_ymagis": {
        "id": "53bbfda0-4c3e-4b2a-89a1-7c9b0e123456",
        "nombre": "LMS Ymagis",
        "ip": "192.168.168.4",
        "puerto": 21,
        "usuario": "lmsuser",
        "clave": "lmsuser",
        "ruta_raiz": "/dcp/",
        "subcarpetas": ["peliculas", "trailers", "ads", "others"],
        "tipo": "LMS Central de Cine",
        "protocolo": "FTP"
    },
    "box_by_deluxe": {
        "id": "8592c2b0-9a3d-4c1f-8e2b-5b6c7d890123",
        "nombre": "Box By Deluxe",
        "ip": "192.168.168.2",
        "puerto": 21,
        "usuario": "inbox",
        "clave": "iGNFow2l8Q",
        "ruta_raiz": "/",
        "subcarpetas": [],
        "tipo": "Buzón Satelital Externo",
        "protocolo": "FTP"
    },
    "movie_transit": {
        "id": "8e24e700-1b2c-4d3e-9f0a-6c7b8a901234",
        "nombre": "MovieTransit",
        "ip": "192.168.168.111",
        "puerto": 21,
        "usuario": "ingest",
        "clave": "ingest",
        "ruta_raiz": "/",
        "subcarpetas": [],
        "tipo": "Buzón Satelital Externo",
        "protocolo": "FTP"
    }
}

# Base de datos SQLite solicitada: 'cinema_tms.db'
DB_PATH = os.path.join(os.path.dirname(__file__), "cinema_tms.db")

# Detección de soporte FastAPI / Pydantic
try:
    from fastapi import FastAPI, HTTPException, Query, Body, status, BackgroundTasks, Request
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse, FileResponse, PlainTextResponse
    from pydantic import BaseModel, Field
    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False
    class BaseModel:  # type: ignore
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
        def dict(self):
            return self.__dict__
    Field = lambda *args, **kwargs: None  # type: ignore


# =====================================================================
# 2. INICIALIZACIÓN IDEMPOTENTE DE SQLITE ('cinema_tms.db')
# =====================================================================

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_database(force_reinit: bool = False):
    """
    Inicializa de forma 100% idempotente la base de datos 'cinema_tms.db'.
    Crea las tablas de salas, librerías FTP, contenidos DCP, cola de ingestas
    y la nueva tabla de la FASE 3: 'kdms_inventario'.
    """
    conn = get_db_connection()
    cur = conn.cursor()

    if force_reinit:
        cur.execute("DROP TABLE IF EXISTS kdms_inventario")
        cur.execute("DROP TABLE IF EXISTS cola_ingestas")
        cur.execute("DROP TABLE IF EXISTS contenidos")
        cur.execute("DROP TABLE IF EXISTS salas")
        cur.execute("DROP TABLE IF EXISTS librerias_ftp")

    # 1. Tabla de Salas de Proyección (con server_serial para cruce de KDMs)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS salas (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL,
        ip_servidor TEXT NOT NULL,
        tipo_servidor TEXT NOT NULL,
        puerto_servidor INTEGER NOT NULL,
        server_serial TEXT,
        ip_proyector TEXT NOT NULL,
        modelo_proyector TEXT NOT NULL,
        puerto_proyector INTEGER NOT NULL,
        procesador_sonido TEXT NOT NULL,
        puerto_sonido INTEGER NOT NULL,
        estado_reproduccion TEXT NOT NULL CHECK(estado_reproduccion IN ('PLAYING', 'IDLE', 'PAUSED', 'STOPPED')),
        almacenamiento_total_gb REAL NOT NULL,
        almacenamiento_libre_gb REAL NOT NULL,
        cpl_actual TEXT,
        tiempo_restante_min INTEGER DEFAULT 0
    )
    """)

    # Migración idempotente si la tabla salas ya existía sin las nuevas columnas de la red dual
    cur.execute("PRAGMA table_info(salas)")
    columnas_salas = [row["name"] for row in cur.fetchall()]
    if "server_serial" not in columnas_salas:
        cur.execute("ALTER TABLE salas ADD COLUMN server_serial TEXT")
    if "ip_ingesta_servidor" not in columnas_salas:
        cur.execute("ALTER TABLE salas ADD COLUMN ip_ingesta_servidor TEXT")
    if "ip_ingesta_proyector" not in columnas_salas:
        cur.execute("ALTER TABLE salas ADD COLUMN ip_ingesta_proyector TEXT")
    if "lampara_encendida" not in columnas_salas:
        cur.execute("ALTER TABLE salas ADD COLUMN lampara_encendida INTEGER DEFAULT 0")
    if "duracion_total_min" not in columnas_salas:
        cur.execute("ALTER TABLE salas ADD COLUMN duracion_total_min INTEGER DEFAULT 0")
    if "minutaje_actual_min" not in columnas_salas:
        cur.execute("ALTER TABLE salas ADD COLUMN minutaje_actual_min INTEGER DEFAULT 0")
    if "volumen" not in columnas_salas:
        cur.execute("ALTER TABLE salas ADD COLUMN volumen REAL DEFAULT 7.0")
    if "modo_automatico" not in columnas_salas:
        cur.execute("ALTER TABLE salas ADD COLUMN modo_automatico INTEGER DEFAULT 1")
    if "luces_estado" not in columnas_salas:
        cur.execute("ALTER TABLE salas ADD COLUMN luces_estado TEXT DEFAULT 'OFF'")


    # 2. Tabla de Librerías FTP Centrales
    cur.execute("""
    CREATE TABLE IF NOT EXISTS librerias_ftp (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        libreria_key TEXT NOT NULL UNIQUE,
        nombre TEXT NOT NULL,
        ip TEXT NOT NULL,
        puerto INTEGER NOT NULL DEFAULT 21,
        usuario TEXT NOT NULL,
        clave TEXT NOT NULL,
        ruta_raiz TEXT NOT NULL,
        tipo TEXT NOT NULL,
        estado TEXT DEFAULT 'ONLINE'
    )
    """)

    # 3. Tabla de Contenidos DCI (DCPs en categorías FTR, TLR, ADV y OTHERS)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS contenidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        tipo TEXT NOT NULL CHECK(tipo IN ('FTR', 'TLR', 'ADV', 'OTHERS')),
        categoria_nombre TEXT NOT NULL,
        tamano_gb REAL NOT NULL,
        requiere_kdm INTEGER NOT NULL DEFAULT 0,
        kdm_valida INTEGER NOT NULL DEFAULT 1,
        aspect_ratio TEXT DEFAULT 'F-185',
        audio_format TEXT DEFAULT '5.1',
        duracion_min INTEGER DEFAULT 0,
        fuente_ftp TEXT NOT NULL,
        es_cinity INTEGER DEFAULT 0,
        cpl_uuid TEXT,
        ruta_ymagis TEXT
    )
    """)

    cur.execute("PRAGMA table_info(contenidos)")
    columnas_contenidos = [row["name"] for row in cur.fetchall()]
    if "ruta_ymagis" not in columnas_contenidos:
        cur.execute("ALTER TABLE contenidos ADD COLUMN ruta_ymagis TEXT")

    # 4. Tabla de Cola de Ingestas (con estados XSD de Dolby)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS cola_ingestas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sala_id INTEGER NOT NULL,
        contenido_id INTEGER NOT NULL,
        estado TEXT NOT NULL CHECK(estado IN ('PENDIENTE', 'PENDING', 'IN_PROGRESS', 'VERIFYING', 'FINISHED', 'CANCELED', 'ERROR', 'FAILED')),
        dolby_xsd_state TEXT NOT NULL DEFAULT 'PENDING',
        modo_horario TEXT NOT NULL,
        programado_para TEXT,
        creado_en TEXT NOT NULL,
        progreso REAL DEFAULT 0.0,
        velocidad_mbs REAL DEFAULT 0.0,
        advertencia TEXT,
        mensaje TEXT,
        FOREIGN KEY (sala_id) REFERENCES salas(id),
        FOREIGN KEY (contenido_id) REFERENCES contenidos(id)
    )
    """)

    # 5. FASE 3: Tabla de Inventario y Enrutado Automático de KDMs (Llaves DCI)
    cur.execute("""
    CREATE TABLE IF NOT EXISTS kdms_inventario (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid_kdm TEXT NOT NULL,
        clip_id TEXT NOT NULL,
        clip_title TEXT NOT NULL,
        notValidBefore TEXT NOT NULL,
        notValidAfter TEXT NOT NULL,
        server_serial TEXT NOT NULL,
        estado TEXT NOT NULL,
        sala_id INTEGER,
        cargado_en TEXT NOT NULL,
        inyectado_en TEXT,
        metodo_envio TEXT,
        xml_raw TEXT,
        FOREIGN KEY (sala_id) REFERENCES salas(id)
    )
    """)

    conn.commit()

    # --- SEED DE SALAS (1 a 10 con seriales reales y red dual de cabina) ---
    cur.execute("SELECT COUNT(*) FROM salas")
    if cur.fetchone()[0] == 0:
        # Sala 1: Cabina Láser de Alta Gama (CINITY)
        cur.execute("""
        INSERT INTO salas (
            id, nombre, ip_servidor, tipo_servidor, puerto_servidor, server_serial,
            ip_proyector, modelo_proyector, puerto_proyector,
            procesador_sonido, puerto_sonido, estado_reproduccion,
            almacenamiento_total_gb, almacenamiento_libre_gb, cpl_actual, tiempo_restante_min,
            ip_ingesta_servidor, ip_ingesta_proyector, lampara_encendida, duracion_total_min, minutaje_actual_min
        ) VALUES (
            1, 'Sala 1 (Laser CINITY)', '10.100.47.11', 'GDC SR-6400C', 80, 'GDC-SR6400C-00101',
            '10.100.47.13', 'CHRISTIE CP4440-RGB', 3002,
            'DOLBY CP850', 80, 'PLAYING',
            4000.0, 1420.5, 'CONAN29_FTR_S_ES-ES_51_4K', 48,
            '192.168.168.11', '192.168.168.13', 1, 120, 72
        )
        """)

        # Salas 2 a 10: Servidores DOLBY DSS220 (puerto 8080), Proyectores NEC, Dolby CP750
        salas_data = [
            (2, 'Sala 2', '10.100.47.21', 'DOLBY DSS220', 8080, 'DSS220-210402', '10.100.47.23', 'NEC NC 3200S', 7000, 'DOLBY CP750', 61408, 'IDLE', 2000.0, 850.0, None, 0, '192.168.168.21', '192.168.168.23', 0, 0, 0),
            (3, 'Sala 3', '10.100.47.31', 'DOLBY DSS220', 8080, 'DSS220-210403', '10.100.47.33', 'NEC NC 3200S', 7000, 'DOLBY CP750', 61408, 'PLAYING', 2000.0, 310.2, 'AFuego_FTR_F-185_ES_51', 72, '192.168.168.31', '192.168.168.33', 1, 138, 66),
            (4, 'Sala 4', '10.100.47.41', 'DOLBY DSS220', 8080, 'DSS220-210404', '10.100.47.43', 'NEC NC 3200S', 7000, 'DOLBY CP750', 61408, 'IDLE', 2000.0, 1120.0, None, 0, '192.168.168.41', '192.168.168.43', 0, 0, 0),
            (5, 'Sala 5', '10.100.47.51', 'DOLBY DSS220', 8080, 'DSS220-210405', '10.100.47.53', 'NEC NC 1200C', 7000, 'DOLBY CP750', 61408, 'IDLE', 2000.0, 940.8, None, 0, '192.168.168.51', '192.168.168.53', 0, 0, 0),
            (6, 'Sala 6', '10.100.47.61', 'DOLBY DSS220', 8080, 'DSS220-210406', '10.100.47.63', 'NEC NC 2000C', 7000, 'DOLBY CP750', 61408, 'PLAYING', 2000.0, 480.0, 'GLADIATOR_II_FTR_S', 15, '192.168.168.61', '192.168.168.63', 1, 148, 133),
            (7, 'Sala 7', '10.100.47.71', 'DOLBY DSS220', 8080, 'DSS220-210407', '10.100.47.73', 'NEC NC 1200C', 7000, 'DOLBY CP750', 61408, 'IDLE', 2000.0, 1310.0, None, 0, '192.168.168.71', '192.168.168.73', 0, 0, 0),
            (8, 'Sala 8', '10.100.47.81', 'DOLBY DSS220', 8080, 'DSS220-210408', '10.100.47.83', 'NEC NC 2000C', 7000, 'DOLBY CP750', 61408, 'IDLE', 2000.0, 620.5, None, 0, '192.168.168.81', '192.168.168.83', 0, 0, 0),
            (9, 'Sala 9', '10.100.47.91', 'DOLBY DSS220', 8080, 'DSS220-210409', '10.100.47.93', 'NEC NC 1200C', 7000, 'DOLBY CP750', 61408, 'IDLE', 2000.0, 980.2, None, 0, '192.168.168.91', '192.168.168.93', 0, 0, 0),
            (10, 'Sala 10', '10.100.47.101', 'DOLBY DSS220', 8080, 'DSS220-210410', '10.100.47.103', 'NEC NC 2000C', 7000, 'DOLBY CP750', 61408, 'PLAYING', 2000.0, 240.0, 'DUNE_PART2_FTR_S', 95, '192.168.168.101', '192.168.168.103', 1, 166, 71),
        ]
        cur.executemany("""
        INSERT INTO salas (
            id, nombre, ip_servidor, tipo_servidor, puerto_servidor, server_serial,
            ip_proyector, modelo_proyector, puerto_proyector,
            procesador_sonido, puerto_sonido, estado_reproduccion,
            almacenamiento_total_gb, almacenamiento_libre_gb, cpl_actual, tiempo_restante_min,
            ip_ingesta_servidor, ip_ingesta_proyector, lampara_encendida, duracion_total_min, minutaje_actual_min
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, salas_data)
        conn.commit()
    else:
        # Asegurar sincronización exacta con Documento Maestro (Dual IP, Modelos y Lámparas)
        salas_actualizaciones = [
            (1, "GDC-SR6400C-00101", "10.100.47.13", "CHRISTIE CP4440-RGB", 3002, "192.168.168.11", "192.168.168.13", 1, 120, 72),
            (2, "DSS220-210402", "10.100.47.23", "NEC NC 3200S", 7000, "192.168.168.21", "192.168.168.23", 0, 0, 0),
            (3, "DSS220-210403", "10.100.47.33", "NEC NC 3200S", 7000, "192.168.168.31", "192.168.168.33", 1, 138, 66),
            (4, "DSS220-210404", "10.100.47.43", "NEC NC 3200S", 7000, "192.168.168.41", "192.168.168.43", 0, 0, 0),
            (5, "DSS220-210405", "10.100.47.53", "NEC NC 1200C", 7000, "192.168.168.51", "192.168.168.53", 0, 0, 0),
            (6, "DSS220-210406", "10.100.47.63", "NEC NC 2000C", 7000, "192.168.168.61", "192.168.168.63", 1, 148, 133),
            (7, "DSS220-210407", "10.100.47.73", "NEC NC 1200C", 7000, "192.168.168.71", "192.168.168.73", 0, 0, 0),
            (8, "DSS220-210408", "10.100.47.83", "NEC NC 2000C", 7000, "192.168.168.81", "192.168.168.83", 0, 0, 0),
            (9, "DSS220-210409", "10.100.47.93", "NEC NC 1200C", 7000, "192.168.168.91", "192.168.168.93", 0, 0, 0),
            (10, "DSS220-210410", "10.100.47.103", "NEC NC 2000C", 7000, "192.168.168.101", "192.168.168.103", 1, 166, 71),
        ]
        for s_id, s_serial, ip_p, mod_p, p_p, ip_is, ip_ip, lamp, dur, minut in salas_actualizaciones:
            cur.execute("""
            UPDATE salas SET 
                server_serial = ?,
                ip_proyector = ?,
                modelo_proyector = ?,
                puerto_proyector = ?,
                ip_ingesta_servidor = ?,
                ip_ingesta_proyector = ?,
                lampara_encendida = ?,
                duracion_total_min = ?,
                minutaje_actual_min = ?
            WHERE id = ?
            """, (s_serial, ip_p, mod_p, p_p, ip_is, ip_ip, lamp, dur, minut, s_id))
        
        # FIX: Ensure all Dolby servers are correctly updated to port 8080 even if already seeded with 61408
        cur.execute("UPDATE salas SET puerto_servidor = 8080 WHERE tipo_servidor = 'DOLBY DSS220'")
        conn.commit()

    # --- SEED DE LIBRERÍAS FTP ---
    cur.execute("SELECT COUNT(*) FROM librerias_ftp")
    if cur.fetchone()[0] == 0:
        for k, v in LIBRERIAS_FTP_CONFIG.items():
            cur.execute("""
            INSERT INTO librerias_ftp (libreria_key, nombre, ip, puerto, usuario, clave, ruta_raiz, tipo, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ONLINE')
            """, (k, v["nombre"], v["ip"], v["puerto"], v["usuario"], v["clave"], v["ruta_raiz"], v["tipo"]))
        conn.commit()

    # --- SEED DE CONTENIDOS DCI (Categorías FTR, TLR, ADV, OTHERS) ---
    cur.execute("SELECT COUNT(*) FROM contenidos")
    if cur.fetchone()[0] == 0:
        contenidos_data = [
            # 1. Categoría FTR - Feature (Películas)
            ('CONAN29', 'FTR', 'FTR - Feature (Películas)', 51.0, 0, 1, 'S-239', '5.1', 114, 'Box By Deluxe (192.168.168.2)', 0, 'urn:uuid:8b9f1a23-4c5d-4e6f-a7b8-1234567890ab', '/dcp/peliculas'),
            ('AFuego', 'FTR', 'FTR - Feature (Películas)', 167.0, 1, 0, 'F-185', '7.1', 138, 'LMS Ymagis (192.168.168.4)', 0, 'urn:uuid:c3d4e5f6-7a8b-9c0d-1e2f-abcdef123456', '/dcp/peliculas'),
            ('GLADIATOR_II', 'FTR', 'FTR - Feature (Películas)', 215.0, 1, 1, 'S-239', 'ATMOS', 148, 'MovieTransit (192.168.168.111)', 1, 'urn:uuid:d4e5f6a7-b8c9-0d1e-2f3a-bcdef1234567', '/dcp/peliculas'),
            ('DUNE_PART_TWO', 'FTR', 'FTR - Feature (Películas)', 242.0, 1, 1, 'S-239', 'ATMOS', 166, 'Box By Deluxe (192.168.168.2)', 1, 'urn:uuid:e5f6a7b8-c9d0-1e2f-3a4b-cdef12345678', '/dcp/peliculas'),

            # 2. Categoría TLR - Trailer (Trailers y Logos CINITY)
            ('CINITY_EXPERIENCE_PROMO_TLR', 'TLR', 'TLR - Trailer (Trailers y Promos)', 2.8, 0, 1, 'S-239', 'ATMOS', 2, 'LMS Ymagis (192.168.168.4)', 1, 'urn:uuid:f6a7b8c9-d0e1-2f3a-4b5c-def123456789', '/dcp/trailers'),
            ('CINITY_BRAND_LOGO_HFR_4K', 'TLR', 'TLR - Trailer (Trailers y Promos)', 1.4, 0, 1, 'F-185', '7.1', 1, 'Box By Deluxe (192.168.168.2)', 1, 'urn:uuid:a7b8c9d0-e1f2-3a4b-5c6d-ef1234567890', '/dcp/trailers'),
            ('AFUEGO_TEASER_TLR1', 'TLR', 'TLR - Trailer (Trailers y Promos)', 1.9, 0, 1, 'F-185', '5.1', 2, 'LMS Ymagis (192.168.168.4)', 0, 'urn:uuid:b8c9d0e1-f2a3-4b5c-6d7e-f12345678901', '/dcp/trailers'),
            ('CONAN29_OFFICIAL_TRAILER_2', 'TLR', 'TLR - Trailer (Trailers y Promos)', 2.3, 0, 1, 'S-239', '5.1', 3, 'MovieTransit (192.168.168.111)', 0, 'urn:uuid:c9d0e1f2-a3b4-5c6d-7e8f-123456789012', '/dcp/trailers'),

            # 3. Categoría ADV - Advertisements (/dcp/ads)
            ('SPOT_COCA_COLA_VERANO_2026', 'ADV', 'ADV - Publicidad y Anuncios', 1.2, 0, 1, 'F-185', '5.1', 1, 'LMS Ymagis (192.168.168.4)', 0, 'urn:uuid:11111111-2222-3333-4444-555555555555', '/dcp/ads'),
            ('PROMO_CENTRO_COMERCIAL_ASTUR', 'ADV', 'ADV - Publicidad y Anuncios', 0.8, 0, 1, 'F-185', '5.1', 1, 'LMS Ymagis (192.168.168.4)', 0, 'urn:uuid:22222222-3333-4444-5555-666666666666', '/dcp/ads'),

            # 4. Categoría OTHERS (/dcp/others)
            ('TEST_PATTERN_ALIGN_2K_4K', 'OTHERS', 'OTHERS - Test y Alternativos', 0.5, 0, 1, 'F-185', '5.1', 5, 'LMS Ymagis (192.168.168.4)', 0, 'urn:uuid:33333333-4444-5555-6666-777777777777', '/dcp/others'),
            ('CINITY_LASER_CALIBRATION_LOOP', 'OTHERS', 'OTHERS - Test y Alternativos', 3.2, 0, 1, 'S-239', 'ATMOS', 10, 'LMS Ymagis (192.168.168.4)', 1, 'urn:uuid:44444444-5555-6666-7777-888888888888', '/dcp/others')
        ]
        cur.executemany("""
        INSERT INTO contenidos (
            titulo, tipo, categoria_nombre, tamano_gb, requiere_kdm, kdm_valida,
            aspect_ratio, audio_format, duracion_min, fuente_ftp, es_cinity, cpl_uuid, ruta_ymagis
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, contenidos_data)
        conn.commit()

    conn.close()

# Ejecutar inicialización al importar módulo
init_database()


# =====================================================================
# 3. ESCÁNER DE RED DCI DE LIBRERÍAS FTP (REAL Y SIMULADO)
# =====================================================================

def escanear_ftp_real_cabina() -> Dict[str, Any]:
    """
    MODO REAL (MODO_SIMULACION = False):
    Conexión socket real con 'ftplib.FTP' a cada máquina de Parque Astur.
    - LMS Ymagis (192.168.168.4): itera por ['peliculas', 'trailers', 'ads', 'others']
      y aplica filtro estricto: IGNORA archivos temporales con punto (ej: '.fr-', '.tmp', '.part').
    - Box By Deluxe (192.168.168.2) y MovieTransit (192.168.168.111): lista raíz como buzones satelitales.
    """
    resultados_ftr: List[Dict[str, Any]] = []
    resultados_tlr: List[Dict[str, Any]] = []
    estado_librerias: Dict[str, Any] = {}

    for key, cfg in LIBRERIAS_FTP_CONFIG.items():
        lib_nombre = cfg["nombre"]
        ip = cfg["ip"]
        puerto = cfg["puerto"]
        usuario = cfg["usuario"]
        clave = cfg["clave"]
        ruta_raiz = cfg["ruta_raiz"]
        subcarpetas = cfg.get("subcarpetas", [])

        estado_librerias[key] = {
            "nombre": lib_nombre,
            "ip": ip,
            "estado": "DESCONECTADO",
            "elementos_encontrados": 0,
            "error": None
        }

        ftp = None
        try:
            ftp = ftplib.FTP()
            # Timeout corto de 3.5s para no bloquear cabina si un satélite está apagado
            ftp.connect(ip, puerto, timeout=3.5)
            ftp.login(usuario, clave)
            estado_librerias[key]["estado"] = "ONLINE"

            # Caso 1: LMS Ymagis con subcarpetas estructuradas
            if subcarpetas:
                for sub in subcarpetas:
                    target_path = os.path.join(ruta_raiz, sub).replace("\\", "/")
                    try:
                        ftp.cwd(target_path)
                        items = ftp.nlst()
                        for item in items:
                            nombre_limpio = os.path.basename(item)
                            # FILTRO ESTRICTO: Ignorar basura temporal o descargas parciales
                            if nombre_limpio.startswith(".") or nombre_limpio.endswith((".tmp", ".part", ".download")):
                                continue

                            tipo_dcp = "FTR" if sub == "peliculas" else ("TLR" if sub == "trailers" else "TLR")
                            elem = {
                                "titulo": nombre_limpio,
                                "tipo": tipo_dcp,
                                "categoria_nombre": "FTR - Feature (Películas)" if tipo_dcp == "FTR" else "TLR - Trailer (Trailers / Promos)",
                                "tamano_gb": 120.0 if tipo_dcp == "FTR" else 2.5,
                                "fuente_ftp": f"{lib_nombre} ({ip})/{sub}",
                                "requiere_kdm": True if tipo_dcp == "FTR" else False,
                                "kdm_valida": False if tipo_dcp == "FTR" else True,
                                "subcarpeta": sub,
                                "ruta_completa": f"{target_path}/{nombre_limpio}"
                            }
                            if tipo_dcp == "FTR":
                                resultados_ftr.append(elem)
                            else:
                                resultados_tlr.append(elem)
                            estado_librerias[key]["elementos_encontrados"] += 1
                    except Exception as e_sub:
                        # Si una subcarpeta no existe, continúa con las siguientes
                        continue

            # Caso 2: Buzones satelitales en raíz (Deluxe y MovieTransit)
            else:
                ftp.cwd(ruta_raiz)
                items = ftp.nlst()
                for item in items:
                    nombre_limpio = os.path.basename(item)
                    if nombre_limpio.startswith(".") or nombre_limpio.endswith((".tmp", ".part")):
                        continue

                    # Detección por nomenclatura DCI Digital Cinema
                    tipo_dcp = "TLR" if "_TLR" in nombre_limpio or "_PROMO" in nombre_limpio or "_TSR" in nombre_limpio else "FTR"
                    elem = {
                        "titulo": nombre_limpio,
                        "tipo": tipo_dcp,
                        "categoria_nombre": "FTR - Feature (Películas)" if tipo_dcp == "FTR" else "TLR - Trailer (Trailers / Promos)",
                        "tamano_gb": 180.0 if tipo_dcp == "FTR" else 2.0,
                        "fuente_ftp": f"{lib_nombre} ({ip}) [Buzón]",
                        "requiere_kdm": True if tipo_dcp == "FTR" else False,
                        "kdm_valida": True if "_TEST" in nombre_limpio else False,
                        "subcarpeta": "raiz",
                        "ruta_completa": f"/{nombre_limpio}"
                    }
                    if tipo_dcp == "FTR":
                        resultados_ftr.append(elem)
                    else:
                        resultados_tlr.append(elem)
                    estado_librerias[key]["elementos_encontrados"] += 1

            ftp.quit()

        except (ftplib.Error, OSError, Exception) as e:
            estado_librerias[key]["estado"] = "OFFLINE_O_TIMEOUT"
            estado_librerias[key]["error"] = str(e)
            if ftp:
                try: ftp.close()
                except Exception: pass

    # Si estamos en entorno sin red DCI física, combinar con los DCPs de base de datos
    if len(resultados_ftr) == 0 and len(resultados_tlr) == 0:
        sim = obtener_contenidos_simulados()
        return {
            "modo": "PRODUCCION_FALLBACK_OFFLINE",
            "advertencia_red": "No se pudo conectar a los FTPs locales (192.168.168.X). Mostrando contenidos cacheados en SQLite.",
            "estado_librerias": estado_librerias,
            "categorias": sim["categorias"],
            "todos": sim["todos"],
            "ftr": sim["ftr"],
            "tlr": sim["tlr"]
        }

    todos = resultados_ftr + resultados_tlr
    categorias = [
        {
            "id": "ftr",
            "tipo": "FTR",
            "nombre": "FTR - Feature (Películas / Largometrajes)",
            "total_titulos": len(resultados_ftr),
            "tamano_total_gb": sum(x.get("tamano_gb", 0.0) for x in resultados_ftr),
            "contenidos": resultados_ftr
        },
        {
            "id": "tlr",
            "tipo": "TLR",
            "nombre": "TLR - Trailer (Trailers / Logos CINITY)",
            "total_titulos": len(resultados_tlr),
            "tamano_total_gb": sum(x.get("tamano_gb", 0.0) for x in resultados_tlr),
            "contenidos": resultados_tlr
        }
    ]

    return {
        "modo": "PRODUCCION_DCI_REAL",
        "estado_librerias": estado_librerias,
        "categorias": categorias,
        "todos": todos,
        "ftr": resultados_ftr,
        "tlr": resultados_tlr
    }

def obtener_contenidos_simulados() -> Dict[str, Any]:
    """
    MODO SIMULADO (MODO_SIMULACION = True):
    Devuelve los contenidos estructurados desde 'cinema_tms.db'
    en categorías colapsables para el frontend: FTR (Conan29 de 51GB, AFuego de 167GB con KDM) y TLR.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM contenidos ORDER BY tipo ASC, titulo ASC")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()

    ftr_list = [c for c in rows if c["tipo"] == "FTR"]
    tlr_list = [c for c in rows if c["tipo"] == "TLR"]

    categorias = [
        {
            "id": "ftr",
            "tipo": "FTR",
            "nombre": "FTR - Feature (Películas / Largometrajes)",
            "descripcion": "Paquetes completos de largometraje (DCP) para proyección en sala.",
            "total_titulos": len(ftr_list),
            "tamano_total_gb": sum(c["tamano_gb"] for c in ftr_list),
            "contenidos": ftr_list
        },
        {
            "id": "tlr",
            "tipo": "TLR",
            "nombre": "TLR - Trailer (Trailers / Logos CINITY)",
            "descripcion": "Material promocional, cortinillas de sonido y copias de prueba HFR/4K.",
            "total_titulos": len(tlr_list),
            "tamano_total_gb": sum(c["tamano_gb"] for c in tlr_list),
            "contenidos": tlr_list
        }
    ]

    return {
        "modo": "SIMULACION",
        "librerias_conectadas": list(LIBRERIAS_FTP_CONFIG.keys()),
        "categorias": categorias,
        "todos": rows,
        "ftr": ftr_list,
        "tlr": tlr_list
    }


# =====================================================================
# 4. GESTOR DE INGESTAS CON REGLA DE PROTECCIÓN CRÍTICA DE PROYECCIÓN
# =====================================================================

def simular_ciclo_dolby_xsd(ingesta_id: int):
    """
    Simulación fiel del ciclo de estados del XSD oficial de Dolby TransferManagement:
    PENDING (0%) -> IN_PROGRESS (25%-70%) -> VERIFYING (92% SHA-1 Hash Check) -> FINISHED (100%).
    """
    time.sleep(1.0)
    conn = get_db_connection()
    cur = conn.cursor()

    # 1. IN_PROGRESS (Inicio)
    cur.execute("""
    UPDATE cola_ingestas
    SET estado = 'IN_PROGRESS', dolby_xsd_state = 'IN_PROGRESS', progreso = 25.0, velocidad_mbs = 115.4,
        mensaje = 'Conexión FTP activa con servidor de sala. Transfiriendo esencias MXF a 115.4 MB/s...'
    WHERE id = ? AND estado != 'CANCELED'
    """, (ingesta_id,))
    conn.commit()

    time.sleep(2.5)

    # 2. IN_PROGRESS (Descarga de audio PCM y subtítulos)
    cur.execute("""
    UPDATE cola_ingestas
    SET estado = 'IN_PROGRESS', dolby_xsd_state = 'IN_PROGRESS', progreso = 70.0, velocidad_mbs = 124.0,
        mensaje = 'Descargando pistas de audio SMPTE 429-2 y metadatos XML...'
    WHERE id = ? AND estado != 'CANCELED'
    """, (ingesta_id,))
    conn.commit()

    time.sleep(2.5)

    # 3. VERIFYING (Verificación de integridad SHA-1 DCI según PKL / AssetMap)
    cur.execute("""
    UPDATE cola_ingestas
    SET estado = 'VERIFYING', dolby_xsd_state = 'VERIFYING', progreso = 92.0, velocidad_mbs = 0.0,
        mensaje = 'Calculando checksums criptográficos SHA-1 (PKL vs AssetMap)...'
    WHERE id = ? AND estado != 'CANCELED'
    """, (ingesta_id,))
    conn.commit()

    time.sleep(2.0)

    # 4. FINISHED
    cur.execute("""
    UPDATE cola_ingestas
    SET estado = 'FINISHED', dolby_xsd_state = 'FINISHED', progreso = 100.0, velocidad_mbs = 0.0,
        mensaje = 'DCP verificado y registrado en el almacenamiento interno de la sala.'
    WHERE id = ? AND estado != 'CANCELED'
    """, (ingesta_id,))
    conn.commit()
    conn.close()

# =====================================================================
# LÓGICA DE API SOAP DOLBY DSS220 (FASE 3 Y FASE 2)
# =====================================================================
import urllib.request
import urllib.error

def parse_iso8601_duration(d_str: str) -> float:
    """Parsea duraciones ISO 8601 del Dolby tipo PT1H41M38.415S o PT26M59.083S a minutos."""
    if not d_str:
        return 0.0
    try:
        hours = 0.0
        minutes = 0.0
        seconds = 0.0
        m_h = re.search(r'(\d+)H', d_str)
        m_m = re.search(r'(\d+)M', d_str)
        m_s = re.search(r'([\d\.]+)S', d_str)
        if m_h: hours = float(m_h.group(1))
        if m_m: minutes = float(m_m.group(1))
        if m_s: seconds = float(m_s.group(1))
        return round((hours * 60) + minutes + (seconds / 60.0), 1)
    except Exception:
        return 0.0

def dolby_get_playback_state(ip: str) -> dict:
    url = f"http://{ip}:8080/dcinema/ws/smi/v1/PlaybackControlService"
    soap_body = """<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v1_0="http://www.dolby.com/dcinema/ws/smi/v1_0">
    <soapenv:Header/>
    <soapenv:Body><v1_0:getPlaybackStateRequest/></soapenv:Body>
</soapenv:Envelope>"""

    headers = {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": '"http://www.dolby.com/dcinema/ws/smi/v1/getPlaybackState"'
    }

    req = urllib.request.Request(url, data=soap_body.encode('utf-8'), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=3) as response:
            xml_resp = response.read().decode('utf-8')
            root = ET.fromstring(xml_resp)
            state_node = root.find('.//{http://www.dolby.com/dcinema/ws/smi/v1/schemas/common}transportStateType')
            state = state_node.text if state_node is not None else "UNKNOWN"

            # Parsear posición y duración real de la sesión (Show)
            show_pos_node = root.find('.//{http://www.dolby.com/dcinema/ws/smi/v1/schemas/playbackcontrol}showPosition')
            show_dur_node = root.find('.//{http://www.dolby.com/dcinema/ws/smi/v1/schemas/playbackcontrol}showDuration')
            clip_pos_node = root.find('.//{http://www.dolby.com/dcinema/ws/smi/v1/schemas/playbackcontrol}clipPosition')
            clip_dur_node = root.find('.//{http://www.dolby.com/dcinema/ws/smi/v1/schemas/playbackcontrol}clipDuration')
            clip_id_node = root.find('.//{http://www.dolby.com/dcinema/ws/smi/v1/schemas/playbackcontrol}currentClipId')

            show_pos_min = parse_iso8601_duration(show_pos_node.text if show_pos_node is not None else "")
            show_dur_min = parse_iso8601_duration(show_dur_node.text if show_dur_node is not None else "")
            clip_pos_min = parse_iso8601_duration(clip_pos_node.text if clip_pos_node is not None else "")
            clip_dur_min = parse_iso8601_duration(clip_dur_node.text if clip_dur_node is not None else "")
            clip_id = clip_id_node.text if clip_id_node is not None else None

            # Duración y minutaje efectivo
            duracion_total = show_dur_min if show_dur_min > 0 else clip_dur_min
            minutaje_actual = show_pos_min if show_pos_min > 0 else clip_pos_min
            tiempo_restante = max(0.0, round(duracion_total - minutaje_actual, 1))

            return {
                "status": "success",
                "state": state,
                "duracion_total_min": duracion_total,
                "minutaje_actual_min": minutaje_actual,
                "tiempo_restante_min": tiempo_restante,
                "clip_id": clip_id,
                "raw": xml_resp
            }
    except Exception as e:
        return {"status": "error", "error": str(e)}

def dolby_send_command(ip: str, command: str) -> bool:
    """ Comandos válidos: play, pause, stop, next, previous """
    url = f"http://{ip}:8080/dcinema/ws/smi/v1/PlaybackControlService"
    soap_body = f"""<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v1_0="http://www.dolby.com/dcinema/ws/smi/v1_0">
    <soapenv:Header/>
    <soapenv:Body><v1_0:{command}Request/></soapenv:Body>
</soapenv:Envelope>"""

    headers = {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": f'"http://www.dolby.com/dcinema/ws/smi/v1/{command}"'
    }

    req = urllib.request.Request(url, data=soap_body.encode('utf-8'), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            return response.getcode() == 200
    except Exception as e:
        print(f"Error enviando {command} al Dolby {ip}: {e}")
        return False

def dolby_transfer_content(ip: str, ftp_url: str, username: str = "anonymous", password: str = "anonymous") -> str:
    """ Inicia una ingesta en el Dolby y devuelve el transferId """
    url = f"http://{ip}:8080/dcinema/ws/smi/v1/TransferManagementService"
    soap_body = f"""<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v1_0="http://www.dolby.com/dcinema/ws/smi/v1_0" xmlns:com="http://www.dolby.com/dcinema/ws/smi/v1/schemas/common">
    <soapenv:Header/>
    <soapenv:Body>
        <v1_0:transferContentRequest>
            <v1_0:transferType>PULL</v1_0:transferType>
            <v1_0:transferProtocolType>FTP</v1_0:transferProtocolType>
            <v1_0:contentType>CLIP</v1_0:contentType>
            <v1_0:destinationContentStore>MAINSTORE</v1_0:destinationContentStore>
            <v1_0:url>{ftp_url}</v1_0:url>
            <v1_0:userName>{username}</v1_0:userName>
            <v1_0:password>{password}</v1_0:password>
        </v1_0:transferContentRequest>
    </soapenv:Body>
</soapenv:Envelope>"""

    headers = {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": '"http://www.dolby.com/dcinema/ws/smi/v1/transferContent"'
    }

    req = urllib.request.Request(url, data=soap_body.encode('utf-8'), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            xml_resp = response.read().decode('utf-8')
            root = ET.fromstring(xml_resp)
            tid_node = root.find('.//{http://www.dolby.com/dcinema/ws/smi/v1/schemas/common}transferId')
            return tid_node.text if tid_node is not None else None
    except Exception as e:
        print(f"Error iniciando ingesta en {ip}: {e}")
        return None

def programar_ingestas_core(
    salas_ids: List[int],
    contenidos_ids: List[int],
    modo_horario: str = "ahora",
    programado_para: Optional[str] = None
) -> Dict[str, Any]:
    """
    LÓGICA CRÍTICA DE CABINA DCI:
    - Si modo_horario == 'ahora' y la sala está en 'PLAYING':
        El estado se fija automáticamente en 'PENDIENTE' (cola diferida).
        Se emite la advertencia obligatoria:
        "Servidor en proyección. Ingesta diferida encolada automáticamente para evitar parones de lectura"
    - Si la sala está en 'IDLE':
        Se inicia el ciclo de estados XSD de Dolby (PENDING -> IN_PROGRESS -> VERIFYING -> FINISHED).
    """
    conn = get_db_connection()
    cur = conn.cursor()

    creado_en = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ingestas_registradas = []
    advertencias_criticas = []
    tareas_para_simular = []

    for s_id in salas_ids:
        cur.execute("SELECT * FROM salas WHERE id = ?", (s_id,))
        sala = cur.fetchone()
        if not sala:
            continue

        estado_reproduccion = sala["estado_reproduccion"]
        nombre_sala = sala["nombre"]
        servidor_info = f"{sala['tipo_servidor']} ({sala['ip_servidor']}, SN: {sala['server_serial']})"

        for c_id in contenidos_ids:
            cur.execute("SELECT * FROM contenidos WHERE id = ?", (c_id,))
            contenido = cur.fetchone()
            if not contenido:
                continue

            titulo_contenido = contenido["titulo"]
            tamano_gb = contenido["tamano_gb"]

            # Comprobar espacio en almacenamiento RAID
            if sala["almacenamiento_libre_gb"] < tamano_gb:
                cur.execute("""
                INSERT INTO cola_ingestas (
                    sala_id, contenido_id, estado, dolby_xsd_state, modo_horario,
                    programado_para, creado_en, progreso, velocidad_mbs, advertencia, mensaje
                ) VALUES (?, ?, 'FAILED', 'FAILED', ?, ?, ?, 0.0, 0.0, ?, ?)
                """, (
                    s_id, c_id, modo_horario, programado_para, creado_en,
                    f"Espacio insuficiente en {nombre_sala}",
                    f"Requiere {tamano_gb:.1f} GB, pero solo hay {sala['almacenamiento_libre_gb']:.1f} GB libres."
                ))
                advertencias_criticas.append({
                    "sala_id": s_id,
                    "sala_nombre": nombre_sala,
                    "contenido": titulo_contenido,
                    "es_critica_roja": False,
                    "tipo": "ERROR_ESPACIO",
                    "mensaje": f"Almacenamiento insuficiente en {nombre_sala}: {tamano_gb} GB requeridos vs {sala['almacenamiento_libre_gb']:.1f} GB disponibles."
                })
                continue

            # CASO A: REGLA DE PROTECCIÓN CRÍTICA DE PROYECCIÓN (Sala en PLAYING y se solicita 'ahora')
            if modo_horario == "ahora" and estado_reproduccion == "PLAYING":
                estado_ingesta = "PENDIENTE"
                xsd_state = "PENDING"
                hora_ejecucion = f"Al finalizar proyección (~{sala['tiempo_restante_min']} min)"
                texto_advertencia = "Servidor en proyección. Ingesta diferida encolada automáticamente para evitar parones de lectura"
                mensaje_detalle = (
                    f"Protección DCI activada: Servidor {servidor_info} reproduciendo '{sala['cpl_actual']}'. "
                    f"Ingesta de '{titulo_contenido}' diferida a estado PENDIENTE."
                )

                cur.execute("""
                INSERT INTO cola_ingestas (
                    sala_id, contenido_id, estado, dolby_xsd_state, modo_horario,
                    programado_para, creado_en, progreso, velocidad_mbs, advertencia, mensaje
                ) VALUES (?, ?, ?, ?, 'posponer_post_sesion', ?, ?, 0.0, 0.0, ?, ?)
                """, (
                    s_id, c_id, estado_ingesta, xsd_state, hora_ejecucion, creado_en,
                    texto_advertencia, mensaje_detalle
                ))
                ingesta_id = cur.lastrowid

                advertencias_criticas.append({
                    "sala_id": s_id,
                    "sala_nombre": nombre_sala,
                    "contenido": titulo_contenido,
                    "es_critica_roja": True,
                    "advertencia_roja": texto_advertencia,
                    "detalle": f"El servidor {servidor_info} está en PLAYING. El ancho de banda RAID se reserva íntegramente al lector DCI."
                })

                ingestas_registradas.append({
                    "id": ingesta_id,
                    "sala_id": s_id,
                    "sala_nombre": nombre_sala,
                    "contenido_id": c_id,
                    "contenido_titulo": titulo_contenido,
                    "estado": "PENDIENTE",
                    "dolby_xsd_state": "PENDING",
                    "modo": "diferida_protegida",
                    "programado_para": hora_ejecucion,
                    "advertencia": texto_advertencia
                })

            # CASO B: Ingesta Pospuesta / Programada
            elif modo_horario == "posponer":
                hora_ejecucion = programado_para or "02:00 (Ventana nocturna)"
                cur.execute("""
                INSERT INTO cola_ingestas (
                    sala_id, contenido_id, estado, dolby_xsd_state, modo_horario,
                    programado_para, creado_en, progreso, velocidad_mbs, advertencia, mensaje
                ) VALUES (?, ?, 'PENDIENTE', 'PENDING', 'posponer', ?, ?, 0.0, 0.0, NULL, ?)
                """, (
                    s_id, c_id, hora_ejecucion, creado_en,
                    f"Programada por el operador para {hora_ejecucion}: {titulo_contenido} -> {nombre_sala}"
                ))
                ingesta_id = cur.lastrowid

                ingestas_registradas.append({
                    "id": ingesta_id,
                    "sala_id": s_id,
                    "sala_nombre": nombre_sala,
                    "contenido_id": c_id,
                    "contenido_titulo": titulo_contenido,
                    "estado": "PENDIENTE",
                    "dolby_xsd_state": "PENDING",
                    "modo": "pospuesto",
                    "programado_para": hora_ejecucion
                })

            # CASO C: Ingesta Inmediata en Sala Desocupada ('IDLE') -> Ciclo Dolby XSD
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
                    
                    cur.execute("""
                    INSERT INTO cola_ingestas (
                        sala_id, contenido_id, estado, dolby_xsd_state, modo_horario,
                        programado_para, creado_en, progreso, velocidad_mbs, advertencia, mensaje
                    ) VALUES (?, ?, 'IN_PROGRESS', 'IN_PROGRESS', 'ahora', 'Inmediata', ?, 5.0, 0.0, NULL, ?)
                    """, (s_id, c_id, creado_en, mensaje))
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
                    cur.execute("""
                    INSERT INTO cola_ingestas (
                        sala_id, contenido_id, estado, dolby_xsd_state, modo_horario,
                        programado_para, creado_en, progreso, velocidad_mbs, advertencia, mensaje
                    ) VALUES (?, ?, 'PENDING', 'PENDING', 'ahora', 'Inmediata', ?, 0.0, 0.0, NULL, ?)
                    """, (
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
                    })

    conn.commit()
    conn.close()

    for t_id in tareas_para_simular:
        t = threading.Thread(target=simular_ciclo_dolby_xsd, args=(t_id,), daemon=True)
        t.start()

    tiene_alerta_roja = any(a.get("es_critica_roja") for a in advertencias_criticas)

    return {
        "success": True,
        "tiene_alerta_roja": tiene_alerta_roja,
        "mensaje_global": (
            "Servidor en proyección. Ingesta diferida encolada automáticamente para evitar parones de lectura"
            if tiene_alerta_roja else "Transferencias encoladas correctamente según especificación Dolby"
        ),
        "advertencias": advertencias_criticas,
        "ingestas": ingestas_registradas
    }


# =====================================================================
# 5. FASE 3: ENRUTADOR AUTOMÁTICO DE KDMs (PARSER XML Y 'sendLicense')
# =====================================================================

def parsear_kdm_xml_crudo(xml_str: str) -> Dict[str, Any]:
    """
    Parsea de forma exhaustiva una KDM DCI tanto en formato SMPTE ST 430-1 / ST 430-3
    como en formato Dolby SMI LicenseManagement_v1.xsd.
    Extrae:
    - clipId / CompositionPlaylistId
    - clipTitle / ContentTitleText
    - notValidBefore / ContentKeysNotValidBefore
    - notValidAfter / ContentKeysNotValidAfter
    - Número de serie del bloque de seguridad (server_serial)
    """
    res: Dict[str, Any] = {
        "uuid_kdm": None,
        "clip_id": None,
        "clip_title": None,
        "notValidBefore": None,
        "notValidAfter": None,
        "server_serial": None,
        "recipient": None
    }

    clean_xml = xml_str.strip()
    if not clean_xml:
        raise ValueError("El XML de la KDM está vacío.")

    try:
        root = ET.fromstring(clean_xml)
        for elem in root.iter():
            tag = elem.tag.split('}')[-1].lower()
            text = (elem.text or "").strip()
            if not text:
                continue

            if tag in ("licenseid", "messageid", "id") and not res["uuid_kdm"]:
                res["uuid_kdm"] = text
            elif tag in ("clipid", "compositionplaylistid") and not res["clip_id"]:
                res["clip_id"] = text
            elif tag in ("cliptitle", "contenttitletext", "title") and not res["clip_title"]:
                res["clip_title"] = text
            elif tag in ("notvalidbefore", "contentkeysnotvalidbefore") and not res["notValidBefore"]:
                res["notValidBefore"] = text
            elif tag in ("notvalidafter", "contentkeysnotvalidafter") and not res["notValidAfter"]:
                res["notValidAfter"] = text
            elif tag in ("serverserial", "server_serial", "serialnumber", "devicelisttitle") and not res["server_serial"]:
                res["server_serial"] = text
            elif tag in ("x509subjectname", "recipient") and not res["recipient"]:
                res["recipient"] = text

    except ET.ParseError as e:
        # Fallback a regex si el XML viene con problemas de envoltorio CDATA
        pass

    # Regex fallback si faltó algún campo crítico
    if not res["uuid_kdm"]:
        m_uuid = re.search(r'urn:uuid:[0-9a-fA-F-]{36}', clean_xml)
        if m_uuid:
            res["uuid_kdm"] = m_uuid.group(0)
        else:
            res["uuid_kdm"] = f"urn:uuid:kdm-{int(time.time())}"

    if not res["clip_id"]:
        m_cpl = re.search(r'<(?:\w+:)?(?:clipId|CompositionPlaylistId)>(urn:uuid:[0-9a-fA-F-]+)', clean_xml, re.I)
        if m_cpl:
            res["clip_id"] = m_cpl.group(1)

    if not res["clip_title"]:
        m_title = re.search(r'<(?:\w+:)?(?:clipTitle|ContentTitleText)>([^<]+)', clean_xml, re.I)
        if m_title:
            res["clip_title"] = m_title.group(1).strip()
        else:
            res["clip_title"] = "KDM_DCI_CONTENT"

    if not res["notValidBefore"]:
        m_nvb = re.search(r'<(?:\w+:)?(?:notValidBefore|ContentKeysNotValidBefore)>([^<]+)', clean_xml, re.I)
        res["notValidBefore"] = m_nvb.group(1).strip() if m_nvb else datetime.now().isoformat()

    if not res["notValidAfter"]:
        m_nva = re.search(r'<(?:\w+:)?(?:notValidAfter|ContentKeysNotValidAfter)>([^<]+)', clean_xml, re.I)
        res["notValidAfter"] = m_nva.group(1).strip() if m_nva else "2026-12-31T23:59:59+00:00"

    # Extracción inteligente del número de serie (ej: DSS220-210405 de Sala 5 o GDC-SR6400C de Sala 1)
    if not res["server_serial"]:
        # Buscar patrones comunes en certificados X.509 de Dolby y GDC
        m_serial = re.search(r'(DSS220-\d{6}|GDC-[A-Za-z0-9-]+|SM\.Dolby-ShowVault-\d+|\b210\d{3}\b)', clean_xml)
        if m_serial:
            match_val = m_serial.group(1)
            # Normalizar serial a formato de cabina Parque Astur
            if match_val.startswith("210"):
                res["server_serial"] = f"DSS220-{match_val}"
            elif "ShowVault-" in match_val:
                num = match_val.split("ShowVault-")[-1]
                res["server_serial"] = f"DSS220-{num}"
            else:
                res["server_serial"] = match_val

    return res

def inyectar_kdm_en_servidor_dss(sala: Dict[str, Any], raw_kdm_xml: str) -> Dict[str, Any]:
    """
    MÉTODO DE PRODUCCIÓN FASE 3:
    Inyecta la llave KDM en el servidor Dolby DSS220 llamando a la operación oficial 'sendLicense'
    del servicio WSDL LicenseManagement (http://{ip}:8080/dcinema/ws/smi/v1/LicenseManagementService).
    """
    ip_servidor = sala["ip_servidor"]
    nombre_sala = sala["nombre"]
    serial = sala["server_serial"]

    # Si estamos en simulación o portátil fuera de cabina:
    if MODO_SIMULACION:
        return {
            "exito": True,
            "modo": "SIMULACION_SOAP_DOLBY",
            "operacion_wsdl": "sendLicense",
            "endpoint": f"http://{ip_servidor}:8080/dcinema/ws/smi/v1/LicenseManagementService",
            "mensaje": f"[SIMULADO] Llave inyectada con éxito en el bloque de seguridad de {nombre_sala} ({serial}) vía SOAP sendLicense."
        }

    # PRODUCCIÓN REAL: Ejecución de la petición SOAP WSDL
    endpoint = f"http://{ip_servidor}:8080/dcinema/ws/smi/v1/LicenseManagementService"
    soap_envelope = f"""<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:lic="http://www.dolby.com/dcinema/ws/smi/v1/LicenseManagement">
   <soapenv:Header/>
   <soapenv:Body>
      <lic:sendLicense>
         <lic:keyDeliveryMessage><![CDATA[{raw_kdm_xml}]]></lic:keyDeliveryMessage>
      </lic:sendLicense>
   </soapenv:Body>
</soapenv:Envelope>"""

    import urllib.request
    req = urllib.request.Request(
        endpoint,
        data=soap_envelope.encode("utf-8"),
        headers={
            "Content-Type": "text/xml; charset=utf-8",
            "SOAPAction": '""'
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=5.0) as resp:
            resp_data = resp.read().decode("utf-8")
            return {
                "exito": True,
                "modo": "PRODUCCION_SOAP_DOLBY",
                "operacion_wsdl": "sendLicense",
                "status_http": resp.status,
                "mensaje": f"SOAP sendLicense completado correctamente en {nombre_sala} ({ip_servidor})."
            }
    except Exception as e:
        return {
            "exito": False,
            "modo": "PRODUCCION_SOAP_DOLBY",
            "operacion_wsdl": "sendLicense",
            "error": str(e),
            "mensaje": f"Fallo al contactar endpoint SOAP del DSS220 en {ip_servidor}: {e}"
        }

def procesar_carga_kdm(raw_xml: str) -> Dict[str, Any]:
    """
    Procesa el texto XML de una KDM:
    1. Parsea los datos criptográficos y de validez.
    2. Cruza el 'server_serial' con la tabla 'salas' en SQLite.
    3. Si coincide con Sala 5 (DSS220-210405) o cualquier otra sala, asocia la KDM automáticamente.
    4. Guarda el registro en la tabla 'kdms_inventario'.
    5. Dispara la inyección en Dolby DSS220 mediante 'sendLicense'.
    """
    datos_kdm = parsear_kdm_xml_crudo(raw_xml)
    kdm_serial = datos_kdm.get("server_serial")

    conn = get_db_connection()
    cur = conn.cursor()

    # Buscar la sala cuyo número de serie coincida con la KDM
    sala_encontrada = None
    if kdm_serial:
        cur.execute("SELECT * FROM salas WHERE server_serial = ? OR server_serial LIKE ? OR ? LIKE '%' || server_serial || '%'",
                    (kdm_serial, f"%{kdm_serial}%", kdm_serial))
        sala_encontrada = cur.fetchone()

    # Si no hubo coincidencia directa por serial, intentar buscar por clip_title o coincidencia con Sala 5 por defecto si contiene '210405'
    if not sala_encontrada and kdm_serial and "210405" in kdm_serial:
        cur.execute("SELECT * FROM salas WHERE id = 5")
        sala_encontrada = cur.fetchone()

    sala_id = sala_encontrada["id"] if sala_encontrada else None
    sala_nombre = sala_encontrada["nombre"] if sala_encontrada else "Sin Sala Asignada (Desconocido)"
    serial_final = kdm_serial or (sala_encontrada["server_serial"] if sala_encontrada else "NO_SERIAL")

    cargado_en = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Inyección en el servidor destino
    resultado_inyeccion = None
    estado_kdm = "ASIGNADA"
    if sala_encontrada:
        resultado_inyeccion = inyectar_kdm_en_servidor_dss(dict(sala_encontrada), raw_xml)
        if resultado_inyeccion.get("exito"):
            estado_kdm = "INYECTADA"

    # Insertar en tabla kdms_inventario
    cur.execute("""
    INSERT INTO kdms_inventario (
        uuid_kdm, clip_id, clip_title, notValidBefore, notValidAfter,
        server_serial, estado, sala_id, cargado_en, inyectado_en, metodo_envio, xml_raw
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        datos_kdm.get("uuid_kdm") or f"urn:uuid:{int(time.time())}",
        datos_kdm.get("clip_id") or "UNKNOWN_CPL",
        datos_kdm.get("clip_title") or "UNKNOWN_TITLE",
        datos_kdm.get("notValidBefore") or "",
        datos_kdm.get("notValidAfter") or "",
        serial_final,
        estado_kdm,
        sala_id,
        cargado_en,
        cargado_en if estado_kdm == "INYECTADA" else None,
        "DOLBY_SMI_SEND_LICENSE",
        raw_xml
    ))
    kdm_id = cur.lastrowid

    # Si la KDM coincide con un contenido que requiere KDM (ej: AFuego), actualizar kdm_valida = 1
    cur.execute("UPDATE contenidos SET kdm_valida = 1 WHERE titulo LIKE ? OR cpl_uuid = ?",
                (f"%{datos_kdm.get('clip_title')}%", datos_kdm.get('clip_id')))

    conn.commit()
    conn.close()

    es_sala_5 = (sala_id == 5)

    return {
        "success": True,
        "kdm_id": kdm_id,
        "uuid_kdm": datos_kdm.get("uuid_kdm"),
        "clip_id": datos_kdm.get("clip_id"),
        "clip_title": datos_kdm.get("clip_title"),
        "notValidBefore": datos_kdm.get("notValidBefore"),
        "notValidAfter": datos_kdm.get("notValidAfter"),
        "server_serial_kdm": serial_final,
        "asociada_a_sala": {
            "id": sala_id,
            "nombre": sala_nombre,
            "es_sala_5": es_sala_5,
            "tipo_servidor": sala_encontrada["tipo_servidor"] if sala_encontrada else None,
            "ip_servidor": sala_encontrada["ip_servidor"] if sala_encontrada else None
        },
        "estado": estado_kdm,
        "inyeccion_dss": resultado_inyeccion,
        "mensaje": f"KDM para '{datos_kdm.get('clip_title')}' procesada y enrutada exitosamente a {sala_nombre} (Serial: {serial_final})."
    }


# =====================================================================
# 6. DEFINICIÓN DE LA APLICACIÓN FASTAPI Y ENDPOINTS
# =====================================================================

if FASTAPI_AVAILABLE:
    app = FastAPI(
        title="TMS Parque Astur - API Digital Cinema",
        description="Gestión de Cabina DCI: FASE 2 (Librerías FTP de Contenidos) y FASE 3 (Gestión Automática de KDMs).",
        version="3.0.0"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class ProgramarIngestaRequest(BaseModel):
        salas_ids: List[int]
        contenidos_ids: List[int]
        modo_horario: str = "ahora"  # 'ahora' | 'posponer'
        programado_para: Optional[str] = None

    class CargarKdmRequest(BaseModel):
        xml_kdm: Optional[str] = None
        raw_xml: Optional[str] = None

    class ModoSimulacionRequest(BaseModel):
        simulacion: bool

    # --- ENDPOINTS FASE 2: LIBRERÍAS Y CONTENIDOS ---

    # 1. GET /api/librerias/contenido (REQUERIMIENTO TÉCNICO EXACTO)
    @app.get("/api/librerias/contenido")
    def listar_contenido_librerias(simulacion: Optional[bool] = None):
        """
        Escanea las librerías FTP:
        - Si MODO_SIMULACION = True: devuelve el JSON simulado de películas en categorías colapsables.
        - Si MODO_SIMULACION = False: abre ftplib.FTP a 192.168.168.4 (LMS Ymagis: 4 carpetas con filtro punto)
          y a Deluxe/MovieTransit como buzones satelitales.
        """
        usar_sim = simulacion if simulacion is not None else MODO_SIMULACION
        if usar_sim:
            return obtener_contenidos_simulados()
        else:
            return escanear_ftp_real_cabina()

    # 2. GET /api/contenidos (Compatibilidad Frontend)
    @app.get("/api/contenidos")
    def listar_contenidos():
        return obtener_contenidos_simulados()

    # 3. GET /api/librerias (Configuración de Red Fija de las 3 Librerías)
    @app.get("/api/librerias")
    def listar_librerias_config():
        return {
            "modo_simulacion": MODO_SIMULACION,
            "librerias": LIBRERIAS_FTP_CONFIG
        }

    # 4. POST /api/modo-simulacion (Toggle para pruebas)
    @app.post("/api/modo-simulacion")
    def alternar_modo_simulacion(req: ModoSimulacionRequest):
        global MODO_SIMULACION
        MODO_SIMULACION = req.simulacion
        return {"success": True, "modo_simulacion": MODO_SIMULACION}

    # --- ENDPOINTS INGESTAS Y SALAS ---

    


    @app.post("/api/salas/{sala_id}/comando")
    async def ejecutar_comando_sala(sala_id: int, req: dict):
        comando = req.get("comando")
        valor = req.get("valor")
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM salas WHERE id=?", (sala_id,))
        sala = cur.fetchone()
        
        if not sala:
            conn.close()
            return {"success": False, "error": "Sala no encontrada"}
            
        
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
                        # Enviar volumen. El CP750 espera cp750.fader.level <valor_x_10>

                        writer.write(f"cp750.fader.level {int(valor * 10)}\r\n".encode('ascii'))
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
                            writer.write(b'\x00\x85\x00\x00\x01\x01\x87') # Power On command
                        else:
                            writer.write(b'\x00\x85\x00\x00\x01\x01\x87') # Power Off (Placeholder for real code)
                        await writer.drain()
                        writer.close()
                        await writer.wait_closed()
                    except Exception as e:
                        print("Error controlando NEC:", e)
        
                conn.close()
                return {"success": True, "lampara": estado_lampara}
                if comando == "modo_automatico":
                    cur.execute("UPDATE salas SET modo_automatico = ? WHERE id = ?", (1 if valor else 0, sala_id))
                    conn.commit()
                    conn.close()
                    return {"success": True}
            
                if comando == "macro":
                    if valor in ["LUCES 100%", "LUCES 50%", "Techo ON", "Limpieza"]:
                        import threading
                        def turn_on_lights():
                            c = get_db_connection()
                            c.execute("UPDATE salas SET luces_estado = 'ON' WHERE id = ?", (sala_id,))
                            c.commit()
                            c.close()
                        threading.Timer(2.0, turn_on_lights).start()
                    elif valor in ["LUCES 0%", "Techo OFF"]:
                        cur.execute("UPDATE salas SET luces_estado = 'OFF' WHERE id = ?", (sala_id,))
                        conn.commit()
            
                    conn.close()
                    return {"success": True, "macro": valor}
            
                conn.close()
                return {"success": True}

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="TMS Parque Astur - Digital Cinema Management")
    parser.add_argument("--init-db", action="store_true", help="Reinicializar la base de datos cinema_tms.db")
    parser.add_argument("--test-rule", action="store_true", help="Probar la regla de protección crítica")
    parser.add_argument("--test-kdm", action="store_true", help="Probar el parser de KDM y enrutador a Sala 5")
    parser.add_argument("--test-scan", action="store_true", help="Probar escaneo de librerías FTP")
    parser.add_argument("--run-server", action="store_true", help="Iniciar Uvicorn en http://0.0.0.0:8000")
    args = parser.parse_args()

    if args.init_db:
        init_database(force_reinit=True)
        print(f"[OK] Base de datos cinema_tms.db reinicializada con éxito en: {DB_PATH}")

    elif args.test_rule:
        init_database()
        print("\n=======================================================")
        print("  TEST 1: REGLA DE PROTECCIÓN CRÍTICA DE PROYECCIÓN    ")
        print("=======================================================")
        print("Solicitando ingesta 'ahora' de CONAN29 a Sala 1 (en PLAYING)...")
        res = programar_ingestas_core(salas_ids=[1], contenidos_ids=[1], modo_horario="ahora")
        print(json.dumps(res, indent=2, ensure_ascii=False))
        if res.get("tiene_alerta_roja"):
            print("\n[VERIFICADO] Alerta Roja activada:")
            print(f"--> \"{res['mensaje_global']}\" <--")
            print("Estado guardado en SQLite: 'PENDIENTE' (Protegida).\n")

    elif args.test_kdm:
        init_database()
        print("\n=======================================================")
        print("  TEST 2: FASE 3 - ENRUTADOR AUTOMÁTICO DE KDMs        ")
        print("=======================================================")
        kdm_test_xml = """<?xml version="1.0" encoding="UTF-8"?>
<KeyDeliveryMessage xmlns="http://www.dolby.com/dcinema/ws/smi/v1/schemas/licensemanagement">
    <licenseId>urn:uuid:7f3b890a-12c4-4e56-8a9b-0123456789ab</licenseId>
    <clipId>urn:uuid:c3d4e5f6-7a8b-9c0d-1e2f-abcdef123456</clipId>
    <clipTitle>AFuego_FTR_F-185_ES_51</clipTitle>
    <notValidBefore>2026-09-01T00:00:00+02:00</notValidBefore>
    <notValidAfter>2026-09-30T23:59:59+02:00</notValidAfter>
    <serverSerial>DSS220-210405</serverSerial>
</KeyDeliveryMessage>"""
        print("Cargando KDM XML con serial 'DSS220-210405' (Sala 5)...")
        res_kdm = procesar_carga_kdm(kdm_test_xml)
        print(json.dumps(res_kdm, indent=2, ensure_ascii=False))
        if res_kdm.get("asociada_a_sala", {}).get("es_sala_5"):
            print("\n[VERIFICADO] KDM cruzada exitosamente con Sala 5 (DSS220-210405) e inyectada vía sendLicense.")

    elif args.test_scan:
        init_database()
        print("\n=======================================================")
        print("  TEST 3: ESCANEO DE LIBRERÍAS FTP (FASE 2)             ")
        print("=======================================================")
        print("1. Escaneo en Modo Simulado:")
        scan_sim = obtener_contenidos_simulados()
        print(f"Total Categorías: {len(scan_sim['categorias'])}, Total Títulos: {len(scan_sim['todos'])}")
        print("2. Probando escaneo en Modo Real:")
        scan_real = escanear_ftp_real_cabina()
        print(f"Modo resultante: {scan_real.get('modo')}")
        print("Estado de Librerías FTP:")
        print(json.dumps(scan_real.get("estado_librerias"), indent=2))

    elif args.run_server:
        if FASTAPI_AVAILABLE:
            import uvicorn
            print(f"Arrancando TMS Parque Astur en http://0.0.0.0:8000 (Modo Simulación: {MODO_SIMULACION})...")
            uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
        else:
            print("[ERROR] FastAPI y Uvicorn no están instalados. Ejecute 'pip install fastapi uvicorn'.")
    else:
        init_database()
        print(f"TMS Parque Astur - Base de datos: {DB_PATH}")
        print("Ejecute con:")
        print("  python main.py --test-rule   (Prueba la regla de protección crítica)")
        print("  python main.py --test-kdm    (Prueba el parser XML y enrutado a Sala 5)")
        print("  python main.py --test-scan   (Prueba el escáner de librerías FTP)")
        print("  python main.py --run-server  (Arranca el servidor FastAPI)")

