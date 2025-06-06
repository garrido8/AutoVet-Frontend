export interface ShareAppointment {
  id:          number;
  shared_with: SharedWith;
  permission:  string;
  shared_at:   Date;
  appointment: number;
  shared_by:   number;
}

export interface SharedWith {
  pk:                number;
  name:              string;
  email:             string;
}
