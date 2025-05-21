import { Component, inject, OnInit } from '@angular/core';
import { MessageService } from '../../../services/message.service';
import { ConversationService } from '../../../services/conversation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chatbot',
  standalone: false,
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css'
})
export class ChatbotComponent implements OnInit {

  private messageService = inject( MessageService )
  private conversationService = inject( ConversationService )

  private subscriptions = new Subscription();

  ngOnInit(): void {
    // const conversationSub = this.
  }


}
