// (function($) {

//   /**
//    * Copyright 2012, Digital Fusion
//    * Licensed under the MIT license.
//    * http://teamdf.com/jquery-plugins/license/
//    *
//    * @author Sam Sehnert
//    * @desc A small plugin that checks whether elements are within
//    *     the user visible viewport of a web browser.
//    *     only accounts for vertical position, not horizontal.
//    */

//   $.fn.visible = function(partial) {
    
//       var $t            = $(this),
//           $w            = $(window),
//           viewTop       = $w.scrollTop(),
//           viewBottom    = viewTop + $w.height(),
//           _top          = $t.offset().top,
//           _bottom       = _top + $t.height(),
//           compareTop    = partial === true ? _bottom : _top,
//           compareBottom = partial === true ? _top : _bottom;
    
//     return ((compareBottom <= viewBottom) && (compareTop >= viewTop));

//   };
    
// })(jQuery);

// var win = $(window);
// var allMods = $(".activity-template");

// // Already visible modules
// allMods.each(function(i, el) {
//   var el = $(el);
//   if (el.visible(true)) {
//     // el.addClass("already-visible"); 
//   } 
// });

// win.scroll(function(event) {
  
//   allMods.each(function(i, el) {
//     var el = $(el);
//     if (el.visible(true)) {
//       // el.addClass("come-in"); 
//       $(el).find('.image').css('visibility', 'visible');
//     } 
//   });
  
// });

// $(window).scroll(function(event) {

// 	$(".activity-template").each(function(i, el) {
// 		var el = $(el);
// 		if (el.visible(true)) {
// 		// Show elements on screen
// 		// el.addClass("come-in"); 
// 		// console.log($(el).attr('id'));
// 			$(el).find('.image').css('visibility', 'visible');
// 			$(el).find('.video').css('visibility', 'visible');
// 		}
// 		// else {
// 		// 	$(el).find('.image').css('visibility', 'hidden');
// 		// 	$(el).find('.video').css('visibility', 'hidden');
// 		// }
// 		// else {
// 		// 	// Hide elements off screen
// 		// 	$(el).find('.image').css('display', 'block');
// 		// }
// 	});
  
// });

// socket.io
// Real-time event-driven sockets, client-side code.

