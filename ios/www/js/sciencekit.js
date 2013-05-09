// socket.io
// Real-time event-driven sockets, client-side code.

// Socket connection for data streaming
var socketio = null;

var timelineStack = [];

//
// Set up real-time communication using web sockets (using the socket.io library).
//
function connectWebSocket() {

	socketio = io.connect(localStorage['host']);

	// Error
	socketio.socket.on('error', function(reason) {
		console.error('Unable to connect socket.io', reason);

		$('#incomingChatMessages').append('<li>Unable to connect (not authorized)</li>');
	});

	// Listen for 'connect' event listener and define event handler.
	socketio.on('connect', function () {
		$('#incomingChatMessages').append($('<li>Connected</li>'));

		socketio.on('oauthrequesttoken', function(incomingMsg) {
			$('#incomingChatMessages').append($('<li>Authenticating with access token</li>'));
			//var message = JSON.stringify({ 'token': oauthAccessToken, 'message': messageText });
			//var oauthAccessToken = $('#token_response').text(); // Get access token
			var oauthAccessToken = localStorage['token'];
			socketio.emit('oauthtoken', oauthAccessToken);
		});

		socketio.on('oauthtokensuccess', function(incomingMsg) {
			$('#incomingChatMessages').append($('<li>Authentication successful</li>'));
			// TODO: If there's an error, then remove the token from localStorage, request refresh (if expired, eg.,)
			//var oauthAccessToken = localStorage['token'];
			//socketio.emit('oauthtoken', oauthAccessToken);
		});

		socketio.on('thought', function(thought) {
			console.log('Socket: Received Thought');
			console.log(thought);

			addTimelineWidget(thought);
		});

		socketio.on('topic', function(topic) {
			console.log('Socket: Received Topic');
			console.log(topic);

			addTimelineWidget(topic);
		});

		socketio.on('photo', function(photo) {
			console.log('Socket: Received Photo');
			console.log(photo);

			addTimelineWidget(photo);
		});

		socketio.on('video', function(video) {
			console.log('Socket: Received Video');
			console.log(video);

			addTimelineWidget(video);
		});

		socketio.on('motion', function(motion) {
			console.log('Socket: Received Motion');
			console.log(motion);

			addTimelineWidget(motion);
		});

		socketio.on('sketch', function(sketch) {
			console.log('Socket: Received Sketch');
			console.log(sketch);

			addTimelineWidget(sketch);
		});

		socketio.on('tag', function(tag) {
			console.log('Socket: Received Tag');
			console.log(tag);

			if ($("#frame-" + tag.tag.frame).length != 0) {
				var e = $('#frame-' + tag.tag.frame);
				getTags(e);
			}
		});

		socketio.on('disconnect', function() {
			$('#incomingChatMessages').append('<li>Disconnected</li>');
		});
	});
}




// OAuth2 Client (prior to authentication/authorization flow)

function requestAuthorizationGrant(options) {

	alert(localStorage['host']);

	var uri = localStorage['host'] + "/dialog/authorize?client_id=" + options['client_id'] + "&client_secret=" + options['client_secret'] + "&response_type=code&redirect_uri=/oauth/exchange";

	$('#authorize_link').attr('href', uri);
	alert($('#authorize_link').attr());
	//$('#authorize_link').click();
}





var pictureSource;   // picture source
var destinationType; // sets the format of returned value

// Cordova is ready to be used!
//
function onDeviceReady() {
    pictureSource = navigator.camera.PictureSourceType;
    destinationType = navigator.camera.DestinationType;    

    // Set up database for local storage
    // var db = window.openDatabase("Database", "1.0", "SINQLocalDatabase", 200000);
    // db.transaction(populateLocalDatabase, errorCB, successCB);

    // // Check state of connection to data networks
    // var states = checkConnection();

    // document.addEventListener("online", onDeviceOnline, false);
    // document.addEventListener("offline", onDeviceOffline, false);
    // document.addEventListener("resume", onResume, false);

    console.log('Device is ready for PhoneGap.');
}




//var accelerometerWatchData = { values:[ { x: 0, y: 0, z: 0, timestamp: 0 } ]};
var accelerometerWatchData = { values:[] };

// The watch id references the current `watchAcceleration`
var watchId = null;

// Start watching the acceleration
//
function startWatch() {
	console.log('Starting accelerometer watch.');

	// Update acceleration every 3 seconds
	var options = { frequency: 300 };

	watchId = navigator.accelerometer.watchAcceleration(onWatchSuccess, onWatchError, options);
}

// Stop watching the acceleration
//
function stopWatch () {
	console.log('Stopping accelerometer watch.');

	if (watchId) {
		navigator.accelerometer.clearWatch(watchId);
		watchId = null;
	}
}

// onSuccess: Get a snapshot of the current acceleration
//
function onWatchSuccess (acceleration) {

	// Add data to graph points
	console.log(acceleration.timestamp);
	var dataPoint = { x: acceleration.x, y: acceleration.y, z: acceleration.z, t: acceleration.timestamp };
	accelerometerWatchData.values.push(dataPoint);

	// Update the graph
	drawGraph($('#motion-tool').find('.canvas'), accelerometerWatchData.values, 10);
}

// onError: Failed to get the acceleration
//
function onWatchError() {
	alert('onError!');
}






// Called when a photo is successfully retrieved
//
function onAvatarURISuccess (imageUri) {
    // Uncomment to view the image file URI
    console.log("Took photo: " + imageUri);

    // Upload the photo
    uploadAvatar(imageUri);
}

function captureAvatarToURI() {
    // Take picture using device camera and retrieve image as base64-encoded string
    navigator.camera.getPicture(
		onAvatarURISuccess,
		onPhotoFail,
		{
			quality: 50,
			allowEdit: true,
			destinationType: navigator.camera.DestinationType.FILE_URI
		});
}

// Get avatar for user of current Account
function getAvatar() {

	$.ajax({
		type: 'GET',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/account/avatar',
		dataType: 'json',
		success: function(data) {
			// console.log('Received protected thoughts (success).');
			console.log(data);

			var avatarUri = localStorage['host'] + data.uri;

			$('#avatar-container').css('background-image', 'url(' + avatarUri + ')');

			// $('#narrative-list').html('');
			// $('#narrative-list').attr('data-timeline', data._id);
			// $('#narrative-list').attr('data-moment', data.moment);

			// Set previous timeline (if any)
			// if (previousTimeline) {
			// 	$('#narrative-list').attr('data-previous-timeline', previousTimeline);
			// }

			// Add Moments to Timeline
			// for (moment in data.moments) {
			// 	addTimelineWidget(data.moments[moment]);
			// }
		}
	});
}




// Change Photo in PhotoFrame associated with the specified widget.
var lastTouchedPhotoWidget;
function changePhoto(e) {
	console.log('changePhoto');

	// Save the photo widget that the user last touched
	lastTouchedPhotoWidget = e;

	// Capture photo
	capturePhotoToURI();
}

// Change Video in VideoFrame associated with the specified widget.
var lastTouchedVideoWidget;
function changeVideo(e) {
	console.log('changeVideo');

	// Save the photo widget that the user last touched
	lastTouchedVideoWidget = e;

	// Capture photo
	captureVideo2();
}

// Called when a photo is successfully retrieved
//
function onPhotoURISuccess(imageURI) {
    // Uncomment to view the image file URI
    console.log("Took photo: " + imageURI);

    // Upload the photo
    uploadPhoto(imageURI);
}

// Called if something bad happens.
//
function onPhotoFail(message) {
    console.log('Camera failed because: ' + message);
    lastTouchedPhotoWidget = null;
}

// A button will call this function
//
function capturePhotoToURI() {
	console.log("PHOTO");
    // Take picture using device camera and retrieve image as base64-encoded string
    navigator.camera.getPicture(
        onPhotoURISuccess,
        onPhotoFail,
        {
            quality: 50,
            allowEdit: true,
            destinationType: navigator.camera.DestinationType.FILE_URI
        });
}

function uploadPhoto(photoURI) {

	var widget, element;
	var dataJSON;

	if (lastTouchedPhotoWidget) {
		widget  = lastTouchedPhotoWidget;
		element = lastTouchedPhotoWidget.find('.activity-widget .element');

		// Construct JSON object for element to save
		dataJSON = {
			"timeline": $("#narrative-list").attr("data-timeline")
		};

		if (element.attr("data-frame")) dataJSON.frame   = element.attr("data-frame");
		if (element.attr("data-id"))    dataJSON.reference = element.attr("data-id"); // Set the element to the reference, since it was edited.

		console.log("Saving thought (JSON): ");
		console.log(dataJSON);
	}

    // Upload the image to server
    function success(response) {
        console.log("Photo uploaded successfully:");
        var photo = jQuery.parseJSON(response.response);
        addPhotoWidget(photo);
    }

    function fail(error) {
        console.log("Photo upload failed: " + error.code);
    }

    var options = new FileUploadOptions();
    options.fileKey = "myphoto"; // parameter name of file -- in POST data?
    options.fileName = photoURI.substr(photoURI.lastIndexOf('/') + 1); // name of file
    options.mimeType = "image/jpeg";

    // Set parameters for request
    if (lastTouchedPhotoWidget && dataJSON) {
		options.params = dataJSON;
    } else {
		var params = {};
		params.timeline = $("#narrative-list").attr("data-timeline");
		options.params = params;
    }

    // Set header for authentication
    var headers = {
		'Authorization': 'Bearer ' + localStorage['token']
    };
	options.headers = headers;

    console.log("Uploading ");
    console.log(options);

    var requestUri = localStorage['host'] + '/api/photo';
    var ft2 = new FileTransfer();
    ft2.upload(photoURI, requestUri, success, fail, options);

    // Reset image URI
    photoURI = '';
}

function uploadAvatar(avatarURI) {

    // Upload the image to server
    function success(response) {
        console.log("Profile avatar uploaded successfully:");
        var avatar = jQuery.parseJSON(response.response);
        // addPhoto(photo);
    }

    function fail(error) {
        console.log("Profile avatar upload failed: " + error.code);
    }

    var options = new FileUploadOptions();
    options.fileKey = "avatar"; // parameter name of file -- in POST data?
    options.fileName = avatarURI.substr(avatarURI.lastIndexOf('/') + 1); // name of file
    options.mimeType = "image/jpeg";

    // Set header for authentication
    var headers = {
		'Authorization': 'Bearer ' + localStorage['token']
    };
	options.headers = headers;

    console.log("Uploading " + options.fileName);

    var requestUri = localStorage['host'] + '/api/account/avatar';
    var ft = new FileTransfer();
    ft.upload(avatarURI, requestUri, success, fail, options);

    // Reset image URI
    avatarURI = '';
}




// Called when capture operation is finished
//
function captureSuccess(mediaFiles) {
	console.log("videoCaptureSuccess");
	var i, len;
	for (i = 0, len = mediaFiles.length; i < len; i += 1) {
		uploadVideo(mediaFiles[i]);
	}
}

