var frameModule = require("ui/frame");
var appSettings = require("application-settings");
var tnsOAuthModule = require("nativescript-oauth");
var fetchModule = require("fetch");
var http = require("http"); //https://www.thepolyglotdeveloper.com/2016/02/use-the-http-module-instead-of-fetch-in-nativescript/
var dockModule = require ("ui/layouts/dock-layout");
var imageCacheModule = require("ui/image-cache");
var imageSource = require("image-source");
var fs = require("file-system");
var loadingIndicator = require("nativescript-loading-indicator").LoadingIndicator;

var loader = new loadingIndicator;
var loaderOptions = {
    message: 'Loading...',
    progress: 0,
    android: {
        indeterminate: true,
        cancelable: false,
        max: 100,
        progressNumberFormat: "%1d/%2d",
        progressPercentFormat: 0.53,
        progressStyle: 1,
        secondaryProgress: 1
    },
    ios: {
        details: "Please wait",
        square: false,
        margin: 10,
        dimBackground:true,
        color: "#4b9ed6"
    }
};

loader.show(loaderOptions);

// Retrieve API URL
var apiURL = appSettings.getString("apiURL");
var imgURL = appSettings.getString("imgURL");

exports.navigatedTo = function(args){
    var page = args.object;
    page.bindingContext = {};

    loader.hide();
    console.log("Application started successfully");
    if(appSettings.hasKey("username")&&appSettings.hasKey("email")&&appSettings.hasKey("fbid")&&appSettings.hasKey("img")){
        console.log("Details stored");
        frameModule.topmost().navigate("views/dashboard/dashboard");
    }
}

exports.fbConnect = function(args){
    console.log("Facebook Connect button tapped");

    //Connect to user's Facebook profile and retreive data
    tnsOAuthModule.login()
        .then(()=>{
            console.log('Connected to Facebook');
            var token = tnsOAuthModule.accessToken();

            tnsOAuthModule.ensureValidToken()
                .then((token) => {
                    fetchModule.fetch('https://graph.facebook.com/me?fields=id,name,email,picture&access_token='+token, {
                            method: "get"
                        })
                        .then(function(response){
                            var user = JSON.parse(response._bodyText);
                            appSettings.setString("username",user.name);
                            appSettings.setString("email",user.email);
                            appSettings.setString("fbid",user.id);
                            appSettings.setString("fbimg","http://graph.facebook.com/"+user.id+"/picture?type=large");

                            //Check if user's data already exists
                            fetchModule.fetch(apiURL+"users/fbid/"+appSettings.getString("fbid"),{
                                    method: "get"
                                }).then(function(response){
                                    var r = JSON.parse(response._bodyText);
                                    if(r.response=="success"){
                                        var loaderOptionsFbconnect = loaderOptions;
                                        loaderOptionsFbconnect.message = "Verifying user data...";
                                        loader.show(loaderOptionsFbconnect);

                                        var usr = r.data[0];
                                        appSettings.setString("username",r.data[0].username);
                                        var img = r.data[0].img.split("/")[r.data[0].img.split("/").length-1];
                                        var url = imgURL+"prof/"+img;
                                        console.log(url);
                                        var path = fs.path.join(fs.knownFolders.documents().path, "profilePic.png");
                                        appSettings.setString("img",path);

                                        var cache = new imageCacheModule.Cache();
                                        cache.maxRequests = 5;
                                        cache.enableDownload();

                                        var imgSouce = imageSource.ImageSource;
                                        var image = cache.get(url);
                                        if(image){
                                            imgSouce = imageSource.fromNativeSource(image);
                                        } else {
                                            cache.push({
                                                key:url,
                                                url:url,
                                                completed: (image, key) => {
                                                    if(url===key){
                                                        imgSouce = imageSource.fromNativeSource(image);
                                                        var saved = imgSouce.saveToFile(path, "png");
                                                    }
                                                }
                                            });
                                        }

                                        cache.disableDownload();
                                        loader.hide();
                                        console.log("Login sucessful");
                                        frameModule.topmost().navigate("views/dashboard/dashboard");
                                    } else {
                                        fetchModule.fetch(apiURL+"users", {
                                            method: "POST",
                                            headers: {"Content-Type":"application/json"},
                                            body: JSON.stringify({
                                                username: appSettings.getString("username"),
                                                email: appSettings.getString("email"),
                                                fbid: appSettings.getString("fbid"),
                                                img: appSettings.getString("fbimg")
                                            })
                                        }).then(function(response){
                                            console.log(JSON.stringify(response._bodyText));
                                        },function(error){
                                            console.log(JSON.stringify(error));
                                        })
                                    }
                                });
                        }, function(error){
                            console.log(JSON.stringify(error));
                        });
                })
                .catch((er)=>{
                    console.log("Error: "+er)
                });
        })
        .catch((er)=>{
            console.log(er);
        });

    /*if(!appSettings.hasKey("firstLaunchComplete")){
        frameModule.topmost().navigate("views/firstlaunch/firstlaunch");
    } else {
        //frameModule.topmost().navigate("views/dashboard/dashboard");
        alert("You've already been here!");
        frameModule.topmost().navigate("views/firstlaunch/firstlaunch");
    }*/

}
