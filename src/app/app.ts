import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from './shared/components/sidebar/sidebar';
import { AuthService } from './core/services/auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  public auth = inject(AuthService);
  private router = inject(Router);

  public isMobileMenuOpen = false;
  public isLoginPage = signal<boolean>(false);

  constructor() {
    if (typeof window !== 'undefined') {
      this.isLoginPage.set(window.location.pathname.includes('/login') || this.router.url.includes('/login'));
    }

    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects || event.url;
      this.isLoginPage.set(url.includes('/login'));
    });
  }

  public toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}

