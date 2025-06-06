export interface AppointmentMessage {
  pk: number;
  appointment: number; // ID of the parent appointment
  user: string; // Username of the sender
  content: string;
  timestamp: string; // The timestamp as an ISO date string
}
