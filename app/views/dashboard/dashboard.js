var frameModule = require("ui/frame");
var appSettings = require("application-settings");
var view = require("ui/core/view");
var frameModule = require("ui/frame");
var fetchModule = require("fetch");
var dialogs = require("ui/dialogs");
var loadingIndicator = require("nativescript-loading-indicator").LoadingIndicator;
var listViewModule = require("ui/list-view");
var observableModule = require("data/observable");
var observableArray = require("data/observable-array").ObservableArray;
var googleAnalytics = require("nativescript-google-analytics");
var connectivity = require("connectivity");

/* Ads */
var admob = require("nativescript-admob");

var page;
var drawer;

/* Loading Indicator */
var loader = new loadingIndicator;
var loaderOptions = {
    message: 'Loading...', progress: 0,
    android: { indeterminate: true, cancelable: false, max: 100, progressNumberFormat: "%1d/%2d", progressPercentFormat: 0.53, progressStyle: 1, secondaryProgress: 1 },
    ios: { details: "Please wait", square: false, margin: 10, dimBackground:true, color: "#4b9ed6" }
};
loader.show(loaderOptions);

/* API */
var apiURL = appSettings.getString("apiURL");

/**
 * Page Functions
 */

exports.loaded = function(args){
    drawer = view.getViewById(page,"sideDrawer");

    /* Load Data - Leagues */
    var userId = appSettings.getString("id");
    var groupArray = [];
    var pageData;
    page = args.object;

    googleAnalytics.logView("Dashboard");

    var connectionType = connectivity.getConnectionType();
    if(connectivity.connectionType.none){

        /* Page Data */
        pageData = new observableModule.fromObject({
            groups: new observableArray(groupArray),
            profilePic: appSettings.getString("img"),
            username: appSettings.getString("username"),
            scorevalue: "-",
            groupsHeight: 0
        });

        page.bindingContext = pageData;
        dialogs.alert({
            title: "No Connection",
            message: "Please try again when you have connection to the internet.",
            okButtonText: "OK"
        }).then(function(){
            console.log("Dashboard loaded - no internet connection");
        });

        loader.hide();
        return false;
    }

    /* Ads */
    admob.createBanner({
        testing: true,
        size: admob.AD_SIZE.SMART_BANNER,
        androidBannerId: "ca-app-pub-6311725785805657/1855866252",
        //iosBannerId: "ca-app-pub-XXXXXX/YYYYYY", iosTestDeviceIds: ["yourTestDeviceUDIDs", "canBeAddedHere"],
        margins: { bottom: 0 }
    }).then(
        function() { /* console.log("admob createBanner done"); */ },
        function(error) { console.log("admob createBanner error: " + error); }
    );

    fetchModule.fetch(apiURL+"groups/user/"+userId,{
            method: "get"
        }).then(function(response){
            var r = JSON.parse(response._bodyText);
            if(r.response=="success"){
                r.data[0].forEach(function(e){
                    var item = {
                        icon: e.captain==appSettings.getString("id") ? "res://icon_league_captain" : "res://icon_league_player",
                        name: e.name,
                        date: e.date,
                        active: e.active==1 ? true : false,
                        id: e.gid
                    };
                    groupArray.push(item);
                });
                //Save groups to app settings
                appSettings.setString("groups",JSON.stringify(groupArray));

                //Finish loading page
                var height = groupArray.length * 40;
                var groupsHeight = height;

                /* Page Data */
                pageData = new observableModule.fromObject({
                    groups: new observableArray(groupArray),
                    profilePic: appSettings.getString("img"),
                    username: appSettings.getString("username"),
                    scorevalue: "420",
                    groupsHeight: groupsHeight
                });

                page.bindingContext = pageData;
                console.log("Dashboard loaded successfully");
                loader.hide();
            } else {
                var height = groupArray.length * 40;
                var groupsHeight = height;

                /* Page Data */
                pageData = new observableModule.fromObject({
                    groups: new observableArray(groupArray),
                    profilePic: appSettings.getString("img"),
                    username: appSettings.getString("username"),
                    scorevalue: "420",
                    groupsHeight: groupsHeight
                });

                page.bindingContext = pageData;
                dialogs.alert({
                    title: "Error",
                    message: "Unable to load data into dashboard.",
                    okButtonText: "OK"
                }).then(function(){
                    console.log("Dashboard did not load properly");
                });
                loader.hide();
            }
        });
}

exports.groupTap = function(args){
    var tappedIndex = args.index;
    var tappedView = args.view;
    tappedItem = tappedView.bindingContext;

    frameModule.topmost().navigate({
        moduleName: "/views/group/group",
        context: { gid: tappedItem.id }
    });
}

exports.toggleDrawer = toggleDrawer;
function toggleDrawer(args){
    drawer.toggleDrawerState();
}

exports.navSettings = navSettings;
function navSettings(){
    navigate("settings");
}

exports.navTopUp = navTopUp;
function navTopUp(){
    navigate("top-up");
}

exports.navGroupStart = navGroupStart;
function navGroupStart(){
    frameModule.topmost().navigate({
        moduleName: "views/group-start/group-start",
        animated: true,
        transition: {
            name: "slideLeft",
            curve: "easeIn"
        }
    });
}

exports.navGroupJoin = navGroupJoin;
function navGroupJoin(){
    frameModule.topmost().navigate({
        moduleName: "views/group-join/group-join",
        animated: true,
        transition: {
            name: "slideLeft",
            curve: "easeIn"
        }
    });
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
