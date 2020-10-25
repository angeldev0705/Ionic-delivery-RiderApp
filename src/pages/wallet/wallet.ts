import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Add_bankPage } from '../add_bank/add_bank';
import { CommonUiElement } from '../../providers/app.commonelements';
import { ClientService } from '../../providers/client.service';
import { User } from '../../models/user.models';
import { Subscription } from 'rxjs/Subscription';
import { WalletHistory } from '../../models/wallet-history.models';
import { Constants } from '../../models/constants.models';
import { Wallet } from '../../models/wallet-info.models';
import { Helper } from '../../models/helper.models';
import { BankTransfer } from '../banktransfer/banktransfer';
import { Trip_infoPage } from '../trip_info/trip_info';

@Component({
  selector: 'page-wallet',
  templateUrl: 'wallet.html',
  providers: [ClientService, CommonUiElement]
})
export class WalletPage {
  private user: User;
  private currency: string;
  private subscriptions: Array<Subscription> = [];
  private walletHistory: Array<WalletHistory> = [];
  private doneAll = false;
  private isLoading = false;
  private pageNo = 1;
  private infiniteScroll: any;

  constructor(private navCtrl: NavController, private service: ClientService, private cue: CommonUiElement) {
    this.user = JSON.parse(window.localStorage.getItem(Constants.KEY_USER));
    if (!this.user) this.user = new User();
    if (!this.user.wallet) this.user.wallet = new Wallet();
    this.currency = Helper.getSetting("currency");
  }

  ionViewWillLeave() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
    this.cue.dismissLoading();
  }

  ionViewDidEnter() {
    this.subscriptions.push(this.service.getUser(window.localStorage.getItem(Constants.KEY_TOKEN)).subscribe(res => {
      if (!res.wallet.balance)
        res.wallet.balance = 0;
      res.wallet.balance = Number(res.wallet.balance.toFixed(0));
      this.user = res;
      console.log(res);
      window.localStorage.setItem(Constants.KEY_USER, JSON.stringify(res));
    }, err => {
      console.log('get_user', err);
    }));
    this.walletHistory = [];
    this.pageNo = 1;
    this.refreshWalletTransaction();
  }

  refreshWalletTransaction() {
    this.isLoading = true;
    let subscription: Subscription = this.service.walletHistory(window.localStorage.getItem(Constants.KEY_TOKEN), this.pageNo).subscribe(res => {
      this.walletHistory = this.walletHistory.concat(res.data);
      this.isLoading = false;
      this.doneAll = (!res.data || !res.data.length);
      if (this.infiniteScroll) {
        this.infiniteScroll.complete();
      }
    }, err => {
      this.isLoading = false;
      if (this.infiniteScroll) {
        this.infiniteScroll.complete();
      }
      console.log('wallet_history', err);
    });
    this.subscriptions.push(subscription);
  }

  doInfinite(infiniteScroll: any) {
    if (this.doneAll) {
      infiniteScroll.complete();
    } else {
      this.infiniteScroll = infiniteScroll;
      this.pageNo = this.pageNo + 1;
      this.refreshWalletTransaction();
    }
  }

  sendMoney() {
    this.navCtrl.push(BankTransfer);
  }

  tripInfo(ride) {
    if (ride) this.navCtrl.push(Trip_infoPage, { ride: ride });
  }

}
