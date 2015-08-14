function loadCSS(path) {
    var elem = document.createElement('link');
    var head = document.getElementsByTagName('head')[0];
    elem.rel = 'stylesheet';
    elem.href = path;
    elem.media = 'only x';
    head.appendChild(elem);
    setTimeout(function () {
      elem.media = 'all';
    });
}
