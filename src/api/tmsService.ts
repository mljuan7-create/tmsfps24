import { Sala, Contenido, ItemColaIngesta, SolicitudIngesta, IngestaResultado, KdmInventario } from '../types';
import { SALAS_INICIALES, CONTENIDOS_INICIALES, COLA_INGESTAS_INICIAL } from '../data/parqueAsturData';

// Claves de LocalStorage para persistencia local en cabina
const STORAGE_KEY_SALAS = 'tms_parque_astur_salas';
const STORAGE_KEY_COLA = 'tms_parque_astur_cola';
const STORAGE_KEY_KDMS = 'tms_parque_astur_kdms';

const KDMS_INICIALES: KdmInventario[] = [
  {
    id: 1,
    uuid_kdm: 'urn:uuid:7f3b890a-12c4-4e56-8a9b-0123456789ab',
    clip_id: 'urn:uuid:c3d4e5f6-7a8b-9c0d-1e2f-abcdef123456',
    clip_title: 'AFuego_FTR_F-185_ES_51',
    notValidBefore: '2026-09-01T00:00:00+02:00',
    notValidAfter: '2026-09-30T23:59:59+02:00',
    server_serial: 'DSS220-210405',
    estado: 'INYECTADA',
    sala_id: 5,
    sala_nombre: 'Sala 5',
    sala_ip: '10.100.47.51',
    cargado_en: '2026-09-05 15:30:00',
    inyectado_en: '2026-09-05 15:30:02',
    metodo_envio: 'DOLBY_SMI_SEND_LICENSE',
  },
];

export class TMSService {
  private salas: Sala[];
  private cola: ItemColaIngesta[];
  private kdms: KdmInventario[];

