var applicationSettings = require("application-settings");
var observableModule = require("data/observable").Observable;

var pages = [["Title1","Desc1","image1.png"],["Title2","Desc2","image2.png"]]
var pageNum = 1;
var pageText = new observableModule({
    pageTitle: pages[0][0],
    pageDesc: pages[0][1]/*,
    pageImage: pages[0][2]*/
})

exports.loaded = function(args){
    applicationSettings.setBoolean("firstLaunchComplete",true);

    page = args.object;
    page.bindingContext = pageText;
}

exports.nextPage = function(){
    pageNum++;
    console.log(pages.length);
    if(pageNum > pages.length){
        pageNum = 1;
    }
    pageText.set("pageTitle", pages[pageNum-1][0]);
    pageText.set("pageDesc", pages[pageNum-1][1]);
    //pageImage = pages[page-1][2];
}
