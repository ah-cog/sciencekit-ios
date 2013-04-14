// socket.io
// Real-time event-driven sockets, client-side code.

// Socket connection for data streaming
var socketio = null;

$(function() {
	//localStorage['host'] = 'http://129.2.101.49:3000'; // June's server
	localStorage['host'] = 'http://10.109.90.128:3000';
	localStorage['client_id'] = 'abc123';
	localStorage['client_secret'] = 'ssh-secret';

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

		socketio.on('message', function(message) {
			$('#incomingChatMessages').append($('<li></li>').text(message));
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

		socketio.on('disconnect', function() {
			$('#incomingChatMessages').append('<li>Disconnected</li>');
		});
	});

	// Define interaction event listeners

	// Set up event listener
	$('#outgoingChatMessage').keypress(function(event) {
		if(event.which == 13) {
			event.preventDefault();

			// var oauthAccessToken = $('#token_response').text(); // Get access token
			var oauthAccessToken = localStorage['token'];
			var messageText = $('#outgoingChatMessage').val();
			var message = JSON.stringify({ 'token': oauthAccessToken, 'message': messageText });

			console.log('Sending message: ' + message);
			socketio.send(message);
			$('#incomingChatMessages').append($('<li></li>').text($('#outgoingChatMessage').val()));
			$('#outgoingChatMessage').val('');
		}
	});
});




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
}

// Called when a photo is successfully retrieved
//
function onAvatarURISuccess(imageURI) {
    // Uncomment to view the image file URI
    console.log("Took photo: " + imageURI);

    // Upload the photo
    uploadAvatar(imageURI);
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
		element = lastTouchedPhotoWidget.find('.element-widget .element');

		// Construct JSON object for element to save
		dataJSON = {
			"timeline": $("#narrative-list").attr("data-timeline")
		};

		if (element.attr("data-element")) dataJSON.element   = element.attr("data-element");
		if (element.attr("data-id"))      dataJSON.reference = element.attr("data-id"); // Set the element to the reference, since it was edited.

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
	alert("YEP");
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
		element = lastTouchedVideoWidget.find('.element-widget .element');

		// Construct JSON object for element to save
		dataJSON = {
			"timeline": $("#narrative-list").attr("data-timeline")
		};

		if (element.attr("data-element")) dataJSON.element   = element.attr("data-element");
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

	// Set up PhoneGap event listeners
	document.addEventListener("deviceready", onDeviceReady, false);



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

var UUID = 0;
function getUUID() {
	return UUID++;
}

function getPhotos() {
	console.log('Requesting protected timeline resources.');
	$.ajax({
		type: 'GET',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/photo',
		dataType: 'json',
		success: function(data) {
			console.log('Received protected thoughts (success).');
			console.log(data);
			// var user = jQuery.parseJSON(data);
			// $('#resource_response').text(data);
			for(photo in data) {
				// Add photo to timeline
				//alert(data[photo].uri);
				addPhoto(data[photo]);
			}

			// Scroll to element
			// x = 0;  //horizontal coord
			// y = document.height; //vertical coord
			// window.scroll(x,y);
			//window.setTimeout($('html,body').animate({ scrollTop: $('#sciencekit-small-logo').offset().top }, 'slow'), 1500);
		},
		error: function() {
			console.log('Failed to retreive protected resource.');
		}
	});
}

function getTimeline(options) {
	console.log('Requesting protected timeline resources.');

	var requestUri = localStorage['host'] + '/api/timeline';

	if (typeof options !== "undefined") {
		if (options.hasOwnProperty('id')) {
			requestUri = requestUri + '?id=' + options['id'];
		} else if (options.hasOwnProperty('moment_id')) {
			requestUri = requestUri + '?moment_id=' + options['moment_id'];
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
			$('#narrative-list').attr('data-timeline', data[0].timeline);
			for(element in data) {

				// Add thought to timeline
				addTimelineWidget(data[element]);
			}
		},
		error: function() {
			console.log('Failed to retreive protected resource.');
		}
	});
}