  constructor() {
    // Inicializar desde localStorage si existe, o usar datos por defecto
    const savedSalas = localStorage.getItem(STORAGE_KEY_SALAS);
    const savedCola = localStorage.getItem(STORAGE_KEY_COLA);
    const savedKdms = localStorage.getItem(STORAGE_KEY_KDMS);

    this.salas = savedSalas ? JSON.parse(savedSalas) : [...SALAS_INICIALES];
    this.cola = savedCola ? JSON.parse(savedCola) : [...COLA_INGESTAS_INICIAL];
    this.kdms = savedKdms ? JSON.parse(savedKdms) : [...KDMS_INICIALES];
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY_SALAS, JSON.stringify(this.salas));
    localStorage.setItem(STORAGE_KEY_COLA, JSON.stringify(this.cola));
    localStorage.setItem(STORAGE_KEY_KDMS, JSON.stringify(this.kdms));
  }

  public getSalas(): Sala[] {
    return [...this.salas];
  }

  public getContenidos(): {
    todos: Contenido[];
    ftr: Contenido[];
    tlr: Contenido[];
    adv: Contenido[];
    others: Contenido[];
  } {
    return {
      todos: CONTENIDOS_INICIALES,
      ftr: CONTENIDOS_INICIALES.filter((c) => c.tipo === 'FTR'),
      tlr: CONTENIDOS_INICIALES.filter((c) => c.tipo === 'TLR'),
      adv: CONTENIDOS_INICIALES.filter((c) => c.tipo === 'ADV'),
      others: CONTENIDOS_INICIALES.filter((c) => c.tipo === 'OTHERS'),
    };
  }

  public getColaIngestas(): ItemColaIngesta[] {
    return [...this.cola].sort((a, b) => b.id - a.id);
  }

  public toggleEstadoSala(salaId: number): Sala {
    const sala = this.salas.find((s) => s.id === salaId);
    if (!sala) throw new Error('Sala no encontrada');

    if (sala.estado_reproduccion === 'PLAYING') {
      sala.estado_reproduccion = 'IDLE';
      sala.tiempo_restante_min = 0;
    } else {
      sala.estado_reproduccion = 'PLAYING';
      sala.tiempo_restante_min = Math.floor(Math.random() * 80) + 20;
      if (!sala.cpl_actual) {
        sala.cpl_actual = 'CONAN29_FTR_S_ES-ES_51_4K';
      }
    }

    this.persist();
    return { ...sala };
  }

  /**
   * REGLA DE PROTECCIÓN CRÍTICA DE INGESTA DCI:
   * Si la hora es "ahora" pero la sala destino tiene su estado de reproducción en 'PLAYING',
   * el backend en Python / TMS cambia el estado automáticamente en la tabla 'cola_ingestas'
   * a 'PENDIENTE', programarla en cola diferida para cuando termine la sesión y devolver
   * un aviso de advertencia en rojo:
   * "Servidor en proyección. Ingesta diferida encolada automáticamente para evitar parones de lectura"
   */
  public procesarIngesta(solicitud: SolicitudIngesta): IngestaResultado {
    const { salas_ids, contenidos_ids, modo_horario, programado_para } = solicitud;
    const advertencias: IngestaResultado['advertencias'] = [];
    const nuevasIngestas: IngestaResultado['ingestas'] = [];
    const fechaHoraActual = new Date().toISOString().replace('T', ' ').substring(0, 19);

    let alertaRojaActivada = false;

    salas_ids.forEach((salaId) => {
      const sala = this.salas.find((s) => s.id === salaId);
      if (!sala) return;

      contenidos_ids.forEach((contenidoId) => {
        const contenido = CONTENIDOS_INICIALES.find((c) => c.id === contenidoId);
        if (!contenido) return;

        // Comprobación de almacenamiento libre
        if (sala.almacenamiento_libre_gb < contenido.tamano_gb) {
          advertencias.push({
            sala_id: sala.id,
            sala_nombre: sala.nombre,
            contenido: contenido.titulo,
            tipo: 'ERROR_ESPACIO',
            mensaje: `Espacio insuficiente en ${sala.nombre} (${sala.almacenamiento_libre_gb.toFixed(1)} GB libres vs ${contenido.tamano_gb} GB requeridos).`,
          });
          return;
        }

        const nuevoId = Date.now() + Math.floor(Math.random() * 1000);

        // APLICACIÓN DE LA REGLA DE PROTECCIÓN CRÍTICA
        if (modo_horario === 'ahora' && sala.estado_reproduccion === 'PLAYING') {
          alertaRojaActivada = true;
          const textoAdvertenciaRoja =
            'Servidor en proyección. Ingesta diferida encolada automáticamente para evitar parones de lectura';

          const horaDiferida = `Al finalizar proyección (~${sala.tiempo_restante_min}m)`;

          const itemCola: ItemColaIngesta = {
            id: nuevoId,
            sala_id: sala.id,
            sala_nombre: sala.nombre,
            contenido_id: contenido.id,
            contenido_titulo: contenido.titulo,
            contenido_tamano: contenido.tamano_gb,
            contenido_tipo: contenido.tipo,
            estado: 'PENDIENTE', // CRÍTICO: Estado cambiado automáticamente a PENDIENTE
            modo_horario: 'posponer_post_sesion',
            programado_para: horaDiferida,
            creado_en: fechaHoraActual,
            progreso: 0,
            advertencia: textoAdvertenciaRoja,
            mensaje: `Encolada diferida: Servidor ${sala.tipo_servidor} (${sala.ip_servidor}) ocupado en proyección de '${sala.cpl_actual}'. Se iniciará al quedar IDLE.`,
            es_critica_roja: true,
          };

          this.cola.unshift(itemCola);

          advertencias.push({
            sala_id: sala.id,
            sala_nombre: sala.nombre,
            contenido: contenido.titulo,
            tipo: 'PROTECCION_PROYECCION',
            es_critica_roja: true,
            advertencia_roja: textoAdvertenciaRoja,
            detalle: `Servidor ${sala.tipo_servidor} (${sala.ip_servidor}) en PLAYING. El ancho de banda RAID se reserva íntegramente al lector DCI JPEG2000.`,
          });

          nuevasIngestas.push({
            id: nuevoId,
            sala_id: sala.id,
            sala_nombre: sala.nombre,
            contenido_id: contenido.id,
            contenido_titulo: contenido.titulo,
            estado: 'PENDIENTE',
            modo: 'diferida_protegida',
            advertencia: textoAdvertenciaRoja,
            programado_para: horaDiferida,
            progreso: 0,
          });
        } else if (modo_horario === 'posponer') {
          const horaPospuesta = programado_para || '02:00 (Ventana nocturna)';
          const itemCola: ItemColaIngesta = {
            id: nuevoId,
            sala_id: sala.id,
            sala_nombre: sala.nombre,
            contenido_id: contenido.id,
            contenido_titulo: contenido.titulo,
            contenido_tamano: contenido.tamano_gb,
            contenido_tipo: contenido.tipo,
            estado: 'PENDIENTE',
            modo_horario: 'posponer',
            programado_para: horaPospuesta,
            creado_en: fechaHoraActual,
            progreso: 0,
            mensaje: `Programada por operador para ${horaPospuesta}`,
          };

          this.cola.unshift(itemCola);

          nuevasIngestas.push({
            id: nuevoId,
            sala_id: sala.id,
            sala_nombre: sala.nombre,
            contenido_id: contenido.id,
            contenido_titulo: contenido.titulo,
            estado: 'PENDIENTE',
            modo: 'pospuesto',
            programado_para: horaPospuesta,
            progreso: 0,
          });
        } else {
          // Ingesta inmediata en sala libre (IDLE):
          // Simula la secuencia oficial del XSD de Dolby: PENDING -> IN_PROGRESS -> VERIFYING -> FINISHED
          sala.almacenamiento_libre_gb = Math.max(0, sala.almacenamiento_libre_gb - contenido.tamano_gb);

          const itemCola: ItemColaIngesta = {
            id: nuevoId,
            sala_id: sala.id,
            sala_nombre: sala.nombre,
            contenido_id: contenido.id,
            contenido_titulo: contenido.titulo,
            contenido_tamano: contenido.tamano_gb,
            contenido_tipo: contenido.tipo,
            estado: 'PENDING',
            dolby_xsd_state: 'PENDING',
            modo_horario: 'ahora',
            programado_para: 'Inmediata',
            creado_en: fechaHoraActual,
            progreso: 0,
            velocidad_mbs: 0,
            mensaje: `Dolby XSD: PENDING - Estableciendo socket FTP con ${sala.nombre} (${sala.ip_servidor}:${sala.puerto_servidor})...`,
          };

          this.cola.unshift(itemCola);

          nuevasIngestas.push({
            id: nuevoId,
            sala_id: sala.id,
            sala_nombre: sala.nombre,
            contenido_id: contenido.id,
            contenido_titulo: contenido.titulo,
            estado: 'PENDING',
            modo: 'ahora',
            progreso: 0,
          });

          // Simulación de estados XSD de Dolby
          // 1. IN_PROGRESS tras 1.5s
          setTimeout(() => {
            const item = this.cola.find((c) => c.id === nuevoId);
            if (item && item.estado !== 'CANCELADA' && item.estado !== 'CANCELED') {
              item.estado = 'IN_PROGRESS';
              item.dolby_xsd_state = 'IN_PROGRESS';
              item.progreso = 35;
              item.velocidad_mbs = 118.5;
              item.mensaje = `Dolby XSD: IN_PROGRESS - Transfiriendo esencia JPEG2000 desde ${contenido.fuente_ftp} a 118.5 MB/s`;
              this.persist();
            }
          }, 1500);

          // 2. IN_PROGRESS avance tras 3.5s
          setTimeout(() => {
            const item = this.cola.find((c) => c.id === nuevoId);
            if (item && item.estado !== 'CANCELADA' && item.estado !== 'CANCELED') {
              item.progreso = 75;
              item.velocidad_mbs = 124.0;
              item.mensaje = `Dolby XSD: IN_PROGRESS - Transfiriendo pistas de audio PCM y subtítulos XML SMPTE...`;
              this.persist();
            }
          }, 3500);

          // 3. VERIFYING tras 5.5s (Integridad criptográfica DCI SHA-1 de AssetMap y PKL)
          setTimeout(() => {
            const item = this.cola.find((c) => c.id === nuevoId);
            if (item && item.estado !== 'CANCELADA' && item.estado !== 'CANCELED') {
              item.estado = 'VERIFYING';
              item.dolby_xsd_state = 'VERIFYING';
              item.progreso = 92;
              item.velocidad_mbs = 0;
              item.mensaje = `Dolby XSD: VERIFYING - Validando hashes criptográficos SHA-1 según PKL y firmas DCI...`;
              this.persist();
            }
          }, 5500);

          // 4. FINISHED tras 7.5s (Completado y registrado en Dolby DSS220 / GDC)
          setTimeout(() => {
            const item = this.cola.find((c) => c.id === nuevoId);
            if (item && item.estado !== 'CANCELADA' && item.estado !== 'CANCELED') {
              item.estado = 'FINISHED';
              item.dolby_xsd_state = 'FINISHED';
              item.progreso = 100;
              item.velocidad_mbs = 0;
              item.mensaje = `Dolby XSD: FINISHED - Paquete DCP verificado y registrado en el servidor de sala.`;
              this.persist();
            }
          }, 7500);
        }
      });
    });

    this.persist();

    return {
      success: true,
      tiene_alerta_roja: alertaRojaActivada,
      mensaje_global: alertaRojaActivada
        ? 'Servidor en proyección. Ingesta diferida encolada automáticamente para evitar parones de lectura'
        : 'Solicitud de ingesta procesada correctamente',
      advertencias,
      ingestas: nuevasIngestas,
    };
  }

  public cancelarIngesta(ingestaId: number): boolean {
    const idx = this.cola.findIndex((item) => item.id === ingestaId);
    if (idx !== -1) {
      this.cola[idx].estado = 'CANCELADA';
      this.persist();
      return true;
    }
    return false;
  }

  
  public enviarComando(salaId: number, comando: string): boolean {
    const sala = this.salas.find((s) => s.id === salaId);
    if (!sala) return false;
    
    if (comando === 'play') sala.estado_reproduccion = 'PLAYING';
    if (comando === 'stop') sala.estado_reproduccion = 'IDLE';
    if (comando === 'pause') sala.estado_reproduccion = 'PAUSED';
    
    // Si se detiene, reiniciamos minutaje para simular
    if (comando === 'stop') {
      sala.minutaje_actual_min = 0;
      sala.tiempo_restante_min = sala.duracion_total_min || 0;
    }
    
    this.persist();
    return true;
  }

  public getKdms(): KdmInventario[] {
    return [...this.kdms];
  }

  public cargarKdmXml(xmlStr: string): { success: boolean; kdm: KdmInventario; mensaje: string } {
    const clipTitleMatch = xmlStr.match(/<(?:cliptitle|contenttitletext)>([^<]+)<\//i);
    const clipTitle = clipTitleMatch ? clipTitleMatch[1].trim() : 'AFuego_FTR_F-185_ES_51';

    const serialMatch = xmlStr.match(/(DSS220-\d+|GDC-[A-Za-z0-9-]+|\b210\d{3}\b)/i);
    let serial = serialMatch ? serialMatch[1] : 'DSS220-210405';
    if (/^\d{6}$/.test(serial)) serial = `DSS220-${serial}`;

    const nvbMatch = xmlStr.match(/<(?:notvalidbefore|contentkeysnotvalidbefore)>([^<]+)<\//i);
    const notValidBefore = nvbMatch ? nvbMatch[1].trim() : '2026-09-01T00:00:00+02:00';

    const nvaMatch = xmlStr.match(/<(?:notvalidafter|contentkeysnotvalidafter)>([^<]+)<\//i);
    const notValidAfter = nvaMatch ? nvaMatch[1].trim() : '2026-09-30T23:59:59+02:00';

    const salaAsociada = this.salas.find((s) => s.server_serial === serial || (serial.includes('210405') && s.id === 5));

    const nuevaKdm: KdmInventario = {
      id: Date.now(),
      uuid_kdm: `urn:uuid:${Math.random().toString(36).substring(2, 11)}-${Date.now()}`,
      clip_id: 'urn:uuid:c3d4e5f6-7a8b-9c0d-1e2f-abcdef123456',
      clip_title: clipTitle,
      notValidBefore,
      notValidAfter,
      server_serial: serial,
      estado: salaAsociada ? 'INYECTADA' : 'ASIGNADA',
      sala_id: salaAsociada ? salaAsociada.id : null,
      sala_nombre: salaAsociada ? salaAsociada.nombre : undefined,
      sala_ip: salaAsociada ? salaAsociada.ip_servidor : undefined,
      cargado_en: new Date().toISOString().replace('T', ' ').substring(0, 19),
      inyectado_en: salaAsociada ? new Date().toISOString().replace('T', ' ').substring(0, 19) : undefined,
      metodo_envio: 'DOLBY_SMI_SEND_LICENSE',
    };

    this.kdms.unshift(nuevaKdm);
    this.persist();

    return {
      success: true,
      kdm: nuevaKdm,
      mensaje: `KDM asignada e inyectada exitosamente en ${salaAsociada?.nombre || 'bloque de seguridad'} (${serial}) vía SOAP sendLicense`,
    };
  }

  public inyectarKdm(kdmId: number): boolean {
    const kdm = this.kdms.find((k) => k.id === kdmId);
    if (!kdm) return false;
    kdm.estado = 'INYECTADA';
    kdm.inyectado_en = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.persist();
    return true;
  }

  public resetearDemo(): void {
    this.salas = [...SALAS_INICIALES];
    this.cola = [...COLA_INGESTAS_INICIAL];
    this.kdms = [...KDMS_INICIALES];
    this.persist();
  }
}

export const tmsApi = new TMSService();
