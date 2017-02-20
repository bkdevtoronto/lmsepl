var googleAnalytics = require("nativescript-google-analytics");
var frameModule = require("ui/frame");
var appSettings = require("application-settings");
var dialogs = require("ui/dialogs");
var observableModule = require("data/observable");
var observableArray = require("data/observable-array").ObservableArray;
var loadingIndicator = require("nativescript-loading-indicator").LoadingIndicator;
var fetchModule = require("fetch");
var view = require("ui/core/view");
var pages = require("ui/page");
var pullRefresh = require("nativescript-pulltorefresh");

/* Ads */
var admob = require("nativescript-admob");

var loader = new loadingIndicator;
var drawer;
var loaderData = {
    message: 'Loading...', progress: 0,
    android: { indeterminate: true, cancelable: false, max: 100, progressNumberFormat: "%1d/%2d", progressPercentFormat: 0.53, progressStyle: 1, secondaryProgress: 1 },
    ios: { details: "Please wait", square: false, margin: 10, dimBackground:true, color: "#4b9ed6" }
};
loader.show(loaderData);
var page;
var apiURL = appSettings.getString("apiURL");
var pageData;
var gw;
var groupId;
var pageArgs;

exports.loaded = loaded;
function loaded(args, pullRefresh){
    var pullRefresh = pullRefresh || false;
    var gotData;
    var groupArray = [];
    page = args.object;
    pageArgs = args;
    gotData = page.navigationContext;
    drawer = view.getViewById(page,"sideDrawer");
    groupId = gotData ? gotData.gid : appSettings.getString("gid");

    appSettings.setString("gid",groupId);

    /* Ads */
    /*admob.createBanner({
        testing: true,
        size: admob.AD_SIZE.SMART_BANNER,
        androidBannerId: "ca-app-pub-6311725785805657/1855866252",
        //iosBannerId: "ca-app-pub-XXXXXX/YYYYYY", iosTestDeviceIds: ["yourTestDeviceUDIDs", "canBeAddedHere"],
        margins: { bottom: 0 }
    }).then(
        function() {
            //console.log("admob createBanner done");
        },
        function(error) { console.log("admob createBanner error: " + error); }
    );*/

    fetchModule.fetch(apiURL+"groups/id/"+groupId,{
            method: "get",
            headers: {uid: appSettings.getString("id")} //https://www.npmjs.com/package/node-fetch#options
        }).then(function(response){
            var r = JSON.parse(response._bodyText);
            if(r.response=="success"){
                if(r.members){
                    r.members[0].forEach(function(e){
                        var tN = null;
                        var tId = null;
                        r.selections[0].forEach(function(a){
                            if(a.uid==e.id){
                                tN = a.name;
                                tId = a.cid;
                            }
                        });
                        var item = {
                            name: e.username,
                            id: e.id,
                            icon: r.groupmeta[0][0].captain==e.id ? "res://icon_league_captain" : "res://icon_league_player",
                            selectionName: tN ? tN : false,
                            selectionId: tId ? tId : false
                        };
                        groupArray.push(item);
                    });
                }

                var clubArray = [];
                var matchArray = [];
                var matchHeight = 0;
                if(r.matches){
                    var ko = null;
                    r.matches.forEach(function(e){
                        if(e.ko!=ko){
                            ko = e.ko;
                            matchHeight += 30;
                            matchArray.push({home: false, away: false, homes: false, aways: false, ko: e.ko, koLabelDate: formatDate(new Date(e.ko), 1)[0], koLabelTime: formatDate(new Date(e.ko), 1)[1] });
                        }
                        matchHeight +=24.5;
                        matchArray.push({home: e.home, away: e.away, homes: e.homes || "", aways: e.aways || "", ko: false, koLabel: false, allowed: true });
                        clubArray.push({name: e.home, id: e.homeid, opp: e.away });
                        clubArray.push({name: e.away, id: e.awayid, opp: e.home });
                    });

                    clubArray.sort(function(a,b){
                        var x = a.name.toLowerCase();
                        var y = b.name.toLowerCase();
                        return x < y ? -1 : x > y ? 1 : 0;
                    });
                }

                pageData = new observableModule.fromObject({
                    groupArray : new observableArray(groupArray),
                    groupsHeight: (groupArray.length * 40)+5,
                    teamName: r.groupmeta[0][0].name,
                    active : r.groupmeta[0][0].active==1 ? true : false,
                    teamDate: "Est. " + formatDate(new Date(r.groupmeta[0][0].date)),
                    gw: r.groupmeta.gw,
                    selectionName: r.groupmeta.selectionName,
                    selectionId: r.groupmeta.selectionId,
                    clubArray : new observableArray(clubArray),
                    clubHeight: (clubArray.length) * 25,
                    clubSelect : 'collapsed',
                    fixturesToggle : 'collapsed',
                    matchArray: new observableArray(matchArray),
                    matchHeight: matchHeight,

                    profilePic: appSettings.getString("img"),
                    username: appSettings.getString("username"),
                    scorevalue: "-"
                });

                gw = r.groupmeta.gw;

                page.bindingContext = pageData;
                loader.hide();
                console.log("Group page successfully loaded");
                if(pullRefresh) pullRefresh.refreshing = false;
            } else {
            }
        });
}

