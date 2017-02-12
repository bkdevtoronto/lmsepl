var googleAnalytics = require("nativescript-google-analytics");
var frameModule = require("ui/frame");
var appSettings = require("application-settings");
var dialogs = require("ui/dialogs");
var observableModule = require("data/observable");
var observableArray = require("data/observable-array").ObservableArray;
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
    var pageData;

    page = args.object;
    pageData = new observableModule.fromObject({
        searchPhrase : "",
        searchResults : {},
        icon : null
    });
    page.bindingContext = pageData;

    loader.hide();
    console.log("Page successfully loaded");
    googleAnalytics.logView("Join Group");
}

exports.onTap = function(args) {
    var tappedIndex = args.index;
    var tappedView = args.view;
    tappedItem = tappedView.bindingContext;

    if(tappedItem.ismember){
        frameModule.topmost().navigate({
            moduleName: "/views/group/group",
            context: { gid: tappedItem.id }
        });
    } else {
        dialogs.confirm({
            title: "Join League",
            message: "Are you sure you want to join "+tappedItem.name+"?",
            okButtonText: "Yes",
            cancelButtonText: "No",
            neutralButtonText: "Not yet"
        }).then(function(e){
            if(e){
                //User pressed "yes"
                fetchModule.fetch(apiURL+"groups/join", {
                    method: "POST",
                    headers: {"Content-Type":"application/json"},
                    body: JSON.stringify({
                        uid: appSettings.getString("id"),
                        gid: tappedItem.id
                    })
                }).then(function(response){
                    var r = JSON.parse(response._bodyText);
                    console.log(JSON.stringify(r));
                    if(r.response=="success"){
                        dialogs.alert({
                            title: "Join League",
                            message: "You are now a member of "+tappedItem.name+"!",
                            okButtonText: "Back to Dashboard"
                        }).then(function(){
                            frameModule.topmost().navigate("/views/dashboard/dashboard");
                        })
                    } else {
                        console.log("Failure to join group");
                    }
                },function(error){
                    console.log(JSON.stringify(error));
                });
            }
        });
    }
}

exports.onClear = function(){
    page.bindingContext.searchResults = {};
}

exports.onSubmit = function(args) {
    var s = page.bindingContext.searchPhrase;
    var a = [];
    loader.show();

    if(!s||s==""){
        console.log("No search input");
        return false;
    }

    fetchModule.fetch(apiURL+"groups/name/"+s,{
            method: "get"
        }).then(function(response){
            var r = JSON.parse(response._bodyText);
            if(r.response=="success"){
                var m = [];
                if(appSettings.hasKey("groups")){
                    var g = JSON.parse(appSettings.getString("groups"));
                    g.forEach(function(e){
                        m.push(e["id"]);
                    });
                }

                r.data[0].forEach(function(e){
                    a.push({
                        name: e.name,
                        active: e.active==1 ? true : false,
                        id: e.id,
                        ismember: m.indexOf(e.id)!==-1 ? true : false,
                        paid: e.paid==1 ? true : false,
                        cost: e.cost
                    });
                });
                page.bindingContext.searchResults = new observableArray(a);
                loader.hide();
            } else {
                page.bindingContext.searchResults = new observableArray({});
                loader.hide();
            }

        });
};

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
