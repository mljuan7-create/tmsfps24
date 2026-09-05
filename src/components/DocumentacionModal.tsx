import React, { useState } from 'react';
import { X, FileCode2, Database, Server, Copy, Check, Terminal, ShieldAlert } from 'lucide-react';

interface DocumentacionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentacionModal: React.FC<DocumentacionModalProps> = ({ isOpen, onClose }) => {
  const [copiado, setCopiado] = useState(false);
  const [tabActiva, setTabActiva] = useState<'python' | 'infra' | 'sqlite'>('python');

  if (!isOpen) return null;

  const copiarComando = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div
      id="modal-documentacion-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="modal-documentacion-dialog"
        className="bg-zinc-950 border border-zinc-700 rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl overflow-hidden flex flex-col my-6 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-mono tracking-tight text-white flex items-center gap-2">
                TMS PARQUE ASTUR • ARQUITECTURA & BACKEND PYTHON
              </h2>
              <p className="text-xs text-zinc-400">
                Código fuente de &apos;main.py&apos; (FastAPI), Base de datos SQLite y Mapeo de Red DCI.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/40 px-5 gap-4 text-xs font-mono">
          <button
            onClick={() => setTabActiva('python')}
            className={`py-2.5 border-b-2 font-bold transition flex items-center gap-2 cursor-pointer ${
              tabActiva === 'python'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            <span>FastAPI: main.py</span>
          </button>
          <button
            onClick={() => setTabActiva('infra')}
            className={`py-2.5 border-b-2 font-bold transition flex items-center gap-2 cursor-pointer ${
              tabActiva === 'infra'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Infraestructura 10 Salas</span>
          </button>
          <button
            onClick={() => setTabActiva('sqlite')}
            className={`py-2.5 border-b-2 font-bold transition flex items-center gap-2 cursor-pointer ${
              tabActiva === 'sqlite'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Esquema SQLite</span>
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 overflow-y-auto flex-1 font-mono text-xs text-zinc-300 space-y-4">
          {tabActiva === 'python' && (
            <div className="space-y-4">
              <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Comando de ejecución en servidor de cine:</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <code className="px-2.5 py-1 rounded bg-black border border-zinc-700 text-emerald-400 text-xs">
                    uvicorn main:app --host 0.0.0.0 --port 8000 --reload
                  </code>
                  <button
                    onClick={() => copiarComando('uvicorn main:app --host 0.0.0.0 --port 8000 --reload')}
                    className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
                    title="Copiar comando"
                  >
                    {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-red-950/40 border border-red-700/60 rounded-xl text-red-200">
                <div className="flex items-center gap-2 font-bold text-red-300 text-sm mb-1">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Implementación Python de la Regla de Protección Crítica:</span>
                </div>
                <pre className="p-3 bg-black/60 rounded-lg overflow-x-auto text-[11px] text-zinc-300 mt-2 font-mono">
{`# Regla de Protección Crítica en main.py:
if modo_horario == "ahora" and sala["estado_reproduccion"] == "PLAYING":
    # 1. Cambiar automáticamente estado a 'PENDIENTE' en SQLite
    estado_ingesta = "PENDIENTE"
    texto_advertencia = (
        "Servidor en proyección. Ingesta diferida encolada automáticamente "
        "para evitar parones de lectura"
    )
    hora_ejecucion = f"Al finalizar proyección (~{sala['tiempo_restante_min']}m)"
    
    cur.execute("""
    INSERT INTO cola_ingestas (
        sala_id, contenido_id, estado, modo_horario,
        programado_para, creado_en, progreso, advertencia, mensaje
    ) VALUES (?, ?, ?, 'posponer_post_sesion', ?, ?, 0.0, ?, ?)
    """, (s_id, c_id, estado_ingesta, hora_ejecucion, creado_en,
          texto_advertencia, f"Encolada diferida para {sala['nombre']}"))
          
    # 2. Devolver aviso de advertencia en rojo en la respuesta
    advertencias_criticas.append({
        "es_critica_roja": True,
        "advertencia_roja": texto_advertencia
    })`}
                </pre>
              </div>

              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <div className="text-zinc-200 font-bold mb-1">Verificación CLI directa:</div>
                <p className="text-zinc-400 text-[11px] mb-2">
                  Puede ejecutar una prueba automatizada en cualquier consola Linux/Python con:
                </p>
                <code className="block p-2 bg-black rounded text-sky-300 text-[11px]">
                  python3 main.py --test-rule
                </code>
              </div>
            </div>
          )}

          {tabActiva === 'infra' && (
            <div className="space-y-4">
              <h3 className="font-bold text-zinc-100 text-sm">Configuración de Red Real - Parque Astur</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-zinc-100 font-bold">
                    <span>SALA 1 (Cabina Láser CINITY)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">VIP / CINITY</span>
                  </div>
                  <ul className="text-[11px] text-zinc-300 space-y-1">
                    <li>• <strong>Servidor:</strong> GDC SR-6400C (IP 10.100.47.11)</li>
                    <li>• <strong>Proyector:</strong> CHRISTIE CP4440-RGB (IP 10.100.47.13, puerto 3002)</li>
                    <li>• <strong>Sonido:</strong> DOLBY CP850 (ATMOS)</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-zinc-100 font-bold">
                    <span>SALAS 2 a 10 (Salas Convencionales)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">DCI Estándar</span>
                  </div>
                  <ul className="text-[11px] text-zinc-300 space-y-1">
                    <li>• <strong>Servidores:</strong> DOLBY DSS220 (IPs 10.100.47.21 a .101, puerto 61408)</li>
                    <li>• <strong>Proyectores:</strong> NEC NC2000C (puerto 7000)</li>
                    <li>• <strong>Sonido:</strong> DOLBY CP750 (puerto 61408)</li>
                  </ul>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                <h4 className="font-bold text-zinc-200">Librerías FTP Centrales (Orígenes de Contenido):</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800">
                    <div className="font-bold text-emerald-400">LMS Ymagis</div>
                    <div className="text-zinc-400">192.168.168.4</div>
                  </div>
                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800">
                    <div className="font-bold text-emerald-400">Box By Deluxe</div>
                    <div className="text-zinc-400">192.168.168.2</div>
                  </div>
                  <div className="p-2 bg-zinc-950 rounded border border-zinc-800">
                    <div className="font-bold text-emerald-400">MovieTransit</div>
                    <div className="text-zinc-400">192.168.168.111</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tabActiva === 'sqlite' && (
            <div className="space-y-3">
              <h3 className="font-bold text-zinc-100 text-sm">Tablas de la Base de Datos SQLite (tms.db)</h3>
              <pre className="p-3 bg-black/80 rounded-lg overflow-x-auto text-[11px] text-zinc-300">
{`-- 1. Tabla de Salas de Cine
CREATE TABLE salas (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    ip_servidor TEXT NOT NULL,
    tipo_servidor TEXT NOT NULL,
    puerto_servidor INTEGER NOT NULL,
    ip_proyector TEXT NOT NULL,
    modelo_proyector TEXT NOT NULL,
    puerto_proyector INTEGER NOT NULL,
    procesador_sonido TEXT NOT NULL,
    puerto_sonido INTEGER NOT NULL,
    estado_reproduccion TEXT CHECK(estado_reproduccion IN ('PLAYING', 'IDLE', 'PAUSED', 'STOPPED')),
    almacenamiento_total_gb REAL NOT NULL,
    almacenamiento_libre_gb REAL NOT NULL,
    cpl_actual TEXT,
    tiempo_restante_min INTEGER DEFAULT 0
);

-- 2. Tabla de Contenidos (FTR y TLR)
CREATE TABLE contenidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    tipo TEXT CHECK(tipo IN ('FTR', 'TLR')),
    tamano_gb REAL NOT NULL,
    requiere_kdm INTEGER DEFAULT 0,
    kdm_valida INTEGER DEFAULT 1,
    aspect_ratio TEXT DEFAULT 'F-185',
    audio_format TEXT DEFAULT '5.1',
    fuente_ftp TEXT NOT NULL,
    es_cinity INTEGER DEFAULT 0,
    cpl_uuid TEXT
);

-- 3. Tabla de Cola de Ingestas
CREATE TABLE cola_ingestas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sala_id INTEGER NOT NULL,
    contenido_id INTEGER NOT NULL,
    estado TEXT CHECK(estado IN ('EN_PROCESO', 'PENDIENTE', 'COMPLETADA', 'CANCELADA', 'ERROR')),
    modo_horario TEXT NOT NULL,
    programado_para TEXT,
    creado_en TEXT NOT NULL,
    progreso REAL DEFAULT 0.0,
    advertencia TEXT,
    mensaje TEXT,
    FOREIGN KEY (sala_id) REFERENCES salas(id),
    FOREIGN KEY (contenido_id) REFERENCES contenidos(id)
);`}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex justify-end bg-zinc-900/60">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
