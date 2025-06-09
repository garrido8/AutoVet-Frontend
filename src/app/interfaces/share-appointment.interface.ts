export interface ShareAppointment {
  id?:          number;
  shared_with: number;
  permission: 'readonly' | 'editing'
  shared_at?:   Date;
  appointment: number;
  shared_by:   number;
}
