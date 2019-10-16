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

	document.addEventListener("backbutton", function() {
		app.trigger('navigate:back');
	}, false);


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

		// TESTING: Siri shortcuts
		if (app.is_app && app.platform == 'iOS') {
			cordova.plugins.SiriShortcuts.getActivatedShortcut({}, function(data) {
				console.log("Run Siri Shortcut", JSON.stringify(data));
			}, function(err) {
				console.log("Run Siri Shortcut Error", JSON.stringify(err));
			});
		}
	});
}

function on_active() {
	console.log("App Active", app.platform);
	check_siri();
}

function on_resume() {
	console.log("App Resumed", app.platform);
	check_siri();
}

function check_siri() {
	console.log("Check for Siri Shortcut");
	// TESTING: Siri shortcuts
	if (app.is_app && app.platform == 'iOS') {
		cordova.plugins.SiriShortcuts.getActivatedShortcut({clear:true}, function(data) {
			console.log("Siri Shortcut:", JSON.stringify(data));
			if (data && data.userInfo) {
				var shortcut_data = data.userInfo;
				if (shortcut_data.model && shortcut_data.action) {
					var model = app.collection.get(shortcut_data.model);
					if (model && _.isFunction(model[shortcut_data.action])) {
						console.log("Siri Call Action:", shortcut_data.model, shortcut_data.action, shortcut_data.msg);
						if (shortcut_data.msg) model[shortcut_data.action](shortcut_data.msg);
						else model[shortcut_data.action]();
					} else {
						console.log("Siri Shortcut Error: "+shortcut_data.model+" not found");
					}
				}
			}
		}, function(err) {
			console.log("Get Siri Shortcut Error", JSON.stringify(err));
		});
	}
}

document.addEventListener("deviceready", setup_cordova, false);
document.addEventListener("resume", on_resume, false);
document.addEventListener("active", on_active, false);
