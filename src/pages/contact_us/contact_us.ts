import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { CommonUiElement } from '../../providers/app.commonelements';
import { ClientService } from '../../providers/client.service';
import { User } from '../../models/user.models';
import { SupportRequest } from '../../models/support-request.models';
import { Subscription } from 'rxjs/Subscription';
import { TranslateService } from '@ngx-translate/core';
import { CallNumber } from '@ionic-native/call-number';
import { Constants } from '../../models/constants.models';
import { Helper } from '../../models/helper.models';
import { HomePage } from '../home/home';

@Component({
  selector: 'page-contact_us',
  templateUrl: 'contact_us.html',
  providers: [CommonUiElement, ClientService]
})
export class Contact_usPage {
  private userMe: User;
  private support_email = "";
  private support_phone = "";
  private support: SupportRequest = new SupportRequest('', '', '');
  private subscriptions: Array<Subscription> = [];

  constructor(private translate: TranslateService, private service: ClientService,
    private cue: CommonUiElement, private navCtrl: NavController, private callNumber: CallNumber) {
    this.userMe = JSON.parse(window.localStorage.getItem(Constants.KEY_USER));
    this.support.name = this.userMe.name;
    this.support.email = this.userMe.email;
    let settingValues = Helper.getSettings(["support_email", "support_phone"]);
    if (settingValues.length) {
      this.support_email = settingValues[0];
      this.support_phone = settingValues[1];
    }
  }

  callSupport() {
    this.callNumber.callNumber(this.support_phone, true)
      .then(res => console.log('Launched dialer!', res))
      .catch(err => console.log('Error launching dialer', err));
  }

  mailSupport() {
    window.open(("mailto:" + this.support_email), "_system");
  }

  send() {
    if (!this.support.message.length) {
      this.translate.get('empty_msg').subscribe(value => {
        this.cue.showToast(value);
      });
    } else {
      this.translate.get('sending').subscribe(text => {
        this.cue.presentLoading(text);
        this.subscriptions.push(this.service.contactUs(window.localStorage.getItem(Constants.KEY_TOKEN), this.support).subscribe(res => {
          console.log("contactUs", res);
          this.cue.dismissLoading();
          this.translate.get('msg_submitted').subscribe(value => {
            this.cue.showToast(value);
          });
          this.navCtrl.setRoot(HomePage);
        }, err => {
          console.log('contactUs', err);
          this.cue.dismissLoading();
          this.navCtrl.setRoot(HomePage);
        }));
      });
    }
  }

}
