import { Component, ViewChild, ElementRef, Inject } from '@angular/core';
import { NavController, AlertController, Events, App } from 'ionic-angular';
import { ClientService } from '../../providers/client.service';
import { Constants } from '../../models/constants.models';
import { Profile } from '../../models/profile.models';
import { CommonUiElement } from '../../providers/app.commonelements';
import { Subscription } from 'rxjs/Subscription';
import { ProfileUpdateRequest } from '../../models/profile-update-request.models';
import { TranslateService } from '@ngx-translate/core';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Geolocation } from '@ionic-native/geolocation';
import { Ride } from '../../models/ride.models';
import { GoogleMaps } from '../../providers/google-maps';
import { Helper } from '../../models/helper.models';
import { CallNumber } from '@ionic-native/call-number';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { AppConfig, APP_CONFIG } from '../../app/app.config';
import * as firebase from 'firebase/app';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [ClientService, CommonUiElement]
})
export class HomePage {
  @ViewChild('map') private mapElement: ElementRef;
  @ViewChild('pleaseConnect') private pleaseConnect: ElementRef;
  private fabAction = false;
  private fabRideInfo = false;
  private profile = new Profile();
  private subscriptions: Array<Subscription> = [];
  private watchLocationIntervalId;
  private pendingTimerIntervalId;
  private lookupTimeLimit: number;
  private rideRef: firebase.database.Reference;
  private locationRef: firebase.database.Reference;
  private ride: Ride;
  private initializedMap: boolean;
  private timerText: string;
  private markerMe: google.maps.Marker;
  private markerRide: google.maps.Marker;
  private directionsDisplay: any;
  private currency: string;
  private distanceUnit: string;
  private centerMeOld: any;

  constructor(@Inject(APP_CONFIG) private config: AppConfig, navCtrl: NavController, private alertCtrl: AlertController, private locationAccuracy: LocationAccuracy,
    private translate: TranslateService, private maps: GoogleMaps, private events: Events, private app: App,
    private service: ClientService, private cue: CommonUiElement, private diagnostic: Diagnostic,
    private geolocation: Geolocation, private callNumber: CallNumber, public inAppBrowser: InAppBrowser) {
    this.events.subscribe("ride:value", (rideIn) => {
      console.log("rideIn", JSON.stringify(rideIn));
      this.ride = rideIn;
      this.rideValidate();
      if (this.ride && this.ride.status != 'pending') {
        this.plotRide();
      }
      if (this.ride && (this.ride.status == 'cancelled' || this.ride.status == 'rejected' || this.ride.status == 'complete')) {
        this.translate.get(this.ride.status).subscribe(value => this.cue.showToast(value));
        if (this.ride.status == 'complete') {
          this.events.publish("pushrate", this.ride);
        }
        this.ride = null;
        this.rideRef.set(null);
        this.clearMapRide();
      }
    });
  }

