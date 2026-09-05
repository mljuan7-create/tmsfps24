import React, { useState } from 'react';
import { Contenido, TipoContenido } from '../types';
import {
  Film,
  Clapperboard,
  Tv,
  FolderKanban,
  ChevronDown,
  ChevronRight,
  Key,
  ShieldCheck,
  CheckSquare,
  Square,
  Sparkles,
  HardDriveDownload,
  CheckCircle2,
  AlertTriangle,
  Server,
  Radio,
  Search,
} from 'lucide-react';

interface ContenidosAccordionProps {
  contenidos: {
    todos: Contenido[];
    ftr: Contenido[];
    tlr: Contenido[];
    adv?: Contenido[];
    others?: Contenido[];
  };
  contenidosSeleccionados: number[];
  onToggleSeleccionContenido: (id: number) => void;
  onSelectTodosTipo: (tipo: TipoContenido) => void;
  onDeselectTodosTipo: (tipo: TipoContenido) => void;
  onOpenModalIngesta: () => void;
  salasSeleccionadasCount: number;
}

export const ContenidosAccordion: React.FC<ContenidosAccordionProps> = ({
  contenidos,
  contenidosSeleccionados,
  onToggleSeleccionContenido,
  onSelectTodosTipo,
  onDeselectTodosTipo,
  onOpenModalIngesta,
  salasSeleccionadasCount,
}) => {
  const [ftrAbierto, setFtrAbierto] = useState<boolean>(true);
  const [tlrAbierto, setTlrAbierto] = useState<boolean>(true);
  const [advAbierto, setAdvAbierto] = useState<boolean>(false);
  const [othersAbierto, setOthersAbierto] = useState<boolean>(false);
  const [filtroTexto, setFiltroTexto] = useState<string>('');
  const [escaneandoSatelite, setEscaneandoSatelite] = useState<boolean>(false);

  const advList = contenidos.adv || contenidos.todos.filter((c) => c.tipo === 'ADV');
  const othersList = contenidos.others || contenidos.todos.filter((c) => c.tipo === 'OTHERS');

  // Calcular tamaño total de contenidos seleccionados
  const totalGbSeleccionados = contenidos.todos
    .filter((c) => contenidosSeleccionados.includes(c.id))
    .reduce((acc, curr) => acc + curr.tamano_gb, 0);

  const handleEscanearSatelite = () => {
    setEscaneandoSatelite(true);
    setTimeout(() => {
      setEscaneandoSatelite(false);
    }, 1200);
  };

  const renderTablaContenidos = (items: Contenido[], tipo: TipoContenido) => {
    const filtrados = items.filter(
      (i) =>
        i.titulo.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        i.fuente_ftp.toLowerCase().includes(filtroTexto.toLowerCase())
    );

    if (filtrados.length === 0) {
      return (
        <div className="p-4 text-center text-xs text-zinc-500 font-mono">
          No hay contenidos en esta carpeta que coincidan con la búsqueda.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-zinc-300 font-mono">
          <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">Sel.</th>
              <th className="py-2.5 px-3">Título / CPL DCI</th>
              <th className="py-2.5 px-3">Tamaño</th>
              <th className="py-2.5 px-3">KDM (Criptografía)</th>
              <th className="py-2.5 px-3">Aspecto / Audio</th>
              <th className="py-2.5 px-3">Origen FTP Central</th>
              <th className="py-2.5 px-3">Ruta LMS / Formato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/60">
            {filtrados.map((item) => {
              const isSelected = contenidosSeleccionados.includes(item.id);
              const esConan29 = item.titulo === 'CONAN29';
              const esAFuego = item.titulo === 'AFuego';

              return (
                <tr
                  key={item.id}
                  id={`row-contenido-${item.id}`}
                  onClick={() => onToggleSeleccionContenido(item.id)}
                  className={`hover:bg-zinc-800/60 transition cursor-pointer ${
                    isSelected ? 'bg-zinc-800/80 ring-1 ring-emerald-500/30' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleSeleccionContenido(item.id)}
                      className="text-zinc-400 hover:text-emerald-400 transition cursor-pointer p-0.5"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-600" />
                      )}
                    </button>
                  </td>

                  {/* Título y UUID de CPL */}
                  <td className="py-3 px-3">
                    <div className="font-bold text-zinc-100 flex items-center gap-2">
                      <span>{item.titulo}</span>
                      {item.es_cinity && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                          CINITY
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono truncate max-w-[220px]">
                      {item.cpl_uuid}
                    </div>
                  </td>

                  {/* Tamaño en GB */}
                  <td className="py-3 px-3">
                    <span
                      className={`font-semibold font-mono ${
                        item.tamano_gb > 150
                          ? 'text-red-300'
                          : item.tamano_gb > 50
                          ? 'text-amber-300'
                          : 'text-emerald-300'
                      }`}
                    >
                      {item.tamano_gb.toFixed(1)} GB
                    </span>
                  </td>

                  {/* KDM */}
                  <td className="py-3 px-3">
                    {item.requiere_kdm ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/80">
                        <Key className="w-3 h-3 text-amber-400" />
                        <span>KDM Activa (Válida)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/60">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Libre / Sin KDM</span>
                      </span>
                    )}
                  </td>

                  {/* Formato Imagen y Audio */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-semibold">
                        {item.aspect_ratio}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          item.audio_format === 'ATMOS'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {item.audio_format}
                      </span>
                    </div>
                  </td>

                  {/* Origen FTP */}
                  <td className="py-3 px-3 text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span className="text-[11px] truncate max-w-[180px]">{item.fuente_ftp}</span>
                    </div>
                  </td>

                  {/* Ruta LMS Ymagis */}
                  <td className="py-3 px-3 text-zinc-500 text-[10px]">
                    <code>{item.ruta_ymagis || `/dcp/${tipo.toLowerCase()}`}</code>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <section id="seccion-contenidos-lms" className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      {/* Alerta de Escaneo de Satélite (Box by Deluxe y MovieTransit) */}
      <div className="mb-4 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-300">
          <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
          <span className="font-semibold text-zinc-200">Recepción Satelital y Fibra Automática:</span>
          <span className="text-zinc-400">
            Escaneando buzones externos en Box By Deluxe (<code className="text-sky-300">192.168.168.2</code>) y MovieTransit (<code className="text-sky-300">192.168.168.111</code>).
          </span>
        </div>
        <button
          onClick={handleEscanearSatelite}
          disabled={escaneandoSatelite}
          className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition text-[11px] font-mono cursor-pointer flex items-center gap-1.5"
        >
          {escaneandoSatelite ? (
            <>
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
              <span>Comprobando FTPs...</span>
            </>
          ) : (
            <>
              <span>Escanear Buzones Ahora</span>
            </>
          )}
        </button>
      </div>

      {/* Barra de Herramientas y Acciones de Selección */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Server className="w-5 h-5 text-red-500" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-mono tracking-tight flex items-center gap-2">
              <span>LMS YMAGIS: BIBLIOTECA CENTRAL DE CONTENIDOS</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-normal">
                10.100.47.4 / 192.168.168.4 (/dcp/)
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Carpetas oficiales: /dcp/peliculas, /dcp/trailers, /dcp/ads, /dcp/others
            </p>
          </div>
        </div>

        {/* Buscador y Botón Flotante de Ingesta */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Buscador rápido */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar título..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
            />
          </div>

          {/* Resumen de Seleccionados */}
          <div className="text-right text-xs font-mono hidden sm:block">
            <div className="text-zinc-300">
              <span className="font-bold text-emerald-400">{contenidosSeleccionados.length}</span> seleccionados
              <span className="text-zinc-500 mx-1.5">|</span>
              <span className="font-bold text-zinc-200">{totalGbSeleccionados.toFixed(1)} GB</span>
            </div>
            <div className="text-[10px] text-zinc-500">
              Destino: {salasSeleccionadasCount} salas marcadas
            </div>
          </div>

          {/* Botón Ingesta */}
          <button
            id="btn-ingesta-flotante"
            onClick={onOpenModalIngesta}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-xs transition shadow-xl cursor-pointer ${
              contenidosSeleccionados.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 ring-2 ring-emerald-400/40 scale-102'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700'
            }`}
          >
            <HardDriveDownload className="w-4 h-4" />
            <span>📥 Ingesta</span>
            {contenidosSeleccionados.length > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px]">
                {contenidosSeleccionados.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Accordion 1: 'FTR - Feature' (/dcp/peliculas) */}
      <div id="accordion-ftr" className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-sm">
        <div
          className="flex items-center justify-between p-3.5 bg-zinc-900/90 hover:bg-zinc-900 transition cursor-pointer border-b border-zinc-800/80"
          onClick={() => setFtrAbierto(!ftrAbierto)}
        >
          <div className="flex items-center gap-3">
            <button className="text-zinc-400 p-0.5">
              {ftrAbierto ? <ChevronDown className="w-4 h-4 text-red-400" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-red-500" />
              <h3 className="font-bold text-sm text-zinc-100 font-mono tracking-tight">
                📂 /dcp/peliculas ➔ &apos;FTR - Feature&apos; (Películas y Largometrajes Comerciales)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[11px] font-mono">
              {contenidos.ftr.length} títulos
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onSelectTodosTipo('FTR')}
              className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition cursor-pointer"
            >
              Seleccionar todos FTR
            </button>
            <button
              onClick={() => onDeselectTodosTipo('FTR')}
              className="px-2 py-0.5 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-400 text-[11px] transition cursor-pointer border border-zinc-800"
            >
              Desmarcar
            </button>
          </div>
        </div>

        {ftrAbierto && renderTablaContenidos(contenidos.ftr, 'FTR')}
      </div>

      {/* Accordion 2: 'TLR - Trailer' (/dcp/trailers) */}
      <div id="accordion-tlr" className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-sm">
        <div
          className="flex items-center justify-between p-3.5 bg-zinc-900/90 hover:bg-zinc-900 transition cursor-pointer border-b border-zinc-800/80"
          onClick={() => setTlrAbierto(!tlrAbierto)}
        >
          <div className="flex items-center gap-3">
            <button className="text-zinc-400 p-0.5">
              {tlrAbierto ? <ChevronDown className="w-4 h-4 text-amber-400" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2">
              <Clapperboard className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-zinc-100 font-mono tracking-tight">
                📂 /dcp/trailers ➔ &apos;TLR - Trailer&apos; (Avances y Piezas Promocionales)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[11px] font-mono">
              {contenidos.tlr.length} trailers
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onSelectTodosTipo('TLR')}
              className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition cursor-pointer"
            >
              Seleccionar todos TLR
            </button>
            <button
              onClick={() => onDeselectTodosTipo('TLR')}
              className="px-2 py-0.5 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-400 text-[11px] transition cursor-pointer border border-zinc-800"
            >
              Desmarcar
            </button>
          </div>
        </div>

        {tlrAbierto && renderTablaContenidos(contenidos.tlr, 'TLR')}
      </div>

      {/* Accordion 3: 'ADV - Advertisements' (/dcp/ads) */}
      <div id="accordion-adv" className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-sm">
        <div
          className="flex items-center justify-between p-3.5 bg-zinc-900/90 hover:bg-zinc-900 transition cursor-pointer border-b border-zinc-800/80"
          onClick={() => setAdvAbierto(!advAbierto)}
        >
          <div className="flex items-center gap-3">
            <button className="text-zinc-400 p-0.5">
              {advAbierto ? <ChevronDown className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-zinc-100 font-mono tracking-tight">
                📂 /dcp/ads ➔ &apos;ADV - Publicidad&apos; (Bloques de Publicidad y Anuncios Comerciales)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[11px] font-mono">
              {advList.length} anuncios
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onSelectTodosTipo('ADV')}
              className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition cursor-pointer"
            >
              Seleccionar todos ADV
            </button>
            <button
              onClick={() => onDeselectTodosTipo('ADV')}
              className="px-2 py-0.5 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-400 text-[11px] transition cursor-pointer border border-zinc-800"
            >
              Desmarcar
            </button>
          </div>
        </div>

        {advAbierto && renderTablaContenidos(advList, 'ADV')}
      </div>

      {/* Accordion 4: 'OTHERS' (/dcp/others) */}
      <div id="accordion-others" className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-sm">
        <div
          className="flex items-center justify-between p-3.5 bg-zinc-900/90 hover:bg-zinc-900 transition cursor-pointer border-b border-zinc-800/80"
          onClick={() => setOthersAbierto(!othersAbierto)}
        >
          <div className="flex items-center gap-3">
            <button className="text-zinc-400 p-0.5">
              {othersAbierto ? <ChevronDown className="w-4 h-4 text-purple-400" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-purple-400" />
              <h3 className="font-bold text-sm text-zinc-100 font-mono tracking-tight">
                📂 /dcp/others ➔ Contenido Alternativo, Logos CINITY y Test de Sala
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[11px] font-mono">
              {othersList.length} elementos
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onSelectTodosTipo('OTHERS')}
              className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition cursor-pointer"
            >
              Seleccionar todos OTHERS
            </button>
            <button
              onClick={() => onDeselectTodosTipo('OTHERS')}
              className="px-2 py-0.5 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-400 text-[11px] transition cursor-pointer border border-zinc-800"
            >
              Desmarcar
            </button>
          </div>
        </div>

        {othersAbierto && renderTablaContenidos(othersList, 'OTHERS')}
      </div>
    </section>
  );
};
