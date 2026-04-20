import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

import { FormEmpleadoComponent } from '../../components/form-empleado/form-empleado';

@Component({
  selector: 'app-crear-empleado-page',
  imports: [
    CommonModule,
    LucideAngularModule,
    FormEmpleadoComponent,
  ],
  templateUrl: './crear-empleado-container.html',
  styleUrl: './crear-empleado-container.css',
})
export class CrearEmpleadoPage {}
