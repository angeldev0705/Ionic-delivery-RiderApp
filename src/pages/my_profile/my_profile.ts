import { Component } from '@angular/core';
import { NavController, NavParams, App, Events } from 'ionic-angular';
import { Profile } from '../../models/profile.models';
import { VehicleType } from '../../models/vehicle-type.models';
import { Subscription } from 'rxjs/Subscription';
import { Constants } from '../../models/constants.models';
import { ClientService } from '../../providers/client.service';
import { CommonUiElement } from '../../providers/app.commonelements';
import { FirebaseClient } from '../../providers/firebase.service';
import { TranslateService } from '@ngx-translate/core';
import { ProfileUpdateRequest } from '../../models/profile-update-request.models';
import { HomePage } from '../home/home';
import { File, Entry, FileEntry } from '@ionic-native/file';
import { ImagePicker } from '@ionic-native/image-picker';
import { Crop } from '@ionic-native/crop';

@Component({
  selector: 'page-my_profile',
  templateUrl: 'my_profile.html',
  providers: [ClientService, CommonUiElement, FirebaseClient]
})
export class My_profilePage {
  private profile: Profile;
  private vehicleTypes: Array<VehicleType>;
  private subscriptions: Array<Subscription> = [];
  private progress: boolean;
  private tokenToUse: string;
  private uploadType: number;

  constructor(private navCtrl: NavController, navParams: NavParams, private clientService: ClientService,
    private cue: CommonUiElement, private firebaseService: FirebaseClient,
    private translate: TranslateService, private app: App, private events: Events,
    private imagePicker: ImagePicker, private cropService: Crop, private file: File) {
    this.profile = navParams.get("profileMe");
    this.tokenToUse = navParams.get("token");
    if (!this.profile || !this.profile.user) {
      this.profile = new Profile();
      let userIn = navParams.get("user");
      this.profile.user = userIn ? userIn : JSON.parse(window.localStorage.getItem(Constants.KEY_USER));
      this.profile.user_id = this.profile.user.id;
    }
    if (!this.profile.vehicle_details || !this.profile.vehicle_details.length)
      this.profile.vehicle_details = "||";
    this.profile.vehicle_details_array = this.profile.vehicle_details.split("|");
    console.log("profile", this.profile);
    if (!this.tokenToUse) this.tokenToUse = window.localStorage.getItem(Constants.KEY_TOKEN);
    this.vehicleTypes = JSON.parse(window.localStorage.getItem(Constants.KEY_VEHICLE_TYPES));
    if (!this.vehicleTypes) this.vehicleTypes = new Array<VehicleType>();
    this.refreshVehicleTypes();

    // setTimeout(() => {
    //   this.profile.user.image_url = "https://upload.wikimedia.org/wikipedia/commons/c/c6/Sierpinski_square.jpg";
    //   this.clientService.updateUser(window.localStorage.getItem(Constants.KEY_TOKEN), { image_url: this.profile.user.image_url }).subscribe(res => {
    //     this.cue.dismissLoading();
    //     console.log(res);
    //   }, err => {
    //     this.cue.dismissLoading();
    //     console.log('update_user', err);
    //   });
    // }, 5000);
  }

