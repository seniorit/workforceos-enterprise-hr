import { 
  Component, 
  ChangeDetectionStrategy, 
  inject, 
  input, 
  output, 
  signal, 
  effect, 
  HostListener 
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-modal.html',
})
export class ProfileModalComponent {
  public auth = inject(AuthService);
  private fb = inject(FormBuilder);

  public isOpen = input<boolean>(false);
  public closeModal = output<void>();
  public saved = output<void>();

  public isSaving = signal<boolean>(false);
  public successMessage = signal<string | null>(null);
  public errorMessage = signal<string | null>(null);

  public profileForm: FormGroup = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    title: [''],
    department: [''],
    phone: [''],
    bio: ['', [Validators.maxLength(300)]],
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const user = this.auth.currentUser();
        if (user) {
          this.profileForm.patchValue({
            displayName: user.displayName || '',
            title: user.title || '',
            department: user.department || '',
            phone: user.phone || '',
            bio: user.bio || '',
          });
        }
        this.successMessage.set(null);
        this.errorMessage.set(null);
      }
    });
  }

  @HostListener('document:keydown.escape')
  public onEscapeKey() {
    if (this.isOpen() && !this.isSaving()) {
      this.closeModal.emit();
    }
  }

  public get bioLength(): number {
    return (this.profileForm.get('bio')?.value || '').length;
  }

  public handleBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('backdrop-container') && !this.isSaving()) {
      this.closeModal.emit();
    }
  }

  public async onSubmit() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const val = this.profileForm.value;
      await this.auth.updateUserProfileData({
        displayName: val.displayName,
        title: val.title,
        department: val.department,
        phone: val.phone,
        bio: val.bio,
      });

      this.successMessage.set('Perfil actualizado exitosamente en Firestore');
      this.saved.emit();

      setTimeout(() => {
        this.successMessage.set(null);
        this.closeModal.emit();
      }, 1200);
    } catch (err: unknown) {
      console.error('Error syncing profile with Firestore:', err);
      this.errorMessage.set('Ocurrió un error al guardar en Firestore. Intenta de nuevo.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