function captureError(error) {
	console.log("videoCaptureError");
	// var msg = 'An error occurred during capture: ' + error.code;
	// navigator.notification.alert(msg, null, 'Uh oh!');
	alert("NOPE");
}

// Video

function captureVideo2() {
	console.log("captureVideo");
    // Launch device video recording application 
	navigator.device.capture.captureVideo(captureSuccess, captureError);
	console.log("captureVideo2");
}

function uploadVideo(mediaFile) {
	console.log("uploadVideo");
	console.log(mediaFile);



	var widget, element;
	var dataJSON;

	if (lastTouchedVideoWidget) {
		widget  = lastTouchedVideoWidget;
		element = lastTouchedVideoWidget.find('.activity-widget .element');

		// Construct JSON object for element to save
		dataJSON = {
			"timeline": $("#narrative-list").attr("data-timeline")
		};

		if (element.attr("data-frame")) dataJSON.frame   = element.attr("data-frame");
		if (element.attr("data-id"))      dataJSON.reference = element.attr("data-id"); // Set the element to the reference, since it was edited.

		console.log("Saving thought (JSON): ");
		console.log(dataJSON);
	}



    function success(result) {
        console.log("Video upload succeeded:");
        var video = jQuery.parseJSON(result.response);
        // addPhoto(photo);

        console.log('Upload success: ' + result.responseCode);
		console.log(result.bytesSent + ' bytes sent');
    }
    
    function fail(error) {
    	console.log("Video upload failed.");
        console.log("Profile avatar upload failed: " + error.code);

        console.log('Error uploading file ' + path + ': ' + error.code);
    }
    
    // Set file upload uptions
    var options = new FileUploadOptions();
    // options.fileKey = "videoFile";
    // options.fileName = avatarURI.substr(avatarURI.lastIndexOf('/') + 1); // name of file
    options.fileName = mediaFile.name;
    // options.mimeType = "image/jpeg";

    // Set header for authentication
    var headers = {
    	'Authorization': 'Bearer ' + localStorage['token']
    };
	options.headers = headers;

    // Set parameters for request
    if (lastTouchedVideoWidget && dataJSON) {
    	options.params = dataJSON;
    } else {
    	var params = {};
	    params.timeline = $("#narrative-list").attr("data-timeline");
	    options.params = params;
    }

    console.log("Uploading " + options.fileName);

	var videoPath = mediaFile.fullPath; // Location of file on local file system
	var requestUri = localStorage['host'] + '/api/video'; // Destination of video file upload
	// var name = mediaFile.name;

	var ft = new FileTransfer();
    ft.upload(videoPath, requestUri, success, fail, options);
}


// OAuth2 Client-side Code

window.onload = function() {

	// // Set up PhoneGap event listeners
	// document.addEventListener("deviceready", onDeviceReady, false);



	// Client
	$('#authorize_link').click(function() {

		alert('test?');

		requestAuthorizationGrant({
				'client_id': localStorage['client_id'],
				'client_secret': localStorage['client_secret'],
				'response_type': 'code',
				'redirect_uri': '/oauth/exchange'
			});
	});



	// Check if an OAuth authorization code was received
	if(window.location.search.indexOf("code=") !== -1) {

		var from = window.location.search.indexOf("code=") + 5;
		var to = window.location.search.indexOf("&", from);
		var code = null;
		if (to !== -1) {
			code = window.location.search.substring(from, to);
			localStorage['code'] = code;
		} else {
			code = window.location.search.substring(from);
			localStorage['code'] = code;
		}
	}


	// OAuth2
	$('#auth_link').click(function() {

		console.log(localStorage['code']);
		exchangeGrantForAccessToken({
			'client_id': localStorage['client_id'],
			'client_secret': localStorage['client_secret'],
			'code': localStorage['code'],
			'grant_type': 'authorization_code',
			'redirect_uri': '/'
		});

		return false;
	});

	$('#account-list').click(function() {
		//var access_token = $('#token_response').text();
		apiGetUser({ 'access_token': localStorage['token'] });
		return false;
	});

	$('#loginForm').submit(function() {
		apiLogin({});
		return false;
	});
}

function apiLogin(options) {
	console.log('Logging in to get client credentials.');
	// console.log(data);
	$.ajax({
		type: 'GET',
		beforeSend: function(request) {

			var string = $('#username').val() + ':' + $('#password').val();
			var encodedCredentials = btoa(string);
			request.setRequestHeader('Authorization', 'Basic ' + encodedCredentials);
		},
		url: localStorage['host'] + '/api/clients',
		dataType: 'text',
		processData: false,
		success: function(data) {
			console.log('Received client credentials (success).');
			var client = jQuery.parseJSON(data);
			localStorage['client_id'] = client.clientId;
			localStorage['client_secret'] = client.clientSecret;
		},
		error: function() {
			console.log('Failed to retreive access token.');
		}
	});
}

function exchangeGrantForAccessToken(options) {
	console.log('Exchanging authorization grant for access token.');
	// console.log(data);
	$.ajax({
		type: 'POST',
		beforeSend: function(request) {
			request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		},
		url: localStorage['host'] + '/oauth/token',
		data: 'client_id=' + options['client_id'] + '&client_secret=' + options['client_secret'] + '&code=' + options['code'] + '&grant_type=authorization_code&redirect_uri=/oauth/exchange',
		dataType: 'text',
		processData: false,
		success: function(data) {
			console.log('Received access token (success).');
			var token = jQuery.parseJSON(data);
			$('#token_response').text(token.access_token);
			localStorage['token'] = token.access_token;
			$(location).attr('href', './timeline.html');
		},
		error: function() {
			console.log('Failed to retreive access token.');
		}
	});
}

function apiGetUser(options) {
	console.log('Requesting protected resource user.');
	$.ajax({
		type: 'GET',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + options['access_token']);
		},
		url: localStorage['host'] + '/api/account/list',
		dataType: 'text',
		success: function(data) {
			console.log('Received protected resource (success).');
			var user = jQuery.parseJSON(data);
			$('#resource_response').text(data);
		},
		error: function() {
			console.log('Failed to retreive protected resource.');
		}
	});
}

function getTimeline(options) {
	console.log('getTimeline()');

	//
	// Save current state of timeline
	//

	// Save current timeline as "previous" timeline
	// var previousTimeline;
	// if ($("#narrative-list").attr("data-timeline") !== undefined) {
	// 	previousTimeline = $("#narrative-list").attr("data-timeline");
	// }

	// var previousTimeline = null;
	// if (timelineStack.length > 1) {
	// 	previousTimeline = timelineStack.pop();
	// }

	//
	// Request resources for new timeline and update the timeline widget
	//

	var requestUri = localStorage['host'] + '/api/timeline';

	if (typeof options !== "undefined") {
		if (options.hasOwnProperty('id')) {
			requestUri = requestUri + '?id=' + options['id'];
		} else if (options.hasOwnProperty('moment_id')) {
			requestUri = requestUri + '?moment_id=' + options['moment_id'];
		} else if (options.hasOwnProperty('frameId')) {
			requestUri = requestUri + '?frameId=' + options['frameId'];
		}
	}

	$.ajax({
		type: 'GET',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: requestUri,
		dataType: 'json',
		success: function(data) {
			console.log('Received protected thoughts (success).');
			console.log(data);

			$('#narrative-list').html('');
			$('#narrative-list').attr('data-timeline', data._id);
			$('#narrative-list').attr('data-moment', data.moment);

			// Set previous timeline (if any)
			// if (previousTimeline) {
			// 	$('#narrative-list').attr('data-previous-timeline', previousTimeline);
			// }

			// Add Moments to Timeline
			for (moment in data.moments) {
				addTimelineWidget(data.moments[moment]);
			}

			console.log('timelineStack.length = ' + timelineStack.length);

			//
			// Save Timeline on stack
			//

			var currentTimeline = {};
			currentTimeline.timeline = data._id;
			if (timelineStack.length > 0) {
				currentTimeline.previousTimeline = timelineStack[timelineStack.length - 1].timeline;
			} else {
				currentTimeline.previousTimeline = null;
			}

			// Only add timeline if it's not already on the top of the stack (i.e., prevent duplicates)
			if (timelineStack.length > 0) {
				if (currentTimeline.timeline !== timelineStack[timelineStack.length - 1].timeline) {
					timelineStack.push(currentTimeline);
				}
			} else {
				timelineStack.push(currentTimeline);
			}

			//
			// Update timeline widget "header"
			//

			if (timelineStack.length > 1) {
				$('#sciencekit-logo').hide();
				$('#timeline-intro-text').hide();

				$('#previous-timeline-widget').show();
				$('#previous-timeline-widget').find('.link').off('click'); // Remove any existing 'onclick' event handler
				$('#previous-timeline-widget').find('.link').click(function() {
					var currentTimeline = timelineStack.pop();
					getTimeline({ id: currentTimeline.previousTimeline });
				});

				// Hide Timeline under first Widget
				//$('#narrative-list').get(0).find('.timeline-branch').css('display', 'none');
				$($('#narrative-list li').get(0)).find('.timeline-branch').css('visibility', 'hidden');

				scrollToTop();

			} else {
				$('#sciencekit-logo').show();
				$('#timeline-intro-text').show();

				$('#previous-timeline-widget').hide();			
			}
		},
		error: function() {
			console.log('Failed to retreive protected resource.');
		}
	});
}




//
// "Motion" Capture Tool
//

function captureMotion() {

	// Initialize
	// accelerometerWatchData = { values:[] };

	// Show

	$('#motion-tool').fadeIn();

	// Set up event handlers

	startWatch();

	$('#motion-tool').find('.close').click(function() {

		// Shut off accelerometer (stop collecting data)
		stopWatch();

		// Get buffered data
		console.log(accelerometerWatchData);

		// Format data

		// Send data to server
		saveMotion();

		// Receive response

		// Add widget to story

		// Close widget
		$('#motion-tool').fadeOut();
	});
}

function saveMotion(e) {
	console.log('saveMotion');

	// var widget  = e.find('.activity-widget');
	// var element = e.find('.activity-widget .element');
	// var text    = e.find('.element .text');

	// Construct JSON object for element to save
	var dataJSON = {
		"timeline": $("#narrative-list").attr("data-timeline"),
		"points": accelerometerWatchData.values
	};

	// if(element.attr("data-frame")) dataJSON.frame = element.attr("data-frame");
	// if(element.attr("data-id")) dataJSON.reference = element.attr("data-id"); // Set the element to the reference, since it was edited.

	console.log("Saving Motion (JSON): ");
	console.log(dataJSON);
	// POST the JSON object

	$.ajax({
		type: 'POST',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/motion',
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		data: JSON.stringify(dataJSON),
		processData: false,
		success: function(data) {
			console.log('Saved Motion: ');
			console.log(data);

			// Set element container (e.g., Thought). Only gets set once.
			// $(e).attr('id', 'frame-' + data.frame._id); // e.data('id', data._id);
			addTimelineWidget(e);
			//addMotionWidget();

			console.log('Updated Motion element.');
		},
		error: function() {
			console.log('Failed to save Motion.');
		}
	});
}


