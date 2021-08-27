
/**
 * Generate a modal to confirm a risky action.
 */
function generateConfirmActionModal(modalId, title, text, onConfirm)
{
    let temp = document.getElementById("approve-danger-modal");
    let cloned = temp.content.cloneNode(true);
    container = cloned.firstElementChild;
    document.body.appendChild(cloned);
    container.id = modalId;
    container = $(container);
    container.find('.modal-title').text(title);
    container.find('.main-text').text(text);
    container.find('.approve-danger-btn').on('click', onConfirm);
    return container;
}

// generate new secret modal
generateConfirmActionModal("confirm-new-secret-modal", "Regenerate new Secret Key?", "Are you sure you want to create a new secret key? Applications with the old key will no longer be able to work.", () => {
    $.ajax({
        type: "POST",
        url: shaconfig.apiRoot + "access",
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            apiKey: shaconfig.apiKey,
            secretKey: shaconfig.storageSecret,
            action: 'new_secret_key'
        }),
        success: (data) => {
            shaconfig.storageSecret = data.newSecretKey;
            $("#secret-key-show").text(data.newSecretKey);
            $("#confirm-new-secret-modal").modal('hide');
        },
        error: (err) => {
            showErrorMessage("Failed to regenerate key", err.responseJSON ? err.responseJSON.error : err.statusText);
        },
    });
});
$("#regenerate-secret-key-btn").on('click', () => $("#confirm-new-secret-modal").modal('show') );


// generate new readonly modal
generateConfirmActionModal("confirm-new-readonly-modal", "Regenerate new Readonly Key?", "Are you sure you want to create a new readonly key? Applications with the old key will no longer be able to work.", () => {
    $.ajax({
        type: "POST",
        url: shaconfig.apiRoot + "access",
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            apiKey: shaconfig.apiKey,
            secretKey: shaconfig.storageSecret,
            action: 'new_readonly_key'
        }),
        success: (data) => {
            $("#readonly-key-show").text(data.newReadonlyKey);
            $("#confirm-new-readonly-modal").modal('hide');
        },
        error: (err) => {
            showErrorMessage("Failed to regenerate key", err.responseJSON ? err.responseJSON.error : err.statusText);
        },
    });
});
$("#regenerate-readonly-key-btn").on('click', () => $("#confirm-new-readonly-modal").modal('show') );


// generate delete storage modal
generateConfirmActionModal("confirm-delete-storage-modal", "Delete Storage?", "This action will permanently delete this storage and everything in it. Are you sure you wish to proceed?", () => {
    $.ajax({
        type: "POST",
        url: shaconfig.apiRoot + "access",
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            apiKey: shaconfig.apiKey,
            secretKey: shaconfig.storageSecret,
            action: 'destroy'
        }),
        success: (data) => {
            $("#main-div").hide();
            $("#storage-deleted-div").show();
            $("#confirm-delete-storage-modal").modal('hide');
        },
        error: (err) => {
            showErrorMessage("Failed to delete storage", err.responseJSON ? err.responseJSON.error : err.statusText);
        },
    });
});
$("#delete-storage-btn").on('click', () => $("#confirm-delete-storage-modal").modal('show') );



// generate delete storage modal
generateConfirmActionModal("confirm-purge-storage-modal", "Purge Storage?", "This action will delete all keys in this storage, without destroying the storage object itself. Are you sure you wish to proceed?", () => {
    $.ajax({
        type: "POST",
        url: shaconfig.apiRoot + "access",
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            userId: shaconfig.userId,
            storageId: shaconfig.storageId,
            storageType: shaconfig.storageType,
            secretKey: shaconfig.storageSecret,
            action: 'purge'
        }),
        success: (data) => {
            let bb = $("#purge-storage-btn")[0].getBoundingClientRect();
            let posX = (bb.left + bb.right) / 2;
            let posY = (bb.top + bb.bottom) / 2;
            let animatedText = $(`<p class="card" style="z-index:1000000000; color:red; position:fixed; padding:0.6em; left:${posX - 60}px; top:${posY}px">Storage Purged!</p>`);
            $(document.body).append(animatedText);
            animatedText.animate({top: -60}, 2650, function() {
                $(this).remove();
            });
            $("#confirm-purge-storage-modal").modal('hide');
        },
        error: (err) => {
            showErrorMessage("Failed to purge storage", err.responseJSON ? err.responseJSON.error : err.statusText);
        },
    });
});
$("#purge-storage-btn").on('click', () => $("#confirm-purge-storage-modal").modal('show') );



