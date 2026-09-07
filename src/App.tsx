import React, { useState, useEffect } from 'react';
import { SalasGrid } from './components/SalasGrid';
import { ContenidosAccordion } from './components/ContenidosAccordion';
import { ModalIngesta } from './components/ModalIngesta';
import { ColaIngestasDrawer } from './components/ColaIngestasDrawer';
import { AlertaProteccionBanner } from './components/AlertaProteccionBanner';
import { DocumentacionModal } from './components/DocumentacionModal';
import { KdmModal } from './components/KdmModal';
import { tmsApi } from './api/tmsService';
import { Sala, Contenido, TipoContenido, ItemColaIngesta, SolicitudIngesta, KdmInventario } from './types';
import {
  ShieldAlert, HardDriveDownload, CheckCircle2, Info, Sparkles, AlertOctagon,
  HelpCircle, LayoutGrid, Film, Key, ListOrdered, MonitorPlay, Calendar
} from 'lucide-react';

export default function App() {
  const [pestañaActiva, setPestañaActiva] = useState<'supervision' | 'contenidos' | 'horarios' | 'kdms' | 'cola'>('supervision');
  const [salas, setSalas] = useState<Sala[]>([]);
  const [contenidos, setContenidos] = useState<{ todos: Contenido[]; ftr: Contenido[]; tlr: Contenido[]; adv?: Contenido[]; others?: Contenido[]; }>({ todos: [], ftr: [], tlr: [], adv: [], others: [] });
  const [cola, setCola] = useState<ItemColaIngesta[]>([]);
  const [kdms, setKdms] = useState<KdmInventario[]>([]);
  const [salasSeleccionadas, setSalasSeleccionadas] = useState<number[]>([1]);
  const [contenidosSeleccionados, setContenidosSeleccionados] = useState<number[]>([1, 2]);
  
  const [modalIngestaAbierto, setModalIngestaAbierto] = useState<boolean>(false);
  const [drawerColaAbierto, setDrawerColaAbierto] = useState<boolean>(false);
  const [modalDocAbierto, setModalDocAbierto] = useState<boolean>(false);
  
  const [alertaRojaMensaje, setAlertaRojaMensaje] = useState<string | null>(null);
  const [alertaDetalles, setAlertaDetalles] = useState<string[]>([]);
  
  const [notificacionToast, setNotificacionToast] = useState<{tipo: 'success' | 'warning' | 'info'; mensaje: string;} | null>(null);

  useEffect(() => {
    actualizarDatos();
    tmsApi.sincronizarConServidorReal().then(setSalas);
    const interval = setInterval(() => {
      tmsApi.sincronizarConServidorReal().then(setSalas);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const actualizarDatos = () => {
    setSalas(tmsApi.getSalas());
    setContenidos(tmsApi.getContenidos());
    setCola(tmsApi.getColaIngestas());
    setKdms(tmsApi.getKdms());
  };

  const handleCargarKdmXml = (xml: string) => {
    // This will be connected to the real backend later
    const res = tmsApi.cargarKdmXml(xml);
    actualizarDatos();
    mostrarToast(res.mensaje, 'success');
    return res;
  };

  const handleInyectarKdm = (id: number) => {
    const res = tmsApi.inyectarKdm(id);
    actualizarDatos();
    if (res.success) mostrarToast(res.mensaje, 'success');
    else mostrarToast(res.mensaje, 'warning');
  };

  const mostrarToast = (mensaje: string, tipo: 'success' | 'warning' | 'info' = 'info') => {
    setNotificacionToast({ mensaje, tipo });
    setTimeout(() => setNotificacionToast(null), 5000);
  };

  const toggleSeleccionSala = (id: number) => setSalasSeleccionadas(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectTodasSalas = () => setSalasSeleccionadas(salas.map(s => s.id));
  const deselectTodasSalas = () => setSalasSeleccionadas([]);
  
  const toggleSeleccionContenido = (id: number) => setContenidosSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectTodosTipo = (ids: number[]) => setContenidosSeleccionados(prev => Array.from(new Set([...prev, ...ids])));
  const deselectTodosTipo = (ids: number[]) => setContenidosSeleccionados(prev => prev.filter(id => !ids.includes(id)));

  const toggleEstadoSala = (id: number) => { tmsApi.toggleEstadoSala(id); actualizarDatos(); };
  const enviarComandoSala = (id: number, comando: string, valor?: any) => { tmsApi.enviarComando(id, comando, valor); actualizarDatos(); };
  
  const ejecutarIngesta = (solicitud: SolicitudIngesta) => {
    const haySalaPlaying = solicitud.salas_ids.some(sid => {
      const s = salas.find(x => x.id === sid);
      return s && s.estado_reproduccion === 'PLAYING';
    });
    const res = tmsApi.programarIngesta(solicitud);
    actualizarDatos();
    setModalIngestaAbierto(false);
    if (haySalaPlaying && solicitud.modo_horario === 'ahora') {
      setAlertaRojaMensaje("Servidor en proyección. Ingesta diferida encolada automáticamente para evitar parones de lectura.");
      setAlertaDetalles([`Las transferencias a salas en PLAYING se han pausado hasta que acabe la sesión.`]);
    } else {
      mostrarToast(`Transferencia iniciada a ${solicitud.salas_ids.length} sala(s)`, 'success');
    }
  };

  const cancelarIngesta = (id: number) => { tmsApi.cancelarIngesta(id); actualizarDatos(); };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 font-sans selection:bg-red-900 selection:text-white pb-20">
      {/* Header Minimalista Integrado */}
      <div className="bg-[#111318] border-b border-zinc-800/80 sticky top-0 z-30">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-sky-500/10 rounded flex items-center justify-center border border-sky-500/30">
                <MonitorPlay className="w-5 h-5 text-sky-400" />
              </div>
              <h1 className="text-[15px] font-semibold tracking-wide text-zinc-100 flex items-center gap-1.5">
                CineFlow <span className="text-zinc-600 font-light">| TMS</span>
              </h1>
            </div>

            {/* PESTAÑAS CENTRALES TIPO CINEMANEXT */}
            <div className="flex h-full items-end gap-1">
              <button onClick={() => setPestañaActiva('supervision')} className={`px-6 h-full flex items-center gap-2 text-sm transition-colors border-b-2 font-medium ${pestañaActiva === 'supervision' ? 'border-sky-500 text-sky-400 bg-sky-500/5' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
                <LayoutGrid className="w-4 h-4" /> Dashboard
              </button>
              <button onClick={() => setPestañaActiva('contenidos')} className={`px-6 h-full flex items-center gap-2 text-sm transition-colors border-b-2 font-medium ${pestañaActiva === 'contenidos' ? 'border-sky-500 text-sky-400 bg-sky-500/5' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
                <Film className="w-4 h-4" /> Contenidos LMS
              </button>
              <button onClick={() => setPestañaActiva('horarios')} className={`px-6 h-full flex items-center gap-2 text-sm transition-colors border-b-2 font-medium ${pestañaActiva === 'horarios' ? 'border-sky-500 text-sky-400 bg-sky-500/5' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
                <Calendar className="w-4 h-4" /> Horarios
              </button>
              <button onClick={() => setPestañaActiva('kdms')} className={`px-6 h-full flex items-center gap-2 text-sm transition-colors border-b-2 font-medium ${pestañaActiva === 'kdms' ? 'border-sky-500 text-sky-400 bg-sky-500/5' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}>
                <Key className="w-4 h-4" /> KDMs
              </button>
            </div>

            {/* Acciones Derecha */}
            <div className="flex items-center gap-2">
              <button onClick={() => setDrawerColaAbierto(true)} className={`px-3 py-1.5 flex items-center gap-2 text-xs font-medium rounded transition-colors ${cola.length > 0 ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}>
                Transferencias {cola.length > 0 && `(${cola.length})`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {alertaRojaMensaje && (
        <AlertaProteccionBanner
          mensaje={alertaRojaMensaje}
          detalles={alertaDetalles}
          onDismiss={() => setAlertaRojaMensaje(null)}
          onVerCola={() => setDrawerColaAbierto(true)}
        />
      )}

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 pt-6">
        {pestañaActiva === 'supervision' && (
          <SalasGrid salas={salas} onEnviarComandoSala={enviarComandoSala} />
        )}
        
        {pestañaActiva === 'contenidos' && (
          <ContenidosAccordion
            contenidos={contenidos}
            contenidosSeleccionados={contenidosSeleccionados}
            onToggleSeleccionContenido={toggleSeleccionContenido}
            onSelectTodosTipo={selectTodosTipo}
            onDeselectTodosTipo={deselectTodosTipo}
            onOpenModalIngesta={() => setModalIngestaAbierto(true)}
            salasSeleccionadasCount={salasSeleccionadas.length}
          />
        )}

        {pestañaActiva === 'kdms' && (
          <div className="text-zinc-400 text-sm mt-10">
             Gestión de KDMs integrada en backend Fase 3. (Ver API de Carga)
          </div>
        )}
      </div>

      {pestañaActiva === 'contenidos' && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setModalIngestaAbierto(true)}
            className={`flex items-center gap-3 px-5 py-3 rounded-full font-bold text-sm shadow-2xl transition-all duration-300 ${
              contenidosSeleccionados.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-4 ring-emerald-500/30 scale-105'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            <HardDriveDownload className="w-5 h-5" />
            <span>📥 Ingesta</span>
            {contenidosSeleccionados.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-xs">{contenidosSeleccionados.length}</span>
            )}
          </button>
        </div>
      )}

      <ModalIngesta isOpen={modalIngestaAbierto} onClose={() => setModalIngestaAbierto(false)} salas={salas} contenidos={contenidos.todos} salasSeleccionadasInicial={salasSeleccionadas} contenidosSeleccionados={contenidosSeleccionados} onEjecutarIngesta={ejecutarIngesta} />
      <ColaIngestasDrawer isOpen={drawerColaAbierto} onClose={() => setDrawerColaAbierto(false)} cola={cola} onCancelar={cancelarIngesta} />
      <KdmModal isOpen={false} onClose={() => {}} kdms={kdms} salas={salas} onCargarKdmXml={handleCargarKdmXml} onInyectarKdm={handleInyectarKdm} />
      
      {notificacionToast && (
        <div className={`fixed bottom-6 left-6 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200 ${notificacionToast.tipo === 'warning' ? 'bg-red-950/95 border-red-600 text-red-200' : 'bg-emerald-950/95 border-emerald-600 text-emerald-200'}`}>
          <span>{notificacionToast.mensaje}</span>
        </div>
      )}
    </div>
  );
}
