export type FichaEmpleadoOverlay =
  | { kind: 'cerrado' }
  | { kind: 'editarBloque'; blockId: string; tituloBloque: string };
