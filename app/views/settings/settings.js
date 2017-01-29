var frameModule = require("ui/frame");
var appSettings = require("application-settings");
var view = require("ui/core/view");
var dialogs = require("ui/dialogs");

var drawer;

var username = appSettings.getString("username");

exports.loaded = function(args){
    var page = args.object;
    page.bindingContext = {
        //"toggleableItem" : settings[1][2],
        "username" : username
    };
    drawer = view.getViewById(page,"sideDrawer");

    var usernameField = view.getViewById(page,'username');
        var fArray = [];
        fArray[0] = new android.text.InputFilter.LengthFilter(16);
        usernameField.android.setFilters(fArray);

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
