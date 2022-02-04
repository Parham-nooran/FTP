var controlConnection = require('http').createServer(handler);
var io = require('socket.io');
var siofu = require("socketio-file-upload");
var path = require('path');
var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "application/javascript",
    "css": "text/css"
};

var controlIo = io(controlConnection, {
    cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
    }
});
var fs = require('fs');
var portNumber = 8080;

var numberOfDataConnections = 0;

let verifiedUsers = {Admin: '1111', Parham:'111', Ali:'11'};


const NOT_VERIFIED = Symbol('notVerified');
const ENTERED_USERNAME = Symbol('enteredUsername');
const VERIFIED = Symbol('verified');



function handler(request, response){
    if(request.url=="/"){
        fs.readFile("./upload.html", function(err, data) {
            if (err){
                throw err;
            }
            response.writeHead(200, {"Content-Type": "text/html"});
            return response.end(data);;
        });
    } else{
        fs.readFile("."+request.url, function(err, data) {
            if (!err){
                response.writeHead(200, {"Content-Type": mimeTypes[path.extname(request.url).substring(1)]});
                return response.end(data);
            }
        });
    }
    
}


controlConnection.listen(portNumber);


console.log("[Listening] Server is listening on port : " + portNumber);

if(!('connection' in controlIo._events)) {
    controlIo.on('connection', (controlSocket) => {

        console.log("[Connection] client connected");

        controlSocket.emit('control', "200 Welcome to Parham8080 FTP-Server");


        let userStatus = NOT_VERIFIED;
        let username = '';

        controlSocket.on('USER', (data) => {
            var args = (""+data).trim().split(" ");
            console.log(args[0]);
            if (args.length == 1) {
                if(userStatus == NOT_VERIFIED){
                    if(args[0] in verifiedUsers){
                        username = args[0];
                        userStatus = ENTERED_USERNAME;
                        controlSocket.emit('control', "331 Username OK, password required");
                        console.log(userStatus);
                    } else {
                        controlSocket.emit('control', "530 Not logged in");
                    }
                } else if (userStatus == VERIFIED) {
                    controlSocket.emit('control', "530 User already logged in");
                } else if(userStatus == ENTERED_USERNAME) {
                    controlSocket.emit('control', "530 User already entered username");
                }
            } else{
                controlSocket.emit("control", "501 Invalid number of arguments");
            }
        });

        controlSocket.on('PASS', (data) => {
            var args = (""+data).trim().split(" ");
            if(args.length == 1) {
                if(userStatus == NOT_VERIFIED){
                    if(args[0] == verifiedUsers[username]){
                        userStatus = VERIFIED;
                        controlSocket.emit('control', "230 User logged in successfully");
                    } else {
                        controlSocket.emit('control', "530 Not logged in");
                    }
                } else if (userStatus == VERIFIED) {
                    controlSocket.emit('control', "530 User already logged in");
                }
            } else{
                controlSocket.emit("control", "501 Invalid number of arguments");
            }
        });

        controlSocket.on('STOR', (data) => {
            numberOfDataConnections++;
            // console.log("Called Store");

            var dataConnection = require('http').createServer();

            var dataIo = io(dataConnection, {
                cors: {
                origin: "http://localhost:8080",
                methods: ["GET", "POST"]
                }
            });
            var dataPortNum = portNumber + numberOfDataConnections;

            controlSocket.emit('portNumber', (dataPortNum));

            dataConnection.listen(dataPortNum);

            console.log("[Listening] Server is listening on port : " + dataPortNum + " for data");

            dataIo.on('disconnect', () => {
                console.log("[Disconnect] Client disconnected from port " + dataPortNum);
            });
            

            dataIo.on('connection', (dataSocket) => {
                console.log("[Connection] Client connected to data transfer port "+ dataPortNum);
                
                var uploader = new siofu();
                uploader.dir = __dirname + "/SavedFiles";
                uploader.listen(dataSocket);
                uploader.on('start', (event) => {
                    controlSocket.emit('Upload started');
                    console.log('[Uploading] Client started upload on port '+dataPortNum);
                });
                
                
                uploader.on('error', (event) => {
                    controlSocket.emit('Something went wrong');
                    console.log('[Error] Something went wrong downloading file from client');
                });

                uploader.on("saved", function(event){
                    controlSocket.emit('Upload finished sucessfully');
                    console.log('[Upload] Upload finished sucessfully');
                    event.file.clientDetail.hello = "Saved at " + "/SavedFiles";
                    
                    console.log('\n****************************************************\n');
                });
            

            });
            
        });


    });
}



// /**
//  * Response files
//  */
// //html
// var indexHtml;
// var passwordHtml;
// var uploadHtml;
// //css
// var loginCss;
// var uploadCss;
// var normalizeMinCss;
// //js
// var clientJs;
// var uploadJs
// var jqueryMinJs;
// var clientMinJs;
// //svg
// var checkmarkSvg;
// var uploadSvg;
// var syncingSvg;

