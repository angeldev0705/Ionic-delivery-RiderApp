import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { CommonUiElement } from '../../providers/app.commonelements';
import { ClientService } from '../../providers/client.service';
import { Faq } from '../../models/faq.models';
import { Subscription } from 'rxjs/Subscription';
import { TranslateService } from '@ngx-translate/core';
import { Constants } from '../../models/constants.models';

@Component({
  selector: 'page-help',
  templateUrl: 'help.html',
  providers: [CommonUiElement, ClientService]
})
export class HelpPage {
  private faqs = new Array<Faq>();
  private subscriptions: Array<Subscription> = [];
  private curFaqId;

  constructor(private translate: TranslateService, private service: ClientService,
    private cue: CommonUiElement, private navCtrl: NavController) {
    let savedFaqs: Array<Faq> = JSON.parse(window.localStorage.getItem(Constants.KEY_FAQS));
    if (savedFaqs) {
      this.faqs = savedFaqs;
    } else {
      this.translate.get("loading").subscribe(value => this.cue.presentLoading(value));
    }
    this.refreshFaqs();
  }

  ionViewWillLeave() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
    this.cue.dismissLoading();
  }

  refreshFaqs() {
    this.subscriptions.push(this.service.faqs().subscribe(res => {
      this.faqs = res;
      window.localStorage.setItem(Constants.KEY_FAQS, JSON.stringify(this.faqs));
      this.cue.dismissLoading();
    }, err => {
      console.log('faqs', err);
      this.cue.dismissLoading();
    }));
  }

  expandFaq(faq: Faq) {
    this.curFaqId = (this.curFaqId == faq.id) ? -1 : faq.id;
  }

}