exports.selectTeam = selectTeam;
function selectTeam(args) {
    var tappedIndex = args.index;
    var tappedView = args.view;
    tappedItem = tappedView.bindingContext;

    //if(!tappedItem.allowed) return false;
    dialogs.confirm({
        title: "Select Team",
        message: "Are you sure you want to select "+tappedItem.name+" for gameweek "+gw+"?",
        okButtonText: "Yes",
        cancelButtonText: "No"
    }).then(function(e){
        loader.show(loaderData);
        if(e){
            fetchModule.fetch(apiURL+'selections', {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({
                    gid: groupId,
                    gw: gw,
                    uid: appSettings.getString("id"),
                    cid: tappedItem.id
                })
            }).then(function(response){
                var r = JSON.parse(response._bodyText);
                if(r.response=="success"){
                    loader.hide();

                    dialogs.alert({
                        title: "Select Team",
                        message: "Your chosen team for GW "+gw+" is now "+tappedItem.name+".",
                        okButtonText: "Sweet"
                    }).then(function(){
                        frameModule.topmost().navigate({
                            moduleName: "views/group/group",
                            animated: false,
                            clearHistory: false
                        });
                    });
                } else {
                    console.log("Failed to select team");
                }
            }, function(error){
                console.log(JSON.stringify(error))
            });
        } else {
            loader.hide();
        }
    });
}

function formatDate(date, type) {
    var type = type || 0;

    if(type==0){
        var monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

        var day = date.getDate();
        var monthIndex = date.getMonth();
        var year = date.getFullYear();

        return monthNames[monthIndex] + ' ' + day + ' ' + year;
    } else if(type==1){
        var monthNames = [
            "January", "February", "March",
            "April", "May", "June", "July",
            "August", "September", "October",
            "November", "December"
        ];

        var day = date.getDate();
        var monthIndex = date.getMonth();
        var year = date.getFullYear();
        var hour = date.getHours();
        var minute = date.getMinutes();

        return [
            day + ' ' + monthNames[monthIndex] + ' ' + year + ' ',
            (hour < 10 ? '0'+hour : hour) + ':' + (minute < 10 ? '0'+minute : minute)
        ];
    }

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

exports.navDashboard = function(){
    navigate("dashboard");
}

exports.toggleDrawer = toggleDrawer;
function toggleDrawer(args){
    drawer.toggleDrawerState();
}

exports.toggleFixtures = function(args){
    pageData.fixturesToggle = pageData.fixturesToggle == "collapsed" ? "visible" : "collapsed";
}

exports.teamSelect = function(args){
    pageData.clubSelect = pageData.clubSelect == "collapsed" ? "visible" : "collapsed";
}

exports.refreshPage = refreshPage;
function refreshPage(args) {
    // Get reference to the PullToRefresh;
    var pullRefresh = args.object;

    // Do work here... and when done call set refreshing property to false to stop the refreshing
    frameModule.topmost().navigate({
        moduleName: "views/group/group",
        animated: false,
        clearHistory: false
    });
    //loaded(pageArgs, pullRefresh);
}
