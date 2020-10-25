import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { CommonUiElement } from '../../providers/app.commonelements';
import { ClientService } from '../../providers/client.service';
import { TranslateService } from '@ngx-translate/core';
import { Rating } from '../../models/rating.models';
import { Review } from '../../models/review.models';
import { Subscription } from 'rxjs/Subscription';
import { RatingSummary } from '../../models/rating-summary.models';
import { Constants } from '../../models/constants.models';
import { User } from '../../models/user.models';

@Component({
  selector: 'page-reviews',
  templateUrl: 'reviews.html',
  providers: [ClientService, CommonUiElement]
})
export class ReviewsPage {
  private isLoadingReviews: boolean = true;
  private doneAll = false;
  private pageNo = 1;
  private infiniteScroll: any;
  private rating: Rating;
  private user: User;
  private reviews: Array<Review> = [];
  private subscriptions: Array<Subscription> = [];

  constructor(private service: ClientService, private translate: TranslateService, private cue: CommonUiElement) {
    this.user = JSON.parse(window.localStorage.getItem(Constants.KEY_USER));
    this.translate.get("loading").subscribe(value => {
      this.cue.presentLoading(value);
      this.loadReviewSummary();
      this.loadReviews();
    });
  }

  loadReviews() {
    this.isLoadingReviews = true;
    let subscription: Subscription = this.service.myReviews(window.localStorage.getItem(Constants.KEY_TOKEN), String(this.pageNo)).subscribe(res => {
      let reviews: Array<Review> = res.data;
      this.reviews = this.reviews.concat(reviews);
      this.cue.dismissLoading();
      this.isLoadingReviews = false;
      this.doneAll = (!res.data || !res.data.length);
      if (this.infiniteScroll) {
        this.infiniteScroll.complete();
      }
    }, err => {
      console.log('review_list', err);
      this.cue.dismissLoading();
      this.isLoadingReviews = false;
      if (this.infiniteScroll) {
        this.infiniteScroll.complete();
      }
    });
    this.subscriptions.push(subscription);
  }

  loadReviewSummary() {
    let subscription: Subscription = this.service.getRatings(window.localStorage.getItem(Constants.KEY_TOKEN), this.user.id).subscribe(res => {
      let ratingSummaries = RatingSummary.defaultArray();
      for (let ratingSummaryResult of res.summary) {
        ratingSummaries[ratingSummaryResult.rounded_rating - 1].total = ratingSummaryResult.total;
        ratingSummaries[ratingSummaryResult.rounded_rating - 1].percent = ((ratingSummaryResult.total / res.total_ratings) * 100);
      }
      res.summary = ratingSummaries;
      this.rating = res;
      this.user.ratings = Number(Number(res.average_rating).toFixed(1));
      this.user.ratingscount = res.total_ratings;
      window.localStorage.setItem(Constants.KEY_USER, JSON.stringify(this.user));
    }, err => {
      console.log('rating_err', err);
    });
    this.subscriptions.push(subscription);
  }

  doInfinite(infiniteScroll: any) {
    if (this.doneAll) {
      infiniteScroll.complete();
    } else {
      this.infiniteScroll = infiniteScroll;
      this.pageNo = this.pageNo + 1;
      this.loadReviews();
    }
  }

}
