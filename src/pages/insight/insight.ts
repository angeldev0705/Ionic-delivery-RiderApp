import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Chart } from "chart.js";
import { CommonUiElement } from '../../providers/app.commonelements';
import { ClientService } from '../../providers/client.service';
import { TranslateService } from '@ngx-translate/core';
import { Constants } from '../../models/constants.models';
import { Insight } from '../../models/insights.models';
import { Helper } from '../../models/helper.models';
import moment from 'moment';
import { WalletPage } from '../wallet/wallet';
import { User } from '../../models/user.models';
import { RatingSummary } from '../../models/rating-summary.models';
import { Rating } from '../../models/rating.models';
import { ReviewsPage } from '../reviews/reviews';

@Component({
  selector: 'page-insight',
  templateUrl: 'insight.html',
  providers: [ClientService, CommonUiElement]
})
export class InsightPage {
  @ViewChild("doughnutCanvas") doughnutCanvas: ElementRef;
  duration = "today";
  bars: any;
  colorArray: any;
  private doughnutChart: Chart;
  insights: Insight;
  currency: string;
  priceRange: Array<number>;
  chartDataParsed: Array<{ date: string, percent: string, price: string }>;
  userMe: User;
  rating: Rating;
  labelsToShow = [{ total: 0, percent: "(0%)" }, { total: 0, percent: "(0%)" }, { total: 0, percent: "(0%)" }, { total: 0, percent: "(0%)" }, { total: 0, percent: "(0%)" }];

  constructor(private navCtrl: NavController, private service: ClientService,
    private cue: CommonUiElement, private translate: TranslateService) {
    this.currency = Helper.getSetting("currency");
    this.userMe = JSON.parse(window.localStorage.getItem(Constants.KEY_USER));
    this.setupDefaultInsights();
    this.translate.get("just_moment").subscribe(value => this.cue.presentLoading(value));
  }

  setupDefaultInsights() {
    this.insights = new Insight();
    if (this.insights && this.insights.chart_data.length) {
      let maxEarning = 100;
      let breaker = maxEarning / 5;
      this.priceRange = [];
      for (let i = 0; i <= 5; i++) this.priceRange.push(Number((((i == 0) ? maxEarning : (this.priceRange[i - 1] - breaker))).toFixed(2)));
      this.chartDataParsed = [];
      for (let cd of this.insights.chart_data) this.chartDataParsed.push({ date: "0", percent: String(((cd.total * 100) / maxEarning)), price: "" });
    }
  }

  ionViewDidEnter() {
    this.loadReviewSummary();
    this.loadInsights();
  }

  loadReviewSummary() {
    this.service.getRatings(window.localStorage.getItem(Constants.KEY_TOKEN), this.userMe.id).subscribe(res => {
      let ratingSummaries = RatingSummary.defaultArray();
      for (let ratingSummaryResult of res.summary) {
        ratingSummaries[ratingSummaryResult.rounded_rating - 1].total = ratingSummaryResult.total;
        ratingSummaries[ratingSummaryResult.rounded_rating - 1].percent = ((ratingSummaryResult.total / res.total_ratings) * 100);
      }
      res.summary = ratingSummaries;
      this.rating = res;
      this.userMe.ratings = Number(Number(res.average_rating).toFixed(1));
      this.userMe.ratingscount = res.total_ratings;
      window.localStorage.setItem(Constants.KEY_USER, JSON.stringify(this.userMe));

      this.labelsToShow[0].total = this.rating.summary[4].total;
      this.labelsToShow[0].percent = "(" + this.rating.summary[4].percent.toFixed() + "%)";
      this.labelsToShow[1].total = this.rating.summary[3].total;
      this.labelsToShow[1].percent = "(" + this.rating.summary[3].percent.toFixed() + "%)";
      this.labelsToShow[2].total = this.rating.summary[2].total;
      this.labelsToShow[2].percent = "(" + this.rating.summary[2].percent.toFixed() + "%)";
      this.labelsToShow[3].total = this.rating.summary[1].total;
      this.labelsToShow[3].percent = "(" + this.rating.summary[1].percent.toFixed() + "%)";
      this.labelsToShow[4].total = this.rating.summary[0].total;
      this.labelsToShow[4].percent = "(" + this.rating.summary[0].percent.toFixed() + "%)";

      this.doughnutChart = new Chart(this.doughnutCanvas.nativeElement, {
        type: "doughnut",
        data: {
          datasets: [
            {
              labels: "# of Votes",
              data: [Number(this.rating.summary[4].percent.toFixed(2)), Number(this.rating.summary[3].percent.toFixed(2)), Number(this.rating.summary[2].percent.toFixed(2)), Number(this.rating.summary[1].percent.toFixed(2)), Number(this.rating.summary[0].percent.toFixed(2))],
              backgroundColor: [
                "#148d00",
                "#2687cc",
                "#fdb036",
                "#ee4300",
                "#9e0b0f",
              ],
              borderWidth: 0,
              hoverBackgroundColor: ["#148d00", "#2687cc", "#fdb036", "#ee4300", "#9e0b0f"],
            }
          ]
        },
        options: {
          layout: {
            padding: {
              left: 0,
              right: 0,
              top: 0,
              bottom: 0
            }
          },
          events: ['touchmove']
        }
      });

    }, err => {
      console.log('rating_err', err);
    });
  }

  loadInsights() {
    this.service.insights(window.localStorage.getItem(Constants.KEY_TOKEN), this.duration).subscribe(res => {
      if (!res.total_earnings) res.total_earnings = 0; res.total_earnings = Number(res.total_earnings.toFixed(2));
      this.insights = res;
      if (this.insights && this.insights.chart_data.length) {
        let maxEarning = 0;
        for (let cd of this.insights.chart_data) if (cd.total > maxEarning) maxEarning = cd.total;
        let breaker = maxEarning / 5;
        this.priceRange = [];
        for (let i = 0; i <= 5; i++) this.priceRange.push(Number((((i == 0) ? maxEarning : (this.priceRange[i - 1] - breaker))).toFixed(2)));
        this.chartDataParsed = [];
        for (let cd of this.insights.chart_data) this.chartDataParsed.push({ date: (String(cd.create_date).includes("-") ? moment(cd.create_date).format("DD MMM") : (cd.create_date + ":00")), percent: String(((cd.total * 100) / maxEarning)), price: this.currency + " " + cd.total.toFixed() });
      } else {
        this.setupDefaultInsights();
      }
      this.cue.dismissLoading();
    }, err => {
      this.cue.dismissLoading();
      console.log("insights", err);
    });
  }

  reviews() {
    this.navCtrl.push(ReviewsPage);
  }

  transactions() {
    this.navCtrl.push(WalletPage);
  }
}



