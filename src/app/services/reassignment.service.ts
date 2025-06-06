import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Reassignment } from '../interfaces/reassignment.interface';


@Injectable({
  providedIn: 'root'
})
export class ReassignmentService {

  private http: HttpClient = inject( HttpClient );

  // Define the base URL for your reassignment API endpoint
  // Make sure this matches your backend API route for reassignments
  private reassignmentUrl: string = 'http://127.0.0.1:8000/reassignments/'; // Example URL

  /**
   * Fetches all reassignment requests from the API.
   * @returns An Observable that emits an array of Reassignment objects.
   */
  public getReassignments(): Observable<Reassignment[]> {
    return this.http.get<Reassignment[]>(this.reassignmentUrl);
  }

  /**
   * Fetches the reassignments of a user
   * @param id. The id of the user..
   * @returns An Observable that emits an array of Reassignment objects.
   */
  public getReassignmentByUser(id: number): Observable<Reassignment[]> {
    return this.http.get<Reassignment[]>(`${this.reassignmentUrl}?requesting_worker_id=${id}`);
  }

  /**
   * Adds a new reassignment request to the API.
   * @param reassignment The Reassignment object to be added.
   * @returns An Observable that emits the newly created Reassignment object.
   */
  public addReassignment( reassignment: Reassignment ): Observable<Reassignment> {
    return this.http.post<Reassignment>(this.reassignmentUrl, reassignment);
  }

  /**
   * Edits an existing reassignment request by its ID.
   * @param id The ID of the reassignment request to edit.
   * @param reassignment The updated Reassignment object.
   * @returns An Observable that emits the updated Reassignment object.
   */
  public editReassignment(id: number, reassignment: Reassignment): Observable<Reassignment> {
    // Construct the URL for the specific reassignment request using its ID
    const url = `${this.reassignmentUrl}${id}/`;
    // Use the HTTP PUT method to send the updated reassignment object to the URL
    return this.http.put<Reassignment>(url, reassignment);
  }

  /**
   * Deletes a reassignment request by its ID.
   * @param id The ID of the reassignment request to delete.
   * @returns An Observable that emits an empty object upon successful deletion.
   */
  public deleteReassignment(id: number): Observable<any> {
    const url = `${this.reassignmentUrl}${id}/`;
    return this.http.delete(url);
  }
}
