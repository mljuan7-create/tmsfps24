import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Let's fix the JSX issues.

# 1. We had `{pestañaActiva === 'contenidos' && (` but didn't close it correctly maybe.
# Find the button flotante block and make sure it's well formed.
import sys

# Replace the end part with a clean version
clean_tail = """
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
"""

# Let's replace everything after `{/* SECCIÓN INFERIOR: Gestor de Contenidos con carpetas colapsables (FTR y TLR) */}`

idx = content.find("{/* SECCIÓN INFERIOR: Gestor de Contenidos")
if idx == -1:
    print("Could not find SECCIÓN INFERIOR")
    sys.exit(1)

head = content[:idx]

new_middle = """{/* SECCIÓN INFERIOR: Gestor de Contenidos con carpetas colapsables (FTR y TLR) */}
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
"""

with open("src/App.tsx", "w") as f:
    f.write(head + new_middle + clean_tail)
