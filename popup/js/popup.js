console.log("popup script loaded");
//chrome.action.setBadgeText({
//    text: "OFF",
  //});

document.addEventListener('DOMContentLoaded', function() {
  var findButton = document.getElementById('popupFindButton');
  findButton.addEventListener('click', function() {
    var input = document.createElement("input");
    input.type = "text";
    input.id = "myInput";
    document.body.appendChild(input);


    //chrome.windows.create({
      //url: chrome.runtime.getURL('../search/search.html'),
      //type: 'popup',
      //width: 500,
//      height: 300
    //});

    //var search = document.getElementById('searchInput');
    //alert(search.value);
  }, false);
}, false);