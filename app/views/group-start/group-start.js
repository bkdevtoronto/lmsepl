var googleAnalytics = require("nativescript-google-analytics");
var frameModule = require("ui/frame");
var appSettings = require("application-settings");
var dialogs = require("ui/dialogs");
var observable = require("data/observable");
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
    page = args.object;
    page.bindingContext = {
        groupName: null,
        groupCost: null,
        groupPublic: true
    };

    loader.hide();
    googleAnalytics.logView("Group-Start");
    console.log("Page successfully loaded");
}

exports.btnCreate = btnCreate;
function btnCreate(args){
    var loadingData = {
        message: 'Creating...', progress: 0
    };

    var data = page.bindingContext;

    loader.show(loadingData);

    //Post to API
    fetchModule.fetch(apiURL+"groups", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
            name: data.groupName,
            captain: appSettings.getString("id"),
            paid: data.groupCost!==false && data.groupCost > 0 ? 1 : 0,
            cost: data.groupCost!==false && data.groupCost > 0 ? parseFloat(data.groupCost).toFixed(2) : null,
            public: data.groupPublic ? 1 : 0
        })
    }).then(function(response){
        var r = JSON.parse(response._bodyText);
        if(r.response=="success"){
            dialogs.alert({
                title: "League Creation",
                message: "League successfully created!",
                okButtonText: "Back to Dashboard"
            }).then(function(){
                loader.hide();
                frameModule.topmost().goBack();
            });
        } else {
            loader.hide();
            if(r.response=="duplicate"){
                dialogs.alert({
                    title: "League Creation",
                    message: "League with name '"+data.groupName+"' already exists. Choose another one and try again.",
                    okButtonText: "Ok"
                });
            } else {
                loader.hide();
            }
        }
    },function(error){
        console.log(JSON.stringify(error));
        loader.hide();
    });

}

exports.toggleDrawer = toggleDrawer;
function toggleDrawer(args){
    drawer.toggleDrawerState();
}

exports.navDashboard = navDashboard;
function navDashboard(){
    navigate("dashboard");
}

exports.btnBack = btnBack;
function btnBack(){
    frameModule.topmost().goBack();
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
