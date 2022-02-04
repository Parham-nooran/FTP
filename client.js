var droppedFiles = false;
var fileName = '';
var $dropzone = $('.dropzone');
var $button = $('.upload-btn');
var uploading = false;
var $syncing = $('.syncing');
var $done = $('.done');
var $bar = $('.bar');
var $user = $('.user');
var $pass = $('pass');
var $submitButtonPassword = ('.submitButtonPassword');
var $submitButtonUser = ('submitButtonUser');
var timeOut;


var controlSocket = io('http://localhost:8080');

controlSocket.emit('STOR', '');

controlSocket.on('control', (data) => {
    document.getElementById('label').innerHTML = '<h3>' + data + '</h3>';
    console.log(data);
});

controlSocket.on('portNumber' , (portNumber) => {
    

    var dataSocket = io('http://localhost:'+portNumber);
    
    var instance = new SocketIOFileUpload(dataSocket);

    instance.listenOnSubmit(document.getElementById("upload_button"), document.getElementById("file_input"));

    instance.addEventListener("start", function(event){
        document.getElementById('label').innerHTML = "<h3>" + "started" + "</h3>";
        if (!uploading && fileName != '' ) {
            uploading = true;
            $button.html('Uploading...');
            $syncing.addClass('active');
            $done.addClass('active');
            $bar.addClass('active');
        }
    });

    instance.addEventListener("complete", function(event){
        document.getElementById('label').innerHTML = "<h3>" + event.detail.hello + "</h3>";
        uploading = false;
        //$dropzone.removeFile(document.getElementById("file_input"));
        $syncing.removeClass('active');
        $done.removeClass('active');
        $bar.removeClass('active');
        instance.destroy();
        $button.html('Done');
        $button.on('click', onclickUpload(dataSocket, controlSocket));
        // setInterval($button.on('click', onclickUpload(dataSocket, controlSocket)), 4000);
    });



    dataSocket.on('data', (data) => {
        document.getElementById('control').innerHTML = "<h3>" + data + "</h3>";
        console.log(data);
    });
});


// $dropzone.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
//     e.preventDefault();
//     e.stopPropagation();
// })
//     .on('dragover dragenter', function() {
//         $dropzone.addClass('is-dragover');
// })
//     .on('dragleave dragend drop', function() {
//         $dropzone.removeClass('is-dragover');
// })
//     .on('drop', function(e) {
//         droppedFiles = e.originalEvent.dataTransfer.files;
//         fileName = droppedFiles[0]['name'];
//         $('.filename').html(fileName);
// });

$dropzone.on('drop', function(e) {
    droppedFiles = e.originalEvent.dataTransfer.files;
    fileName = $(this)[0].files[0].name;
    $('.filename').html(fileName);
});


$("input:file").change(function (){
    droppedFiles = $(this)[0].files;
    fileName = $(this)[0].files[0].name;
    $('.filename').html(fileName);
});

const onclickUpload = function(dataSocket, controlSocket) {
    console.log('Clicked');
    document.getElementById('label').innerHTML = "";
    document.getElementById("file_input").value = "";   
    droppedFiles = false;
    fileName = '';
    $('.filename').html(fileName);
    dataSocket.disconnect();
    controlSocket.emit('STOR', '');
    $button.html('Upload');
    document.getElementById("upload_button").removeEventListener('click', onclickUpload);
};


$submitButtonUser.onclick = () => {
    controlSocket.emit('USER', $user.value);
};

$submitButtonPassword.onclick = () => {
    controlSocket.emit('PASS', $pass.value);
};


