// services/vote.service.ts
import { Injectable } from '@angular/core';

/**
 * @interface VoteEntry
 * @description Representa una entrada de voto individual con el correo electrónico del votante y el tipo de voto.
 */
interface VoteEntry {
  email: string;
  type: 'up' | 'down';
}

@Injectable({
  providedIn: 'root'
})
export class VoteService {

  constructor() { }

  /**
   * @method parseVotedEmails
   * @description Analiza una cadena de correos electrónicos votados y sus tipos, separados por comas, en un array de objetos `VoteEntry`.
   * @param {string} votedEmailsStr - La cadena que contiene los correos electrónicos votados (ej: "email1:up,email2:down").
   * @returns {VoteEntry[]} Un array de objetos, cada uno conteniendo un correo electrónico y un tipo de voto ('up' o 'down').
   */
  public parseVotedEmails(votedEmailsStr: string | undefined): VoteEntry[] {
    if (!votedEmailsStr) {
      return [];
    }
    return votedEmailsStr.split(',').map(entry => {
      const parts = entry.split(':');
      // Asegúrate de que ambas partes existan antes de crear el objeto
      return { email: parts[0], type: parts[1] as 'up' | 'down' };
    }).filter(entry => entry.email && entry.type); // Filtra cualquier entrada mal formada
  }

  /**
   * @method serializeVotedEmails
   * @description Serializa un array de objetos `VoteEntry` de nuevo en una cadena separada por comas.
   * @param {VoteEntry[]} votedEmailsArr - Un array de objetos `VoteEntry`.
   * @returns {string} Una cadena separada por comas de correos electrónicos votados y sus tipos.
   */
  public serializeVotedEmails(votedEmailsArr: VoteEntry[]): string {
    return votedEmailsArr.map(entry => `${entry.email}:${entry.type}`).join(',');
  }

  /**
   * @method getUserVoteType
   * @description Determina si un usuario específico ha votado en una respuesta y devuelve su tipo de voto.
   * @param {string} currentUserEmail - El correo electrónico del usuario actualmente logueado.
   * @param {string | undefined} votedEmailsStr - La cadena original de todos los correos electrónicos votados para una respuesta dada.
   * @returns {'up' | 'down' | null} El tipo de voto ('up' o 'down') si el usuario ha votado, de lo contrario `null`.
   */
  public getUserVoteType(currentUserEmail: string, votedEmailsStr: string | undefined): 'up' | 'down' | null {
    if (!currentUserEmail || !votedEmailsStr) {
      return null;
    }
    const votedEmailsArr = this.parseVotedEmails(votedEmailsStr);
    const userVote = votedEmailsArr.find(v => v.email === currentUserEmail);
    return userVote ? userVote.type : null;
  }
}
