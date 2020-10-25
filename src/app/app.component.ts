import { Component, ViewChild, Inject } from '@angular/core';
import { Nav, Platform, Events, AlertController, App } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { SigninPage } from '../pages/signin/signin';
import { HomePage } from '../pages/home/home';
import { My_profilePage } from '../pages/my_profile/my_profile';
import { My_tripsPage } from '../pages/my_trips/my_trips';
import { WalletPage } from '../pages/wallet/wallet';
import { ReviewsPage } from '../pages/reviews/reviews';
import { Promo_codePage } from '../pages/promo_code/promo_code';
import { HelpPage } from '../pages/help/help';
import { InsightPage } from '../pages/insight/insight';
import { Contact_usPage } from '../pages/contact_us/contact_us';
import { TranslateService } from '../../node_modules/@ngx-translate/core';
import { ClientService } from '../providers/client.service';
import { APP_CONFIG, AppConfig } from './app.config';
import { OneSignal } from '@ionic-native/onesignal';
import { Constants } from '../models/constants.models';
import { MyNotification } from '../models/notification.models';
import { Profile } from '../models/profile.models';
import { CommonUiElement } from '../providers/app.commonelements';
import { Ride } from '../models/ride.models';
import { ManagelanguagePage } from '../pages/managelanguage/managelanguage';
import { User } from '../models/user.models';
import { Rate_ridePage } from '../pages/rate_ride/rate_ride';
import { ProfileUpdateRequest } from '../models/profile-update-request.models';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser';
import firebase from 'firebase';
import moment from 'moment';

@Component({
  templateUrl: 'app.html',
  providers: [ClientService, CommonUiElement]
})
export class MyApp {
  @ViewChild(Nav) private nav: Nav;
  private profileMe: Profile;
  private rtlSide: string = "left";
  private rideRef: any;

  private userToUse: User;
  private tokenToUse: string;
  private pushedForReview: any;

  constructor(@Inject(APP_CONFIG) private config: AppConfig, private platform: Platform, private cue: CommonUiElement, private app: App,
    private events: Events, private oneSignal: OneSignal, private alertCtrl: AlertController,
    private translate: TranslateService, private statusBar: StatusBar, private splashScreen: SplashScreen,
    private clientService: ClientService, public inAppBrowser: InAppBrowser) {
    this.initializeApp();
    this.refreshSettings();
    events.subscribe('language:selection', (language) => {
      this.globalize(language);
      clientService.updateUser(window.localStorage.getItem(Constants.KEY_TOKEN), { language: language }).subscribe(res => {
        console.log(res);
      }, err => {
        console.log('update_user', err);
      });
    });
    events.subscribe('pushrate', (ride) => {
      if (ride && ride.id) {
        if (!(this.nav.getActive() && this.nav.getActive().instance instanceof Rate_ridePage)
          &&
          (!this.pushedForReview || this.pushedForReview.id != ride.id)) {
          this.pushedForReview = ride;
          this.nav.push(Rate_ridePage, { ride: ride });
        }
      }
    });
    events.subscribe("event:profile", (res) => {
      if (res && res.user) {
        if (!res.user.ratings) res.user.ratings = 0;
        res.user.ratings = Number(res.user.ratings.toFixed(1));
      }
      this.profileMe = res;
      if (this.platform.is('cordova') && this.profileMe) this.updatePlayerId();
      if (this.profileMe) this.registerRideUpdates();
    });
    events.subscribe('check:profile', resLogin => {
      this.translate.get('verifying_profile').subscribe(value => {
        this.cue.presentLoading(value);
        this.clientService.profile(resLogin.token).subscribe(resProfile => {
          this.cue.dismissLoading();
          if (resProfile.vehicle_type_id && resProfile.vehicle_type && resProfile.vehicle_details.length) {
            window.localStorage.setItem(Constants.KEY_USER, JSON.stringify(resLogin.user));
            window.localStorage.setItem(Constants.KEY_TOKEN, resLogin.token);
            window.localStorage.setItem(Constants.KEY_PROFILE, JSON.stringify(resProfile));
            if (resProfile && resLogin.user) {
              if (!resLogin.user.ratings) resLogin.user.ratings = 0;
              resLogin.user.ratings = Number(resLogin.user.ratings.toFixed(1));
            }
            events.publish("event:profile", resProfile);
            this.app.getRootNav().setRoot(HomePage);
          } else {
            this.translate.get('create_profile').subscribe(value => this.cue.showToast(value));
            this.tokenToUse = resLogin.token;
            this.userToUse = resLogin.user;
            this.app.getRootNav().push(My_profilePage, { token: resLogin.token, user: resLogin.user });
          }
          console.log("resProfile", resProfile);
        }, err => {
          this.cue.dismissLoading();
          console.log("profile", err);
          this.translate.get('something_went_wrong').subscribe(value => this.cue.showToast(value));
        });
      });
    });
  }

