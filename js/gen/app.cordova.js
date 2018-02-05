function setup_platforms(cb) {
	var cbs = 0;
	function check_cbs() {
		if (cbs == 0) cb();
	};

	app.platform = device.platform;

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
};

function when_offline(data) {
	//app.router.navigate('offline', true);
}

function when_online(data) {
	//user.check_login_status();
}

function setup_cordova() {
	//document.addEventListener("offline", when_offline, false);
	//document.addEventListener("online", when_online, false);
	setup_platforms(function() {
		app.setup();
	});
}

document.addEventListener("deviceready", setup_cordova, false);
