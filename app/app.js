require("./bundle-config");
var application = require("application");
var applicationSettings = require("application-settings");
var tnsOAuthModule = require("nativescript-oauth");

// API root URLs
applicationSettings.setString("apiURL","https://api.lastmanstanding.football/");
applicationSettings.setString("imgURL", "https://img.lastmanstanding.football/");

var facebookInitOptions = TnsOAuthOptionsFacebook = {
    clientId: '204313853306507',
    clientSecret: '84ee98db34b39bf48e622e78a6b2c172',
    scope: ['email']
};
tnsOAuthModule.initFacebook(facebookInitOptions);

application.start({ moduleName: "views/start/start" });

//End of start code
