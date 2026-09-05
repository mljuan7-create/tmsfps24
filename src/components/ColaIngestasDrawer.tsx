import React from 'react';
import { ItemColaIngesta } from '../types';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  HardDriveDownload,
  AlertOctagon,
  Trash2,
  RotateCw,
} from 'lucide-react';

interface ColaIngestasDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cola: ItemColaIngesta[];
  onCancelar: (id: number) => void;
}

export const ColaIngestasDrawer: React.FC<ColaIngestasDrawerProps> = ({
  isOpen,
  onClose,
  cola,
  onCancelar,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="drawer-cola-ingestas-backdrop"
      className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        id="drawer-cola-ingestas-panel"
        className="w-full max-w-xl bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto p-5 text-zinc-100 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-600/20 border border-sky-500/40 text-sky-400">
                <HardDriveDownload className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold font-mono tracking-tight text-white flex items-center gap-2">
                  COLA DE INGESTAS (SQLITE)
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs">
                    {cola.length}
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 font-mono">Tabla: &apos;cola_ingestas&apos; • Parque Astur</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lista de Tareas en Cola */}
          <div className="mt-4 space-y-3">
            {cola.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-sm font-mono">
                No hay tareas en la cola de ingestas.
              </div>
            ) : (
              cola.map((item) => {
                const esCritica = item.es_critica_roja || item.advertencia?.includes('Servidor en proyección');
                const esVerificando = item.estado === 'VERIFYING' || item.dolby_xsd_state === 'VERIFYING';
                const esEnProceso = item.estado === 'IN_PROGRESS' || item.estado === 'EN_PROCESO' || item.dolby_xsd_state === 'IN_PROGRESS';
                const esPendiente = item.estado === 'PENDIENTE' || item.estado === 'PENDING' || item.dolby_xsd_state === 'PENDING';
                const esCompletada = item.estado === 'FINISHED' || item.estado === 'COMPLETADA' || item.dolby_xsd_state === 'FINISHED';

                return (
                  <div
                    key={item.id}
                    id={`item-cola-${item.id}`}
                    className={`p-3.5 rounded-xl border transition ${
                      esCritica
                        ? 'bg-red-950/40 border-red-600/80 shadow-md shadow-red-950/30'
                        : esVerificando
                        ? 'bg-purple-950/30 border-purple-600/60'
                        : esEnProceso
                        ? 'bg-sky-950/30 border-sky-600/60'
                        : esCompletada
                        ? 'bg-zinc-900/60 border-zinc-800'
                        : 'bg-zinc-900/80 border-zinc-800'
                    }`}
                  >
                    {/* Fila superior: Sala, DCP y Estado */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-100 font-mono">
                            {item.sala_nombre}
                          </span>
                          <span className="text-zinc-500">→</span>
                          <span className="font-semibold text-zinc-200 text-xs font-mono">
                            {item.contenido_titulo}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            ({item.contenido_tamano.toFixed(1)} GB)
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          Encolado: {item.creado_en} • Horario: {item.programado_para}
                        </div>
                      </div>

                      {/* Badge de Estado con especificación Dolby XSD */}
                      <div>
                        {esVerificando && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-600 text-[10px] font-bold font-mono animate-pulse">
                            <RotateCw className="w-3 h-3 animate-spin" />
                            VERIFYING (SHA-1)
                          </span>
                        )}
                        {esEnProceso && !esVerificando && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-700 text-[10px] font-bold font-mono animate-pulse">
                            <RotateCw className="w-3 h-3 animate-spin" />
                            IN_PROGRESS
                          </span>
                        )}
                        {esPendiente && !esEnProceso && !esVerificando && (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                              esCritica
                                ? 'bg-red-950 text-red-300 border-red-600'
                                : 'bg-amber-950 text-amber-400 border-amber-700'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {esCritica ? 'DIFERIDA (PROYECCIÓN)' : 'PENDING'}
                          </span>
                        )}
                        {esCompletada && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700 text-[10px] font-bold font-mono">
                            <CheckCircle2 className="w-3 h-3" />
                            FINISHED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Aviso Crítico en Rojo si aplica */}
                    {esCritica && (
                      <div className="mt-2.5 p-2 rounded-lg bg-red-950/80 border border-red-600 text-xs text-red-200 flex items-start gap-2">
                        <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-red-300 block font-mono text-[11px]">
                            {item.advertencia ||
                              'Servidor en proyección. Ingesta diferida encolada automáticamente para evitar parones de lectura'}
                          </strong>
                          <span className="text-[10px] text-red-300/80 block mt-0.5">
                            Estado en SQLite cambiado a &apos;PENDIENTE&apos;. La transferencia arrancará automáticamente al pasar la sala a IDLE.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Barra de progreso si está en proceso */}
                    {esEnProceso && (
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                          <span>Progreso FTP DCI</span>
                          <span className="text-sky-400 font-bold">{item.progreso.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                          <div
                            className="bg-sky-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${item.progreso}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Detalle o mensaje */}
                    {item.mensaje && !esCritica && (
                      <div className="mt-2 text-[11px] text-zinc-400 font-mono">
                        {item.mensaje}
                      </div>
                    )}

                    {/* Acciones */}
                    {item.estado !== 'COMPLETADA' && item.estado !== 'CANCELADA' && (
                      <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex justify-end">
                        <button
                          onClick={() => onCancelar(item.id)}
                          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-red-400 transition cursor-pointer font-mono"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Cancelar tarea</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>TMS Parque Astur • SQLite Storage Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
