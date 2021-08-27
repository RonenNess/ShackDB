
// button to delete user
$("#manage-delete-button").on('click', function() {
    let username = $(this).attr('data-user');
    $("#approve-delete-modal").modal('show');
    $("#delete-user-id").text(username);
    $("#delete-user-confirm-btn").attr('data-username', username);
});

// delete user approve button
$("#delete-user-confirm-btn").on('click', function() {
    let username = $(this).attr('data-username');
    $.ajax({
        type: "DELETE",
        url: shaconfig.apiRoot + "users/" + username,
        dataType: 'json',
        contentType: 'application/json',
        success: (data) => {
            showSuccessMessage("User deleted!", "Successfully deleted user.", function() {location.reload()});
        },
        error: (err) => {
            showErrorMessage("Failed to delete user", err.responseJSON ? err.responseJSON.error : err.statusText);
        },
    }); 
});


// enable button
$("#manage-enable-button").on('click', function() {
    let userId = $(this).attr('data-user');
    $.ajax({
        type: "PUT",
        url: shaconfig.apiRoot + "users/" + userId,
        dataType: 'json',
        data: JSON.stringify({enabled: true}),
        contentType: 'application/json',
        success: (data) => {
            showSuccessMessage("User enabled!", "Successfully changed user state to 'enabled'.", function() {location.reload()});
        },
        error: (err) => {
            showErrorMessage("Failed to enable user", err.responseJSON ? err.responseJSON.error : err.statusText);
        },
    }); 
});


// disable button
$("#manage-disable-button").on('click', function() {
    let userId = $(this).attr('data-user');
    $.ajax({
        type: "PUT",
        url: shaconfig.apiRoot + "users/" + userId,
        dataType: 'json',
        data: JSON.stringify({enabled: false}),
        contentType: 'application/json',
        success: (data) => {
            showSuccessMessage("User disabled!", "Successfully changed user state to 'disabled'.", function() {location.reload()});
        },
        error: (err) => {
            showErrorMessage("Failed to disable user", err.responseJSON ? err.responseJSON.error : err.statusText);
        },
    }); 
});


// change password button
$("#manage-update-password-button").on('click', function() {
    let userId = $(this).attr('data-user');
    let password = $("#new-password").val();
    if (!password) {
        showErrorMessage("Missing Password", "Please provide a valid password to change to.");
        return;
    }
    $.ajax({
        type: "PUT",
        url: shaconfig.apiRoot + "users/" + userId,
        dataType: 'json',
        data: JSON.stringify({password: password}),
        contentType: 'application/json',
        success: (data) => {
            showSuccessMessage("User updated!", "Successfully changed user password.", function() {location.reload()});
        },
        error: (err) => {
            showErrorMessage("Failed to update user", err.responseJSON ? err.responseJSON.error : err.statusText);
        },
    }); 
});


// show manage user modal
$(".manage-user-btn").on('click', function() {

    let user = {
        id: $(this).attr('data-username'),
        enabled: $(this).attr('data-enabled') == 'true',
    }
    $("#manage-user-id").text(user.id);
    $("#manage-is-enabled").text(user.enabled ? 'Enabled' : 'Disabled');
    $("#manage-enable-button").css('display', !user.enabled ? 'block' : 'none');
    $("#manage-disable-button").css('display', user.enabled ? 'block' : 'none');
    $("#manage-update-password-button").attr('data-user', user.id);
    $("#manage-delete-button").attr('data-user', user.id);
    $("#manage-enable-button").attr('data-user', user.id);
    $("#manage-disable-button").attr('data-user', user.id);
    $("#manage-user-modal").modal('show');
});

// button to show new user form
$("#create-user-btn").on('click', function() {
    $("#create-user-modal").modal('show');
});

// button to finish creating new user
$("#create-new-user-finish-btn").on('click', function() {

    // validate form
    if (!document.getElementById('new-user-form').reportValidity()) {
        return;
    }

    // get params
    let userId = $("#new-user-id").val();
    let email = $("#new-user-email").val();
    let data = {
        password: $("#new-user-password").val(),
        superuser: Boolean($('#new-user-admin').is(":checked"))
    }
    if (email) { data.email = email; }

    // create user
    $.ajax({
        type: "POST",
        url: shaconfig.apiRoot + "users/" + userId,
        dataType: 'json',
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: (data) => {
            location.reload();
        },
        error: (err) => {
            showErrorMessage("Failed to create user", err.responseJSON ? err.responseJSON.error : err.statusText);
        },
    }); 

});