  ionViewWillLeave() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
    if (this.watchLocationIntervalId) {
      clearInterval(this.watchLocationIntervalId);
      this.watchLocationIntervalId = null;
    }
    this.cue.dismissLoading();
  }

  ionViewDidLoad(): void {
    if (!this.initializedMap) {
      let mapLoaded = this.maps.init(this.mapElement.nativeElement, this.pleaseConnect.nativeElement).then(() => {
        // this.maps.map.addListener('click', (event) => {
        //   if (event && event.latLng) {
        //     this.onMapClick(new google.maps.LatLng(event.latLng.lat(), event.latLng.lng()));
        //   }
        // });
        this.initializedMap = true;
        //this.detect();
      }).catch(err => {
        console.log(err);
        //this.close();
      });
      mapLoaded.catch(err => {
        console.log(err);
        //this.close();
      });
    }
  }

  ionViewDidEnter() {
    let profileMe = JSON.parse(window.localStorage.getItem(Constants.KEY_PROFILE));
    if (profileMe) {
      this.profile = profileMe;
      if (this.profile.is_online == 1) {
        this.tryLocationUpdate();
      } else {
        if (this.watchLocationIntervalId) {
          clearInterval(this.watchLocationIntervalId);
          this.watchLocationIntervalId = null;
        }
      }

      if (!this.rideRef) this.rideRef = firebase.database().ref("driver").child(String(profileMe.id)).child("ride");
      if (!this.locationRef) this.locationRef = firebase.database().ref("driver").child(String(profileMe.id)).child("location");
    }
  }

  rideValidate() {
    this.subscriptions.push(this.service.getRide(window.localStorage.getItem(Constants.KEY_TOKEN)).subscribe(res => {
      this.cue.dismissLoading();
      console.log("getRide", res);
      this.ride = res;
      this.plotRide();
      if (this.ride.status == 'pending') {
        this.rideTimerPending();
      } else {
        this.rideTimerPendingCancel();
      }
    }, err => {
      if (this.ride) {
        this.ride = null;
        this.rideRef.set(null);
        this.clearMapRide();
      }
      this.cue.dismissLoading();
      console.log("getRide", err);
    }));
  }

  tryLocationUpdate() {
    this.diagnostic.isLocationEnabled().then((isAvailable) => {
      if (!isAvailable) this.alertLocationServices();
    }).catch((e) => {
      console.error(e);
      this.alertLocationServices();
    });
    this.watchLocation();
  }

  rideTimerPending() {
    this.rideTimerPendingCancel();
    this.lookupTimeLimit = (Number(Helper.getSetting("ride_accept_minutes_limit")) * 60000);
    if (this.lookupTimeLimit && this.lookupTimeLimit > 0)
      this.pendingTimerIntervalId = setInterval(() => {
        this.lookupTimeLimit = this.lookupTimeLimit - 1000;
        if (this.lookupTimeLimit == 0) {
          this.rideTimerPendingCancel();
        } else {
          this.timerText = this.formatMinsSecs(this.lookupTimeLimit);
        }
      }, 1000);
  }

  formatMinsSecs(millis: number): string {
    let minutes = Math.floor(millis / 60000);
    let seconds = (millis % 60000) / 1000;
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
  }

  rideTimerPendingCancel() {
    if (this.pendingTimerIntervalId) {
      clearInterval(this.pendingTimerIntervalId);
      this.pendingTimerIntervalId = null;
    }
  }

  toggleOnline() {
    this.fabAction = false;
    this.translate.get('just_moment').subscribe(value => {
      this.cue.presentLoading(value);
      let profileRequest = new ProfileUpdateRequest();
      profileRequest.is_online = this.profile.is_online == 1 ? 0 : 1;
      this.subscriptions.push(this.service.updateProfile(window.localStorage.getItem(Constants.KEY_TOKEN), profileRequest).subscribe(res => {
        this.profile = res;
        window.localStorage.setItem(Constants.KEY_PROFILE, JSON.stringify(res));
        this.cue.dismissLoading();
        if (this.profile.is_online == 1) {
          this.tryLocationUpdate();
        } else {
          if (this.watchLocationIntervalId) {
            clearInterval(this.watchLocationIntervalId);
            this.watchLocationIntervalId = null;
          }
        }
      }, err => {
        this.cue.dismissLoading();
        console.log("profile_update_err", err);
      }));
    });
  }

  toggleFab() {
    this.fabAction = !this.fabAction;
  }

  toggleRideFab() {
    this.fabRideInfo = !this.fabRideInfo;
  }

  callUser() {
    this.callNumber.callNumber(this.ride.user.mobile_number, true)
      .then(res => console.log('Launched dialer!', res))
      .catch(err => console.log('Error launching dialer', err));
  }

  confirmRejectRide() {
    this.translate.get(['reject', 'reject_ride_message', 'no', 'yes']).subscribe(text => {
      let alert = this.alertCtrl.create({
        title: text['reject'],
        message: text['reject_ride_message'],
        buttons: [{
          text: text['no'],
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }, {
          text: text['yes'],
          handler: () => {
            this.updateRideStatus("rejected");
          }
        }]
      });
      alert.present();
    });
  }

  navigate() {
    let latLngComma = null;
    if (this.ride) {
      latLngComma = this.ride.status == "ongoing" ? (this.ride.latitude_to + "," + this.ride.longitude_to) : (this.ride.latitude_from + "," + this.ride.longitude_from);
      if (latLngComma)
        window.open("https://maps.google.com/?q=" + latLngComma, "_system");
    }
  }

  updateRide() {
    if (this.ride && this.ride.status) {
      let toUpdate: string = null;
      switch (this.ride.status) {
        case "pending": {
          toUpdate = "accepted";
          break;
        }
        case "accepted": {
          toUpdate = "onway";
          break;
        }
        case "onway": {
          toUpdate = "ongoing";
          break;
        }
        case "ongoing": {
          toUpdate = "complete";
          break;
        }
      }
      if (toUpdate) this.updateRideStatus(toUpdate);
    }
  }

  updateRideStatus(status) {
    this.translate.get('just_moment').subscribe(value => {
      this.cue.presentLoading(value);
      this.subscriptions.push(this.service.rideUpdate(window.localStorage.getItem(Constants.KEY_TOKEN), this.ride.id, status).subscribe(res => {
        console.log(res);
        this.ride = res;
        this.plotRide();
        if (this.rideRef) this.rideRef.set(this.ride);
        this.cue.dismissLoading();
      }, err => {
        if (err && err.status && err.status == 404) {
          this.ride = null;
          this.rideRef.set(null);
          this.clearMapRide();
        }
        console.log('cancel_err', err);
        this.cue.dismissLoading();
      }));
    });
  }

  plotRide() {
    let settings = Helper.getSettings(["currency", "unit"]);
    if (settings && settings.length > 0) this.currency = settings[0];
    if (settings && settings.length > 1) this.distanceUnit = settings[1].toLowerCase();
    if (this.ride && this.ride.user) {
      if (!this.ride.user.ratings) this.ride.user.ratings = 0;
      this.ride.user.ratings = Number(this.ride.user.ratings.toFixed(1));
    }
    if (!this.ride || !this.ride.latitude_from || !this.ride.longitude_from || !this.ride.latitude_to || !this.ride.longitude_to)
      return;
    let centerRide = new google.maps.LatLng(Number(this.ride.status == "ongoing" ? this.ride.latitude_to : this.ride.latitude_from), Number(this.ride.status == "ongoing" ? this.ride.longitude_to : this.ride.longitude_from));
    if (!this.markerRide || !this.markerRide.getPosition().equals(centerRide)) {
      if (this.markerRide) {
        this.markerRide.setPosition(centerRide);
      } else {
        this.markerRide = new google.maps.Marker({
          position: centerRide,
          map: this.maps.map,
          title: 'Your Ride!',
          icon: 'assets/imgs/ic_loc_src.png'
        });
      }
      setTimeout(() => {
        this.maps.map.panTo(centerRide);
      }, 750);
      this.plotPolyline();
    }
  }

  clearMapRide() {
    if (this.directionsDisplay) {
      this.directionsDisplay.set('directions', null);
    }
  }

  watchLocation() {
    if (!this.watchLocationIntervalId) {
      this.watchLocationIntervalId = setInterval(() => {
        console.log("watchinglocation");
        const component = this;
        component.geolocation.getCurrentPosition({ enableHighAccuracy: true }).then((resp) => {
          console.log("CurrentPosition", resp);
          let pur = new ProfileUpdateRequest();
          pur.current_latitude = String(resp.coords.latitude);
          pur.current_longitude = String(resp.coords.longitude);

          let centerMeNew = new google.maps.LatLng(Number(pur.current_latitude), Number(pur.current_longitude));

          if (!component.centerMeOld || !component.centerMeOld.equals(centerMeNew)) {
            component.centerMeOld = centerMeNew;
            //onui
            window.localStorage.setItem(Constants.KEY_LOCATION, JSON.stringify({ lat: resp.coords.latitude, lng: resp.coords.longitude }));
            let updateRoute = false;
            if (component.markerMe) {
              if (!component.markerMe.getPosition().equals(centerMeNew)) {
                component.markerMe.setPosition(centerMeNew);
                updateRoute = true;
              }
            } else {
              updateRoute = true;
              component.markerMe = new google.maps.Marker({
                position: centerMeNew,
                map: component.maps.map,
                title: 'Your are here!',
                icon: 'assets/imgs/map_car_mini.png'
              });

              // let infoFood = new google.maps.InfoWindow({
              //   content: "Your order is here!"
              // });
              // component.markerMe.addListener('click', function () {
              //   infoFood.open(component.maps.map, component.markerMe);
              // });
            }
            if (updateRoute) {
              setTimeout(() => {
                component.maps.map.panTo(centerMeNew);
              }, 750);
            }
            //onfirebase
            if (component.locationRef) component.locationRef.set(pur).then(res => console.log("locationRef", res)).catch(err => console.log("locationRef", err));
            //onserver
            component.subscriptions.push(component.service.updateProfile(window.localStorage.getItem(Constants.KEY_TOKEN), pur).subscribe(res => {
              console.log(res);
            }, err => {
              console.log('updateProfile', err);
            }));
            //requestPolyline
            if (updateRoute) component.plotPolyline();
          }
        }).catch((error) => {
          component.translate.get("locating_unable").subscribe(value => component.cue.showToast(value));
          console.log("CurrentPosition", error);
        });
      }, 10000);
    }
  }

  plotPolyline() {
    const component = this;
    if (this.markerMe && this.markerRide) {
      if (!this.directionsDisplay) {
        this.directionsDisplay = new google.maps.DirectionsRenderer({
          map: this.maps.map,
          polylineOptions: {
            strokeColor: '#fdb036',
            strokeOpacity: 0.7,
            strokeWeight: 4
          },
          markerOptions: {
            opacity: 0,
            clickable: false,
            position: this.markerMe.getPosition()
          }
        });
      }
      let dirReq: any = {
        origin: this.markerMe.getPosition(),
        destination: this.markerRide.getPosition(),
        travelMode: google.maps.TravelMode.DRIVING
      };
      let directionsService = new google.maps.DirectionsService();
      directionsService.route(dirReq, function (result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          component.directionsDisplay.setDirections(result);
        }
      });
    }
  }

  alertLocationServices() {
    this.translate.get(['location_services_title', 'location_services_message', 'okay']).subscribe(text => {
      let alert = this.alertCtrl.create({
        title: text['location_services_title'],
        subTitle: text['location_services_message'],
        buttons: [{
          text: text['okay'],
          role: 'cancel',
          handler: () => {
            this.locationAccuracy.canRequest().then((canRequest: boolean) => {
              if (canRequest) {
                // the accuracy option will be ignored by iOS
                this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
                  () => console.log('Request successful'),
                  error => console.log('Error requesting location permissions', error)
                );
              }
            });
          }
        }]
      });
      alert.present();
    })
  }
  buyThisApp() {
    this.translate.get('opening_WhatsApp').subscribe(text => {
      this.cue.presentLoading(text);
      this.service.getWhatsappDetails().subscribe((res) => {
        this.cue.dismissLoading();
        return this.inAppBrowser.create(res['link'], '_system');
      }, (err) => {
        console.log("Error rating:", JSON.stringify(err));
        this.cue.dismissLoading();
      });
    });
  }
}
