import React from 'react';
import { AlertOctagon, ShieldAlert, X, ArrowRight } from 'lucide-react';

interface AlertaProteccionBannerProps {
  mensaje: string;
  detalles?: string[];
  onDismiss: () => void;
  onVerCola: () => void;
}

export const AlertaProteccionBanner: React.FC<AlertaProteccionBannerProps> = ({
  mensaje,
  detalles = [],
  onDismiss,
  onVerCola,
}) => {
  if (!mensaje) return null;

  return (
    <div
      id="alerta-proteccion-critica"
      className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-1"
      role="alert"
    >
      <div className="bg-red-950/90 border-2 border-red-600 rounded-xl p-4 shadow-2xl shadow-red-950/60 text-red-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in duration-300">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-red-600 text-white shrink-0 shadow-md">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-700 text-white text-[10px] font-bold uppercase tracking-wider">
                Regla de Protección Crítica DCI
              </span>
              <span className="text-red-300 text-xs font-mono">SQLite: cola_ingestas -&gt; PENDIENTE</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-red-200 mt-1 tracking-tight">
              {mensaje}
            </h3>
            {detalles.length > 0 ? (
              <ul className="mt-1 text-xs text-red-300/90 space-y-0.5 list-disc list-inside font-mono">
                {detalles.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-red-300/80">
                El servidor DCI se encuentra leyendo el paquete JPEG2000 a 250 Mbps. La ingesta masiva se encola para post-sesión evitando caída de buffer o jitter.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <button
            id="btn-ver-cola-desde-alerta"
            onClick={onVerCola}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow cursor-pointer"
          >
            <span>Ver Cola Diferida</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-cerrar-alerta"
            onClick={onDismiss}
            className="p-1.5 rounded-lg hover:bg-red-900/80 text-red-300 hover:text-white transition cursor-pointer"
            title="Cerrar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
