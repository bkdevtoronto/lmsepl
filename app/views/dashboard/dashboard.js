var frameModule = require("ui/frame");
var appSettings = require("application-settings");
var view = require("ui/core/view");
var frameModule = require("ui/frame");
var loadingIndicator = require("nativescript-loading-indicator").LoadingIndicator;

var loader = new loadingIndicator;
var loaderOptions = {
    message: 'Loading...',
    progress: 0,
    android: {
        indeterminate: true,
        cancelable: false,
        max: 100,
        progressNumberFormat: "%1d/%2d",
        progressPercentFormat: 0.53,
        progressStyle: 1,
        secondaryProgress: 1
    },
    ios: {
        details: "Please wait",
        square: false,
        margin: 10,
        dimBackground:true,
        color: "#4b9ed6"
    }
};

loader.show(loaderOptions);

var drawer;

exports.loaded = function(args){
    var page = args.object;
    page.bindingContext = {
        profilePic: appSettings.getString("img"),
        username: appSettings.getString("username"),
        scorevalue: "high #420"
    };
    loader.hide();
    drawer = view.getViewById(page,"sideDrawer");
    console.log("Dashboard loaded successfully");
}

exports.toggleDrawer = toggleDrawer;
function toggleDrawer(args){
    drawer.toggleDrawerState();
}

exports.navSettings = navSettings;
function navSettings(){
    navigate("settings");
}

function navigate(view){
    toggleDrawer();
    frameModule.topmost().navigate({
        moduleName: "views/"+view+"/"+view,
        animated: true,
        clearHistory: true,
        transition: {
            name: "fade",
            curve: "easeIn"
        }
    });
}