//var graph;
var xPadding = 8;
var yPadding = 8;

function getMaxY(data) {
	var max = 0;

	for(var i = 0; i < data.length; i ++) {
		if(Math.abs(data[i].x) > max) {
			max = data[i].x;
		}

		if(Math.abs(data[i].y) > max) {
			max = data[i].y;
		}

		if(Math.abs(data[i].z) > max) {
			max = data[i].z;
		}
	}

	max += 10 - max % 10;
	return max;
}

function getXPixel(graph, data, value, maxPointCount) {

	//var graph = $('#motion-tool').find('.canvas');

	var xRange = (data.length > maxPointCount ? maxPointCount : data.length);

	return ((graph.width() - xPadding) / xRange) * value + (xPadding * 1.5);
	//return ((graph.width() - xPadding) / data.length) * value + (xPadding * 1.5);
}

function getYPixel(graph, data, point) {

	//var graph = $('#motion-tool').find('.canvas');

	var originVertical = Math.floor(graph.height() / 2);
	var scalingFactor  = graph.height() / (2 * getMaxY(data));
	var point = point * scalingFactor;
	var canvasPoint = originVertical + point;
	return canvasPoint;
}

function drawGraph (graph, data, maxPointCount) {

	// Get graph element
	//var graph = $('#motion-tool').find('.canvas');
	var context = graph[0].getContext('2d'); // Get canvas rendering context

	// Update canvas element dimensions
	//graph.attr('width', window.innerWidth); // Update size
	graph.attr('width', $(graph).parent().width()); // Update size

	// Check if there's at least one point
	if (data.length < 1) {
		return;
	}

	// Check if maximum point count is defined
	if (maxPointCount === undefined) {
		maxPointCount = data.length;
	}

	//
	// Clear canvas
	//
	context.clearRect(0, 0, graph[0].width, graph[0].height);

	// context.fillStyle = '#CC5422';
	// context.fillRect(0, 0, graph[0].width, graph[0].height);  // now fill the canvas

	//
	// Draw middle point(s) for axes
	//
	context.strokeStyle = '#dddddd';
	context.beginPath();
	context.moveTo(0, graph.height() / 2);
	context.lineTo(graph.width(), graph.height() / 2);
	context.stroke();

	//
	// Draw X graph lines
	//

	var sampleStartIndex = 1;
	if (data.length > maxPointCount) {
		sampleStartIndex = data.length - maxPointCount;
	}

	var i = (data.length > maxPointCount ? data.length - maxPointCount : 1);

	context.strokeStyle = '#ed1c24';
	context.beginPath();
	context.moveTo(getXPixel(graph, data, 0, maxPointCount), getYPixel(graph, data, data[i - 1].x));

	for(j = 1; i < data.length; i++, j++) {
		context.lineTo(getXPixel(graph, data, j, maxPointCount), getYPixel(graph, data, data[i].x));
	}
	context.stroke();

	//
	// Draw Y graph lines
	//

	var i = (data.length > maxPointCount ? data.length - maxPointCount : 1);

	context.strokeStyle = '#00a14b';
	context.beginPath();
	context.moveTo(getXPixel(graph, data, 0, maxPointCount), getYPixel(graph, data, data[i - 1].y));

	for(j = 1; i < data.length; i++, j++) {
		context.lineTo(getXPixel(graph, data, j, maxPointCount), getYPixel(graph, data, data[i].y));
	}
	context.stroke();

	//
	// Draw Z graph lines
	//

	var i = (data.length > maxPointCount ? data.length - maxPointCount : 1);

	context.strokeStyle = '#213f99';
	context.beginPath();
	context.moveTo(getXPixel(graph, data, 0, maxPointCount), getYPixel(graph, data, data[i - 1].z));

	for(j = 1; i < data.length; i++, j++) {
		context.lineTo(getXPixel(graph, data, j, maxPointCount), getYPixel(graph, data, data[i].z));
	}
	context.stroke();
}




//
// "Sketch" Tool
//

function openSketchTool() {
	console.log('openSketchTool');

	// Initialize
	//initializeSketchTool();

	// Show

	$('#sketch-tool').fadeIn();

	initializeSketchTool();

	// Set up event handlers

	$('#sketch-tool').find('.close').click(function() {

		// Disable sketching I/O

		// Get buffered data

		// Format data

		// Send data to server
		saveSketch();

		// Receive response

		// Add widget to story

		// Close widget
		$('#sketch-tool').fadeOut();
	});
}

function saveSketch() {
	console.log('saveSketch');

	// Hide palette tools
	hidePaletteTools();

	console.log('saving canvas');

	// Save canvas to image
	var c = $('#sketch-tool').find('.canvas');
	var oImgPNG = Canvas2Image.saveAsPNG(c[0], true);
	$(oImgPNG).attr('id', 'sketch-tool-result');

	// Send image to server
	var base64ImageData = $(oImgPNG).attr('src');
	var imageWidth = $(c).width();
	var imageHeight = $(c).height();

	// var widget  = e.find('.activity-widget');
	// var element = e.find('.activity-widget .element');
	// var text    = e.find('.element .text');

	// Construct JSON object for element to save
	var dataJSON = {
		"timeline": $("#narrative-list").attr("data-timeline"),
		"imageData": base64ImageData,
		"imageWidth": imageWidth,
		"imageHeight": imageHeight
	};

	// if(element.attr("data-frame")) dataJSON.frame = element.attr("data-frame");
	// if(element.attr("data-id")) dataJSON.reference = element.attr("data-id"); // Set the element to the reference, since it was edited.

	console.log("Saving Sketch (JSON): ");
	console.log(dataJSON);
	// POST the JSON object

	$.ajax({
		type: 'POST',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/sketch',
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		data: JSON.stringify(dataJSON),
		processData: false,
		success: function(data) {
			console.log('Saved Sketch: ');
			console.log(data);

			// Set element container (e.g., Thought). Only gets set once.
			// $(e).attr('id', 'frame-' + data.frame._id); // e.data('id', data._id);
			addTimelineWidget(data);
			//addSketchWidget();

			console.log('Updated Sketch element.');
		},
		error: function() {
			console.log('Failed to save Sketch.');
		}
	});
}

var sketchCanvas;
var sketchCanvasShape;
var stage;
var oldPt;
var oldMidPt;
var title;
var color;
var stroke;
var paletteColors;
var index;

// Brushes of various sizes
var brushSizeOptions = [];

// Canvas model
var sketchStrokePaths = [];

// Sketch tool paremters
var renderPaletteTools = true;
var paletteTools = [];

// Drawing tools (color palette and brush size)
var paletteX = 10;
var paletteY = 10;
var currentPaletteColor = "#000000";
var currentPalleteSize = 10;
var padding = 5;
var width = 65;
var height = 65;
var colorPaletteRectangleRadius = 5;
var cols = 15;

function hidePaletteTools() {
	for(var i in paletteTools) {
		paletteTools[i].alpha = 0;
		//stage.removeChild(paletteTools[i]);
	}
	stage.update();
}

// Initialize the canvas
function initializeSketchTool() {
	if (window.top != window) {
		document.getElementById("header").style.display = "none";
	}
	sketchCanvas = $('#sketch-tool').find('canvas').get(0); // Get "raw" DOM element wrapped by jQuery selector
	index = 0;
	paletteColors = ["#828b20", "#b0ac31", "#cbc53d", "#fad779", "#f9e4ad", "#faf2db", "#563512", "#9b4a0b", "#d36600", "#fe8a00", "#f9a71f"];

	// Update canvas geometry
	$(sketchCanvas).attr('width', $(sketchCanvas).parent().width()); // Update size
	$(sketchCanvas).attr('height', $(sketchCanvas).parent().height()); // Update size

	// "A stage is the root level Container for a display list. Each time its 
	// Stage/tick method is called, it will render its display list to its target 
	// canvas." [http://www.createjs.com/Docs/EaselJS/classes/Stage.html]
	stage = new createjs.Stage(sketchCanvas);
	stage.autoClear = true; // NOTE: Setting this to false will prevent the canvas from being cleared (previous states are kept)
	stage.enableDOMEvents(true);
	stage.enableMouseOver(10); // Enable for mouseover event
	createjs.Touch.enable(stage);

	// TODO: Check to see if we are running in a browser with touch support
	createjs.Ticker.setFPS(24);

	sketchCanvasShape = new createjs.Shape();

	stage.addEventListener("stagemousedown", handleMouseDown);
	stage.addEventListener("stagemouseup", handleMouseUp);

	// Center instructions on the sketching canvas
	title = new createjs.Text("touch here to draw", "36px Quicksand", "#777777");
	title.x = ($(sketchCanvas).width() - title.getMeasuredWidth()) / 2;
	title.y = $(sketchCanvas).height() / 2;
	stage.addChild(title);

	stage.addChild(sketchCanvasShape);



	//
	// Render brush color palette options
	//
	for (var i = 0; i < 11; i++) {
		var s = new createjs.Shape(); // Create color swatch (i.e., a "button" for the color)
		s.overColor = "#3281FF";
		s.outColor = paletteColors[i];
		//s.graphics.beginFill(s.outColor).drawRect(0, 0, width, height).endFill();
		s.graphics.beginFill(s.outColor).drawRoundRect(0, 0, width, height, colorPaletteRectangleRadius).endFill();
		s.x = paletteX + (width + padding) * (i % cols);
		s.y = paletteY + (height + padding) * (i / cols | 0);

		// Set up events to make the shape interactive
		s.addEventListener("mouseover", handleMouseOver);
		s.addEventListener("click", handleMouseClick);
		s.addEventListener("mouseout", handleMouseOut);
		stage.addChild(s);

		paletteTools.push(s);
	}

	//
	// Render brush size options
	//
	for (var i = 0; i < 5; i++) {
		var s = new createjs.Shape(); // Create "button"
		s.overColor = "#3281FF";
		s.outColor = paletteColors[i];
		s.radius = 5 + 3 * i;
		s.graphics.beginFill(s.outColor).drawCircle(0, 0, 10 + 3 * i).endFill();
		s.x = 50 + (width + padding) * (i % cols);
		s.y = $(sketchCanvas).height() - (height + padding) - 50;

		// Set up events to make the shape interactive
		// s.onMouseOver = handleMouseOverBrush;
		// s.onMouseOut = handleMouseOutBrush;
		//s.addEventListener("mouseover", handleMouseOverBrush);
		s.addEventListener("click", handleMouseOverBrush);
		//s.addEventListener("mouseout", handleMouseOutBrush);

		brushSizeOptions.push(s);
		stage.addChild(s);

		paletteTools.push(s);
	}

	// Initialize color palette state
	currentPaletteColor = paletteColors[0];

	// Initialize brush size options state (based on initial state of color palette)
	for (i in brushSizeOptions) {
		var brushSizeOption = brushSizeOptions[i];
		brushSizeOption.graphics.clear().beginFill(currentPaletteColor).drawCircle(0, 0, brushSizeOption.radius).endFill();
	}

	//createjs.Ticker.addListener(stage);
	createjs.Ticker.addEventListener("tick", handleTick);

	// "Each time the update method is called, the stage will tick any descendants exposing a tick method (ex. BitmapAnimation) and render its entire display list to the canvas. Any parameters passed to update will be passed on to any onTick handlers." [http://www.createjs.com/Docs/EaselJS/classes/Stage.html]
	//stage.update();
}

