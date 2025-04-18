export interface Client {
  id?:                number;
  name:              string;
  email:             string;
  dni:               string;
  phone:             string;
  registration_date?: Date;
  password:          string;
}