  getSuitableLanguage(language) {
    window.localStorage.setItem("locale", language);
    language = language.substring(0, 2).toLowerCase();
    console.log('check for: ' + language);
    return this.config.availableLanguages.some(x => x.code == language) ? language : 'en';
  }

  refreshSettings() {
    this.clientService.getSettings().subscribe(res => {
      console.log('setting_setup_success', res);
      window.localStorage.setItem(Constants.KEY_SETTING, JSON.stringify(res));
    }, err => {
      console.log('setting_setup_error', err);
    });
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.show();
      firebase.initializeApp({
        apiKey: this.config.firebaseConfig.apiKey,
        authDomain: this.config.firebaseConfig.authDomain,
        databaseURL: this.config.firebaseConfig.databaseURL,
        projectId: this.config.firebaseConfig.projectId,
        storageBucket: this.config.firebaseConfig.storageBucket,
        messagingSenderId: this.config.firebaseConfig.messagingSenderId
      });
      this.profileMe = JSON.parse(window.localStorage.getItem(Constants.KEY_PROFILE));
      if (this.profileMe && this.profileMe.user) {
        if (!this.profileMe.user.ratings) this.profileMe.user.ratings = 0;
        this.profileMe.user.ratings = Number(this.profileMe.user.ratings.toFixed(1));
      }
      if (this.platform.is('cordova')) this.initOneSignal();

      setTimeout(() => {
        this.splashScreen.hide();
        this.nav.setRoot(this.profileMe ? HomePage : SigninPage);
        if (this.platform.is('cordova') && this.profileMe) this.updatePlayerId();
        if (this.profileMe) this.registerRideUpdates();
        this.clientService.logActivity(window.localStorage.getItem(Constants.KEY_TOKEN)).subscribe(res => console.log('logActivity', res), err => console.log('logActivity', err));
      }, 3000);

      let defaultLang = window.localStorage.getItem(Constants.KEY_DEFAULT_LANGUAGE);
      this.globalize(defaultLang);
    });
  }

  menuOpened() {
    if (this.profileMe) {
      this.clientService.getUser(window.localStorage.getItem(Constants.KEY_TOKEN)).subscribe(res => {
        if (res) {
          if (!res.ratings) res.ratings = 0;
          res.ratings = Number(res.ratings.toFixed(1));
        }
        console.log('getUser', res);
        this.profileMe.user = res;
        window.localStorage.setItem(Constants.KEY_PROFILE, JSON.stringify(this.profileMe));
      }, err => {
        console.log('getUser', err);
      });
    }
  }

  registerRideUpdates() {
    const component = this;
    if (this.rideRef == null) {
      this.rideRef = firebase.database().ref("driver").child(String(this.profileMe.id)).child("ride");
      this.rideRef.on('value', function (data) {
        let ride = data.val() as Ride;
        if (!(component.nav.getActive() && component.nav.getActive().instance instanceof HomePage)) {
          component.home();
          setTimeout(() => {
            if (component.profileMe) component.events.publish("ride:value", ride);
          }, 200);
        } else {
          if (component.profileMe) component.events.publish("ride:value", ride);
        }
      });
    }
  }

  updatePlayerId() {
    this.oneSignal.getIds().then((id) => {
      if (id && id.userId) {
        let defaultLang = window.localStorage.getItem(Constants.KEY_DEFAULT_LANGUAGE);
        this.clientService.updateUser(window.localStorage.getItem(Constants.KEY_TOKEN), {
          fcm_registration_id_driver: id.userId,
          language: (defaultLang && defaultLang.length) ? defaultLang : "en"
        }).subscribe(res => {
          console.log(res);
        }, err => {
          console.log('update_user', err);
        });
      }
    });
  }

  globalize(languagePriority) {
    let defaultLangCode = this.config.availableLanguages[0].code;
    this.translate.setDefaultLang("en");
    this.translate.use(languagePriority && languagePriority.length ? languagePriority : defaultLangCode);
    this.setDirectionAccordingly(languagePriority && languagePriority.length ? languagePriority : defaultLangCode);
  }

  setDirectionAccordingly(lang: string) {
    switch (lang) {
      case 'ar': {
        this.platform.setDir('ltr', false);
        this.platform.setDir('rtl', true);
        this.rtlSide = "right";
        break;
      }
      case 'iw': {
        this.platform.setDir('ltr', false);
        this.platform.setDir('rtl', true);
        this.rtlSide = "right";
        break;
      }
      default: {
        this.platform.setDir('rtl', false);
        this.platform.setDir('ltr', true);
        this.rtlSide = "left";
        break;
      }
    }
    // this.translate.use('ar');
    // this.platform.setDir('ltr', false);
    // this.platform.setDir('rtl', true);
  }

  initOneSignal() {
    if (this.config.oneSignalAppId && this.config.oneSignalAppId.length && this.config.oneSignalGPSenderId && this.config.oneSignalGPSenderId.length) {
      this.oneSignal.startInit(this.config.oneSignalAppId, this.config.oneSignalGPSenderId);
      this.oneSignal.inFocusDisplaying(this.oneSignal.OSInFocusDisplayOption.Notification);
      this.oneSignal.handleNotificationReceived().subscribe((data) => {
        console.log(data);
        let notifications: Array<MyNotification> = JSON.parse(window.localStorage.getItem(Constants.KEY_NOTIFICATIONS));
        if (!notifications) notifications = new Array<MyNotification>();
        notifications.push(new MyNotification(data.payload.title, data.payload.body, moment().format("DD MMM YYYY")));
        window.localStorage.setItem(Constants.KEY_NOTIFICATIONS, JSON.stringify(notifications));
        let noti_ids_processed: Array<string> = JSON.parse(window.localStorage.getItem("noti_ids_processed"));
        if (!noti_ids_processed) noti_ids_processed = new Array<string>();
        noti_ids_processed.push(data.payload.notificationID);
        window.localStorage.setItem("noti_ids_processed", JSON.stringify(noti_ids_processed));
      });
      this.oneSignal.handleNotificationOpened().subscribe((data) => {
        let noti_ids_processed: Array<string> = JSON.parse(window.localStorage.getItem("noti_ids_processed"));
        if (!noti_ids_processed) noti_ids_processed = new Array<string>();
        let index = noti_ids_processed.indexOf(data.notification.payload.notificationID);
        if (index == -1) {
          let notifications: Array<MyNotification> = JSON.parse(window.localStorage.getItem(Constants.KEY_NOTIFICATIONS));
          if (!notifications) notifications = new Array<MyNotification>();
          notifications.push(new MyNotification(data.notification.payload.title, data.notification.payload.body, moment().format("DD MMM YYYY")));
          window.localStorage.setItem(Constants.KEY_NOTIFICATIONS, JSON.stringify(notifications));
        } else {
          noti_ids_processed.splice(index, 1);
          window.localStorage.setItem("noti_ids_processed", JSON.stringify(noti_ids_processed));
        }
      });
      this.oneSignal.endInit();
    }
  }

  createProfile() {
    if (!(this.nav.getActive() && this.nav.getActive().instance instanceof My_profilePage))
      this.nav.push(My_profilePage, { token: this.tokenToUse, user: this.userToUse });
  }
  home() {
    if (!(this.nav.getActive() && this.nav.getActive().instance instanceof HomePage))
      this.nav.setRoot(HomePage);
  }
  my_profile() {
    if (!(this.nav.getActive() && this.nav.getActive().instance instanceof My_profilePage))
      this.nav.setRoot(My_profilePage, { profileMe: this.profileMe });
  }
  my_trips() {
    if (!(this.nav.getActive() && this.nav.getActive().instance instanceof My_tripsPage))
      this.nav.setRoot(My_tripsPage);
  }
  wallet() {
    if (!(this.nav.getActive() && this.nav.getActive().instance instanceof WalletPage))
      this.nav.setRoot(WalletPage);
  }
  reviews() {
    if (!(this.nav.getActive() && this.nav.getActive().instance instanceof ReviewsPage))
      this.nav.setRoot(ReviewsPage);
  }
  promo_code() {
    if (!(this.nav.getActive() && this.nav.getActive().instance instanceof Promo_codePage))
      this.nav.setRoot(Promo_codePage);
  }
  help() {
    if (!(this.nav.getActive() && this.nav.getActive().instance instanceof HelpPage))
      this.nav.setRoot(HelpPage);
  }
  contact_us() {
    if (!(this.nav.getActive() && this.nav.getActive().instance instanceof Contact_usPage))
      this.nav.setRoot(Contact_usPage);
  }
  insight() {
    if (!(this.nav.getActive() && this.nav.getActive().instance instanceof InsightPage))
      this.nav.setRoot(InsightPage);
  }
  managelanguage() {
    if (!(this.nav.getActive() && this.nav.getActive().instance instanceof ManagelanguagePage))
      this.nav.setRoot(ManagelanguagePage);
  }
  alertLogout() {
    this.translate.get(['logout_title', 'logout_message', 'no', 'yes']).subscribe(text => {
      let alert = this.alertCtrl.create({
        title: text['logout_title'],
        message: text['logout_message'],
        buttons: [{
          text: text['no'],
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }, {
          text: text['yes'],
          handler: () => {
            this.logout();
          }
        }]
      });
      alert.present();
    });
  }
  logout() {
    this.translate.get("just_moment").subscribe(value => {
      this.cue.presentLoading(value);

      let profileRequest = new ProfileUpdateRequest();
      profileRequest.is_online = 0;
      this.clientService.updateProfile(window.localStorage.getItem(Constants.KEY_TOKEN), profileRequest).subscribe(res => {
        this.cue.dismissLoading();
        window.localStorage.removeItem(Constants.KEY_USER);
        window.localStorage.removeItem(Constants.KEY_PROFILE);
        window.localStorage.removeItem(Constants.KEY_TOKEN);
        this.profileMe = null;
        if (this.rideRef) {
          this.rideRef.off("value");
          this.rideRef = null;
        }
        this.app.getRootNav().setRoot(SigninPage);
      }, err => {
        this.cue.dismissLoading();
        console.log("profile_update_err", err);
        window.localStorage.removeItem(Constants.KEY_USER);
        window.localStorage.removeItem(Constants.KEY_PROFILE);
        window.localStorage.removeItem(Constants.KEY_TOKEN);
        this.profileMe = null;
        if (this.rideRef) {
          this.rideRef.off("value");
          this.rideRef = null;
        }
        this.app.getRootNav().setRoot(SigninPage);
      });
    });
  }
  developedBy() {
    const options: InAppBrowserOptions = {
      zoom: 'no'
    }
    const browser = this.inAppBrowser.create('https://verbosetechlabs.com/', '_system', options);
  }
}
