import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
  OnChanges,
  SimpleChanges,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ChevronDown, ChevronUp } from 'lucide-angular/src/icons';
import type {
  VmConsolaBitacoraAlta,
  RevisionNormativaBitacoraAlta,
} from '../../../models/empleado-alta-avanzada.vm';
import type { FaltanteFichaEmpleado } from '../../../models/ficha-empleado.vm';

@Component({
  selector: 'app-alta-bitacora-console',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './alta-bitacora-console.component.html',
  styleUrls: ['./alta-bitacora-console.component.css'],
  host: {
    class: 'alta-bitacora-console-host',
  },
})
export class AltaBitacoraConsoleComponent implements OnChanges {
  @Input({ required: true }) vm!: VmConsolaBitacoraAlta;

  /** Incrementar para expandir la consola desde la franja del paso. */
  @Input() expandRequest = 0;

  readonly navegarFaltante = output<FaltanteFichaEmpleado>();
  readonly revisarPaso = output<number>();
  readonly aplicarRevisionNormativa = output<RevisionNormativaBitacoraAlta>();
  readonly mantenerRevisionNormativa = output<RevisionNormativaBitacoraAlta>();

  readonly chevronDownIcon = ChevronDown;
  readonly chevronUpIcon = ChevronUp;

  readonly expanded = signal(false);

  @HostBinding('class.alta-bitacora-console-host--expanded')
  get hostExpanded(): boolean {
    return this.expanded();
  }

  @HostBinding('class.alta-bitacora-console-host--hidden')
  get hostHidden(): boolean {
    return !this.vm.visible;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expandRequest'] && !changes['expandRequest'].firstChange) {
      if (this.vm.visible) {
        this.expanded.set(true);
      }
    }

    const prevVm = changes['vm']?.previousValue as VmConsolaBitacoraAlta | undefined;
    const vm = this.vm;

    if (!vm.visible) {
      this.expanded.set(false);
      return;
    }

    const prevDefault = prevVm?.expandedByDefault ?? false;
    const currDefault = vm.expandedByDefault;

    if (currDefault && !prevDefault) {
      this.expanded.set(true);
      return;
    }

    if (!currDefault && prevDefault) {
      this.expanded.set(false);
    }
  }

  toggleExpanded(): void {
    this.expanded.update((value) => !value);
  }
}