// Handler for mouseover event for color option in the palette
function handleMouseOver(event) {
	var target = event.target;
	target.graphics.clear().beginFill(target.outColor).drawRoundRect(-10, -10, width + 20, height + 20, colorPaletteRectangleRadius).endFill();

	// Update color of brush options
	for(i in brushSizeOptions) {
		var brushSizeOption = brushSizeOptions[i];
		brushSizeOption.graphics.clear().beginFill(target.outColor).drawCircle(0, 0, brushSizeOption.radius).endFill();
	}
}

// Handler for click event on color palette
function handleMouseClick(event) {
	var target = event.target;
	currentPaletteColor = target.outColor; // Update palette color

	// Update color of brush options
	for(i in brushSizeOptions) {
		var brushSizeOption = brushSizeOptions[i];
		brushSizeOption.graphics.clear().beginFill(currentPaletteColor).drawCircle(0, 0, brushSizeOption.radius).endFill();
	}
}

// Handler for mouseout event for color option in the palette
function handleMouseOut(event) {
	var target = event.target;
	target.graphics.clear().beginFill(target.outColor).drawRoundRect(0, 0, width, height, colorPaletteRectangleRadius).endFill();

	// Update color of brush options
	for(i in brushSizeOptions) {
		var brushSizeOption = brushSizeOptions[i];
		brushSizeOption.graphics.clear().beginFill(currentPaletteColor).drawCircle(0, 0, brushSizeOption.radius).endFill();
	}
}

// Handler for mouseover event for color option in the palette
function handleMouseOverBrush(event) {
	var target = event.target;
	currentPalleteSize = target.radius * 2; // Update palette color
	target.graphics.clear().beginFill(currentPaletteColor).drawCircle(0, 0, target.radius).endFill();
}

// Handler for mouseout event for color option in the palette
function handleMouseOutBrush(event) {
	var target = event.target;
	target.graphics.clear().beginFill(currentPaletteColor).drawCircle(0, 0, target.radius).endFill();
}

// Tool
function handleMouseClickTool(event) {
	//alert("Tool! Photo? Camera? Audio?");
	// load the source image:
	var image = new Image();
	image.src = "images/daisy.png";
	image.onload = handleImageLoad;
}

function handleTick() {
	stage.update();
}

// Painting. Handle mouse down event.
function handleMouseDown(event) {

	// Make sure no object is under the brush.  Only paint when there's nothing under the brush.
	var object = stage.getObjectUnderPoint(stage.mouseX, stage.mouseY);
	// if (object !== null) {
	// 	return;
	// }

	if (stage.contains(title)) {
		stage.clear(); stage.removeChild(title);
	}
	color = currentPaletteColor;
	stroke = currentPalleteSize;
	oldPt = new createjs.Point(stage.mouseX, stage.mouseY);
	oldMidPt = oldPt;

	// Add event listener for mouse movement
	// i.e., Start listening for mouse movements
	stage.addEventListener("stagemousemove" , handleMouseMove);
}

// Painting. Handle mouse move event.
function handleMouseMove(event) {

	var midPt = new createjs.Point(oldPt.x + stage.mouseX >> 1, oldPt.y + stage.mouseY >> 1);

	//sketchCanvasShape.graphics.clear().setStrokeStyle(stroke, 'round', 'round').beginStroke(color).moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);

	var s = new createjs.Shape();
	s.graphics.clear().setStrokeStyle(stroke, 'round', 'round').beginStroke(color).moveTo(midPt.x, midPt.y).curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);
	//s.graphics.beginFill("#333333").drawRect(stage.mouseX , stage.mouseY, width, height).endFill();
	//s.cache(s.x, midPt.y, 100, 100, 100);
	stage.addChild(s);

	// Store stroke in array
	// TODO: Store user that created the stroke
	// TODO: Send stroke data to server and others on canvas via socket.io message
	// TODO: Draw user avatar next to their current strokes (show them when the stroke is active or actively being rendered)
	var strokePath = {};
	// Store stroke path (from, midpoint, to)
	strokePath['from'] = {};
	strokePath['from'].x = midPt.x;
	strokePath['from'].y = midPt.y;
	strokePath['midpoint'] = {};
	strokePath['midpoint'].x = oldPt.x;
	strokePath['midpoint'].y = oldPt.y;
	strokePath['to'] = {};
	strokePath['to'].x = oldMidPt.x;
	strokePath['to'].y = oldMidPt.y;
	// Store color and size of stroke
	strokePath['color'] = currentPaletteColor;
	strokePath['size'] = currentPalleteSize;
	// Store timestamp of stroke
	strokePath['timestamp'] = new Date().getTime();
	//sketchStrokePaths.push(strokePath);

	// Update points for future strokes
	oldPt.x = stage.mouseX;
	oldPt.y = stage.mouseY;

	oldMidPt.x = midPt.x;
	oldMidPt.y = midPt.y;

	//var jsonString = JSON.stringify(strokePath);
	//iosocket.send(jsonString);

	// Update the stage
	stage.update();
}

// Painting.  Handle mouse up event.
function handleMouseUp(event) {
	// Remove event listener for mousement.
	// i.e., Stop listening for mouse movements.
	stage.removeEventListener("stagemousemove" , handleMouseMove);
}

//-----------------------------------------------------------------------------

function addWidget(moment) {
	// factor common code, then set up callback for different widget types
}

