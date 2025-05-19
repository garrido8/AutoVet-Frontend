import { ValidatorFn, AbstractControl } from '@angular/forms';

export function dniValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const dni = control.value;
    if (!dni) {
      return null;
    }
    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const numero = dni.substring(0, 8);
    const letra = dni.substring(8, 9);
    if (!/^\d{8}[A-Z]$/.test(dni)) {
      return { dniInvalido: true };
    }
    const resto = parseInt(numero, 10) % 23;
    if (letras[resto] !== letra) {
      return { dniInvalido: true };
    }
    return null;
  };
}

export const passwordRegEx: string = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.,!?_#$%&*+-=]).{8,}$'
