import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Trip_infoPage } from '../trip_info/trip_info';
import { ClientService } from '../../providers/client.service';
import { CommonUiElement } from '../../providers/app.commonelements';
import { Subscription } from 'rxjs/Subscription';
import { Ride } from '../../models/ride.models';
import { TranslateService } from '@ngx-translate/core';
import { Helper } from '../../models/helper.models';
import { Constants } from '../../models/constants.models';

@Component({
  selector: 'page-my_trips',
  templateUrl: 'my_trips.html',
  providers: [ClientService, CommonUiElement]
})
export class My_tripsPage {
  private subscriptions: Array<Subscription> = [];
  private rides = new Array<Ride>();
  private doneAll = false;
  private isLoading = true;
  private pageNo = 1;
  private infiniteScroll: any;
  private currency: string;

  constructor(private navCtrl: NavController, private service: ClientService,
    private cue: CommonUiElement, private translate: TranslateService) {
    this.currency = Helper.getSetting("currency");
    this.translate.get("loading").subscribe(value => {
      this.cue.presentLoading(value);
      this.loadRides();
    });
  }

  ionViewWillLeave() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
    this.cue.dismissLoading();
  }

  loadRides() {
    this.isLoading = true;
    this.subscriptions.push(this.service.myRides(window.localStorage.getItem(Constants.KEY_TOKEN), this.pageNo).subscribe(res => {
      this.rides = this.rides.concat(res.data);
      this.isLoading = false;
      this.doneAll = (!res.data || !res.data.length);
      if (this.infiniteScroll) {
        this.infiniteScroll.complete();
      }
      this.cue.dismissLoading();
    }, err => {
      this.isLoading = false;
      if (this.infiniteScroll) {
        this.infiniteScroll.complete();
      }
      this.cue.dismissLoading();
      console.log('myRides', err);
    }));
  }

  doInfinite(infiniteScroll: any) {
    if (this.doneAll) {
      infiniteScroll.complete();
    } else {
      this.infiniteScroll = infiniteScroll;
      this.pageNo = this.pageNo + 1;
      this.loadRides();
    }
  }

  tripInfo(ride) {
    this.navCtrl.push(Trip_infoPage, { ride: ride });
  }

}