function addThoughtWidget(moment) {

	var type = 'thought';

	//
	// Make sure that the Moment has a sound structure.
	//

	if(moment && moment.frame && moment.frame._id) {

		var thoughtFrame = moment.frame;
		var thought = thoughtFrame.activity; // TODO: Update this based on current view for user

		// Only continue if Thought element is valid
		if (!thought) return;

		var e;
		var div;

		//
		// Check if a widget for the Activity already exists. If so, store a reference 
		// to it.  If not, create the widget and store a reference to it.
		//

		if ($("#frame-" + thoughtFrame.frame).length != 0) {
			// Element exists, so update it
			console.log("Found existing thought widget. Updating widget.");

			e = $('#frame-' + thoughtFrame.frame); // <li> element
			div = e.find('.element .text');

		} else {

			// Widget does not exist for element does not exist, so create it
			console.log("Could not find existing widget for thought. Creating new thought widget.");

			// Clone template structure and remove 'id' element to avoid 'id' conflict
			e = $('#thought-activity-template').clone().attr('id', 'volatile-activity');
			e.addClass('activity-frame');
			e.removeAttr('id'); // Remove 'id' attribute
			div = e.find('.element .text');
		}

		//
		// Update widget based on whether it is the timeline's "parent" Moment
		//

		if (moment._id === $('#narrative-list').attr('data-moment')) {
			e.find('.timeline-branch').hide();
		}

		// Update 'li' for element
		e.attr('id', 'frame-' + thoughtFrame.frame);
		e.attr('data-id', thoughtFrame.frame);
		e.attr('data-timeline', thoughtFrame.timeline);

		// Update element
		var div2 = e.find('.activity-widget .element');
		div2.attr('id', 'thought-' + thought._id);
		div2.attr('data-id', thought._id);
		div2.attr('data-frame', thought.frame);
		div2.attr('data-reference', thought.reference);
		div2.attr('data-text', thought.text);
		div.attr('contenteditable', 'true');
		div.html(thought.text);

		// Update Account that authored the contribution
		//if (thought.author && thought.username) {
			e.find('.account').html('<strong>' + thought.author.username + '</strong>' + ' had a thought');
			console.log(thought.author.username);
		//}

		// Update options for widget
		var options = e.find('.activity-widget .element .options');
		options.find('.open').click(function() { getNextThought(e); });

		if ($("#frame-" + thoughtFrame.frame).length != 0) {
		} else {

			//
			// Set up Widget event handlers.
			//

			e.appendTo('#narrative-list');
			//e.find('.element .text').off('blur');
			//e.find('.element .text').blur(function() { saveThought(e); });
			e.find('.tags').off('blur');
			e.find('.tags').blur(function() { saveTags(e); });
			//e.find('.element .options .timeline').click(function() { getTimeline({ moment_id: moment._id }); });
			e.find('.timeline').click(function() { getTimeline({ moment_id: moment._id }); });
			e.find('.hide').click(function() { toggleWidget(e); });
		

			e.show(); // Show element

			//
			// Set up listeners for TOUCH EVENTS on the widget (e.g., swipe)
			//

			var frameWidget = document.getElementById('frame-' + thoughtFrame.frame);

			// 'touchstart' event handler
			frameWidget.addEventListener('touchstart', function(event) {
				//event.preventDefault();
				var touchCount = event.targetTouches.length;
				console.log('Touch count: ' + touchCount);

				if (touchCount === 1) {
					var touch = event.touches[0];
					console.log(event.target + " touchstart: Touch x:" + touch.pageX + ", y:" + touch.pageY);
					frameWidget.swipeInProgress = true;

					// Store first touch point of swipe
					frameWidget.swipeStartX = touch.pageX;
					frameWidget.swipeStartY = touch.pageY;

					// Store "previous point" of swipe (for future reference)
					frameWidget.previousX = frameWidget.swipeStartX;
					frameWidget.previousY = frameWidget.swipeStartY;
				} else {
					frameWidget.swipeInProgress = false;
				}
			}, false);

			// 'touchmove' event handler
			frameWidget.addEventListener('touchmove', function(event) {

				//console.log("gesture in progress: " + frameWidget.swipeGestreInProgress);
				//event.preventDefault();
				var touch = event.touches[0];
				var touchCount = event.touches.length;

				if (touchCount > 1) {
					frameWidget.swipeInProgress = false;
				}

				// Determine if swipe is still taking place
				var changeX = Math.abs(touch.pageX - frameWidget.previousX);
				var changeY = Math.abs(touch.pageY - frameWidget.previousY);
				console.log('changeX = ' + changeX + ', ' + 'changeY = ' + changeY);
				if (changeY >= changeX) {
					// Abort gesture

					frameWidget.swipeInProgress = false;
					console.log("aborting gesture");
				} else {
					// Continue gesture

					// Store "previous point"
					frameWidget.previousX = touch.pageX;
					frameWidget.previousY = touch.pageY;
				}
			}, false);

			// 'touchend' event handler
			frameWidget.addEventListener('touchend', function(event) {
				//event.preventDefault();
				var touch = event.changedTouches[0];
				//var touch = event.targetTouches[0];
				console.log(event.target + " touchend: Touch x:" + touch.pageX + ", y:" + touch.pageY);

				console.log("SWIPED!");

				if (frameWidget.swipeInProgress === true) {
					// Reset swipe gesture state
					frameWidget.swipeInProgress = false;

					var swipeDistanceThreshold = 50; // Minimum required distance between start and end touch event x coordinates to be considered a swipe
					if (frameWidget.swipeStartX > (touch.pageX + swipeDistanceThreshold)) {
						// Fire 'swipe' event
						getTimeline({ moment_id: moment._id });
					}
				}

			}, false);

			// touchcancel
			frameWidget.addEventListener('touchcancel', function(event) {
				//event.preventDefault();
				var touch = event.touches[0];
				console.log(event.target + " touchcancel: Touch x:" + touch.pageX + ", y:" + touch.pageY);
			}, false);

			//
			// Request Tags from server
			//

			getTags(e);
		}

		// Update Frame based on FrameView for current user's Account
		if (thoughtFrame.visible === false) {
			$(e).addClass('hidden')
			$(e).find('.hide').attr('src', './img/plus-red.png');
			$(e).hide();
		}

		setupThoughtWidget();

	} else {

		//
		// Widget does not exist for the Activity.  Create new Widget.
		//

		console.log("Creating new Widget for Thought.");

		// Clone template structure and remove 'id' element to avoid 'id' conflict
		e = $('#thought-activity-template').clone().attr('id', 'volatile-activity');
		e.addClass('activity-frame');
		e.removeAttr('id'); // Remove 'id' attribute
		e.appendTo('#narrative-list');
		// e.find('.element .options .timeline').click(function() { getTimeline({ moment_id: moment._id }); });

		setupThoughtWidget();

		// Show the Widget
		e.show();
	}

	//
	// Setup Thought Widget
	//

	function setupThoughtWidget() {

		//
		// Set up Widget-specific event handlers
		//
		var options = {};
		options['default'] = 'touch here to add thought'; // Set parameters

		if (!e.find('.element').attr('data-text')) {
			e.find('.element .text').text(options['default']); // Initialize with default text
			e.find('.element .text').css('color', '#333333'); // Set color of text
		} else {
			e.find('.element .text').css('color', '#000000'); // Set color of text
		}

		// Set up click handler
		e.off('click');
		e.find('.element .text').click(function () {

			// Get the text currently in the widget
			var currentText = e.find('.element .text').text();
			console.log(currentText);
			console.log(e.find('.element').attr('data-text'));

			// Check if the text is the default text.  If so, empty the input widget.
			if (currentText === options['default'] && e.find('.element').attr('data-text') !== options['default']) {
				e.find('.element .text').text('');
			}
		});

		e.off('keydown');
		e.find('.element .text').keydown(function(event) {
			var currentText = e.find('.element .text').text();

			if (currentText === options['default']) {
				if (event.keyCode !== 8) {
					e.find('.element .text').text('');
					e.find('.element .text').css('color', '#000000'); // Set color of text
				}

			}
		});

		// Set up typing handler
		e.off('keyup');
		e.find('.element .text').keyup(function(event) {
			var currentText = e.find('.element .text').text();

			// Get current caret position
			// var currentSelectRange = window.getSelection().getRangeAt(0);
			// currentSelectRange.startOffset += 1;
			// currentSelectRange.endOffset = currentSelectRange.startOffset;

			// Clean up input
			var updatedText = currentText.replace(/^\s+/, ''); // Trim whitespace from the beginning text

			// Check input
			if (updatedText === '') {

				//if (event.keyCode !== 8) {

					// Set default text
					updatedText = options['default'];

					e.find('.element .text').text(updatedText);
				//}

				if (!e.find('.element').attr('data-text')) {
					e.find('.element .text').text(options['default']); // Initialize with default text
					e.find('.element .text').css('color', '#333333'); // Set color of text

				} else {
					e.find('.element .text').css('color', '#000000'); // Set color of text
				}

			} else if (currentText === options['default']) {
				if (event.keyCode !== 8) {
					e.find('.element .text').text('');
					e.find('.element .text').css('color', '#000000'); // Set color of text
				}

			} else {
				e.find('.element .text').css('color', '#000000'); // Set color of text
			}

			// Update text
			// e.find('.element .text').text(updatedText);

			// Restore range
			// window.getSelection().removeAllRanges();
			// window.getSelection().addRange(currentSelectRange);
		});

		// Save if changes exist
		e.find('.element .text').blur(function() {

			// Get the text currently in the widget
			var currentText = e.find('.element .text').text();

			// If no text is entered but text is saved, revert to original text
			if (currentText === '') {
				if (e.find('.element').attr('data-text')) {
					e.find('.element .text').text(e.find('.element').attr('data-text'));
				}
			}

			// Get current text (after any pre-processing done above)
			currentText = e.find('.element .text').text(); // Update current text

			// Get saved text
			var savedText = null;
			if (e.find('.element').attr('data-text')) {
				savedText = e.find('.element').attr('data-text');
			}

			console.log('changes: %s , %s', currentText, savedText);

			// Save only if changed
			if (currentText !== savedText) {
				saveThought(e);
			}
		});
	}
}

function addTopicWidget(moment) {

	if(moment && moment.frame && moment.frame._id) {

		var topicFrame        = moment.frame;
		var topic = topicFrame.activity; // TODO: Update this based on current view for user

		// Only continue if Thought element is valid
		if (!topic) return;

		var e;
		var div;

		if ($("#frame-" + topicFrame.frame).length != 0) {
			// Element exists, so update it
			console.log("Found existing topic widget. Updating widget.");

			e = $('#frame-' + topicFrame.frame); // <li> element
			div = e.find('.element .text');

		} else {

			// Widget does not exist for element does not exist, so create it
			console.log("Could not find existing widget for topic. Creating new topic widget.");

			// Clone template structure and remove 'id' element to avoid 'id' conflict
			e = $('#topic-activity-template').clone().attr('id', 'volatile-activity');
			e.addClass('activity-frame');
			e.removeAttr('id'); // Remove 'id' attribute
			div = e.find('.element .text');
		}

		// Update 'li' for element
		e.attr('id', 'frame-' + topicFrame.frame);
		e.attr('data-id', topicFrame.frame);
		e.attr('data-timeline', topicFrame.timeline);

		// Update element
		var div2 = e.find('.activity-widget .element');
		div2.attr('id', 'topic-' + topic._id);
		div2.attr('data-id', topic._id);
		div2.attr('data-frame', topic.frame);
		div2.attr('data-reference', topic.reference);
		div.attr('contenteditable', 'true');
		div.html(topic.text);

		if ($("#frame-" + topicFrame.frame).length != 0) {
		} else {

			e.appendTo('#narrative-list');
			e.find('.element .text').blur(function() { saveTopic(e); });
			e.find('.element .options .timeline').click(function() { getTimeline({ moment_id: moment._id }); });
			e.find('.hide').click(function() { toggleWidget(e); });

			e.show(); // Show element
		}

		// Update Frame based on FrameView for current user's Account
		if (topicFrame.visible === false) {
			$(e).addClass('hidden')
			$(e).find('.hide').attr('src', './img/plus-red.png');
			$(e).hide();
		}

	} else {

		console.log("Creating new topic widget.");

		// Clone template structure and remove 'id' element to avoid 'id' conflict
		e = $('#topic-activity-template').clone().attr('id', 'volatile-activity');
		e.addClass('activity-frame');
		e.removeAttr('id'); // Remove 'id' attribute
		e.appendTo('#narrative-list');
		e.find('.element .text').blur(function() { saveTopic(e) });
		// e.find('.element .options .timeline').click(function() { getTimeline({ moment_id: moment._id }); });
		e.show(); // Show element
	}
}

var showingHiddenFrames = false;
function showHiddenFrames() {
	if (showingHiddenFrames) {
		showingHiddenFrames = false;
		$('.activity-frame.hidden').fadeOut('slow', function() {
			//$('.activity-frame.hidden').slideUp();
		});
	} else {
		showingHiddenFrames = true;
		//$('.activity-frame.hidden').css('visibility', 'hidden');
		//$('.activity-frame.hidden').slideDown('slow', function() {
			//$('.activity-frame.hidden').css('visibility', 'visible');
			$('.activity-frame.hidden').fadeIn('slow');
		//});
	}
}

function setCurrentWidget(widget) {
	e.find('.element .options').show();
}




//
// Timeline
//

function addTimelineWidget(moment) {


	console.log(moment.frameType);

	// Add thought to timeline
	if(moment.frameType === 'Thought') {
		addThoughtWidget(moment);

	} else if(moment.frameType === 'Topic') {
		addTopicWidget(moment);

	} else if(moment.frameType === 'Photo') {
		addPhotoWidget(moment);

	} else if(moment.frameType === 'Video') {
		addVideoWidget(moment);

	} else if(moment.frameType === 'Motion') {
		addMotionWidget(moment);

	} else if(moment.frameType === 'Sketch') {
		addSketchWidget(moment);

	} else if(moment.frameType === 'Narration') {
		addNarrationWidget(moment);
	}
}




//
// Photos
//

function addPhotoWidget(moment) {
	console.log("addPhotoWidget");

	console.log(moment);

	if(moment && moment.frame && moment.frame._id) {

		var perspective    = moment.frame;
		var activity = perspective.activity; // TODO: Update this based on current view for user

		// Only continue if Thought frame is valid
		if (!activity) return;

		var e;
		var div;

		if ($("#frame-" + perspective.frame).length != 0) {
			// Frame exists, so update it
			console.log("Found existing photo widget. Updating widget.");

			e = $('#frame-' + perspective.frame); // <li> element
			e.find('.timeline').click(function() { getTimeline({ moment_id: moment._id }); });
			//div = e.find('.element .text');

		} else {

			// Widget does not exist for element does not exist, so create it
			console.log("Could not find existing widget for photo. Creating new photo widget.");

			// Clone template structure and remove 'id' element to avoid 'id' conflict
			e = $('#photo-template').clone().attr('id', 'volatile-activity');
			e.addClass('activity-frame');
			e.removeAttr('id'); // Remove 'id' attribute
			//div = e.find('.element .text');
		}

		// Update 'li' for element
		e.attr('id', 'frame-' + perspective.frame);
		e.attr('data-id', perspective.frame);
		e.attr('data-timeline', perspective.timeline);

		// Update element
		var div2 = e.find('.activity-widget .element');
		div2.attr('id', 'photo-' + activity._id);
		div2.attr('data-id', activity._id);
		div2.attr('data-frame', activity.frame);
		div2.attr('data-reference', activity.reference);
		// div.attr('contenteditable', 'true');
		// div.html(activity.text);

		// Update Account that authored the contribution
		//if (thought.author && thought.username) {
			e.find('.account').html('<strong>' + activity.author.username + '</strong>' + ' snapped a photo');
			console.log(activity.author.username);
		//}

		// Add Tags
		e.find('.tags').off('blur');
		e.find('.tags').blur(function() { saveTags(e); });

		// Set image
		var image = e.find('.element .image');
		image.attr('src', '' + localStorage['host'] + activity.uri + '');

		image.click(function (event) { 
			generatePhotoPage(event);
		});

		if ($("#frame-" + perspective.frame).length != 0) {
		} else {

			e.appendTo('#narrative-list');
			//e.find('.element .image').click(function() { changePhoto(e) });
			e.find('.element .options .timeline').click(function() { getTimeline({ moment_id: moment._id }); });
			e.find('.hide').click(function() { toggleWidget(e); });

			e.show(); // Show element
		}

		// Update Frame based on FrameView for current user's Account
		if (perspective.visible === false) {
			$(e).addClass('hidden')
			$(e).find('.hide').attr('src', './img/plus-red.png');
			$(e).hide();
		}

		// Request Tags from server
		getTags(e);

	} else {

		console.log("Creating new photo widget.");

		// Clone template structure and remove 'id' element to avoid 'id' conflict
		e = $('#photo-template').clone().attr('id', 'volatile-activity');
		e.addClass('activity-frame');
		e.removeAttr('id'); // Remove 'id' attribute
		e.appendTo('#narrative-list');
		e.find('.element .image').click(function() { changePhoto(e) });
		e.show(); // Show element
	}
}




