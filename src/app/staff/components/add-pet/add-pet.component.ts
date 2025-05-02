import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { UserInfoService } from '../../../services/user-info.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-pet',
  standalone: false,
  templateUrl: './add-pet.component.html',
  styleUrl: './add-pet.component.css'
})
export class AddPetComponent implements OnDestroy{

  private userInfoService = inject( UserInfoService )

  private subscriptions = new Subscription()

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
