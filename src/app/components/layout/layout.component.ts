import { Component, ViewChild } from '@angular/core';
import { FooterComponent } from '../footer/footer.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { RouterOutlet } from '@angular/router';
import { WelcomeComponent } from '../welcome/welcome.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [FooterComponent, RouterOutlet, NavbarComponent, WelcomeComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export default class LayoutComponent {
  @ViewChild(WelcomeComponent) welcomeComponent!: WelcomeComponent;

  onChatToggle() {
    if (this.welcomeComponent) {
      this.welcomeComponent.toggleChat();
    }
  }
}