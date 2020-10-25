import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { CommonUiElement } from '../../providers/app.commonelements';
import { Constants } from '../../models/constants.models';
import { TranslateService } from '@ngx-translate/core';
import { Clipboard } from '@ionic-native/clipboard';
import { SocialSharing } from '@ionic-native/social-sharing';
import { ClientService } from '../../providers/client.service';
import { User } from '../../models/user.models';
import { Helper } from '../../models/helper.models';

@Component({
  selector: 'page-promo_code',
  templateUrl: 'promo_code.html',
  providers: [CommonUiElement, ClientService]
})
export class Promo_codePage {
  private userMe: User;
  private shareMessage: string;
  private refer_amount: string;
  private currency: string;
  private referAmount: string;
  private referralCode: string;

  constructor(private socialSharing: SocialSharing, private navCtrl: NavController, private clipboard: Clipboard,
    private cue: CommonUiElement, private translate: TranslateService, private clientService: ClientService) {
    this.userMe = JSON.parse(window.localStorage.getItem(Constants.KEY_USER));
    let settings = Helper.getSettings(["currency", "refer_amount"]);
    if (settings && settings.length > 0) this.currency = settings[0];
    if (settings && settings.length > 1) this.referAmount = settings[1];
    this.translate.get('share_message').subscribe(value => {
      this.shareMessage = value + " ";
    });
  }

  verifyReferral() {
    if (this.referralCode && this.referralCode.length) {
      this.translate.get('referral_verifying').subscribe(value => {
        this.cue.presentLoading(value);
        this.clientService.referralRefer(window.localStorage.getItem(Constants.KEY_TOKEN), this.referralCode).subscribe(res => {
          this.cue.dismissLoading();
          this.translate.get('referral_verified').subscribe(value => {
            this.cue.showToast(value);
          });
        }, err => {
          console.log(err);
          this.cue.dismissLoading();
          this.translate.get('referral_verify_error').subscribe(value => {
            this.cue.showToast(value);
          });
        });
      });
    } else {
      this.translate.get('invalid_referral').subscribe(value => {
        this.cue.showToast(value);
      });
    }
  }

  copyCode() {
    if (this.userMe.refer_code) {
      this.clipboard.copy(this.userMe.refer_code);
      this.translate.get('copied_code').subscribe(value => {
        this.cue.showToast(value);
      });
    }
  }

  share() {
    this.socialSharing.share(this.shareMessage + this.userMe.refer_code).then(() => {
      // Sharing via email is possible
    }).catch((err) => {
      console.log("shareErr", err);
      this.copyCode();
    });
  }

}
