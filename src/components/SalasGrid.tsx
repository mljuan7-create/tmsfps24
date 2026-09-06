import React, { useState } from 'react';
import {
  Film,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Lightbulb,
  Zap,
  Settings2,
  CheckSquare,
  Square as SquareIcon,
} from 'lucide-react';
import { Sala } from '../types';
import { SalaControlModal } from './SalaControlModal';

interface SalasGridProps {
  salas: Sala[];
  salasSeleccionadas: number[];
  onToggleSeleccionSala: (id: number) => void;
  onSelectTodasSalas: () => void;
  onDeselectTodasSalas: () => void;
  onToggleEstadoSala: (id: number) => void;
  onEnviarComandoSala?: (id: number, comando: string, valorExtra?: number | string) => void;
}

const formatTime = (minutes: number) => {
  if (!minutes || isNaN(minutes)) return '00:00:00';
  const isNegative = minutes < 0;
  const absMins = Math.abs(minutes);
  const h = Math.floor(absMins / 60);
  const m = Math.floor(absMins % 60);
  const s = Math.floor((absMins * 60) % 60);
  return `${isNegative ? '-' : ''}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const limpiarTitulo = (titulo: string | null) => {
  if (!titulo) return 'Sin sesión cargada';
  return titulo
    .replace(/_/g, ' ')
    .replace(/FTR.*/i, '')
    .replace(/TLR.*/i, '')
    .trim() || titulo.replace(/_/g, ' ');
};

export const SalasGrid: React.FC<SalasGridProps> = ({
  salas,
  salasSeleccionadas,
  onToggleSeleccionSala,
  onSelectTodasSalas,
  onDeselectTodasSalas,
  onEnviarComandoSala,
}) => {
  const [modalSalaId, setModalSalaId] = useState<number | null>(null);
  const todasSeleccionadas = salas.length > 0 && salasSeleccionadas.length === salas.length;

  const salasEnPlay = salas.filter((s) => s.estado_reproduccion === 'PLAYING').length;

  return (
    <section className="flex flex-col h-full space-y-4">
      {/* Barra Superior de Control de Cabina */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Film className="w-4 h-4 text-sky-400" />
            Control de Cabina
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-zinc-900 border border-zinc-800 text-zinc-400">
            {salasEnPlay} de {salas.length} en proyección
          </span>
        </div>

        {/* Acciones globales */}
        <div className="flex items-center gap-2">
          <button
            onClick={todasSeleccionadas ? onDeselectTodasSalas : onSelectTodasSalas}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition"
          >
            {todasSeleccionadas ? (
              <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
            ) : (
              <SquareIcon className="w-3.5 h-3.5 text-zinc-500" />
            )}
            <span>{todasSeleccionadas ? 'Deseleccionar' : 'Seleccionar todas'}</span>
          </button>
        </div>
      </div>

      {/* Cuadrícula de Salas (Reproductor Minimalista por Sala) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3.5">
        {salas.map((sala) => {
          const isSelected = salasSeleccionadas.includes(sala.id);
          const isPlaying = sala.estado_reproduccion === 'PLAYING';
          const isPaused = sala.estado_reproduccion === 'PAUSED';

          const duracion = sala.duracion_total_min || 120;
          const restante = sala.tiempo_restante_min || 0;
          const actual = Math.max(0, duracion - restante);
          const progreso = Math.min(100, Math.max(0, (actual / duracion) * 100));

          const volumenActual = sala.volumen ?? 7.0;
          const lucesModo = sala.estado_luces ?? (isPlaying ? 'CINE' : 'SALA');
          const lamparaOn = sala.lampara_encendida;

          return (
            <div
              key={sala.id}
              onClick={() => onToggleSeleccionSala(sala.id)}
              className={`relative flex flex-col justify-between rounded-xl p-3.5 transition-all duration-200 border cursor-pointer ${
                isSelected
                  ? 'bg-zinc-900/90 border-sky-500/80 shadow-[0_0_15px_rgba(14,165,233,0.12)] ring-1 ring-sky-500/40'
                  : 'bg-[#14171e] border-zinc-800/80 hover:border-zinc-700/80 shadow-md'
              }`}
            >
              {/* CABECERA: Sala y Estado */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-black tracking-tight text-white">
                    SALA {sala.id}
                  </span>
                  {sala.id === 1 && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Laser
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {/* Badge Estado */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                      isPlaying
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                        : isPaused
                        ? 'bg-amber-950 text-amber-300 border border-amber-700/50'
                        : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/40'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isPlaying
                          ? 'bg-emerald-400 animate-pulse'
                          : isPaused
                          ? 'bg-amber-400'
                          : 'bg-zinc-500'
                      }`}
                    />
                    {isPlaying ? 'PLAY' : isPaused ? 'PAUSA' : 'PARADA'}
                  </span>

                  {/* Botón Detalles Técnicos (Oculto/Discreto) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalSalaId(sala.id);
                    }}
                    title="Detalles y configuración avanzada"
                    className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* TÍTULO DE LA PELÍCULA */}
              <div className="my-1">
                <p
                  className={`text-sm font-semibold truncate ${
                    sala.cpl_actual ? 'text-zinc-100' : 'text-zinc-500 italic'
                  }`}
                  title={sala.cpl_actual || 'Sin sesión'}
                >
                  {limpiarTitulo(sala.cpl_actual)}
                </p>
              </div>

              {/* BARRA DE PROGRESO Y MINUTAJE */}
              <div className="my-2 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span className="font-semibold text-zinc-300">{formatTime(actual)}</span>
                  <span className="text-zinc-500">-{formatTime(restante)}</span>
                </div>

                <div className="relative w-full h-1.5 bg-zinc-800/90 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isPlaying ? 'bg-emerald-500' : isPaused ? 'bg-amber-500' : 'bg-zinc-700'
                    }`}
                    style={{ width: `${progreso}%` }}
                  />
                </div>
              </div>

              {/* CONTROLES DE REPRODUCCIÓN (Poner / Pausar / Quitar) */}
              <div
                className="grid grid-cols-3 gap-1.5 pt-2 border-t border-zinc-800/80"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => onEnviarComandoSala?.(sala.id, 'play')}
                  title="Poner (Reproducir)"
                  className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    isPlaying
                      ? 'bg-emerald-500 text-zinc-950 shadow-md'
                      : 'bg-zinc-800 hover:bg-emerald-950/80 text-zinc-300 hover:text-emerald-300 border border-zinc-700/60'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Poner</span>
                </button>

                <button
                  onClick={() => onEnviarComandoSala?.(sala.id, 'pause')}
                  title="Pausar"
                  className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    isPaused
                      ? 'bg-amber-500 text-zinc-950 shadow-md'
                      : 'bg-zinc-800 hover:bg-amber-950/80 text-zinc-300 hover:text-amber-300 border border-zinc-700/60'
                  }`}
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pausa</span>
                </button>

                <button
                  onClick={() => onEnviarComandoSala?.(sala.id, 'stop')}
                  title="Quitar / Detener sesión"
                  className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-red-950/80 text-zinc-300 hover:text-red-300 border border-zinc-700/60 transition"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Quitar</span>
                </button>
              </div>

              {/* CONTROLES DE ENTORNO: VOLUMEN, LUCES Y LÁMPARA */}
              <div
                className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between gap-1 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Control de Volumen */}
                <div className="flex items-center gap-1 bg-zinc-900/90 rounded-lg p-1 border border-zinc-800">
                  <Volume2 className="w-3 h-3 text-zinc-400 ml-0.5" />
                  <button
                    onClick={() => onEnviarComandoSala?.(sala.id, 'volumen_bajar')}
                    className="w-5 h-5 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition"
                    title="Bajar volumen (-0.5)"
                  >
                    -
                  </button>
                  <span className="font-mono text-[11px] font-bold text-zinc-200 px-1 min-w-[32px] text-center">
                    {volumenActual.toFixed(1)}
                  </span>
                  <button
                    onClick={() => onEnviarComandoSala?.(sala.id, 'volumen_subir')}
                    className="w-5 h-5 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold transition"
                    title="Subir volumen (+0.5)"
                  >
                    +
                  </button>
                </div>

                {/* Control de Luces */}
                <button
                  onClick={() => onEnviarComandoSala?.(sala.id, 'luces_toggle')}
                  title="Cambiar luces (Cine / Sala / Limpieza)"
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg font-mono text-[11px] font-bold border transition ${
                    lucesModo === 'SALA'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                      : lucesModo === 'LIMPIEZA'
                      ? 'bg-zinc-100 text-zinc-950 border-white'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <Lightbulb className="w-3 h-3" />
                  <span>{lucesModo}</span>
                </button>

                {/* Control de Lámpara */}
                <button
                  onClick={() => onEnviarComandoSala?.(sala.id, 'lampara_toggle')}
                  title={lamparaOn ? 'Apagar Lámpara' : 'Encender Lámpara'}
                  className={`p-1 rounded-lg border transition ${
                    lamparaOn
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Técnico Avanzado (Solo se abre con el icono ⚙️) */}
      {modalSalaId && (
        <SalaControlModal
          sala={salas.find((s) => s.id === modalSalaId)!}
          onClose={() => setModalSalaId(null)}
          onEnviarComando={onEnviarComandoSala || (() => {})}
        />
      )}
    </section>
  );
};