// function getThoughts() {
// 	console.log('Requesting protected timeline resources.');
// 	$.ajax({
// 		type: 'GET',
// 		beforeSend: function(request) {
// 			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
// 		},
// 		url: localStorage['host'] + '/api/thought',
// 		dataType: 'json',
// 		success: function(data) {
// 			console.log('Received protected thoughts (success).');
// 			console.log(data);
// 			// var user = jQuery.parseJSON(data);
// 			// $('#resource_response').text(data);
// 			for(thought in data) {
// 				// Add thought to timeline
// 				addThought(data[thought]);
// 			}

// 			// Scroll to element
// 			// x = 0;  //horizontal coord
// 			// y = document.height; //vertical coord
// 			// window.scroll(x,y);
// 			//$('html,body').animate({ scrollTop: $('#sciencekit-small-logo').offset().top }, 'slow');
// 		},
// 		error: function() {
// 			console.log('Failed to retreive protected resource.');
// 		}
// 	});
// }

function addThoughtWidget(moment) {

	if(moment && moment.element && moment.element._id) {

		var thoughtFrame        = moment.element;
		var thought = thoughtFrame.latest; // TODO: Update this based on current view for user

		// Only continue if Thought element is valid
		if (!thought) return;

		var e;
		var div;

		if ($("#thought-frame-" + thoughtFrame._id).length != 0) {
			// Element exists, so update it
			console.log("Found existing thought widget. Updating widget.");

			e = $('#thought-frame-' + thoughtFrame._id); // <li> element
			div = e.find('.element .text');

		} else {

			// Widget does not exist for element does not exist, so create it
			console.log("Could not find existing widget for thought. Creating new thought widget.");

			// Clone template structure and remove 'id' element to avoid 'id' conflict
			e = $('#narrative-element-template').clone().attr('id', 'new-element');
			e.removeAttr('id'); // Remove 'id' attribute
			div = e.find('.element .text');
		}

		// Update 'li' for element
		e.attr('id', 'thought-frame-' + thoughtFrame._id);
		e.attr('data-id', thoughtFrame._id);
		e.attr('data-timeline', thoughtFrame.timeline);

		// Update element
		var div2 = e.find('.element-widget .element');
		div2.attr('id', 'thought-' + thought._id);
		div2.attr('data-id', thought._id);
		div2.attr('data-element', thought.frame);
		div2.attr('data-reference', thought.reference);
		div.attr('contenteditable', 'true');
		div.html(thought.text);

		if ($("#thought-frame-" + thoughtFrame._id).length != 0) {
		} else {

			e.appendTo('#narrative-list');
			e.find('.element .text').blur(function() { saveThought(e); });
			console.log("ADDING HANDLERS");
			e.find('.element .options .timeline').click(function() { getTimeline({ moment_id: moment._id }); });
			e.show(); // Show element
		}

	} else {

		console.log("Creating new thought widget.");

		// Clone template structure and remove 'id' element to avoid 'id' conflict
		e = $('#narrative-element-template').clone().attr('id', 'new-element');
		e.removeAttr('id'); // Remove 'id' attribute
		e.appendTo('#narrative-list');
		e.find('.element .text').blur(function() { saveThought(e) });
		// e.find('.element .options .timeline').click(function() { getTimeline({ moment_id: moment._id }); });
		e.show(); // Show element
	}
}

