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
			app.log("Setup_cordova Show StatusBar");
			StatusBar.show();
			StatusBar.overlaysWebView(false);
			StatusBar.overlaysWebView(true);

			cordova.plugins.SiriShortcuts.getActivatedShortcut({}, function(data) {
				app.log("Run Siri Shortcut", JSON.stringify(data));
			}, function(err) {
				app.log("Run Siri Shortcut Error", JSON.stringify(err));
			});
		}
	});
}

function on_visibility() {
  if (document.hidden) {
    app.log('Page in background');
		app.is_visible = false;
  } else {
    app.log('Page in foreground');
		app.is_visible = true;

		// force-fix statusbar
		if (app.is_app && app.platform == 'iOS') {
			app.log("Visibility Show StatusBar");
			StatusBar.show();
			StatusBar.overlaysWebView(false);
			StatusBar.overlaysWebView(true);
		}

		// if sisbot is disconnected, reconnect now
		if (app.manager.get('sisbot_id') !== 'false') {
			var sisbot = app.manager.get_model('sisbot_id');

			if (sisbot.get('is_socket_connected') == 'false') {
				app.log("Restart polling", sisbot.id);
				setTimeout(function() {
					sisbot._poll_restart();
				}, 500);
			}
		}
  }
}

function on_active() {
	app.log("App Active", app.platform);
	check_siri();
}

function on_resume() {
	app.log("App Resumed", app.platform);
	check_siri();

	// rescan for sisbots?
	var sisbot_id = app.manager.get('sisbot_id');
	if (sisbot_id && sisbot_id != 'false') {
		var sisbot = app.collection.get(sisbot_id);
		var reason_unavailable = sisbot.get('data.reason_unavailable');

		if (reason_unavailable != 'false') {
			app.log("Resume: find trigger");
			app.manager.find_sisbots({force_rescan: true}); // trigger rescan
		}
	} else {
		app.log("Resume: No Sisbot find trigger");
		app.manager.find_sisbots(); // trigger rescan
	}
}

function check_siri() {
	app.log("Check for Siri Shortcut");
	// TESTING: Siri shortcuts
	if (app.is_app && app.platform == 'iOS') {
		cordova.plugins.SiriShortcuts.getActivatedShortcut({clear:true}, function(data) {
			app.log("Siri Shortcut:", JSON.stringify(data));
			if (data && data.userInfo) {
				var shortcut_data = data.userInfo;
				if (shortcut_data.model && shortcut_data.action) {
					var model = app.collection.get(shortcut_data.model);
					if (model && _.isFunction(model[shortcut_data.action])) {
						app.log("Siri Call Action:", shortcut_data.model, shortcut_data.action, shortcut_data.msg);
						if (shortcut_data.msg) model[shortcut_data.action](shortcut_data.msg);
						else model[shortcut_data.action]();
					} else {
						app.log("Siri Shortcut Error: "+shortcut_data.model+" not found");
					}
				}
			}
		}, function(err) {
			app.log("Get Siri Shortcut Error", JSON.stringify(err));
		});
	}
}

function status_tap() {
	app.log("Status Tapped", $('.scroll').length);
  // scroll to top, but first, remove -webkit-overflow-scrolling: touch (doesn't work reliably)
	$('.scroll').addClass('auto-scroll').removeClass('scroll').stop().animate({scrollTop: 0}, 'normal', function() {
		$('.auto-scroll').addClass('scroll').removeClass('auto-scroll');
	});
}

document.addEventListener( 'visibilitychange' , on_visibility, false );

document.addEventListener("deviceready", setup_cordova, false);
document.addEventListener("resume", on_resume, false);
document.addEventListener("active", on_active, false);
window.addEventListener("statusTap", status_tap);
