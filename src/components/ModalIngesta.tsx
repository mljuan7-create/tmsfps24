import React, { useState } from 'react';
import { Sala, Contenido, SolicitudIngesta } from '../types';
import {
  X,
  HardDriveDownload,
  AlertTriangle,
  Clock,
  Zap,
  CheckCircle2,
  HardDrive,
  Play,
  Square,
  AlertOctagon,
  ShieldCheck,
} from 'lucide-react';

interface ModalIngestaProps {
  isOpen: boolean;
  onClose: () => void;
  salas: Sala[];
  contenidos: Contenido[];
  salasSeleccionadasInicial: number[];
  contenidosSeleccionados: number[];
  onEjecutarIngesta: (solicitud: SolicitudIngesta) => void;
}

export const ModalIngesta: React.FC<ModalIngestaProps> = ({
  isOpen,
  onClose,
  salas,
  contenidos,
  salasSeleccionadasInicial,
  contenidosSeleccionados,
  onEjecutarIngesta,
}) => {
  // Salas seleccionadas en el modal
  const [salasDestino, setSalasDestino] = useState<number[]>(
    salasSeleccionadasInicial.length > 0 ? salasSeleccionadasInicial : [1, 2]
  );

  // Modo horario: 'ahora' o 'posponer'
  const [modoHorario, setModoHorario] = useState<'ahora' | 'posponer'>('ahora');
  const [opcionPospuesta, setOpcionPospuesta] = useState<string>('post_sesion');
  const [horaPersonalizada, setHoraPersonalizada] = useState<string>('02:00');

  if (!isOpen) return null;

  const contenidosAingestar = contenidos.filter((c) => contenidosSeleccionados.includes(c.id));
  const totalGbAingestar = contenidosAingestar.reduce((acc, curr) => acc + curr.tamano_gb, 0);

  const toggleSala = (id: number) => {
    if (salasDestino.includes(id)) {
      setSalasDestino(salasDestino.filter((s) => s !== id));
    } else {
      setSalasDestino([...salasDestino, id]);
    }
  };

  const seleccionarTodasSalas = () => {
    setSalasDestino(salas.map((s) => s.id));
  };

  const deseleccionarTodas = () => {
    setSalasDestino([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (salasDestino.length === 0 || contenidosSeleccionados.length === 0) return;

    let programadoPara = 'Inmediata';
    if (modoHorario === 'posponer') {
      if (opcionPospuesta === 'post_sesion') {
        programadoPara = 'Al finalizar proyección actual';
      } else if (opcionPospuesta === 'nocturna') {
        programadoPara = '02:00 (Ventana de mantenimiento)';
      } else {
        programadoPara = `${horaPersonalizada} hrs`;
      }
    }

    onEjecutarIngesta({
      salas_ids: salasDestino,
      contenidos_ids: contenidosSeleccionados,
      modo_horario: modoHorario,
      programado_para: programadoPara,
    });
  };

  // Comprobar si alguna sala seleccionada está en PLAYING para avisar preventivamente
  const salasEnPlayingSeleccionadas = salas.filter(
    (s) => salasDestino.includes(s.id) && s.estado_reproduccion === 'PLAYING'
  );

  return (
    <div
      id="modal-flotante-ingesta-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="modal-flotante-ingesta-dialog"
        className="bg-zinc-950 border border-zinc-700 rounded-2xl max-w-3xl w-full shadow-2xl shadow-black overflow-hidden my-6 text-zinc-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400">
              <HardDriveDownload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-mono tracking-tight text-white flex items-center gap-2">
                ASISTENTE DE INGESTA DCI
                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] uppercase">
                  10 Salas Parque Astur
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Seleccione las salas destino y programe el momento de transferencia FTP.
              </p>
            </div>
          </div>
          <button
            id="btn-cerrar-modal-x"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          {/* Contenidos a ingestar (resumen) */}
          <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span className="font-semibold text-zinc-200">
                Paquetes DCP seleccionados ({contenidosAingestar.length}):
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                Total requerimiento: {totalGbAingestar.toFixed(1)} GB
              </span>
            </div>
            {contenidosAingestar.length === 0 ? (
              <div className="text-xs text-amber-400 p-2 bg-amber-950/30 rounded border border-amber-900/40 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>No ha seleccionado contenidos en la sección inferior. Cierre el modal y marque al menos una casilla.</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {contenidosAingestar.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-700 text-xs font-mono text-zinc-200"
                  >
                    <span className="text-zinc-500 font-bold">[{c.tipo}]</span>
                    <strong>{c.titulo}</strong>
                    <span className="text-sky-400 text-[11px]">({c.tamano_gb} GB)</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* PASO 1: Listado de las 10 Salas con almacenamiento libre */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-zinc-200 font-mono flex items-center gap-2">
                  <span>1. SELECCIONAR SALAS DESTINO</span>
                  <span className="text-zinc-500 font-normal">({salasDestino.length} de 10)</span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Verifique el almacenamiento libre disponible antes de lanzar la ingesta.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={seleccionarTodasSalas}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition cursor-pointer"
                >
                  Marcar las 10
                </button>
                <button
                  type="button"
                  onClick={deseleccionarTodas}
                  className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[11px] transition cursor-pointer border border-zinc-800"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* Grid compacto de 10 salas en el modal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 bg-zinc-950 rounded-xl border border-zinc-800/80">
              {salas.map((sala) => {
                const isSelected = salasDestino.includes(sala.id);
                const isPlaying = sala.estado_reproduccion === 'PLAYING';
                const tieneEspacioSuficiente = sala.almacenamiento_libre_gb >= totalGbAingestar;
                const libreRestante = sala.almacenamiento_libre_gb - totalGbAingestar;

                return (
                  <div
                    key={sala.id}
                    id={`modal-sala-check-${sala.id}`}
                    onClick={() => toggleSala(sala.id)}
                    className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-zinc-900 border-emerald-500/80 ring-1 ring-emerald-500/40'
                        : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-zinc-100 font-mono truncate">
                            {sala.nombre}
                          </span>
                          {isPlaying ? (
                            <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-400 text-[9px] font-bold font-mono border border-red-800">
                              PLAYING
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 text-[9px] font-mono">
                              IDLE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono truncate">
                          {sala.tipo_servidor} ({sala.ip_servidor})
                        </div>
                      </div>
                    </div>

                    {/* Espacio Libre */}
                    <div className="text-right shrink-0">
                      <div className="text-[11px] font-mono font-bold">
                        <span
                          className={
                            sala.almacenamiento_libre_gb < 300
                              ? 'text-red-400'
                              : sala.almacenamiento_libre_gb < 600
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }
                        >
                          {sala.almacenamiento_libre_gb.toFixed(0)} GB
                        </span>
                        <span className="text-zinc-500 text-[10px] ml-1">libres</span>
                      </div>
                      <div className="text-[9px] text-zinc-500 font-mono">
                        {isSelected && totalGbAingestar > 0 ? (
                          tieneEspacioSuficiente ? (
                            <span className="text-zinc-400">Quedan ~{libreRestante.toFixed(0)} GB</span>
                          ) : (
                            <span className="text-red-400 font-bold">¡Espacio Insuficiente!</span>
                          )
                        ) : (
                          <span>de {sala.almacenamiento_total_gb.toFixed(0)} GB</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PASO 2: Preguntar la Hora (Ahora o Posponer) */}
          <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
            <h3 className="text-xs sm:text-sm font-bold text-zinc-200 font-mono mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>2. PROGRAMACIÓN: ¿CUÁNDO DESEA EJECUTAR LA INGESTA?</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {/* Opción 1: Ahora */}
              <label
                id="radio-modo-ahora"
                className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition ${
                  modoHorario === 'ahora'
                    ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="modo_horario"
                  value="ahora"
                  checked={modoHorario === 'ahora'}
                  onChange={() => setModoHorario('ahora')}
                  className="mt-0.5 accent-emerald-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ahora (Inmediata)</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Inicia la transferencia de alta velocidad en cuanto se confirme.
                  </p>
                </div>
              </label>

              {/* Opción 2: Posponer */}
              <label
                id="radio-modo-posponer"
                className={`p-3 rounded-lg border flex items-start gap-3 cursor-pointer transition ${
                  modoHorario === 'posponer'
                    ? 'bg-sky-950/40 border-sky-500 ring-1 ring-sky-500/50'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="modo_horario"
                  value="posponer"
                  checked={modoHorario === 'posponer'}
                  onChange={() => setModoHorario('posponer')}
                  className="mt-0.5 accent-sky-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>Posponer (Programar diferida)</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Encola la tarea para horas de bajo impacto o fin de sesión.
                  </p>
                </div>
              </label>
            </div>

            {/* Opciones cuando se elige "Posponer" */}
            {modoHorario === 'posponer' && (
              <div className="mt-3 pt-3 border-t border-zinc-800/80 pl-2 space-y-2 animate-in fade-in duration-150">
                <span className="text-[11px] font-semibold text-zinc-300">Momento de ejecución programada:</span>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setOpcionPospuesta('post_sesion')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${
                      opcionPospuesta === 'post_sesion'
                        ? 'bg-sky-900 text-sky-200 border-sky-500'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    Al finalizar proyección actual
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpcionPospuesta('nocturna')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${
                      opcionPospuesta === 'nocturna'
                        ? 'bg-sky-900 text-sky-200 border-sky-500'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    Ventana nocturna (02:00 hrs)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpcionPospuesta('personalizada')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer flex items-center gap-1.5 ${
                      opcionPospuesta === 'personalizada'
                        ? 'bg-sky-900 text-sky-200 border-sky-500'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>Hora específica / Reloj...</span>
                  </button>
                </div>

                {opcionPospuesta === 'personalizada' && (
                  <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 mt-2 space-y-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-300 font-mono font-semibold">Reloj de Programación:</span>
                      <input
                        type="time"
                        value={horaPersonalizada}
                        onChange={(e) => setHoraPersonalizada(e.target.value)}
                        className="bg-zinc-900 border border-sky-500/60 text-sky-200 px-3 py-1.5 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-sky-400"
                      />
                    </div>
                    {/* Presets de cabina de proyección */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-zinc-400">
                      <span className="text-zinc-500">Horarios de Cabina:</span>
                      {[
                        { label: '01:30 (Cierre)', val: '01:30' },
                        { label: '02:00 (Ventana LMS)', val: '02:00' },
                        { label: '03:30 (Backup RAID)', val: '03:30' },
                        { label: '06:00 (Pre-Matinal)', val: '06:00' },
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => setHoraPersonalizada(preset.val)}
                          className={`px-2 py-0.5 rounded border transition cursor-pointer ${
                            horaPersonalizada === preset.val
                              ? 'bg-sky-950 text-sky-300 border-sky-600 font-bold'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AVISO PREVENTIVO DE LA REGLA DE PROTECCIÓN CRÍTICA */}
            {modoHorario === 'ahora' && salasEnPlayingSeleccionadas.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-red-950/60 border border-red-700 text-xs text-red-200 flex items-start gap-2.5">
                <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-red-300 block font-mono">
                    ⚠️ Advertencia de Protección Crítica:
                  </strong>
                  <span>
                    Ha seleccionado salas que están en estado <strong>&apos;PLAYING&apos;</strong> (
                    {salasEnPlayingSeleccionadas.map((s) => s.nombre).join(', ')}). Al confirmar &apos;Ahora&apos;,
                    el backend en Python cambiará automáticamente el estado a <strong>&apos;PENDIENTE&apos;</strong> en
                    SQLite y emitirá el aviso de advertencia en rojo para evitar parones de lectura en cabina.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-confirmar-ingestar"
              disabled={salasDestino.length === 0 || contenidosSeleccionados.length === 0}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition shadow-lg cursor-pointer ${
                salasDestino.length === 0 || contenidosSeleccionados.length === 0
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60 ring-2 ring-emerald-400/40'
              }`}
            >
              <HardDriveDownload className="w-4 h-4" />
              <span>
                {modoHorario === 'ahora' ? 'Ejecutar Ingesta Inmediata' : 'Programar Ingesta Diferida'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