function addTopicWidget(moment) {

	if(moment && moment.element && moment.element._id) {

		var topicFrame        = moment.element;
		var topic = topicFrame.last; // TODO: Update this based on current view for user

		// Only continue if Thought element is valid
		if (!topic) return;

		var e;
		var div;

		if ($("#topic-frame-" + topicFrame._id).length != 0) {
			// Element exists, so update it
			console.log("Found existing topic widget. Updating widget.");

			e = $('#topic-frame-' + topicFrame._id); // <li> element
			div = e.find('.element .text');

		} else {

			// Widget does not exist for element does not exist, so create it
			console.log("Could not find existing widget for topic. Creating new topic widget.");

			// Clone template structure and remove 'id' element to avoid 'id' conflict
			e = $('#topic-activity-template').clone().attr('id', 'new-element');
			e.removeAttr('id'); // Remove 'id' attribute
			div = e.find('.element .text');
		}

		// Update 'li' for element
		e.attr('id', 'topic-frame-' + topicFrame._id);
		e.attr('data-id', topicFrame._id);
		e.attr('data-timeline', topicFrame.timeline);

		// Update element
		var div2 = e.find('.element-widget .element');
		div2.attr('id', 'topic-' + topic._id);
		div2.attr('data-id', topic._id);
		div2.attr('data-element', topic.frame);
		div2.attr('data-reference', topic.reference);
		div.attr('contenteditable', 'true');
		div.html(topic.text);

		if ($("#topic-frame-" + topicFrame._id).length != 0) {
		} else {

			e.appendTo('#narrative-list');
			e.find('.element .text').blur(function() { saveTopic(e); });
			console.log("ADDING HANDLERS");
			e.find('.element .options .timeline').click(function() { getTimeline({ moment_id: moment._id }); });
			e.show(); // Show element
		}

	} else {

		console.log("Creating new topic widget.");

		// Clone template structure and remove 'id' element to avoid 'id' conflict
		e = $('#topic-activity-template').clone().attr('id', 'new-element');
		e.removeAttr('id'); // Remove 'id' attribute
		e.appendTo('#narrative-list');
		e.find('.element .text').blur(function() { saveTopic(e) });
		// e.find('.element .options .timeline').click(function() { getTimeline({ moment_id: moment._id }); });
		e.show(); // Show element
	}
}

function addTimelineWidget(moment) {

	// Add thought to timeline
	if(moment.elementType === 'ThoughtFrame') {
		addThoughtWidget(moment);

	} else if(moment.elementType === 'TopicFrame') {
		addTopicWidget(moment);

	} else if(moment.elementType === 'PhotoFrame') {
		addPhotoWidget(moment);

	} else if(moment.elementType === 'VideoFrame') {
		addVideoWidget(moment);
	}
}

function addPhotoWidget(moment) {
	console.log("addPhotoWidget");

	console.log(moment);

	if(moment && moment.element && moment.element._id) {

		var frame    = moment.element;
		var activity = frame.latest; // TODO: Update this based on current view for user

		// Only continue if Thought element is valid
		if (!activity) return;

		var e;
		var div;

		if ($("#photo-frame-" + frame._id).length != 0) {
			// Element exists, so update it
			console.log("Found existing photo widget. Updating widget.");

			e = $('#photo-frame-' + frame._id); // <li> element
			//div = e.find('.element .text');

		} else {

			// Widget does not exist for element does not exist, so create it
			console.log("Could not find existing widget for photo. Creating new photo widget.");

			// Clone template structure and remove 'id' element to avoid 'id' conflict
			e = $('#photo-template').clone().attr('id', 'new-element');
			e.removeAttr('id'); // Remove 'id' attribute
			//div = e.find('.element .text');
		}

		// Update 'li' for element
		e.attr('id', 'photo-frame-' + frame._id);
		e.attr('data-id', frame._id);
		e.attr('data-timeline', frame.timeline);

		// Update element
		var div2 = e.find('.element-widget .element');
		div2.attr('id', 'photo-' + activity._id);
		div2.attr('data-id', activity._id);
		div2.attr('data-element', activity.frame);
		div2.attr('data-reference', activity.reference);
		// div.attr('contenteditable', 'true');
		// div.html(activity.text);

		// Set image
		var image = e.find('.element .image');
		image.attr('src', '' + localStorage['host'] + activity.uri + '');

		if ($("#photo-frame-" + frame._id).length != 0) {
		} else {

			e.appendTo('#narrative-list');
			e.find('.element .image').click(function() { changePhoto(e) });
			e.find('.element .options .timeline').click(function() { getTimeline({ moment_id: moment._id }); });
			e.show(); // Show element
		}

	} else {

		console.log("Creating new photo widget.");

		// Clone template structure and remove 'id' element to avoid 'id' conflict
		e = $('#photo-template').clone().attr('id', 'new-element');
		e.removeAttr('id'); // Remove 'id' attribute
		e.appendTo('#narrative-list');
		e.find('.element .image').click(function() { changePhoto(e) });
		e.show(); // Show element
	}
}

