import { Setting } from './setting.models';
import { Constants } from './constants.models';
import moment from 'moment';

export class Helper {
    static getChatChild(userId: string, myId: string) {
        //example: userId="9" and myId="5" -->> chat child = "5-9"
        let values = [userId, myId];
        values.sort((one, two) => (one > two ? -1 : 1));
        return values[0] + "-" + values[1];
    }

    static formatMillisDateTime(millis: number): string {
        return moment(millis).format("ddd, MMM D, HH:mm");
    }

    static formatTimestampDateTime(timestamp: string): string {
        return moment(timestamp).format("ddd, MMM D, HH:mm");
    }

    static formatMillisDate(millis: number): string {
        return moment(millis).format("DD MMM YYYY");
    }

    static formatTimestampDate(timestamp: string): string {
        return moment(timestamp).format("DD MMM YYYY");
    }

    static formatMillisTime(millis: number): string {
        return moment(millis).format("HH:mm");
    }

    static formatTimestampTime(timestamp: string): string {
        return moment(timestamp).format("HH:mm");
    }

    static getSetting(settingKey: string) {
        let settings: Array<Setting> = JSON.parse(window.localStorage.getItem(Constants.KEY_SETTING));
        let toReturn: string;
        if (settings) {
            for (let s of settings) {
                if (s.key == settingKey) {
                    toReturn = s.value;
                    break;
                }
            }
        }
        if (!toReturn) toReturn = "";
        return toReturn;
    }

    static getSettings(settingKeys: Array<string>): Array<string> {
        let settings: Array<Setting> = JSON.parse(window.localStorage.getItem(Constants.KEY_SETTING));
        let toReturn = new Array<string>();
        if (settings && settingKeys) {
            for (let sk of settingKeys) {
                let pos = -1;
                for (let i = 0; i < settings.length; i++) {
                    if (settings[i].key == sk) {
                        pos = i;
                        break;
                    }
                }
                toReturn.push(pos == -1 ? "" : settings[pos].value);
            }
        }
        return toReturn;
    }

    // static getLogTimeForStatus(status: string, logs: Array<StatusLog>) {
    //     let toReturn = "";
    //     if (status && logs) {
    //         for (let log of logs) {
    //             if (log.status == status) {
    //                 toReturn = log.created_at;
    //                 break;
    //             }
    //         }
    //     }
    //     return toReturn;
    // }

    static isValidURL(string: string) {
        if (!string) return false;
        if (!(string.startsWith("http://") || string.startsWith("https://"))) return false;
        var res = string.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
        return res != null;
    }

}