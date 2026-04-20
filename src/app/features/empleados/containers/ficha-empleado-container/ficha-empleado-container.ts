import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import {
  CardComponent,
  CardContentComponent,
  CardHeaderComponent,
} from '../../../../shared/components/ui/card.component';

@Component({
  selector: 'app-ficha-empleado-page',
  imports: [
    CommonModule,
    RouterLink,
    LucideAngularModule,
    CardComponent,
    CardHeaderComponent,
    CardContentComponent,
  ],
  templateUrl: './ficha-empleado-container.html',
  styleUrl: './ficha-empleado-container.css',
})
export class FichaEmpleadoPage {
  private readonly route = inject(ActivatedRoute);

  readonly empleadoId = this.route.snapshot.paramMap.get('id');
}
