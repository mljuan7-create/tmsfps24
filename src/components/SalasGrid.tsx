import React from 'react';
import { Sala } from '../types';
import { Play, Square, HardDrive, Cpu, Radio, CheckSquare, Square as UncheckedSquare, Volume2, Video, Lightbulb, Network } from 'lucide-react';

interface SalasGridProps {
  salas: Sala[];
  salasSeleccionadas: number[];
  onToggleSeleccionSala: (id: number) => void;
  onSelectTodasSalas: () => void;
  onDeselectTodasSalas: () => void;
  onToggleEstadoSala: (id: number) => void;
  onAbrirModalIngestaConSala?: (id: number) => void;
}

export const SalasGrid: React.FC<SalasGridProps> = ({
  salas,
  salasSeleccionadas,
  onToggleSeleccionSala,
  onSelectTodasSalas,
  onDeselectTodasSalas,
  onToggleEstadoSala,
}) => {
  return (
    <section id="seccion-salas-parque-astur" className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      {/* Encabezado de la sección de salas */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400" />
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono tracking-tight">
            ESTADO DE SALAS (10 CABINAS DCI)
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-mono">
            {salas.filter((s) => s.estado_reproduccion === 'PLAYING').length} en proyección
          </span>
        </div>

        {/* Acciones de selección rápida */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onSelectTodasSalas}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition cursor-pointer"
          >
            Seleccionar 10 Salas
          </button>
          <button
            onClick={onDeselectTodasSalas}
            className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer border border-zinc-800"
          >
            Desmarcar todas
          </button>
        </div>
      </div>

      {/* Grid de 10 Salas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {salas.map((sala) => {
          const isSelected = salasSeleccionadas.includes(sala.id);
          const isPlaying = sala.estado_reproduccion === 'PLAYING';
          const porcentajeLibre = Math.round((sala.almacenamiento_libre_gb / sala.almacenamiento_total_gb) * 100);
          const esSala1 = sala.id === 1;

          return (
            <div
              key={sala.id}
              id={`card-sala-${sala.id}`}
              className={`rounded-xl border transition-all duration-200 p-3.5 flex flex-col justify-between relative bg-zinc-900/90 ${
                isSelected
                  ? 'border-emerald-500/80 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/50'
                  : isPlaying
                  ? 'border-zinc-700/80 hover:border-zinc-600'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {/* Header de la Sala */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleSeleccionSala(sala.id)}
                      className="text-zinc-400 hover:text-emerald-400 transition cursor-pointer p-0.5"
                      title={isSelected ? 'Deseleccionar sala' : 'Seleccionar sala para ingesta'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <UncheckedSquare className="w-4 h-4 text-zinc-600" />
                      )}
                    </button>
                    <div>
                      <span className="font-bold text-sm text-zinc-100 font-mono block leading-tight">
                        {sala.nombre}
                      </span>
                      {/* Estado de la Lámpara (ON / OFF) */}
                      <div className="mt-0.5">
                        {sala.lampara_encendida ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-600/50 px-1 rounded">
                            <Lightbulb className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            <span>LÁMPARA ON</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono text-zinc-500 bg-zinc-950 px-1 rounded border border-zinc-800">
                            <Lightbulb className="w-2.5 h-2.5 text-zinc-600" />
                            <span>LÁMPARA OFF</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Estado de Reproducción con botón de alternancia */}
                  <button
                    onClick={() => onToggleEstadoSala(sala.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider flex items-center gap-1 transition cursor-pointer ${
                      isPlaying
                        ? 'bg-red-950/90 text-red-400 border border-red-800/80 hover:bg-red-900'
                        : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 hover:bg-emerald-900'
                    }`}
                    title="Haga clic para alternar PLAYING / IDLE y probar la regla de protección"
                  >
                    {isPlaying ? (
                      <>
                        <Play className="w-2.5 h-2.5 fill-red-400" />
                        <span>PLAYING</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-2.5 h-2.5 fill-emerald-400" />
                        <span>IDLE</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Hardware del cine (Parque Astur) - Red Dual 10.100.47.x / 192.168.168.x */}
                <div className="mt-2 text-[11px] space-y-1 bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/80 font-mono">
                  {/* Servidor */}
                  <div>
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-sky-400" />
                        <span className="font-semibold">{sala.tipo_servidor}</span>
                      </span>
                      <span className="text-[10px] text-sky-400 font-semibold">{sala.ip_servidor}:{sala.puerto_servidor}</span>
                    </div>
                    {/* Red Dual de Ingesta */}
                    <div className="flex items-center justify-between text-[9px] text-zinc-500 pl-4">
                      <span>Red Ingesta:</span>
                      <span className="text-zinc-400 font-semibold">{sala.ip_ingesta_servidor || `192.168.168.${sala.id * 10 + 1}`}</span>
                    </div>
                  </div>

                  {/* Número de Serie del Servidor DCI */}
                  {sala.server_serial && (
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-0.5 border-t border-zinc-900">
                      <span className="text-zinc-500">SN Servidor:</span>
                      <span className={`font-mono font-semibold ${sala.id === 5 ? 'text-amber-300' : 'text-zinc-300'}`}>
                        {sala.server_serial}
                      </span>
                    </div>
                  )}

                  {/* Proyector */}
                  <div className="flex items-center justify-between text-zinc-400 text-[10px] pt-0.5 border-t border-zinc-900">
                    <span className="flex items-center gap-1 truncate max-w-[130px]" title={sala.modelo_proyector}>
                      <Video className="w-3 h-3 text-amber-400" />
                      <span>{sala.modelo_proyector}</span>
                    </span>
                    <span className="text-zinc-400 font-mono text-[10px]">{sala.ip_proyector}:{sala.puerto_proyector}</span>
                  </div>

                  {/* Sonido */}
                  <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                    <span className="flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-violet-400" />
                      <span>{sala.procesador_sonido}</span>
                    </span>
                    <span className="text-zinc-500 font-mono">{sala.puerto_sonido}</span>
                  </div>
                </div>

                {/* Minutaje actual, Duración total y Barra de progreso en tiempo real */}
                {isPlaying && sala.cpl_actual && (
                  <div className="mt-2 p-2 rounded bg-red-950/40 border border-red-900/40 text-[10px]">
                    <div className="text-red-400 font-semibold truncate font-mono" title={sala.cpl_actual}>
                      ▶ {sala.cpl_actual}
                    </div>
                    {/* Minutaje actual y Duración total */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-300 mt-1">
                      <span className="text-red-300">
                        {sala.minutaje_actual_min || Math.max(1, (sala.duracion_total_min || 120) - sala.tiempo_restante_min)}m / {sala.duracion_total_min || 120}m
                      </span>
                      <span className="text-zinc-400 text-[9px]">
                        Restan: ~{sala.tiempo_restante_min}m
                      </span>
                    </div>
                    {/* Barra de progreso en tiempo real */}
                    {(() => {
                      const duracion = sala.duracion_total_min || 120;
                      const actual = sala.minutaje_actual_min || Math.max(1, duracion - sala.tiempo_restante_min);
                      const progreso = Math.min(100, Math.max(0, Math.round((actual / duracion) * 100)));
                      return (
                        <div className="mt-1 space-y-0.5">
                          <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                            <span>Progreso Proyección</span>
                            <span className="text-red-400 font-bold">{progreso}%</span>
                          </div>
                          <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-red-950">
                            <div
                              className="h-full bg-red-500 transition-all duration-500 rounded-full"
                              style={{ width: `${progreso}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Medidor de Almacenamiento Libre */}
              <div className="mt-3 pt-2.5 border-t border-zinc-800/80">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <HardDrive className="w-3 h-3 text-zinc-400" />
                    <span>Libre:</span>
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      sala.almacenamiento_libre_gb < 300
                        ? 'text-red-400'
                        : sala.almacenamiento_libre_gb < 600
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {sala.almacenamiento_libre_gb.toFixed(0)} GB
                    <span className="text-zinc-400 font-normal text-[10px] ml-1">
                      ({porcentajeLibre}%)
                    </span>
                  </span>
                </div>

                {/* Barra de almacenamiento */}
                <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      porcentajeLibre < 15
                        ? 'bg-red-500'
                        : porcentajeLibre < 35
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, porcentajeLibre))}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
