var frameModule = require("ui/frame");
var appSettings = require("application-settings");
var view = require("ui/core/view");
var frameModule = require("ui/frame");

var drawer;

exports.loaded = function(args){
    var page = args.object;
    page.bindingContext = {
        profilePic: appSettings.getString("img"),
        username: appSettings.getString("username"),
        scorevalue: "high #420"
    };
    drawer = view.getViewById(page,"sideDrawer");
    console.log("Dashboard loaded successfully");
}

exports.toggleDrawer = toggleDrawer;
function toggleDrawer(args){
    drawer.toggleDrawerState();
}

exports.navSettings = navSettings;
function navSettings(){
    frameModule.topmost().navigate("views/settings/settings");
}
