export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      afc_parametro: {
        Row: {
          aplica_seguro: boolean
          aplica_trabajador: boolean
          codigo_tipo_contrato: Database["public"]["Enums"]["tipo_contrato_enum"]
          id_afc_parametro: number
          observacion: string | null
          periodo: string | null
          tasa_empleador: number
          tasa_trabajador: number
          vigencia_fin: string | null
          vigencia_inicio: string
        }
        Insert: {
          aplica_seguro?: boolean
          aplica_trabajador?: boolean
          codigo_tipo_contrato: Database["public"]["Enums"]["tipo_contrato_enum"]
          id_afc_parametro?: number
          observacion?: string | null
          periodo?: string | null
          tasa_empleador?: number
          tasa_trabajador?: number
          vigencia_fin?: string | null
          vigencia_inicio: string
        }
        Update: {
          aplica_seguro?: boolean
          aplica_trabajador?: boolean
          codigo_tipo_contrato?: Database["public"]["Enums"]["tipo_contrato_enum"]
          id_afc_parametro?: number
          observacion?: string | null
          periodo?: string | null
          tasa_empleador?: number
          tasa_trabajador?: number
          vigencia_fin?: string | null
          vigencia_inicio?: string
        }
        Relationships: []
      }
      afp: {
        Row: {
          codigo: string | null
          comision: number | null
          forma_pago_apvi: number | null
          id_afp: number
          nombre: string
          periodo: string | null
          sis: number | null
          tasa_empleador: number | null
          tasa_obligatoria: number | null
          vigencia_fin: string | null
          vigencia_inicio: string | null
          vigente: boolean | null
        }
        Insert: {
          codigo?: string | null
          comision?: number | null
          forma_pago_apvi?: number | null
          id_afp?: number
          nombre: string
          periodo?: string | null
          sis?: number | null
          tasa_empleador?: number | null
          tasa_obligatoria?: number | null
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
          vigente?: boolean | null
        }
        Update: {
          codigo?: string | null
          comision?: number | null
          forma_pago_apvi?: number | null
          id_afp?: number
          nombre?: string
          periodo?: string | null
          sis?: number | null
          tasa_empleador?: number | null
          tasa_obligatoria?: number | null
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
          vigente?: boolean | null
        }
        Relationships: []
      }
      afp_vigencia: {
        Row: {
          comision: number
          forma_pago_apvi: number | null
          id_afp: number
          id_afp_vigencia: number
          sis: number
          tasa_empleador: number
          tasa_obligatoria: number
          tope_imponible_uf: number | null
          vigencia_fin: string | null
          vigencia_inicio: string
          vigente: boolean
        }
        Insert: {
          comision?: number
          forma_pago_apvi?: number | null
          id_afp: number
          id_afp_vigencia?: number
          sis?: number
          tasa_empleador?: number
          tasa_obligatoria?: number
          tope_imponible_uf?: number | null
          vigencia_fin?: string | null
          vigencia_inicio: string
          vigente?: boolean
        }
        Update: {
          comision?: number
          forma_pago_apvi?: number | null
          id_afp?: number
          id_afp_vigencia?: number
          sis?: number
          tasa_empleador?: number
          tasa_obligatoria?: number
          tope_imponible_uf?: number | null
          vigencia_fin?: string | null
          vigencia_inicio?: string
          vigente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "afp_vigencia_id_afp_fkey"
            columns: ["id_afp"]
            isOneToOne: false
            referencedRelation: "afp"
            referencedColumns: ["id_afp"]
          },
        ]
      }
      anexo_contrato: {
        Row: {
          fecha_cambio: string
          id_anexo: number
          id_contrato: number
          observacion: string | null
          sueldo_base_nuevo: number | null
        }
        Insert: {
          fecha_cambio: string
          id_anexo?: number
          id_contrato: number
          observacion?: string | null
          sueldo_base_nuevo?: number | null
        }
        Update: {
          fecha_cambio?: string
          id_anexo?: number
          id_contrato?: number
          observacion?: string | null
          sueldo_base_nuevo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "anexo_contrato_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "contrato"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "anexo_contrato_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_contrato"]
          },
        ]
      }
      apv: {
        Row: {
          deposito_convenido_apvi: number
          id_apv: number
          id_contrato: number
          id_forma_pago_apv: number
          id_institucion_apv: number
          id_moneda: number
          monto: number
          vigencia_fin: string | null
          vigencia_inicio: string
        }
        Insert: {
          deposito_convenido_apvi?: number
          id_apv?: number
          id_contrato: number
          id_forma_pago_apv: number
          id_institucion_apv: number
          id_moneda: number
          monto: number
          vigencia_fin?: string | null
          vigencia_inicio: string
        }
        Update: {
          deposito_convenido_apvi?: number
          id_apv?: number
          id_contrato?: number
          id_forma_pago_apv?: number
          id_institucion_apv?: number
          id_moneda?: number
          monto?: number
          vigencia_fin?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "apv_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "contrato"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "apv_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "apv_id_forma_pago_apv_fkey"
            columns: ["id_forma_pago_apv"]
            isOneToOne: false
            referencedRelation: "forma_pago_apv"
            referencedColumns: ["id_forma_pago_apv"]
          },
          {
            foreignKeyName: "apv_id_institucion_apv_fkey"
            columns: ["id_institucion_apv"]
            isOneToOne: false
            referencedRelation: "institucion_apv"
            referencedColumns: ["id_institucion_apv"]
          },
          {
            foreignKeyName: "apv_id_moneda_fkey"
            columns: ["id_moneda"]
            isOneToOne: false
            referencedRelation: "moneda"
            referencedColumns: ["id_moneda"]
          },
        ]
      }
      audit_log: {
        Row: {
          datos_json: Json | null
          esquema_tabla: string | null
          fecha: string | null
          id: number
          id_registro: number | null
          operacion: string | null
          usuario: string | null
        }
        Insert: {
          datos_json?: Json | null
          esquema_tabla?: string | null
          fecha?: string | null
          id?: number
          id_registro?: number | null
          operacion?: string | null
          usuario?: string | null
        }
        Update: {
          datos_json?: Json | null
          esquema_tabla?: string | null
          fecha?: string | null
          id?: number
          id_registro?: number | null
          operacion?: string | null
          usuario?: string | null
        }
        Relationships: []
      }
      banco: {
        Row: {
          activo: boolean
          codigo_sbif: string
          created_at: string
          es_banco_estado: boolean
          es_banco_extranjero: boolean
          id_banco: number
          nombre: string
          nombre_corto: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean
          codigo_sbif: string
          created_at?: string
          es_banco_estado?: boolean
          es_banco_extranjero?: boolean
          id_banco?: number
          nombre: string
          nombre_corto: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean
          codigo_sbif?: string
          created_at?: string
          es_banco_estado?: boolean
          es_banco_extranjero?: boolean
          id_banco?: number
          nombre?: string
          nombre_corto?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      catalogo_lre: {
        Row: {
          afecta_liquido: boolean | null
          clasificacion_lre: string | null
          codigo_lre: string
          grupo_lre: string | null
          id_catalogo_lre: number
          imponible: boolean | null
          modulo_lre: string
          nombre_lre: string
          observacion: string | null
          tributable: boolean | null
          vigencia_fin: string | null
          vigencia_inicio: string | null
          vigente: boolean
        }
        Insert: {
          afecta_liquido?: boolean | null
          clasificacion_lre?: string | null
          codigo_lre: string
          grupo_lre?: string | null
          id_catalogo_lre?: number
          imponible?: boolean | null
          modulo_lre: string
          nombre_lre: string
          observacion?: string | null
          tributable?: boolean | null
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
          vigente?: boolean
        }
        Update: {
          afecta_liquido?: boolean | null
          clasificacion_lre?: string | null
          codigo_lre?: string
          grupo_lre?: string | null
          id_catalogo_lre?: number
          imponible?: boolean | null
          modulo_lre?: string
          nombre_lre?: string
          observacion?: string | null
          tributable?: boolean | null
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
          vigente?: boolean
        }
        Relationships: []
      }
      ccaf_entidad: {
        Row: {
          codigo: string
          fuente: string | null
          id_ccaf_entidad: number
          nombre: string
          periodo: string | null
          vigente: boolean
        }
        Insert: {
          codigo: string
          fuente?: string | null
          id_ccaf_entidad?: number
          nombre: string
          periodo?: string | null
          vigente?: boolean
        }
        Update: {
          codigo?: string
          fuente?: string | null
          id_ccaf_entidad?: number
          nombre?: string
          periodo?: string | null
          vigente?: boolean
        }
        Relationships: []
      }
      centro_costo: {
        Row: {
          codigo: string
          id_centro_costo: number
          nombre: string
        }
        Insert: {
          codigo: string
          id_centro_costo?: number
          nombre: string
        }
        Update: {
          codigo?: string
          id_centro_costo?: number
          nombre?: string
        }
        Relationships: []
      }
      ciudad: {
        Row: {
          id_ciudad: number
          id_comuna: number
          nombre: string
        }
        Insert: {
          id_ciudad: number
          id_comuna: number
          nombre: string
        }
        Update: {
          id_ciudad?: number
          id_comuna?: number
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "ciudad_id_comuna_fkey"
            columns: ["id_comuna"]
            isOneToOne: false
            referencedRelation: "comuna"
            referencedColumns: ["id_comuna"]
          },
        ]
      }
      comuna: {
        Row: {
          activo: boolean
          fecha_creacion: string
          id_comuna: number
          id_provincia: number
          nombre: string
        }
        Insert: {
          activo?: boolean
          fecha_creacion?: string
          id_comuna: number
          id_provincia: number
          nombre: string
        }
        Update: {
          activo?: boolean
          fecha_creacion?: string
          id_comuna?: number
          id_provincia?: number
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "comuna_id_provincia_fkey"
            columns: ["id_provincia"]
            isOneToOne: false
            referencedRelation: "provincia"
            referencedColumns: ["id_provincia"]
          },
          {
            foreignKeyName: "comuna_id_provincia_fkey"
            columns: ["id_provincia"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_provincia"]
          },
        ]
      }
      concepto: {
        Row: {
          afecta_afc: boolean
          afecta_afp: boolean
          afecta_liquido: boolean
          afecta_salud: boolean
          afecta_sis: boolean
          calculo_automatico: boolean
          codigo: string
          codigo_motor: string | null
          es_sistema: boolean
          estrategia_lre: string
          formula_json: Json | null
          id_catalogo_lre: number | null
          id_concepto: number
          imponible: boolean
          naturaleza: string | null
          nombre: string
          observacion_normativa_lre: string | null
          orden_impresion: number
          requiere_exportacion_lre: boolean
          tipo: string | null
          tributable: boolean
          vigencia_fin: string | null
          vigencia_inicio: string | null
          vigente: boolean
        }
        Insert: {
          afecta_afc?: boolean
          afecta_afp?: boolean
          afecta_liquido?: boolean
          afecta_salud?: boolean
          afecta_sis?: boolean
          calculo_automatico?: boolean
          codigo: string
          codigo_motor?: string | null
          es_sistema?: boolean
          estrategia_lre?: string
          formula_json?: Json | null
          id_catalogo_lre?: number | null
          id_concepto?: number
          imponible?: boolean
          naturaleza?: string | null
          nombre: string
          observacion_normativa_lre?: string | null
          orden_impresion?: number
          requiere_exportacion_lre?: boolean
          tipo?: string | null
          tributable?: boolean
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
          vigente?: boolean
        }
        Update: {
          afecta_afc?: boolean
          afecta_afp?: boolean
          afecta_liquido?: boolean
          afecta_salud?: boolean
          afecta_sis?: boolean
          calculo_automatico?: boolean
          codigo?: string
          codigo_motor?: string | null
          es_sistema?: boolean
          estrategia_lre?: string
          formula_json?: Json | null
          id_catalogo_lre?: number | null
          id_concepto?: number
          imponible?: boolean
          naturaleza?: string | null
          nombre?: string
          observacion_normativa_lre?: string | null
          orden_impresion?: number
          requiere_exportacion_lre?: boolean
          tipo?: string | null
          tributable?: boolean
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
          vigente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "concepto_id_catalogo_lre_fkey"
            columns: ["id_catalogo_lre"]
            isOneToOne: false
            referencedRelation: "catalogo_lre"
            referencedColumns: ["id_catalogo_lre"]
          },
        ]
      }
      configuracion: {
        Row: {
          clave: string
          descripcion: string | null
          id_config: number
          modulo: string | null
          tipo_dato: string | null
          valor: string
        }
        Insert: {
          clave: string
          descripcion?: string | null
          id_config?: number
          modulo?: string | null
          tipo_dato?: string | null
          valor: string
        }
        Update: {
          clave?: string
          descripcion?: string | null
          id_config?: number
          modulo?: string | null
          tipo_dato?: string | null
          valor?: string
        }
        Relationships: []
      }
      contrato: {
        Row: {
          cargo: string | null
          casa_particular_asistencia_cuidado: boolean
          casa_particular_domicilio_especifico: string | null
          casa_particular_labores: string | null
          casa_particular_modalidad: string | null
          casa_particular_registro_dt_estado: string | null
          casa_particular_registro_dt_fecha: string | null
          casa_particular_registro_dt_folio: string | null
          causal_exclusion_jornada: string | null
          codigo_tipo_contrato:
            | Database["public"]["Enums"]["tipo_contrato_enum"]
            | null
          estado: string | null
          excluido_limite_jornada: boolean
          fecha_contrato: string | null
          fecha_inicio: string
          fecha_termino: string | null
          id_contrato: number
          id_departamento_empresa: number | null
          id_empresa: number
          id_persona: number
          id_sucursal: number | null
          id_tipo_jornada: number | null
          id_tipo_trabajador: number | null
          justificacion_exclusion_jornada: string | null
          seguro_cesantia: boolean
        }
        Insert: {
          cargo?: string | null
          casa_particular_asistencia_cuidado?: boolean
          casa_particular_domicilio_especifico?: string | null
          casa_particular_labores?: string | null
          casa_particular_modalidad?: string | null
          casa_particular_registro_dt_estado?: string | null
          casa_particular_registro_dt_fecha?: string | null
          casa_particular_registro_dt_folio?: string | null
          causal_exclusion_jornada?: string | null
          codigo_tipo_contrato?:
            | Database["public"]["Enums"]["tipo_contrato_enum"]
            | null
          estado?: string | null
          excluido_limite_jornada?: boolean
          fecha_contrato?: string | null
          fecha_inicio: string
          fecha_termino?: string | null
          id_contrato?: number
          id_departamento_empresa?: number | null
          id_empresa: number
          id_persona: number
          id_sucursal?: number | null
          id_tipo_jornada?: number | null
          id_tipo_trabajador?: number | null
          justificacion_exclusion_jornada?: string | null
          seguro_cesantia?: boolean
        }
        Update: {
          cargo?: string | null
          casa_particular_asistencia_cuidado?: boolean
          casa_particular_domicilio_especifico?: string | null
          casa_particular_labores?: string | null
          casa_particular_modalidad?: string | null
          casa_particular_registro_dt_estado?: string | null
          casa_particular_registro_dt_fecha?: string | null
          casa_particular_registro_dt_folio?: string | null
          causal_exclusion_jornada?: string | null
          codigo_tipo_contrato?:
            | Database["public"]["Enums"]["tipo_contrato_enum"]
            | null
          estado?: string | null
          excluido_limite_jornada?: boolean
          fecha_contrato?: string | null
          fecha_inicio?: string
          fecha_termino?: string | null
          id_contrato?: number
          id_departamento_empresa?: number | null
          id_empresa?: number
          id_persona?: number
          id_sucursal?: number | null
          id_tipo_jornada?: number | null
          id_tipo_trabajador?: number | null
          justificacion_exclusion_jornada?: string | null
          seguro_cesantia?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "contrato_id_departamento_empresa_fkey"
            columns: ["id_departamento_empresa"]
            isOneToOne: false
            referencedRelation: "departamento_empresa"
            referencedColumns: ["id_departamento_empresa"]
          },
          {
            foreignKeyName: "contrato_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresa"
            referencedColumns: ["id_empresa"]
          },
          {
            foreignKeyName: "contrato_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "persona"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "contrato_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "contrato_id_sucursal_fkey"
            columns: ["id_sucursal"]
            isOneToOne: false
            referencedRelation: "sucursal"
            referencedColumns: ["id_sucursal"]
          },
          {
            foreignKeyName: "contrato_id_tipo_jornada_fkey"
            columns: ["id_tipo_jornada"]
            isOneToOne: false
            referencedRelation: "tipo_jornada"
            referencedColumns: ["id_tipo_jornada"]
          },
          {
            foreignKeyName: "contrato_id_tipo_trabajador_fkey"
            columns: ["id_tipo_trabajador"]
            isOneToOne: false
            referencedRelation: "tipo_trabajador"
            referencedColumns: ["id_tipo_trabajador"]
          },
        ]
      }
      contrato_centro_costo: {
        Row: {
          id_centro_costo: number
          id_contrato: number
          id_contrato_centro_costo: number
          porcentaje: number
        }
        Insert: {
          id_centro_costo: number
          id_contrato: number
          id_contrato_centro_costo?: number
          porcentaje: number
        }
        Update: {
          id_centro_costo?: number
          id_contrato?: number
          id_contrato_centro_costo?: number
          porcentaje?: number
        }
        Relationships: [
          {
            foreignKeyName: "contrato_centro_costo_id_centro_costo_fkey"
            columns: ["id_centro_costo"]
            isOneToOne: false
            referencedRelation: "centro_costo"
            referencedColumns: ["id_centro_costo"]
          },
          {
            foreignKeyName: "contrato_centro_costo_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "contrato"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "contrato_centro_costo_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_contrato"]
          },
        ]
      }
      cuenta_bancaria: {
        Row: {
          activa: boolean
          created_at: string
          es_principal: boolean
          id_banco: number
          id_cuenta: number
          id_persona: number
          id_tipo_cuenta_bancaria: number
          numero_cuenta: string
          observacion: string | null
          titular_nombre: string | null
          titular_rut: string | null
          updated_at: string | null
          vigencia_fin: string | null
          vigencia_inicio: string
        }
        Insert: {
          activa?: boolean
          created_at?: string
          es_principal?: boolean
          id_banco: number
          id_cuenta?: number
          id_persona: number
          id_tipo_cuenta_bancaria: number
          numero_cuenta: string
          observacion?: string | null
          titular_nombre?: string | null
          titular_rut?: string | null
          updated_at?: string | null
          vigencia_fin?: string | null
          vigencia_inicio?: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          es_principal?: boolean
          id_banco?: number
          id_cuenta?: number
          id_persona?: number
          id_tipo_cuenta_bancaria?: number
          numero_cuenta?: string
          observacion?: string | null
          titular_nombre?: string | null
          titular_rut?: string | null
          updated_at?: string | null
          vigencia_fin?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "cuenta_bancaria_id_banco_fkey"
            columns: ["id_banco"]
            isOneToOne: false
            referencedRelation: "banco"
            referencedColumns: ["id_banco"]
          },
          {
            foreignKeyName: "cuenta_bancaria_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "persona"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "cuenta_bancaria_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "cuenta_bancaria_id_tipo_cuenta_bancaria_fkey"
            columns: ["id_tipo_cuenta_bancaria"]
            isOneToOne: false
            referencedRelation: "tipo_cuenta_bancaria"
            referencedColumns: ["id_tipo_cuenta_bancaria"]
          },
        ]
      }
      cuenta2_afp: {
        Row: {
          id_contrato: number
          id_cuenta2_afp: number
          id_moneda: number
          monto: number
          observacion: string | null
          vigencia_fin: string | null
          vigencia_inicio: string
          vigente: boolean
        }
        Insert: {
          id_contrato: number
          id_cuenta2_afp?: number
          id_moneda: number
          monto?: number
          observacion?: string | null
          vigencia_fin?: string | null
          vigencia_inicio: string
          vigente?: boolean
        }
        Update: {
          id_contrato?: number
          id_cuenta2_afp?: number
          id_moneda?: number
          monto?: number
          observacion?: string | null
          vigencia_fin?: string | null
          vigencia_inicio?: string
          vigente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "cuenta2_afp_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "contrato"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "cuenta2_afp_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "cuenta2_afp_id_moneda_fkey"
            columns: ["id_moneda"]
            isOneToOne: false
            referencedRelation: "moneda"
            referencedColumns: ["id_moneda"]
          },
        ]
      }
      departamento_empresa: {
        Row: {
          codigo: string
          id_departamento_empresa: number
          id_empresa: number
          id_sucursal: number | null
          nombre: string
        }
        Insert: {
          codigo: string
          id_departamento_empresa?: number
          id_empresa: number
          id_sucursal?: number | null
          nombre: string
        }
        Update: {
          codigo?: string
          id_departamento_empresa?: number
          id_empresa?: number
          id_sucursal?: number | null
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "departamento_empresa_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresa"
            referencedColumns: ["id_empresa"]
          },
          {
            foreignKeyName: "departamento_empresa_id_sucursal_fkey"
            columns: ["id_sucursal"]
            isOneToOne: false
            referencedRelation: "sucursal"
            referencedColumns: ["id_sucursal"]
          },
        ]
      }
      empleado_historial: {
        Row: {
          campos_modificados: string[]
          datos_antes: Json | null
          datos_despues: Json | null
          evento: string
          fecha: string
          id_contrato: number | null
          id_historial: number
          id_persona: number
          id_registro: number | null
          operacion: string
          seccion: string
          tabla_origen: string
          usuario: string | null
        }
        Insert: {
          campos_modificados?: string[]
          datos_antes?: Json | null
          datos_despues?: Json | null
          evento: string
          fecha?: string
          id_contrato?: number | null
          id_historial?: number
          id_persona: number
          id_registro?: number | null
          operacion: string
          seccion: string
          tabla_origen: string
          usuario?: string | null
        }
        Update: {
          campos_modificados?: string[]
          datos_antes?: Json | null
          datos_despues?: Json | null
          evento?: string
          fecha?: string
          id_contrato?: number | null
          id_historial?: number
          id_persona?: number
          id_registro?: number | null
          operacion?: string
          seccion?: string
          tabla_origen?: string
          usuario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "empleado_historial_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "contrato"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "empleado_historial_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "empleado_historial_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "persona"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "empleado_historial_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_persona"]
          },
        ]
      }
      empresa: {
        Row: {
          dv: string
          fecha_creacion: string | null
          id_empresa: number
          razon_social: string
          rut: string
        }
        Insert: {
          dv: string
          fecha_creacion?: string | null
          id_empresa?: number
          razon_social: string
          rut: string
        }
        Update: {
          dv?: string
          fecha_creacion?: string | null
          id_empresa?: number
          razon_social?: string
          rut?: string
        }
        Relationships: []
      }
      empresa_ley_16744: {
        Row: {
          actividad_economica: string | null
          fuente_resolucion_o_certificado: string | null
          id_empresa: number
          id_empresa_ley_16744: number
          id_organismo_administrador_ley_16744: number | null
          tasa_adicional_diferenciada: number
          vigencia_fin: string | null
          vigencia_inicio: string
        }
        Insert: {
          actividad_economica?: string | null
          fuente_resolucion_o_certificado?: string | null
          id_empresa: number
          id_empresa_ley_16744?: number
          id_organismo_administrador_ley_16744?: number | null
          tasa_adicional_diferenciada?: number
          vigencia_fin?: string | null
          vigencia_inicio: string
        }
        Update: {
          actividad_economica?: string | null
          fuente_resolucion_o_certificado?: string | null
          id_empresa?: number
          id_empresa_ley_16744?: number
          id_organismo_administrador_ley_16744?: number | null
          tasa_adicional_diferenciada?: number
          vigencia_fin?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresa_ley_16744_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresa"
            referencedColumns: ["id_empresa"]
          },
          {
            foreignKeyName: "empresa_ley_16744_id_organismo_administrador_ley_16744_fkey"
            columns: ["id_organismo_administrador_ley_16744"]
            isOneToOne: false
            referencedRelation: "organismo_administrador_ley_16744"
            referencedColumns: ["id_organismo_administrador_ley_16744"]
          },
        ]
      }
      entidad_previsional_ips: {
        Row: {
          id_entidad_previsional_ips: number
          nombre: string
          vigente: boolean
        }
        Insert: {
          id_entidad_previsional_ips?: number
          nombre: string
          vigente?: boolean
        }
        Update: {
          id_entidad_previsional_ips?: number
          nombre?: string
          vigente?: boolean
        }
        Relationships: []
      }
      ex_caja_previsional: {
        Row: {
          codigo_base: string | null
          codigo_previred_ejemplo: string | null
          id_ex_caja_previsional: number
          nombre: string
          vigente: boolean
        }
        Insert: {
          codigo_base?: string | null
          codigo_previred_ejemplo?: string | null
          id_ex_caja_previsional?: number
          nombre: string
          vigente?: boolean
        }
        Update: {
          codigo_base?: string | null
          codigo_previred_ejemplo?: string | null
          id_ex_caja_previsional?: number
          nombre?: string
          vigente?: boolean
        }
        Relationships: []
      }
      ficha_validacion_detalle: {
        Row: {
          campo: string | null
          codigo: string
          dominio: Database["public"]["Enums"]["tipo_dominio_ficha_enum"]
          id_ficha_validacion: number
          id_ficha_validacion_detalle: number
          mensaje: string
          metadata: Json | null
          orden: number
          resuelto: boolean
          severidad: Database["public"]["Enums"]["tipo_severidad_validacion_enum"]
        }
        Insert: {
          campo?: string | null
          codigo: string
          dominio: Database["public"]["Enums"]["tipo_dominio_ficha_enum"]
          id_ficha_validacion: number
          id_ficha_validacion_detalle?: number
          mensaje: string
          metadata?: Json | null
          orden?: number
          resuelto?: boolean
          severidad: Database["public"]["Enums"]["tipo_severidad_validacion_enum"]
        }
        Update: {
          campo?: string | null
          codigo?: string
          dominio?: Database["public"]["Enums"]["tipo_dominio_ficha_enum"]
          id_ficha_validacion?: number
          id_ficha_validacion_detalle?: number
          mensaje?: string
          metadata?: Json | null
          orden?: number
          resuelto?: boolean
          severidad?: Database["public"]["Enums"]["tipo_severidad_validacion_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "ficha_validacion_detalle_id_ficha_validacion_fkey"
            columns: ["id_ficha_validacion"]
            isOneToOne: false
            referencedRelation: "ficha_validacion_resumen"
            referencedColumns: ["id_ficha_validacion"]
          },
        ]
      }
      ficha_validacion_resumen: {
        Row: {
          apto_para_activacion: boolean
          apto_para_remuneraciones: boolean
          estado_ficha_calculado: Database["public"]["Enums"]["tipo_estado_ficha_enum"]
          id_ficha_validacion: number
          id_persona: number
          observaciones: string | null
          total_advertencias: number
          total_bloqueantes: number
          total_criticos: number
          validado_en: string
          validado_por: number | null
        }
        Insert: {
          apto_para_activacion?: boolean
          apto_para_remuneraciones?: boolean
          estado_ficha_calculado: Database["public"]["Enums"]["tipo_estado_ficha_enum"]
          id_ficha_validacion?: number
          id_persona: number
          observaciones?: string | null
          total_advertencias?: number
          total_bloqueantes?: number
          total_criticos?: number
          validado_en?: string
          validado_por?: number | null
        }
        Update: {
          apto_para_activacion?: boolean
          apto_para_remuneraciones?: boolean
          estado_ficha_calculado?: Database["public"]["Enums"]["tipo_estado_ficha_enum"]
          id_ficha_validacion?: number
          id_persona?: number
          observaciones?: string | null
          total_advertencias?: number
          total_bloqueantes?: number
          total_criticos?: number
          validado_en?: string
          validado_por?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ficha_validacion_resumen_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "persona"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "ficha_validacion_resumen_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_persona"]
          },
        ]
      }
      finiquito: {
        Row: {
          anios_servicio: number
          causal: string
          fecha: string
          gratificacion_proporcional: number
          id_contrato: number
          id_finiquito: number
          indemnizacion_anios: number
          indemnizacion_aviso_previo: number
          otros: number
          total: number
          vacaciones_proporcionales: number
        }
        Insert: {
          anios_servicio: number
          causal: string
          fecha: string
          gratificacion_proporcional?: number
          id_contrato: number
          id_finiquito?: number
          indemnizacion_anios?: number
          indemnizacion_aviso_previo?: number
          otros?: number
          total: number
          vacaciones_proporcionales?: number
        }
        Update: {
          anios_servicio?: number
          causal?: string
          fecha?: string
          gratificacion_proporcional?: number
          id_contrato?: number
          id_finiquito?: number
          indemnizacion_anios?: number
          indemnizacion_aviso_previo?: number
          otros?: number
          total?: number
          vacaciones_proporcionales?: number
        }
        Relationships: [
          {
            foreignKeyName: "finiquito_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "contrato"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "finiquito_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_contrato"]
          },
        ]
      }
      forma_pago_apv: {
        Row: {
          codigo: string | null
          id_forma_pago_apv: number
          nombre: string
          periodo: string | null
          vigente: boolean
        }
        Insert: {
          codigo?: string | null
          id_forma_pago_apv?: number
          nombre: string
          periodo?: string | null
          vigente?: boolean
        }
        Update: {
          codigo?: string | null
          id_forma_pago_apv?: number
          nombre?: string
          periodo?: string | null
          vigente?: boolean
        }
        Relationships: []
      }
      haberdescuento_persona: {
        Row: {
          estado: boolean | null
          id_asignacion: number
          id_concepto: number
          id_contrato: number | null
          id_persona: number
          monto: number | null
          observacion: string | null
          periodicidad: string | null
          porcentaje: number | null
          tipo: string | null
          tipohaber: string | null
          vigencia_fin: string | null
          vigencia_inicio: string | null
        }
        Insert: {
          estado?: boolean | null
          id_asignacion?: number
          id_concepto: number
          id_contrato?: number | null
          id_persona: number
          monto?: number | null
          observacion?: string | null
          periodicidad?: string | null
          porcentaje?: number | null
          tipo?: string | null
          tipohaber?: string | null
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
        }
        Update: {
          estado?: boolean | null
          id_asignacion?: number
          id_concepto?: number
          id_contrato?: number | null
          id_persona?: number
          monto?: number | null
          observacion?: string | null
          periodicidad?: string | null
          porcentaje?: number | null
          tipo?: string | null
          tipohaber?: string | null
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "haberdescuento_persona_id_concepto_fkey"
            columns: ["id_concepto"]
            isOneToOne: false
            referencedRelation: "concepto"
            referencedColumns: ["id_concepto"]
          },
          {
            foreignKeyName: "haberdescuento_persona_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "contrato"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "haberdescuento_persona_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "haberdescuento_persona_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "persona"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "haberdescuento_persona_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_persona"]
          },
        ]
      }
      institucion_apv: {
        Row: {
          codigo: string | null
          id_institucion_apv: number
          nombre: string
          periodo: string | null
          vigente: boolean
        }
        Insert: {
          codigo?: string | null
          id_institucion_apv?: number
          nombre: string
          periodo?: string | null
          vigente?: boolean
        }
        Update: {
          codigo?: string | null
          id_institucion_apv?: number
          nombre?: string
          periodo?: string | null
          vigente?: boolean
        }
        Relationships: []
      }
      ips_ex_caja_tasa_basica: {
        Row: {
          escenario_empresa: string
          fuente: string | null
          grupo_trabajador: string
          id_ips_ex_caja_tasa_basica: number
          nombre_escenario: string
          nombre_grupo: string
          observacion: string | null
          tasa_cotizacion: number
          tipo_salud: string
          vigencia_fin: string | null
          vigencia_inicio: string
          vigente: boolean
        }
        Insert: {
          escenario_empresa: string
          fuente?: string | null
          grupo_trabajador: string
          id_ips_ex_caja_tasa_basica?: number
          nombre_escenario: string
          nombre_grupo: string
          observacion?: string | null
          tasa_cotizacion: number
          tipo_salud: string
          vigencia_fin?: string | null
          vigencia_inicio: string
          vigente?: boolean
        }
        Update: {
          escenario_empresa?: string
          fuente?: string | null
          grupo_trabajador?: string
          id_ips_ex_caja_tasa_basica?: number
          nombre_escenario?: string
          nombre_grupo?: string
          observacion?: string | null
          tasa_cotizacion?: number
          tipo_salud?: string
          vigencia_fin?: string | null
          vigencia_inicio?: string
          vigente?: boolean
        }
        Relationships: []
      }
      ley_16744_parametros: {
        Row: {
          codigo: string
          cotizacion_basica_empleador: number
          descripcion_tasa_adicional: string | null
          fuente_financiamiento: string | null
          fuente_organismos: string | null
          id_ley_16744_parametro: number
          periodo: string
          vigencia_fin: string | null
          vigencia_inicio: string
          vigente: boolean
        }
        Insert: {
          codigo: string
          cotizacion_basica_empleador: number
          descripcion_tasa_adicional?: string | null
          fuente_financiamiento?: string | null
          fuente_organismos?: string | null
          id_ley_16744_parametro?: number
          periodo: string
          vigencia_fin?: string | null
          vigencia_inicio?: string
          vigente?: boolean
        }
        Update: {
          codigo?: string
          cotizacion_basica_empleador?: number
          descripcion_tasa_adicional?: string | null
          fuente_financiamiento?: string | null
          fuente_organismos?: string | null
          id_ley_16744_parametro?: number
          periodo?: string
          vigencia_fin?: string | null
          vigencia_inicio?: string
          vigente?: boolean
        }
        Relationships: []
      }
      liquidacion: {
        Row: {
          afc_empleador: number | null
          afc_trabajador: number | null
          afp_trabajador: number | null
          descuentos_legales: number | null
          descuentos_nolegales: number | null
          dias_trabajados: number | null
          estado: string | null
          estado_v4:
            | Database["public"]["Enums"]["tipo_estado_liquidacion_enum"]
            | null
          fecha_proceso: string | null
          haberes_imponibles: number | null
          haberes_noimponibles: number | null
          id_contrato: number
          id_liquidacion: number
          id_periodo: number | null
          id_persona: number | null
          idusuario: number | null
          imponible_100sc: number | null
          impuesto_unico: number | null
          monto_liquido: number | null
          periodo: string
          renta_imponible: number | null
          salud_trabajador: number | null
          sis_empleador: number | null
          total_aportes_empleador: number | null
          total_descuentos: number | null
          total_haberes: number | null
          total_tributable: number | null
          valoruf: number | null
          valorutm: number | null
          zona_extrema: number | null
        }
        Insert: {
          afc_empleador?: number | null
          afc_trabajador?: number | null
          afp_trabajador?: number | null
          descuentos_legales?: number | null
          descuentos_nolegales?: number | null
          dias_trabajados?: number | null
          estado?: string | null
          estado_v4?:
            | Database["public"]["Enums"]["tipo_estado_liquidacion_enum"]
            | null
          fecha_proceso?: string | null
          haberes_imponibles?: number | null
          haberes_noimponibles?: number | null
          id_contrato: number
          id_liquidacion?: number
          id_periodo?: number | null
          id_persona?: number | null
          idusuario?: number | null
          imponible_100sc?: number | null
          impuesto_unico?: number | null
          monto_liquido?: number | null
          periodo: string
          renta_imponible?: number | null
          salud_trabajador?: number | null
          sis_empleador?: number | null
          total_aportes_empleador?: number | null
          total_descuentos?: number | null
          total_haberes?: number | null
          total_tributable?: number | null
          valoruf?: number | null
          valorutm?: number | null
          zona_extrema?: number | null
        }
        Update: {
          afc_empleador?: number | null
          afc_trabajador?: number | null
          afp_trabajador?: number | null
          descuentos_legales?: number | null
          descuentos_nolegales?: number | null
          dias_trabajados?: number | null
          estado?: string | null
          estado_v4?:
            | Database["public"]["Enums"]["tipo_estado_liquidacion_enum"]
            | null
          fecha_proceso?: string | null
          haberes_imponibles?: number | null
          haberes_noimponibles?: number | null
          id_contrato?: number
          id_liquidacion?: number
          id_periodo?: number | null
          id_persona?: number | null
          idusuario?: number | null
          imponible_100sc?: number | null
          impuesto_unico?: number | null
          monto_liquido?: number | null
          periodo?: string
          renta_imponible?: number | null
          salud_trabajador?: number | null
          sis_empleador?: number | null
          total_aportes_empleador?: number | null
          total_descuentos?: number | null
          total_haberes?: number | null
          total_tributable?: number | null
          valoruf?: number | null
          valorutm?: number | null
          zona_extrema?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "liquidacion_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "contrato"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "liquidacion_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "liquidacion_id_periodo_fkey"
            columns: ["id_periodo"]
            isOneToOne: false
            referencedRelation: "periodo_remuneracion"
            referencedColumns: ["id_periodo"]
          },
          {
            foreignKeyName: "liquidacion_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "persona"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "liquidacion_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_persona"]
          },
        ]
      }
      liquidacion_detalle: {
        Row: {
          afecta_afc: boolean
          afecta_afp: boolean
          afecta_salud: boolean
          afecta_sis: boolean
          cantidad: number | null
          descripcion: string | null
          id_concepto: number
          id_detalle: number
          id_liquidacion: number
          imponible: boolean
          monto: number
          orden: number | null
          tipo: string | null
          tipo_haber: string | null
          tributable: boolean
        }
        Insert: {
          afecta_afc?: boolean
          afecta_afp?: boolean
          afecta_salud?: boolean
          afecta_sis?: boolean
          cantidad?: number | null
          descripcion?: string | null
          id_concepto: number
          id_detalle?: number
          id_liquidacion: number
          imponible?: boolean
          monto: number
          orden?: number | null
          tipo?: string | null
          tipo_haber?: string | null
          tributable?: boolean
        }
        Update: {
          afecta_afc?: boolean
          afecta_afp?: boolean
          afecta_salud?: boolean
          afecta_sis?: boolean
          cantidad?: number | null
          descripcion?: string | null
          id_concepto?: number
          id_detalle?: number
          id_liquidacion?: number
          imponible?: boolean
          monto?: number
          orden?: number | null
          tipo?: string | null
          tipo_haber?: string | null
          tributable?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "liquidacion_detalle_id_concepto_fkey"
            columns: ["id_concepto"]
            isOneToOne: false
            referencedRelation: "concepto"
            referencedColumns: ["id_concepto"]
          },
          {
            foreignKeyName: "liquidacion_detalle_id_liquidacion_fkey"
            columns: ["id_liquidacion"]
            isOneToOne: false
            referencedRelation: "liquidacion"
            referencedColumns: ["id_liquidacion"]
          },
        ]
      }
      moneda: {
        Row: {
          codigo: string
          id_moneda: number
          nombre: string
          simbolo: string
        }
        Insert: {
          codigo: string
          id_moneda?: number
          nombre: string
          simbolo: string
        }
        Update: {
          codigo?: string
          id_moneda?: number
          nombre?: string
          simbolo?: string
        }
        Relationships: []
      }
      motivo_inasistencia: {
        Row: {
          activo: boolean
          codigo: string
          descuenta_dias: boolean
          id_motivo_inasistencia: number
          nombre: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          descuenta_dias?: boolean
          id_motivo_inasistencia: number
          nombre: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          descuenta_dias?: boolean
          id_motivo_inasistencia?: number
          nombre?: string
        }
        Relationships: []
      }
      movimiento: {
        Row: {
          cantidad: number | null
          diainasist: number | null
          fecha: string
          hrs_pactadas: number | null
          id_concepto: number | null
          id_contrato: number | null
          id_motivo_inasistencia: number | null
          id_movimiento: number
          id_persona: number
          id_tipo_movimiento: number | null
          monto: number | null
          motivoinasist: number | null
          observacion: string | null
          tipomovimiento: number | null
        }
        Insert: {
          cantidad?: number | null
          diainasist?: number | null
          fecha: string
          hrs_pactadas?: number | null
          id_concepto?: number | null
          id_contrato?: number | null
          id_motivo_inasistencia?: number | null
          id_movimiento?: number
          id_persona: number
          id_tipo_movimiento?: number | null
          monto?: number | null
          motivoinasist?: number | null
          observacion?: string | null
          tipomovimiento?: number | null
        }
        Update: {
          cantidad?: number | null
          diainasist?: number | null
          fecha?: string
          hrs_pactadas?: number | null
          id_concepto?: number | null
          id_contrato?: number | null
          id_motivo_inasistencia?: number | null
          id_movimiento?: number
          id_persona?: number
          id_tipo_movimiento?: number | null
          monto?: number | null
          motivoinasist?: number | null
          observacion?: string | null
          tipomovimiento?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movimiento_id_concepto_fkey"
            columns: ["id_concepto"]
            isOneToOne: false
            referencedRelation: "concepto"
            referencedColumns: ["id_concepto"]
          },
          {
            foreignKeyName: "movimiento_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "contrato"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "movimiento_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "movimiento_id_motivo_inasistencia_fkey"
            columns: ["id_motivo_inasistencia"]
            isOneToOne: false
            referencedRelation: "motivo_inasistencia"
            referencedColumns: ["id_motivo_inasistencia"]
          },
          {
            foreignKeyName: "movimiento_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "persona"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "movimiento_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "movimiento_id_tipo_movimiento_fkey"
            columns: ["id_tipo_movimiento"]
            isOneToOne: false
            referencedRelation: "tipo_movimiento"
            referencedColumns: ["id_tipo_movimiento"]
          },
        ]
      }
      movimiento_variable_mensual: {
        Row: {
          estado: string
          fecha_actualizacion: string
          fecha_anulacion: string | null
          fecha_registro: string
          id_concepto: number
          id_movimiento_variable: number
          id_persona: number
          monto: number
          motivo_anulacion: string | null
          observacion: string | null
          origen: string
          periodo: string
        }
        Insert: {
          estado?: string
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_registro?: string
          id_concepto: number
          id_movimiento_variable?: number
          id_persona: number
          monto: number
          motivo_anulacion?: string | null
          observacion?: string | null
          origen?: string
          periodo: string
        }
        Update: {
          estado?: string
          fecha_actualizacion?: string
          fecha_anulacion?: string | null
          fecha_registro?: string
          id_concepto?: number
          id_movimiento_variable?: number
          id_persona?: number
          monto?: number
          motivo_anulacion?: string | null
          observacion?: string | null
          origen?: string
          periodo?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimiento_variable_mensual_id_concepto_fkey"
            columns: ["id_concepto"]
            isOneToOne: false
            referencedRelation: "concepto"
            referencedColumns: ["id_concepto"]
          },
          {
            foreignKeyName: "movimiento_variable_mensual_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "persona"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "movimiento_variable_mensual_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_persona"]
          },
        ]
      }
      nomina_calculo_concepto: {
        Row: {
          afecta_liquido: boolean
          codigo_lre_snapshot: string | null
          created_at: string
          id_calculo_concepto: number
          id_calculo_trabajador: number
          id_concepto: number | null
          imponible: boolean
          monto: number
          nombre_concepto_snapshot: string
          origen: string
          tipo: string
          trazabilidad_json: Json | null
          tributable: boolean
        }
        Insert: {
          afecta_liquido?: boolean
          codigo_lre_snapshot?: string | null
          created_at?: string
          id_calculo_concepto?: number
          id_calculo_trabajador: number
          id_concepto?: number | null
          imponible?: boolean
          monto?: number
          nombre_concepto_snapshot: string
          origen: string
          tipo: string
          trazabilidad_json?: Json | null
          tributable?: boolean
        }
        Update: {
          afecta_liquido?: boolean
          codigo_lre_snapshot?: string | null
          created_at?: string
          id_calculo_concepto?: number
          id_calculo_trabajador?: number
          id_concepto?: number | null
          imponible?: boolean
          monto?: number
          nombre_concepto_snapshot?: string
          origen?: string
          tipo?: string
          trazabilidad_json?: Json | null
          tributable?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "nomina_calculo_concepto_id_calculo_trabajador_fkey"
            columns: ["id_calculo_trabajador"]
            isOneToOne: false
            referencedRelation: "nomina_calculo_trabajador"
            referencedColumns: ["id_calculo_trabajador"]
          },
          {
            foreignKeyName: "nomina_calculo_concepto_id_concepto_fkey"
            columns: ["id_concepto"]
            isOneToOne: false
            referencedRelation: "concepto"
            referencedColumns: ["id_concepto"]
          },
        ]
      }
      nomina_calculo_issue: {
        Row: {
          campo: string | null
          codigo: string
          created_at: string
          entidad_id: string | null
          id_calculo_periodo: number
          id_calculo_trabajador: number | null
          id_issue: number
          mensaje: string
          origen: string
          severidad: string
        }
        Insert: {
          campo?: string | null
          codigo: string
          created_at?: string
          entidad_id?: string | null
          id_calculo_periodo: number
          id_calculo_trabajador?: number | null
          id_issue?: number
          mensaje: string
          origen: string
          severidad: string
        }
        Update: {
          campo?: string | null
          codigo?: string
          created_at?: string
          entidad_id?: string | null
          id_calculo_periodo?: number
          id_calculo_trabajador?: number | null
          id_issue?: number
          mensaje?: string
          origen?: string
          severidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "nomina_calculo_issue_id_calculo_periodo_fkey"
            columns: ["id_calculo_periodo"]
            isOneToOne: false
            referencedRelation: "nomina_calculo_periodo"
            referencedColumns: ["id_calculo_periodo"]
          },
          {
            foreignKeyName: "nomina_calculo_issue_id_calculo_trabajador_fkey"
            columns: ["id_calculo_trabajador"]
            isOneToOne: false
            referencedRelation: "nomina_calculo_trabajador"
            referencedColumns: ["id_calculo_trabajador"]
          },
        ]
      }
      nomina_calculo_periodo: {
        Row: {
          activo: boolean
          aprobacion_operativa_advertencias: Json
          aprobacion_operativa_estado: string | null
          aprobacion_operativa_fecha: string | null
          aprobacion_operativa_metadata: Json
          aprobacion_operativa_usuario_id: string | null
          aprobacion_operativa_usuario_label: string | null
          cierre_operativo_estado: string | null
          cierre_operativo_fecha: string | null
          cierre_operativo_metadata: Json
          cierre_operativo_observacion: string | null
          cierre_operativo_usuario_id: string | null
          cierre_operativo_usuario_label: string | null
          created_at: string
          estado: string
          fecha_generacion: string
          hash_snapshot: string | null
          id_calculo_periodo: number
          id_empresa: number | null
          observacion_anulacion: string | null
          origen: string
          periodo: string
          reemplazado_por: number | null
          total_advertencias: number
          total_bloqueados: number
          total_descuentos: number
          total_haberes: number
          total_liquido: number
          total_trabajadores: number
          updated_at: string
          usuario_generador: string | null
          version_motor: string
        }
        Insert: {
          activo?: boolean
          aprobacion_operativa_advertencias?: Json
          aprobacion_operativa_estado?: string | null
          aprobacion_operativa_fecha?: string | null
          aprobacion_operativa_metadata?: Json
          aprobacion_operativa_usuario_id?: string | null
          aprobacion_operativa_usuario_label?: string | null
          cierre_operativo_estado?: string | null
          cierre_operativo_fecha?: string | null
          cierre_operativo_metadata?: Json
          cierre_operativo_observacion?: string | null
          cierre_operativo_usuario_id?: string | null
          cierre_operativo_usuario_label?: string | null
          created_at?: string
          estado?: string
          fecha_generacion?: string
          hash_snapshot?: string | null
          id_calculo_periodo?: number
          id_empresa?: number | null
          observacion_anulacion?: string | null
          origen?: string
          periodo: string
          reemplazado_por?: number | null
          total_advertencias?: number
          total_bloqueados?: number
          total_descuentos?: number
          total_haberes?: number
          total_liquido?: number
          total_trabajadores?: number
          updated_at?: string
          usuario_generador?: string | null
          version_motor: string
        }
        Update: {
          activo?: boolean
          aprobacion_operativa_advertencias?: Json
          aprobacion_operativa_estado?: string | null
          aprobacion_operativa_fecha?: string | null
          aprobacion_operativa_metadata?: Json
          aprobacion_operativa_usuario_id?: string | null
          aprobacion_operativa_usuario_label?: string | null
          cierre_operativo_estado?: string | null
          cierre_operativo_fecha?: string | null
          cierre_operativo_metadata?: Json
          cierre_operativo_observacion?: string | null
          cierre_operativo_usuario_id?: string | null
          cierre_operativo_usuario_label?: string | null
          created_at?: string
          estado?: string
          fecha_generacion?: string
          hash_snapshot?: string | null
          id_calculo_periodo?: number
          id_empresa?: number | null
          observacion_anulacion?: string | null
          origen?: string
          periodo?: string
          reemplazado_por?: number | null
          total_advertencias?: number
          total_bloqueados?: number
          total_descuentos?: number
          total_haberes?: number
          total_liquido?: number
          total_trabajadores?: number
          updated_at?: string
          usuario_generador?: string | null
          version_motor?: string
        }
        Relationships: [
          {
            foreignKeyName: "nomina_calculo_periodo_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresa"
            referencedColumns: ["id_empresa"]
          },
          {
            foreignKeyName: "nomina_calculo_periodo_reemplazado_por_fkey"
            columns: ["reemplazado_por"]
            isOneToOne: false
            referencedRelation: "nomina_calculo_periodo"
            referencedColumns: ["id_calculo_periodo"]
          },
        ]
      }
      nomina_calculo_trabajador: {
        Row: {
          base_imponible_previsional: number
          base_tributable: number
          cotizacion_afc: number
          cotizacion_afp: number
          cotizacion_ley_16744_empleador: number
          cotizacion_salud: number
          cotizacion_sanna: number
          cotizacion_sis: number
          created_at: string
          estado: string
          id_calculo_periodo: number
          id_calculo_trabajador: number
          id_persona: number
          impuesto_unico: number
          liquido_preliminar: number
          nombre_completo_snapshot: string
          rut: string
          sueldo_base: number
          total_descuentos_legales: number
          total_descuentos_voluntarios: number
          total_haberes_imponibles: number
          total_haberes_no_imponibles: number
          updated_at: string
        }
        Insert: {
          base_imponible_previsional?: number
          base_tributable?: number
          cotizacion_afc?: number
          cotizacion_afp?: number
          cotizacion_ley_16744_empleador?: number
          cotizacion_salud?: number
          cotizacion_sanna?: number
          cotizacion_sis?: number
          created_at?: string
          estado: string
          id_calculo_periodo: number
          id_calculo_trabajador?: number
          id_persona: number
          impuesto_unico?: number
          liquido_preliminar?: number
          nombre_completo_snapshot: string
          rut: string
          sueldo_base?: number
          total_descuentos_legales?: number
          total_descuentos_voluntarios?: number
          total_haberes_imponibles?: number
          total_haberes_no_imponibles?: number
          updated_at?: string
        }
        Update: {
          base_imponible_previsional?: number
          base_tributable?: number
          cotizacion_afc?: number
          cotizacion_afp?: number
          cotizacion_ley_16744_empleador?: number
          cotizacion_salud?: number
          cotizacion_sanna?: number
          cotizacion_sis?: number
          created_at?: string
          estado?: string
          id_calculo_periodo?: number
          id_calculo_trabajador?: number
          id_persona?: number
          impuesto_unico?: number
          liquido_preliminar?: number
          nombre_completo_snapshot?: string
          rut?: string
          sueldo_base?: number
          total_descuentos_legales?: number
          total_descuentos_voluntarios?: number
          total_haberes_imponibles?: number
          total_haberes_no_imponibles?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nomina_calculo_trabajador_id_calculo_periodo_fkey"
            columns: ["id_calculo_periodo"]
            isOneToOne: false
            referencedRelation: "nomina_calculo_periodo"
            referencedColumns: ["id_calculo_periodo"]
          },
          {
            foreignKeyName: "nomina_calculo_trabajador_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "persona"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "nomina_calculo_trabajador_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_persona"]
          },
        ]
      }
      nomina_calculo_trazabilidad: {
        Row: {
          campo_fuente: string
          codigo: string
          created_at: string
          formula: string
          id_calculo_periodo: number
          id_calculo_trabajador: number | null
          id_trazabilidad: number
          observacion: string | null
          origen: string
          tabla_fuente: string
          valor_entrada: Json | null
          valor_resultado: Json | null
          vigencia_fin: string | null
          vigencia_inicio: string | null
        }
        Insert: {
          campo_fuente: string
          codigo: string
          created_at?: string
          formula: string
          id_calculo_periodo: number
          id_calculo_trabajador?: number | null
          id_trazabilidad?: number
          observacion?: string | null
          origen: string
          tabla_fuente: string
          valor_entrada?: Json | null
          valor_resultado?: Json | null
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
        }
        Update: {
          campo_fuente?: string
          codigo?: string
          created_at?: string
          formula?: string
          id_calculo_periodo?: number
          id_calculo_trabajador?: number | null
          id_trazabilidad?: number
          observacion?: string | null
          origen?: string
          tabla_fuente?: string
          valor_entrada?: Json | null
          valor_resultado?: Json | null
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nomina_calculo_trazabilidad_id_calculo_periodo_fkey"
            columns: ["id_calculo_periodo"]
            isOneToOne: false
            referencedRelation: "nomina_calculo_periodo"
            referencedColumns: ["id_calculo_periodo"]
          },
          {
            foreignKeyName: "nomina_calculo_trazabilidad_id_calculo_trabajador_fkey"
            columns: ["id_calculo_trabajador"]
            isOneToOne: false
            referencedRelation: "nomina_calculo_trabajador"
            referencedColumns: ["id_calculo_trabajador"]
          },
        ]
      }
      nomina_liquidacion_concepto: {
        Row: {
          base: number | null
          cantidad: number | null
          clasificacion: string | null
          codigo: string | null
          codigo_lre: string | null
          created_at: string
          id_concepto: number | null
          id_liquidacion_concepto: number
          id_liquidacion_trabajador: number
          metadata: Json
          monto: number
          nombre: string
          orden: number
          tasa: number | null
          tipo: string
        }
        Insert: {
          base?: number | null
          cantidad?: number | null
          clasificacion?: string | null
          codigo?: string | null
          codigo_lre?: string | null
          created_at?: string
          id_concepto?: number | null
          id_liquidacion_concepto?: number
          id_liquidacion_trabajador: number
          metadata?: Json
          monto?: number
          nombre: string
          orden?: number
          tasa?: number | null
          tipo: string
        }
        Update: {
          base?: number | null
          cantidad?: number | null
          clasificacion?: string | null
          codigo?: string | null
          codigo_lre?: string | null
          created_at?: string
          id_concepto?: number | null
          id_liquidacion_concepto?: number
          id_liquidacion_trabajador?: number
          metadata?: Json
          monto?: number
          nombre?: string
          orden?: number
          tasa?: number | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "nomina_liquidacion_concepto_id_liquidacion_trabajador_fkey"
            columns: ["id_liquidacion_trabajador"]
            isOneToOne: false
            referencedRelation: "nomina_liquidacion_trabajador"
            referencedColumns: ["id_liquidacion_trabajador"]
          },
        ]
      }
      nomina_liquidacion_periodo: {
        Row: {
          activo: boolean
          created_at: string
          estado: string
          fecha_generacion: string
          id_calculo_periodo: number
          id_empresa: number | null
          id_liquidacion_periodo: number
          metadata: Json
          periodo: string
          total_descuentos: number
          total_haberes: number
          total_liquido: number
          total_trabajadores: number
          updated_at: string
          usuario_generacion_id: string | null
          usuario_generacion_label: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          estado?: string
          fecha_generacion?: string
          id_calculo_periodo: number
          id_empresa?: number | null
          id_liquidacion_periodo?: number
          metadata?: Json
          periodo: string
          total_descuentos?: number
          total_haberes?: number
          total_liquido?: number
          total_trabajadores?: number
          updated_at?: string
          usuario_generacion_id?: string | null
          usuario_generacion_label?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          estado?: string
          fecha_generacion?: string
          id_calculo_periodo?: number
          id_empresa?: number | null
          id_liquidacion_periodo?: number
          metadata?: Json
          periodo?: string
          total_descuentos?: number
          total_haberes?: number
          total_liquido?: number
          total_trabajadores?: number
          updated_at?: string
          usuario_generacion_id?: string | null
          usuario_generacion_label?: string | null
        }
        Relationships: []
      }
      nomina_liquidacion_trabajador: {
        Row: {
          base_imponible: number
          base_tributable: number
          cargo: string | null
          centro_costo: string | null
          created_at: string
          dias_trabajados: number | null
          estado: string
          fecha_ingreso: string | null
          id_calculo_periodo: number
          id_contrato: number | null
          id_liquidacion_periodo: number
          id_liquidacion_trabajador: number
          id_persona: number | null
          liquido_pagar: number
          metadata: Json
          nombre_trabajador: string
          observaciones: Json
          rut: string | null
          total_aportes_empleador_referencia: number
          total_descuentos: number
          total_haberes: number
          updated_at: string
        }
        Insert: {
          base_imponible?: number
          base_tributable?: number
          cargo?: string | null
          centro_costo?: string | null
          created_at?: string
          dias_trabajados?: number | null
          estado?: string
          fecha_ingreso?: string | null
          id_calculo_periodo: number
          id_contrato?: number | null
          id_liquidacion_periodo: number
          id_liquidacion_trabajador?: number
          id_persona?: number | null
          liquido_pagar?: number
          metadata?: Json
          nombre_trabajador: string
          observaciones?: Json
          rut?: string | null
          total_aportes_empleador_referencia?: number
          total_descuentos?: number
          total_haberes?: number
          updated_at?: string
        }
        Update: {
          base_imponible?: number
          base_tributable?: number
          cargo?: string | null
          centro_costo?: string | null
          created_at?: string
          dias_trabajados?: number | null
          estado?: string
          fecha_ingreso?: string | null
          id_calculo_periodo?: number
          id_contrato?: number | null
          id_liquidacion_periodo?: number
          id_liquidacion_trabajador?: number
          id_persona?: number | null
          liquido_pagar?: number
          metadata?: Json
          nombre_trabajador?: string
          observaciones?: Json
          rut?: string | null
          total_aportes_empleador_referencia?: number
          total_descuentos?: number
          total_haberes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nomina_liquidacion_trabajador_id_liquidacion_periodo_fkey"
            columns: ["id_liquidacion_periodo"]
            isOneToOne: false
            referencedRelation: "nomina_liquidacion_periodo"
            referencedColumns: ["id_liquidacion_periodo"]
          },
        ]
      }
      nomina_periodo_diagnostico: {
        Row: {
          activo: boolean
          cerrado_en: string | null
          cerrado_motivo: string | null
          created_at: string
          estado: string
          fingerprint: string | null
          id_diagnostico: number
          payload: Json
          periodo: string
          updated_at: string
          verificado_en: string
          verificado_por: string
        }
        Insert: {
          activo?: boolean
          cerrado_en?: string | null
          cerrado_motivo?: string | null
          created_at?: string
          estado?: string
          fingerprint?: string | null
          id_diagnostico?: number
          payload: Json
          periodo: string
          updated_at?: string
          verificado_en?: string
          verificado_por: string
        }
        Update: {
          activo?: boolean
          cerrado_en?: string | null
          cerrado_motivo?: string | null
          created_at?: string
          estado?: string
          fingerprint?: string | null
          id_diagnostico?: number
          payload?: Json
          periodo?: string
          updated_at?: string
          verificado_en?: string
          verificado_por?: string
        }
        Relationships: []
      }
      novedad_remuneracion_periodo: {
        Row: {
          aprobado_por: string | null
          cantidad: number | null
          categoria: string
          creado_por: string | null
          estado: string
          fecha_actualizacion: string
          fecha_aprobacion: string | null
          fecha_creacion: string
          fecha_evento: string | null
          id_concepto: number
          id_contrato: number | null
          id_novedad_remuneracion_periodo: number
          id_persona: number
          moneda: string
          monto: number | null
          observacion: string | null
          origen: string
          periodo: string
          referencia_externa: string | null
          tipo_movimiento: string
          unidad: string | null
        }
        Insert: {
          aprobado_por?: string | null
          cantidad?: number | null
          categoria: string
          creado_por?: string | null
          estado?: string
          fecha_actualizacion?: string
          fecha_aprobacion?: string | null
          fecha_creacion?: string
          fecha_evento?: string | null
          id_concepto: number
          id_contrato?: number | null
          id_novedad_remuneracion_periodo?: number
          id_persona: number
          moneda?: string
          monto?: number | null
          observacion?: string | null
          origen?: string
          periodo: string
          referencia_externa?: string | null
          tipo_movimiento: string
          unidad?: string | null
        }
        Update: {
          aprobado_por?: string | null
          cantidad?: number | null
          categoria?: string
          creado_por?: string | null
          estado?: string
          fecha_actualizacion?: string
          fecha_aprobacion?: string | null
          fecha_creacion?: string
          fecha_evento?: string | null
          id_concepto?: number
          id_contrato?: number | null
          id_novedad_remuneracion_periodo?: number
          id_persona?: number
          moneda?: string
          monto?: number | null
          observacion?: string | null
          origen?: string
          periodo?: string
          referencia_externa?: string | null
          tipo_movimiento?: string
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "novedad_remuneracion_periodo_id_concepto_fkey"
            columns: ["id_concepto"]
            isOneToOne: false
            referencedRelation: "concepto"
            referencedColumns: ["id_concepto"]
          },
          {
            foreignKeyName: "novedad_remuneracion_periodo_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "contrato"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "novedad_remuneracion_periodo_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "novedad_remuneracion_periodo_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "persona"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "novedad_remuneracion_periodo_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "novedad_remuneracion_periodo_periodo_fkey"
            columns: ["periodo"]
            isOneToOne: false
            referencedRelation: "periodo_remuneracion"
            referencedColumns: ["codigo"]
          },
        ]
      }
      organismo_administrador_ley_16744: {
        Row: {
          codigo: string
          id_organismo_administrador_ley_16744: number
          nombre: string
          periodo: string | null
          tipo: string
          vigente: boolean
        }
        Insert: {
          codigo: string
          id_organismo_administrador_ley_16744?: number
          nombre: string
          periodo?: string | null
          tipo: string
          vigente?: boolean
        }
        Update: {
          codigo?: string
          id_organismo_administrador_ley_16744?: number
          nombre?: string
          periodo?: string | null
          tipo?: string
          vigente?: boolean
        }
        Relationships: []
      }
      pais: {
        Row: {
          activo: boolean
          codigo_iso2: string
          codigo_iso3: string
          codigo_numerico: string
          fecha_actualizacion: string
          fecha_creacion: string
          id_pais: number
          nombre: string
          nombre_iso: string
        }
        Insert: {
          activo?: boolean
          codigo_iso2: string
          codigo_iso3: string
          codigo_numerico: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id_pais?: number
          nombre: string
          nombre_iso: string
        }
        Update: {
          activo?: boolean
          codigo_iso2?: string
          codigo_iso3?: string
          codigo_numerico?: string
          fecha_actualizacion?: string
          fecha_creacion?: string
          id_pais?: number
          nombre?: string
          nombre_iso?: string
        }
        Relationships: []
      }
      parametros_generales: {
        Row: {
          afc_empleador_indefinido: number | null
          afc_empleador_plazo: number | null
          afc_trabajador_indefinido: number | null
          dsctosbpordia: boolean | null
          fecha_actualizacion: string | null
          gratificacion: boolean | null
          imm_gratificacion: number | null
          ingreso_minimo_no_remuneracional: number | null
          periodo: string
          salud_ccaf: number | null
          salud_fonasa_con_ccaf: number | null
          salud_obligatoria: number | null
          sanna: number | null
          sis: number | null
          sueldo_minimo: number | null
          sueldo_minimo_casa_particular: number | null
          sueldo_minimo_menor18_mayor65: number | null
          sueldo_minimo18_65: number | null
          tope_afp: number | null
          tope_afp_uf: number | null
          tope_afpvoluntario: number | null
          tope_apv_anual: number | null
          tope_apv_anual_uf: number | null
          tope_apv_mensual: number | null
          tope_apv_mensual_uf: number | null
          tope_cesantia: number | null
          tope_cesantia_uf: number | null
          tope_deposito_convenido_anual: number | null
          tope_deposito_convenido_anual_uf: number | null
          tope_ips: number | null
          tope_ips_uf: number | null
          uf: number | null
          uta: number | null
          utm: number | null
        }
        Insert: {
          afc_empleador_indefinido?: number | null
          afc_empleador_plazo?: number | null
          afc_trabajador_indefinido?: number | null
          dsctosbpordia?: boolean | null
          fecha_actualizacion?: string | null
          gratificacion?: boolean | null
          imm_gratificacion?: number | null
          ingreso_minimo_no_remuneracional?: number | null
          periodo: string
          salud_ccaf?: number | null
          salud_fonasa_con_ccaf?: number | null
          salud_obligatoria?: number | null
          sanna?: number | null
          sis?: number | null
          sueldo_minimo?: number | null
          sueldo_minimo_casa_particular?: number | null
          sueldo_minimo_menor18_mayor65?: number | null
          sueldo_minimo18_65?: number | null
          tope_afp?: number | null
          tope_afp_uf?: number | null
          tope_afpvoluntario?: number | null
          tope_apv_anual?: number | null
          tope_apv_anual_uf?: number | null
          tope_apv_mensual?: number | null
          tope_apv_mensual_uf?: number | null
          tope_cesantia?: number | null
          tope_cesantia_uf?: number | null
          tope_deposito_convenido_anual?: number | null
          tope_deposito_convenido_anual_uf?: number | null
          tope_ips?: number | null
          tope_ips_uf?: number | null
          uf?: number | null
          uta?: number | null
          utm?: number | null
        }
        Update: {
          afc_empleador_indefinido?: number | null
          afc_empleador_plazo?: number | null
          afc_trabajador_indefinido?: number | null
          dsctosbpordia?: boolean | null
          fecha_actualizacion?: string | null
          gratificacion?: boolean | null
          imm_gratificacion?: number | null
          ingreso_minimo_no_remuneracional?: number | null
          periodo?: string
          salud_ccaf?: number | null
          salud_fonasa_con_ccaf?: number | null
          salud_obligatoria?: number | null
          sanna?: number | null
          sis?: number | null
          sueldo_minimo?: number | null
          sueldo_minimo_casa_particular?: number | null
          sueldo_minimo_menor18_mayor65?: number | null
          sueldo_minimo18_65?: number | null
          tope_afp?: number | null
          tope_afp_uf?: number | null
          tope_afpvoluntario?: number | null
          tope_apv_anual?: number | null
          tope_apv_anual_uf?: number | null
          tope_apv_mensual?: number | null
          tope_apv_mensual_uf?: number | null
          tope_cesantia?: number | null
          tope_cesantia_uf?: number | null
          tope_deposito_convenido_anual?: number | null
          tope_deposito_convenido_anual_uf?: number | null
          tope_ips?: number | null
          tope_ips_uf?: number | null
          uf?: number | null
          uta?: number | null
          utm?: number | null
        }
        Relationships: []
      }
      parametros_generales_cliente: {
        Row: {
          afc_empleador_casa_particular: number | null
          afc_empleador_indefinido: number | null
          afc_empleador_indefinido_11_anos_mas: number | null
          afc_empleador_plazo: number | null
          afc_trabajador_indefinido: number | null
          aporte_empleador_afp: number | null
          descuentos_base_por_dia: boolean | null
          estado_reconciliacion_oficial: string
          fecha_actualizacion: string | null
          fecha_reconciliacion_oficial: string | null
          gratificacion: boolean | null
          id_ccaf_entidad: number | null
          id_organismo_administrador_ley_16744: number | null
          imm_gratificacion: number | null
          ingreso_minimo_no_remuneracional: number | null
          observacion_reconciliacion: string | null
          origen_reconciliacion: string | null
          periodo: string
          salud_ccaf: number | null
          salud_fonasa_con_ccaf: number | null
          salud_obligatoria: number | null
          sanna: number | null
          seguro_social_expectativa_vida: number | null
          sis: number | null
          sueldo_minimo: number | null
          sueldo_minimo_casa_particular: number | null
          sueldo_minimo_menor18_mayor65: number | null
          sueldo_minimo18_65: number | null
          tope_afp: number | null
          tope_afp_uf: number | null
          tope_afpvoluntario: number | null
          tope_apv_anual: number | null
          tope_apv_anual_uf: number | null
          tope_apv_mensual: number | null
          tope_apv_mensual_uf: number | null
          tope_cesantia: number | null
          tope_cesantia_uf: number | null
          tope_deposito_convenido_anual: number | null
          tope_deposito_convenido_anual_uf: number | null
          tope_ips: number | null
          tope_ips_uf: number | null
          trabajo_menos_pesado_empleador: number | null
          trabajo_menos_pesado_trabajador: number | null
          trabajo_pesado_empleador: number | null
          trabajo_pesado_trabajador: number | null
          uf: number | null
          uta: number | null
          utm: number | null
        }
        Insert: {
          afc_empleador_casa_particular?: number | null
          afc_empleador_indefinido?: number | null
          afc_empleador_indefinido_11_anos_mas?: number | null
          afc_empleador_plazo?: number | null
          afc_trabajador_indefinido?: number | null
          aporte_empleador_afp?: number | null
          descuentos_base_por_dia?: boolean | null
          estado_reconciliacion_oficial?: string
          fecha_actualizacion?: string | null
          fecha_reconciliacion_oficial?: string | null
          gratificacion?: boolean | null
          id_ccaf_entidad?: number | null
          id_organismo_administrador_ley_16744?: number | null
          imm_gratificacion?: number | null
          ingreso_minimo_no_remuneracional?: number | null
          observacion_reconciliacion?: string | null
          origen_reconciliacion?: string | null
          periodo: string
          salud_ccaf?: number | null
          salud_fonasa_con_ccaf?: number | null
          salud_obligatoria?: number | null
          sanna?: number | null
          seguro_social_expectativa_vida?: number | null
          sis?: number | null
          sueldo_minimo?: number | null
          sueldo_minimo_casa_particular?: number | null
          sueldo_minimo_menor18_mayor65?: number | null
          sueldo_minimo18_65?: number | null
          tope_afp?: number | null
          tope_afp_uf?: number | null
          tope_afpvoluntario?: number | null
          tope_apv_anual?: number | null
          tope_apv_anual_uf?: number | null
          tope_apv_mensual?: number | null
          tope_apv_mensual_uf?: number | null
          tope_cesantia?: number | null
          tope_cesantia_uf?: number | null
          tope_deposito_convenido_anual?: number | null
          tope_deposito_convenido_anual_uf?: number | null
          tope_ips?: number | null
          tope_ips_uf?: number | null
          trabajo_menos_pesado_empleador?: number | null
          trabajo_menos_pesado_trabajador?: number | null
          trabajo_pesado_empleador?: number | null
          trabajo_pesado_trabajador?: number | null
          uf?: number | null
          uta?: number | null
          utm?: number | null
        }
        Update: {
          afc_empleador_casa_particular?: number | null
          afc_empleador_indefinido?: number | null
          afc_empleador_indefinido_11_anos_mas?: number | null
          afc_empleador_plazo?: number | null
          afc_trabajador_indefinido?: number | null
          aporte_empleador_afp?: number | null
          descuentos_base_por_dia?: boolean | null
          estado_reconciliacion_oficial?: string
          fecha_actualizacion?: string | null
          fecha_reconciliacion_oficial?: string | null
          gratificacion?: boolean | null
          id_ccaf_entidad?: number | null
          id_organismo_administrador_ley_16744?: number | null
          imm_gratificacion?: number | null
          ingreso_minimo_no_remuneracional?: number | null
          observacion_reconciliacion?: string | null
          origen_reconciliacion?: string | null
          periodo?: string
          salud_ccaf?: number | null
          salud_fonasa_con_ccaf?: number | null
          salud_obligatoria?: number | null
          sanna?: number | null
          seguro_social_expectativa_vida?: number | null
          sis?: number | null
          sueldo_minimo?: number | null
          sueldo_minimo_casa_particular?: number | null
          sueldo_minimo_menor18_mayor65?: number | null
          sueldo_minimo18_65?: number | null
          tope_afp?: number | null
          tope_afp_uf?: number | null
          tope_afpvoluntario?: number | null
          tope_apv_anual?: number | null
          tope_apv_anual_uf?: number | null
          tope_apv_mensual?: number | null
          tope_apv_mensual_uf?: number | null
          tope_cesantia?: number | null
          tope_cesantia_uf?: number | null
          tope_deposito_convenido_anual?: number | null
          tope_deposito_convenido_anual_uf?: number | null
          tope_ips?: number | null
          tope_ips_uf?: number | null
          trabajo_menos_pesado_empleador?: number | null
          trabajo_menos_pesado_trabajador?: number | null
          trabajo_pesado_empleador?: number | null
          trabajo_pesado_trabajador?: number | null
          uf?: number | null
          uta?: number | null
          utm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "parametros_generales_cliente_id_ccaf_entidad_fkey"
            columns: ["id_ccaf_entidad"]
            isOneToOne: false
            referencedRelation: "ccaf_entidad"
            referencedColumns: ["id_ccaf_entidad"]
          },
          {
            foreignKeyName: "parametros_generales_cliente_id_organismo_administrador_le_fkey"
            columns: ["id_organismo_administrador_ley_16744"]
            isOneToOne: false
            referencedRelation: "organismo_administrador_ley_16744"
            referencedColumns: ["id_organismo_administrador_ley_16744"]
          },
        ]
      }
      parametros_legales: {
        Row: {
          id_parametro: number
          nombre: string
          periodo: string | null
          valor_decimal: number | null
          valor_entero: number | null
          vigencia_fin: string | null
          vigencia_inicio: string
        }
        Insert: {
          id_parametro?: number
          nombre: string
          periodo?: string | null
          valor_decimal?: number | null
          valor_entero?: number | null
          vigencia_fin?: string | null
          vigencia_inicio: string
        }
        Update: {
          id_parametro?: number
          nombre?: string
          periodo?: string | null
          valor_decimal?: number | null
          valor_entero?: number | null
          vigencia_fin?: string | null
          vigencia_inicio?: string
        }
        Relationships: []
      }
      periodo_remuneracion: {
        Row: {
          anio: number
          codigo: string
          estado: string
          fecha_creacion: string
          fecha_fin: string
          fecha_inicio: string
          id_periodo: number
          mes: number
        }
        Insert: {
          anio: number
          codigo: string
          estado?: string
          fecha_creacion?: string
          fecha_fin: string
          fecha_inicio: string
          id_periodo?: number
          mes: number
        }
        Update: {
          anio?: number
          codigo?: string
          estado?: string
          fecha_creacion?: string
          fecha_fin?: string
          fecha_inicio?: string
          id_periodo?: number
          mes?: number
        }
        Relationships: []
      }
      persona: {
        Row: {
          apellido_materno: string | null
          apellido_paterno: string
          apto_para_remuneraciones: boolean
          cargas: number | null
          casa: string | null
          departamento_direccion: string | null
          direccion: string | null
          dv: string
          email: string | null
          estado: Database["public"]["Enums"]["tipo_estado_persona_enum"]
          estado_civil:
            | Database["public"]["Enums"]["tipo_estado_civil_enum"]
            | null
          estado_ficha: Database["public"]["Enums"]["tipo_estado_ficha_enum"]
          fax: string | null
          fecha_activacion: string | null
          fecha_actualizacion: string
          fecha_creacion: string
          fecha_nacimiento: string
          id_comuna: number | null
          id_pais: number | null
          id_persona: number
          id_tramo_carga: number | null
          id_usuario_activacion: number | null
          nombres: string
          numero_direccion: string | null
          observaciones_direccion: string | null
          pasaporte: string | null
          paso_alta_avanzada: number | null
          poblacion: string | null
          rut: string
          sexo: string | null
          telefono: string | null
          tramo_carga_manual: boolean
          villa: string | null
        }
        Insert: {
          apellido_materno?: string | null
          apellido_paterno: string
          apto_para_remuneraciones?: boolean
          cargas?: number | null
          casa?: string | null
          departamento_direccion?: string | null
          direccion?: string | null
          dv: string
          email?: string | null
          estado?: Database["public"]["Enums"]["tipo_estado_persona_enum"]
          estado_civil?:
            | Database["public"]["Enums"]["tipo_estado_civil_enum"]
            | null
          estado_ficha?: Database["public"]["Enums"]["tipo_estado_ficha_enum"]
          fax?: string | null
          fecha_activacion?: string | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          fecha_nacimiento: string
          id_comuna?: number | null
          id_pais?: number | null
          id_persona?: number
          id_tramo_carga?: number | null
          id_usuario_activacion?: number | null
          nombres: string
          numero_direccion?: string | null
          observaciones_direccion?: string | null
          pasaporte?: string | null
          paso_alta_avanzada?: number | null
          poblacion?: string | null
          rut: string
          sexo?: string | null
          telefono?: string | null
          tramo_carga_manual?: boolean
          villa?: string | null
        }
        Update: {
          apellido_materno?: string | null
          apellido_paterno?: string
          apto_para_remuneraciones?: boolean
          cargas?: number | null
          casa?: string | null
          departamento_direccion?: string | null
          direccion?: string | null
          dv?: string
          email?: string | null
          estado?: Database["public"]["Enums"]["tipo_estado_persona_enum"]
          estado_civil?:
            | Database["public"]["Enums"]["tipo_estado_civil_enum"]
            | null
          estado_ficha?: Database["public"]["Enums"]["tipo_estado_ficha_enum"]
          fax?: string | null
          fecha_activacion?: string | null
          fecha_actualizacion?: string
          fecha_creacion?: string
          fecha_nacimiento?: string
          id_comuna?: number | null
          id_pais?: number | null
          id_persona?: number
          id_tramo_carga?: number | null
          id_usuario_activacion?: number | null
          nombres?: string
          numero_direccion?: string | null
          observaciones_direccion?: string | null
          pasaporte?: string | null
          paso_alta_avanzada?: number | null
          poblacion?: string | null
          rut?: string
          sexo?: string | null
          telefono?: string | null
          tramo_carga_manual?: boolean
          villa?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "persona_id_comuna_fkey"
            columns: ["id_comuna"]
            isOneToOne: false
            referencedRelation: "comuna"
            referencedColumns: ["id_comuna"]
          },
          {
            foreignKeyName: "persona_id_pais_fkey"
            columns: ["id_pais"]
            isOneToOne: false
            referencedRelation: "pais"
            referencedColumns: ["id_pais"]
          },
          {
            foreignKeyName: "persona_id_tramo_carga_fkey"
            columns: ["id_tramo_carga"]
            isOneToOne: false
            referencedRelation: "tramo_carga"
            referencedColumns: ["id_tramo"]
          },
        ]
      }
      persona_condicion_trabajador: {
        Row: {
          activa: boolean
          created_at: string
          id_contrato: number | null
          id_persona: number
          id_persona_condicion_trabajador: number
          id_tipo_condicion_trabajador: number
          observacion: string | null
          respaldo_registrado: boolean
          updated_at: string | null
          vigencia_fin: string | null
          vigencia_inicio: string
        }
        Insert: {
          activa?: boolean
          created_at?: string
          id_contrato?: number | null
          id_persona: number
          id_persona_condicion_trabajador?: number
          id_tipo_condicion_trabajador: number
          observacion?: string | null
          respaldo_registrado?: boolean
          updated_at?: string | null
          vigencia_fin?: string | null
          vigencia_inicio?: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          id_contrato?: number | null
          id_persona?: number
          id_persona_condicion_trabajador?: number
          id_tipo_condicion_trabajador?: number
          observacion?: string | null
          respaldo_registrado?: boolean
          updated_at?: string | null
          vigencia_fin?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "persona_condicion_trabajador_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "contrato"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "persona_condicion_trabajador_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "persona_condicion_trabajador_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "persona"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "persona_condicion_trabajador_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "persona_condicion_trabajador_id_tipo_condicion_trabajador_fkey"
            columns: ["id_tipo_condicion_trabajador"]
            isOneToOne: false
            referencedRelation: "tipo_condicion_trabajador"
            referencedColumns: ["id_tipo_condicion_trabajador"]
          },
        ]
      }
      persona_tramo_carga: {
        Row: {
          id_persona: number
          id_persona_tramo_carga: number
          id_tramo: number
          observacion: string | null
          vigencia_fin: string | null
          vigencia_inicio: string
        }
        Insert: {
          id_persona: number
          id_persona_tramo_carga?: number
          id_tramo: number
          observacion?: string | null
          vigencia_fin?: string | null
          vigencia_inicio: string
        }
        Update: {
          id_persona?: number
          id_persona_tramo_carga?: number
          id_tramo?: number
          observacion?: string | null
          vigencia_fin?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "persona_tramo_carga_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "persona"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "persona_tramo_carga_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "persona_tramo_carga_id_tramo_fkey"
            columns: ["id_tramo"]
            isOneToOne: false
            referencedRelation: "tramo_carga"
            referencedColumns: ["id_tramo"]
          },
        ]
      }
      prestamo: {
        Row: {
          caja: string | null
          cuotas_pagadas: number | null
          cuotas_total: number | null
          descripcion: string | null
          estado: string | null
          fecha_otorgamiento: string | null
          id_persona: number
          id_prestamo: number
          monto_total: number | null
          saldo_pendiente: number | null
          valor_cuota: number | null
        }
        Insert: {
          caja?: string | null
          cuotas_pagadas?: number | null
          cuotas_total?: number | null
          descripcion?: string | null
          estado?: string | null
          fecha_otorgamiento?: string | null
          id_persona: number
          id_prestamo?: number
          monto_total?: number | null
          saldo_pendiente?: number | null
          valor_cuota?: number | null
        }
        Update: {
          caja?: string | null
          cuotas_pagadas?: number | null
          cuotas_total?: number | null
          descripcion?: string | null
          estado?: string | null
          fecha_otorgamiento?: string | null
          id_persona?: number
          id_prestamo?: number
          monto_total?: number | null
          saldo_pendiente?: number | null
          valor_cuota?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prestamo_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "persona"
            referencedColumns: ["id_persona"]
          },
          {
            foreignKeyName: "prestamo_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_persona"]
          },
        ]
      }
      prevision: {
        Row: {
          id_afp: number | null
          id_contrato: number
          id_entidad_previsional_ips: number | null
          id_ex_caja_previsional: number | null
          id_prevision: number
          id_regimen_ex_caja: number | null
          id_regimen_previsional: number | null
          monto_ips: number | null
          nombre_entidad_ips: string | null
          nombre_ex_caja: string | null
          observacion_prevision: string | null
          regimen_ex_caja: string | null
          tasa_ex_caja: number | null
          tipo_prevision: Database["public"]["Enums"]["tipo_prevision_enum"]
          vigencia_fin: string | null
          vigencia_inicio: string
        }
        Insert: {
          id_afp?: number | null
          id_contrato: number
          id_entidad_previsional_ips?: number | null
          id_ex_caja_previsional?: number | null
          id_prevision?: number
          id_regimen_ex_caja?: number | null
          id_regimen_previsional?: number | null
          monto_ips?: number | null
          nombre_entidad_ips?: string | null
          nombre_ex_caja?: string | null
          observacion_prevision?: string | null
          regimen_ex_caja?: string | null
          tasa_ex_caja?: number | null
          tipo_prevision: Database["public"]["Enums"]["tipo_prevision_enum"]
          vigencia_fin?: string | null
          vigencia_inicio: string
        }
        Update: {
          id_afp?: number | null
          id_contrato?: number
          id_entidad_previsional_ips?: number | null
          id_ex_caja_previsional?: number | null
          id_prevision?: number
          id_regimen_ex_caja?: number | null
          id_regimen_previsional?: number | null
          monto_ips?: number | null
          nombre_entidad_ips?: string | null
          nombre_ex_caja?: string | null
          observacion_prevision?: string | null
          regimen_ex_caja?: string | null
          tasa_ex_caja?: number | null
          tipo_prevision?: Database["public"]["Enums"]["tipo_prevision_enum"]
          vigencia_fin?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "prevision_id_afp_fkey"
            columns: ["id_afp"]
            isOneToOne: false
            referencedRelation: "afp"
            referencedColumns: ["id_afp"]
          },
          {
            foreignKeyName: "prevision_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "contrato"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "prevision_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "prevision_id_entidad_previsional_ips_fkey"
            columns: ["id_entidad_previsional_ips"]
            isOneToOne: false
            referencedRelation: "entidad_previsional_ips"
            referencedColumns: ["id_entidad_previsional_ips"]
          },
          {
            foreignKeyName: "prevision_id_ex_caja_previsional_fkey"
            columns: ["id_ex_caja_previsional"]
            isOneToOne: false
            referencedRelation: "ex_caja_previsional"
            referencedColumns: ["id_ex_caja_previsional"]
          },
          {
            foreignKeyName: "prevision_id_regimen_ex_caja_fkey"
            columns: ["id_regimen_ex_caja"]
            isOneToOne: false
            referencedRelation: "regimen_ex_caja"
            referencedColumns: ["id_regimen_ex_caja"]
          },
          {
            foreignKeyName: "prevision_id_regimen_previsional_fkey"
            columns: ["id_regimen_previsional"]
            isOneToOne: false
            referencedRelation: "regimen_previsional"
            referencedColumns: ["id_regimen"]
          },
        ]
      }
      provincia: {
        Row: {
          activo: boolean
          fecha_creacion: string
          id_provincia: number
          id_region: number
          nombre: string
        }
        Insert: {
          activo?: boolean
          fecha_creacion?: string
          id_provincia: number
          id_region: number
          nombre: string
        }
        Update: {
          activo?: boolean
          fecha_creacion?: string
          id_provincia?: number
          id_region?: number
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "provincia_id_region_fkey"
            columns: ["id_region"]
            isOneToOne: false
            referencedRelation: "region"
            referencedColumns: ["id_region"]
          },
          {
            foreignKeyName: "provincia_id_region_fkey"
            columns: ["id_region"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_region"]
          },
        ]
      }
      reforma_previsional_parametro: {
        Row: {
          aporte_empleador_total: number
          codigo: string | null
          cotizacion_rentabilidad_protegida: number
          cuenta_capitalizacion_individual: number
          fapp_seguro_social: number
          fuente: string | null
          id_reforma_previsional_parametro: number
          ley_referencia: string | null
          observacion: string | null
          periodo: string | null
          seguro_social_sis_cev: number
          vigencia_fin: string | null
          vigencia_inicio: string
        }
        Insert: {
          aporte_empleador_total: number
          codigo?: string | null
          cotizacion_rentabilidad_protegida?: number
          cuenta_capitalizacion_individual: number
          fapp_seguro_social: number
          fuente?: string | null
          id_reforma_previsional_parametro?: number
          ley_referencia?: string | null
          observacion?: string | null
          periodo?: string | null
          seguro_social_sis_cev?: number
          vigencia_fin?: string | null
          vigencia_inicio: string
        }
        Update: {
          aporte_empleador_total?: number
          codigo?: string | null
          cotizacion_rentabilidad_protegida?: number
          cuenta_capitalizacion_individual?: number
          fapp_seguro_social?: number
          fuente?: string | null
          id_reforma_previsional_parametro?: number
          ley_referencia?: string | null
          observacion?: string | null
          periodo?: string | null
          seguro_social_sis_cev?: number
          vigencia_fin?: string | null
          vigencia_inicio?: string
        }
        Relationships: []
      }
      regimen_ex_caja: {
        Row: {
          codigo_base: string | null
          codigo_previred: string | null
          codigo_subcaja: string | null
          glosa_previred: string | null
          id_ex_caja_previsional: number
          id_regimen_ex_caja: number
          nombre: string
          tasa_cotizacion_referencia: number | null
          vigente: boolean
        }
        Insert: {
          codigo_base?: string | null
          codigo_previred?: string | null
          codigo_subcaja?: string | null
          glosa_previred?: string | null
          id_ex_caja_previsional: number
          id_regimen_ex_caja?: number
          nombre: string
          tasa_cotizacion_referencia?: number | null
          vigente?: boolean
        }
        Update: {
          codigo_base?: string | null
          codigo_previred?: string | null
          codigo_subcaja?: string | null
          glosa_previred?: string | null
          id_ex_caja_previsional?: number
          id_regimen_ex_caja?: number
          nombre?: string
          tasa_cotizacion_referencia?: number | null
          vigente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "regimen_ex_caja_id_ex_caja_previsional_fkey"
            columns: ["id_ex_caja_previsional"]
            isOneToOne: false
            referencedRelation: "ex_caja_previsional"
            referencedColumns: ["id_ex_caja_previsional"]
          },
        ]
      }
      regimen_previsional: {
        Row: {
          id_regimen: number
          nombre: string
        }
        Insert: {
          id_regimen?: number
          nombre: string
        }
        Update: {
          id_regimen?: number
          nombre?: string
        }
        Relationships: []
      }
      region: {
        Row: {
          activo: boolean
          fecha_creacion: string
          id_region: number
          nombre: string
          ordinal: string
        }
        Insert: {
          activo?: boolean
          fecha_creacion?: string
          id_region: number
          nombre: string
          ordinal: string
        }
        Update: {
          activo?: boolean
          fecha_creacion?: string
          id_region?: number
          nombre?: string
          ordinal?: string
        }
        Relationships: []
      }
      regla_concepto_calculo: {
        Row: {
          activo: boolean
          base_calculo: string | null
          calculo_automatico: boolean
          codigo_regla: string
          formula_sql: string | null
          id_concepto: number
          id_regla_concepto_calculo: number
          orden_calculo: number
          usa_tabla_impuesto: boolean
          usa_tope_imponible: boolean
          vigencia_fin: string | null
          vigencia_inicio: string
        }
        Insert: {
          activo?: boolean
          base_calculo?: string | null
          calculo_automatico?: boolean
          codigo_regla: string
          formula_sql?: string | null
          id_concepto: number
          id_regla_concepto_calculo?: number
          orden_calculo?: number
          usa_tabla_impuesto?: boolean
          usa_tope_imponible?: boolean
          vigencia_fin?: string | null
          vigencia_inicio?: string
        }
        Update: {
          activo?: boolean
          base_calculo?: string | null
          calculo_automatico?: boolean
          codigo_regla?: string
          formula_sql?: string | null
          id_concepto?: number
          id_regla_concepto_calculo?: number
          orden_calculo?: number
          usa_tabla_impuesto?: boolean
          usa_tope_imponible?: boolean
          vigencia_fin?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "regla_concepto_calculo_id_concepto_fkey"
            columns: ["id_concepto"]
            isOneToOne: false
            referencedRelation: "concepto"
            referencedColumns: ["id_concepto"]
          },
        ]
      }
      remuneracion: {
        Row: {
          dias_semanales: number
          distribucion_jornada: string | null
          gratificacion_proporcional: boolean
          horas_semanales: number
          id_contrato: number
          id_moneda: number | null
          id_remuneracion: number
          semana_corrida_activa: boolean
          sueldo_base: number
          sueldo_variable: boolean
          tiempo_colacion_minutos: number | null
          tipo_gratificacion: Database["public"]["Enums"]["tipo_gratificacion_enum"]
          vigencia_fin: string | null
          vigencia_inicio: string
          zona_extrema_activa: boolean
        }
        Insert: {
          dias_semanales?: number
          distribucion_jornada?: string | null
          gratificacion_proporcional?: boolean
          horas_semanales?: number
          id_contrato: number
          id_moneda?: number | null
          id_remuneracion?: number
          semana_corrida_activa?: boolean
          sueldo_base: number
          sueldo_variable?: boolean
          tiempo_colacion_minutos?: number | null
          tipo_gratificacion?: Database["public"]["Enums"]["tipo_gratificacion_enum"]
          vigencia_fin?: string | null
          vigencia_inicio: string
          zona_extrema_activa?: boolean
        }
        Update: {
          dias_semanales?: number
          distribucion_jornada?: string | null
          gratificacion_proporcional?: boolean
          horas_semanales?: number
          id_contrato?: number
          id_moneda?: number | null
          id_remuneracion?: number
          semana_corrida_activa?: boolean
          sueldo_base?: number
          sueldo_variable?: boolean
          tiempo_colacion_minutos?: number | null
          tipo_gratificacion?: Database["public"]["Enums"]["tipo_gratificacion_enum"]
          vigencia_fin?: string | null
          vigencia_inicio?: string
          zona_extrema_activa?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "remuneracion_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "contrato"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "remuneracion_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "remuneracion_id_moneda_fkey"
            columns: ["id_moneda"]
            isOneToOne: false
            referencedRelation: "moneda"
            referencedColumns: ["id_moneda"]
          },
        ]
      }
      salud: {
        Row: {
          codigo: string | null
          id_salud: number
          nombre: string
          periodo: string | null
          porcentaje_cotizacion: number | null
          tipo: Database["public"]["Enums"]["tipo_salud_enum"] | null
          vigencia_fin: string | null
          vigencia_inicio: string | null
          vigente: boolean | null
        }
        Insert: {
          codigo?: string | null
          id_salud?: number
          nombre: string
          periodo?: string | null
          porcentaje_cotizacion?: number | null
          tipo?: Database["public"]["Enums"]["tipo_salud_enum"] | null
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
          vigente?: boolean | null
        }
        Update: {
          codigo?: string | null
          id_salud?: number
          nombre?: string
          periodo?: string | null
          porcentaje_cotizacion?: number | null
          tipo?: Database["public"]["Enums"]["tipo_salud_enum"] | null
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
          vigente?: boolean | null
        }
        Relationships: []
      }
      salud_plan: {
        Row: {
          adicional_ges_referencia: number
          codigo: string | null
          id_moneda: number | null
          id_salud: number
          id_salud_plan: number
          nombre: string
          porcentaje_legal: number | null
          valor_referencia: number
          vigencia_fin: string | null
          vigencia_inicio: string
          vigente: boolean
        }
        Insert: {
          adicional_ges_referencia?: number
          codigo?: string | null
          id_moneda?: number | null
          id_salud: number
          id_salud_plan?: number
          nombre: string
          porcentaje_legal?: number | null
          valor_referencia?: number
          vigencia_fin?: string | null
          vigencia_inicio: string
          vigente?: boolean
        }
        Update: {
          adicional_ges_referencia?: number
          codigo?: string | null
          id_moneda?: number | null
          id_salud?: number
          id_salud_plan?: number
          nombre?: string
          porcentaje_legal?: number | null
          valor_referencia?: number
          vigencia_fin?: string | null
          vigencia_inicio?: string
          vigente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "salud_plan_id_salud_fkey"
            columns: ["id_salud"]
            isOneToOne: false
            referencedRelation: "salud"
            referencedColumns: ["id_salud"]
          },
        ]
      }
      salud_trabajador: {
        Row: {
          adicional_auge_ges: number
          codigo_plan_externo: string | null
          id_contrato: number
          id_moneda_plan: number | null
          id_salud: number
          id_salud_plan: number | null
          id_salud_trabajador: number
          observaciones_salud: string | null
          plan_salud: string | null
          usar_plan_parametrizado: boolean
          valor_plan: number
          vigencia_fin: string | null
          vigencia_inicio: string
        }
        Insert: {
          adicional_auge_ges?: number
          codigo_plan_externo?: string | null
          id_contrato: number
          id_moneda_plan?: number | null
          id_salud: number
          id_salud_plan?: number | null
          id_salud_trabajador?: number
          observaciones_salud?: string | null
          plan_salud?: string | null
          usar_plan_parametrizado?: boolean
          valor_plan?: number
          vigencia_fin?: string | null
          vigencia_inicio: string
        }
        Update: {
          adicional_auge_ges?: number
          codigo_plan_externo?: string | null
          id_contrato?: number
          id_moneda_plan?: number | null
          id_salud?: number
          id_salud_plan?: number | null
          id_salud_trabajador?: number
          observaciones_salud?: string | null
          plan_salud?: string | null
          usar_plan_parametrizado?: boolean
          valor_plan?: number
          vigencia_fin?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "salud_trabajador_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "contrato"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "salud_trabajador_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "salud_trabajador_id_moneda_plan_fkey"
            columns: ["id_moneda_plan"]
            isOneToOne: false
            referencedRelation: "moneda"
            referencedColumns: ["id_moneda"]
          },
          {
            foreignKeyName: "salud_trabajador_id_salud_fkey"
            columns: ["id_salud"]
            isOneToOne: false
            referencedRelation: "salud"
            referencedColumns: ["id_salud"]
          },
          {
            foreignKeyName: "salud_trabajador_id_salud_plan_fkey"
            columns: ["id_salud_plan"]
            isOneToOne: false
            referencedRelation: "salud_plan"
            referencedColumns: ["id_salud_plan"]
          },
        ]
      }
      semana_corrida: {
        Row: {
          activa: boolean
          dias_laborables: number[]
          id_contrato: number
          id_semana_corrida: number
          vigencia_fin: string | null
          vigencia_inicio: string
        }
        Insert: {
          activa?: boolean
          dias_laborables: number[]
          id_contrato: number
          id_semana_corrida?: number
          vigencia_fin?: string | null
          vigencia_inicio: string
        }
        Update: {
          activa?: boolean
          dias_laborables?: number[]
          id_contrato?: number
          id_semana_corrida?: number
          vigencia_fin?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "semana_corrida_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "contrato"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "semana_corrida_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_contrato"]
          },
        ]
      }
      sucursal: {
        Row: {
          codigo: string
          direccion: string | null
          id_empresa: number
          id_sucursal: number
          nombre: string
        }
        Insert: {
          codigo: string
          direccion?: string | null
          id_empresa: number
          id_sucursal?: number
          nombre: string
        }
        Update: {
          codigo?: string
          direccion?: string | null
          id_empresa?: number
          id_sucursal?: number
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "sucursal_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresa"
            referencedColumns: ["id_empresa"]
          },
        ]
      }
      tabla_impuesto_unico: {
        Row: {
          desde: number
          factor: number
          hasta: number | null
          id: number
          periodo: string | null
          rebaja: number
          tramo: number
          vigencia_fin: string | null
          vigencia_inicio: string
        }
        Insert: {
          desde: number
          factor: number
          hasta?: number | null
          id?: number
          periodo?: string | null
          rebaja: number
          tramo: number
          vigencia_fin?: string | null
          vigencia_inicio: string
        }
        Update: {
          desde?: number
          factor?: number
          hasta?: number | null
          id?: number
          periodo?: string | null
          rebaja?: number
          tramo?: number
          vigencia_fin?: string | null
          vigencia_inicio?: string
        }
        Relationships: []
      }
      tipo_condicion_trabajador: {
        Row: {
          afecta_afc: boolean
          afecta_prevision: boolean
          afecta_salud: boolean
          codigo: string
          created_at: string
          descripcion: string | null
          grupo: string
          id_tipo_condicion_trabajador: number
          nombre: string
          orden: number
          requiere_respaldo: boolean
          updated_at: string | null
          vigente: boolean
        }
        Insert: {
          afecta_afc?: boolean
          afecta_prevision?: boolean
          afecta_salud?: boolean
          codigo: string
          created_at?: string
          descripcion?: string | null
          grupo?: string
          id_tipo_condicion_trabajador?: number
          nombre: string
          orden?: number
          requiere_respaldo?: boolean
          updated_at?: string | null
          vigente?: boolean
        }
        Update: {
          afecta_afc?: boolean
          afecta_prevision?: boolean
          afecta_salud?: boolean
          codigo?: string
          created_at?: string
          descripcion?: string | null
          grupo?: string
          id_tipo_condicion_trabajador?: number
          nombre?: string
          orden?: number
          requiere_respaldo?: boolean
          updated_at?: string | null
          vigente?: boolean
        }
        Relationships: []
      }
      tipo_cuenta_bancaria: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string
          id_tipo_cuenta_bancaria: number
          nombre: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string
          id_tipo_cuenta_bancaria?: number
          nombre: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string
          id_tipo_cuenta_bancaria?: number
          nombre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tipo_jornada: {
        Row: {
          id_tipo_jornada: number
          nombre: string
        }
        Insert: {
          id_tipo_jornada?: number
          nombre: string
        }
        Update: {
          id_tipo_jornada?: number
          nombre?: string
        }
        Relationships: []
      }
      tipo_movimiento: {
        Row: {
          activo: boolean
          afecta_dias_trabajados: boolean
          afecta_horas: boolean
          codigo: string
          id_tipo_movimiento: number
          nombre: string
        }
        Insert: {
          activo?: boolean
          afecta_dias_trabajados?: boolean
          afecta_horas?: boolean
          codigo: string
          id_tipo_movimiento: number
          nombre: string
        }
        Update: {
          activo?: boolean
          afecta_dias_trabajados?: boolean
          afecta_horas?: boolean
          codigo?: string
          id_tipo_movimiento?: number
          nombre?: string
        }
        Relationships: []
      }
      tipo_trabajador: {
        Row: {
          id_tipo_trabajador: number
          nombre: string
        }
        Insert: {
          id_tipo_trabajador?: number
          nombre: string
        }
        Update: {
          id_tipo_trabajador?: number
          nombre?: string
        }
        Relationships: []
      }
      trabajo_pesado_parametro: {
        Row: {
          codigo: string
          fuente: string | null
          id_trabajo_pesado_parametro: number
          nombre: string
          periodo: string
          requiere_dictamen_cen: boolean
          tasa_empleador: number
          tasa_total: number
          tasa_trabajador: number
          vigencia_fin: string | null
          vigencia_inicio: string
          vigente: boolean
        }
        Insert: {
          codigo: string
          fuente?: string | null
          id_trabajo_pesado_parametro?: number
          nombre: string
          periodo: string
          requiere_dictamen_cen?: boolean
          tasa_empleador: number
          tasa_total: number
          tasa_trabajador: number
          vigencia_fin?: string | null
          vigencia_inicio?: string
          vigente?: boolean
        }
        Update: {
          codigo?: string
          fuente?: string | null
          id_trabajo_pesado_parametro?: number
          nombre?: string
          periodo?: string
          requiere_dictamen_cen?: boolean
          tasa_empleador?: number
          tasa_total?: number
          tasa_trabajador?: number
          vigencia_fin?: string | null
          vigencia_inicio?: string
          vigente?: boolean
        }
        Relationships: []
      }
      tramo_carga: {
        Row: {
          desde: number | null
          hasta: number | null
          id_tramo: number
          periodo: string
          tramo: string | null
          valor: number | null
        }
        Insert: {
          desde?: number | null
          hasta?: number | null
          id_tramo?: number
          periodo: string
          tramo?: string | null
          valor?: number | null
        }
        Update: {
          desde?: number | null
          hasta?: number | null
          id_tramo?: number
          periodo?: string
          tramo?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      tramo_impuesto: {
        Row: {
          desde: number | null
          factor: number | null
          hasta: number | null
          id_tramo: number
          periodo: string
          rebaja: number | null
        }
        Insert: {
          desde?: number | null
          factor?: number | null
          hasta?: number | null
          id_tramo?: number
          periodo: string
          rebaja?: number | null
        }
        Update: {
          desde?: number | null
          factor?: number | null
          hasta?: number | null
          id_tramo?: number
          periodo?: string
          rebaja?: number | null
        }
        Relationships: []
      }
      vacacion_movimiento: {
        Row: {
          dias: number
          fecha: string
          id_contrato: number
          id_vacacion_movimiento: number
          observacion: string | null
          tipo: Database["public"]["Enums"]["tipo_mov_vacaciones_enum"]
        }
        Insert: {
          dias: number
          fecha: string
          id_contrato: number
          id_vacacion_movimiento?: number
          observacion?: string | null
          tipo: Database["public"]["Enums"]["tipo_mov_vacaciones_enum"]
        }
        Update: {
          dias?: number
          fecha?: string
          id_contrato?: number
          id_vacacion_movimiento?: number
          observacion?: string | null
          tipo?: Database["public"]["Enums"]["tipo_mov_vacaciones_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "vacacion_movimiento_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "contrato"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "vacacion_movimiento_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_contrato"]
          },
        ]
      }
      vacacion_saldo: {
        Row: {
          fecha_actualizacion: string
          id_contrato: number
          id_vacacion_saldo: number
          saldo_dias: number
        }
        Insert: {
          fecha_actualizacion?: string
          id_contrato: number
          id_vacacion_saldo?: number
          saldo_dias?: number
        }
        Update: {
          fecha_actualizacion?: string
          id_contrato?: number
          id_vacacion_saldo?: number
          saldo_dias?: number
        }
        Relationships: [
          {
            foreignKeyName: "vacacion_saldo_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: true
            referencedRelation: "contrato"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "vacacion_saldo_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: true
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_contrato"]
          },
        ]
      }
      valores_flexibles: {
        Row: {
          activo: boolean | null
          codigo: string
          descripcion: string
          id: number
          orden: number | null
          tipo: string | null
          valor: string | null
        }
        Insert: {
          activo?: boolean | null
          codigo: string
          descripcion: string
          id?: number
          orden?: number | null
          tipo?: string | null
          valor?: string | null
        }
        Update: {
          activo?: boolean | null
          codigo?: string
          descripcion?: string
          id?: number
          orden?: number | null
          tipo?: string | null
          valor?: string | null
        }
        Relationships: []
      }
      zona_extrema: {
        Row: {
          id_contrato: number
          id_zona_extrema: number
          id_zona_extrema_catalogo: number | null
          porcentaje: number
          territorio: string | null
          vigencia_fin: string | null
          vigencia_inicio: string
        }
        Insert: {
          id_contrato: number
          id_zona_extrema?: number
          id_zona_extrema_catalogo?: number | null
          porcentaje: number
          territorio?: string | null
          vigencia_fin?: string | null
          vigencia_inicio: string
        }
        Update: {
          id_contrato?: number
          id_zona_extrema?: number
          id_zona_extrema_catalogo?: number | null
          porcentaje?: number
          territorio?: string | null
          vigencia_fin?: string | null
          vigencia_inicio?: string
        }
        Relationships: [
          {
            foreignKeyName: "zona_extrema_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "contrato"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "zona_extrema_id_contrato_fkey"
            columns: ["id_contrato"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_contrato"]
          },
          {
            foreignKeyName: "zona_extrema_id_zona_extrema_catalogo_fkey"
            columns: ["id_zona_extrema_catalogo"]
            isOneToOne: false
            referencedRelation: "zona_extrema_catalogo"
            referencedColumns: ["id_zona_extrema_catalogo"]
          },
        ]
      }
      zona_extrema_catalogo: {
        Row: {
          codigo: string | null
          id_comuna: number | null
          id_provincia: number | null
          id_region: number | null
          id_zona_extrema_catalogo: number
          nombre: string
          porcentaje: number
          vigencia_fin: string | null
          vigencia_inicio: string
          vigente: boolean
        }
        Insert: {
          codigo?: string | null
          id_comuna?: number | null
          id_provincia?: number | null
          id_region?: number | null
          id_zona_extrema_catalogo?: number
          nombre: string
          porcentaje: number
          vigencia_fin?: string | null
          vigencia_inicio: string
          vigente?: boolean
        }
        Update: {
          codigo?: string | null
          id_comuna?: number | null
          id_provincia?: number | null
          id_region?: number | null
          id_zona_extrema_catalogo?: number
          nombre?: string
          porcentaje?: number
          vigencia_fin?: string | null
          vigencia_inicio?: string
          vigente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "zona_extrema_catalogo_id_comuna_fkey"
            columns: ["id_comuna"]
            isOneToOne: false
            referencedRelation: "comuna"
            referencedColumns: ["id_comuna"]
          },
          {
            foreignKeyName: "zona_extrema_catalogo_id_provincia_fkey"
            columns: ["id_provincia"]
            isOneToOne: false
            referencedRelation: "provincia"
            referencedColumns: ["id_provincia"]
          },
          {
            foreignKeyName: "zona_extrema_catalogo_id_provincia_fkey"
            columns: ["id_provincia"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_provincia"]
          },
          {
            foreignKeyName: "zona_extrema_catalogo_id_region_fkey"
            columns: ["id_region"]
            isOneToOne: false
            referencedRelation: "region"
            referencedColumns: ["id_region"]
          },
          {
            foreignKeyName: "zona_extrema_catalogo_id_region_fkey"
            columns: ["id_region"]
            isOneToOne: false
            referencedRelation: "vw_persona_factores"
            referencedColumns: ["id_region"]
          },
        ]
      }
    }
    Views: {
      vw_persona_factores: {
        Row: {
          afp_nombre: string | null
          apellido_materno: string | null
          apellido_paterno: string | null
          apto_para_remuneraciones: boolean | null
          base: number | null
          cargas: number | null
          cargo: string | null
          codigo_tipo_contrato:
            | Database["public"]["Enums"]["tipo_contrato_enum"]
            | null
          comision: number | null
          comuna: string | null
          dias_semanales: number | null
          direccion: string | null
          dv: string | null
          email: string | null
          estado: Database["public"]["Enums"]["tipo_estado_persona_enum"] | null
          estado_contrato: string | null
          estado_ficha:
            | Database["public"]["Enums"]["tipo_estado_ficha_enum"]
            | null
          fecha_nacimiento: string | null
          fingreso: string | null
          fretiro: string | null
          gratificacion_tipo:
            | Database["public"]["Enums"]["tipo_gratificacion_enum"]
            | null
          horas_semanales: number | null
          id_afp: number | null
          id_comuna: number | null
          id_contrato: number | null
          id_empresa: number | null
          id_pais: number | null
          id_persona: number | null
          id_provincia: number | null
          id_regimen_previsional: number | null
          id_region: number | null
          id_salud: number | null
          monto_dia: number | null
          nombres: string | null
          pais: string | null
          porcentaje_cotizacion: number | null
          provincia: string | null
          regimen_previsional_nombre: string | null
          region: string | null
          rut: string | null
          salud_nombre_full: string | null
          salud_tipo: Database["public"]["Enums"]["tipo_salud_enum"] | null
          seguro_cesantia: boolean | null
          semana_corrida_activa: boolean | null
          sexo: string | null
          sis: number | null
          tasa_empleador: number | null
          tasa_obligatoria: number | null
          telefono: string | null
          tipo_jornada_nombre: string | null
          tipo_prevision:
            | Database["public"]["Enums"]["tipo_prevision_enum"]
            | null
          tipo_trabajador_nombre: string | null
          valor_plan: number | null
          zona_extrema_activa: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "contrato_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresa"
            referencedColumns: ["id_empresa"]
          },
          {
            foreignKeyName: "persona_id_comuna_fkey"
            columns: ["id_comuna"]
            isOneToOne: false
            referencedRelation: "comuna"
            referencedColumns: ["id_comuna"]
          },
          {
            foreignKeyName: "persona_id_pais_fkey"
            columns: ["id_pais"]
            isOneToOne: false
            referencedRelation: "pais"
            referencedColumns: ["id_pais"]
          },
          {
            foreignKeyName: "prevision_id_afp_fkey"
            columns: ["id_afp"]
            isOneToOne: false
            referencedRelation: "afp"
            referencedColumns: ["id_afp"]
          },
          {
            foreignKeyName: "prevision_id_regimen_previsional_fkey"
            columns: ["id_regimen_previsional"]
            isOneToOne: false
            referencedRelation: "regimen_previsional"
            referencedColumns: ["id_regimen"]
          },
          {
            foreignKeyName: "salud_trabajador_id_salud_fkey"
            columns: ["id_salud"]
            isOneToOne: false
            referencedRelation: "salud"
            referencedColumns: ["id_salud"]
          },
        ]
      }
    }
    Functions: {
      cerrar_nomina_operativa: {
        Args: {
          p_id_calculo_periodo: number
          p_metadata?: Json
          p_observacion?: string
          p_periodo: string
        }
        Returns: {
          activo: boolean
          aprobacion_operativa_advertencias: Json
          aprobacion_operativa_estado: string | null
          aprobacion_operativa_fecha: string | null
          aprobacion_operativa_metadata: Json
          aprobacion_operativa_usuario_id: string | null
          aprobacion_operativa_usuario_label: string | null
          cierre_operativo_estado: string | null
          cierre_operativo_fecha: string | null
          cierre_operativo_metadata: Json
          cierre_operativo_observacion: string | null
          cierre_operativo_usuario_id: string | null
          cierre_operativo_usuario_label: string | null
          created_at: string
          estado: string
          fecha_generacion: string
          hash_snapshot: string | null
          id_calculo_periodo: number
          id_empresa: number | null
          observacion_anulacion: string | null
          origen: string
          periodo: string
          reemplazado_por: number | null
          total_advertencias: number
          total_bloqueados: number
          total_descuentos: number
          total_haberes: number
          total_liquido: number
          total_trabajadores: number
          updated_at: string
          usuario_generador: string | null
          version_motor: string
        }
        SetofOptions: {
          from: "*"
          to: "nomina_calculo_periodo"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cerrar_nomina_periodo_diagnostico: {
        Args: { p_motivo?: string; p_periodo: string }
        Returns: {
          activo: boolean
          cerrado_en: string | null
          cerrado_motivo: string | null
          created_at: string
          estado: string
          fingerprint: string | null
          id_diagnostico: number
          payload: Json
          periodo: string
          updated_at: string
          verificado_en: string
          verificado_por: string
        }
        SetofOptions: {
          from: "*"
          to: "nomina_periodo_diagnostico"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      dblink_dteconfiguracion: { Args: never; Returns: string }
      empleado_historial_changed_fields: {
        Args: { p_new: Json; p_old: Json }
        Returns: string[]
      }
      empleado_historial_tabla_pk: {
        Args: { p_row: Json; p_tabla: string }
        Returns: number
      }
      empleado_historial_tabla_seccion: {
        Args: { p_tabla: string }
        Returns: string
      }
      fn_calcular_dias_trabajados: {
        Args: {
          p_fecha_ingreso: string
          p_fecha_retiro: string
          p_id_contrato: number
          p_periodo: string
        }
        Returns: number
      }
      fn_calcular_impuesto_unico: {
        Args: { p_base: number; p_fecha: string }
        Returns: number
      }
      fn_formato_decimales: {
        Args: { p_decimales?: number; p_valor: number }
        Returns: string
      }
      fn_generar_liquidacion: {
        Args: {
          p_id_contrato: number
          p_id_usuario: number
          p_periodo: string
          p_preview?: boolean
        }
        Returns: {
          estado: string
          id_liquidacion: number
          mensaje: string
          total_liquido: number
        }[]
      }
      fn_obtener_afc_parametro: {
        Args: {
          p_codigo_tipo_contrato: Database["public"]["Enums"]["tipo_contrato_enum"]
          p_fecha: string
        }
        Returns: {
          aplica_seguro: boolean
          aplica_trabajador: boolean
          tasa_empleador: number
          tasa_trabajador: number
        }[]
      }
      fn_obtener_afp: {
        Args: { p_fecha: string; p_id_contrato: number }
        Returns: {
          comision: number
          id_afp: number
          nombre: string
          sis: number
          tasa_empleador: number
          tasa_trabajador: number
        }[]
      }
      fn_obtener_parametro: {
        Args: { p_fecha: string; p_nombre: string }
        Returns: number
      }
      fn_obtener_perfil_laboral_persona: {
        Args: { p_id_persona: number; p_periodo: string }
        Returns: {
          aplica_imm_general: boolean
          aplica_imm_menor18_mayor65: boolean
          autorizacion_menor_registrada: boolean
          edad_periodo: number
          es_adulto_18_65: boolean
          es_mayor_65: boolean
          es_menor_18: boolean
          es_pensionado: boolean
          es_pensionado_invalidez_parcial: boolean
          es_pensionado_invalidez_total: boolean
          exento_cotizacion_pension: boolean
          id_persona: number
          periodo: string
          requiere_revision_rrhh: boolean
          trabajador_adolescente_protegido: boolean
          tramo_edad_laboral: string
        }[]
      }
      fn_obtener_remuneracion: {
        Args: { p_fecha: string; p_id_contrato: number }
        Returns: {
          dias_semanales: number
          gratificacion_proporcional: boolean
          horas_semanales: number
          semana_corrida_activa: boolean
          sueldo_base: number
          tipo_gratificacion: Database["public"]["Enums"]["tipo_gratificacion_enum"]
          zona_extrema_activa: boolean
        }[]
      }
      fn_obtener_salud: {
        Args: { p_fecha: string; p_id_contrato: number }
        Returns: {
          id_salud: number
          nombre: string
          porcentaje_cotizacion: number
          tipo: string
          valor_plan: number
        }[]
      }
      fn_validar_liquidacion: {
        Args: { p_id_liquidacion: number }
        Returns: {
          actual: string
          detalle: string
          esperado: string
          ok: boolean
          validacion: string
        }[]
      }
      generar_liquidaciones_oficiales: {
        Args: {
          p_id_calculo_periodo: number
          p_metadata?: Json
          p_periodo: string
        }
        Returns: {
          activo: boolean
          created_at: string
          estado: string
          fecha_generacion: string
          id_calculo_periodo: number
          id_empresa: number | null
          id_liquidacion_periodo: number
          metadata: Json
          periodo: string
          total_descuentos: number
          total_haberes: number
          total_liquido: number
          total_trabajadores: number
          updated_at: string
          usuario_generacion_id: string | null
          usuario_generacion_label: string | null
        }
        SetofOptions: {
          from: "*"
          to: "nomina_liquidacion_periodo"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      guardar_nomina_calculo_snapshot: {
        Args: {
          p_cabecera: Json
          p_conceptos?: Json
          p_id_empresa: number
          p_observaciones?: Json
          p_periodo: string
          p_trabajadores: Json
          p_trazabilidad?: Json
        }
        Returns: number
      }
      guardar_nomina_periodo_diagnostico: {
        Args: { p_fingerprint?: string; p_payload: Json; p_periodo: string }
        Returns: {
          activo: boolean
          cerrado_en: string | null
          cerrado_motivo: string | null
          created_at: string
          estado: string
          fingerprint: string | null
          id_diagnostico: number
          payload: Json
          periodo: string
          updated_at: string
          verificado_en: string
          verificado_por: string
        }
        SetofOptions: {
          from: "*"
          to: "nomina_periodo_diagnostico"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      obtener_nomina_periodo_diagnostico_activo: {
        Args: { p_periodo: string }
        Returns: {
          activo: boolean
          cerrado_en: string | null
          cerrado_motivo: string | null
          created_at: string
          estado: string
          fingerprint: string | null
          id_diagnostico: number
          payload: Json
          periodo: string
          updated_at: string
          verificado_en: string
          verificado_por: string
        }
        SetofOptions: {
          from: "*"
          to: "nomina_periodo_diagnostico"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reabrir_nomina_operativa: {
        Args: {
          p_forzar?: boolean
          p_id_calculo_periodo: number
          p_metadata?: Json
          p_observacion?: string
          p_periodo: string
        }
        Returns: {
          activo: boolean
          aprobacion_operativa_advertencias: Json
          aprobacion_operativa_estado: string | null
          aprobacion_operativa_fecha: string | null
          aprobacion_operativa_metadata: Json
          aprobacion_operativa_usuario_id: string | null
          aprobacion_operativa_usuario_label: string | null
          cierre_operativo_estado: string | null
          cierre_operativo_fecha: string | null
          cierre_operativo_metadata: Json
          cierre_operativo_observacion: string | null
          cierre_operativo_usuario_id: string | null
          cierre_operativo_usuario_label: string | null
          created_at: string
          estado: string
          fecha_generacion: string
          hash_snapshot: string | null
          id_calculo_periodo: number
          id_empresa: number | null
          observacion_anulacion: string | null
          origen: string
          periodo: string
          reemplazado_por: number | null
          total_advertencias: number
          total_bloqueados: number
          total_descuentos: number
          total_haberes: number
          total_liquido: number
          total_trabajadores: number
          updated_at: string
          usuario_generador: string | null
          version_motor: string
        }
        SetofOptions: {
          from: "*"
          to: "nomina_calculo_periodo"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      tipo_concepto_enum: "HABER" | "DESCUENTO" | "APORTE_EMPLEADOR"
      tipo_contrato_enum:
        | "INDEFINIDO"
        | "PLAZO_FIJO"
        | "OBRA_SERVICIO"
        | "CASA_PARTICULAR"
      tipo_dominio_ficha_enum:
        | "GENERAL"
        | "LABORAL"
        | "REMUNERACION"
        | "PREVISION"
        | "SALUD"
        | "COMPLEMENTARIOS"
      tipo_estado_civil_enum:
        | "SOLTERO"
        | "CASADO"
        | "CONVIVIENTE_CIVIL"
        | "SEPARADO"
        | "DIVORCIADO"
        | "VIUDO"
      tipo_estado_ficha_enum: "BORRADOR" | "INCOMPLETO" | "VALIDO"
      tipo_estado_liquidacion_enum:
        | "BORRADOR"
        | "PROCESADA"
        | "APROBADA"
        | "PAGADA"
        | "ANULADA"
      tipo_estado_persona_enum:
        | "BORRADOR"
        | "EN_PROCESO"
        | "ACTIVO"
        | "SUSPENDIDO"
        | "INACTIVO"
        | "DESVINCULADO"
        | "BLOQUEADO"
      tipo_gratificacion_enum: "LEGAL_ART_47" | "LEGAL_ART_50" | "VOLUNTARIA"
      tipo_mov_vacaciones_enum:
        | "ACUMULADO"
        | "USADO"
        | "BONIFICADO"
        | "CORREGIDO"
      tipo_prevision_enum: "AFP" | "IPS" | "NINGUNA"
      tipo_salud_enum: "FONASA" | "ISAPRE"
      tipo_severidad_validacion_enum: "BLOQUEANTE" | "ADVERTENCIA" | "CRITICO"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      tipo_concepto_enum: ["HABER", "DESCUENTO", "APORTE_EMPLEADOR"],
      tipo_contrato_enum: [
        "INDEFINIDO",
        "PLAZO_FIJO",
        "OBRA_SERVICIO",
        "CASA_PARTICULAR",
      ],
      tipo_dominio_ficha_enum: [
        "GENERAL",
        "LABORAL",
        "REMUNERACION",
        "PREVISION",
        "SALUD",
        "COMPLEMENTARIOS",
      ],
      tipo_estado_civil_enum: [
        "SOLTERO",
        "CASADO",
        "CONVIVIENTE_CIVIL",
        "SEPARADO",
        "DIVORCIADO",
        "VIUDO",
      ],
      tipo_estado_ficha_enum: ["BORRADOR", "INCOMPLETO", "VALIDO"],
      tipo_estado_liquidacion_enum: [
        "BORRADOR",
        "PROCESADA",
        "APROBADA",
        "PAGADA",
        "ANULADA",
      ],
      tipo_estado_persona_enum: [
        "BORRADOR",
        "EN_PROCESO",
        "ACTIVO",
        "SUSPENDIDO",
        "INACTIVO",
        "DESVINCULADO",
        "BLOQUEADO",
      ],
      tipo_gratificacion_enum: ["LEGAL_ART_47", "LEGAL_ART_50", "VOLUNTARIA"],
      tipo_mov_vacaciones_enum: [
        "ACUMULADO",
        "USADO",
        "BONIFICADO",
        "CORREGIDO",
      ],
      tipo_prevision_enum: ["AFP", "IPS", "NINGUNA"],
      tipo_salud_enum: ["FONASA", "ISAPRE"],
      tipo_severidad_validacion_enum: ["BLOQUEANTE", "ADVERTENCIA", "CRITICO"],
    },
  },
} as const
