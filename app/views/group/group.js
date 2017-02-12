var googleAnalytics = require("nativescript-google-analytics");
var frameModule = require("ui/frame");
var appSettings = require("application-settings");
var dialogs = require("ui/dialogs");
var observableModule = require("data/observable");
var observableArray = require("data/observable-array").ObservableArray;
var loadingIndicator = require("nativescript-loading-indicator").LoadingIndicator;
var fetchModule = require("fetch");
var view = require("ui/core/view");

/* Ads */
var admob = require("nativescript-admob");

var loader = new loadingIndicator;
var drawer;
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
    var groupArray = [];
    var page = args.object;
    gotData = page.navigationContext;
    drawer = view.getViewById(page,"sideDrawer");
    var groupId = gotData.gid;

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

    fetchModule.fetch(apiURL+"groups/id/"+groupId,{
            method: "get"
        }).then(function(response){
            var r = JSON.parse(response._bodyText);
            if(r.response=="success"){
                if(r.members){
                    r.members[0].forEach(function(e){
                        var item = {
                            name: e.username,
                            id: e.id,
                            icon: r.groupmeta[0][0].captain==e.id ? "res://icon_league_captain" : "res://icon_league_player"
                        };
                        groupArray.push(item);
                    });
                }
                pageData = new observableModule.fromObject({
                    groupArray : new observableArray(groupArray),
                    groupsHeight: (groupArray.length * 40)+5,
                    teamName: r.groupmeta[0][0].name
                });

                page.bindingContext = pageData;
                loader.hide();
                console.log("Group page successfully loaded");
            } else {
            }
        });
}

exports.toggleDrawer = function(args){
    drawer.toggleDrawerState();
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
