/*
In NativeScript, the app.js file is the entry point to your application.
You can use this file to perform app-level initialization, but the primary
purpose of the file is to pass control to the app’s first module.
*/

require("./bundle-config");
var application = require("application");
var applicationSettings = require("application-settings");
var tnsOAuthModule = require("nativescript-oauth");

// API root URL
applicationSettings.setString("apiURL","https://www.akuk.co.uk/projects/lms2/");

var facebookInitOptions = TnsOAuthOptionsFacebook = {
    clientId: '204313853306507',
    clientSecret: '84ee98db34b39bf48e622e78a6b2c172',
    scope: ['email']
};
tnsOAuthModule.initFacebook(facebookInitOptions);

application.start({ moduleName: "views/start/start" });

/*
Do not place any code after the application has been started as it will not
be executed on iOS.
*/
