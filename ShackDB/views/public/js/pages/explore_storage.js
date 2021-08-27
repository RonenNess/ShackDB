
// add value button
$("#add-value-btn").on('click', function() {
    $('#new-value-modal').modal('show');
    $("#new-value-data-input").val('{"key": "value"}').trigger('change');
    $("#new-value-name-input").val("");
});


// show new value data type
function initEditValueTextarea(actionType) {
    $("#" + actionType + "-value-data-input").on('keyup change', function() {

        let data = $(this).val();
        try {
            data = JSON.parse(data);
        } catch {}

        let type = typeof data;
        if (Array.isArray(data)) { type = "array"; }

        $("#" + actionType + "-value-data-type").text(type);
    });
}
initEditValueTextarea('new');
initEditValueTextarea('edit');


// delete value button
$("#edit-value-btn-delete").on('click', function() 
{
    let key = $("#edit-value-key").text();
    $.ajax({
        type: "POST",
        url: shaconfig.apiRoot + "access",
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            apiKey: shaconfig.apiKey,
            secretKey: shaconfig.storageSecret,
            key: key,
            action: 'delete'
        }),
        success: (response) => {
            
            $('#edit-value-modal').modal('hide');
            updateKeys();
            
        },
        error: (err) => {
            showErrorMessage("Failed to delete value", err.responseJSON ? err.responseJSON.error : err.statusText);
        },
    });
});


// update value button
$("#edit-value-btn-update").on('click', function() 
{
    let key = $("#edit-value-key").text();
    let value = $("#edit-value-data-input").val();
    $.ajax({
        type: "POST",
        url: shaconfig.apiRoot + "access",
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            apiKey: shaconfig.apiKey,
            secretKey: shaconfig.storageSecret,
            key: key,
            data: value,
            action: 'set'
        }),
        success: (response) => {
            
            $('#edit-value-modal').modal('hide');
            updateKeys();
            
        },
        error: (err) => {
            showErrorMessage("Failed to update value", err.responseJSON ? err.responseJSON.error : err.statusText);
        },
    });
});


// show value of a single storage item
function showStorageValue(key)
{
    $.ajax({
        type: "POST",
        url: shaconfig.apiRoot + "access",
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            apiKey: shaconfig.apiKey,
            secretKey: shaconfig.storageSecret,
            key: key,
            retrieveMeta: true,
            action: 'get'
        }),
        success: (data) => {
            console.log(data);
            if (data.success) {
                data = data.data;
                let valueStr = typeof data._d === 'object' ? JSON.stringify(data._d) : data._d;
                $('#edit-value-modal').modal('show');
                $("#edit-value-data-input").val(valueStr).trigger('change');
                $("#edit-value-key").text(key);
                $("#edit-value-modified").text(data.modified ? (new Date(data.modified)).toString() : "Unknown");
                $("#edit-value-modifier").text(data.source || "Unknown");
                $("#edit-value-size").text(valueStr.length);
            } else {
                showErrorMessage("Error", "Could not fetch key data. Perhaps it was deleted (this page updates every few seconds and you may see recently deleted keys).");
            }
            
        },
        error: (err) => {
            showErrorMessage("Failed to get value", err.responseJSON ? err.responseJSON.error : err.statusText);
        },
    });
}


// update all storage keys
var _updateKeysIndex = 0;
function updateKeys()
{
    $.ajax({
        type: "POST",
        url: shaconfig.apiRoot + "access",
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            apiKey: shaconfig.apiKey,
            secretKey: shaconfig.storageSecret,
            action: 'list'
        }),
        success: (data) => {
            
            // get keys from response
            let keys = data.keys.sort();

            // update keys count and size
            $("#total-keys-count").text(keys.length);
            $("#total-size-kb").text(Math.ceil(data.size / 1000));
            $("#pending-changes").text(data.pendingChanges);

            // update all keys div
            let validIds = new Set();
            for (let i = 0; i < keys.length; ++i) {

                // get key and div id
                let key = keys[i];
                let divId = `key-${key}-div`;

                // check if should create new div for this key
                if (!document.getElementById(divId)) {
                    
                    let newDiv = $(`<li id="key-${key}-div" data-key="${key}" class="storage-key-div list-group-item"><a href="#"><h4>${key}</h4></a></li>`);
                    newDiv.on('click', function() {
                        showStorageValue($(this).attr('data-key'));
                    });
                    $("#keys-container").append(newDiv);
                }

                // ids to not remove
                validIds.add(divId);
            }

            // remove all keys which were not present in new keys list
            let existingKeysToRemove = $('.storage-key-div');
            for (let i = 0; i < existingKeysToRemove.length; ++i) {

                if (!validIds.has(existingKeysToRemove[i].id)) {
                    $(existingKeysToRemove[i]).remove();
                }

            }
        },
        error: (err) => {
            showErrorMessage("Failed to get storage keys", err.responseJSON ? err.responseJSON.error : err.statusText);
        },
    });
}


// update keys every few seconds
setInterval(updateKeys, 5 * 1000);
updateKeys();


// create new storage done
$("#create-value-btn-done").on('click', function() {

    // do form validations
    try {
        let isOk = document.getElementById("new-value-form").reportValidity();
        if (!isOk) { return; }
    } catch(e) {    
        return;
    }

    // get new vale key and value
    let key = $("#new-value-name-input").val();
    let data = $("#new-value-data-input").val();

    // check if can convert to object
    try {
        data = JSON.parse(data);
    }
    catch (e) {
    }

    // send set request
    $.ajax({
        type: "POST",
        url: shaconfig.apiRoot + "access",
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            apiKey: shaconfig.apiKey,
            secretKey: shaconfig.storageSecret,
            data: data,
            key: key,
            action: 'set'
        }),
        success: (data) => {
            $('#new-value-modal').modal('hide');
            updateKeys();
        },
        error: (err) => {
            showErrorMessage("Failed to create value", err.responseJSON ? err.responseJSON.error : err.statusText);
        },
    });  

});