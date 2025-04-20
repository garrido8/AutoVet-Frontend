import { Staff } from "./staff.interface";

export interface Appoinment {
  pk?:                  number;
  mascota:              number;
  petName?:             string;
  titulo:               string;
  descripcion:          string;
  fecha_creacion:       Date;
  fecha_resolucion:     Date;
  estado:               string;
  urgencia:             boolean;
  archivo_adjuntado:    null;
  trabajador_asignado:  Staff;
}
