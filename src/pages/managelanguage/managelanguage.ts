import { Component, Inject } from '@angular/core';
import { Events, App } from 'ionic-angular';
import { HomePage } from '../home/home';
import { Constants } from '../../models/constants.models';
import { AppConfig, APP_CONFIG } from '../../app/app.config';

@Component({
  selector: 'page-managelanguage',
  templateUrl: 'managelanguage.html'
})
export class ManagelanguagePage {
  private defaultLanguageCode = "en";

  constructor(@Inject(APP_CONFIG) private config: AppConfig, private events: Events, private app: App) {
    let defaultLang = window.localStorage.getItem(Constants.KEY_DEFAULT_LANGUAGE);
    this.defaultLanguageCode = (defaultLang && defaultLang.length) ? defaultLang : this.config.availableLanguages[0].code;
  }

  onLanguageClick(language) {
    this.defaultLanguageCode = language.code;
  }

  languageConfirm() {
    this.events.publish('language:selection', this.defaultLanguageCode);
    window.localStorage.setItem(Constants.KEY_DEFAULT_LANGUAGE, this.defaultLanguageCode);
    this.app.getRootNav().setRoot(HomePage);
  }

}
