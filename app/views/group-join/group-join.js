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

/*var reset = {
    id: null,
    name: "Enter a search term...",
    ismember: false,
    active: false,
    paid: false,
    cost: null,
    icon: null
}*/

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
                r.data[0].forEach(function(e){
                    a.push({
                        name: e.name,
                        icon: e.captain==appSettings.getString("id") ? "res://icon_league_captain" : "res://icon_league_player",
                        active: e.active==1 ? true : false,
                        id: e.id,
                        ismember: false,
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