  ionViewWillLeave() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
    this.cue.dismissLoading();
  }

  refreshVehicleTypes() {
    this.subscriptions.push(this.clientService.vehicleTypes().subscribe(res => {
      console.log("vehicleTypes", res);
      this.vehicleTypes = res.vehicle_types;
      window.localStorage.setItem(Constants.KEY_VEHICLE_TYPES, JSON.stringify(this.vehicleTypes));
    }, err => {
      console.log("vehicleTypes", err);
    }));
  }

  pickImage(ut) {
    this.uploadType = ut;
    this.imagePicker.getPictures({ maximumImagesCount: 1 }).then((results) => {
      if (results && results[0]) {
        this.reduceImages(results).then(() => {
          console.log('cropped_images');
        });
      }
    }, (err) => {
      console.log(err);
      //this.editphoto();
    });
  }

  reduceImages(selected_pictures: any): any {
    return selected_pictures.reduce((promise: any, item: any) => {
      return promise.then((result) => {
        return this.cropService.crop(item, { quality: 75 }).then(cropped_image => {
          this.resolve(cropped_image);
        });
      });
    }, Promise.resolve());
  }

  resolve(uri: string) {
    console.log('uri: ' + uri);
    if (uri.startsWith('content://') && uri.indexOf('/storage/') != -1) {
      uri = "file://" + uri.substring(uri.indexOf("/storage/"), uri.length);
      console.log('file: ' + uri);
    }
    this.file.resolveLocalFilesystemUrl(uri).then((entry: Entry) => {
      console.log(entry);
      var fileEntry = entry as FileEntry;
      fileEntry.file(success => {
        var mimeType = success.type;
        console.log(mimeType);
        let dirPath = entry.nativeURL;
        this.uploadImage(dirPath, entry.name, mimeType);
      }, error => {
        console.log(error);
      });
    })
  }

  uploadImage(path, name, mime) {
    console.log('original: ' + path);
    let dirPathSegments = path.split('/');
    dirPathSegments.pop();
    path = dirPathSegments.join('/');
    console.log('dir: ' + path);
    this.file.readAsArrayBuffer(path, name).then(buffer => {
      this.cue.presentLoading("Uploading..");
      this.progress = true;
      this.firebaseService.uploadBlob(new Blob([buffer], { type: mime })).then(url => {
        this.cue.dismissLoading();
        this.cue.showToast("Uploaded");
        console.log("Url is:", JSON.stringify(url));
        if (this.uploadType == 1) {
          this.profile.user.image_url = String(url);
          this.translate.get('saving').subscribe(value => {
            this.cue.presentLoading(value);
            this.subscriptions.push(this.clientService.updateUser(window.localStorage.getItem(Constants.KEY_TOKEN), { image_url: String(url) }).subscribe(res => {
              this.cue.dismissLoading();
              console.log(res);
            }, err => {
              this.cue.dismissLoading();
              console.log('update_user', err);
            }));
          });
        } else {
          this.profile.document_url = String(url);
          this.profile.license_url = String(url);
        }
      }).catch(err => {
        this.progress = false;
        this.cue.dismissLoading();
        this.cue.showToast(JSON.stringify(err));
        console.log(err);
      })
    }).catch(err => {
      this.cue.dismissLoading();
      this.cue.showToast(JSON.stringify(err));
      console.log(err);
    })
  }

  save() {
    // this.profile.license_url = "https://firebasestorage.googleapis.com/v0/b/q-cabs.appspot.com/o/Fri%20Nov%2022%202019%2009%3A24%3A51%20GMT%2B0530%20(India%20Standard%20Time)?alt=media&token=264f8636-316f-48a2-bc5b-9c38223ff4a8";
    //this.profile.document_url = "https://firebasestorage.googleapis.com/v0/b/q-cabs.appspot.com/o/Fri%20Nov%2022%202019%2009%3A24%3A51%20GMT%2B0530%20(India%20Standard%20Time)?alt=media&token=264f8636-316f-48a2-bc5b-9c38223ff4a8";
    if (!this.profile.vehicle_type_id || this.profile.vehicle_type_id == -1) {
      this.translate.get("profile_validate_vehicle_type").subscribe(value => {
        this.cue.showToast(value);
      });
    } else if (!this.profile.vehicle_details_array[0] || !this.profile.vehicle_details_array[0].length) {
      this.translate.get("profile_validate_vehicle_brand").subscribe(value => {
        this.cue.showToast(value);
      });
    } else if (!this.profile.vehicle_details_array[1] || !this.profile.vehicle_details_array[1].length) {
      this.translate.get("profile_validate_vehicle_model").subscribe(value => {
        this.cue.showToast(value);
      });
    } else if (!this.profile.vehicle_details_array[2] || !this.profile.vehicle_details_array[2].length) {
      this.translate.get("profile_validate_vehicle_number").subscribe(value => {
        this.cue.showToast(value);
      });
    } else if (!this.profile.document_url || !this.profile.document_url.length) {
      this.translate.get("profile_validate_vehicle_doc").subscribe(value => {
        this.cue.showToast(value);
      });
    } else {
      this.profile.vehicle_details = "";
      for (let vd of this.profile.vehicle_details_array) {
        this.profile.vehicle_details = this.profile.vehicle_details + vd + "|";
      }
      if (this.profile.vehicle_details.endsWith("|")) {
        this.profile.vehicle_details = this.profile.vehicle_details.substring(0, this.profile.vehicle_details.length - 1);
      }
      let profileRequest = new ProfileUpdateRequest();
      profileRequest.vehicle_type_id = this.profile.vehicle_type_id;
      profileRequest.vehicle_details = this.profile.vehicle_details;
      profileRequest.vehicle_number = this.profile.vehicle_details_array[2];
      profileRequest.vehicle_type = this.getSelectedVehicleType(this.profile.vehicle_type_id);
      profileRequest.license_url = this.profile.license_url;
      profileRequest.document_url = this.profile.document_url;
      this.translate.get('just_moment').subscribe(value => {
        this.cue.presentLoading(value);
      });
      console.log('update_request', profileRequest);
      this.subscriptions.push(this.clientService.updateProfile(this.tokenToUse, profileRequest).subscribe(res => {
        window.localStorage.setItem(Constants.KEY_USER, JSON.stringify(res.user));
        window.localStorage.setItem(Constants.KEY_TOKEN, this.tokenToUse);
        window.localStorage.setItem(Constants.KEY_PROFILE, JSON.stringify(res));
        this.events.publish("event:profile", res);
        this.cue.dismissLoading();
        this.app.getRootNav().setRoot(HomePage);
      }, err => {
        this.cue.dismissLoading();
        console.log("profile_update_err", err);
        this.translate.get('profile_updating_fail').subscribe(value => {
          this.cue.presentErrorAlert(value);
        });
      }));
    }
  }

  getSelectedVehicleType(typeId): VehicleType {
    let toReturn = null;
    for (let vt of this.vehicleTypes) {
      if (vt.id == typeId) {
        toReturn = vt;
        break;
      }
    }
    return toReturn;
  }

}
