
// show update details modal
$("#update-details-btn").on('click', () => {
    $("#update-details-modal").modal('show');
    $("#new-email").val("");
    $("#new-password").val("");
});

// done updating profile details
$("#done-update-details").on('click', () => {

    let form = document.getElementById('update-details-form');
    if (!form.reportValidity()) {
        return;
    }

    let email = $(form).find("#new-email").val() || undefined;
    let password = $(form).find("#new-password").val() || undefined;

    if (!email && !password) {
        $("#update-details-modal").modal('hide');
        return;
    }

    let dict = {};
    if (email) dict.email = email;
    if (password) dict.password = password;
        
    $.ajax({
        type: "PUT",
        url: shaconfig.apiRoot + "users/" + shaconfig.userId,
        dataType: 'json',
        data: JSON.stringify(dict),
        contentType: 'application/json',
        success: (data) => {
            location.reload();
        },
        error: (err) => {
            showErrorMessage("Failed to update user", err.responseJSON ? err.responseJSON.error : err.statusText);
        },
    }); 
});