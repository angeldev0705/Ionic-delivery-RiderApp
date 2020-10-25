import { InjectionToken } from "@angular/core";

export let APP_CONFIG = new InjectionToken<AppConfig>("app.config");

export interface FirebaseConfig {
	apiKey: string,
	authDomain: string,
	databaseURL: string,
	projectId: string,
	storageBucket: string,
	messagingSenderId: string,
	webApplicationId: string
}

export interface AppConfig {
	appName: string;
	apiBase: string;
	googleApiKey: string;
	oneSignalAppId: string;
	oneSignalGPSenderId: string;
	availableLanguages: Array<any>;
	firebaseConfig: FirebaseConfig;
	demoMode: boolean;
}

export const BaseAppConfig: AppConfig = {
	appName: "Q Drive",
	// apiBase: "https://yourapibase.com/",kits.co.ke
	// apiBase: "http://localhost:8000/",
	// apiBase: "http://192.168.108.167:8000/",
	apiBase: "http://kits.co.ke/",
	googleApiKey: "AIzaSyBrQn5MBF6Q8_557DmY3RmJF6CrLP_2qSA",
	oneSignalAppId: "",
	oneSignalGPSenderId: "",
	availableLanguages: [{
		code: 'en',
		name: 'English'
	}, {
		code: 'ar',
		name: 'Arabic'
	}, {
		code: 'fr',
		name: 'French'
	}, {
		code: 'es',
		name: 'Spanish'
	}, {
		code: 'pt',
		name: 'Portuguese'
	}],
	demoMode: false,
	firebaseConfig: {
	// 	webApplicationId: "",
	// 	apiKey: "AIzaSyBES639NynMi6GTC2gUTDTvZQ7GbO08rSA",
	// 	authDomain: "",
	// 	databaseURL: "",
	// 	projectId: "app1-fbce8",
	// 	storageBucket: "",
	// 	messagingSenderId: ""
	// }
	apiKey: "AIzaSyBES639NynMi6GTC2gUTDTvZQ7GbO08rSA",
	authDomain: "app1-fbce8.firebaseapp.com",
	 databaseURL: "https://app1-fbce8.firebaseio.com", 
	 projectId: "app1-fbce8", 
	 storageBucket: "app1 -fbce8.appspot.com ",
	  messagingSenderId: " 518680245682 ", 
	  webApplicationId: " 1: 518680245682: web: f42981434386f5ce2ee0ab "
}
};