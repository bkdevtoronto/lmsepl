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
var tabViewModule = require("ui/tab-view");

var loader = new loadingIndicator;
loader.show();
var drawer, page, gotData, pageArgs, groupId, gw;
var pageData = new observableModule.Observable;
var apiURL = appSettings.getString("apiURL");

exports.loaded = loaded;
function loaded(args){
    page = args.object;
    gotData = page.navigationContext;
    drawer = view.getViewById(page,"sideDrawer");
    groupId = gotData ? gotData.gid : appSettings.getString("gid");
    appSettings.setString("gid",groupId);

    //Page Meta
    pageData.pageLoaded = 0;
    pageData.showFixtures = false;

    //User Meta
    pageData.userEntered = false;

    //Profile Meta
    pageData.profilePic = appSettings.getString("img");
    pageData.username = appSettings.getString("username");
    pageData.scorevalue = appSettings.getString("points") || 0;

    //Group Meta
    pageData.groupName = "Loading...";
    pageData.groupDate = "Loading...";
    pageData.isCaptain = false;
    pageData.upcomingGw = false;

    //Activate Form
    pageData.activateFormName = "The Royal Trophy";
    pageData.activateFormPremium = false;
    pageData.activateFormCost = 100;
    pageData.activateFormGw = 0;

    //Members
    pageData.membersList = new observableArray({});
    pageData.membersHeight = 0; // * 42

    //Trophy
    pageData.hasTrophy = false;
    pageData.trophyId = false;
    pageData.trophyName = "Loading...";
    pageData.trophyCost = false;
    pageData.trophyPremium = false;
    pageData.trophyRound = false;
    pageData.trophyStartGw = false;

    //Fixtures
    pageData.fixturesList = new observableArray({});
    pageData.fixturesHeight = 0;

    page.bindingContext = pageData;

    //Fetch from API
    fetchModule.fetch(apiURL+"groups/id/"+groupId,{
            method: "get",
            headers: {uid: appSettings.getString("id")} //https://www.npmjs.com/package/node-fetch#options
        }).then(function(response){
            var r = JSON.parse(response._bodyText);
            if(r.response=="success"){
                if(r.data.gameweek){
                    gw = parseInt(r.data.gameweek);
                }

                if(r.data.group){
                    var group = r.data.group;
                    pageData.set("groupName",(group.groupName));
                    pageData.set("groupDate",("Est. " + formatDate(new Date(group.groupDate))));
                    pageData.set("isCaptain",((appSettings.getString("id")==group.groupCaptain) ? true : false));
                    pageData.set("upcomingGw", gw);

                    if(appSettings.getString("id")==group.groupCaptain){
                        pageData.set("activateFormName", "The " + group.groupName + " Cup");
                        pageData.set("activateFormPremium", false);
                        pageData.set("activateFormCost", 100);
                        pageData.set("activateFormGw", gw+1);
                    }
                }


                if(r.data.trophy){
                    var trophy = r.data.trophy;
                    var trophyStartWeek = parseInt(trophy.trophyStartWeek);
                    pageData.set("hasTrophy",(true));
                    pageData.set("trophyId",(trophy.trophyId));
                    pageData.set("trophyName",(trophy.trophyName));
                    pageData.set("trophyCost",(trophy.trophyCost));
                    pageData.set("trophyPremium",(trophy.trophyPremium==1 ? true : false));
                    pageData.set("trophyRound",((gw <= trophyStartWeek) ? "ENTRY" : (gw + 1 - trophyStartWeek)));
                    pageData.set("trophyStartWeek",(trophy.trophyStartWeek));
                }

                if(r.data.members){
                    var m = r.data.members;
                    m.forEach(function(e){
                        if(e.memberId==appSettings.getString("id")){
                            pageData.set("userEntered",(e.trophyEntered));
                        }
                    });
                }

                if(r.data.fixtures){
                    var f = r.data.fixtures;
                    var ko = false;

                    var fL = [];
                    var fH = 0;

                    f.fixturesMatches.forEach(function(e){
                        if(!ko||(e.ko!=ko)){
                            ko = e.ko;
                            fH += 33;
                            fL.push({
                                ko: e.ko,
                                koLabelDate: formatDate(new Date(e.ko), 1)[0],
                                koLabelTime: formatDate(new Date(e.ko), 1)[1],
                                isHeader: true,

                                home: false,
                                away: false,
                                homes: false,
                                aways: false
                            });
                        }

                        fH +=25;
                        fL.push({
                            home: e.home,
                            away: e.away,
                            homes: e.homes || "",
                            aways: e.aways || "",

                            isHeader: false,
                            ko: false
                        });
                    });

                    pageData.set("fixturesHeight",(fH));
                    pageData.set("fixturesList",(fL));
                }

                pageData.set("pageLoaded",1);
                console.log("Group page successfully loaded");
                loader.hide();
            } else {
                pageData.set("pageLoaded",1);
                console.log("Group page not successfully loaded");
                loader.hide();
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

exports.pushEnter = pushEnter;
function pushEnter(){
    loader.show();

    if(parseInt(pageData.trophyCost) > parseInt(pageData.scorevalue)){
        dialogs.alert({
            title: "Trophy Entry",
            message: "You need more "+(pageData.trophyPremium==1 ? 'cash' : 'points')+' to enter this trophy!',
            okButtonText: "Back to League"
        }).then(function(){
            loader.hide();
        });
        return false;
    }

    fetchModule.fetch(apiURL+"trophies/join", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
            uid: appSettings.getString("id"),
            tid: pageData.trophyId
        })
    }).then(function(response){
        var r = JSON.parse(response._bodyText);
        if(r.response=="success"){
            dialogs.alert({
                title: "Trophy Entry",
                message: "You have now entered "+pageData.trophyName+". Good luck!",
                okButtonText: "Thanks"
            }).then(function(){
                frameModule.topmost().navigate({
                    moduleName: "views/group/group",
                    animated: false,
                    clearHistory: false
                });
                loader.hide();
            });
        }
        loader.hide();
    });
}

exports.toggleFixtures = toggleFixtures;
function toggleFixtures(args){
    //pageData.showFixtures = pageData.showFixtures ? false : true;
    pageData.set("showFixtures", pageData.showFixtures ? false : true);
    /*console.log(args.object.bindingContext.showFixtures);
    console.log(page.bindingContext.showFixtures);
    console.log(pageData.showFixtures);*/
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

exports.activateForm = activateForm;
function activateForm(args){
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
                        loader.hide();
                    }
                }
            },function(error){
                loader.hide();
            });
        } else {
            return false;
        }
    })

}

exports.formFnGwUp = formFnGwUp;
function formFnGwUp(args){
    pageData.set("activateFormGw", (((parseInt(pageData.activateFormGw) + 1) <= 35) ? (parseInt(pageData.activateFormGw) + 1) : 35));
}

exports.formFnGwDown = formFnGwDown;
function formFnGwDown(args){
    pageData.set("activateFormGw", ((parseInt(pageData.activateFormGw) - 1) < gw) ? gw : (parseInt(pageData.activateFormGw) - 1));
}
