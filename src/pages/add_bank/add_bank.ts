import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { HomePage } from '../home/home';
@Component({
  selector: 'page-add_bank',
  templateUrl: 'add_bank.html'
})
export class Add_bankPage {

  constructor(public navCtrl: NavController) {

  }
   
  home(){
        this.navCtrl.setRoot(HomePage)
  }  

}
