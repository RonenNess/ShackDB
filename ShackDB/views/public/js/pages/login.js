
// animate the login card
$("#login-card").animate({'top': '2em'}, 1500);

// do login button actions
let loginBtn = $("#login-btn");
loginBtn.on('click', () => {

    // do form validations
    try {
        document.getElementById("login-form").reportValidity();
    } catch(e) {}

    // get username and password
    let username = $("#login-username").val();
    let password = $("#login-password").val();

    // hide previous error
    $("#login-error").hide();

    // missing username or password? skip
    if (!username || !password) { return; }

    // disable login button
    loginBtn.prop('disabled', true);

    // send login request
    $.ajax({
        type: "POST",
        url: shaconfig.apiRoot + "auth/login",
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            username: username,
            password: password
        }),
        success: (data) => {
            console.log(data);
            loginBtn.prop('disabled', false);
            location.reload();
        },
        error: (err) => {
            $("#login-error").text(err.responseJSON ? err.responseJSON.error : err.statusText).show(1000);
            setTimeout(() => {
                loginBtn.prop('disabled', false);
            }, 500);
        },
    });
});