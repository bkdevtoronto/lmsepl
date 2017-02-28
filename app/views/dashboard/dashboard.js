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
var pullRefresh = require("nativescript-pulltorefresh");

/* Ads */
var admob = require("nativescript-admob");
var displayAds = false;

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

    /* Load Data - Leagues */
    var userId = appSettings.getString("id");
    var groupArray = [];
    var groupHeaders = 0;
    var pageData = new observableModule.fromObject({
        profilePic: appSettings.getString("img"),
        username: appSettings.getString("username"),
        points: "-"
    });
    page = args.object;
    drawer = view.getViewById(page,"sideDrawer");

    googleAnalytics.logView("Dashboard");

    var connectionType = connectivity.getConnectionType();
    if(connectivity.connectionType.none){

        /* Page Data */
        pageData.groups = new observableArray(groupArray);
        pageData.groupsHeight = 0;

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
    if(displayAds){
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
    }

    //Get User Data
    console.log(apiURL+"users/fbid/"+appSettings.getString("fbid"));
    fetchModule.fetch(apiURL+"users/fbid/"+appSettings.getString("fbid"),{
            method: "get"
        }).then(function(response){
            var r = JSON.parse(response._bodyText);
            if(r.response=="success"){
                var points = r.data[0].points;
                var username = r.data[0].username;
                pageData.points = points;
                pageData.username = username;

                //Get Group Data
                fetchModule.fetch(apiURL+"groups/user/"+userId,{
                        method: "get"
                    }).then(function(response){
                        var r = JSON.parse(response._bodyText);
                        if(r.response=="success"){
                            if(r.data){
                                //sort by membership, activity, name
                                r.data[0].sort(function(a,b){
                                    var x = a.captain==appSettings.getString("id");
                                    var y = b.captain==appSettings.getString("id");
                                    if(x==y){
                                        var d = a.active==1 ? true : false;
                                        var e = b.active==1 ? true : false;
                                        if(d==e){
                                            var f = a.name.toLowerCase();
                                            var g = b.name.toLowerCase();
                                            return f < g ? -1 : f > g ? 1 : 0;
                                        } else {
                                            return d ? -1 : e ? 1 : 0
                                        }
                                    } else {
                                        return x ? -1 : y ? 1 : 0;
                                    }
                                });

                                var isCaptain = false;
                                r.data[0].forEach(function(e){
                                    curCaptain = e.captain==appSettings.getString("id");
                                    if(curCaptain!=isCaptain){
                                        isCaptain=curCaptain;
                                        groupHeaders++;
                                        if(curCaptain){
                                            groupArray.push({header:true, text: "Captainships"});
                                        } else {
                                            groupArray.push({header:true, text: "Memberships"});
                                        }
                                    }

                                    if(e.trophy){
                                        console.log(JSON.stringify(e.trophy));
                                        console.log(e.trophy.premium);
                                    }

                                    var item = {
                                        icon: e.captain==appSettings.getString("id") ? "res://icon_league_captain" : "res://icon_league_player",
                                        name: e.name,
                                        date: e.date,
                                        active: e.active==1 ? true : false,
                                        id: e.gid,
                                        paid: e.trophy && e.trophy.premium==1 ? true : false,
                                        cost: e.trophy ? displayCost(e.trophy.cost,e.trophy.premium) : null
                                    };
                                    groupArray.push(item);
                                });
                            }
                            //Save groups to app settings
                            appSettings.setString("groups",JSON.stringify(groupArray));

                            //Finish loading page
                            var height = ((groupArray.length - groupHeaders) * 44) + (groupHeaders * 24);
                            var groupsHeight = height;

                            /* Page Data */
                            pageData.groups = new observableArray(groupArray);
                            pageData.groupsHeight = groupsHeight;

                            page.bindingContext = pageData;
                            console.log("Dashboard loaded successfully");
                            loader.hide();
                        } else if(r.response=="failure"){
                            /* Page Data */
                            pageData.groups = new observableArray(groupArray);
                            pageData.groupsHeight = 0;

                            page.bindingContext = pageData;
                            if(r.errors){
                                r.errors.forEach(function(e){
                                    dialogs.alert({
                                        title: "Error Info:",
                                        message: JSON.stringify(e),
                                        okButtonText: "Damn"
                                    });
                                });
                            }
                            loader.hide();

                        } else {

                            /* Page Data */
                            pageData.groups = new observableArray({});
                            pageData.groupsHeight = 0;

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

exports.navProfile = navProfile;
function navProfile(){
    navigate("profile");
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

exports.refreshPage = refreshPage;
function refreshPage(args) {
    // Do work here... and when done call set refreshing property to false to stop the refreshing
    frameModule.topmost().navigate({
        moduleName: "views/dashboard/dashboard",
        animated: false,
        clearHistory: false
    });
}

function displayCost(c,p){
    var cost = "";
    var c = c || null;
    if(c!=""&&c!=0&&c!=null){
        if(p==1){
            cost = "£";
            if(c!=parseInt(c)){
                cost += parseFloat(c).toFixed(2);
            } else {
                cost += c;
            }
        } else {
            cost += c.toLocaleString() + " PTS";
        }
    } else {
        cost += "F2P";
    }
    return cost;
}
