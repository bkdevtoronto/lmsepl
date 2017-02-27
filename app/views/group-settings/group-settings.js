var frameModule = require("ui/frame");
var appSettings = require("application-settings");
var dialogs = require("ui/dialogs");
var fetchModule = require("fetch");
var observableModule = require("data/observable");
var loadingIndicator = require("nativescript-loading-indicator").LoadingIndicator;

var pageName = "Group Settings";
var loader = new loadingIndicator;
loader.show({
    message: 'Loading...', progress: 0,
    android: { indeterminate: true, cancelable: false, max: 100, progressNumberFormat: "%1d/%2d", progressPercentFormat: 0.53, progressStyle: 1, secondaryProgress: 1 },
    ios: { details: "Please wait", square: false, margin: 10, dimBackground:true, color: "#4b9ed6" }
});
var apiURL = appSettings.getString("apiURL");
var page;
var pageData;
var groupId;

exports.loaded = function(args){
    page = args.object;

    /* Get group data */
    gotData = page.navigationContext;
    groupId = gotData ? gotData.gid : appSettings.getString("gid");

    fetchModule.fetch(apiURL+"groups/id/"+groupId,{
            method: "get",
            headers: {uid: appSettings.getString("id")}
        }).then(function(response){
            var r = JSON.parse(response._bodyText);
            if(r.response=="success"){
                if(r.groupmeta[0][0].captain != appSettings.getString("id")){
                    goBack();
                    return false;
                }
                pageData = new observableModule.fromObject({
                    teamName: r.groupmeta[0][0].name,
                    active : r.groupmeta[0][0].active==1 ? true : false/*,
                    teamDate: "Est. " + formatDate(new Date(r.groupmeta[0][0].date)),
                    isCaptain: r.groupmeta[0][0].captain==appSettings.getString("id") ? true : false,
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
                    scorevalue: "-"*/
                });

                gw = r.groupmeta.gw;
                page.bindingContext = pageData;
                console.log(pageName+" page successfully loaded");
                loader.hide();
            } else {
                console.log(JSON.stringify(r));
                loader.hide();
            }
        });



    loader.hide();
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

exports.navDashboard = navDashboard;
function navDashboard(){
    navigate("dashboard");
}

exports.goBack = goBack;
function goBack(){
    frameModule.topmost().navigate({
        moduleName: "views/group/group",
        transition:{
            name: "flipLeft",
            curve: "easeIn"
        },
        context:{
            gid:groupId
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
