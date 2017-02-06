require("./bundle-config");
var application = require("application");
var applicationSettings = require("application-settings");
var googleAnalytics = require("nativescript-google-analytics");
var tnsOAuthModule = require("nativescript-oauth");

// API root URLs
applicationSettings.setString("apiURL","https://api.lastmanstanding.football/");
applicationSettings.setString("imgURL", "https://img.lastmanstanding.football/");

// Facebook Auth
var facebookInitOptions = TnsOAuthOptionsFacebook = {
    clientId: '204313853306507',
    clientSecret: '84ee98db34b39bf48e622e78a6b2c172',
    scope: ['email']
};
tnsOAuthModule.initFacebook(facebookInitOptions);


// Google Analytics
if (application.ios) {
    //iOS
    var __extends = this.__extends || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        __.prototype = b.prototype;
        d.prototype = new __();
    };

    var appDelegate = (function (_super) {
        __extends(appDelegate, _super);
        function appDelegate() {
            _super.apply(this, arguments);
        }

        appDelegate.prototype.applicationDidFinishLaunchingWithOptions = function (application, launchOptions) {
            initAnalytics(); //Module Code to initalize
        };

        appDelegate.ObjCProtocols = [UIApplicationDelegate];
        return appDelegate;
    })(UIResponder);
    application.ios.delegate = appDelegate;
} else {
    //ANDROID
    application.on(application.launchEvent, function (args) {
        initAnalytics(); //Module Code to initalize
    });

}

application.start({ moduleName: "views/start/start" });

//End of start code

//Google Analytics Functions
function initAnalytics(){
    googleAnalytics.initalize({
                trackingId: "UA-72231072-4", //YOUR Id from GA
                //userId: "9ac7a034-ffde-4783-8374-f78b3df39d32", //Optional
                dispatchInterval: /*5*/1,
                logging: {
                    native: false,
                    console: true
                }
            });
}
