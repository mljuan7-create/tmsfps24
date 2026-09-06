import os
import re

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-light tracking-wide text-zinc-100 flex items-center gap-2">
            <VideoIcon /> MONITOR DE CABINA
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Estado en tiempo real de proyección y hardware</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={todasSeleccionadas ? onDeselectTodasSalas : onSelectTodasSalas}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700/50 transition"
          >
            {todasSeleccionadas ? (
              <CheckSquare className="w-4 h-4 text-emerald-500" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">Seleccionar Todas</span>
          </button>
        </div>
      </div>

      {/* Grid de Salas - Estilo Oscuro Integrado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
        {salas.map((sala) => {
          const isSelected = salasSeleccionadas.includes(sala.id);
          const isPlaying = sala.estado_reproduccion === 'PLAYING';
          const isPaused = sala.estado_reproduccion === 'PAUSED';
          
          const duracion = sala.duracion_total_min || 120;
          const restante = sala.tiempo_restante_min || 0;
          const actual = duracion - restante;
          const progreso = Math.min(100, Math.max(0, (actual / duracion) * 100));
          
          const tiempoParaLuces = Math.max(0, restante - 5);
          const lucesEncendidas = isPlaying && restante <= 5 && restante > 0;

          return (
            <div 
              key={sala.id}
              className={`relative flex bg-zinc-900/60 rounded-xl transition-all duration-200 border overflow-hidden group hover:border-zinc-700 cursor-pointer ${
                isSelected ? 'border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.15)] bg-sky-950/20' : 'border-zinc-800/80'
              }`}
              style={{ minHeight: '140px' }}
              onClick={() => onToggleSeleccionSala(sala.id)}
            >
              {/* Botón Flotante para Controles Avanzados */}
              <button 
                onClick={(e) => handleOpenModal(sala.id, e)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-zinc-800 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-sky-500 hover:text-white z-20"
                title="Abrir Controles Avanzados"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Poster Minimalista Izquierda */}
              <div className="w-[100px] bg-black/40 flex-shrink-0 flex items-center justify-center border-r border-zinc-800/80 relative">
                 <div className="absolute top-2 left-2 w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                    {sala.id}
                 </div>
                 {sala.cpl_actual ? (
                    <Film className={`w-10 h-10 ${isPlaying ? 'text-[#12b886] drop-shadow-[0_0_8px_rgba(18,184,134,0.5)]' : isPaused ? 'text-amber-500' : 'text-zinc-500'}`} />
                 ) : (
                    <Film className="w-8 h-8 text-zinc-700 opacity-30" />
                 )}
              </div>

              {/* Info Derecha */}
              <div className="flex-1 p-4 flex flex-col justify-between">
                
                {/* Header: Título de película */}
                <div className="pr-8">
                  <h3 className={`text-[15px] font-semibold tracking-wide truncate ${sala.cpl_actual ? 'text-zinc-100' : 'text-zinc-600'}`}>
                    {sala.cpl_actual ? sala.cpl_actual.replace(/_/g, ' ') : 'SALA LIBRE'}
                  </h3>
                  {sala.cpl_actual && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500 font-mono">
                      <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-[#12b886] animate-pulse' : isPaused ? 'bg-amber-500' : 'bg-zinc-500'}`}></span>
                      {sala.estado_reproduccion}
                    </div>
                  )}
                </div>

                {/* Tiempos y Barra */}
                {sala.cpl_actual ? (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1.5 text-zinc-400">
                      <span className="text-sky-400">{formatTime(actual)}</span>
                      <span>-{formatTime(restante)}</span>
                    </div>
                    
                    <div className="relative w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`absolute h-full rounded-full transition-all duration-1000 ${isPlaying ? 'bg-[#12b886]' : isPaused ? 'bg-amber-500' : 'bg-zinc-500'}`}
                        style={{ width: `${progreso}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-medium">
                         <Sun className={`w-3.5 h-3.5 ${lucesEncendidas ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-zinc-500'}`} />
                         {lucesEncendidas ? (
                            <span className="text-amber-500">Luces ON</span>
                         ) : isPlaying ? (
                            <span className="text-zinc-400">Luces en {formatTime(tiempoParaLuces)}</span>
                         ) : (
                            <span className="text-zinc-600">Luces en espera</span>
                         )}
                      </div>
                      
                      {/* Controles Integrados Rápidos */}
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => onEnviarComandoSala?.(sala.id, 'play')} className={`p-1.5 rounded-md transition ${isPlaying ? 'bg-[#12b886]/20 text-[#12b886]' : 'hover:bg-zinc-700 text-zinc-500'}`}>
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button onClick={() => onEnviarComandoSala?.(sala.id, 'pause')} className={`p-1.5 rounded-md transition ${isPaused ? 'bg-amber-500/20 text-amber-500' : 'hover:bg-zinc-700 text-zinc-500'}`}>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button onClick={() => onEnviarComandoSala?.(sala.id, 'stop')} className={`p-1.5 rounded-md transition hover:bg-red-500/20 hover:text-red-400 text-zinc-500`}>
                          <Square className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1" />
                )}

                {/* Próxima Sesión */}
                <div className="mt-3 pt-3 border-t border-zinc-800/50 flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 opacity-70" />
                    Sig: {sala.cpl_actual ? (sala.id % 2 === 0 ? 'INSIDIOUS' : 'TADEO JONES') : 'Pendiente'}
                  </span>
                  <span className="font-mono">{getNextSessionTime(sala.id)}</span>
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
  <svg xmlns="http://www.w3.org/.svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
);
"""
with open("src/components/SalasGrid.tsx", "w") as f:
    f.write(content)
