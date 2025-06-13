export interface Message {
  id?:           number;
  content:      string;
  type:         string;
  timestamp:    Date;
  conversation: number;
}