//
// Videos
//

function addVideoWidget(moment) {
	console.log("addVideoWidget");

	console.log(moment);

	if(moment && moment.frame && moment.frame._id) {

		var frame    = moment.frame;
		var activity = frame.activity; // TODO: Update this based on current view for user

		// Only continue if Thought element is valid
		if (!activity) return;

		var e;
		var div;

		if ($("#frame-" + frame.frame).length != 0) {
			// Element exists, so update it
			console.log("Found existing Video widget. Updating widget.");

			e = $('#frame-' + frame.frame); // <li> element

			e.find('.timeline').click(function() { getTimeline({ moment_id: moment._id }); });
			//div = e.find('.element .text');

		} else {

			// Widget does not exist for element does not exist, so create it
			console.log("Could not find existing widget for video. Creating new video widget.");

			// Clone template structure and remove 'id' element to avoid 'id' conflict
			e = $('#video-activity-template').clone().attr('id', 'volatile-activity');
			e.addClass('activity-frame');
			e.removeAttr('id'); // Remove 'id' attribute
			//div = e.find('.element .text');
		}

		// Update 'li' for element
		e.attr('id', 'frame-' + frame.frame);
		e.attr('data-id', frame.frame);
		e.attr('data-timeline', frame.timeline);

		// Update element
		var div2 = e.find('.activity-widget .element');
		div2.attr('id', 'video-' + activity._id);
		div2.attr('data-id', activity._id);
		div2.attr('data-frame', activity.frame);
		div2.attr('data-reference', activity.reference);
		// div.attr('contenteditable', 'true');
		// div.html(activity.text);

		// Update Account that authored the contribution
		//if (thought.author && thought.username) {
			e.find('.account').html('<strong>' + activity.author.username + '</strong>' + ' shot a video');
			console.log(activity.author.username);
		//}

		// Set video
		var video = e.find('.element .video .source');
		video.attr('src', '' + localStorage['host'] + activity.uri + '');

		e.find('.element .video').click(function (event) { 
			generateVideoPage(event);
		});

		// Add Tags
		e.find('.tags').off('blur');
		e.find('.tags').blur(function() { saveTags(e); });

		if ($("#frame-" + frame.frame).length != 0) {
		} else {

			e.appendTo('#narrative-list');
			//e.find('.element .video').click(function() { changeVideo(e) });
			e.find('.element .options .timeline').click(function() { getTimeline({ moment_id: moment._id }); });
			e.find('.hide').click(function() { toggleWidget(e); });

			e.show(); // Show element
		}

		// Update Frame based on FrameView for current user's Account
		if (frame.visible === false) {
			$(e).addClass('hidden')
			$(e).find('.hide').attr('src', './img/plus-red.png');
			$(e).hide();
		}

		// Request Tags from server
		getTags(e);

	} else {

		console.log("Creating new video widget.");

		// Clone template structure and remove 'id' element to avoid 'id' conflict
		e = $('#video-activity-template').clone().attr('id', 'volatile-activity');
		e.addClass('activity-frame');
		e.removeAttr('id'); // Remove 'id' attribute
		e.appendTo('#narrative-list');
		//e.find('.element .video').click(function() { changeVideo(e) });
		e.show(); // Show element
	}
}




//
// Motion
//

function addMotionWidget(moment) {
	console.log("addMotionWidget");

	console.log(moment);

	if(moment && moment.frame && moment.frame._id) {

		var frame    = moment.frame;
		var activity = frame.activity; // TODO: Update this based on current view for user

		// Only continue if Thought frame is valid
		if (!activity) return;

		var e;
		var div;

		if ($("#frame-" + frame.frame).length != 0) {
			// Frame exists, so update it
			console.log("Found existing Motion widget. Updating widget.");

			e = $('#frame-' + frame.frame); // <li> element

			e.find('.timeline').click(function() { getTimeline({ moment_id: moment._id }); });
			//div = e.find('.element .canvas');

		} else {

			// Widget does not exist for element does not exist, so create it
			console.log("Could not find existing widget for Motion. Creating new Motion widget.");

			// Clone template structure and remove 'id' element to avoid 'id' conflict
			e = $('#motion-activity-template').clone().attr('id', 'volatile-activity');
			e.addClass('activity-frame');
			e.removeAttr('id'); // Remove 'id' attribute
			//div = e.find('.element .canvas');
		}

		// Update 'li' for element
		e.attr('id', 'frame-' + frame.frame);
		e.attr('data-id', frame.frame);
		e.attr('data-timeline', frame.timeline);

		// Update element
		var div2 = e.find('.activity-widget .element');
		div2.attr('id', 'motion-' + activity._id);
		div2.attr('data-id', activity._id);
		div2.attr('data-frame', activity.frame);
		div2.attr('data-reference', activity.reference);
		// div.attr('contenteditable', 'true');
		// div.html(activity.text);


		
		// TODO: Render graph



		// Update Account that authored the contribution
		//if (thought.author && thought.username) {
			e.find('.account').html('<strong>' + activity.author.username + '</strong>' + ' captured motion');
			//console.log(activity.author.username);
		//}

		// Add Tags
		e.find('.tags').off('blur');
		e.find('.tags').blur(function() { saveTags(e); });

		// Set image
		// var image = e.find('.element .image');
		// image.attr('src', '' + localStorage['host'] + activity.uri + '');

		// image.click(function (event) {
		// 	generatePhotoPage(event);
		// });

		if ($("#frame-" + frame.frame).length != 0) {
		} else {

			e.appendTo('#narrative-list');
			//e.find('.element .image').click(function() { changePhoto(e) });
			e.find('.element .options .timeline').click(function() { getTimeline({ moment_id: moment._id }); });
			e.find('.hide').click(function() { toggleWidget(e); });

			e.show(); // Show element
		}

		// Update Frame based on FrameView for current user's Account
		if (frame.visible === false) {
			$(e).addClass('hidden')
			$(e).find('.hide').attr('src', './img/plus-red.png');
			$(e).hide();
		}

		// Request Tags from server
		getTags(e);

		//
		// Render plot.  Plot points on the canvas.
		// NOTE: This should be done after adding the plot to the curation UI and making the plot visible.
		//

		if (activity.hasOwnProperty('points')) {

			var graph = e.find('.element .canvas');
			var context = graph[0].getContext('2d'); // Get canvas rendering context

			drawGraph(graph, activity.points);
		}

	} else {

		console.log("Creating new Motion widget.");

		// Clone template structure and remove 'id' element to avoid 'id' conflict
		e = $('#motion-activity-template').clone().attr('id', 'volatile-activity');
		e.addClass('activity-frame');
		e.removeAttr('id'); // Remove 'id' attribute
		e.appendTo('#narrative-list');
		//e.find('.element .image').click(function() { changePhoto(e) });
		e.show(); // Show element
	}
}




//
// Sketch
//

function addSketchWidget(moment) {
	console.log("addSketchWidget");

	console.log(moment);

	if(moment && moment.frame && moment.frame._id) {

		var frame    = moment.frame;
		var activity = frame.activity; // TODO: Update this based on current view for user

		// Only continue if Thought frame is valid
		if (!activity) return;

		var e;
		var div;

		if ($("#frame-" + frame.frame).length != 0) {
			// Frame exists, so update it
			console.log("Found existing sketch widget. Updating widget.");

			e = $('#frame-' + frame.frame); // <li> element
			//div = e.find('.element .text');

		} else {

			// Widget does not exist for element does not exist, so create it
			console.log("Could not find existing widget for sketch. Creating new sketch widget.");

			// Clone template structure and remove 'id' element to avoid 'id' conflict
			e = $('#sketch-activity-template').clone().attr('id', 'volatile-activity');
			e.addClass('activity-frame');
			e.removeAttr('id'); // Remove 'id' attribute

			e.find('.timeline').click(function() { getTimeline({ moment_id: moment._id }); });
			//div = e.find('.element .text');
		}

		// Update 'li' for element
		e.attr('id', 'frame-' + frame.frame);
		e.attr('data-id', frame.frame);
		e.attr('data-timeline', frame.timeline);

		// Update element
		var div2 = e.find('.activity-widget .element');
		div2.attr('id', 'sketch-' + activity._id);
		div2.attr('data-id', activity._id);
		div2.attr('data-frame', activity.frame);
		div2.attr('data-reference', activity.reference);
		// div.attr('contenteditable', 'true');
		// div.html(activity.text);

		// Update Account that authored the contribution
		//if (thought.author && thought.username) {
			e.find('.account').html('<strong>' + activity.author.username + '</strong>' + ' made a sketch');
			console.log(activity.author.username);
		//}

		// Add Tags
		e.find('.tags').off('blur');
		e.find('.tags').blur(function() { saveTags(e); });

		// Set image
		var image = e.find('.element .image');
		image.attr('src', activity.imageData);

		// image.click(function (event) { 
		// 	generatePhotoPage(event);
		// });

		if ($("#frame-" + frame.frame).length != 0) {
		} else {

			e.appendTo('#narrative-list');
			//e.find('.element .image').click(function() { changeSketch(e) });
			e.find('.element .options .timeline').click(function() { getTimeline({ moment_id: moment._id }); });
			e.find('.hide').click(function() { toggleWidget(e); });
		

			e.show(); // Show element
		}
		
		// Update Frame based on FrameView for current user's Account
		if (frame.visible === false) {
			$(e).addClass('hidden')
			$(e).find('.hide').attr('src', './img/plus-red.png');
			$(e).hide();
		}

		// Request Tags from server
		getTags(e);

		// Update the Widget (updates that can only happen after displaying the widget)
		if (activity.hasOwnProperty('imageWidth') && activity.hasOwnProperty('imageHeight')) {
			var ratio = activity.imageWidth / activity.imageHeight;
			var adjustedImageWidth = $(image).parent().width();
			var adjustedImageHeight = Math.floor(adjustedImageWidth / ratio);
			console.log('adjustedWidth/Height: ' + ratio + ', ' + adjustedImageWidth + ', ' + adjustedImageHeight);
			image.attr('width', adjustedImageWidth);
			image.attr('height', adjustedImageHeight);
		}

	} else {

		console.log("Creating new Sketch widget.");

		// Clone template structure and remove 'id' element to avoid 'id' conflict
		e = $('#sketch-activity-template').clone().attr('id', 'volatile-activity');
		e.addClass('activity-frame');
		e.removeAttr('id'); // Remove 'id' attribute
		e.appendTo('#narrative-list');
		//e.find('.element .image').click(function() { changeSketch(e) });
		e.show(); // Show element
	}
}




