var frameModule = require("ui/frame");
var applicationSettings = require("application-settings");

exports.loaded = function(args){
    console.log("Application started successfully");
}

exports.fbConnect = function(){
    console.log("Facebook Connect button tapped");

    console.log("Login sucessful");
    if(!applicationSettings.hasKey("firstLaunchComplete")){
        frameModule.topmost().navigate("views/firstlaunch/firstlaunch");
    } else {
        //frameModule.topmost().navigate("views/dashboard/dashboard");
        alert("You've already been here!");
        frameModule.topmost().navigate("views/firstlaunch/firstlaunch");
    }

}
