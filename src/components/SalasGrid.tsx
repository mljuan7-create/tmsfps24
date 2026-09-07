import React, { useState } from 'react';
import { Sala } from '../types';
import { Clock, User, Volume2 } from 'lucide-react';
import { SalaDetail } from './SalaDetail';

interface SalasGridProps {
  salas: Sala[];
  onEnviarComandoSala: (id: number, comando: string, valor?: any) => void;
}

export function SalasGrid({ salas, onEnviarComandoSala }: SalasGridProps) {
  const [salaSeleccionada, setSalaSeleccionada] = useState<number | null>(null);

  if (salaSeleccionada !== null) {
    const salaActual = salas.find(s => s.id === salaSeleccionada);
    if (!salaActual) return null;
    return (
      <SalaDetail 
        sala={salaActual} 
        salas={salas}
        onCerrar={() => setSalaSeleccionada(null)}
        onCambiarSala={setSalaSeleccionada}
        onEnviarComandoSala={onEnviarComandoSala}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top Bar Odeon Style */}
      <div className="bg-[#121212] border border-zinc-800/80 text-zinc-100 px-4 py-3 flex items-center gap-4 text-sm font-semibold rounded-t-lg">
        <span className="text-zinc-400 font-normal">Todos los servidores:</span>
        <div className="flex bg-zinc-900 rounded-full p-1 border border-zinc-800">
          <button className="px-4 py-1.5 bg-[#1a1a1a] text-zinc-100 rounded-full shadow-sm flex items-center gap-1.5 transition-colors">
            <User className="w-4 h-4 text-cyan-400"/> Manual
          </button>
          <button className="px-4 py-1.5 text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors">
            <Clock className="w-4 h-4"/> Automático
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 bg-[#0d0d0d] p-4 -mt-4 border border-t-0 border-zinc-800/80 rounded-b-lg">
        {salas.map((sala) => {
          const isPlaying = sala.estado_reproduccion === 'PLAYING';
          const duracion = sala.duracion_total_min || 0;
          const actual = sala.minutaje_actual_min || 0;
          const pct = duracion > 0 ? Math.min(100, Math.max(0, (actual / duracion) * 100)) : 0;
          const volumen = sala.volumen ?? 7.0;
          
          // Lógica Barra Amarilla de Luces
          const isLucesOn = sala.luces_estado === 'ON';
          const pbColor = isLucesOn ? 'bg-yellow-400' : 'bg-cyan-500';
          
          // Lógica del Reloj
          const isAuto = sala.modo_automatico !== 0; // Default 1

          return (
            <div 
              key={sala.id}
              onClick={() => setSalaSeleccionada(sala.id)}
              className="bg-[#121212] border border-zinc-800 rounded-lg shadow-sm overflow-hidden cursor-pointer hover:border-cyan-500/50 hover:shadow-cyan-900/20 transition-all flex flex-col h-[155px]"
            >
              <div className="flex flex-1">
                {/* Left Poster Area */}
                <div className="w-[80px] bg-[#1a1a1a] flex items-center justify-center border-r border-zinc-800">
                   <div className="w-10 h-10 border-2 border-zinc-800 text-zinc-700 flex items-center justify-center rounded-sm">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                   </div>
                </div>
                
                {/* Right Content */}
                <div className="flex-1 p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-cyan-500 text-[#0d0d0d] flex items-center justify-center font-bold text-sm shadow-[0_0_8px_rgba(0,229,255,0.4)]">
                        {sala.id}
                      </div>
                      <span className="text-zinc-100 text-sm font-semibold truncate w-24 tracking-wide">{sala.cpl_actual || '...'}</span>
                    </div>
                    {isAuto && <Clock className="w-4 h-4 text-zinc-500" />}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden relative">
                      <div className={`absolute top-0 left-0 h-full transition-all duration-1000 ${pbColor}`} style={{ width: `${pct}%` }}></div>
                      {pct > 0 && (
                        <div className="absolute top-0 w-1.5 h-1.5 bg-white -ml-1 transform rotate-45 shadow-[0_0_4px_rgba(255,255,255,0.8)]" style={{ left: `${pct}%` }}></div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-1.5">
                     <div className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1 py-0.5 rounded">00:00:00</div>
                     <div className="text-[10px] font-mono text-zinc-500">-00:00:00/00:00:00</div>
                  </div>
                  
                  <div className="text-[10px] text-zinc-400 mt-2 truncate font-medium">
                    Próxima sesión a las 18:00
                  </div>
                </div>
              </div>

              {/* Volume Footer */}
              <div 
                className="bg-[#0f0f0f] border-t border-zinc-800 px-3 py-2 flex items-center justify-between"
                onClick={(e) => e.stopPropagation()} // Evita abrir el detalle al pulsar volumen
              >
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold tracking-wider">CP750</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => onEnviarComandoSala(sala.id, 'volumen', volumen - 0.1)} className="w-6 h-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-center font-bold transition-colors">-</button>
                  <span className="text-sm font-mono text-cyan-400 w-8 text-center">{volumen.toFixed(1)}</span>
                  <button onClick={() => onEnviarComandoSala(sala.id, 'volumen', volumen + 0.1)} className="w-6 h-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center justify-center font-bold transition-colors">+</button>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
