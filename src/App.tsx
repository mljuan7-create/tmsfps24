/**
 * TMS Parque Astur - Theater Management System (Fase 2: Gestión de Contenidos)
 * Interfaz web oscura optimizada para cabinas de proyección digital.
 */

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
  ShieldAlert,
  HardDriveDownload,
  CheckCircle2,
  Info,
  Sparkles,
  AlertOctagon,
  HelpCircle,
  LayoutGrid,
  Film,
  Key,
  ListOrdered,
  MonitorPlay,
} from 'lucide-react';

export default function App() {
  // Pestaña activa
  const [pestañaActiva, setPestañaActiva] = useState<
    'todas' | 'supervision' | 'contenidos' | 'kdms' | 'cola'
  >('todas');

  // Estado principal
  const [salas, setSalas] = useState<Sala[]>([]);
  const [contenidos, setContenidos] = useState<{
    todos: Contenido[];
    ftr: Contenido[];
    tlr: Contenido[];
    adv?: Contenido[];
    others?: Contenido[];
  }>({ todos: [], ftr: [], tlr: [], adv: [], others: [] });
  const [cola, setCola] = useState<ItemColaIngesta[]>([]);
  const [kdms, setKdms] = useState<KdmInventario[]>([]);

  // Selecciones del operador
  const [salasSeleccionadas, setSalasSeleccionadas] = useState<number[]>([1]); // Sala 1 preseleccionada
  const [contenidosSeleccionados, setContenidosSeleccionados] = useState<number[]>([1, 2]); // CONAN29 y AFuego preseleccionados

  // Modales y drawers
  const [modalIngestaAbierto, setModalIngestaAbierto] = useState<boolean>(false);
  const [drawerColaAbierto, setDrawerColaAbierto] = useState<boolean>(false);
  const [modalDocAbierto, setModalDocAbierto] = useState<boolean>(false);
  const [modalKdmAbierto, setModalKdmAbierto] = useState<boolean>(false);

  // Alerta Crítica en Rojo (Regla de Protección)
  const [alertaRojaMensaje, setAlertaRojaMensaje] = useState<string | null>(null);
  const [alertaDetalles, setAlertaDetalles] = useState<string[]>([]);
  const [notificacionToast, setNotificacionToast] = useState<{
    tipo: 'success' | 'warning' | 'info';
    mensaje: string;
  } | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    actualizarDatos();
  }, []);

  const actualizarDatos = () => {
    setSalas(tmsApi.getSalas());
    setContenidos(tmsApi.getContenidos());
    setCola(tmsApi.getColaIngestas());
    setKdms(tmsApi.getKdms());
  };

  const handleCargarKdmXml = (xml: string) => {
    const res = tmsApi.cargarKdmXml(xml);
    actualizarDatos();
    mostrarToast(res.mensaje, 'success');
    return res;
  };

  const handleInyectarKdm = (id: number) => {
    tmsApi.inyectarKdm(id);
    actualizarDatos();
    mostrarToast('KDM reinyectada en el servidor vía SOAP sendLicense', 'success');
  };

  const mostrarToast = (mensaje: string, tipo: 'success' | 'warning' | 'info' = 'info') => {
    setNotificacionToast({ mensaje, tipo });
    setTimeout(() => {
      setNotificacionToast(null);
    }, 4500);
  };

  // Manejo de selecciones de Salas
  const toggleSeleccionSala = (id: number) => {
    setSalasSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const selectTodasSalas = () => {
    setSalasSeleccionadas(salas.map((s) => s.id));
  };

  const deselectTodasSalas = () => {
    setSalasSeleccionadas([]);
  };

  // Alternar estado de la sala (PLAYING <-> IDLE)
  const enviarComandoSala = (id: number, comando: 'play' | 'pause' | 'stop') => {
    tmsApi.enviarComando(id, comando);
    actualizarDatos();
    mostrarToast(`Comando '${comando.toUpperCase()}' enviado a la sala ${id}`, 'info');
  };

  const toggleEstadoSala = (id: number) => {
    const salaActualizada = tmsApi.toggleEstadoSala(id);
    actualizarDatos();
    mostrarToast(
      `${salaActualizada.nombre} ahora está en estado '${salaActualizada.estado_reproduccion}'`,
      'info'
    );
  };

  // Manejo de selecciones de Contenidos
  const toggleSeleccionContenido = (id: number) => {
    setContenidosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    );
  };

  const selectTodosTipo = (tipo: TipoContenido) => {
    const clave = tipo.toLowerCase() as 'ftr' | 'tlr' | 'adv' | 'others';
    const items = contenidos[clave] || contenidos.todos.filter((c) => c.tipo === tipo);
    const idsTipo = items.map((c) => c.id);
    setContenidosSeleccionados((prev) => Array.from(new Set([...prev, ...idsTipo])));
  };

  const deselectTodosTipo = (tipo: TipoContenido) => {
    const clave = tipo.toLowerCase() as 'ftr' | 'tlr' | 'adv' | 'others';
    const items = contenidos[clave] || contenidos.todos.filter((c) => c.tipo === tipo);
    const idsTipo = items.map((c) => c.id);
    setContenidosSeleccionados((prev) => prev.filter((id) => !idsTipo.includes(id)));
  };

  // Cancelar tarea en cola
  const cancelarIngesta = (id: number) => {
    tmsApi.cancelarIngesta(id);
    actualizarDatos();
    mostrarToast('Tarea de ingesta cancelada', 'info');
  };

  // Reset demo
  const resetearDemo = () => {
    tmsApi.resetearDemo();
    setSalasSeleccionadas([1]);
    setContenidosSeleccionados([1, 2]);
    setAlertaRojaMensaje(null);
    setAlertaDetalles([]);
    actualizarDatos();
    mostrarToast('Datos de Parque Astur restablecidos', 'info');
  };

  // EJECUTAR INGESTA (CON REGLA DE PROTECCIÓN CRÍTICA)
  const ejecutarIngesta = (solicitud: SolicitudIngesta) => {
    const resultado = tmsApi.procesarIngesta(solicitud);
    actualizarDatos();
    setModalIngestaAbierto(false);

    if (resultado.tiene_alerta_roja) {
      // REGLA DE PROTECCIÓN CRÍTICA DISPARADA
      setAlertaRojaMensaje(
        'Servidor en proyección. Ingesta diferida encolada automáticamente para evitar parones de lectura'
      );

      const detallesTexto = resultado.advertencias
        .filter((adv) => adv.es_critica_roja)
        .map(
          (adv) =>
            `${adv.sala_nombre}: El servidor se encuentra reproduciendo en sala. Se encola '${adv.contenido}' para post-sesión.`
        );

      setAlertaDetalles(detallesTexto);

      mostrarToast(
        '⚠️ Ingesta diferida automáticamente: Servidor en proyección.',
        'warning'
      );
    } else {
      setAlertaRojaMensaje(null);
      setAlertaDetalles([]);
      mostrarToast('✅ Solicitud de ingesta procesada con éxito.', 'success');
    }
  };

  // Acceso directo para probar la regla de protección crítica
  const probarReglaProteccionCritica = () => {
    // Asegurar que Sala 1 esté en PLAYING y seleccionar CONAN29 (id 1)
    const sala1 = salas.find((s) => s.id === 1);
    if (sala1 && sala1.estado_reproduccion !== 'PLAYING') {
      tmsApi.toggleEstadoSala(1);
    }
    setSalasSeleccionadas([1]);
    setContenidosSeleccionados([1]); // CONAN29

    // Ejecutar con modo 'ahora'
    ejecutarIngesta({
      salas_ids: [1],
      contenidos_ids: [1],
      modo_horario: 'ahora',
    });
  };

  const tareasPendientesCount = cola.filter(
    (item) => item.estado === 'PENDIENTE' || item.estado === 'EN_PROCESO'
  ).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-red-900 selection:text-white pb-20">
      {/* Header Minimalista Integrado */}
      <div className="bg-[#111318] border-b border-zinc-800/80 sticky top-0 z-30">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-sky-500/10 rounded flex items-center justify-center border border-sky-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
              </div>
              <h1 className="text-[15px] font-semibold tracking-wide text-zinc-100 flex items-center gap-1.5">
                TMS <span className="text-zinc-600 font-light">| PARQUE ASTUR</span>
              </h1>
            </div>

            {/* PESTAÑAS CENTRALES (Minimalistas) */}
            <div className="flex h-full items-end gap-1">
              <button
                onClick={() => setPestañaActiva('supervision')}
                className={`px-6 h-full flex items-center gap-2 text-sm transition-colors border-b-2 font-medium ${
                  pestañaActiva === 'supervision'
                    ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Supervisión
              </button>
              <button
                onClick={() => setPestañaActiva('contenidos')}
                className={`px-6 h-full flex items-center gap-2 text-sm transition-colors border-b-2 font-medium ${
                  pestañaActiva === 'contenidos'
                    ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Contenidos
              </button>
            </div>

            {/* Acciones Derecha */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDrawerColaAbierto(true)}
                className={`px-3 py-1.5 flex items-center gap-2 text-xs font-medium rounded transition-colors ${cola.length > 0 ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Transferencias {cola.length > 0 && `(${cola.length})`}
              </button>
              
              <button
                onClick={() => setModalKdmAbierto(true)}
                className="px-3 py-1.5 text-xs font-medium rounded text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Llaves KDM
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Banner de Alerta Roja: Regla de Protección Crítica */}
      {alertaRojaMensaje && (
        <AlertaProteccionBanner
          mensaje={alertaRojaMensaje}
          detalles={alertaDetalles}
          onDismiss={() => setAlertaRojaMensaje(null)}
          onVerCola={() => setDrawerColaAbierto(true)}
        />
      )}

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 pt-6">
        {/* SECCIÓN SUPERIOR: Grid de 10 Salas con almacenamiento libre y estado de reproducción */}
      {pestañaActiva === 'supervision' && (
        <SalasGrid
          salas={salas}
          salasSeleccionadas={salasSeleccionadas}
          onToggleSeleccionSala={toggleSeleccionSala}
          onSelectTodasSalas={selectTodasSalas}
          onDeselectTodasSalas={deselectTodasSalas}
          onToggleEstadoSala={toggleEstadoSala}
          onEnviarComandoSala={enviarComandoSala}
        />
      )}

      {/* SECCIÓN INFERIOR: Gestor de Contenidos con carpetas colapsables (FTR y TLR) */}
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

      </div>

      {/* BOTÓN FLOTANTE INFERIOR '📥 Ingesta' */}
      {pestañaActiva === 'contenidos' && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            id="btn-ingesta-flotante-sticky"
            onClick={() => setModalIngestaAbierto(true)}
            className={`flex items-center gap-3 px-5 py-3 rounded-full font-bold text-sm shadow-2xl transition-all duration-300 cursor-pointer ${
              contenidosSeleccionados.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950 ring-4 ring-emerald-500/30 scale-105'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 shadow-black'
            }`}
          >
            <HardDriveDownload className="w-5 h-5" />
            <span>📥 Ingesta</span>
            {contenidosSeleccionados.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono text-xs">
                {contenidosSeleccionados.length} CPL
              </span>
            )}
          </button>
        </div>
      )}

      {/* MODAL FLOTANTE DE INGESTA */}
      <ModalIngesta
        isOpen={modalIngestaAbierto}
        onClose={() => setModalIngestaAbierto(false)}
        salas={salas}
        contenidos={contenidos.todos}
        salasSeleccionadasInicial={salasSeleccionadas}
        contenidosSeleccionados={contenidosSeleccionados}
        onEjecutarIngesta={ejecutarIngesta}
      />

      {/* DRAWER COLA DE INGESTAS */}
      <ColaIngestasDrawer
        isOpen={drawerColaAbierto}
        onClose={() => setDrawerColaAbierto(false)}
        cola={cola}
        onCancelar={cancelarIngesta}
      />

      {/* MODAL DOCUMENTACIÓN Y CÓDIGO PYTHON MAIN.PY */}
      <DocumentacionModal
        isOpen={modalDocAbierto}
        onClose={() => setModalDocAbierto(false)}
      />

      {/* MODAL GESTIÓN Y ENRUTAMIENTO AUTOMÁTICO DE KDMS (FASE 3) */}
      <KdmModal
        isOpen={modalKdmAbierto}
        onClose={() => setModalKdmAbierto(false)}
        kdms={kdms}
        salas={salas}
        onCargarKdmXml={handleCargarKdmXml}
        onInyectarKdm={handleInyectarKdm}
      />

      {/* TOAST DE NOTIFICACIONES */}
      {notificacionToast && (
        <div
          id="tms-toast"
          className={`fixed bottom-6 left-6 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs font-mono flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200 ${
            notificacionToast.tipo === 'warning'
              ? 'bg-red-950/95 border-red-600 text-red-200'
              : notificacionToast.tipo === 'success'
              ? 'bg-emerald-950/95 border-emerald-600 text-emerald-200'
              : 'bg-zinc-900 border-zinc-700 text-zinc-200'
          }`}
        >
          {notificacionToast.tipo === 'warning' ? (
            <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
          ) : notificacionToast.tipo === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
          )}
          <span>{notificacionToast.mensaje}</span>
        </div>
      )}
    </div>
  );
}