function addVideoWidget(moment) {
	console.log("addVideoWidget");

	console.log(moment);

	if(moment && moment.element && moment.element._id) {

		var frame    = moment.element;
		var activity = frame.last; // TODO: Update this based on current view for user

		// Only continue if Thought element is valid
		if (!activity) return;

		var e;
		var div;

		if ($("#video-frame-" + frame._id).length != 0) {
			// Element exists, so update it
			console.log("Found existing Video widget. Updating widget.");

			e = $('#video-frame-' + frame._id); // <li> element
			//div = e.find('.element .text');

		} else {

			// Widget does not exist for element does not exist, so create it
			console.log("Could not find existing widget for video. Creating new video widget.");

			// Clone template structure and remove 'id' element to avoid 'id' conflict
			e = $('#video-activity-template').clone().attr('id', 'new-element');
			e.removeAttr('id'); // Remove 'id' attribute
			//div = e.find('.element .text');
		}

		// Update 'li' for element
		e.attr('id', 'video-frame-' + frame._id);
		e.attr('data-id', frame._id);
		e.attr('data-timeline', frame.timeline);

		// Update element
		var div2 = e.find('.element-widget .element');
		div2.attr('id', 'video-' + activity._id);
		div2.attr('data-id', activity._id);
		div2.attr('data-element', activity.frame);
		div2.attr('data-reference', activity.reference);
		// div.attr('contenteditable', 'true');
		// div.html(activity.text);

		// Set video
		var video = e.find('.element .video .source');
		video.attr('src', '' + localStorage['host'] + activity.uri + '');

		if ($("#video-frame-" + frame._id).length != 0) {
		} else {

			e.appendTo('#narrative-list');
			//e.find('.element .video').click(function() { changeVideo(e) });
			e.find('.element .options .timeline').click(function() { getTimeline({ moment_id: moment._id }); });
			e.show(); // Show element
		}

	} else {

		console.log("Creating new video widget.");

		// Clone template structure and remove 'id' element to avoid 'id' conflict
		e = $('#video-activity-template').clone().attr('id', 'new-element');
		e.removeAttr('id'); // Remove 'id' attribute
		e.appendTo('#narrative-list');
		//e.find('.element .video').click(function() { changeVideo(e) });
		e.show(); // Show element
	}
}

function saveThought(e) {
	console.log('saveThought');

	var widget  = e.find('.element-widget');
	var element = e.find('.element-widget .element');
	var text    = e.find('.element .text');

	// Construct JSON object for element to save
	var dataJSON = {
		"timeline": $("#narrative-list").attr("data-timeline"),
		"text": e.text()
	};

	if(element.attr("data-element")) dataJSON.element = element.attr("data-element");
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
			console.log('Saved thought: ');
			console.log(data);

			// Set element container (e.g., Thought). Only gets set once.
			$(e).attr('id', 'thought-frame-' + data.element._id); // e.data('id', data._id);
			addTimelineWidget(e);
			
			console.log('Updated thought element.');
		},
		error: function() {
			console.log('Failed to save thought.');
		}
	});
}

function saveTopic(e) {
	console.log('saveTopic');

	var widget  = e.find('.element-widget');
	var element = e.find('.element-widget .element');
	var text    = e.find('.element .text');

	// Construct JSON object for element to save
	var dataJSON = {
		"timeline": $("#narrative-list").attr("data-timeline"),
		"text": e.text()
	};

	if(element.attr("data-element")) dataJSON.element = element.attr("data-element");
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
			$(e).attr('id', 'topic-frame-' + data.element._id); // e.data('id', data._id);
			addTimelineWidget(e);
			
			console.log('Updated Topic.');
		},
		error: function() {
			console.log('Failed to save Topic.');
		}
	});
}










function openChildBrowser() {
	//var uri = localStorage['host'] + "/dialog/authorize?client_id=client123&client_secret=ssh-secret&response_type=code&redirect_uri=/oauth/exchange";
	var uri = localStorage['host'] + "/dialog/authorize?client_id=" + localStorage['client_id'] + "&client_secret=" + localStorage['client_secret'] + "&response_type=code&redirect_uri=/oauth/exchange";

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