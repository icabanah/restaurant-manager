import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import { initializeApp } from 'firebase/app';
import { provideAnimations } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideIonicAngular(),
    provideAnimations(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    {
      provide: 'LOCALE_ID',
      useValue: 'es'
    }
  ]
};