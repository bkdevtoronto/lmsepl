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
var pageData;

exports.loaded = function(args){
    var gotData;
    var groupArray = [];
    page = args.object;
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

    console.log(apiURL+"groups/id/"+groupId);

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
                if(r.matches){
                    r.matches.forEach(function(e){
                        clubArray.push({name: e.home, id: e.homeid, opp: e.away });
                        clubArray.push({name: e.away, id: e.awayid, opp: e.home });
                        //console.log(e.home+" v "+e.away+" ko "+e.ko);
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

                    profilePic: appSettings.getString("img"),
                    username: appSettings.getString("username"),
                    scorevalue: "-"
                });

                page.bindingContext = pageData;
                loader.hide();
                console.log("Group page successfully loaded");
            } else {
            }
        });
}

function formatDate(date) {
  var monthNames = [
    "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"
  ];

  var monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();

  return monthNames[monthIndex] + ' ' + day + ' ' + year;
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

exports.teamSelect = function(args){
    pageData.clubSelect = pageData.clubSelect == "collapsed" ? "visible" : "collapsed";
}