// //html
// fs.readFile('./index.html', function(err, data) {
//     if (err){
//         throw err;
//     }
//     indexHtml = data;
// });
// fs.readFile('./password.html', function(err, data) {
//     if (err){
//         throw err;
//     }
//     passwordHtml = data;
// });
// fs.readFile('./upload.html', function(err, data) {
//     if (err){
//         throw err;
//     }
//     uploadHtml = data;
// });
// //css
// fs.readFile('./style/login.css', function(err, data) {
//     if (err){
//         throw err;
//     }
//     loginCss = data;
// });

// fs.readFile('./style/upload.css', function(err, data) {
//     if (err){
//         throw err;
//     }
//     uploadCss = data;
// });
// fs.readFile('./style/normalize.min.css', function(err, data) {
//     if (err){
//         throw err;
//     }
//     normalizeMinCss = data;
// });
// //js
// fs.readFile('./scripts/client.min.js', function(err, data) {
//     if (err){
//         throw err;
//     }
//     clientMinJs = data;
// });
// fs.readFile('./scripts/clientSide.js', function(err, data) {
//     if (err){
//         throw err;
//     }
//     clientJs = data;
// });
// fs.readFile('./scripts/jquery.min.js', function(err, data) {
//     if (err){
//         throw err;
//     }
//     jqueryMinJs = data;
// });
// //png
// fs.readFile('./static/checkmark.png', function(err, data) {
//     if (err){
//         throw err;
//     }
//     checkmarkSvg = data;
// });
// fs.readFile('./static/upload.png', function(err, data) {
//     if (err){
//         throw err;
//     }
//     uploadSvg = data;
// });
// fs.readFile('./static/syncing.png', function(err, data) {
//     if (err){
//         throw err;
//     }
//     syncingSvg = data;
// });



// switch (request.url) {
    //     case "/" :
    //         response.writeHead(200, {"Content-Type": "text/html"});
    //         return response.end(uploadHtml);
    //     case "/login.css" :    
    //         response.writeHead(200, {"Content-Type": "text/css"});
    //         return response.end(loginCss);
    //     case "/clientSide.js":
    //         response.writeHead(200, {"Content-Type": "text/js"});
    //         return response.end(clientJs);
    //     case "/client.js":
    //         response.writeHead(200, {"Content-Type": "text/js"});
    //         return response.end(clientMinJs);
    //     case "/password.html":
    //         response.writeHead(200, {"Content-Type": "text/html"});
    //         return response.end(passwordHtml);
    //     case "/upload.css":
    //         response.writeHead(200, {"Content-Type": "text/css"});
    //         return response.end(uploadCss);
    //     case "/upload.js":
    //         response.writeHead(200, {"Content-Type": "text/js"});
    //         return response.end(uploadJs);
    //     case "/normalize.min.css":
    //         response.writeHead(200, {"Content-Type": "text/css"});
    //         return response.end(normalizeMinCss);
    //     case "/jquery.min.js":
    //         response.writeHead(200, {"Content-Type": "text/js"});
    //         return response.end(jqueryMinJs);
    //     case "/upload.svg":
    //         response.writeHead(200, {"Content-Type": "image/png"});
    //         return response.end(uploadSvg);
    //     case "/checkmark.svg":
    //         response.writeHead(200, {"Content-Type": "image/png"});
    //         return response.end(checkmarkSvg);
    //     case "/syncing.svg":
    //         response.writeHead(200, {"Content-Type": "image/png"});
    //         return response.end(syncingSvg);
    //     default:
    //         response.writeHead(200, {"Content-Type": "text/html"});
    //         return response.end(indexHtml);
    // };


// var dataConnection = require('http').createServer();

    // var dataIo = io(dataConnection, {
    //     cors: {
    //       origin: "http://localhost:8080",
    //       methods: ["GET", "POST"]
    //     }
    //   });

    // dataConnection.listen(portNumber + numberOfConnectedClients);

    // socket.emit('portNumber', portNumber + numberOfConnectedClients);


    
    //var dataIo = io('http://localhost:8000');

    // dataIo.on('connection', (socket) => {
    //     socket.on('data',  (data) => {
    //         console.log(username + " : " + data);
    //     });
    // });

    // console.log("[Connection] client connected");

    // socket.emit('control', "200 Welcome my son");

    // socket.on('data', (data) => {
    //     if(userStatus == VERIFIED){
    //         console.log(username + " : " + data);
    //     }
    // });

    // socket.on('control', (data) => {
    //     console.log(username + " : " + data);
    //     if(userStatus == NOT_VERIFIED){
    //         if(data in verifiedUsers){
    //             userStatus = ENTERED_USERNAME;
    //             username = data;
    //             socket.emit('control', 'Username is correct waiting for password');
    //         }
    //     } else if(userStatus == ENTERED_USERNAME){
    //         if(verifiedUsers[username] == data){
    //             userStatus = VERIFIED;
    //             socket.emit('control', 'password is correct');
    //         }
    //     } else if (userStatus == VERIFIED){
    //         socket.emit('control', 'already logged in');
    //     }
    // });

    // dataIo.on('connection', (socket) => {
    //     socket.on('data', (data) => {
    //         console.log(data);
    //     });
    // });