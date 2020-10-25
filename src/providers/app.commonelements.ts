import { Loading, LoadingController, ToastController, AlertController } from "ionic-angular";
import { TranslateService } from "@ngx-translate/core";
import { Injectable } from "@angular/core";

@Injectable()
export class CommonUiElement {
    private loadingShown: Boolean = false;
    private loading: Loading;

    constructor(private loadingCtrl: LoadingController, private toastCtrl: ToastController,
        private alertCtrl: AlertController, private translate: TranslateService) {
    }

    presentLoading(message: string) {
        this.loading = this.loadingCtrl.create({
            content: message
        });
        this.loading.onDidDismiss(() => { });
        this.loading.present();
        this.loadingShown = true;
    }

    dismissLoading() {
        if (this.loadingShown) {
            this.loadingShown = false;
            this.loading.dismiss();
        }
    }

    showToast(message: string) {
        let toast = this.toastCtrl.create({
            message: message,
            duration: 3000,
            position: 'bottom'
        });
        toast.onDidDismiss(() => {
            console.log('Dismissed toast');
        });
        toast.present();
    }

    presentErrorAlert(msg: string) {
        this.translate.get(['error', 'dismiss']).subscribe(text => {
            let alert = this.alertCtrl.create({
                title: text['error'],
                subTitle: msg,
                buttons: [text['dismiss']]
            });
            alert.present();
        })
    }
}