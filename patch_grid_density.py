import os

content = """import React, { useState } from 'react';
import { Film, Play, Pause, Square, CheckSquare, Sun, Clock, Maximize2 } from 'lucide-react';
import { SalaCabina } from '../types';
import { SalaControlModal } from './SalaControlModal';

interface SalasGridProps {
  salas: SalaCabina[];
  salasSeleccionadas: number[];
  onToggleSeleccionSala: (id: number) => void;
  onSelectTodasSalas: () => void;
  onDeselectTodasSalas: () => void;
  onToggleEstadoSala: (id: number) => void;
  onEnviarComandoSala?: (id: number, comando: 'play' | 'pause' | 'stop') => void;
}

const formatTime = (minutes: number) => {
  if (!minutes || isNaN(minutes)) return "00:00:00";
  const isNegative = minutes < 0;
  const absMins = Math.abs(minutes);
  const h = Math.floor(absMins / 60);
  const m = Math.floor(absMins % 60);
  const s = Math.floor((absMins * 60) % 60);
  return `${isNegative ? '-' : ''}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const getNextSessionTime = (roomNumber: number) => {
  const now = new Date();
  now.setHours(16 + (roomNumber % 3));
  now.setMinutes(15 * (roomNumber % 4));
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

export const SalasGrid: React.FC<SalasGridProps> = ({
  salas,
  salasSeleccionadas,
  onToggleSeleccionSala,
  onSelectTodasSalas,
  onDeselectTodasSalas,
  onToggleEstadoSala,
  onEnviarComandoSala,
}) => {
  const [modalSalaId, setModalSalaId] = useState<number | null>(null);
  const todasSeleccionadas = salas.length > 0 && salasSeleccionadas.length === salas.length;

  const handleOpenModal = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalSalaId(id);
  };

  return (
    <section className="flex flex-col h-full">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <div>
          <h2 className="text-xl font-light tracking-wide text-zinc-100 flex items-center gap-2">
            <VideoIcon /> MONITOR DE CABINA
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">Estado en tiempo real de proyección y hardware</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={todasSeleccionadas ? onDeselectTodasSalas : onSelectTodasSalas}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700/50 transition shadow-sm"
          >
            {todasSeleccionadas ? (
              <CheckSquare className="w-4 h-4 text-emerald-500" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <span className="text-xs sm:text-sm font-medium">Seleccionar Todas</span>
          </button>
        </div>
      </div>

      {/* Grid de Salas - Alta densidad (3, 4 o 5 por fila según resolución) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4">
        {salas.map((sala) => {
          const isSelected = salasSeleccionadas.includes(sala.id);
          const isPlaying = sala.estado_reproduccion === 'PLAYING';
          const isPaused = sala.estado_reproduccion === 'PAUSED';
          
          const duracion = sala.duracion_total_min || 120;
          const restante = sala.tiempo_restante_min || 0;
          const actual = duracion - restante;
          const progreso = Math.min(100, Math.max(0, (actual / duracion) * 100));
          
          // Lógica de luces (5 minutos antes de acabar)
          const lucesThreshold = Math.max(0, duracion - 5);
          const lucesPorcentaje = duracion > 0 ? (lucesThreshold / duracion) * 100 : 0;
          const lucesEncendidas = actual >= lucesThreshold && actual < duracion;
          const tiempoParaLuces = Math.max(0, restante - 5);

          // Color dinámico de la barra
          const barColor = isPlaying 
            ? (lucesEncendidas ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]' : 'bg-[#12b886] shadow-[0_0_10px_rgba(18,184,134,0.3)]')
            : isPaused ? 'bg-amber-600' : 'bg-zinc-600';

          return (
            <div 
              key={sala.id}
              className={`relative flex bg-zinc-900/80 rounded-xl transition-all duration-300 border overflow-hidden group hover:border-zinc-700 cursor-pointer ${
                isSelected ? 'border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.15)] bg-sky-950/10' : 'border-zinc-800/80 shadow-md'
              }`}
              style={{ minHeight: '135px' }}
              onClick={() => onToggleSeleccionSala(sala.id)}
            >
              {/* Botón Flotante para Controles Avanzados */}
              <button 
                onClick={(e) => handleOpenModal(sala.id, e)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-800 text-zinc-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-sky-500 hover:text-white z-20 shadow-lg scale-90 group-hover:scale-100"
                title="Abrir Controles Avanzados"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {/* Poster & Número Gigante */}
              <div className="w-[85px] sm:w-[95px] bg-black/40 flex-shrink-0 flex flex-col items-center justify-center border-r border-zinc-800/80 relative p-2 gap-2">
                 <span className={`text-5xl sm:text-6xl font-black tracking-tighter ${sala.cpl_actual ? 'text-zinc-700/80' : 'text-zinc-800/50'}`}>
                    {sala.id}
                 </span>
                 {sala.cpl_actual ? (
                    <Film className={`w-6 h-6 ${isPlaying ? (lucesEncendidas ? 'text-amber-400' : 'text-[#12b886]') : isPaused ? 'text-amber-600' : 'text-zinc-500'}`} />
                 ) : (
                    <Film className="w-6 h-6 text-zinc-800" />
                 )}
              </div>

              {/* Info Derecha */}
              <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between overflow-hidden">
                
                {/* Header: Título de película */}
                <div className="pr-6">
                  <h3 className={`text-[13px] sm:text-[14px] font-semibold tracking-wide truncate ${sala.cpl_actual ? 'text-zinc-100' : 'text-zinc-600'}`}>
                    {sala.cpl_actual ? sala.cpl_actual.replace(/_/g, ' ') : 'SALA LIBRE'}
                  </h3>
                  {sala.cpl_actual && (
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] sm:text-xs text-zinc-500 font-mono font-medium truncate">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isPlaying ? (lucesEncendidas ? 'bg-amber-400 animate-pulse' : 'bg-[#12b886] animate-pulse') : isPaused ? 'bg-amber-600' : 'bg-zinc-500'}`}></span>
                      <span className="truncate">{lucesEncendidas ? 'DESALOJO (LUCES ON)' : sala.estado_reproduccion}</span>
                    </div>
                  )}
                </div>

                {/* Tiempos y Barra con Marcador */}
                {sala.cpl_actual ? (
                  <div className="mt-2 mb-1">
                    <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono mb-1.5 text-zinc-400 font-medium">
                      <span className={lucesEncendidas ? 'text-amber-400' : 'text-sky-400'}>{formatTime(actual)}</span>
                      <span>-{formatTime(restante)}</span>
                    </div>
                    
                    {/* Contenedor de la barra de progreso */}
                    <div className="relative w-full h-2 bg-zinc-800/80 rounded-full overflow-visible">
                      {/* Fondo rellenado */}
                      <div 
                        className={`absolute h-full rounded-full transition-all duration-1000 ${barColor}`}
                        style={{ width: `${progreso}%` }}
                      />
                      
                      {/* Marcador de Macro de Luces */}
                      {duracion > 5 && (
                        <div 
                          className={`absolute top-1/2 -translate-y-1/2 w-1 h-3 rounded-full z-10 transition-colors ${lucesEncendidas ? 'bg-amber-200' : 'bg-zinc-400'}`}
                          style={{ left: `${lucesPorcentaje}%` }}
                          title="Activación de macro de luces"
                        />
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between mt-2.5 gap-1">
                      <div className="flex items-center gap-1 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider truncate">
                         <Sun className={`w-3 h-3 flex-shrink-0 ${lucesEncendidas ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-zinc-500'}`} />
                         {lucesEncendidas ? (
                            <span className="text-amber-400 truncate">Saliendo</span>
                         ) : isPlaying ? (
                            <span className="text-zinc-400 truncate">Luces {formatTime(tiempoParaLuces)}</span>
                         ) : (
                            <span className="text-zinc-600 truncate">En espera</span>
                         )}
                      </div>
                      
                      {/* Controles Integrados Rápidos */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => onEnviarComandoSala?.(sala.id, 'play')} className={`p-1 sm:p-1.5 rounded-lg transition ${isPlaying ? 'bg-zinc-800 text-[#12b886]' : 'bg-zinc-800/50 hover:bg-zinc-700 text-zinc-500'}`}>
                          <Play className="w-3 h-3 fill-current" />
                        </button>
                        <button onClick={() => onEnviarComandoSala?.(sala.id, 'pause')} className={`p-1 sm:p-1.5 rounded-lg transition ${isPaused ? 'bg-zinc-800 text-amber-500' : 'bg-zinc-800/50 hover:bg-zinc-700 text-zinc-500'}`}>
                          <Pause className="w-3 h-3 fill-current" />
                        </button>
                        <button onClick={() => onEnviarComandoSala?.(sala.id, 'stop')} className={`p-1 sm:p-1.5 rounded-lg transition bg-zinc-800/50 hover:bg-red-500/20 hover:text-red-400 text-zinc-500`}>
                          <Square className="w-3 h-3 fill-current" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1" />
                )}

                {/* Próxima Sesión */}
                <div className="mt-2 pt-2 border-t border-zinc-800/50 flex items-center justify-between text-[9px] sm:text-[10px] text-zinc-500 font-medium">
                  <span className="flex items-center gap-1 truncate pr-2">
                    <Clock className="w-3 h-3 flex-shrink-0 opacity-70" />
                    <span className="truncate text-zinc-400">{sala.cpl_actual ? (sala.id % 2 === 0 ? 'INSIDIOUS' : 'TADEO JONES') : 'Pendiente'}</span>
                  </span>
                  <span className="font-mono bg-zinc-800/50 px-1.5 py-0.5 rounded text-zinc-400 flex-shrink-0">{getNextSessionTime(sala.id)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modalSalaId && (
        <SalaControlModal 
          sala={salas.find(s => s.id === modalSalaId)!} 
          onClose={() => setModalSalaId(null)}
          onEnviarComando={onEnviarComandoSala || (() => {})}
        />
      )}
    </section>
  );
};

const VideoIcon = () => (
  <svg xmlns="http://www.w3.org/.svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
);
"""
with open("src/components/SalasGrid.tsx", "w") as f:
    f.write(content)
