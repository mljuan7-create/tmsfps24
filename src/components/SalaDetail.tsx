import React from 'react';
import { Sala } from '../types';
import { Clock, User, Power, Eye, Play, Pause, Square, SkipBack, SkipForward, ChevronUp, ChevronDown, ListEnd } from 'lucide-react';

interface SalaDetailProps {
  sala: Sala;
  salas: Sala[];
  onCerrar: () => void;
  onCambiarSala: (id: number) => void;
  onEnviarComandoSala: (id: number, comando: string, valor?: any) => void;
}

export function SalaDetail({ sala, salas, onCerrar, onCambiarSala, onEnviarComandoSala }: SalaDetailProps) {
  const formatMin = (mins: number) => {
    if (!mins || isNaN(mins)) return "00:00:00";
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    const s = Math.floor((mins * 60) % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isPlaying = sala.estado_reproduccion === 'PLAYING';
  const duracion = sala.duracion_total_min || 0;
  const actual = sala.minutaje_actual_min || 0;
  const restante = Math.max(0, duracion - actual);
  const pct = duracion > 0 ? Math.min(100, (actual / duracion) * 100) : 0;
  
  const isLucesOn = sala.luces_estado === 'ON';
  const isAuto = sala.modo_automatico !== 0;

  return (
    <div className="bg-[#0d0d0d] min-h-[500px] border border-zinc-800 rounded-lg shadow-2xl text-zinc-300 flex flex-col">
      {/* Top Circles */}
      <div className="bg-[#121212] border-b border-zinc-800 px-4 py-3 flex gap-2 rounded-t-lg">
        {salas.map(s => (
          <button 
            key={s.id} 
            onClick={() => onCambiarSala(s.id)}
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${s.id === sala.id ? 'bg-cyan-500 text-[#0d0d0d] shadow-[0_0_10px_rgba(0,229,255,0.4)]' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
          >
            {s.id}
          </button>
        ))}
        <button onClick={onCerrar} className="ml-auto text-cyan-400 text-sm hover:text-cyan-300 font-medium">Volver al Dashboard</button>
      </div>

      <div className="p-6 flex-1">
        {/* Title and top right icons */}
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-2xl font-bold text-zinc-100 shadow-inner">
               {sala.id}
             </div>
             <h2 className="text-3xl font-light text-zinc-100 uppercase tracking-wide">{sala.cpl_actual || 'SIN CONTENIDO CPL'}</h2>
           </div>
           <div className="flex gap-2">
             <button onClick={() => onEnviarComandoSala(sala.id, 'modo_automatico', !isAuto)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isAuto ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-cyan-500 text-[#0d0d0d] shadow-[0_0_8px_rgba(0,229,255,0.3)]'}`} title={isAuto ? "Cambiar a Manual" : "En Manual"}><User className="w-5 h-5"/></button>
             <button onClick={() => onEnviarComandoSala(sala.id, 'modo_automatico', !isAuto)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isAuto ? 'bg-cyan-500 text-[#0d0d0d] shadow-[0_0_8px_rgba(0,229,255,0.3)]' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`} title={isAuto ? "En Automático" : "Cambiar a Automático"}><Clock className="w-5 h-5"/></button>
           </div>
        </div>

        {/* CPL full name */}
        <div className="text-cyan-400 text-sm font-mono mb-6 px-3">
          {sala.cpl_actual || 'CPL_NAME_FTR_S_ES-XX_ES_51_4K_SPE_20260812_PXU_SMPTE_VF'}
        </div>

        {/* Big Progress Bar */}
        <div className="h-4 w-full bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden relative mb-6">
           <div className={`absolute top-0 left-0 h-full transition-all duration-1000 ${isLucesOn ? 'bg-yellow-400' : 'bg-cyan-500'}`} style={{ width: `${pct}%` }}></div>
           <div className="absolute top-0 w-2 h-2 bg-white transform rotate-45 -ml-1 mt-1 shadow-lg" style={{ left: `${pct}%` }}></div>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center justify-between bg-[#121212] border border-zinc-800 rounded-lg p-5 mb-6 shadow-md">
          <div className="text-2xl font-mono bg-[#0d0d0d] border border-zinc-800 px-4 py-2 rounded text-zinc-300">
            {formatMin(actual)}
          </div>
          
          <div className="flex items-center gap-6 text-zinc-500">
            <SkipBack className="w-8 h-8 cursor-pointer hover:text-cyan-400 transition-colors" />
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-[#0d0d0d] cursor-pointer transition-all ${isPlaying ? 'bg-cyan-500 shadow-[0_0_15px_rgba(0,229,255,0.5)]' : 'bg-zinc-700 hover:bg-cyan-400'}`}>
              <Play className="w-7 h-7 fill-current ml-1" onClick={() => onEnviarComandoSala(sala.id, 'play')} />
            </div>
            <Pause className={`w-8 h-8 cursor-pointer transition-colors ${!isPlaying ? 'text-zinc-300' : 'hover:text-cyan-400'}`} onClick={() => onEnviarComandoSala(sala.id, 'pause')} />
            <Square className="w-8 h-8 cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => onEnviarComandoSala(sala.id, 'stop')} />
            <SkipForward className="w-8 h-8 cursor-pointer hover:text-cyan-400 transition-colors" />
            
            <div className="flex items-center gap-3 border-l border-zinc-800 pl-6 ml-2">
              <span className="text-sm font-semibold tracking-wide text-zinc-400">PASO</span>
              <div className="flex bg-[#0d0d0d] border border-zinc-800 rounded px-3 py-1.5 text-sm items-center gap-2">
                <span className="text-zinc-200">30 sec</span>
                <div className="flex flex-col gap-0.5">
                   <ChevronUp className="w-3 h-3 cursor-pointer hover:text-cyan-400" />
                   <ChevronDown className="w-3 h-3 cursor-pointer hover:text-cyan-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="text-right">
             <div className="text-2xl font-mono text-zinc-200">-{formatMin(restante)} <span className="text-zinc-600">/ {formatMin(duracion)}</span></div>
             <div className="text-sm text-zinc-500 mt-1">Próxima sesión a las - 18:29</div>
          </div>
        </div>

        {/* Hardware & Macros Controls */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#121212] border border-zinc-800 rounded-lg p-5 shadow-md relative">
            <div className="flex items-center justify-between text-cyan-400 font-semibold mb-6 border-b border-zinc-800/50 pb-3 uppercase tracking-wide text-sm">
               Control de Proyector
               <div className="flex gap-3 text-zinc-500"><Eye className="w-5 h-5 hover:text-zinc-300 cursor-pointer"/><Power className="w-5 h-5 hover:text-red-400 cursor-pointer"/></div>
            </div>
            
            <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                   <span className="text-zinc-400 font-medium">Lámpara</span>
                   <div className="flex items-center gap-3 text-sm font-semibold">
                      <span className="text-zinc-600">OFF</span>
                      <div className="w-12 h-6 rounded-full bg-[#0d0d0d] border border-zinc-800 relative cursor-pointer" onClick={() => onEnviarComandoSala(sala.id, 'lamp_on')}>
                         <div className="w-5 h-5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] rounded-full absolute left-0.5 top-0.5 transition-all"></div>
                      </div>
                      <span className="text-zinc-300">ON</span>
                   </div>
                </div>
                
                <div className="flex items-center justify-between">
                   <span className="text-zinc-400 font-medium">Pala (Douser)</span>
                   <div className="flex items-center gap-3 text-sm font-semibold">
                      <span className="text-zinc-300">Cerrada</span>
                      <div className="w-12 h-6 rounded-full bg-[#0d0d0d] border border-zinc-800 relative cursor-pointer transition-colors" onClick={() => onEnviarComandoSala(sala.id, 'douser_open')}>
                         <div className="w-5 h-5 bg-cyan-500 shadow-[0_0_8px_rgba(0,229,255,0.6)] rounded-full absolute right-0.5 top-0.5 transition-all"></div>
                      </div>
                      <span className="text-zinc-600">Abierta</span>
                   </div>
                </div>
            </div>

            <div className="text-xs text-zinc-600 mt-6 pt-4 border-t border-zinc-800/50">Formato : SCOPE 2D</div>
          </div>

          <div className="flex flex-col gap-6">
            
            {/* Ejecutar Macro (NUEVO) */}
            <div className="bg-[#121212] border border-zinc-800 rounded-lg p-5 shadow-md flex flex-col">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-4 border-b border-zinc-800/50 pb-3 uppercase tracking-wide text-sm">
                 <ListEnd className="w-4 h-4"/> Ejecutar Macro / Cue
              </div>
              
              <div className="flex items-center gap-3 mt-2">
                <select 
                   className="flex-1 bg-[#0d0d0d] border border-zinc-800 rounded px-3 py-2.5 text-sm text-zinc-200 outline-none hover:border-zinc-600 focus:border-cyan-500 transition-colors"
                   onChange={(e) => {
                     if (e.target.value) {
                       onEnviarComandoSala(sala.id, 'macro', e.target.value);
                       e.target.value = '';
                     }
                   }}
                >
                  <option value="">Seleccione una opción de macro...</option>
                  <optgroup label="Más usadas" className="bg-[#121212] text-zinc-300">
                    <option value="LUCES 100%">💡 LUCES 100% (Subida de sala)</option>
                    <option value="LUCES 50%">💡 LUCES 50% (Tráilers)</option>
                    <option value="LUCES 0%">💡 LUCES 0% (Película)</option>
                    <option value="Limpieza">🧹 Modo Limpieza (Luz + Techo)</option>
                  </optgroup>
                  <optgroup label="Hardware y Control" className="bg-[#121212] text-zinc-500">
                    <option value="Lamp On">Proyector: Lámpara ON</option>
                    <option value="Lamp Off">Proyector: Lámpara OFF</option>
                    <option value="Douser Open">Proyector: Pala Abierta</option>
                    <option value="CP750 Input: Digital 1">Audio: Input Digital 1</option>
                    <option value="CP750 Input: Analog">Audio: Input Analog</option>
                  </optgroup>
                </select>
              </div>
              <div className="text-[11px] text-zinc-500 mt-3 font-mono">
                Macros obtenidas en tiempo real del servidor Dolby DSS220 (Pto. 8080)
              </div>
            </div>
            
            {/* Cargar SPL */}
            <div className="bg-[#121212] border border-zinc-800 rounded-lg p-5 shadow-md">
              <div className="text-cyan-400 font-semibold mb-4 uppercase tracking-wide text-sm">Cargar SPL / Show</div>
              <div className="flex gap-3">
                <select className="flex-1 bg-[#0d0d0d] border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 outline-none hover:border-zinc-600 focus:border-cyan-500">
                  <option>Seleccionar lista disponible...</option>
                  <option value="SPL1">Gladiator II</option>
                  <option value="SPL2">Trailers Cortos</option>
                </select>
                <button className="px-5 py-2 bg-zinc-800 hover:bg-cyan-500 hover:text-[#0d0d0d] text-zinc-300 rounded font-semibold text-sm transition-colors shadow">
                   Cargar
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
