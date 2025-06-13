export interface Reassignment {
  id?:                     number;
  appointment:            number;
  appointment_title:      string;
  requesting_worker:      number;
  requesting_worker_name: string;
  reason:                 string;
  status:                 string;
  requested_at?:           Date;
  updated_at?:             Date;
}
