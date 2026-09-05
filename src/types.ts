/**
 * TMS Parque Astur - Tipos del Sistema de Gestión de Cine Digital
 */

export type EstadoReproduccion = 'PLAYING' | 'IDLE' | 'PAUSED' | 'STOPPED';

export interface Sala {
  id: number;
  nombre: string;
  ip_servidor: string; // Gestión: 10.100.47.N1
  ip_ingesta_servidor: string; // Ingesta: 192.168.168.N1
  tipo_servidor: string; // 'GDC SR-6400C' o 'DOLBY DSS220'
  puerto_servidor: number; // 80 (GDC) o 61408 (Dolby SMI)
  server_serial: string;
  ip_proyector: string; // Gestión: 10.100.47.N3
  ip_ingesta_proyector?: string; // Ingesta láser: 192.168.168.13 (Sala 1)
  modelo_proyector: string; // 'CHRISTIE CP4440-RGB', 'NEC NC 3200S', 'NEC NC 2000C', 'NEC NC 1200C'
  puerto_proyector: number; // 3002 (Christie Serial) o 7000 (NEC Hex)
  procesador_sonido: string; // 'DOLBY CP850' o 'DOLBY CP750'
  puerto_sonido: number; // 80 o 61408
  estado_reproduccion: EstadoReproduccion;
  lampara_encendida: boolean; // Estado de la lámpara (ON / OFF)
  duracion_total_min: number; // Duración total de la SPL / CPL
  minutaje_actual_min: number; // Minutaje actual transcurrido
  almacenamiento_total_gb: number;
  almacenamiento_libre_gb: number;
  cpl_actual: string | null;
  tiempo_restante_min: number;
}

export type TipoContenido = 'FTR' | 'TLR' | 'ADV' | 'OTHERS';

export interface Contenido {
  id: number;
  titulo: string;
  tipo: TipoContenido;
  tamano_gb: number;
  requiere_kdm: boolean;
  kdm_valida: boolean;
  aspect_ratio: 'F-185' | 'S-239';
  audio_format: '5.1' | '7.1' | 'ATMOS';
  duracion_min: number;
  fuente_ftp: string;
  ruta_ymagis?: string; // /dcp/peliculas, /dcp/trailers, /dcp/ads, /dcp/others
  es_cinity: boolean;
  cpl_uuid: string;
}

export type EstadoIngesta =
  | 'PENDIENTE'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'VERIFYING'
  | 'FINISHED'
  | 'EN_PROCESO'
  | 'COMPLETADA'
  | 'CANCELADA'
  | 'CANCELED'
  | 'ERROR'
  | 'FAILED';

export interface ItemColaIngesta {
  id: number;
  sala_id: number;
  sala_nombre: string;
  contenido_id: number;
  contenido_titulo: string;
  contenido_tamano: number;
  contenido_tipo: TipoContenido;
  estado: EstadoIngesta;
  dolby_xsd_state?: 'PENDING' | 'IN_PROGRESS' | 'VERIFYING' | 'FINISHED' | 'CANCELED' | 'FAILED';
  modo_horario: 'ahora' | 'posponer' | 'posponer_post_sesion';
  programado_para: string;
  creado_en: string;
  progreso: number;
  velocidad_mbs?: number;
  advertencia?: string;
  mensaje?: string;
  es_critica_roja?: boolean;
}

export interface LibreriaFTP {
  id: number;
  uuid?: string;
  nombre: string;
  ip: string;
  ip_gestion?: string;
  ip_ingesta?: string;
  protocolo: string;
  estado: 'ONLINE' | 'OFFLINE';
  usuario?: string;
  ruta_raiz?: string;
  carpetas?: string[];
}

export interface SolicitudIngesta {
  salas_ids: number[];
  contenidos_ids: number[];
  modo_horario: 'ahora' | 'posponer';
  programado_para?: string;
}

export interface IngestaResultado {
  success: boolean;
  tiene_alerta_roja: boolean;
  mensaje_global: string;
  advertencias: Array<{
    sala_id: number;
    sala_nombre: string;
    contenido: string;
    tipo: string;
    es_critica_roja?: boolean;
    advertencia_roja?: string;
    detalle?: string;
    mensaje?: string;
  }>;
  ingestas: Array<{
    id: number;
    sala_id: number;
    sala_nombre: string;
    contenido_id: number;
    contenido_titulo: string;
    estado: EstadoIngesta;
    modo: string;
    advertencia?: string;
    programado_para?: string;
    progreso?: number;
  }>;
}

export interface KdmInventario {
  id: number;
  uuid_kdm: string;
  clip_id: string;
  clip_title: string;
  notValidBefore: string;
  notValidAfter: string;
  server_serial: string;
  estado: 'ASIGNADA' | 'INYECTADA' | 'EXPIRADA' | 'ERROR';
  sala_id: number | null;
  sala_nombre?: string;
  sala_ip?: string;
  cargado_en: string;
  inyectado_en?: string;
  metodo_envio?: string;
}
