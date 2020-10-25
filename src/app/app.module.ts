import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MyApp } from './app.component';
import { Add_bankPage } from '../pages/add_bank/add_bank';
import { Contact_usPage } from '../pages/contact_us/contact_us';
import { HelpPage } from '../pages/help/help';
import { HomePage } from '../pages/home/home';
import { My_profilePage } from '../pages/my_profile/my_profile';
import { My_tripsPage } from '../pages/my_trips/my_trips';
import { Promo_codePage } from '../pages/promo_code/promo_code';
import { Rate_ridePage } from '../pages/rate_ride/rate_ride';
import { ReviewsPage } from '../pages/reviews/reviews';
import { Trip_infoPage } from '../pages/trip_info/trip_info';
import { InsightPage } from '../pages/insight/insight';
import { SigninPage } from '../pages/signin/signin';
import { SignupPage } from '../pages/signup/signup';
import { VerificationPage } from '../pages/verification/verification';
import { WalletPage } from '../pages/wallet/wallet';
import { ManagelanguagePage } from '../pages/managelanguage/managelanguage';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { OneSignal } from '@ionic-native/onesignal';
import { Network } from '@ionic-native/network';
import { File } from '@ionic-native/file';
import { ImagePicker } from '@ionic-native/image-picker';
import { Crop } from '@ionic-native/crop';
import { BaseAppConfig, APP_CONFIG } from './app.config';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Geolocation } from '@ionic-native/geolocation';
import { GoogleMaps } from '../providers/google-maps';
import { Connectivity } from '../providers/connectivity-service';
import { CallNumber } from '@ionic-native/call-number';
import { Clipboard } from '@ionic-native/clipboard';
import { SocialSharing } from '@ionic-native/social-sharing';
import { BankTransfer } from '../pages/banktransfer/banktransfer';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { InAppBrowser } from '@ionic-native/in-app-browser';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
@NgModule({
  declarations: [
    MyApp,
    Add_bankPage,
    Contact_usPage,
    HelpPage,
    HomePage,
    My_profilePage,
    My_tripsPage,
    Promo_codePage,
    Rate_ridePage,
    ReviewsPage,
    Trip_infoPage,
    SigninPage,
    SignupPage,
    VerificationPage,
    WalletPage,
    InsightPage,
    ManagelanguagePage,
    BankTransfer
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    Add_bankPage,
    Contact_usPage,
    HelpPage,
    HomePage,
    My_profilePage,
    My_tripsPage,
    Promo_codePage,
    Rate_ridePage,
    ReviewsPage,
    Trip_infoPage,
    SigninPage,
    SignupPage,
    VerificationPage,
    WalletPage,
    InsightPage,
    ManagelanguagePage,
    BankTransfer
  ],
  providers: [
    StatusBar,
    SplashScreen,
    OneSignal,
    Network,
    File,
    ImagePicker,
    Crop,
    Diagnostic,
    Geolocation,
    GoogleMaps,
    Connectivity,
    CallNumber,
    Clipboard,
    SocialSharing,
    LocationAccuracy, InAppBrowser,
    { provide: APP_CONFIG, useValue: BaseAppConfig },
    { provide: ErrorHandler, useClass: IonicErrorHandler }
  ]
})
export class AppModule { }
