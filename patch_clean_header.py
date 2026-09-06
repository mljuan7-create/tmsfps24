import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Remove the "Test Rápido de Cabina" completely
test_banner_regex = r"\{/\* Barra de Acceso Rápido / Guía del Operador de Cabina \*/\}.*?\{/\* Pestañas de Navegación del Sistema"
content = re.sub(test_banner_regex, "{/* Pestañas de Navegación del Sistema", content, flags=re.DOTALL)


# 2. Refactor the header to integrate the tabs inside the header itself for maximum minimalism
header_and_tabs_regex = r"\{/\* Header Principal \*/\}.*?\{/\* SECCIÓN SUPERIOR: Grid"

new_header = """{/* Header Minimalista Integrado */}
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
        {/* SECCIÓN SUPERIOR: Grid"""

content = re.sub(header_and_tabs_regex, new_header, content, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(content)

