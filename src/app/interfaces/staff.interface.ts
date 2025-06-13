export interface Staff {
  pk?:                number;
  name:              string;
  email:             string;
  dni:               string;
  phone:             string;
  registration_date?: Date;
  role:              string;
  assigned_clients:  number[];
  password:          string;
  photo?:             string;
}
