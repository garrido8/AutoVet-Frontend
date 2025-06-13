export interface Answer {
  id?:          number;
  time:        Date;
  content:     string;
  keywords:    string;
  votes:       number;
  votedEmails: string;
  userEmail:   string;
  topAnswer:   boolean;
}
