var frameModule = require("ui/frame");
var appSettings = require("application-settings");
var view = require("ui/core/view");
var dialogs = require("ui/dialogs");
var imageModule = require("image-source");
var observable = require("data/observable");
var fs = require("file-system");
var imagepicker = require("nativescript-imagepicker");
var loadingIndicator = require("nativescript-loading-indicator").LoadingIndicator;
var http = require("http");
var permissions = require("nativescript-permissions");
var icModule = require("nativescript-imagecropper");

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

var drawer;
var imgView;
var imgTmp = null;
var page;
var apiURL = appSettings.getString("apiURL");

exports.loaded = function(args){
    var username = appSettings.getString("username");
    var img = appSettings.getString("img");

    page = args.object;
    page.bindingContext = {
        "username" : username,
        "profilePic" : img
    };

    imgView = view.getViewById(page, "img");
    imgView.imageSource = imageModule.fromFile(img);
    drawer = view.getViewById(page,"sideDrawer");
    var usernameField = view.getViewById(page,'username');
        var fArray = [];
        fArray[0] = new android.text.InputFilter.LengthFilter(16);
        usernameField.android.setFilters(fArray);

    loader.hide();
    console.log("Settings page successfully loaded");
}

exports.toggleDrawer = toggleDrawer;
function toggleDrawer(args){
    drawer.toggleDrawerState();
}

exports.navDashboard = navDashboard;
function navDashboard(){
    navigate("dashboard");
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

exports.save = save;
function save(args){
    page = args.object.bindingContext;
    var n_username = page["username"];

    console.log("Settings saved");
}

exports.changeImg = changeImg;
function changeImg(args){
    var page = args.object;

    var context = imagepicker.create({
        mode: "single"
    });

    permissions.requestPermission(android.Manifest.permission.READ_EXTERNAL_STORAGE, "We need this permission to allow us to save your new Avatar to your profile")
        .then(function(){
            permiss = true;
            console.log("Permissions accepted");
            startSelection(context);
        })
        .catch(function(){
            console.log("Permissions denied");
        });

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

function startSelection(context) {
    context
    .authorize()
    .then(function(){
        return context.present();
    })
    .then(function(selection){
        var selected_item = selection[0];

        var cropper = new icModule.ImageCropper();

        selected_item.getImage().then(function(originalSource){
            cropper.show(originalSource, {width:100, height: 100}).then(function(args){
                if(args.image !== null){
                    let folder = fs.knownFolders.documents();
                    let path = fs.path.join(folder.path, "tmpImg.png");
                    let saved = args.image.saveToFile(path, "png");
                    imgTmp = path;
                    imgView.imageSource = imageModule.fromFile(path);
                }
            })
            .catch(function(e){
                console.log("Image crop error: "+e);
            })
        })
    });
}
