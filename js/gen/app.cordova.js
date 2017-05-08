function setup_platforms(cb) {
	var cbs = 0;
	function check_cbs() {
		if (cbs == 0) cb();
	};

	if (window && window.plugins && window.plugins.uniqueDeviceID) {
		cbs++;

		window.plugins.uniqueDeviceID.get(function(uuid) {
			app.device_id = uuid;
			cbs--;
			check_cbs();
		}, function() {
			//alert('failed to get uid');
		});
	}

	check_cbs();

	/*
	WifiWizard.getCurrentSSID(function(curr_wifi) {
		alert('curr wifi');
		alert(curr_wifi);
	}, function fail(err) {
		alert('curr wifi err');
		alert(err);
	});
	*/

	/*
	var pushwoosh = cordova.require("pushwoosh-cordova-plugin.PushNotification");

	  // Should be called before pushwoosh.onDeviceReady
	  document.addEventListener('push-notification', function(event) {
	    var notification = event.notification;
	    alert('we got push notification')
	  });

	  // Initialize Pushwoosh. This will trigger all pending push notifications on start.
	  pushwoosh.onDeviceReady({
	    appid		: "3900B-C34C0",
	    //projectid	: "GOOGLE_PROJECT_NUMBER",
	    //serviceName	: "MPNS_SERVICE_NAME"
	  });

	  pushwoosh.registerDevice(
		  function(status) {
		    var pushToken = status.pushToken;
			//alert('we were pushwoosh successful');
			//alert(pushToken);
		      // handle successful registration here
		  },
		  function(status) {
			// alert('we were unsuccessful', status);
		    // handle registration error here
		  }
		);
	*/

	/*
	if (StatusBar)
		StatusBar.hide();
	*/

	//app.collection.add({ id: device.uuid }).fetch();

	/* TODO: Fix Soon
	var platforms = {
		'Android'		: true,
		'BlackBerry'	: true,
		'iOS'			: true,
		'webOS'			: true,
		'WinCE'			: true
	};

	$('body').addClass(device.platform);

	// Network Details
	var networkState = navigator.connection.type;

    var states = {};
    states[Connection.UNKNOWN]  = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI]     = 'WiFi connection';
    states[Connection.CELL_2G]  = 'Cell 2G connection';
    states[Connection.CELL_3G]  = 'Cell 3G connection';
    states[Connection.CELL_4G]  = 'Cell 4G connection';
    states[Connection.CELL]     = 'Cell generic connection';
    states[Connection.NONE]     = 'No network connection';

	if (states[networkState] == 'Unknown connection') {
	    //when_offline();
	}

	if (cordova.plugins.Keyboard)
		cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

	app.plugins.msg.alert = function(message, button) {
		button = button || 'Ok';
		window.navigator.notification.alert('', function() {}, message, button);
	}

	app.plugins.msg.confirm = function(data) {
		function on_click(button) {
			// 1 is cancel, 2 is accept
			return (button == 1) ? data.cancel() : data.success();
		}

		window.navigator.notification.confirm(data.message, on_click, data.title, 'Cancel,' + data.confirm);
	}

	app.plugins.msg.prompt = function(placeholder, cb, title, buttons) {
		navigator.notification.prompt(placeholder, cb, title, buttons);
	}
	*/
};

function when_offline(data) {
	app.router.navigate('offline', true);
}

function when_online(data) {
	//user.check_login_status();
}

function setup_cordova() {
	document.addEventListener("offline", when_offline, false);
	document.addEventListener("online", when_online, false);
	setup_platforms(function() {
		app.setup();
	});
}

document.addEventListener("deviceready", setup_cordova, false);
