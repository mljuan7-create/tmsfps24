/**
 * TMS Parque Astur - Theater Management System (Fase 2: Gestión de Contenidos)
 * Interfaz web oscura optimizada para cabinas de proyección digital.
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
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
      {/* Header Principal */}
      <Header
        totalSeleccionados={contenidosSeleccionados.length}
        onOpenModalIngesta={() => setModalIngestaAbierto(true)}
        onOpenColaIngesta={() => setDrawerColaAbierto(true)}
        onOpenDocModal={() => setModalDocAbierto(true)}
        onOpenKdmModal={() => setModalKdmAbierto(true)}
        onReset={resetearDemo}
        colaPendientesCount={tareasPendientesCount}
      />

      {/* Banner de Alerta Roja: Regla de Protección Crítica */}
      {alertaRojaMensaje && (
        <AlertaProteccionBanner
          mensaje={alertaRojaMensaje}
          detalles={alertaDetalles}
          onDismiss={() => setAlertaRojaMensaje(null)}
          onVerCola={() => setDrawerColaAbierto(true)}
        />
      )}

      {/* Barra de Acceso Rápido / Guía del Operador de Cabina */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-1">
        <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="font-semibold text-zinc-200">Test Rápido de Cabina:</span>
            <span className="text-zinc-400">
              Pruebe la Regla de Protección Crítica (Sala en PLAYING + Ingesta &apos;Ahora&apos;) con 1 clic:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-test-regla-rapido"
              onClick={probarReglaProteccionCritica}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 border border-red-700 font-mono font-bold transition cursor-pointer"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
              <span>Simular Ingesta en PLAYING (Disparar Alerta Roja)</span>
            </button>
            <button
              id="btn-kdm-rapido-bar"
              onClick={() => setModalKdmAbierto(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700 font-mono font-bold transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>KDMs Sala 5 (Fase 3)</span>
            </button>
            <button
              onClick={() => setModalDocAbierto(true)}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
              title="Información de arquitectura Parque Astur"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Pestañas de Navegación del Sistema (Documento Maestro: Fase 1, 2 y 3) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-zinc-800">
          <button
            onClick={() => setPestañaActiva('todas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg font-mono text-xs font-semibold transition cursor-pointer border-t border-x ${
              pestañaActiva === 'todas'
                ? 'bg-zinc-900 text-white border-zinc-700 border-b-2 border-b-red-500'
                : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900/50'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Vista Conjunta (Dashboard Completo)</span>
          </button>

          <button
            onClick={() => setPestañaActiva('supervision')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg font-mono text-xs font-semibold transition cursor-pointer border-t border-x ${
              pestañaActiva === 'supervision'
                ? 'bg-zinc-900 text-white border-zinc-700 border-b-2 border-b-red-500'
                : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900/50'
            }`}
          >
            <MonitorPlay className="w-3.5 h-3.5 text-sky-400" />
            <span>📺 Pestaña 1: Supervisión (10 Cabinas)</span>
          </button>

          <button
            onClick={() => setPestañaActiva('contenidos')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg font-mono text-xs font-semibold transition cursor-pointer border-t border-x ${
              pestañaActiva === 'contenidos'
                ? 'bg-zinc-900 text-white border-zinc-700 border-b-2 border-b-red-500'
                : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900/50'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-emerald-400" />
            <span>📦 Pestaña 2: Contenidos (LMS Ymagis)</span>
          </button>

          <button
            onClick={() => setModalKdmAbierto(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-t-lg font-mono text-xs font-semibold text-zinc-400 hover:text-amber-300 transition cursor-pointer hover:bg-zinc-900/50"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>🔑 Pestaña 3: Llaves KDMs (Dolby SMI)</span>
          </button>

          <button
            onClick={() => setDrawerColaAbierto(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-t-lg font-mono text-xs font-semibold text-zinc-400 hover:text-red-300 transition cursor-pointer hover:bg-zinc-900/50"
          >
            <ListOrdered className="w-3.5 h-3.5 text-red-400" />
            <span>📥 Cola de Ingestas & Protección ({cola.length})</span>
          </button>
        </div>
      </div>

      {/* SECCIÓN SUPERIOR: Grid de 10 Salas con almacenamiento libre y estado de reproducción */}
      {(pestañaActiva === 'todas' || pestañaActiva === 'supervision') && (
        <SalasGrid
          salas={salas}
          salasSeleccionadas={salasSeleccionadas}
          onToggleSeleccionSala={toggleSeleccionSala}
          onSelectTodasSalas={selectTodasSalas}
          onDeselectTodasSalas={deselectTodasSalas}
          onToggleEstadoSala={toggleEstadoSala}
        />
      )}

      {/* SECCIÓN INFERIOR: Gestor de Contenidos con carpetas colapsables (FTR y TLR) */}
      {(pestañaActiva === 'todas' || pestañaActiva === 'contenidos') && (
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

      {/* BOTÓN FLOTANTE INFERIOR '📥 Ingesta' */}
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
