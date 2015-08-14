(function() {
    var weekday = function() {
        var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            now = new Date();
        return dayNames[now.getDay()];
    };
    console && console.log('%crangeslider.js\n%cSimple, small and fast JavaScript/jQuery polyfill\nfor the HTML5 <input type=\"range\"> slider element. \n\nThanks for taking a look :)\nIt\'s always nice to see you.\nHave a nice '+ weekday() +'!\n\n<3\n\nAndré', 'font-size:2em;color:#00ff00;', 'color:#404040;font-size:1em;');
})();


