
// logout button action
$("#logout-btn").on('click', () => {

    $.ajax({
        type: "POST",
        url: shaconfig.apiRoot + "auth/logout",
        dataType: 'json'
    });
    
    Cookies.remove("auth-token");

    setTimeout(() => {
        location.reload();
    }, 50);
});

// update active page selected button
function updateActivePage()
{
    $(".nav-link").removeClass('active');
    $('a[href="' + location.hash + '"]').addClass('active');
}

// update current page
var _currPage = null;
setInterval(() => {

    // default hash link
    if (!location.hash) {
        location.hash = '#storages';
    }

    // did link change?
    if (_currPage !== location.hash) {

        // update iframe location
        document.getElementById("main-iframe").src = "/web/" + location.hash.substr(1);
        _currPage = location.hash;

        // special for docs pages since they are auto generated and can't report back the active page
        if (location.hash.substr(1) == 'docs') {
            updateActivePage();
        }
    }

}, 1);

// respond to messages from iframe content
window.addEventListener("message", (event) => {
    
    let data = JSON.parse(event.data);
    if (data.activePage) {
        location.hash = data.activePage;
        _currPage = '#' + data.activePage;
        updateActivePage();
    }
  }, false);