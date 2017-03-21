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
var ads = false;

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
var pageData, gw, upcomingGw, groupId, pageArgs;
var activateReady = 0;

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
    if(ads){
        admob.createBanner({
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
        );
    }

    fetchModule.fetch(apiURL+"groups/id/"+groupId,{
            method: "get",
            headers: {uid: appSettings.getString("id")} //https://www.npmjs.com/package/node-fetch#options
        }).then(function(response){
            var r = JSON.parse(response._bodyText);
            if(r.response=="success"){
                gw = r.groupmeta.gw;
                upcomingGw = r.groupmeta.upcoming_gw;

                var userInThisWk = false;
                var userInLastWk = false;
                var userInStartWk = false;
                var hasTrophy = r.trophy ? true : false;
                var isActive = r.groupmeta[0][0].active==1 ? true : false;
                var selectionArray = r.selections[0];
                var isStartGw = r.trophy && r.trophy.gw==gw ? true : false;
                var startGw = r.trophy.gw;
                var weeks = selectionArray.length-1;
                var startGwSelections = lastGwSelections = thisGwSelections = [];
                var clubArray = [];
                var matchArray = [];
                var matchHeight = 0;

                if(r.members){
                    for(var i=0; i<selectionArray.length; i++){
                        var item = {
                            gw : i.gw,
                            uid: i.uid,
                            cname: i.name
                        };
                        if(i.gw==gw){
                            thisGwSelections.push(item);
                        } else if(i.gw==(gw-1)){
                            lastGwSelections.push(item);
                        } else if(i.gw==selectionArray[weeks].gw){
                            startGwSelections.push(item);
                        } else {
                            console.log("Error parsing gameweek of selection");
                        }
                    }

                    r.members[0].forEach(function(e){
                        var tN = null;
                        var tId = null;
                        var status = null;
                        selectionArray.forEach(function(a){
                            if(a.uid==e.id&&a.gw==gw){
                                tN = a.name;
                                tId = a.cid;
                            }
                        });
                        var inThisWk = false;
                        thisGwSelections.forEach(function(s){
                            if(s.uid==e.id&&isActive) inThisWk=true;
                        });
                        var inLastWk = false;
                        lastGwSelections.forEach(function(s){
                            if(s.uid==e.id&&isActive) inLastWk=true;
                        });
                        var inStartWk = false;
                        startGwSelections.forEach(function(s){
                            if(s.uid==e.id&&isActive) inStartWk=true;
                        });

                        if (!isStartGw&&inStartWk){
                            //check if selected
                            status=1;
                        } else if (isStartGw&&!inStartWk){
                            // check if not entered
                            status=2;
                        } else if (!isStartGw&&inLastWk){
                            // check if entered and no selection made
                            status=3;
                        } else {
                            //if no selections at all
                            status=4;
                        }

                        if(e.id==appSettings.getString("id")) userStatus = status;

                        var item = {
                            name: e.username,
                            id: e.id,
                            icon: r.groupmeta[0][0].captain==e.id ? "res://icon_league_captain" : "res://icon_league_player",
                            selectionName: tN ? tN : false,
                            selectionId: tId ? tId : false,
                            status: status
                        };

                        groupArray.push(item);
                    });
                }

                if(r.matches){
                    var ko = null;
                    r.matches.forEach(function(e){
                        if(e.ko!=ko){
                            ko = e.ko;
                            matchHeight += 32;
                            matchArray.push({home: false, away: false, homes: false, aways: false, ko: e.ko, koLabelDate: formatDate(new Date(e.ko), 1)[0], koLabelTime: formatDate(new Date(e.ko), 1)[1] });
                        }
                        matchHeight +=25;
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

                if(hasTrophy){
                    trophyId = r.trophy.id;
                    trophyName = r.trophy.name;
                    trophyCost = r.trophy.cost;
                    trophyPremium = r.trophy.premium;
                }

                pageData = new observableModule.fromObject({
                    groupArray : new observableArray(groupArray),
                    groupsHeight: groupArray.length * 42,
                    teamName: r.groupmeta[0][0].name,
                    active : isActive,
                    inactive : !isActive,
                    teamDate: "Est. " + formatDate(new Date(r.groupmeta[0][0].date)),
                    isCaptain: r.groupmeta[0][0].captain==appSettings.getString("id") ? true : false,
                    gw: gw,
                    selectionName: r.groupmeta.selectionName,
                    selectionId: r.groupmeta.selectionId,
                    clubArray : new observableArray(clubArray),
                    clubHeight: (clubArray.length) * 25,
                    clubSelect : 'collapsed',
                    fixturesToggle : 'collapsed',
                    matchArray: new observableArray(matchArray),
                    matchHeight: matchHeight,

                    hasTrophy: hasTrophy,
                    trophyId: hasTrophy ? trophyId : false,
                    trophyName: hasTrophy ? trophyName : false,
                    trophyCost: hasTrophy ? trophyCost : false,
                    trophyPremium: hasTrophy ? trophyPremium : false,
                    round: (parseInt(gw) + 1 - parseInt(startGw) < 0) ? "ENTRY" : (parseInt(gw) + 1 - parseInt(startGw)),
                    trophyDeadline: hasTrophy ? (r.deadline <= 0 ? false : r.deadline) : false,
                    startGw : startGw,

                    userStatus: userStatus,

                    activateForm: false,
                    activateFormName: "The " + r.groupmeta[0][0].name + " Cup",
                    activateFormPremium: false,
                    activateFormCost: 100,
                    activateFormGw: parseInt(gw)+1,

                    profilePic: appSettings.getString("img"),
                    username: appSettings.getString("username"),
                    scorevalue: "-",

                    pageLoaded: 1
                });

                gw = r.groupmeta.gw;

                page.bindingContext = pageData;
                loader.hide();
                console.log("Group page successfully loaded");
                if(pullRefresh) pullRefresh.refreshing = false;
            } else {
                console.log(JSON.stringify(r));
                loader.hide();
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

exports.navSettings = navSettings;
function navSettings(){
    navigate("settings");
}

exports.navProfile = navProfile;
function navProfile(){
    navigate("profile");
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

exports.groupSettings = groupSettings;
function groupSettings(){
    frameModule.topmost().navigate({
        moduleName: "views/group-settings/group-settings",
        animated: true,
        context: { gid: groupId },
        transition: {
            name: "flip",
            curve: "easeIn"
        }
    });
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

exports.showActivateForm = showActivateForm;
function showActivateForm(args){
    pageData.activateForm = true;

    var css = "group-activate";
    var view = page.getViewById("group-activate");
    view.className = css;

    if(activateReady==0){
        setTimeout(function(){
            activateReady=1;
        }, 500);
    } else {
        btnActivate(args);
    }
}

function btnActivate(args){
    page.getViewById("activateFormCost").android.clearFocus();
    page.getViewById("activateFormName").android.clearFocus();

    dialogs.confirm({
        title: "Trophy",
        message: "Are you sure you want to activate this trophy?",
        okButtonText: "Yes",
        cancelButtonText: "No",
        neutralButtonText: "Cancel"
    }).then(function(result){
        if(result){
            var loadingData = {
                message: 'Creating Trophy...',
                progress: 0
            };

            loader.show(loadingData);

            //Post to API
            fetchModule.fetch(apiURL+"trophies", {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({
                    gid : groupId,
                    trCost : pageData.activateFormCost,
                    trName : pageData.activateFormName,
                    trGw : pageData.activateFormGw,
                    uid : appSettings.getString("id"),
                    premium : pageData.activateFormPremium ? 1 : 0
                })
            }).then(function(response){
                console.log(JSON.stringify(response));
                var r = JSON.parse(response._bodyText);
                if(r.response=="success"){
                    dialogs.alert({
                        title: "Trophy Creation",
                        message: pageData.activateFormName+" is now open for applications!",
                        okButtonText: "Back to League"
                    }).then(function(){
                        frameModule.topmost().navigate({
                            moduleName: "views/group/group",
                            animated: false,
                            clearHistory: false
                        });
                        loader.hide();
                    });
                } else {
                    loader.hide();
                    if(r.response=="failure"){
                        r.errors.forEach(function(e){
                            dialogs.alert({
                                title: "Trophy Creation",
                                message: "Could not create trophy: "+e[0],
                                okButtonText: "OK"
                            });
                        });
                        loader.hide();

                    } else {
                        console.log(JSON.stringify(r));
                        loader.hide();
                    }
                }
            },function(error){
                console.log(JSON.stringify(error));
                loader.hide();
            });
        } else {
            return false;
        }
    })

}

exports.formFnGwUp = formFnGwUp;
function formFnGwUp(args){
    pageData.activateFormGw = (((parseInt(pageData.activateFormGw) + 1) <= 35) ? (parseInt(pageData.activateFormGw) + 1) : 35);
}

exports.formFnGwDown = formFnGwDown;
function formFnGwDown(args){
    pageData.activateFormGw = (((parseInt(pageData.activateFormGw) - 1) < upcomingGw) ? upcomingGw : (parseInt(pageData.activateFormGw) - 1));
}
