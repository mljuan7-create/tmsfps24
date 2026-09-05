import React, { useState, useEffect } from 'react';
import { LIBRERIAS_FTP_INICIALES } from '../data/parqueAsturData';
import { HardDriveDownload, Server, Clock, ShieldAlert, FileCode2, RotateCcw, Key } from 'lucide-react';

interface HeaderProps {
  totalSeleccionados: number;
  onOpenModalIngesta: () => void;
  onOpenColaIngesta: () => void;
  onOpenDocModal: () => void;
  onOpenKdmModal: () => void;
  onReset: () => void;
  colaPendientesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  totalSeleccionados,
  onOpenModalIngesta,
  onOpenColaIngesta,
  onOpenDocModal,
  onOpenKdmModal,
  onReset,
  colaPendientesCount,
}) => {
  const [horaActual, setHoraActual] = useState<string>('');

  useEffect(() => {
    const actualizarReloj = () => {
      const ahora = new Date();
      setHoraActual(
        ahora.toLocaleTimeString('es-ES', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    actualizarReloj();
    const interval = setInterval(actualizarReloj, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header id="tms-header" className="bg-zinc-950/95 border-b border-zinc-800 text-zinc-100 sticky top-0 z-30 backdrop-blur-md">
      {/* Barra superior de estado de cabina y FTPs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 border-b border-zinc-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3 text-zinc-400">
          <span className="flex items-center gap-1.5 font-mono text-zinc-300">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <strong className="text-zinc-200">TMS Local:</strong> 10.100.47.10 (Parque Astur)
          </span>
          <span className="hidden md:inline text-zinc-700">|</span>
          <span className="hidden md:flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            10 Salas DCI Sincronizadas
          </span>
        </div>

        {/* Orígenes FTP Centrales */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <span className="text-zinc-500 font-medium mr-1 text-[11px] uppercase tracking-wider">Librerías FTP:</span>
          {LIBRERIAS_FTP_INICIALES.map((ftp) => (
            <div
              key={ftp.id}
              id={`ftp-pill-${ftp.id}`}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-700/80 text-[11px] whitespace-nowrap"
              title={`Servidor central de contenidos: ${ftp.nombre} en ${ftp.ip}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-zinc-200 font-semibold">{ftp.nombre}</span>
              <span className="text-zinc-400 font-mono text-[10px]">({ftp.ip})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Barra Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Identidad de Marca */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-950/70 border border-red-600/40 flex items-center justify-center text-red-500 font-bold text-lg shadow-inner">
            PA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-mono">
                TMS PARQUE ASTUR
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-red-950/80 text-red-400 border border-red-800/60 tracking-wider">
                Fase 2: Contenidos
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Control Digital Cinema • Servidores GDC & Dolby DSS220 • Christie / NEC
            </p>
          </div>
        </div>

        {/* Reloj y Botones de Acción */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Reloj de Cabina */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-400">CABINA:</span>
            <span className="text-amber-400 font-bold tracking-wider">{horaActual}</span>
          </div>

          {/* Botón Ver Backend Python */}
          <button
            id="btn-doc-python"
            onClick={onOpenDocModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition cursor-pointer"
            title="Ver código backend Python (FastAPI) y SQLite"
          >
            <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Backend</span> main.py
          </button>

          {/* Botón Llaves KDM (Fase 3) */}
          <button
            id="btn-abrir-kdms"
            onClick={onOpenKdmModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-950/70 hover:bg-amber-900 border border-amber-700/80 text-amber-200 hover:text-white text-xs font-medium transition cursor-pointer"
            title="Gestión y enrutador automático de llaves KDM a Sala 5 (Dolby SMI WSDL)"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Llaves KDM</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 font-bold text-[10px]">
              Fase 3
            </span>
          </button>

          {/* Botón Cola de Ingestas */}
          <button
            id="btn-cola-ingestas"
            onClick={onOpenColaIngesta}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition cursor-pointer"
          >
            <HardDriveDownload className="w-3.5 h-3.5 text-sky-400" />
            <span>Cola Ingestas</span>
            {colaPendientesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/90 text-zinc-950 font-bold text-[10px]">
                {colaPendientesCount}
              </span>
            )}
          </button>

          {/* Botón Principal: Ingesta Flotante / Acceso Rápido */}
          <button
            id="btn-abrir-ingesta-header"
            onClick={onOpenModalIngesta}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition shadow-lg cursor-pointer ${
              totalSeleccionados > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50 animate-pulse'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-600'
            }`}
          >
            <span className="text-sm">📥</span>
            <span>Ingesta</span>
            {totalSeleccionados > 0 && (
              <span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-300 rounded text-[11px] font-mono">
                {totalSeleccionados} selec.
              </span>
            )}
          </button>

          {/* Reset Demo */}
          <button
            id="btn-reset-demo"
            onClick={onReset}
            className="p-2 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs transition cursor-pointer"
            title="Restablecer estado inicial de Parque Astur"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
