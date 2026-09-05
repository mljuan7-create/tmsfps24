import React, { useState } from 'react';
import { KdmInventario, Sala } from '../types';
import { Key, ShieldCheck, CheckCircle2, UploadCloud, Copy, Play, Cpu, AlertCircle, X, Sparkles } from 'lucide-react';

interface KdmModalProps {
  isOpen: boolean;
  onClose: () => void;
  kdms: KdmInventario[];
  salas: Sala[];
  onCargarKdmXml: (xml: string) => { success: boolean; kdm: KdmInventario; mensaje: string };
  onInyectarKdm: (id: number) => void;
}

const XML_EJEMPLO_SALA_5 = `<?xml version="1.0" encoding="UTF-8"?>
<KeyDeliveryMessage xmlns="http://www.dolby.com/dcinema/ws/smi/v1/schemas/licensemanagement">
    <licenseId>urn:uuid:7f3b890a-12c4-4e56-8a9b-0123456789ab</licenseId>
    <clipId>urn:uuid:c3d4e5f6-7a8b-9c0d-1e2f-abcdef123456</clipId>
    <clipTitle>AFuego_FTR_F-185_ES_51</clipTitle>
    <notValidBefore>2026-09-01T00:00:00+02:00</notValidBefore>
    <notValidAfter>2026-09-30T23:59:59+02:00</notValidAfter>
    <serverSerial>DSS220-210405</serverSerial>
</KeyDeliveryMessage>`;

export const KdmModal: React.FC<KdmModalProps> = ({
  isOpen,
  onClose,
  kdms,
  salas,
  onCargarKdmXml,
  onInyectarKdm,
}) => {
  const [xmlInput, setXmlInput] = useState<string>('');
  const [feedback, setFeedback] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  if (!isOpen) return null;

  const handleCargarEjemplo = () => {
    setXmlInput(XML_EJEMPLO_SALA_5);
    const res = onCargarKdmXml(XML_EJEMPLO_SALA_5);
    setFeedback({
      tipo: 'success',
      texto: res.mensaje,
    });
  };

  const handleProcesarPegado = () => {
    if (!xmlInput.trim()) {
      setFeedback({ tipo: 'error', texto: 'Pegue primero el texto XML de la KDM.' });
      return;
    }
    const res = onCargarKdmXml(xmlInput);
    setFeedback({
      tipo: 'success',
      texto: res.mensaje,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-950/70 border border-amber-800/80 text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono flex items-center gap-2">
                <span>FASE 3: ENRUTADOR AUTOMÁTICO DE KDMs</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Dolby SMI WSDL
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Extracción de metadatos XML, cruce automático con seriales de servidores (Sala 5) e inyección SOAP sendLicense.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 font-mono ${
                feedback.tipo === 'success'
                  ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
                  : 'bg-red-950/80 border-red-600 text-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.tipo === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{feedback.texto}</span>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="text-zinc-400 hover:text-white text-[10px]"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Panel de Carga Rápida */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-sky-400" />
                <span>Ingesta de Llaves KDM (XML DCI / SMPTE)</span>
              </span>
              <button
                onClick={handleCargarEjemplo}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/90 hover:bg-amber-900 text-amber-200 border border-amber-700 font-mono font-bold transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Probar KDM Sala 5 (AFuego -&gt; DSS220-210405)</span>
              </button>
            </div>

            <textarea
              value={xmlInput}
              onChange={(e) => setXmlInput(e.target.value)}
              placeholder="Pegue aquí el contenido XML de la KDM (<KeyDeliveryMessage> o <DCKeyDeliveryMessage>)..."
              rows={4}
              className="w-full p-3 rounded-lg bg-zinc-900 border border-zinc-700/80 font-mono text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setXmlInput('')}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition cursor-pointer"
              >
                Limpiar
              </button>
              <button
                onClick={handleProcesarPegado}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Parsear y Enrutar KDM</span>
              </button>
            </div>
          </div>

          {/* Inventario de KDMs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-200 font-mono flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>INVENTARIO DE LLAVES KDM REGISTRADAS ({kdms.length})</span>
              </h3>
              <span className="text-zinc-500 text-[11px]">
                Asociación automática por server_serial
              </span>
            </div>

            {kdms.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 bg-zinc-950/50 rounded-xl border border-zinc-800 font-mono">
                No hay KDMs registradas en la cabina. Cargue una KDM para comenzar.
              </div>
            ) : (
              <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/60">
                <table className="w-full text-left font-mono">
                  <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Película / Clip</th>
                      <th className="py-2.5 px-3">Serial Destino</th>
                      <th className="py-2.5 px-3">Sala Asociada</th>
                      <th className="py-2.5 px-3">Ventana Validez</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-[11px]">
                    {kdms.map((kdm) => {
                      const esSala5 = kdm.sala_id === 5 || kdm.server_serial.includes('210405');
                      return (
                        <tr
                          key={kdm.id}
                          className={`hover:bg-zinc-900/50 transition ${
                            esSala5 ? 'bg-amber-950/10' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-semibold text-zinc-100">
                            <div>{kdm.clip_title}</div>
                            <div className="text-[9px] text-zinc-500 truncate max-w-[180px]">
                              {kdm.clip_id}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                esSala5
                                  ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                                  : 'bg-zinc-800 text-zinc-300'
                              }`}
                            >
                              {kdm.server_serial}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {kdm.sala_nombre ? (
                              <div className="flex items-center gap-1.5 text-zinc-200">
                                <Cpu className="w-3 h-3 text-sky-400" />
                                <span className="font-semibold">{kdm.sala_nombre}</span>
                                {kdm.sala_ip && (
                                  <span className="text-[10px] text-zinc-500">
                                    ({kdm.sala_ip})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-zinc-500">Sin asignar</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400 text-[10px]">
                            <div>Desde: {kdm.notValidBefore?.split('T')[0] || 'Inmediato'}</div>
                            <div>Hasta: {kdm.notValidAfter?.split('T')[0] || '2026-12-31'}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                kdm.estado === 'INYECTADA'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                                  : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                              }`}
                            >
                              {kdm.estado}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => onInyectarKdm(kdm.id)}
                              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-emerald-950 hover:text-emerald-300 hover:border-emerald-700 border border-zinc-700 text-zinc-300 transition cursor-pointer text-[10px]"
                              title="Reinyectar mediante Dolby sendLicense"
                            >
                              Reinyectar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-500">
          <div>
            Estándar SMPTE ST 430-1 &bull; WSDL LicenseManagementService v1 &bull; Parque Astur
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