//
// Narration
//

function addNarrationWidget(moment) {
	console.log("addNarrationWidget");

	console.log(moment);

	if(moment && moment.frame && moment.frame._id) {

		var perspective    = moment.frame;
		var activity = perspective.activity; // TODO: Update this based on current view for user

		// Only continue if Thought frame is valid
		if (!activity) return;

		var e;
		var div;

		if ($("#frame-" + perspective.frame).length != 0) {
			// Frame exists, so update it
			console.log("Found existing photo widget. Updating widget.");

			
			e.find('.timeline').click(function() { getTimeline({ moment_id: moment._id }); });

			e = $('#frame-' + perspective.frame); // <li> element
			div = e.find('.text');

		} else {

			// Widget does not exist for element does not exist, so create it
			console.log("Could not find existing widget for photo. Creating new photo widget.");

			// Clone template structure and remove 'id' element to avoid 'id' conflict
			e = $('#narration-activity-template').clone().attr('id', 'volatile-activity');
			e.addClass('activity-frame');
			e.removeAttr('id'); // Remove 'id' attribute
			div = e.find('.text');
		}

		// Update 'li' for element
		e.attr('id', 'frame-' + perspective.frame);
		e.attr('data-id', perspective.frame);
		e.attr('data-timeline', perspective.timeline);

		// Update element
		var div2 = e.find('.activity-widget .element');
		div2.attr('id', 'photo-' + activity._id);
		div2.attr('data-id', activity._id);
		div2.attr('data-frame', activity.frame);
		div2.attr('data-reference', activity.reference);
		div.attr('contenteditable', 'true');
		div.html(activity.text);

		// Update Account that authored the contribution
		//if (thought.author && thought.username) {
			e.find('.account').html('<strong>' + activity.author.username + '</strong>' + ' says');
			console.log(activity.author.username);
		//}

		// Add Tags
		e.find('.tags').off('blur');
		e.find('.tags').blur(function() { saveTags(e); });

		// Set image
		// var image = e.find('.element .image');
		// image.attr('src', '' + localStorage['host'] + activity.uri + '');

		// image.click(function (event) { 
		// 	generatePhotoPage(event);
		// });

		if ($("#frame-" + perspective.frame).length != 0) {
		} else {

			e.appendTo('#narrative-list');
			//e.find('.element .image').click(function() { changePhoto(e) });
			e.find('.element .options .timeline').click(function() { getTimeline({ moment_id: moment._id }); });
			e.find('.hide').click(function() { toggleWidget(e); });
			e.find('.text').blur(function() { saveNarration(e); });

			e.show(); // Show element
		}

		// Update Frame based on FrameView for current user's Account
		if (perspective.visible === false) {
			$(e).addClass('hidden');
			$(e).find('.hide').attr('src', './img/plus-red.png');
			$(e).hide();
		}

		// Request Tags from server
		getTags(e);

	} else {

		console.log("Creating new photo widget.");

		// Clone template structure and remove 'id' element to avoid 'id' conflict
		e = $('#narration-activity-template').clone().attr('id', 'volatile-activity');
		e.addClass('activity-frame');
		e.removeAttr('id'); // Remove 'id' attribute
		e.appendTo('#narrative-list');
		//e.find('.element .image').click(function() { changePhoto(e) });
		e.find('.text').blur(function() { saveNarration(e); });
		e.show(); // Show element
	}
}

function saveNarration(e) {
	console.log('saveNarration');

	var widget  = e.find('.activity-widget');
	var element = e.find('.activity-widget .element');
	var text    = e.find('.element .text');

	// Construct JSON object for element to save
	var dataJSON = {
		"timeline": $("#narrative-list").attr("data-timeline"),
		"text": e.find('.text').text()
	};

	if(element.attr("data-frame")) dataJSON.frame = element.attr("data-frame");
	if(element.attr("data-id")) dataJSON.reference = element.attr("data-id"); // Set the element to the reference, since it was edited.

	console.log("Saving Narration (JSON): ");
	console.log(dataJSON);
	// POST the JSON object

	$.ajax({
		type: 'POST',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/narration',
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		data: JSON.stringify(dataJSON),
		processData: false,
		success: function(data) {
			console.log('Saved Narration: ');
			console.log(data);

			// Set element container (e.g., Narration). Only gets set once.
			$(e).attr('id', 'frame-' + data.frame._id); // e.data('id', data._id);
			addTimelineWidget(e);

			console.log('Updated Narration element.');
		},
		error: function() {
			console.log('Failed to save Narration.');
		}
	});
}




//
// Thoughts
//

function getNextThought(e) {
	console.log('getNextThought');

	var widget  = e.find('.activity-widget');
	var element = e.find('.activity-widget .element');
	var text    = e.find('.element .text');

	// Construct JSON object for element to save
	// var dataJSON = {
	// 	"timeline": $("#narrative-list").attr("data-timeline"),
	// 	"frame": element.attr("data-frame"),
	// };

	var frame = element.attr('data-frame')
	var currentThoughtId = element.attr('data-id');

	//if(element.attr("data-frame")) dataJSON.frame = element.attr("data-frame");
	//if(element.attr("data-id")) dataJSON.reference = element.attr("data-id"); // Set the element to the reference, since it was edited.

	// POST the JSON object

	$.ajax({
		type: 'GET',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/thought?frame=' + frame,
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		processData: false,
		success: function(data) {
			console.log('Updated thought: ');
			console.log(data);

			var thoughtCount = data.length;
			var i = 0;
			var next = -1;
			for(activity in data) {
				// Get subsequent thought
				console.log(data[activity]._id + " VS " + currentThoughtId);
				if (data[activity]._id === currentThoughtId) {
					if (i == (thoughtCount - 1)) {
						next = 0;
						break;
					} else {
						next = i + 1;
						break;
					}
				}
				i++;
			}

			var chosenThought = data[next];
			console.log('Next Thought: ' + chosenThought._id);
			element.attr('data-id', chosenThought._id);
			console.log(element.attr('data-id'));
			text.text(chosenThought.text);

			putThought({ frame: frame, activity: chosenThought._id });


			//e.fadeIn();
			// Set element container (e.g., Thought). Only gets set once.
			//$(e).attr('id', 'frame-' + data.frame._id); // e.data('id', data._id);
			//addTimelineWidget(e);

			console.log('Updated ThoughtFrameWidget.');
		},
		error: function() {
			console.log('Failed to save thought.');
		}
	});
}

function putThought(jsonData) {
	console.log('putThought');

	// var widget  = e.find('.activity-widget');
	// var element = e.find('.activity-widget .element');
	// var text    = e.find('.element .text');

	// // Construct JSON object for element to save
	// var dataJSON = {
	// 	"timeline": $("#narrative-list").attr("data-timeline"),
	// 	"frame": element.attr("data-frame"),
	// 	"visible": true
	// };

	//if(element.attr("data-frame")) dataJSON.frame = element.attr("data-frame");
	//if(element.attr("data-id")) dataJSON.reference = element.attr("data-id"); // Set the element to the reference, since it was edited.

	console.log("Saving thought (JSON): ");
	// console.log(dataJSON);
	// POST the JSON object

	$.ajax({
		type: 'PUT',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/thought',
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		data: JSON.stringify(jsonData),
		processData: false,
		success: function(data) {
			console.log('Updated thought: ');
			console.log(data);

			// e.fadeIn();
			// Set element container (e.g., Thought). Only gets set once.
			//$(e).attr('id', 'frame-' + data.frame._id); // e.data('id', data._id);
			//addTimelineWidget(e);

			// console.log('Updated thought element.');
		},
		error: function() {
			console.log('Failed to PUT Thought.');
		}
	});
}

function showThought(e) {
	console.log('showThought');

	var widget  = e.find('.activity-widget');
	var element = e.find('.activity-widget .element');
	var text    = e.find('.element .text');

	// Construct JSON object for element to save
	var dataJSON = {
		"timeline": $("#narrative-list").attr("data-timeline"),
		"frame": element.attr("data-frame"),
		"visible": true
	};

	//if(element.attr("data-frame")) dataJSON.frame = element.attr("data-frame");
	//if(element.attr("data-id")) dataJSON.reference = element.attr("data-id"); // Set the element to the reference, since it was edited.

	console.log("Saving thought (JSON): ");
	console.log(dataJSON);
	// POST the JSON object

	$.ajax({
		type: 'PUT',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/thought',
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		data: JSON.stringify(dataJSON),
		processData: false,
		success: function(data) {
			console.log('Updated thought: ');
			console.log(data);

			$(e).find('.hide').attr('src', './img/cross-gray.png');
			$(e).find('.hide').off('click');
			$(e).find('.hide').click(function() { hideThought(e); });
			e.fadeIn();
			// Set element container (e.g., Thought). Only gets set once.
			//$(e).attr('id', 'frame-' + data.frame._id); // e.data('id', data._id);
			//addTimelineWidget(e);

			console.log('Updated thought element.');
		},
		error: function() {
			console.log('Failed to save thought.');
		}
	});
}

function hideThought(e) {
	console.log('hideThought');

	var widget  = e.find('.activity-widget');
	var element = e.find('.activity-widget .element');
	var text    = e.find('.element .text');

	// Construct JSON object for element to save
	var dataJSON = {
		"timeline": $("#narrative-list").attr("data-timeline"),
		"frame": element.attr("data-frame"),
		"visible": false
	};

	//if(element.attr("data-frame")) dataJSON.frame = element.attr("data-frame");
	//if(element.attr("data-id")) dataJSON.reference = element.attr("data-id"); // Set the element to the reference, since it was edited.

	console.log("Saving thought (JSON): ");
	console.log(dataJSON);
	// POST the JSON object

	$.ajax({
		type: 'PUT',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/thought',
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		data: JSON.stringify(dataJSON),
		processData: false,
		success: function(data) {
			console.log('Updated thought: ');
			console.log(data);

			e.addClass('hidden');
			e.fadeOut();
			$(e).find('.hide').attr('src', './img/plus-red.png');
			$(e).find('.hide').off('click');
			$(e).find('.hide').click(function() { showThought(e); });
			// Set element container (e.g., Thought). Only gets set once.
			//$(e).attr('id', 'frame-' + data.frame._id); // e.data('id', data._id);
			//addTimelineWidget(e);

			console.log('Updated thought element.');
		},
		error: function() {
			console.log('Failed to save thought.');
		}
	});
}

