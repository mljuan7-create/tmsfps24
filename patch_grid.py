import os

content = """import React from 'react';
import { Film, Play, Pause, Square, CheckSquare, Sun, Clock } from 'lucide-react';
import { SalaCabina } from '../types';

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
  const todasSeleccionadas = salas.length > 0 && salasSeleccionadas.length === salas.length;

  return (
    <section className="bg-zinc-900/40 p-4 sm:p-6 rounded-xl border border-zinc-800/50 flex flex-col h-full">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-light tracking-wide text-zinc-100">
            MONITOR DE CABINA
          </h2>
          <p className="text-sm text-zinc-500 mt-1">Estado de proyección simplificado</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={todasSeleccionadas ? onDeselectTodasSalas : onSelectTodasSalas}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
          >
            {todasSeleccionadas ? (
              <CheckSquare className="w-4 h-4 text-[#12b886]" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">Seleccionar Todas</span>
          </button>
        </div>
      </div>

      {/* Grid de Salas - Estilo Limpio (Basado en el mockup) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {salas.map((sala) => {
          const isSelected = salasSeleccionadas.includes(sala.id);
          const isPlaying = sala.estado_reproduccion === 'PLAYING';
          
          const duracion = sala.duracion_total_min || 120;
          const restante = sala.tiempo_restante_min || 0;
          const actual = duracion - restante;
          const progreso = Math.min(100, Math.max(0, (actual / duracion) * 100));
          
          // Luces (asumimos 5 min antes del fin)
          const tiempoParaLuces = Math.max(0, restante - 5);
          const lucesEncendidas = isPlaying && restante <= 5 && restante > 0;

          return (
            <div 
              key={sala.id}
              className={`relative flex bg-white dark:bg-[#1f2125] rounded-md shadow-sm transition-all duration-200 border overflow-hidden ${
                isSelected ? 'border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.2)]' : 'border-zinc-200 dark:border-zinc-800'
              }`}
              style={{ minHeight: '160px' }}
            >
              {/* Overlay clickeable para seleccionar */}
              <div 
                className="absolute inset-0 h-[60%] cursor-pointer z-10" 
                onClick={() => onToggleSeleccionSala(sala.id)}
              />

              {/* Poster Izquierda */}
              <div className="w-[110px] sm:w-[130px] bg-[#f8fafc] dark:bg-[#141518] flex-shrink-0 flex items-center justify-center border-r border-zinc-200 dark:border-zinc-800 z-20 flex-col">
                <div className="flex-1 flex w-full flex-col justify-center items-center py-2 relative">
                   {sala.cpl_actual ? (
                      <div className="w-[85px] h-[120px] bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 shadow flex items-center justify-center rounded-sm">
                        <Film className="w-10 h-10 text-zinc-400 opacity-60" />
                      </div>
                   ) : (
                      <div className="w-[85px] h-[120px] border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center rounded-sm">
                         <Film className="w-10 h-10 text-zinc-300 opacity-30" />
                      </div>
                   )}
                   
                   {/* Controles de Reproducción (superpuestos abajo) */}
                   <div className="absolute -bottom-3 flex gap-1 z-30 bg-white dark:bg-[#1f2125] p-1 rounded-full shadow-md border border-zinc-100 dark:border-zinc-800">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEnviarComandoSala?.(sala.id, 'play'); }}
                        className={`p-1.5 rounded-full ${isPlaying ? 'bg-[#12b886] text-white shadow-sm' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-[#12b886] hover:text-white'} transition`}
                        title="Reproducir"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEnviarComandoSala?.(sala.id, 'pause'); }}
                        className={`p-1.5 rounded-full ${sala.estado_reproduccion==='PAUSED' ? 'bg-amber-500 text-white shadow-sm' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-amber-500 hover:text-white'} transition`}
                        title="Pausar"
                      >
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEnviarComandoSala?.(sala.id, 'stop'); }}
                        className={`p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-red-500 hover:text-white transition`}
                        title="Detener"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                      </button>
                   </div>
                </div>
              </div>

              {/* Info Derecha */}
              <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between bg-white dark:bg-[#1f2125]">
                
                {/* Header: Círculo Sala + Título */}
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${sala.cpl_actual ? 'bg-[#12b886]' : 'bg-zinc-400 dark:bg-zinc-600'}`}>
                    {sala.id}
                  </div>
                  <h3 className="text-zinc-700 dark:text-zinc-200 text-sm sm:text-[15px] tracking-wide truncate max-w-[150px] uppercase font-semibold">
                    {sala.cpl_actual ? sala.cpl_actual.replace(/_/g, ' ') : 'SIN SESIÓN'}
                  </h3>
                  {sala.cpl_actual && (
                     <div className="ml-auto text-zinc-400">
                       <Clock className="w-4 h-4" />
                     </div>
                  )}
                </div>

                {/* Progress & Times */}
                {sala.cpl_actual ? (
                  <div className="mt-4">
                    {/* Barra de progreso */}
                    <div className="relative w-full h-[7px] bg-[#2c3e50] dark:bg-zinc-800 overflow-visible rounded-sm flex items-center">
                      <div 
                        className="absolute h-full bg-[#12b886] transition-all duration-1000 rounded-sm"
                        style={{ width: `${progreso}%` }}
                      />
                      {/* Triangle marker */}
                      <div 
                        className="absolute w-2 h-2.5 bg-[#f1c40f] transform -translate-y-1/2 -translate-x-1/2 z-10"
                        style={{ left: `${progreso}%`, top: '50%', clipPath: 'polygon(0 0, 0 100%, 100% 50%)' }}
                      />
                    </div>

                    {/* Tiempos en cajas estilo chevrons */}
                    <div className="flex items-center mt-3 text-[11px] sm:text-[13px] font-mono tracking-tight font-medium">
                      {/* Caja actual (Celeste) */}
                      <div 
                        className="bg-[#e0f2fe] text-[#0369a1] px-3 py-1 rounded-l-sm"
                        style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)', paddingRight: '22px' }}
                      >
                        {formatTime(actual)}
                      </div>
                      
                      {/* Caja restante/total (Gris) */}
                      <div 
                        className="bg-[#e2e8f0] text-[#475569] dark:bg-zinc-800 dark:text-zinc-300 px-3 py-1 -ml-[8px] rounded-r-sm"
                        style={{ clipPath: 'polygon(12px 50%, 0 0, 100% 0, 100% 100%, 0 100%)', paddingLeft: '22px' }}
                      >
                        -{formatTime(restante)} / {formatTime(duracion)}
                      </div>
                    </div>

                    {/* Luces */}
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                       <Sun className={`w-3.5 h-3.5 ${lucesEncendidas ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-zinc-400'}`} />
                       {lucesEncendidas ? (
                          <span className="text-amber-600 dark:text-amber-500">LUCES ENCENDIDAS</span>
                       ) : isPlaying ? (
                          <span>LUCES EN <strong>{formatTime(tiempoParaLuces)}</strong></span>
                       ) : (
                          <span>LUCES EN ESPERA</span>
                       )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1" />
                )}

                {/* Bottom: Next Session */}
                <div className="mt-4 border-t border-zinc-200 dark:border-zinc-800 pt-2.5 text-[10.5px] sm:text-[11.5px] text-zinc-500 dark:text-zinc-500 italic flex items-center">
                  Próxima sesión a las {getNextSessionTime(sala.id)} - {sala.cpl_actual ? (sala.id % 2 === 0 ? 'INSIDIOUS' : 'TADEO JONES') : 'PENDIENTE'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
"""
with open("src/components/SalasGrid.tsx", "w") as f:
    f.write(content)
