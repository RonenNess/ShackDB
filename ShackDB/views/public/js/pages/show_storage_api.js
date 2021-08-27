
// method to implement the copy secret / copy readonly buttons
function copySecretOrReadonlyKey(event) {
    
    let animatedText = $(`<p class="card theme-color" style="z-index:1000000000; position:fixed; padding:0.6em; left:${event.clientX - 60}px; top:${event.clientY}px">Copied!</p>`);
    $(document.body).append(animatedText);
    animatedText.animate({top: -60}, 1650, function() {
        $(this).remove();
    });
    navigator.clipboard.writeText($(this).attr('data-key'));
}

// init copy buttons
setTimeout(() => {

    $("#copy-readonly-key").on('click', copySecretOrReadonlyKey);
    $("#copy-readonly-key").tooltip({placement:'top'});

    $("#copy-secret-key").on('click', copySecretOrReadonlyKey);
    $("#copy-secret-key").tooltip({placement:'top'});

    $("#copy-api-key").on('click', copySecretOrReadonlyKey);
    $("#copy-api-key").tooltip({placement:'top'});
}, 500);


// select example code
function selectExampleCodeClick()
{
    // set buttons highlight
    $(".example-select-btn").removeClass("btn-primary").addClass("btn-secondary");
    $(this).removeClass("btn-secondary").addClass("btn-primary");

    // show / hide relevant divs
    let curr = $(this).attr('data-code-for')
    $(".code-example").hide();
    $(".code-example-" + curr).show();
}
$(".example-select-btn").on('click', selectExampleCodeClick);
$(".example-select-btn").first().trigger('click');



// select language code
function selectLanguageBtnClick()
{
    // set buttons highlight
    $(".select-lang-button").removeClass("btn-primary").addClass("btn-secondary");
    $(this).removeClass("btn-secondary").addClass("btn-primary");

    // show / hide relevant divs
    let curr = $(this).attr('data-code-for')
    $(".code-examples").hide();
    $(".code-examples-" + curr).show();
    console.log("Show codes: ", ".code-examples-" + curr);
}
$(".select-lang-button").on('click', selectLanguageBtnClick);
$(".select-lang-button").first().trigger('click');
