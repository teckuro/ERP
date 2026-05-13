import { DestroyRef, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { EmpleadoEstado } from '../models/empleado-listado.model';
import { EmpleadoFormCatalogos, TramoCargaCatalogOption } from '../models/empleado-catalogos.model';
import { EmpleadoFormGroup } from '../models/empleado-form.model';
import {
  EmpleadoSexo,
  RelacionLaboral,
  TipoContrato,
  TipoEstadoCivil,
  TipoGratificacion,
  TipoRegimenPrevisional,
} from '../models/empleado.model';
import { buildTodayValue } from '../utils/empleado-form-defaults';
import {
  formatRutInput,
  onlyDigits,
  setNormalizedTextValue,
} from '../utils/empleado-form.normalizers';
import {
  atLeastOneArrayValueValidator,
  digitsOnlyValidator,
  notFutureDateValidator,
  personNameValidator,
  passportValidator,
  phoneFormatValidator,
  rutOrPassportValidator,
  rutValidator,
} from '../utils/empleado-form.validators';

@Injectable({
  providedIn: 'root',
})
export class EmpleadosFormOrchestratorService {
  private readonly tramoCargaTouchedByForm = new WeakMap<EmpleadoFormGroup, boolean>();

  createForm(): EmpleadoFormGroup {
    return new FormGroup({
      datosPersonales: new FormGroup(
        {
          rut: new FormControl('', {
            nonNullable: true,
            validators: [rutValidator],
          }),
          nombres: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.maxLength(60), personNameValidator],
          }),
          apellidoPaterno: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, Validators.maxLength(80), personNameValidator],
          }),
          apellidoMaterno: new FormControl('', {
            nonNullable: true,
            validators: [Validators.maxLength(80), personNameValidator],
          }),
          fechaNacimiento: new FormControl('', {
            nonNullable: true,
            validators: [Validators.required, notFutureDateValidator],
          }),
          sexo: new FormControl<EmpleadoSexo | null>(null, {
            validators: [Validators.required],
          }),
          pasaporte: new FormControl('', {
            nonNullable: true,
            validators: [passportValidator],
          }),
          idPais: new FormControl<number | null>(null, {
            validators: [Validators.required],
          }),
          estadoCivil: new FormControl<TipoEstadoCivil | null>(null, {
            validators: [Validators.required],
          }),
        },
        { validators: [rutOrPassportValidator] },
      ),
      contacto: new FormGroup({
        email: new FormControl('', {
          nonNullable: true,
          validators: [Validators.email],
        }),
        telefono: new FormControl('', {
          nonNullable: true,
          validators: [Validators.maxLength(20), phoneFormatValidator],
        }),
        direccion: new FormControl('', {
          nonNullable: true,
          validators: [Validators.maxLength(180)],
        }),
        numeroDireccion: new FormControl('', {
          nonNullable: true,
          validators: [Validators.maxLength(20), digitsOnlyValidator],
        }),
        departamentoDireccion: new FormControl('', {
          nonNullable: true,
          validators: [Validators.maxLength(50)],
        }),
        observacionesDireccion: new FormControl('', {
          nonNullable: true,
          validators: [Validators.maxLength(250)],
        }),
        idComuna: new FormControl<number | null>(null),
      }),
      contrato: new FormGroup({
        relacionLaboral: new FormControl<RelacionLaboral>('CONTRATO', {
          nonNullable: true,
          validators: [Validators.required],
        }),
        idSucursal: new FormControl<number | null>(null),
        idDepartamentoEmpresa: new FormControl<number | null>(null),
        idCentroCosto: new FormControl<number | null>(null),
        cargo: new FormControl('', {
          nonNullable: true,
          validators: [Validators.required, Validators.maxLength(60)],
        }),
        fechaContrato: new FormControl(buildTodayValue(), {
          nonNullable: true,
          validators: [Validators.required],
        }),
        tipoContrato: new FormControl<TipoContrato | null>(null, {
          validators: [Validators.required],
        }),
        idTipoTrabajador: new FormControl<number | null>(null, {
          validators: [Validators.required],
        }),
        idTipoJornada: new FormControl<number | null>(null, {
          validators: [Validators.required],
        }),
        seguroCesantia: new FormControl(true, {
          nonNullable: true,
        }),
        fechaIngreso: new FormControl(buildTodayValue(), {
          nonNullable: true,
          validators: [Validators.required],
        }),
        fechaTermino: new FormControl('', {
          nonNullable: true,
        }),
        sueldoBase: new FormControl<number | null>(null, {
          validators: [Validators.required, Validators.min(1)],
        }),
        idMoneda: new FormControl<number | null>(null),
        sueldoVariable: new FormControl(false, {
          nonNullable: true,
        }),
        cargas: new FormControl<number | null>(0, {
          validators: [Validators.min(0)],
        }),
        horasSemanales: new FormControl<number | null>(null, {
          validators: [Validators.required, Validators.min(1), Validators.max(168)],
        }),
        diasSemanales: new FormControl<number | null>(5, {
          validators: [Validators.required, Validators.min(1), Validators.max(7)],
        }),
        distribucionJornada: new FormControl('', {
          nonNullable: true,
          validators: [Validators.maxLength(250)],
        }),
        tiempoColacionMinutos: new FormControl<number | null>(null, {
          validators: [Validators.min(0), Validators.max(600)],
        }),
        tipoGratificacion: new FormControl<TipoGratificacion | null>(null, {
          validators: [Validators.required],
        }),
        gratificacionProporcional: new FormControl(false, {
          nonNullable: true,
        }),
        semanaCorridaActiva: new FormControl(false, {
          nonNullable: true,
        }),
        semanaCorridaDiasLaborables: new FormControl<number[]>([], {
          nonNullable: true,
        }),
        zonaExtremaActiva: new FormControl(false, {
          nonNullable: true,
        }),
        zonaExtremaTerritorio: new FormControl('', {
          nonNullable: true,
          validators: [Validators.maxLength(150)],
        }),
        zonaExtremaPorcentaje: new FormControl<number | null>(null, {
          validators: [Validators.min(0)],
        }),
        estado: new FormControl<EmpleadoEstado>('en_proceso', {
          nonNullable: true,
          validators: [Validators.required],
        }),
        idTramoCarga: new FormControl<number | null>(null),
      }),
      previsionSalud: new FormGroup({
        tipoRegimenPrevisional: new FormControl<TipoRegimenPrevisional | null>(null, {
          validators: [Validators.required],
        }),
        idAfp: new FormControl<number | null>(null),
        idMonedaCuenta2: new FormControl<number | null>(null),
        valorCuenta2: new FormControl<number | null>(null, {
          validators: [Validators.min(0)],
        }),
        idEntidadPrevisionalIps: new FormControl<number | null>(null),
        idExCajaPrevisional: new FormControl<number | null>(null),
        idRegimenExCaja: new FormControl<number | null>(null),
        nombreExCaja: new FormControl('', {
          nonNullable: true,
          validators: [Validators.maxLength(150)],
        }),
        regimenExCaja: new FormControl('', {
          nonNullable: true,
          validators: [Validators.maxLength(150)],
        }),
        tasaExCaja: new FormControl<number | null>(null, {
          validators: [Validators.min(0)],
        }),
        idSalud: new FormControl<number | null>(null),
        idMonedaPlan: new FormControl<number | null>(null),
        valorPlan: new FormControl<number | null>(0, {
          validators: [Validators.min(0)],
        }),
        adicionalAugeGes: new FormControl<number | null>(0, {
          validators: [Validators.min(0)],
        }),
        tieneApv: new FormControl(false, {
          nonNullable: true,
        }),
        idInstitucionApv: new FormControl<number | null>(null),
        idMonedaApv: new FormControl<number | null>(null),
        montoApv: new FormControl<number | null>(null, {
          validators: [Validators.min(0)],
        }),
        idFormaPagoApv: new FormControl<number | null>(null),
        depositoConvenidoApvi: new FormControl<number | null>(null, {
          validators: [Validators.min(0)],
        }),
      }),
      bancario: new FormGroup({
        idBanco: new FormControl<number | null>(null, {
          validators: [Validators.required],
        }),
        idTipoCuentaBancaria: new FormControl<number | null>(null, {
          validators: [Validators.required],
        }),
        numeroCuenta: new FormControl('', {
          nonNullable: true,
          validators: [Validators.required, Validators.maxLength(50), digitsOnlyValidator],
        }),
      }),
    });
  }

  configureFormBehavior(
    form: EmpleadoFormGroup,
    destroyRef: DestroyRef,
    getCatalogos: () => EmpleadoFormCatalogos,
  ): void {
    this.configureInputNormalization(form, destroyRef);
    this.configureContratoBehavior(form, destroyRef, getCatalogos);
    this.configurePrevisionSaludBehavior(form, destroyRef, getCatalogos);
    this.updateBancarioValidators(form);
  }

  /**
   * No autocompletar catálogos: la opción vacía y null en controles marcan pendiente explícito.
   * (Defaults técnicos solo en payload de borrador si la persistencia lo exige; ver mapper borrador.)
   */
  applyCatalogDefaults(form: EmpleadoFormGroup, catalogos: EmpleadoFormCatalogos): void {
    void catalogos;
    this.ensureDepartamentoDefault(form, catalogos);
    this.ensureTramoCargaSelection(form, catalogos);
    this.ensurePrevisionDefaults(form, catalogos);
  }

  private configureInputNormalization(form: EmpleadoFormGroup, destroyRef: DestroyRef): void {
    const datosPersonales = form.controls.datosPersonales.controls;
    const contacto = form.controls.contacto.controls;
    const bancario = form.controls.bancario.controls;

    datosPersonales.rut.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((value) => setNormalizedTextValue(datosPersonales.rut, formatRutInput(value)));

    contacto.numeroDireccion.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((value) =>
        setNormalizedTextValue(contacto.numeroDireccion, onlyDigits(value, 20)),
      );

    bancario.numeroCuenta.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((value) => setNormalizedTextValue(bancario.numeroCuenta, onlyDigits(value, 50)));
  }

  private configureContratoBehavior(
    form: EmpleadoFormGroup,
    destroyRef: DestroyRef,
    getCatalogos: () => EmpleadoFormCatalogos,
  ): void {
    const controls = form.controls.contrato.controls;

    controls.relacionLaboral.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
      this.updateContratoValidators(form);
      this.updatePrevisionSaludValidators(form);
      this.updateBancarioValidators(form);
    });

    controls.tipoContrato.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe((tipo) => {
      if (tipo === 'INDEFINIDO') {
        controls.fechaTermino.setValue('', { emitEvent: false });
      }

      this.updateContratoValidators(form);
    });

    controls.idSucursal.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => this.ensureDepartamentoDefault(form, getCatalogos()));

    controls.sueldoBase.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => this.ensureTramoCargaSelection(form, getCatalogos()));

    controls.idTramoCarga.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe(() => {
      if (controls.idTramoCarga.dirty) {
        this.tramoCargaTouchedByForm.set(form, true);
      }
    });

    controls.semanaCorridaActiva.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((enabled) => {
        if (!enabled) {
          controls.semanaCorridaDiasLaborables.setValue([], { emitEvent: false });
        }

        this.updateContratoValidators(form);
      });

    controls.zonaExtremaActiva.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((enabled) => {
        if (!enabled) {
          controls.zonaExtremaTerritorio.setValue('', { emitEvent: false });
          controls.zonaExtremaPorcentaje.setValue(null, { emitEvent: false });
        }

        this.updateContratoValidators(form);
      });

    this.updateContratoValidators(form);
  }

  private updateContratoValidators(form: EmpleadoFormGroup): void {
    const controls = form.controls.contrato.controls;
    const esHonorarios = controls.relacionLaboral.value === 'HONORARIOS';
    const requiereTermino =
      !esHonorarios && controls.tipoContrato.value !== null && controls.tipoContrato.value !== 'INDEFINIDO';
    const semanaCorridaActiva = !esHonorarios && controls.semanaCorridaActiva.value;
    const zonaExtremaActiva = !esHonorarios && controls.zonaExtremaActiva.value;

    this.setControlValidators(
      controls.tipoContrato,
      esHonorarios ? [] : [Validators.required],
    );
    this.setControlValidators(
      controls.idTipoTrabajador,
      esHonorarios ? [] : [Validators.required],
    );
    this.setControlValidators(
      controls.idTipoJornada,
      esHonorarios ? [] : [Validators.required],
    );
    this.setControlValidators(
      controls.fechaContrato,
      esHonorarios ? [] : [Validators.required],
    );
    this.setControlValidators(controls.fechaTermino, requiereTermino ? [Validators.required] : []);
    this.setControlValidators(
      controls.horasSemanales,
      esHonorarios ? [] : [Validators.required, Validators.min(1), Validators.max(168)],
    );
    this.setControlValidators(
      controls.diasSemanales,
      esHonorarios ? [] : [Validators.required, Validators.min(1), Validators.max(7)],
    );
    this.setControlValidators(
      controls.tipoGratificacion,
      esHonorarios ? [] : [Validators.required],
    );
    this.setControlValidators(
      controls.semanaCorridaDiasLaborables,
      semanaCorridaActiva ? [atLeastOneArrayValueValidator] : [],
    );
    this.setControlValidators(
      controls.zonaExtremaTerritorio,
      zonaExtremaActiva
        ? [Validators.required, Validators.maxLength(150)]
        : [Validators.maxLength(150)],
    );
    this.setControlValidators(
      controls.zonaExtremaPorcentaje,
      zonaExtremaActiva ? [Validators.required, Validators.min(0)] : [Validators.min(0)],
    );
  }

  private configurePrevisionSaludBehavior(
    form: EmpleadoFormGroup,
    destroyRef: DestroyRef,
    getCatalogos: () => EmpleadoFormCatalogos,
  ): void {
    const controls = form.controls.previsionSalud.controls;
    let previousTipo = controls.tipoRegimenPrevisional.value;

    controls.tipoRegimenPrevisional.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((tipo) => {
        this.handleTipoRegimenChange(form, previousTipo, tipo);
        previousTipo = tipo;
        this.ensurePrevisionDefaults(form, getCatalogos());
        this.updatePrevisionSaludValidators(form);
      });

    controls.tieneApv.valueChanges.pipe(takeUntilDestroyed(destroyRef)).subscribe((enabled) => {
      if (!enabled) {
        this.resetApviFields(form);
      }

      this.ensurePrevisionDefaults(form, getCatalogos());
      this.updatePrevisionSaludValidators(form);
    });

    controls.idMonedaCuenta2.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => this.updatePrevisionSaludValidators(form));

    controls.valorCuenta2.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => this.updatePrevisionSaludValidators(form));

    controls.idExCajaPrevisional.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => this.ensureRegimenExCajaDefault(form, getCatalogos()));

    controls.idRegimenExCaja.valueChanges
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => this.syncRegimenExCajaFields(form, getCatalogos()));

    this.updatePrevisionSaludValidators(form);
  }

  private handleTipoRegimenChange(
    form: EmpleadoFormGroup,
    previousTipo: TipoRegimenPrevisional | null,
    currentTipo: TipoRegimenPrevisional | null,
  ): void {
    if (previousTipo === currentTipo) {
      return;
    }

    if (currentTipo !== 'AFP') {
      this.resetAfpFields(form);
    }

    if (currentTipo !== 'IPS') {
      this.resetIpsFields(form);
    }

    if (currentTipo === 'NINGUNA' || currentTipo === null) {
      this.resetSaludFields(form);
    }
  }

  private updatePrevisionSaludValidators(form: EmpleadoFormGroup): void {
    const controls = form.controls.previsionSalud.controls;
    const esHonorarios = form.controls.contrato.controls.relacionLaboral.value === 'HONORARIOS';
    const tipo = controls.tipoRegimenPrevisional.value;
    const requiereSalud = tipo !== null && tipo !== 'NINGUNA';
    const tieneCuenta2 =
      tipo === 'AFP' &&
      (controls.idMonedaCuenta2.value !== null || controls.valorCuenta2.value !== null);
    const requiereApvi = tipo === 'AFP' && controls.tieneApv.value;

    if (esHonorarios) {
      this.setControlValidators(controls.tipoRegimenPrevisional, []);
      this.setControlValidators(controls.idAfp, []);
      this.setControlValidators(controls.idMonedaCuenta2, []);
      this.setControlValidators(controls.valorCuenta2, [Validators.min(0)]);
      this.setControlValidators(controls.idEntidadPrevisionalIps, []);
      this.setControlValidators(controls.idExCajaPrevisional, []);
      this.setControlValidators(controls.idRegimenExCaja, []);
      this.setControlValidators(controls.nombreExCaja, [Validators.maxLength(150)]);
      this.setControlValidators(controls.regimenExCaja, [Validators.maxLength(150)]);
      this.setControlValidators(controls.tasaExCaja, [Validators.min(0)]);
      this.setControlValidators(controls.idSalud, []);
      this.setControlValidators(controls.idMonedaPlan, []);
      this.setControlValidators(controls.valorPlan, [Validators.min(0)]);
      this.setControlValidators(controls.adicionalAugeGes, [Validators.min(0)]);
      this.setControlValidators(controls.idInstitucionApv, []);
      this.setControlValidators(controls.idMonedaApv, []);
      this.setControlValidators(controls.montoApv, [Validators.min(0)]);
      this.setControlValidators(controls.idFormaPagoApv, []);
      this.setControlValidators(controls.depositoConvenidoApvi, [Validators.min(0)]);
      return;
    }

    this.setControlValidators(controls.tipoRegimenPrevisional, [Validators.required]);
    this.setControlValidators(controls.idAfp, tipo === 'AFP' ? [Validators.required] : []);
    this.setControlValidators(controls.idMonedaCuenta2, tieneCuenta2 ? [Validators.required] : []);
    this.setControlValidators(
      controls.valorCuenta2,
      tieneCuenta2 ? [Validators.required, Validators.min(0)] : [Validators.min(0)],
    );
    this.setControlValidators(
      controls.idEntidadPrevisionalIps,
      tipo === 'IPS' ? [Validators.required] : [],
    );
    this.setControlValidators(
      controls.idExCajaPrevisional,
      tipo === 'IPS' ? [Validators.required] : [],
    );
    this.setControlValidators(
      controls.idRegimenExCaja,
      tipo === 'IPS' ? [Validators.required] : [],
    );
    this.setControlValidators(
      controls.nombreExCaja,
      tipo === 'IPS'
        ? [Validators.required, Validators.maxLength(150)]
        : [Validators.maxLength(150)],
    );
    this.setControlValidators(
      controls.regimenExCaja,
      tipo === 'IPS'
        ? [Validators.required, Validators.maxLength(150)]
        : [Validators.maxLength(150)],
    );
    this.setControlValidators(
      controls.tasaExCaja,
      tipo === 'IPS' ? [Validators.required, Validators.min(0)] : [Validators.min(0)],
    );
    this.setControlValidators(controls.idSalud, requiereSalud ? [Validators.required] : []);
    this.setControlValidators(controls.idMonedaPlan, requiereSalud ? [Validators.required] : []);
    this.setControlValidators(
      controls.valorPlan,
      requiereSalud ? [Validators.required, Validators.min(0)] : [Validators.min(0)],
    );
    this.setControlValidators(
      controls.adicionalAugeGes,
      requiereSalud ? [Validators.required, Validators.min(0)] : [Validators.min(0)],
    );
    this.setControlValidators(controls.idInstitucionApv, requiereApvi ? [Validators.required] : []);
    this.setControlValidators(controls.idMonedaApv, requiereApvi ? [Validators.required] : []);
    this.setControlValidators(
      controls.montoApv,
      requiereApvi ? [Validators.required, Validators.min(0)] : [Validators.min(0)],
    );
    this.setControlValidators(controls.idFormaPagoApv, requiereApvi ? [Validators.required] : []);
    this.setControlValidators(
      controls.depositoConvenidoApvi,
      requiereApvi ? [Validators.required, Validators.min(0)] : [Validators.min(0)],
    );
  }

  private ensurePrevisionDefaults(form: EmpleadoFormGroup, catalogos: EmpleadoFormCatalogos): void {
    const controls = form.controls.previsionSalud.controls;

    if (controls.tipoRegimenPrevisional.value === 'IPS') {
      this.ensureRegimenExCajaDefault(form, catalogos);
    }
  }

  private ensureDepartamentoDefault(
    form: EmpleadoFormGroup,
    catalogos: EmpleadoFormCatalogos,
  ): void {
    const controls = form.controls.contrato.controls;
    const departamentosSucursal = catalogos.departamentos.filter(
      (option) => option.idSucursal === controls.idSucursal.value,
    );

    if (departamentosSucursal.length === 0) {
      controls.idDepartamentoEmpresa.setValue(null, { emitEvent: false });
      return;
    }

    const currentValue = controls.idDepartamentoEmpresa.value;
    const currentStillValid = departamentosSucursal.some((option) => option.value === currentValue);

    if (!currentStillValid) {
      controls.idDepartamentoEmpresa.setValue(null, { emitEvent: false });
    }
  }

  private ensureTramoCargaSelection(
    form: EmpleadoFormGroup,
    catalogos: EmpleadoFormCatalogos,
  ): void {
    const controls = form.controls.contrato.controls;
    const tramos = catalogos.tramosCarga;

    if (tramos.length === 0) {
      controls.idTramoCarga.setValue(null, { emitEvent: false });
      return;
    }

    if (this.tramoCargaTouchedByForm.get(form) && controls.idTramoCarga.value !== null) {
      return;
    }

    const tramoSugerido = this.resolveTramoCargaBySueldo(tramos, controls.sueldoBase.value);
    controls.idTramoCarga.setValue(tramoSugerido?.value ?? null, { emitEvent: false });
  }

  private resolveTramoCargaBySueldo(
    tramos: TramoCargaCatalogOption[],
    sueldoBase: number | null,
  ): TramoCargaCatalogOption | null {
    if (sueldoBase === null || tramos.length === 0) {
      return null;
    }

    return (
      tramos.find((option) => {
        const matchesDesde = option.desde === null || sueldoBase >= option.desde;
        const matchesHasta = option.hasta === null || sueldoBase <= option.hasta;
        return matchesDesde && matchesHasta;
      }) ?? null
    );
  }

  private resetAfpFields(form: EmpleadoFormGroup): void {
    const controls = form.controls.previsionSalud.controls;
    controls.idAfp.setValue(null, { emitEvent: false });
    controls.idMonedaCuenta2.setValue(null, { emitEvent: false });
    controls.valorCuenta2.setValue(null, { emitEvent: false });
    controls.tieneApv.setValue(false, { emitEvent: false });
    this.resetApviFields(form);
  }

  private resetIpsFields(form: EmpleadoFormGroup): void {
    const controls = form.controls.previsionSalud.controls;
    controls.idEntidadPrevisionalIps.setValue(null, { emitEvent: false });
    controls.idExCajaPrevisional.setValue(null, { emitEvent: false });
    controls.idRegimenExCaja.setValue(null, { emitEvent: false });
    controls.nombreExCaja.setValue('', { emitEvent: false });
    controls.regimenExCaja.setValue('', { emitEvent: false });
    controls.tasaExCaja.setValue(null, { emitEvent: false });
  }

  private ensureRegimenExCajaDefault(
    form: EmpleadoFormGroup,
    catalogos: EmpleadoFormCatalogos,
  ): void {
    const controls = form.controls.previsionSalud.controls;
    const exCajaId = controls.idExCajaPrevisional.value;
    const regimenes = catalogos.regimenesExCaja.filter(
      (option) => option.idExCajaPrevisional === exCajaId,
    );

    if (regimenes.length === 0) {
      controls.idRegimenExCaja.setValue(null, { emitEvent: false });
      controls.regimenExCaja.setValue('', { emitEvent: false });
      controls.tasaExCaja.setValue(null, { emitEvent: false });
      return;
    }

    const currentValue = controls.idRegimenExCaja.value;
    const currentStillValid = regimenes.some((option) => option.value === currentValue);

    if (!currentStillValid) {
      controls.idRegimenExCaja.setValue(null, { emitEvent: false });
    }

    this.syncRegimenExCajaFields(form, catalogos);
  }

  private syncRegimenExCajaFields(form: EmpleadoFormGroup, catalogos: EmpleadoFormCatalogos): void {
    const controls = form.controls.previsionSalud.controls;
    const exCaja = catalogos.exCajasPrevisionales.find(
      (option) => option.value === controls.idExCajaPrevisional.value,
    );
    const regimen = catalogos.regimenesExCaja.find(
      (option) => option.value === controls.idRegimenExCaja.value,
    );

    controls.nombreExCaja.setValue(exCaja?.label ?? '', { emitEvent: false });
    controls.regimenExCaja.setValue(regimen?.label ?? '', { emitEvent: false });
    controls.tasaExCaja.setValue(regimen?.tasaCotizacionReferencia ?? null, { emitEvent: false });
  }

  private resetSaludFields(form: EmpleadoFormGroup): void {
    const controls = form.controls.previsionSalud.controls;
    controls.idSalud.setValue(null, { emitEvent: false });
    controls.idMonedaPlan.setValue(null, { emitEvent: false });
    controls.valorPlan.setValue(null, { emitEvent: false });
    controls.adicionalAugeGes.setValue(null, { emitEvent: false });
  }

  private resetApviFields(form: EmpleadoFormGroup): void {
    const controls = form.controls.previsionSalud.controls;
    controls.idInstitucionApv.setValue(null, { emitEvent: false });
    controls.idMonedaApv.setValue(null, { emitEvent: false });
    controls.montoApv.setValue(null, { emitEvent: false });
    controls.idFormaPagoApv.setValue(null, { emitEvent: false });
    controls.depositoConvenidoApvi.setValue(null, { emitEvent: false });
  }

  private updateBancarioValidators(form: EmpleadoFormGroup): void {
    const controls = form.controls.bancario.controls;
    const esHonorarios = form.controls.contrato.controls.relacionLaboral.value === 'HONORARIOS';

    this.setControlValidators(
      controls.idBanco,
      esHonorarios ? [] : [Validators.required],
    );
    this.setControlValidators(
      controls.idTipoCuentaBancaria,
      esHonorarios ? [] : [Validators.required],
    );
    this.setControlValidators(
      controls.numeroCuenta,
      esHonorarios
        ? [Validators.maxLength(50), digitsOnlyValidator]
        : [Validators.required, Validators.maxLength(50), digitsOnlyValidator],
    );
  }

  private setControlValidators(
    control: FormControl<unknown>,
    validators: Parameters<FormControl<unknown>['setValidators']>[0],
  ): void {
    control.setValidators(validators);
    control.updateValueAndValidity({ emitEvent: false });
  }
}
