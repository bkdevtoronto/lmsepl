var frameModule = require("ui/frame");
var appSettings = require("application-settings");
var view = require("ui/core/view");
var frameModule = require("ui/frame");
var fetchModule = require("fetch");
var loadingIndicator = require("nativescript-loading-indicator").LoadingIndicator;
var listViewModule = require("ui/list-view");
var observableModule = require("data/observable");
var observableArray = require("data/observable-array").ObservableArray;

var page;
var drawer;

/* Loading Indicator */
var loader = new loadingIndicator;
var loaderOptions = { message: 'Loading...', progress: 0, android: {
        indeterminate: true, cancelable: false, max: 100, progressNumberFormat: "%1d/%2d", progressPercentFormat: 0.53, progressStyle: 1, secondaryProgress: 1
    }, ios: {
        details: "Please wait", square: false, margin: 10, dimBackground:true, color: "#4b9ed6" }
};
loader.show(loaderOptions);

/* API */
var apiURL = appSettings.getString("apiURL");

/**
 * Page Functions
 */
exports.loaded = function(args){
    /* Load Data - Leagues */
    var userId = appSettings.getString("id");
    var groupArray = [];
    var pageData;
    page = args.object;

    fetchModule.fetch(apiURL+"groups/user/"+userId,{
            method: "get"
        }).then(function(response){
            var r = JSON.parse(response._bodyText);
            if(r.response=="success"){
                r.data[0].forEach(function(e){
                    var item = { name: e.name, date: e.date };
                    groupArray.push(item);
                    console.log(JSON.stringify(groupArray));
                });
            }

            /* Page Data */
            pageData = new observableModule.fromObject({
                groups: new observableArray(groupArray),
                profilePic: appSettings.getString("img"),
                username: appSettings.getString("username"),
                scorevalue: "420"
            });


            page.bindingContext = pageData;
            drawer = view.getViewById(page,"sideDrawer");
            loader.hide();
        });



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
