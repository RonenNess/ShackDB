// update current active div
var _currPage = null;
setInterval(() => {

    // default hash link
    if (!location.hash) {
        location.hash = $('.storage-type-btn-link')[0].href.split('#')[1];
    }

    // did link change?
    let currTab = unescape(location.hash);
    if (_currPage !== currTab) {
        $(".storage-type-btn").removeClass('active');
        $(".storage-data-div").hide();
        $('a[href="' + currTab + '"]').find('button').addClass('active');
        $(currTab + '-div').show();
        $($(".shack-breadcrumb")[1]).text(currTab.substring(1)).attr('href', currTab);
        _currPage = currTab;
    }

}, 1);


// replace spaces with dashes in new storage name
$("#storage-name-id").on('keyup', function() {
    let newVal = $(this).val().replace(/ /g, '-');
    $(this).val(newVal);
});


// create new storage button
$('.create-storage-btn').on('click', function() {
    $('#new-storage').modal('show');
    $('#new-storage').find('#new-storage-type').text(_currPage.substring(1));
    $("#storage-name-id").val("");
}); 


// button to finish creating new storage
$('#create-storage-btn-done').on('click', function() {

    // do form validations
    try {
        let isOk = document.getElementById("new-storage-form").reportValidity();
        if (!isOk) { return; }
    } catch(e) {    
        return;
    }

    // get new storage name
    let name = $("#storage-name-id").val();
    let type = _currPage.substring(1);

    // send create storage request
    $.ajax({
        type: "POST",
        url: shaconfig.apiRoot + "storages/" + type + "/" + name,
        dataType: 'json',
        contentType: 'application/json',
        success: (data) => {
            $('#new-storage').modal('hide');
            updateStorageInstances();
        },
        error: (err) => {
            showErrorMessage("Failed to create storage", err.responseJSON ? err.responseJSON.error : err.statusText);
        },
    });  
});


// update storage instances list
var _updateIndex = 0;
function updateStorageInstances()
{
    $.ajax({
        type: "GET",
        url: "/web/storages-data",
        dataType: 'json',
        contentType: 'application/json',
        success: (data) => {

            _updateIndex++;

            // iterate storage types
            console.log(data);
            for (let storageType in data) 
            {
                // iterate storage instances data
                let storages = data[storageType].instances;
                for (let i = 0; i < storages.length; ++i) 
                {
                    // get storage data and div id
                    let storageData = storages[i];
                    let id = `storage-instance-${storageType}-${storageData.name}`;

                    // get / create container
                    let container = $('#' + id);
                    if (container.length === 0) {
                        let temp = document.getElementById("storage-instance-template");
                        let cloned = temp.content.cloneNode(true);
                        container = cloned.firstElementChild;
                        document.getElementById(`${storageType}-instances`).appendChild(cloned);
                        container.id = id;
                        container = $(container);
                    }

                    // set params
                    container.attr('data-update-ver', _updateIndex);
                    container.find('.inst-name').text(storageData.name);
                    container.find('.inst-size').text(storageData.sizeKb + " KB");
                    container.find('.inst-keys').text(storageData.keysCount);
                    container.find('.explore-link')[0].href = `/web/explore/${storageType}/${storageData.name}`;

                    container.find('.api-keys-btn')
                        .attr('data-storage-type', storageType)
                        .attr('data-storage-id', storageData.name)
                        .on('click', function() {
                            let type = $(this).attr('data-storage-type');
                            let id = $(this).attr('data-storage-id');
                            $("#storage-api-modal").modal('show');
                            $("#storage-api-keys-name").text(`${type}/${id}`);
                            document.getElementById("storage-api-keys-iframe").src = `/web/api/${type}/${id}`;
                        });

                                            
                    container.find('.manage-storage-btn')
                    .attr('data-storage-type', storageType)
                    .attr('data-storage-id', storageData.name)
                    .on('click', function() {
                        let type = $(this).attr('data-storage-type');
                        let id = $(this).attr('data-storage-id');
                        $("#manage-storage-modal").modal('show');
                        $("#manage-storage-name").text(`${type}/${id}`);
                        document.getElementById("manage-storage-iframe").src = `/web/manage/${type}/${id}`;
                    });
                }
            }

            // remove all storages that were not updated - they are deleted
            $(".storage-instance-div").not('*[data-update-ver="' + _updateIndex + '"]').remove();
        },
        error: (err) => {
            console.error("Failed to get storages data:", err.responseJSON ? err.responseJSON.error : err.statusText);
        },
    }); 
}

updateStorageInstances();
setInterval(updateStorageInstances, 1000 * 10);