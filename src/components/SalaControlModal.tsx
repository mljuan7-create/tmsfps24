import React, { useState } from 'react';
import { X, Play, Pause, Square, SkipBack, SkipForward, Volume2, Volume1, VolumeX, Lightbulb, Video, Settings2, ListVideo } from 'lucide-react';
import { Sala } from '../types';

interface SalaControlModalProps {
  sala: Sala;
  onClose: () => void;
  onEnviarComando: (id: number, comando: 'play' | 'pause' | 'stop') => void;
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

export const SalaControlModal: React.FC<SalaControlModalProps> = ({ sala, onClose, onEnviarComando }) => {
  const [volumen, setVolumen] = useState(6.5);
  const [lamparaOn, setLamparaOn] = useState(false);
  const [douserAbierto, setDouserAbierto] = useState(false);

  const isPlaying = sala.estado_reproduccion === 'PLAYING';
  const duracion = sala.duracion_total_min || 120;
  const restante = sala.tiempo_restante_min || 0;
  const actual = duracion - restante;
  const progreso = Math.min(100, Math.max(0, (actual / duracion) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111318] border border-zinc-800 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-inner ${isPlaying ? 'bg-[#12b886] text-zinc-900' : 'bg-zinc-800 text-zinc-400'}`}>
              {sala.id}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-light tracking-wide text-zinc-100 uppercase">
                {sala.cpl_actual ? sala.cpl_actual.replace(/_/g, ' ') : 'SALA SIN SESIÓN ACTIVA'}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-700 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Section */}
        <div className="p-6 border-b border-zinc-800/80 bg-[#16181d]">
          <div className="text-sm text-zinc-400 font-mono mb-4 truncate">
            {sala.cpl_actual || 'Esperando contenido...'}
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-2 bg-zinc-800 rounded-full mb-6">
            <div 
              className="absolute h-full bg-[#12b886] rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(18,184,134,0.4)]"
              style={{ width: `${progreso}%` }}
            />
            <div 
              className="absolute w-3 h-3 bg-white rounded-full shadow transform -translate-y-1/2 -translate-x-1/2 top-1/2"
              style={{ left: `${progreso}%` }}
            />
          </div>

          {/* Controls & Times */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Current Time */}
            <div className="bg-[#1e293b] text-sky-400 px-4 py-1.5 rounded text-sm font-mono tracking-wider border border-sky-900/30">
              {formatTime(actual)}
            </div>

            {/* Transport Controls */}
            <div className="flex items-center gap-3">
              <button className="p-2 text-zinc-500 hover:text-zinc-300 transition">
                <SkipBack className="w-5 h-5 fill-current" />
              </button>
              
              <button 
                onClick={() => onEnviarComando(sala.id, 'play')}
                className={`p-4 rounded-full transition-all shadow-lg ${isPlaying ? 'bg-[#12b886] text-zinc-900' : 'bg-zinc-800 text-zinc-300 hover:bg-[#12b886] hover:text-zinc-900'}`}
              >
                <Play className="w-6 h-6 fill-current ml-1" />
              </button>
              
              <button 
                onClick={() => onEnviarComando(sala.id, 'pause')}
                className={`p-3 rounded-full transition ${sala.estado_reproduccion === 'PAUSED' ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
              >
                <Pause className="w-5 h-5 fill-current" />
              </button>
              
              <button 
                onClick={() => onEnviarComando(sala.id, 'stop')}
                className="p-3 rounded-full bg-zinc-800 text-zinc-400 hover:text-red-500 transition"
              >
                <Square className="w-5 h-5 fill-current" />
              </button>
              
              <button className="p-2 text-zinc-500 hover:text-zinc-300 transition">
                <SkipForward className="w-5 h-5 fill-current" />
              </button>
            </div>

            {/* Remaining / Total */}
            <div className="bg-zinc-800/80 text-zinc-400 px-4 py-1.5 rounded text-sm font-mono tracking-wider border border-zinc-700/50">
              -{formatTime(restante)} / {formatTime(duracion)}
            </div>
          </div>
        </div>

        {/* Lower Modules */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[#0f1115] overflow-y-auto max-h-[50vh]">
          
          {/* Proyector & Hardware */}
          <div className="bg-zinc-900/50 rounded-lg p-5 border border-zinc-800">
            <h3 className="text-zinc-300 font-medium mb-5 flex items-center gap-2">
              <Video className="w-4 h-4 text-sky-400" /> Proyector
            </h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Lámpara</span>
                <button 
                  onClick={() => setLamparaOn(!lamparaOn)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${lamparaOn ? 'bg-amber-500' : 'bg-zinc-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${lamparaOn ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">Douser (Pala)</span>
                <button 
                  onClick={() => setDouserAbierto(!douserAbierto)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${douserAbierto ? 'bg-[#12b886]' : 'bg-zinc-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${douserAbierto ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            
            <div className="mt-6 pt-5 border-t border-zinc-800/80 flex items-center justify-between">
              <span className="text-sm text-zinc-400">Formato</span>
              <span className="text-sm font-mono text-zinc-200 bg-zinc-800 px-2 py-1 rounded">SCOPE 2D</span>
            </div>
          </div>

          {/* Audio & Macros */}
          <div className="bg-zinc-900/50 rounded-lg p-5 border border-zinc-800 space-y-6">
            <div>
              <h3 className="text-zinc-300 font-medium mb-4 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-violet-400" /> Procesador de Sonido
              </h3>
              <div className="flex items-center gap-4">
                <Volume1 className="w-5 h-5 text-zinc-500" />
                <input 
                  type="range" 
                  min="0" max="10" step="0.1" 
                  value={volumen}
                  onChange={(e) => setVolumen(parseFloat(e.target.value))}
                  className="w-full accent-violet-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-violet-400 font-mono font-bold w-8 text-right">{volumen.toFixed(1)}</span>
              </div>
            </div>

            <div className="pt-5 border-t border-zinc-800/80">
              <h3 className="text-zinc-300 font-medium mb-3 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-zinc-400" /> Ejecutar Macro
              </h3>
              <div className="flex gap-2">
                <select className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded px-3 py-2 outline-none focus:border-zinc-500">
                  <option>Seleccione una macro...</option>
                  <option>Luces FULL ON</option>
                  <option>Luces HALF</option>
                  <option>Luces OFF</option>
                  <option>Abrir Telón</option>
                </select>
                <button className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200 px-4 py-2 rounded text-sm transition">
                  Ejecutar
                </button>
              </div>
            </div>
          </div>

          {/* Playlist Actual */}
          <div className="lg:col-span-2 bg-zinc-900/50 rounded-lg p-5 border border-zinc-800">
             <h3 className="text-zinc-300 font-medium mb-4 flex items-center gap-2">
                <ListVideo className="w-4 h-4 text-zinc-400" /> Playlist Actual
             </h3>
             <div className="w-full text-left text-sm text-zinc-400 border border-zinc-800/80 rounded overflow-hidden">
                <div className="flex bg-zinc-800/50 p-2 font-semibold">
                   <div className="w-24 pl-2">Empezar</div>
                   <div className="flex-1">Nombre</div>
                   <div className="w-24 text-right pr-2">Duración</div>
                </div>
                {sala.cpl_actual ? (
                  <div className="flex bg-[#12b886]/10 text-[#12b886] p-2 items-center border-b border-zinc-800/50">
                     <div className="w-24 pl-2 font-mono text-xs">00:00:00</div>
                     <div className="flex-1 font-medium truncate pr-4">{sala.cpl_actual}</div>
                     <div className="w-24 text-right pr-2 font-mono text-xs">{formatTime(sala.duracion_total_min || 120)}</div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-zinc-600 italic">No hay contenido cargado en la playlist</div>
                )}
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
