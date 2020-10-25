import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { SignupPage } from '../signup/signup';
import { VerificationPage } from '../verification/verification';
import { CommonUiElement } from '../../providers/app.commonelements';
import { ClientService } from '../../providers/client.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'page-signin',
  templateUrl: 'signin.html',
  providers: [CommonUiElement, ClientService]
})
export class SigninPage {
  private countries: any;
  private phoneNumber: string;
  private countryCode: string;
  private phoneNumberFull: string;

  constructor(private navCtrl: NavController, private cue: CommonUiElement,
    private service: ClientService, private translate: TranslateService, private alertCtrl: AlertController) {
    this.getCountries();
  }

  getCountries() {
    this.service.getCountries().subscribe(data => {
      this.countries = data;
    }, err => {
      console.log(err);
    })
  }

  alertPhone() {
    if (this.countryCode && this.phoneNumber) {
      this.translate.get(['alert_phone', 'no', 'yes']).subscribe(text => {
        this.phoneNumberFull = "+" + this.countryCode + this.phoneNumber;
        let alert = this.alertCtrl.create({
          title: this.phoneNumberFull,
          message: text['alert_phone'],
          buttons: [{
            text: text['no'],
            role: 'cancel',
            handler: () => {
              console.log('Cancel clicked');
            }
          },
          {
            text: text['yes'],
            handler: () => {
              this.checkIfExists();
            }
          }]
        });
        alert.present();
      });
    }
  }

  checkIfExists() {
    this.translate.get('just_moment').subscribe(value => {
      this.cue.presentLoading(value);
    });
    this.service.checkUser({ mobile_number: this.phoneNumberFull, role: "driver" }).subscribe(res => {
      console.log(res);
      this.cue.dismissLoading();
      this.navCtrl.push(VerificationPage, { phoneNumberFull: this.phoneNumberFull });
    }, err => {
      console.log(err);
      this.cue.dismissLoading();
      this.navCtrl.push(SignupPage, { code: this.countryCode, phone: this.phoneNumber });
    });
  }

  signup() {
    this.navCtrl.push(SignupPage);
  }

}
