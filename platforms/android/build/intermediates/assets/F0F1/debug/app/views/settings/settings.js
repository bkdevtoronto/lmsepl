var frameModule = require("ui/frame");
var appSettings = require("application-settings");
var view = require("ui/core/view");
var dialogs = require("ui/dialogs");

var drawer;

var settings = [
    ["toggleableItem", "boolean"]
];
settings.forEach(function(e){
    if(appSettings.hasKey(e[0])) {
        if(e[1]=="boolean"){
            settings[0][2] = appSettings.getBoolean(e[0]);
        }
    }
})

exports.loaded = function(args){
    var page = args.object;
    page.bindingContext = {
        "toggleableItem" : settings[0][2]
    };
    drawer = view.getViewById(page,"sideDrawer");
    console.log("Settings page successfully");
}

exports.toggleDrawer = toggleDrawer;
function toggleDrawer(args){
    drawer.toggleDrawerState();
}

exports.navDashboard = navDashboard;
function navDashboard(){
    frameModule.topmost().navigate("views/dashboard/dashboard");
}

exports.save = save;
function save(args){
    var page = args.object.bindingContext;
    appSettings.setBoolean("toggleableItem", page["toggleableItem"]);
    console.log("Settings saved");
}

exports.logout = logout;
function logout(args){
    dialogs.confirm({
        title: "Log Out",
        message: "Are you sure you want to log out? All your data on this device will be removed, but if you log in again your data will be restored.",
        okButtonText: "Log Out",
        cancelButtonText: "Cancel"
    }).then(function(result){
        if(result){
            appSettings.clear();
            console.log("User data deleted");
            frameModule.topmost().navigate("views/start/start");
        } else {
            return false;
        }
    })
}
