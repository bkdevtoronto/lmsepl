var googleAnalytics = require("nativescript-google-analytics");
var frameModule = require("ui/frame");
var appSettings = require("application-settings");
var dialogs = require("ui/dialogs");
var observableModule = require("data/observable");
var observableArray = require("data/observable-array").ObservableArray;
var loadingIndicator = require("nativescript-loading-indicator").LoadingIndicator;
var fetchModule = require("fetch");


var loader = new loadingIndicator;
loader.show({
    message: 'Loading...', progress: 0,
    android: { indeterminate: true, cancelable: false, max: 100, progressNumberFormat: "%1d/%2d", progressPercentFormat: 0.53, progressStyle: 1, secondaryProgress: 1 },
    ios: { details: "Please wait", square: false, margin: 10, dimBackground:true, color: "#4b9ed6" }
});
var page;
var apiURL = appSettings.getString("apiURL");

exports.loaded = function(args){
    var pageData;
    var gotData;

    page = args.object;
    pageData = new observableModule.fromObject({});
    gotData = page.navigationContext;
    page.bindingContext = pageData;
    loader.hide();
    console.log("Page successfully loaded");
    googleAnalytics.logView("Group View - ID: "+gotData.gid);
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