function saveThought(e) {
	console.log('saveThought');

	var widget  = e.find('.activity-widget');
	var element = e.find('.activity-widget .element');
	var text    = e.find('.element .text');

	// Construct JSON object for element to save
	var dataJSON = {
		"timeline": $("#narrative-list").attr("data-timeline"),
		"text": e.find('.text').text()
	};

	if(element.attr("data-frame")) dataJSON.frame = element.attr("data-frame");
	if(element.attr("data-id")) dataJSON.reference = element.attr("data-id"); // Set the element to the reference, since it was edited.

	console.log("Saving thought (JSON): ");
	console.log(dataJSON);
	// POST the JSON object

	$.ajax({
		type: 'POST',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/thought',
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		data: JSON.stringify(dataJSON),
		processData: false,
		success: function(data) {
			console.log('Saved Thought: ');
			console.log(data);

			// Set element container (e.g., Thought). Only gets set once.
			$(e).attr('id', 'frame-' + data.frame._id); // e.data('id', data._id);
			addTimelineWidget(e);

			console.log('Updated thought element.');
		},
		error: function() {
			console.log('Failed to save thought.');
		}
	});
}

// Get avatar for user of current Account
function getTags(e) {

	var frameId = $(e).find('.activity-widget .element').attr('data-frame');

	$.ajax({
		type: 'GET',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/tag?frameId=' + frameId,
		dataType: 'json',
		success: function(data) {
			// console.log('Received protected thoughts (success).');
			// console.log(data);

			$(e).find('.tags').html('');
			for (tag in data) {
				$(e).find('.tags').append('<span id="tag-' + data[tag].tag._id + '" style="display:inline-block;" contenteditable="false"><a href="javascript:getTimeline({ id: \'' + data[tag].timeline._id + '\' });">' + data[tag].tag.text + '</a></span> ');

				// NOTE: The following code doesn't work for some reason.  Not sure why.  The above is a hacky replacement for what the following was intended to accomplish.

				// var tagWidget = $('<span></span>');
				// tagWidget.appendTo( $(e).find('.tags') );

				// tagWidget.attr('id', 'tag-' + data[tag]._id);
				// var tagText = data[tag].text + ' ';
				// tagWidget.text(tagText);

				// $('#tag-' + data[tag]._id).off('click');
				// $('#tag-' + data[tag]._id + '').click(function() { getTimeline({ frameId: data[tag]._id }); });
			}

			//$(e).find('.tags').text();

			//var avatarUri = localStorage['host'] + data.uri;

			//$('#avatar-container').css('background-image', 'url(' + avatarUri + ')');

			// $('#narrative-list').html('');
			// $('#narrative-list').attr('data-timeline', data._id);
			// $('#narrative-list').attr('data-moment', data.moment);

			// Set previous timeline (if any)
			// if (previousTimeline) {
			// 	$('#narrative-list').attr('data-previous-timeline', previousTimeline);
			// }

			// Add Moments to Timeline
			// for (moment in data.moments) {
			// 	addTimelineWidget(data.moments[moment]);
			// }
		}
	});
}

function saveTags(e) {
	console.log('saveTags');

	var activityType = $(e).attr('data-activity-type');
	// TODO: Make sure actiivtyType is valid (compare with retreived types from API?)

	console.log('Saving tags for activityType: ' + activityType);

	var widget  = e.find('.activity-widget');
	var element = e.find('.activity-widget .element');
	var tags    = e.find('.activity-widget .tags');

	// Get textual tags (i.e., the "raw" tag text, e.g., "mytag" in "#mytag")
	// var rawTagText = e.find('.tags').text();
	// rawTagText = rawTagText.replace(/#,/, '');
	//rawTagText = rawTagText.replace(/^[A-Z0-9]/, '');
	// rawTagText = rawTagText.toLowerCase();
	// console.log(rawTagText);
	// var tagText = rawTagText.split(/\s/);
	var tagText = e.find('.tags').text().replace(/#,/, '').toLowerCase().trim().split(/\s+/);
	var tagTextCount = tagText.length;
	console.log(tagTextCount);

	var uniqueTags = [];
	$.each(tagText, function(i, el) {
		if($.inArray(el, uniqueTags) === -1) uniqueTags.push(el);
	});

	// Save each tag
	var uniqueTagCount = uniqueTags.length;
	console.log('unique: ' + uniqueTagCount);

	for (var i = 0; i < uniqueTagCount; i++) {

		// Construct JSON object for element to save
		var dataJSON = {
			//"timeline": $("#narrative-list").attr("data-timeline"),
			"frame": element.attr("data-frame"),
			"frameType": e.attr("data-activity-type"),
			"text": uniqueTags[i]
		};

		//if(element.attr("data-frame")) dataJSON.frame = element.attr("data-frame");
		//if(element.attr("data-id")) dataJSON.reference = element.attr("data-id"); // Set the element to the reference, since it was edited.

		console.log("Saving Tag for ThoughtFrame (JSON): ");
		console.log(dataJSON);

		// POST the JSON object 
		$.ajax({
			type: 'POST',
			beforeSend: function(request) {
				request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
			},
			url: localStorage['host'] + '/api/' + activityType + '/tag',
			dataType: 'json',
			contentType: 'application/json; charset=utf-8',
			data: JSON.stringify(dataJSON),
			processData: false,
			success: function(data) {
				console.log('Saved Tags: ');
				console.log(data);

				// Set element container (e.g., Thought). Only gets set once.
				//$(e).find('.tags')
				//.attr('id', 'frame-' + data.frame._id); // e.data('id', data._id);

				// TODO: Only update necessary tags
				getTags(e);

				console.log('Updated Tags.');
			},
			error: function() {
				console.log('Failed to save Tags.');
			}
		});
	}
}

//
// Topics
//

function saveTopic(e) {
	console.log('saveTopic');

	var widget  = e.find('.activity-widget');
	var element = e.find('.activity-widget .element');
	var text    = e.find('.element .text');

	// Construct JSON object for element to save
	var dataJSON = {
		"timeline": $("#narrative-list").attr("data-timeline"),
		"text": e.text()
	};

	if(element.attr("data-frame")) dataJSON.frame = element.attr("data-frame");
	if(element.attr("data-id")) dataJSON.reference = element.attr("data-id"); // Set the element to the reference, since it was edited.

	console.log("Saving Topic (JSON): ");
	console.log(dataJSON);
	// POST the JSON object

	$.ajax({
		type: 'POST',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/topic',
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		data: JSON.stringify(dataJSON),
		processData: false,
		success: function(data) {
			console.log('Saved Topic: ');
			console.log(data);

			// Set element container (e.g., Topic). Only gets set once.
			$(e).attr('id', 'frame-' + data.frame._id); // e.data('id', data._id);
			addTimelineWidget(e);

			console.log('Updated Topic.');
		},
		error: function() {
			console.log('Failed to save Topic.');
		}
	});
}

function toggleWidget(e) {
	console.log('toggleWidget');

	var widget  = e.find('.activity-widget');
	var element = e.find('.activity-widget .element');
	var text    = e.find('.element .text');

	var activityType = e.attr('data-activity-type');

	// Construct JSON object for element to save
	var dataJSON = {
		"timeline": $("#narrative-list").attr("data-timeline"),
		"frame": element.attr("data-frame"),
		//"visible": false
	};

	// Check if the FrameWidget is hidden
	if (e.hasClass('hidden')) {
		dataJSON['visible'] = true;
	} else {
		dataJSON['visible'] = false;
	}

	//if(element.attr("data-frame")) dataJSON.frame = element.attr("data-frame");
	//if(element.attr("data-id")) dataJSON.reference = element.attr("data-id"); // Set the element to the reference, since it was edited.

	console.log("Toggling Widget (JSON): ");
	console.log(dataJSON);
	// POST the JSON object

	$.ajax({
		type: 'PUT',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/topic',
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		data: JSON.stringify(dataJSON),
		processData: false,
		success: function(data) {
			console.log('Updated Widget: ');
			console.log(data);

			if (data.visible) {
				e.removeClass('hidden');
				e.fadeIn();
				$(e).find('.hide').attr('src', './img/cross-gray.png');
				$(e).find('.hide').off('click');
				$(e).find('.hide').click(function() { toggleWidget(e); });
			} else {
				e.addClass('hidden');
				e.fadeOut();
				$(e).find('.hide').attr('src', './img/plus-red.png');
				$(e).find('.hide').off('click');
				$(e).find('.hide').click(function() { toggleWidget(e); });
			}

			console.log('Updated Widget element.');
		},
		error: function() {
			console.log('Failed to PUT Widget.');
		}
	});
}




//
// ScienceKit PhoneGap API
//

function openChildBrowser() {
	//var uri = localStorage['host'] + "/dialog/authorize?client_id=client123&client_secret=ssh-secret&response_type=code&redirect_uri=/oauth/exchange";
	var uri = localStorage['host'] + "/dialog/authorize?client_id=" + localStorage['client_id'] + "&client_secret=" + localStorage['client_secret'] + "&response_type=code&redirect_uri=/oauth/exchange";

	console.log('Opening ChildBrowser at ' + uri);

	// Callback for "close" event
	window.plugins.childBrowser.onClose = function () {
		console.log("childBrowser has closed");

		// Open timeline page
		//$(location).attr('href', './timeline.html');

		exchangeGrantForAccessToken({
			'client_id': localStorage['client_id'],
			'client_secret': localStorage['client_secret'],
			'code': localStorage['code'],
			'grant_type': 'authorization_code',
			'redirect_uri': '/'
		});
	};

	// Callback for "locationChange" event
	window.plugins.childBrowser.onLocationChange = function (url) {
		console.log("childBrowser has loaded " + url);

		if(url.indexOf("code=") !== -1) {

			var from = url.indexOf("code=") + 5;
			var to = url.indexOf("&", from);
			var code = null;
			if (to !== -1) {
				code = url.substring(from, to);
				localStorage['code'] = code;
			} else {
				code = url.substring(from);
				localStorage['code'] = code;
			}

			// Store code retreived from child browser
			console.log("code = " + localStorage['code']);
			window.plugins.childBrowser.close();
		}

	};

	// Show web page
	window.plugins.childBrowser.showWebPage(uri, {
		showLocationBar: true
	});
}




//
// ScienceKit RESTful API
//

// TODO: Move all the API stuff down here :-)