// Socket connection for data streaming
var socketio = null;

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

		socketio.on('sketch', function(sketch) {
			console.log('Socket: Received Sketch');
			console.log(sketch);

			addTimelineWidget(sketch);
		});

		socketio.on('bump', function(bump) {
			console.log('Socket: Received Bump');
			console.log(bump);

			updateEntryView(bump.entry);
		});

		socketio.on('tag', function(tag) {
			console.log('Socket: Received Tag');
			console.log(tag);

			if ($("#frame-" + tag.entry).length != 0) {
				var e = $('#frame-' + tag.entry);
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






lastImageUri = null;

// Called when a photo is successfully retrieved
//
function onPhotoURISuccess(imageURI) {
    // Uncomment to view the image file URI
    console.log("Took photo: " + imageURI);
    lastImageUri = imageURI;

    $('#photo-tool-photo').attr('src', imageURI);

    openPhotoTool();
}

// Called if something bad happens.
//
function onPhotoFail(message) {
    console.log('Camera failed because: ' + message);
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

function savePhoto(photoURI) {

	var widget, element;
	var dataJSON;

	// Construct JSON object for element to save
	dataJSON = {
		"timeline": $("#narrative-list").attr("data-timeline")
	};

	console.log("Saving Photo (JSON): ");
	console.log(dataJSON);

	// Concept
	var conceptJSON = null;
	if (currentConceptTool === 'Question') {
		var questionText = $('#question-tool-text').val();

		conceptJSON = {
			"type": 'Question',
			"text": questionText
		};

	} else if (currentConceptTool === 'Observation') {
		var causeText = $('#observation-tool-cause').val();
		var effectText = $('#observation-tool-effect').val();

		conceptJSON = {
			"type": 'Observation',
			"cause": causeText, 
			"effect": effectText
		};
		
	} else if (currentConceptTool === 'Sequence') {
		var sequenceSteps = $('.sequence-tool-step');
		var sequenceStepText = [];
		$('.sequence-tool-step').each(function(i) {
			// console.log("step: " + $(this).val());
			if ($(this).is(":visible")) {
				sequenceStepText.push({ step: $(this).val() });
			}
		});

		conceptJSON = {
			"type": 'Sequence',
			"steps": sequenceStepText
		};

	}

	// Collaborators
	var collaboratorsJSON = null;
	var authors = [];
	$("input[name='collaborators']:checked").each(function() {
		authors.push({ author: $(this).val() });
	});
	if (authors.length > 0) {
		collaboratorsJSON = {};
		collaboratorsJSON.authors = authors;
	}

	// Feeling/Identity
	var identityJSON = null;
	if ($("input[name='identity-options']:checked").length > 0) {
		identityJSON = {
			"identity": $("input[name='identity-options']:checked").val()
		};
	}

    // Upload the image to server
    function success(response) {
        console.log("Photo uploaded successfully:");
        var data = jQuery.parseJSON(response.response);
        addPhotoWidget(data);

        // Save Concept
		if (conceptJSON !== null) {
			conceptJSON.parent = data._id;
			saveConceptTool(conceptJSON);
		}

		// Save Collaborators
		if (collaboratorsJSON !== null) {
			collaboratorsJSON.parent = data._id;
			saveCollaborationTool(collaboratorsJSON);
		}

		// Save Identity
		if (identityJSON !== null) {
			identityJSON.parent = data._id;
			saveIdentityTool(identityJSON);
		}
    }

    function fail(error) {
        console.log("Photo upload failed: " + error.code);
    }

    var options = new FileUploadOptions();
    options.fileKey = "myphoto"; // parameter name of file -- in POST data?
    options.fileName = photoURI.substr(photoURI.lastIndexOf('/') + 1); // name of file
    options.mimeType = "image/jpeg";

    // Set parameters for request
    if (dataJSON) {
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




lastVideo = null;

// Called when capture operation is finished
//
function captureSuccess(mediaFiles) {
	console.log("videoCaptureSuccess");

	// var i, len;
	// for (i = 0, len = mediaFiles.length; i < len; i += 1) {
	// 	uploadVideo(mediaFiles[i]);
	// }

	lastVideo = mediaFiles[0];

	console.log($('#video-tool').find('.video .source'));
	$('#video-tool').find('.video').attr('src', lastVideo.fullPath);
	// $('#video-tool').find('.video').attr('controls', "true");
	console.log($('#video-tool').find('.video .source').attr('src'));
	// video(class="video", width="320", height="240", controls)
	// source(class="source", src="")

	openVideoTool();
}

function captureError(error) {
	console.log("videoCaptureError");
	// var msg = 'An error occurred during capture: ' + error.code;
	// navigator.notification.alert(msg, null, 'Uh oh!');
}

// Video

function captureVideo2() {
	console.log("captureVideo");
    // Launch device video recording application 
    var options = {
    	limit: 1
    };
	navigator.device.capture.captureVideo(captureSuccess, captureError, options);
	console.log("captureVideo2");
}

function saveVideo(mediaFile) {
	console.log("saveVideo");
	console.log(mediaFile);

	var widget, element;
	var dataJSON;

	// Construct JSON object for element to save
	dataJSON = {
		"timeline": $("#narrative-list").attr("data-timeline")
	};

	console.log("Saving Video (JSON): ");
	console.log(dataJSON);




	// Concept
	var conceptJSON = null;
	if (currentConceptTool === 'Question') {
		var questionText = $('#question-tool-text').val();

		conceptJSON = {
			"type": 'Question',
			"text": questionText
		};

	} else if (currentConceptTool === 'Observation') {
		var causeText = $('#observation-tool-cause').val();
		var effectText = $('#observation-tool-effect').val();

		conceptJSON = {
			"type": 'Observation',
			"cause": causeText, 
			"effect": effectText
		};
		
	} else if (currentConceptTool === 'Sequence') {
		var sequenceSteps = $('.sequence-tool-step');
		var sequenceStepText = [];
		$('.sequence-tool-step').each(function(i) {
			console.log("step: " + $(this).val());
			if ($(this).is(":visible")) {
				sequenceStepText.push({ step: $(this).val() });
			}
		});

		conceptJSON = {
			"type": 'Sequence',
			"steps": sequenceStepText
		};

	}

	// Collaborators
	var collaboratorsJSON = null;
	var authors = [];
	$("input[name='collaborators']:checked").each(function() {
		authors.push({ author: $(this).val() });
	});
	if (authors.length > 0) {
		collaboratorsJSON = {};
		collaboratorsJSON.authors = authors;
	}

	// Feeling/Identity
	var identityJSON = null;
	if ($("input[name='identity-options']:checked").length > 0) {
		identityJSON = {
			"identity": $("input[name='identity-options']:checked").val()
		};
	}





    function success(result) {
        console.log("Video upload succeeded:");
        var data = jQuery.parseJSON(result.response);
        // addPhoto(photo);

        console.log('Upload success: ' + result.responseCode);
		console.log(result.bytesSent + ' bytes sent');



		// Save Concept
		if (conceptJSON) {
			conceptJSON.parent = data._id;
			saveConceptTool(conceptJSON);
		}

		// Save Collaborators
		if (collaboratorsJSON) {
			collaboratorsJSON.parent = data._id;
			saveCollaborationTool(collaboratorsJSON);
		}

		// Save Identity
		if (identityJSON) {
			identityJSON.parent = data._id;
			saveIdentityTool(identityJSON);
		}
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
    if (dataJSON) {
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

		// console.log(localStorage['code']);
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

	currentPerspective = 'Inquiry';
	currentTool = null;
	currentConceptTool = null;
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

accounts = [];
function getAccounts(options, fn) {
	console.log('getAccounts()');

	var requestUri = localStorage['host'] + '/api/account';

	if (typeof options !== "undefined") {
		// TODO: process options
	}

	$.ajax({
		type: 'GET',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: requestUri,
		dataType: 'json',
		success: function(data) {
			console.log('Received Accounts.');

			// Store Accounts in global array
			for (account in data) {
				accounts.push(data[account]);
			}

			fn(accounts);
		},
		error: function() {
			console.log('Failed to retreive Accounts.');
		}
	});
}

function getTimeline(options) {
	console.log('getTimeline()');

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
			// console.log('Received protected thoughts (success).');
			// console.log(data);

			$('#narrative-list').html('');
			$('#narrative-list').attr('data-timeline', data._id);
			$('#narrative-list').attr('data-moment', data.moment);

			// Add Moments to Timeline
			for (moment in data.moments) {
				addTimelineWidget(data.moments[moment]);
			}
		},
		error: function() {
			console.log('Failed to retreive protected resource.');
		}
	});
}

currentPerspective = 'Inquiry';
currentTool = null;
currentConceptTool = null;

//
// Perspectives
//

function openInquiryPerspective() {

	getTimeline();

	currentPerspective = 'Inquiry';

	$('#toolkit-list').fadeOut(function() {
		$('.activity-frame').show();
		$('#narrative-list').fadeIn();
	});

	$('#story-perspective-list').fadeOut();

	$('#toolkit-tool-options').fadeOut(function() {
		$('#toolkit-options').fadeIn(function() {
			$('#top').fadeIn();
			$('#bottom').fadeIn();
			$('#logo').fadeIn();
		});
	});

	// TODO: Only open Story Tool

	$('.activity-widget').closest('.activity-template').off('click');
	$('.activity-widget').closest('.activity-template').removeClass('activity-template-left');
	$('.activity-widget').closest('.activity-template').removeClass('activity-template-right');
	$('.note-section').hide();
}

function openStoryPerspectiveHack() {

	currentPerspective = 'Story';

	$('#logo').fadeOut();
	$('#top').fadeOut();
	$('#bottom').fadeOut();

	$('#story-title').hide();
	$('#story-structure-options').hide();

	$('#toolkit-list').fadeOut();

	// $('#narrative-list').fadeOut(function() {
		// $('#toolkit-tool-options').fadeIn();
		$('#story-grid-template-row').hide();
		// $('#story-grid').fadeIn();
		// $('#story-perspective-list').fadeIn();
	// });

	// $('#narrative-list').fadeOut(function() {
	// 	// $('#toolkit-tool-options').fadeIn();
	// 	$('#story-grid-template-row').hide();
	// 	$('#story-grid').fadeIn();
	// 	$('#story-perspective-list').fadeIn();
	// });

	
	
	$('#toolkit-tool-options').fadeOut();
	$('#toolkit-options').fadeOut();

	// TODO: Only open Story Tool
	getStoriesHack();
}

function getStoriesHack(options) {
	console.log('getStoriesHack()');

	//
	// Request resources for new timeline and update the timeline widget
	//

	var requestUri = localStorage['host'] + '/api/storyhack';

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
			// console.log('Received protected thoughts (success).');
			// console.log(data);

			$('#narrative-list').html('');
			$('#narrative-list').attr('data-timeline', data._id);
			$('#narrative-list').attr('data-moment', data.moment);

			// Add Moments to Timeline
			for (moment in data.moments) {
				addTimelineWidget(data.moments[moment]);
			}
		},
		error: function() {
			console.log('Failed to retreive protected resource.');
		}
	});
}

function openStoryPerspective() {

	currentPerspective = 'Story';

	$('#logo').fadeOut();
	$('#top').fadeOut();
	$('#bottom').fadeOut();

	$('#story-title').hide();
	$('#story-structure-options').hide();

	$('#toolkit-list').fadeOut();

	$('#narrative-list').fadeOut(function() {
		// $('#toolkit-tool-options').fadeIn();
		$('#story-grid-template-row').hide();
		$('#story-grid').fadeIn();
		$('#story-perspective-list').fadeIn();
	});

	
	
	$('#toolkit-tool-options').fadeOut();
	$('#toolkit-options').fadeOut();

	// TODO: Only open Story Tool
	getStories();
}

// TODO: Finish this...
function openStoryToolStructured(options) {

	if (typeof options !== "undefined") {
		if (options.hasOwnProperty('id')) {
			requestUri = requestUri + '?id=' + options['id'];
		} else if (options.hasOwnProperty('moment_id')) {
			requestUri = requestUri + '?moment_id=' + options['moment_id'];
		} else if (options.hasOwnProperty('frameId')) {
			requestUri = requestUri + '?frameId=' + options['frameId'];
		}
	} else {
		options = { 'readOnly': false };
	}

	currentTool = 'Story';

	$('#logo').fadeOut();
	$('#top').fadeOut();
	$('#bottom').fadeOut();

	$('#story-grid-template-row').hide();

	$('#story-grid').fadeOut(function() {
		$('#story-title').fadeIn(function () {
			$('#story-structure-options').fadeIn();
			$('#narrative-list').show();
		});
		// $('#toolkit-tool-options').fadeIn();
		// $('#story-grid-template-row').hide();
		// $('#story-perspective-list').show();
	});


	
	$('#toolkit-options').fadeOut(function() {
		if (options['readOnly'] !== true) {
			$('#toolkit-tool-options').fadeIn();
		}
	});

	// Set default chapter to first chapter
	setStoryChapter({ chapter: 'beginning' });

	// $('#narrative-list').show(function() {
	// 	$('.toolkit-tool').hide();
	// 	$('#media-toolkit').show();
	// 	$('#media-type-options').show();
	// 	$('#tool-extra-options').show();
	// 	$('.text-tool').show();
	// 	$('#toolkit-list').fadeIn();
	// });



	// $('#narrative-list').fadeOut(function() {
	// 	$('#toolkit-list').fadeIn();
	// });

	// Intialize by setting all entires to the right.  By default, entries are added to a new Story.
	if (options['readOnly'] !== true) {
		// Set entry text
		$('.note').text('');
		$('.note-section').hide();

		$('.activity-widget').closest('.activity-template').addClass('activity-template-right');

		// TODO: Only open Story Tool
		// getStories();

		// Set up click handler for entries (to include/exclude in the story)
		$('.activity-widget').closest('.activity-template').off('click');
		$('.activity-widget').closest('.activity-template').on('click', function() {

			// Move right
			if ($(this).hasClass('activity-template-left') && !($(this).hasClass('activity-template-right'))) {
				$(this).removeClass('activity-template-left');
				$(this).addClass('activity-template-right');

				// Remove from current chapter
				if (currentStoryChapter !== null) {
					$(this).removeClass(currentStoryChapter);
				}

				// $(this).find('.note-section').css('display', 'none');
				$(this).find('.note-section').hide();

			// Move left
			} else if (!($(this).hasClass('activity-template-left')) && $(this).hasClass('activity-template-right')) {
				$(this).removeClass('activity-template-right');
				$(this).addClass('activity-template-left');

				// Add to current chapter
				if (currentStoryChapter !== null) {
					$(this).addClass(currentStoryChapter);
				}

				// $(this).find('.note-section').css('display', 'table-row');
				$(this).find('.note-section').show();

			// Set default
			} else {
				$(this).removeClass('activity-template-left');
				$(this).removeClass('activity-template-right');
				$(this).addClass('activity-template-left');

				$(this).find('.note-section').hide();

				// $(this).find('.note-section').css('display', 'none');
			}

			// $('.activity-widget').removeClass('activity-widget-right');
			// $('.activity-widget').addClass('activity-widget-left');
		});
	}

	// if (options['readOnly'] === true) {
	// 	$('.activity-template-right').hide();
	// }
}

function openStoryTool(options) {

	if (typeof options !== "undefined") {
		if (options.hasOwnProperty('id')) {
			requestUri = requestUri + '?id=' + options['id'];
		} else if (options.hasOwnProperty('moment_id')) {
			requestUri = requestUri + '?moment_id=' + options['moment_id'];
		} else if (options.hasOwnProperty('frameId')) {
			requestUri = requestUri + '?frameId=' + options['frameId'];
		}
	} else {
		options = { 'readOnly': false };
	}

	currentTool = 'Story';

	$('#logo').fadeOut();
	$('#top').fadeOut();
	$('#bottom').fadeOut();

	$('#story-grid-template-row').hide();

	$('#story-grid').fadeOut(function() {
		$('#story-title').fadeIn(function() {
			$('#narrative-list').show();
		});
		// $('#toolkit-tool-options').fadeIn();
		// $('#story-grid-template-row').hide();
		// $('#story-perspective-list').show();
	});


	
	$('#toolkit-options').fadeOut(function() {
		if (options['readOnly'] !== true) {
			$('#toolkit-tool-options').fadeIn();
		}
	});

	// $('#narrative-list').show(function() {
	// 	$('.toolkit-tool').hide();
	// 	$('#media-toolkit').show();
	// 	$('#media-type-options').show();
	// 	$('#tool-extra-options').show();
	// 	$('.text-tool').show();
	// 	$('#toolkit-list').fadeIn();
	// });



	// $('#narrative-list').fadeOut(function() {
	// 	$('#toolkit-list').fadeIn();
	// });

	// Intialize by setting all entires to the right.  By default, entries are added to a new Story.
	if (options['readOnly'] !== true) {
		// Set entry text
		$('.note').text('');
		$('.note-section').hide();

		$('.activity-widget').closest('.activity-template').addClass('activity-template-right');

		// TODO: Only open Story Tool
		// getStories();

		// Set up click handler for entries (to include/exclude in the story)
		$('.activity-widget').closest('.activity-template').off('click');
		$('.activity-widget').closest('.activity-template').on('click', function() {

			// Move right
			if ($(this).hasClass('activity-template-left') && !($(this).hasClass('activity-template-right'))) {
				$(this).removeClass('activity-template-left');
				$(this).addClass('activity-template-right');

				// $(this).find('.note-section').css('display', 'none');
				$(this).find('.note-section').hide();

			// Move left
			} else if (!($(this).hasClass('activity-template-left')) && $(this).hasClass('activity-template-right')) {
				$(this).removeClass('activity-template-right');
				$(this).addClass('activity-template-left');

				// $(this).find('.note-section').css('display', 'table-row');
				$(this).find('.note-section').show();

			// Set default
			} else {
				$(this).removeClass('activity-template-left');
				$(this).removeClass('activity-template-right');
				$(this).addClass('activity-template-left');

				// $(this).find('.note-section').css('display', 'none');
			}

			// $('.activity-widget').removeClass('activity-widget-right');
			// $('.activity-widget').addClass('activity-widget-left');
		});
	}

	// if (options['readOnly'] === true) {
	// 	$('.activity-template-right').hide();
	// }
}




//
// Toolkit
//

function openTextTool() {

	currentTool = 'Text';
	currentConceptTool = null;

	$('#logo').fadeOut();
	$('#top').fadeOut();
	$('#bottom').fadeOut();
	
	$('#toolkit-options').fadeOut(function() {
		$('#toolkit-tool-options').fadeIn();
	});

	$('#narrative-list').fadeOut(function() {
		scrollToTop();
		$('.toolkit-tool').hide();
		$('#media-toolkit').show();
		$('#media-type-options').show();
		$('#media-type-options .media-type-options').show();
		$('#tool-extra-options').show();
		$('.text-tool').show();
		$('#toolkit-list').fadeIn();
	});

	// TODO: Only open Question Tool
}

function openPhotoTool() {

	currentTool = 'Photo';
	currentConceptTool = null;

	$('#logo').fadeOut();
	$('#top').fadeOut();
	$('#bottom').fadeOut();
	
	$('#toolkit-options').fadeOut(function() {
		$('#toolkit-tool-options').fadeIn();
	});

	$('#narrative-list').fadeOut(function() {
		scrollToTop();
		$('.toolkit-tool').hide();
		$('#media-toolkit').show();
		$('#media-type-options').show();
		$('#media-type-options .media-type-options').show();
		$('#tool-extra-options').show();
		$('.photo-tool').show();
		$('#toolkit-list').fadeIn();
	});

	// TODO: Only open Question Tool
}

function openVideoTool() {

	currentTool = 'Video';
	currentConceptTool = null;

	$('#logo').fadeOut();
	$('#top').fadeOut();
	$('#bottom').fadeOut();
	
	$('#toolkit-options').fadeOut(function() {
		$('#toolkit-tool-options').fadeIn();
	});

	$('#narrative-list').fadeOut(function() {
		scrollToTop();
		$('.toolkit-tool').hide();
		$('#media-toolkit').show();
		$('#media-type-options').show();
		$('#media-type-options .media-type-options').show();
		$('#tool-extra-options').show();
		$('.video-tool').show();
		$('#toolkit-list').fadeIn();
	});

	// TODO: Only open Question Tool
}

function openSketchTool2() {

	currentTool = 'Sketch';
	currentConceptTool = null;

	$('#logo').fadeOut();
	$('#top').fadeOut();
	$('#bottom').fadeOut();
	
	$('#toolkit-options').fadeOut(function() {
		$('#toolkit-tool-options').fadeIn();
	});

	$('#narrative-list').fadeOut(function() {
		scrollToTop();
		$('.toolkit-tool').hide();
		$('#media-toolkit').show();
		$('#media-type-options').show();
		$('#media-type-options .media-type-options').show();
		$('#tool-extra-options').show();
		$('.sketch-tool2').show();
		$('#toolkit-list').fadeIn();
	});

	// TODO: Only open Question Tool
}

function openQuestionTool() {

	currentConceptTool = 'Question';

	$('#logo').fadeOut();
	$('#top').fadeOut();
	$('#bottom').fadeOut();
	
	$('#toolkit-options').fadeOut(function() {
		$('#toolkit-tool-options').fadeIn();
	});

	// Reset form
	$('#question-tool-text').val('');

	$('#narrative-list').fadeOut(function() {
		$('.concept-tool').hide();
		$('#concept-toolkit').show();
		$('#toolkit-list').fadeIn();

		$('#media-type-options .media-type-options').fadeOut(function () {
			$('.question-tool').fadeIn();
		});
	});
}

function openObservationTool() {

	currentConceptTool = 'Observation';

	$('#logo').fadeOut();
	$('#top').fadeOut();
	$('#bottom').fadeOut();
	
	$('#toolkit-options').fadeOut(function() {
		$('#toolkit-tool-options').fadeIn();
	});

	// Reset form
	$('#observation-tool-effect').val('');
	$('#observation-tool-cause').val('');

	$('#narrative-list').fadeOut(function() {
		$('.concept-tool').hide();
		$('#concept-toolkit').show();
		$('#toolkit-list').fadeIn();
		$('#media-type-options .media-type-options').fadeOut(function () {
			$('.observation-tool').fadeIn();
		});
	});
}

function openSequenceTool() {

	currentConceptTool = 'Sequence';

	$('#logo').fadeOut();
	$('#top').fadeOut();
	$('#bottom').fadeOut();
	
	$('#toolkit-options').fadeOut(function() {
		$('#toolkit-tool-options').fadeIn();
	});

	// Reset form
	$('.sequence-tool-step').val('');
	$('.sequence-tool-step-dynamic').remove();

	$('#narrative-list').fadeOut(function() {
		$('.concept-tool').hide();

		$('#sequence-tool-template-label').hide();
		$('#sequence-tool-template-step').hide();

		$('#concept-toolkit').show();
		$('#toolkit-list').fadeIn();
		$('#media-type-options .media-type-options').fadeOut(function () {
			$('.sequence-tool').fadeIn();
		});
	});
}

function addSequenceStep() {
	console.log("addSequenceStep");
	// Clone template structure and remove 'id' element to avoid 'id' conflict
	// var sequenceStepLabel = $('#sequence-tool-template-label').clone();
	var sequenceStepStep = $('#sequence-tool-template-step').clone();
	// sequenceStep.addClass('activity-frame');
	// sequenceStepLabel.removeAttr('id'); // Remove 'id' attribute
	sequenceStepStep.removeAttr('id'); // Remove 'id' attribute
	sequenceStepStep.addClass('sequence-tool-step-dynamic');
	// sequenceStepLabel.show();
	// sequenceStepLabel.attr('display', 'table-row');
	sequenceStepStep.show();
	sequenceStepStep.css('display', 'table-row');
	// $('#sequence-tool-template-label').hide();
	// $('#sequence-tool-template-step').hide();
	// div = sequenceStep.find('.element .text');
	// $(sequenceStepLabel).insertBefore($('#sequence-tool').find('.sequence-tool-add-step'));
	$(sequenceStepStep).insertBefore($('#sequence-tool').find('.sequence-tool-add-step'));
	//$('#sequence-tool').append(sequenceStepLabel);
	//$('#sequence-tool').append(sequenceStepStep);
}

// Get avatar for user of current Account
function getStories(options) {

	console.log('getStories');

	if (typeof options !== "undefined") {
		if (options.hasOwnProperty('id')) {
			requestUri = requestUri + '?id=' + options['id'];
		} else if (options.hasOwnProperty('moment_id')) {
			requestUri = requestUri + '?moment_id=' + options['moment_id'];
		} else if (options.hasOwnProperty('frameId')) {
			requestUri = requestUri + '?frameId=' + options['frameId'];
		}
	} else {
		options = {};
	}

	options['timeline'] = $("#narrative-list").attr("data-timeline");
	console.log(options['timeline']);


	// var entryId = $(e).find('.activity-widget .element').attr('data-entry');

	// if (entryId === undefined) {
	// 	return;
	// }

	$.ajax({
		type: 'GET',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/story?timelineId=' + options['timeline'],
		dataType: 'json',
		success: function(data) {
			console.log('Received Story for Timeline.');
			console.log(data);

			// Create the story grid

			var currentRow = -1;
			var currentColumn = 0;
			for(var i = 0; i < data.length; i++) {
				//console.log('Story: ' + data[story].title);

				// Create a new row
				if (currentRow === -1 || i % 3 === 0) {
					currentRow++;

					console.log("addSequenceStep");
					// Clone template structure and remove 'id' element to avoid 'id' conflict
					var storyGridRow = $('#story-grid-template-row').clone();
					// sequenceStep.addClass('activity-frame');
					$(storyGridRow).removeAttr('id'); // Remove 'id' attribute
					$(storyGridRow).css('display', 'table-row');

					var leftStory = storyGridRow.find('.story-cover-left');
					$(leftStory).attr('id', 'story-' + currentRow + '-0');
					$(leftStory).css('opacity', '0');

					var middleStory = storyGridRow.find('.story-cover-middle');
					$(middleStory).attr('id', 'story-' + currentRow + '-1');
					$(middleStory).css('opacity', '0');

					var rightStory = storyGridRow.find('.story-cover-right');
					$(rightStory).attr('id', 'story-' + currentRow + '-2');
					$(rightStory).css('opacity', '0');

					$('#story-grid-table').append(storyGridRow);
					$(storyGridRow).show();

					// TODO: Clone table row template and update IDs of covers
				}

				currentColumn = i % 3;

				var storyCell = $('#story-' + currentRow + '-' + currentColumn);
				$(storyCell).html('<strong><em>' + data[i].title + '</em></strong><br />by ' + data[i].author.username);
				$(storyCell).css('opacity', '1');
				$(storyCell).attr('data-id', data[i]._id);
				var id = data[i]._id;
				$(storyCell).click(function() {
					console.log('openStory ' + $(this).attr('data-id'));
					getStory({ id: $(this).attr('data-id'), readOnly: true });
					openStoryTool({ readOnly: true });
				});

				// TODO: Populate the covers and show them once they're ready
				console.log('story: ' + currentRow + ', ' + currentColumn);

			}
		}
	});
}

function getStory(options) {

	console.log('getStory');

	if (typeof options !== "undefined") {
		if (options.hasOwnProperty('id')) {
			// requestUri = requestUri + '?id=' + options['id'];
		} else if (options.hasOwnProperty('moment_id')) {
			// requestUri = requestUri + '?moment_id=' + options['moment_id'];
		} else if (options.hasOwnProperty('frameId')) {
			// requestUri = requestUri + '?frameId=' + options['frameId'];
		}
	} else {
		options = {
			readOnly: false
		};
	}

	options['timeline'] = $("#narrative-list").attr("data-timeline");
	console.log(options['timeline']);


	// var entryId = $(e).find('.activity-widget .element').attr('data-entry');

	// if (entryId === undefined) {
	// 	return;
	// }

	$.ajax({
		type: 'GET',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/story?timelineId=' + options['timeline'],
		dataType: 'json',
		success: function(data) {
			console.log('Received Story for Timeline.');
			console.log(data);

			// Create the story grid

			var currentRow = -1;
			var currentColumn = 0;
			for(var i = 0; i < data.length; i++) {

				// Find current Story
				if (data[i]._id === options['id']) {
					currentStory = data[i];
					break;
				}

			}


			// Hide all Entries
			if (options['readOnly'] === true) {
				// $('.activity-template').hide();
				$('.activity-frame').hide();
			} else {
				// $('.activity-template').show();
				$('.activity-frame').show();
			}

			// Show all Entries in the current Story

			var story = currentStory;

			for (pageIndex in story.pages) {
				var page = story.pages[pageIndex];
				var entry = page.entry;

				$('#story-tool-title').val(story.title);

				// Check if Entry exists in Inquiry, and if so, denote it as part of the Story.
				var entryWidget = $('#frame-' + entry._id);

				// Set entry text
				$('.note').text('');
				// getNote(entryWidget);
				getNote({ pageId: page._id });
				$(entryWidget).find('.note-section').show();

				$(entryWidget).show();

				// Reset widget
				if ($(entryWidget).hasClass('activity-template-right'))
					$(entryWidget).removeClass('activity-template-right');
				if ($(entryWidget).hasClass('activity-template-left'))
					$(entryWidget).removeClass('activity-template-left');
				$(entryWidget).off('click');

				if (options['readOnly'] !== true) {
					$(entryWidget).addClass('activity-template-left');
				}
				// console.log(entryWidget);
			}

			// $(e).find('.tags').html('');
			// for (tag in data) {
			// 	$(e).find('.tags').append('<span id="tag-' + data[tag]._id + '" style="display:inline-block;" contenteditable="false"><a href="javascript:getTimeline({});">' + data[tag].text + '</a></span> ');
			// }
		}
	});
}

currentStoryChapter = null;
function setStoryChapter(options) {

	if (typeof options !== "undefined") {
		if (!options.hasOwnProperty('chapter')) {
			options['chapter'] = "beginning";
		}
	}

	// "beginning"
	// "exploration"
	// "reflection"

	currentStoryChapter = options['chapter'];


}

function saveTool() {
	// TODO: Check which tool is currently open, save work, reset form.

	console.log("saveTool");
	console.log("currentPerspective = " + currentPerspective);
	console.log("currentTool = " + currentTool);

	if (currentPerspective === 'Inquiry') {

		// TODO: Get currentTool and save accordingly
		// TODO: Clear form after save

		if (currentTool === 'Text') {
			e = $('#text-tool');
			saveText(e);

		} else if (currentTool === 'Photo') {

			// Upload the photo
    		savePhoto(lastImageUri);

		} else if (currentTool === 'Video') {

			saveVideo(lastVideo);
			
		} else if (currentTool === 'Sketch') {
			
			saveSketchTool();
		}



	} else if (currentPerspective === 'Story') {

		if (currentTool === 'Story') {
			e = $('#story-tool');
			// saveText(e);

			var story = {
				title: '',
				entries: []
			};

			story.title = e.find('#story-tool-title').val();

			$('.activity-template-left').closest('.activity-template').each(function(i) {

				var entryType = $(this).attr("data-activity-type");
				var entryId = $(this).attr("data-id");
				var entryNote = $(this).find(".note").text();

				console.log(entryId + ' ' + entryType);

				story.entries.push({ type: entryType, entry: entryId, note: entryNote });
				// TODO: Create StoryEntry

			});

			var storyJSON = JSON.stringify(story);
			console.log(storyJSON);

			// var uniqueTags = [];
			// $.each(tagText, function(i, el) {
			// 	if($.inArray(el, uniqueTags) === -1) uniqueTags.push(el);
			// });



			// POST the JSON object

			$.ajax({
				type: 'POST',
				beforeSend: function(request) {
					request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
				},
				url: localStorage['host'] + '/api/story',
				dataType: 'json',
				contentType: 'application/json; charset=utf-8',
				data: storyJSON,
				processData: false,
				success: function(data) {
					console.log('Saved Story: ');
					console.log(data);

					// Set element container (e.g., Thought). Only gets set once.
					// $(e).attr('id', 'frame-' + data.frame._id); // e.data('id', data._id);
					// addTimelineWidget(data);
					//addSketchWidget();

					console.log('Saved Story.');
				},
				error: function() {
					console.log('Failed to save Story.');
				}
			});

		}
	}

	closeTool();
}

function cancelTool() {
	// TODO: Check which tool is currently open, save work, reset form.

	closeTool();
}

function closeTool() {

	openInquiryPerspective();

	$('#toolkit-list').fadeOut(function() {
		$('#narrative-list').fadeIn();
	});

	$('#toolkit-tool-options').fadeOut(function() {
		$('#toolkit-options').fadeIn(function() {
			$('#top').fadeIn();
			$('#bottom').fadeIn();
			$('#logo').fadeIn();
		});
	});
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

var lastSketch = null;
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

	lastSketch = base64ImageData;
	lastSketchWidth = imageWidth;
	lastSketchHeight = imageHeight;

	$('#sketch-tool2').find('.image').attr('src', $(oImgPNG).attr('src'));

	openSketchTool2();
}

function saveSketchTool() {
	console.log('saveSketchTool');
	// var widget  = e.find('.activity-widget');
	// var element = e.find('.activity-widget .element');
	// var text    = e.find('.element .text');

	// Construct JSON object for element to save
	var dataJSON = {
		//"timeline": $("#narrative-list").attr("data-timeline"),
		"imageData": $('#sketch-tool2').find('.image').attr('src'),
		"imageWidth": lastSketchWidth,
		"imageHeight": lastSketchHeight
	};

	// Concept
	var conceptJSON = null;
	if (currentConceptTool === 'Question') {
		var questionText = $('#question-tool-text').val();

		conceptJSON = {
			"type": 'Question',
			"text": questionText
		};

	} else if (currentConceptTool === 'Observation') {
		var causeText = $('#observation-tool-cause').val();
		var effectText = $('#observation-tool-effect').val();

		conceptJSON = {
			"type": 'Observation',
			"cause": causeText, 
			"effect": effectText
		};
		
	} else if (currentConceptTool === 'Sequence') {
		var sequenceSteps = $('.sequence-tool-step');
		var sequenceStepText = [];
		$('.sequence-tool-step').each(function(i) {
			console.log("step: " + $(this).val());
			if ($(this).is(":visible")) {
				sequenceStepText.push({ step: $(this).val() });
			}
		});

		conceptJSON = {
			"type": 'Sequence',
			"steps": sequenceStepText
		};

	}

	// Collaborators
	var collaboratorsJSON = null;
	var authors = [];
	$("input[name='collaborators']:checked").each(function() {
		authors.push({ author: $(this).val() });
	});
	if (authors.length > 0) {
		collaboratorsJSON = {};
		collaboratorsJSON.authors = authors;
	}

	// Feeling/Identity
	var identityJSON = null;
	if ($("input[name='identity-options']:checked").length > 0) {
		identityJSON = {
			"identity": $("input[name='identity-options']:checked").val()
		};
	}

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

			// Set element container (e.g., Thought). Only gets set once.
			// $(e).attr('id', 'frame-' + data._id); // e.data('id', data._id);
			// addTimelineWidget(e);

			// Save Concept
			if (conceptJSON) {
				conceptJSON.parent = data._id;
				saveConceptTool(conceptJSON);
			}

			// Save Collaborators
			if (collaboratorsJSON) {
				collaboratorsJSON.parent = data._id;
				saveCollaborationTool(collaboratorsJSON);
			}

			// Save Identity
			if (identityJSON) {
				identityJSON.parent = data._id;
				saveIdentityTool(identityJSON);
			}

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

function addTextWidget(entry) {

	var type = 'text';

	//
	// Make sure that the Moment has a sound structure.
	//

	if(entry && entry.entry && entry.entry._id) {

		var text = entry.entry; // TODO: Update this based on current view for user

		// Only continue if entry is valid
		if (!text) return;

		var e;
		var div;

		//
		// Check if a widget for the Activity already exists. If so, store a reference 
		// to it.  If not, create the widget and store a reference to it.
		//

		if ($("#frame-" + entry._id).length != 0) {
			// Element exists, so update it
			console.log("Found existing text widget. Updating widget.");

			e = $('#frame-' + entry._id); // <li> element
			div = e.find('.element .text');

		} else {

			// Widget does not exist for element does not exist, so create it
			// console.log("Could not find existing widget for text. Creating new text widget.");

			// Clone template structure and remove 'id' element to avoid 'id' conflict
			e = $('#text-activity-template').clone().attr('id', 'volatile-activity');
			e.addClass('activity-frame');
			e.removeAttr('id'); // Remove 'id' attribute
			div = e.find('.element .text');
		}

		//
		// Update widget based on whether it is the timeline's "parent" Moment
		//

		if (entry._id === $('#narrative-list').attr('data-entry')) {
			e.find('.timeline-branch').hide();
		}

		// Update 'li' for element
		e.attr('id', 'frame-' + entry._id);
		e.attr('data-id', entry._id);
		e.attr('data-timeline', entry.timeline);

		// Update element
		var div2 = e.find('.activity-widget .element');
		div2.attr('id', 'text-' + text._id);
		div2.attr('data-id', text._id);
		div2.attr('data-entry', entry._id);
		//div2.attr('data-reference', text.reference);
		div2.attr('data-text', text.text);
		div.attr('contenteditable', 'false');
		// div.html(text.text);

		//
		// Add Question, Observation, or Sequence
		//
		var authorEntryAction = 'wrote something';
		if (entry.hasOwnProperty('questions')) {
			var question = entry.questions[0];
			e.find('.entry-margin-icon-img').attr('src', './img/question.png');
			e.find('.observation').hide();
			e.find('.sequence').hide();
			e.find('.question').show();
			authorEntryAction = 'asked a question';
			div.html(question.question);

		} else if (entry.hasOwnProperty('observations')) {
			var observation = entry.observations[0];
			e.find('.entry-margin-icon-img').attr('src', './img/observation.png');
			e.find('.question').hide();
			e.find('.sequence').hide();
			e.find('.observation').show();
			authorEntryAction = 'noticed something';
			e.find('.effect').html(observation.cause);
			e.find('.cause').html(observation.effect);

		} else if (entry.hasOwnProperty('sequences')) {
			var sequence = entry.sequences[0];
			e.find('.entry-margin-icon-img').attr('src', './img/sequence.png');
			var sequenceString = '';
			var index = 1;

			e.find('.sequence-step').remove();
			e.find('.sequence-step-divider').remove();

			for (step2 in sequence.steps) {
				sequenceString += '<strong>' + index + ' </strong>' + sequence.steps[step2].step + '<br />';

				var step = e.find('.sequence-step-template').clone();
				var stepDivider = e.find('.sequence-step-divider-template').clone();

				step.removeClass('sequence-step-template');
				step.addClass('sequence-step');
				stepDivider.removeClass('sequence-step-divider-template');
				stepDivider.addClass('sequence-step-divider');

				// Make sure the new elements are set to display:table-row to render properly
				$(step).css('display', 'table-row');
				$(stepDivider).css('display', 'table-row');

				// e.removeAttr('id'); // Remove 'id' attribute
				// e.prependTo('#narrative-list');
				// e.find('.element-table').append(step);
				e.find('.sequence-section').append(step);
				e.find('.sequence-section').append(stepDivider);
				// e.find('.element-table').append(stepDivider);
				// $(step).insertBefore(e.find('.sequence-step-template'));

				$(step).find('.step').html('<strong>' + index + '.</strong> ' + sequence.steps[step2].step);

				index++;
			}
			e.find('.question').hide();
			e.find('.observation').hide();
			e.find('.sequence').show();

			e.find('.sequence-step-template').hide();
			e.find('.sequence-step-divider-template').hide();

			authorEntryAction = 'did a step by step activity';
		}

		// Update Account that authored the contribution
		//if (text.author && text.username) {
			e.find('.account').html('<strong>' + entry.author.username + '</strong> ' + authorEntryAction);
			if (entry.hasOwnProperty('collaborations')) {
				var authors = entry.collaborations[0].authors;

				if (authors.length > 0) {
					e.find('.account').html('<strong>' + entry.author.username + '</strong>'  + ' ' + authorEntryAction + ' with ' + authors.length + ' others');
				}
			}

			//
			// Date
			//
			if (entry.hasOwnProperty('date')) {
				var currentHtml = e.find('.account').html();
				var entryDate = new Date(entry.date);
				var formattedDate = entryDate.toString("MMMM d, yyyy");
				var formattedTime = entryDate.toString("h:mm tt");
				e.find('.account').html(currentHtml + '<br /> on ' + formattedDate + ' at ' + formattedTime);
			}
		//}

		// Update bumps
		if (entry.hasOwnProperty('bumps')) {
			e.find('.bump-count').text(entry.bumps.length);
		}

		// Hide notes section
		e.find('.note-section').hide();

		// Update options for widget
		var options = e.find('.activity-widget .element .options');

		if ($("#frame-" + entry._id).length === 0) {

			//
			// Set up widget event handlers
			//

			// Add to list of entry widgets
			e.prependTo('#narrative-list');

			// Set up tags section event handlers
			e.find('.tags').off('click');
			e.find('.tags').click(function(event) { event.stopPropagation(); });
			e.find('.tags').off('blur');
			e.find('.tags').blur(function() { saveTags(e); });

			// Set up bump section event handlers
			e.find('.bump').click(function() { bumpEntry(e); });

			// Set up note section event handlers
			e.find('.note').off('click');
			e.find('.note').click(function(event) { event.stopPropagation(); });
			// e.find('.note').off('blur');
			// e.find('.note').blur(function() { saveNote(e); });
		
			// Show entry widget
			e.show();

			// Request Tags from server
			getTags(e);

			// Request Note from server
			// getNote(e);
		}

	} else {

		//
		// Widget does not exist for the Activity.  Create new Widget.
		//

		console.log("Creating new Widget for Text.");

		// Clone template structure and remove 'id' element to avoid 'id' conflict
		e = $('#text-activity-template').clone().attr('id', 'volatile-activity');
		e.addClass('activity-frame');
		e.removeAttr('id'); // Remove 'id' attribute
		e.prependTo('#narrative-list');

		// Show the Widget
		e.show();
	}
}

//
// Timeline
//

function addTimelineWidget(entry) {

	console.log(entry.entryType);

	// Add entry to inquiry
	if(entry.entryType === 'Text') {
		addTextWidget(entry);
	} else if(entry.entryType === 'Photo') {
		addPhotoWidget(entry);
	} else if(entry.entryType === 'Video') {
		addVideoWidget(entry);
	} else if(entry.entryType === 'Sketch') {
		addSketchWidget(entry);

	}
}

// TODO: Update this to accept options parameter, not just an id
function updateEntryView(id) {
	console.log('updateEntryView');

	// console.log("Saving Question (JSON): ");
	// console.log(jsonData);
	// POST the JSON object

	$.ajax({
		type: 'GET',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/entry/' + id,
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		// data: JSON.stringify(jsonData),
		processData: false,
		success: function(data) {
			console.log('Saved Question: ');
			console.log(data);

			// Set element container (e.g., Thought). Only gets set once.
			// $(e).attr('id', 'frame-' + data.frame._id); // e.data('id', data._id);
			addTimelineWidget(data);
		},
		error: function() {
			console.log('Failed to save Question.');
		}
	});
}

//
// Photos
//

function addPhotoWidget(entry) {
	console.log("addPhotoWidget");

	if(entry && entry.entry && entry.entry._id) {

		var photo = entry.entry; // TODO: Update this based on current view for user

		// Only continue if Thought frame is valid
		if (!photo) return;

		var e;
		var div;

		if ($("#frame-" + entry._id).length != 0) {
			// Frame exists, so update it
			console.log("Found existing photo widget. Updating widget.");

			e = $('#frame-' + entry._id); // <li> element

		} else {

			// Widget does not exist for element does not exist, so create it
			// console.log("Could not find existing widget for photo. Creating new photo widget.");

			// Clone template structure and remove 'id' element to avoid 'id' conflict
			e = $('#photo-template').clone().attr('id', 'volatile-activity');
			e.addClass('activity-frame');
			e.removeAttr('id'); // Remove 'id' attribute
			//div = e.find('.element .text');
		}

		// Update 'li' for element
		e.attr('id', 'frame-' + entry._id);
		e.attr('data-id', entry._id);
		e.attr('data-timeline', entry.timeline);

		// Update element
		var div2 = e.find('.activity-widget .element');
		div2.attr('id', 'photo-' + photo._id);
		div2.attr('data-id', photo._id);
		div2.attr('data-entry', entry._id);
		// div2.attr('data-reference', photo.reference);
		// div.attr('contenteditable', 'true');
		// div.html(activity.text);

		// Update Account that authored the contribution
		var authorEntryAction = 'snapped a photo';
		// Update Account that authored the contribution
		//if (text.author && text.username) {
			e.find('.account').html('<strong>' + entry.author.username + '</strong> ' + authorEntryAction);
			if (entry.hasOwnProperty('collaborations')) {
				var authors = entry.collaborations[0].authors;

				if (authors.length > 0) {
					e.find('.account').html('<strong>' + entry.author.username + '</strong>'  + ' ' + authorEntryAction + ' with ' + authors.length + ' others');
				}
			}

			//
			// Date
			//
			if (entry.hasOwnProperty('date')) {
				var currentHtml = e.find('.account').html();
				var entryDate = new Date(entry.date);
				var formattedDate = entryDate.toString("MMMM d, yyyy");
				var formattedTime = entryDate.toString("h:mm tt");
				e.find('.account').html(currentHtml + '<br /> on ' + formattedDate + ' at ' + formattedTime);
			}
		//}

		// Update bumps
		if (entry.hasOwnProperty('bumps')) {
			e.find('.bump-count').text(entry.bumps.length);
		}

		// Hide notes section
		e.find('.note-section').hide();

		//
		// Question, Observation, Sequence
		//
		e.find('.question-section').hide();
		e.find('.observation-section').hide();
		e.find('.sequence-section-template').hide();
		e.find('.sequence-section-divider-template').hide();
		if (entry.hasOwnProperty('questions')) {
			e.find('.question-section').show();
			e.find('.question-section').find('.question').html(entry.questions[0].question);
		} else if (entry.hasOwnProperty('observations')) {
			e.find('.observation-section').show();
			e.find('.observation-effect').html(entry.observations[0].effect);
			e.find('.observation-cause').html(entry.observations[0].cause);
		} else if (entry.hasOwnProperty('sequences')) {
			e.find('.sequence-section').show();
			e.find('.sequence-section').attr('display', 'table-row');
			e.find('.sequence-section').find('.sequence').html('sequence!!!!!');

			// Remove any existing sequences
			e.find('.sequence-section').remove();
			e.find('.sequence-section-divider').remove();

			var sequence = entry.sequences[0];
			var index = 1;
			e.find('.sequence-section').remove();
			e.find('.sequence-section-divider').remove();
			for (step2 in sequence.steps) {

				var step = e.find('.sequence-section-template').clone();
				var stepDivider = e.find('.sequence-section-divider-template').clone();

				step.removeClass('sequence-section-template');
				step.addClass('sequence-section');
				stepDivider.removeClass('sequence-section-divider-template');
				stepDivider.addClass('sequence-section-divider');

				if (index > 1) {
					step.find('.step').css('background-image', 'none');
				}

				step.find('.step').html('<strong>' + index + '.</strong> ' + sequence.steps[step2].step);

				// Make sure the new elements are set to display:table-row to render properly
				$(step).css('display', 'table-row');
				$(stepDivider).css('display', 'table-row');

				// e.removeAttr('id'); // Remove 'id' attribute
				// e.prependTo('#narrative-list');
				// e.find('.element-table').append(step);
				$(step).insertBefore(e.find('.sequence-section-divider-template'));
				if (index < sequence.steps.length) {
					$(stepDivider).insertBefore(e.find('.sequence-section-divider-template'));
				}
				// e.find('.sequence-section').append(step);
				// e.find('.sequence-section').append(stepDivider);

				index++;

			}
		}

		// Add Tags
		e.find('.tags').off('blur');
		e.find('.tags').blur(function() { saveTags(e); });

		// e.find('.note').off('blur');
		// e.find('.note').blur(function() { saveNote(e); });

		// Set image
		var image = e.find('.element .image');
		image.attr('src', '' + localStorage['host'] + photo.uri + '');

		if ($("#frame-" + entry._id).length === 0) {

			//
			// Set up widget event handlers
			//

			// Add to list of entry widgets
			e.prependTo('#narrative-list');

			// Set up tags section event handlers
			e.find('.tags').off('click');
			e.find('.tags').click(function(event) { event.stopPropagation(); });
			e.find('.tags').off('blur');
			e.find('.tags').blur(function() { saveTags(e); });

			// Set up bump section event handlers
			e.find('.bump').click(function() { bumpEntry(e); });

			// Set up note section event handlers
			e.find('.note').off('click');
			e.find('.note').click(function(event) { event.stopPropagation(); });
			// e.find('.note').off('blur');
			// e.find('.note').blur(function() { saveNote(e); });
		
			// Show entry widget
			e.show();

			// Request Tags from server
			getTags(e);

			// Request Note from server
			// getNote(e);
		}

	} else {

		console.log("Creating new photo widget.");

		// Clone template structure and remove 'id' element to avoid 'id' conflict
		e = $('#photo-template').clone().attr('id', 'volatile-activity');
		e.addClass('activity-frame');
		e.removeAttr('id'); // Remove 'id' attribute
		e.prependTo('#narrative-list');
		e.show(); // Show element
	}
}

//
// Videos
//

function addVideoWidget(entry) {
	console.log("addVideoWidget");

	if(entry && entry.entry && entry.entry._id) {

		var video = entry.entry; // TODO: Update this based on current view for user

		var e;
		var div;

		if ($("#frame-" + entry._id).length != 0) {
			// Element exists, so update it
			console.log("Found existing Video widget. Updating widget.");

			e = $('#frame-' + entry._id); // <li> element

		} else {

			// Widget does not exist for element does not exist, so create it
			// console.log("Could not find existing widget for video. Creating new video widget.");

			// Clone template structure and remove 'id' element to avoid 'id' conflict
			e = $('#video-activity-template').clone().attr('id', 'volatile-activity');
			e.addClass('activity-frame');
			e.removeAttr('id'); // Remove 'id' attribute
			//div = e.find('.element .text');
		}

		// Update 'li' for element
		e.attr('id', 'frame-' + entry._id);
		e.attr('data-id', entry._id);
		e.attr('data-timeline', entry.timeline);

		// Update element
		var div2 = e.find('.activity-widget .element');
		div2.attr('id', 'video-' + video._id);
		div2.attr('data-id', video._id);
		div2.attr('data-entry', entry._id);
		// div2.attr('data-reference', video.reference);
		// div.attr('contenteditable', 'true');
		// div.html(activity.text);

		var authorEntryAction = 'shot a video';
		// Update Account that authored the contribution
		//if (text.author && text.username) {
			e.find('.account').html('<strong>' + entry.author.username + '</strong> ' + authorEntryAction);
			if (entry.hasOwnProperty('collaborations')) {
				var authors = entry.collaborations[0].authors;

				if (authors.length > 0) {
					e.find('.account').html('<strong>' + entry.author.username + '</strong>'  + ' ' + authorEntryAction + ' with ' + authors.length + ' others');
				}
			}

			//
			// Date
			//
			if (entry.hasOwnProperty('date')) {
				var currentHtml = e.find('.account').html();
				var entryDate = new Date(entry.date);
				var formattedDate = entryDate.toString("MMMM d, yyyy");
				var formattedTime = entryDate.toString("h:mm tt");
				e.find('.account').html(currentHtml + '<br /> on ' + formattedDate + ' at ' + formattedTime);
			}
		//}

		// Update bumps
		if (entry.hasOwnProperty('bumps')) {
			e.find('.bump-count').text(entry.bumps.length);
		}

		// Hide notes section
		e.find('.note-section').hide();

		// Set video
		// var videoElement = e.find('.element .video');
		// videoElement.attr('src', '' + localStorage['host'] + video.uri + '');

		// Hide video element
		var videoElement = e.find('.element .video');
		videoElement.hide();

		// Show preview, but make it clickable. Once clicked, show the real video.
		// var videoFilenameStart = video.uri.indexOf('/uploads/') + 9;
		// var videoFilenameEnd = video.uri.indexOf('.');
		// var videoFilename = video.uri.substring(videoFilenameStart, videoFilenameEnd);
		var videoThumbnailUri = video.uri.replace('/uploads/', '/thumbnails/').replace('.MOV', '.jpg');
		//e.find('.element .videoThumbnail').attr('src', videoThumbnailFilename);
		//console.log(e.find('.element .videoThumbnail'));
		var videoThumbnail = e.find('.videoThumbnail');

		e.find('.thumbnailContainer').click(function () {
			var videoElement = e.find('.element .video');
			videoElement.show();
			videoElement.attr('src', '' + localStorage['host'] + video.uri + '');
			videoElement[0].play();
			e.find('.thumbnailContainer').hide();
		});

		videoThumbnail.attr('src', '' + localStorage['host'] + videoThumbnailUri + '');

		// alert(videoThumbnailFilename);

		//
		// Question, Observation, Sequence
		//
		e.find('.question-section').hide();
		e.find('.observation-section').hide();
		e.find('.sequence-section-template').hide();
		e.find('.sequence-section-divider-template').hide();
		if (entry.hasOwnProperty('questions')) {
			e.find('.question-section').show();
			e.find('.question-section').find('.question').html(entry.questions[0].question);
		} else if (entry.hasOwnProperty('observations')) {
			e.find('.observation-section').show();
			e.find('.observation-effect').html(entry.observations[0].effect);
			e.find('.observation-cause').html(entry.observations[0].cause);
		} else if (entry.hasOwnProperty('sequences')) {
			e.find('.sequence-section').show();
			e.find('.sequence-section').attr('display', 'table-row');
			e.find('.sequence-section').find('.sequence').html('sequence!!!!!');

			var sequence = entry.sequences[0];
			var index = 1;
			e.find('.sequence-section').remove();
			e.find('.sequence-section-divider').remove();
			for (step2 in sequence.steps) {

				var step = e.find('.sequence-section-template').clone();
				var stepDivider = e.find('.sequence-section-divider-template').clone();

				step.removeClass('sequence-section-template');
				step.addClass('sequence-section');
				stepDivider.removeClass('sequence-section-divider-template');
				stepDivider.addClass('sequence-section-divider');

				if (index > 1) {
					step.find('.step').css('background-image', 'none');
				}

				step.find('.step').html('<strong>' + index + '.</strong> ' + sequence.steps[step2].step);

				// Make sure the new elements are set to display:table-row to render properly
				$(step).css('display', 'table-row');
				$(stepDivider).css('display', 'table-row');

				// e.removeAttr('id'); // Remove 'id' attribute
				// e.prependTo('#narrative-list');
				// e.find('.element-table').append(step);
				$(step).insertBefore(e.find('.sequence-section-divider-template'));
				if (index < sequence.steps.length) {
					$(stepDivider).insertBefore(e.find('.sequence-section-divider-template'));
				}
				// e.find('.sequence-section').append(step);
				// e.find('.sequence-section').append(stepDivider);

				index++;

			}
		}

		if ($("#frame-" + entry._id).length === 0) {

			//
			// Set up widget event handlers
			//

			// Add to list of entry widgets
			e.prependTo('#narrative-list');

			// Set up tags section event handlers
			e.find('.tags').off('click');
			e.find('.tags').click(function(event) { event.stopPropagation(); });
			e.find('.tags').off('blur');
			e.find('.tags').blur(function() { saveTags(e); });

			// Set up bump section event handlers
			e.find('.bump').click(function() { bumpEntry(e); });

			// Set up note section event handlers
			e.find('.note').off('click');
			e.find('.note').click(function(event) { event.stopPropagation(); });
			// e.find('.note').off('blur');
			// e.find('.note').blur(function() { saveNote(e); });
		
			// Show entry widget
			e.show();

			// Request Tags from server
			getTags(e);

			// Request Note from server
			// getNote(e);
		}

	} else {

		console.log("Creating new video widget.");

		// Clone template structure and remove 'id' element to avoid 'id' conflict
		e = $('#video-activity-template').clone().attr('id', 'volatile-activity');
		e.addClass('activity-frame');
		e.removeAttr('id'); // Remove 'id' attribute
		e.prependTo('#narrative-list');
		e.show(); // Show element
	}
}

//
// Sketch
//

function addSketchWidget(entry) {
	console.log("addSketchWidget");

	if(entry && entry.entry && entry.entry._id) {

		var sketch = entry.entry; // TODO: Update this based on current view for user

		// Only continue if Thought frame is valid
		if (!sketch) return;

		var e;
		var div;

		if ($("#frame-" + entry._id).length != 0) {
			// Frame exists, so update it
			console.log("Found existing sketch widget. Updating widget.");

			e = $('#frame-' + entry._id); // <li> element
			//div = e.find('.element .text');

		} else {

			// Widget does not exist for element does not exist, so create it
			// console.log("Could not find existing widget for sketch. Creating new sketch widget.");

			// Clone template structure and remove 'id' element to avoid 'id' conflict
			e = $('#sketch-activity-template').clone().attr('id', 'volatile-activity');
			e.addClass('activity-frame');
			e.removeAttr('id'); // Remove 'id' attribute
		}

		// Update 'li' for element
		e.attr('id', 'frame-' + entry._id);
		e.attr('data-id', entry._id);
		e.attr('data-timeline', entry.timeline);

		// Update element
		var div2 = e.find('.activity-widget .element');
		div2.attr('id', 'sketch-' + sketch._id);
		div2.attr('data-id', sketch._id);
		div2.attr('data-entry', entry._id);
		div2.attr('data-reference', sketch.reference);
		// div.attr('contenteditable', 'true');
		// div.html(activity.text);

		// Update Account that authored the contribution
		var authorEntryAction = 'make a sketch';
		// Update Account that authored the contribution
		//if (text.author && text.username) {
			e.find('.account').html('<strong>' + entry.author.username + '</strong> ' + authorEntryAction);
			if (entry.hasOwnProperty('collaborations')) {
				var authors = entry.collaborations[0].authors;

				if (authors.length > 0) {
					e.find('.account').html('<strong>' + entry.author.username + '</strong>'  + ' ' + authorEntryAction + ' with ' + authors.length + ' others');
				}
			}

			//
			// Date
			//
			if (entry.hasOwnProperty('date')) {
				var currentHtml = e.find('.account').html();
				var entryDate = new Date(entry.date);
				var formattedDate = entryDate.toString("MMMM d, yyyy");
				var formattedTime = entryDate.toString("h:mm tt");
				e.find('.account').html(currentHtml + '<br /> on ' + formattedDate + ' at ' + formattedTime);
			}
		//}

		// Update bumps
		if (entry.hasOwnProperty('bumps')) {
			e.find('.bump-count').text(entry.bumps.length);
		}

		// Hide notes section
		e.find('.note-section').hide();

		//
		// Question, Observation, Sequence
		//
		e.find('.question-section').hide();
		e.find('.observation-section').hide();
		e.find('.sequence-section-template').hide();
		e.find('.sequence-section-divider-template').hide();
		if (entry.hasOwnProperty('questions')) {
			e.find('.question-section').show();
			e.find('.question-section').find('.question').html(entry.questions[0].question);
		} else if (entry.hasOwnProperty('observations')) {
			e.find('.observation-section').show();
			e.find('.observation-effect').html(entry.observations[0].effect);
			e.find('.observation-cause').html(entry.observations[0].cause);
		} else if (entry.hasOwnProperty('sequences')) {
			e.find('.sequence-section').show();
			e.find('.sequence-section').attr('display', 'table-row');
			e.find('.sequence-section').find('.sequence').html('sequence!!!!!');

			var sequence = entry.sequences[0];
			var index = 1;
			// Remove any existing sequence steps
			e.find('.sequence-section').remove();
			e.find('.sequence-section-divider').remove();
			// Add new sequence steps
			for (step2 in sequence.steps) {

				var step = e.find('.sequence-section-template').clone();
				var stepDivider = e.find('.sequence-section-divider-template').clone();

				step.removeClass('sequence-section-template');
				step.addClass('sequence-section');
				stepDivider.removeClass('sequence-section-divider-template');
				stepDivider.addClass('sequence-section-divider');

				if (index > 1) {
					step.find('.step').css('background-image', 'none');
				}

				step.find('.step').html('<strong>' + index + '.</strong> ' + sequence.steps[step2].step);

				// Make sure the new elements are set to display:table-row to render properly
				$(step).css('display', 'table-row');
				$(stepDivider).css('display', 'table-row');

				// e.removeAttr('id'); // Remove 'id' attribute
				// e.prependTo('#narrative-list');
				// e.find('.element-table').append(step);
				$(step).insertBefore(e.find('.sequence-section-divider-template'));
				if (index < sequence.steps.length) {
					$(stepDivider).insertBefore(e.find('.sequence-section-divider-template'));
				}
				// e.find('.sequence-section').append(step);
				// e.find('.sequence-section').append(stepDivider);

				index++;

			}
		}

		// Set image
		var image = e.find('.element .image');
		image.attr('src', sketch.imageData);

		if ($("#frame-" + entry._id).length === 0) {

			//
			// Set up widget event handlers
			//

			// Add to list of entry widgets
			e.prependTo('#narrative-list');

			// Set up tags section event handlers
			e.find('.tags').off('click');
			e.find('.tags').click(function(event) { event.stopPropagation(); });
			e.find('.tags').off('blur');
			e.find('.tags').blur(function() { saveTags(e); });

			// Set up bump section event handlers
			e.find('.bump').click(function() { bumpEntry(e); });

			// Set up note section event handlers
			e.find('.note').off('click');
			e.find('.note').click(function(event) { event.stopPropagation(); });
			// e.find('.note').off('blur');
			// e.find('.note').blur(function() { saveNote(e); });
		
			// Show entry widget
			e.show();

			// Request Tags from server
			getTags(e);

			// Request Note from server
			// getNote(e);
		}

		// Update the Widget (updates that can only happen after displaying the widget)
		if (sketch.hasOwnProperty('imageWidth') && sketch.hasOwnProperty('imageHeight')) {
			var ratio = sketch.imageWidth / sketch.imageHeight;
			// var adjustedImageWidth = $(image).parent().width();
			var adjustedImageWidth = 570;
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
		e.prependTo('#narrative-list');
		//e.find('.element .image').click(function() { changeSketch(e) });
		e.show(); // Show element
	}
}

//
// Text
//

function saveText(e) {
	console.log('saveText');

	// var widget  = e.find('.activity-widget');
	var element = e.find('.element');
	// var text    = e.find('.element .text');

	// Construct JSON object for element to save
	var dataJSON = {
		"timeline": $("#narrative-list").attr("data-timeline"),
		// "text": e.find('#text-tool-text').val()
	};

	// Concept
	var conceptJSON = null;
	if (currentConceptTool === 'Question') {
		var questionText = $('#question-tool-text').val();

		conceptJSON = {
			"type": 'Question',
			"text": questionText
		};

	} else if (currentConceptTool === 'Observation') {
		var causeText = $('#observation-tool-cause').val();
		var effectText = $('#observation-tool-effect').val();

		conceptJSON = {
			"type": 'Observation',
			"cause": causeText, 
			"effect": effectText
		};
		
	} else if (currentConceptTool === 'Sequence') {
		var sequenceSteps = $('.sequence-tool-step');
		var sequenceStepText = [];
		$('.sequence-tool-step').each(function(i) {
			console.log("step: " + $(this).val());
			if ($(this).is(":visible")) {
				sequenceStepText.push({ step: $(this).val() });
			}
		});

		conceptJSON = {
			"type": 'Sequence',
			"steps": sequenceStepText
		};

	}

	// Collaborators
	var collaboratorsJSON = null;
	var authors = [];
	$("input[name='collaborators']:checked").each(function() {
		authors.push({ author: $(this).val() });
	});
	if (authors.length > 0) {
		collaboratorsJSON = {};
		collaboratorsJSON.authors = authors;
	}

	// Feeling/Identity
	var identityJSON = null;
	if ($("input[name='identity-options']:checked").length > 0) {
		identityJSON = {
			"identity": $("input[name='identity-options']:checked").val()
		};
	}

	// if(element.attr("data-frame")) dataJSON.frame = element.attr("data-frame");
	// if(element.attr("data-id")) dataJSON.reference = element.attr("data-id"); // Set the element to the reference, since it was edited.

	console.log("Saving Text: ");
	console.log(dataJSON);
	// POST the JSON object

	$.ajax({
		type: 'POST',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/text',
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		data: JSON.stringify(dataJSON),
		processData: false,
		success: function(data) {
			console.log('Saved Text: ');
			console.log(data);

			// Set element container (e.g., Thought). Only gets set once.
			// $(e).attr('id', 'frame-' + data._id); // e.data('id', data._id);
			addTimelineWidget(data);

			// Save Concept
			if (conceptJSON) {
				conceptJSON.parent = data._id;
				saveConceptTool(conceptJSON);
			}

			// Save Collaborators
			if (collaboratorsJSON) {
				collaboratorsJSON.parent = data._id;
				saveCollaborationTool(collaboratorsJSON);
			}

			// Save Identity
			if (identityJSON) {
				identityJSON.parent = data._id;
				saveIdentityTool(identityJSON);
			}
		},
		error: function() {
			console.log('Failed to save Text.');
		}
	});
}

function saveConceptTool(jsonData, callback) {
	// jsonData.type
	console.log('saveConceptTool');

	if (jsonData.type === 'Question') {
		saveQuestion(jsonData);
	} else if (jsonData.type === 'Observation') {
		saveObservation(jsonData);
	} else if (jsonData.type === 'Sequence') {
		saveSequence(jsonData);
	}
}

function saveQuestion(jsonData) {
	console.log('saveQuestion');

	console.log("Saving Question (JSON): ");
	console.log(jsonData);
	// POST the JSON object

	$.ajax({
		type: 'POST',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/question',
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		data: JSON.stringify(jsonData),
		processData: false,
		success: function(data) {
			console.log('Saved Question: ');
			console.log(data);

			// Set element container (e.g., Thought). Only gets set once.
			// $(e).attr('id', 'frame-' + data.frame._id); // e.data('id', data._id);
			// addTimelineWidget(data);
			updateEntryView(data.entry.parent);
		},
		error: function() {
			console.log('Failed to save Question.');
		}
	});
}

function saveObservation(jsonData) {
	console.log('saveObservation');

	console.log("Saving Observation (JSON): ");
	console.log(jsonData);
	// POST the JSON object

	$.ajax({
		type: 'POST',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/observation',
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		data: JSON.stringify(jsonData),
		processData: false,
		success: function(data) {
			console.log('Saved Observation: ');
			console.log(data);

			updateEntryView(data.entry.parent);

			// Set element container (e.g., Thought). Only gets set once.
			// $(e).attr('id', 'frame-' + data.frame._id); // e.data('id', data._id);
			// addTimelineWidget(e);
		},
		error: function() {
			console.log('Failed to save Observation.');
		}
	});
}

function saveSequence(jsonData) {
	console.log('saveSequence');

	console.log("Saving Sequence (JSON): ");
	console.log(jsonData);
	// POST the JSON object

	$.ajax({
		type: 'POST',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/sequence',
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		data: JSON.stringify(jsonData),
		processData: false,
		success: function(data) {
			console.log('Saved Sequence: ');
			console.log(data);

			// Set element container (e.g., Thought). Only gets set once.
			// $(e).attr('id', 'frame-' + data.frame._id); // e.data('id', data._id);
			// addTimelineWidget(e);
			updateEntryView(data.entry.parent);
		},
		error: function() {
			console.log('Failed to save Sequence.');
		}
	});
}

function saveCollaborationTool(jsonData, callback) {
	// jsonData.accounts[0].id
	console.log('saveCollaborationTool');

	saveCollaboration(jsonData);
}

function saveCollaboration(jsonData) {
	console.log('saveCollaboration');

	console.log("Saving Collaboration (JSON): ");
	console.log(jsonData);
	// POST the JSON object

	$.ajax({
		type: 'POST',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/collaboration',
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		data: JSON.stringify(jsonData),
		processData: false,
		success: function(data) {
			console.log('Saved Collaboration: ');
			console.log(data);

			// Set element container (e.g., Thought). Only gets set once.
			// $(e).attr('id', 'frame-' + data.frame._id); // e.data('id', data._id);
			// addTimelineWidget(e);
		},
		error: function() {
			console.log('Failed to save Collaboration.');
		}
	});
}

function saveIdentityTool(jsonData, callback) {
	// jsonData.identity
	console.log('saveIdentityTool');

	saveIdentity(jsonData);
}

function saveIdentity(jsonData) {
	console.log('saveIdentity');

	console.log("Saving Identity (JSON): ");
	console.log(jsonData);
	// POST the JSON object

	$.ajax({
		type: 'POST',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/identity',
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		data: JSON.stringify(jsonData),
		processData: false,
		success: function(data) {
			console.log('Saved Identity: ');
			console.log(data);

			// Set element container (e.g., Thought). Only gets set once.
			// $(e).attr('id', 'frame-' + data.frame._id); // e.data('id', data._id);
			// addTimelineWidget(e);
		},
		error: function() {
			console.log('Failed to save Identity.');
		}
	});
}

// Get avatar for user of current Account
function getTags(e) {

	var entryId = $(e).find('.activity-widget .element').attr('data-entry');

	if (entryId === undefined) {
		return;
	}

	$.ajax({
		type: 'GET',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/tag?entryId=' + entryId,
		dataType: 'json',
		success: function(data) {
			// console.log('Received protected thoughts (success).');
			// console.log(data);

			$(e).find('.tags').html('');
			for (tag in data) {
				$(e).find('.tags').append('<span id="tag-' + data[tag]._id + '" style="display:inline-block;" contenteditable="false">' + data[tag].text + '</span> ');
			}
		}
	});
}

// function getNote(e) {
function getNote(options) {

	var pageId = options['pageId'];

	if (pageId === undefined) {
		return;
	}

	$.ajax({
		type: 'GET',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/note?pageId=' + pageId,
		dataType: 'json',
		success: function(data) {
			// console.log('Received protected thoughts (success).');
			console.log('note: ' + JSON.stringify(data));

			if (data.length > 0) { // Check if any results were returned
				var e = $('#frame-' + data.page.entry);
				$(e).find('.note').text(data.note);
			}

			// for (tag in data) {
			// 	$(e).find('.tags').append('<span id="tag-' + data[tag]._id + '" style="display:inline-block;" contenteditable="false"><a href="javascript:getTimeline({});">' + data[tag].text + '</a></span> ');
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
			"entry": element.attr("data-entry"),
			// "frameType": e.attr("data-activity-type"),
			"text": uniqueTags[i]
		};

		//if(element.attr("data-frame")) dataJSON.frame = element.attr("data-frame");
		//if(element.attr("data-id")) dataJSON.reference = element.attr("data-id"); // Set the element to the reference, since it was edited.

		console.log("Saving Tag for Frame (JSON): ");
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

function saveNote(e) {
	console.log('saveNote');

	var activityType = $(e).attr('data-activity-type');
	// TODO: Make sure actiivtyType is valid (compare with retreived types from API?)

	console.log('Saving note for activityType: ' + activityType);

	var widget  = e.find('.activity-widget');
	var element = e.find('.activity-widget .element');
	var note    = e.find('.activity-widget .note');

	// Get textual tags (i.e., the "raw" tag text, e.g., "mytag" in "#mytag")
	// var rawTagText = e.find('.tags').text();
	// rawTagText = rawTagText.replace(/#,/, '');
	//rawTagText = rawTagText.replace(/^[A-Z0-9]/, '');
	// rawTagText = rawTagText.toLowerCase();
	// console.log(rawTagText);
	// var tagText = rawTagText.split(/\s/);
	var noteText = e.find('.note').text().trim();
	var tagTextCount = noteText.length;
	console.log(tagTextCount);

	console.log('NOTE: ' + noteText);

	// Save each tag

	// Construct JSON object for element to save
	var dataJSON = {
		//"timeline": $("#narrative-list").attr("data-timeline"),
		"entry": element.attr("data-entry"),
		// "frameType": e.attr("data-activity-type"),
		"note": noteText
	};

	//if(element.attr("data-frame")) dataJSON.frame = element.attr("data-frame");
	//if(element.attr("data-id")) dataJSON.reference = element.attr("data-id"); // Set the element to the reference, since it was edited.

	console.log("Saving Tag for Frame (JSON): ");
	console.log(dataJSON);

	// POST the JSON object 
	$.ajax({
		type: 'POST',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/note',
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		data: JSON.stringify(dataJSON),
		processData: false,
		success: function(data) {
			console.log('Saved Note: ');
			console.log(data);

			// TODO: Only update necessary tags
			$(e).find('.note').html(data.note);

			console.log('Updated Note.');
		},
		error: function() {
			console.log('Failed to save Note.');
		}
	});
}

function bumpEntry(e) {
	console.log('bumpEntry');

	var activityType = $(e).attr('data-activity-type');
	// TODO: Make sure actiivtyType is valid (compare with retreived types from API?)

	console.log('Saving tags for activityType: ' + activityType);

	var widget  = e.find('.activity-widget');
	var element = e.find('.activity-widget .element');

	// Construct JSON object for element to save
	var dataJSON = {
		//"timeline": $("#narrative-list").attr("data-timeline"),
		"entry": element.attr("data-entry"),
		// "frameType": e.attr("data-activity-type"),
		"degree": 1
	};

	//if(element.attr("data-frame")) dataJSON.frame = element.attr("data-frame");
	//if(element.attr("data-id")) dataJSON.reference = element.attr("data-id"); // Set the element to the reference, since it was edited.

	console.log("Saving Bump for Entry (JSON): ");
	console.log(dataJSON);

	// POST the JSON object 
	$.ajax({
		type: 'POST',
		beforeSend: function(request) {
			request.setRequestHeader('Authorization', 'Bearer ' + localStorage['token']);
		},
		url: localStorage['host'] + '/api/' + activityType + '/bump',
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		data: JSON.stringify(dataJSON),
		processData: false,
		success: function(data) {
			console.log('Saved Bumps: ');
			console.log(data);

			// Set element container (e.g., Thought). Only gets set once.
			//$(e).find('.tags')
			//.attr('id', 'frame-' + data.frame._id); // e.data('id', data._id);

			// TODO: Only update necessary tags
			// getTags(e);

			console.log('Updated Bumps.');
		},
		error: function() {
			console.log('Failed to save Bumps.');
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