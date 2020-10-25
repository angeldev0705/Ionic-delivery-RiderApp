import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { ClientService } from '../../providers/client.service';
import { CommonUiElement } from '../../providers/app.commonelements';
import { Ride } from '../../models/ride.models';
import { RateRequest } from '../../models/rate-request.models';
import { Subscription } from 'rxjs/Subscription';
import { TranslateService } from '@ngx-translate/core';
import { Helper } from '../../models/helper.models';
import { Constants } from '../../models/constants.models';

@Component({
  selector: 'page-rate_ride',
  templateUrl: 'rate_ride.html',
  providers: [ClientService, CommonUiElement]
})
export class Rate_ridePage {
  private ride: Ride;
  private rateRequest = new RateRequest();
  private subscriptions: Array<Subscription> = [];
  private currency: string;
  private distanceUnit: string;
  private rideTime: string;

  constructor(navParams: NavParams, private navCtrl: NavController,
    private service: ClientService, private cue: CommonUiElement, private translate: TranslateService) {
    this.ride = navParams.get("ride");

    if (this.ride.estimated_fare) this.ride.estimated_fare = Number(this.ride.estimated_fare.toFixed(2));
    if (this.ride.final_fare) this.ride.final_fare = Number(this.ride.final_fare.toFixed(2));
    if (this.ride.driver.vehicle_details && this.ride.driver.vehicle_details.length)
      this.ride.driver.vehicle_details_array = this.ride.driver.vehicle_details.split("|");
    if (!this.ride.user.ratings) this.ride.user.ratings = 0;
    this.ride.user.ratings = Number(Number(this.ride.user.ratings).toFixed(1));

    this.rateRequest.rating = 3;
    let settings = Helper.getSettings(["currency", "unit"]);
    if (settings && settings.length > 0) this.currency = settings[0];
    if (settings && settings.length > 1) this.distanceUnit = settings[1].toLowerCase();
    this.ride.estimated_distance = Number(Number(this.ride.estimated_distance).toFixed(1));
    this.rideTime = (this.ride.estimated_time > 59 ? (this.ride.estimated_time / 60).toFixed(1) : String(this.ride.estimated_time)) + " " + this.translate.instant(this.ride.estimated_time > 59 ? "hr" : "min");
  }

  setRating(rating) {
    this.rateRequest.rating = rating;
  }

  submitRating() {
    if (!this.rateRequest.review || !this.rateRequest.review.length) {
      this.translate.get("add_comment").subscribe(value => this.cue.showToast(value));
    } else {
      this.translate.get("submitting").subscribe(value => this.cue.showToast(value));
      let subscription: Subscription = this.service.rateUser(window.localStorage.getItem(Constants.KEY_TOKEN), this.ride.user_id, this.rateRequest).subscribe(res => {
        console.log(res);
        window.localStorage.setItem("rate" + this.ride.id, String(this.rateRequest.rating));
        window.localStorage.setItem("ratecheck", String(this.ride.id));
        this.cue.dismissLoading();
        this.translate.get("submitted").subscribe(value => this.cue.showToast(value));
        this.navCtrl.pop();
      }, err => {
        console.log('submit_rating', err);
        this.cue.dismissLoading();
      });
      this.subscriptions.push(subscription);
    }
  }

}