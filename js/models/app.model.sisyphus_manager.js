app.model.sisyphus_manager = {
  defaults: function(data) {
    var obj = {
      id: data.id,
      type: 'sisyphus_manager',
      device_ip: 'false',

      user_id: 'false',

      sisbot_id: 'false',
      is_sisbot_available: 'false',
      sisbot_registration: 'find', // find|none|hotspot|multiple

      show_wifi_page: 'false',
      show_nightlight_page: 'false',

      show_setup_page: 'false',
      show_software_update_page: 'false',
      show_sleeping_page: 'false',

      show_hostname_page: 'false',
      current_ssid: 'false',

      sisbots_user: [],
      sisbots_networked: [],
      sisbots_ip_name: {},

      sisbots_scanning: 'false',
      sisbot_hostname: '',
      sisbot_connecting: 'false',
      sisbot_reconnecting: 'false',

      merge_playlists: [],

      tracks_to_upload: [],
      publish_track: 'false',

      fetching_community_playlists: 'false',
      fetching_community_tracks: 'false',
      fetched_community_playlists: 'false',
      fetched_community_tracks: 'false',

      community_page: 'tracks',
      community_playlist_ids: [],
      community_track_ids: [],

      is_ble_enabled: 'false',
      local_version: 'na',

      remote_versions: {
        proxy: '10.0.0',
        app: '10.0.0',
        api: '10.0.0',
        sisbot: '10.0.0',
      },

      is_admin: 'false',

      data: {
        id: data.id,
        type: 'sisyphus_manager',
        version: this.current_version,
      }
    };

    return obj;
  },
  current_version: 1,
  on_init: function() {
    // console.log("on_init() in app.model.sisyphus_manager");
    if (window.cordova) StatusBar.show();

    app.plugins.n.initialize();

    this.listenTo(app, 'session:sign_in', this.sign_in_via_session);
    this.listenTo(app, 'sisbot:wifi_connected', this.should_show_setup_page);
    this.listenTo(app, 'navigate:back', this.navigate_home);
    this.on('change:is_sisbot_available', this.check_reconnect_status);

    app.manager = this;

    this.get_current_ssid();

    // Skip account creation at the beginning

    if (app.config.env == 'sisbot' || app.config.env == 'wc_test') {
      this.setup_as_sisbot();
    } else if (app.config.env == 'alpha') {
      //this.setup_demo();
    } else if (app.config.env == 'beta') {
      //this.setup_demo();
    } else {
      app.current_session().check_session_sign_in();
    }

    this.set('local_version', app.config.version);
    this.check_ble_status();
    this.check_remote_versions();

    return this;
  },
  intake_data: function(given_data) {
    // console.log("intake_data()", given_data);

    var self = this;

    if (!_.isArray(given_data)) given_data = [given_data];

    _.each(given_data, function(data) {
      if (!data || !data.id) {
        // do nothing for responses that aren't objects
      } else if (app.collection.exists(data.id)) {
        var m = app.collection.get(data.id);
        var d = m.get('data');

        _.each(data, function(val, key) {
          if (d && d[key] !== val) {
            if (_.isArray(val)) {
              var is_diff = false;
              if (!_.isArray(d[key])) {
                is_diff = true;
              } else if (val.length !== d[key].length) {
                is_diff = true;
              } else {
                _.each(val, function(vall, i) {
                  var new_str = vall;
                  if (_.isObject(new_str) || _.isArray(new_str)) new_str = JSON.stringify(new_str);
                  var old_str = d[key][i];
                  if (_.isObject(old_str) || _.isArray(old_str)) old_str = JSON.stringify(old_str);
                  if (new_str != old_str) {
                    is_diff = true;
                    // console.log("Array change", key, new_str, old_str);
                  }
                });
              }

              if (is_diff == true) {
                m.set('data.' + key, val);
                m.trigger('change:data.' + key);
              }
            } else {
              m.set('data.' + key, val);
              m.trigger('change:data.' + key);
            }
          }
        });
      } else {
        app.collection.add(data);
      }
    });
  },
  has_user: function() {
    return (this.get('user_id') !== 'false') ? 'true' : 'false';
  },
  open_home_page: function() {
    if (app.is_app) {
      cordova.InAppBrowser.open('https://www.sisyphus-industries.com/', '_system', 'location=yes');
    } else {
      window.location = 'https://www.sisyphus-industries.com/';
    }
  },
  open_support_page: function() {
    if (app.is_app) {
      cordova.InAppBrowser.open('https://sisyphus-industries.com/support', '_system', 'location=yes');
    } else {
      window.location = 'https://sisyphus-industries.com/support';
    }
  },
  find_tracks: function() {
    window.open('https://www.dropbox.com/sh/n2l29huvdrjalyx/AAA69jTy1aDobkR_wKog1Ewka?dl=0');
  },
  navigate_home: function() {
    app.trigger('session:active', {
      secondary: 'false',
      primary: 'current'
    });
  },
  check_remote_versions: function(cb) {
    var self = this;

    var obj = {
      _url: app.config.get_api_url(),
      _type: 'POST',
      endpoint: 'latest_software_version',
      data: {}
    };

    app.post.fetch(obj, function(cbb) {
      self.set('remote_versions', cbb.resp);
    }, 0);

    return this;
  },
  _admin_taps: 0,
  check_admin: function() {
    if (++this._admin_taps > 5) {
      this.set('is_admin', 'true');
    }
  },
  /**************************** BLUETOOTH ***********************************/
  ble_start_time: null,
  ble_sisbots_found: {},
  _char: false,
  _ble_cb: false,
  _ble_hotspot: false, // did we find a sisbot in hotspot mode?
  force_reload: function() {
    window.location.reload();
  },
  open_ble_settings: function() {
    console.log("open_ble_settings()");
    window.cordova.plugins.settings.open('bluetooth', function success(resp) {
      // do nothing
    }, function error(err) {
      // do nothing
    });
  },
  check_ble_status: function() {
    //   console.log("check_ble_status()");
    if (!app.is_app || app.config.env == 'alpha') { //<<<< comment out for X-Code simulation
      this.set('is_ble_enabled', 'true');
      return this;
    }     //<<<<

    var self = this;

    cordova.plugins.BluetoothStatus.initPlugin();

    window.addEventListener('BluetoothStatus.enabled', function() {
      self.set('is_ble_enabled', 'true');
    });
    window.addEventListener('BluetoothStatus.disabled', function() {
      self.set('is_ble_enabled', 'false');
    });
  },
  check_ble_permissions: function(cb) {
    console.log("check_ble_permissions()");

    var self = this;

    bluetoothle.initialize(function(obj) {
      if (obj.status == 'enabled') {
        bluetoothle.hasPermission(function(status) {
          if (status.hasPermission == true) {
            cb();
          } else {
            // WE DO NOT HAVE PERMISSIONS
            var text = 'In order for us to locate your Sisyphus with bluetooth Android requires "Location Permissions" to be allowed. Without those permissions you will not be able to connect to your Sisyphus.';
            var header = 'Bluetooth App Permissions';
            app.plugins.n.notification.confirm(text, on_perms, header, ['Continue']);

            function on_perms(status) {
              if (status == 1) { // user does not want to give permissions
                // prompt for permissions
                bluetoothle.requestPermission(function ble_perms_success(status) {
                  if (status.requestPermission == true) {
                    self.set('is_ble_enabled', 'true');
                    cb();
                  } else {
                    self.set('is_ble_enabled', 'false');
                    cb();
                  }
                }, function ble_perms_failure() {
                  self.set('is_ble_enabled', 'false');
                  cb();
                });
              }
            }
          }
        });
      } else {
        self.set('is_ble_enabled', 'false');
        cb();
      }
    }, {});
  },
  start_ble_scan: function(device_name, cb) {
    var self = this;
    this.ble_start_time = Date.now();
    console.log("start_ble_scan()", this.ble_start_time, JSON.stringify(this.get('sisbots_networked')));

    if (cb) this._ble_cb = cb;

    evothings.ble.startScan(
      function(device) {
        if (device &&
          device.advertisementData &&
          device.advertisementData.kCBAdvDataLocalName &&
          (device.advertisementData.kCBAdvDataLocalName.indexOf(device_name) > -1 || device.advertisementData.kCBAdvDataLocalName.indexOf('isyphus') > -1) // legacy
        ) {
          // console.log("BLE found Device", device.advertisementData.kCBAdvDataLocalName);

          try {
            self.ble_add_device(device);
          } catch(err) {
            console.log("BLE add device error", err);
          }
          // self.ble_connect(device);
        }
      },
      function(error) {
        console.log('Ble Start Scan Error: ' + error);
        self.ble_cb();
      }
    );

    // give the user plenty of time to approve permissions and find sisbot
    setTimeout(function() {
      self.ble_stop_scan();
      self.ble_cb();

      console.log("BLE Sisyphus devices found:", _.size(_.keys(self.ble_sisbots_found)));
    }, 5000); // formerly 15000
  },
  ble_add_device: function(device) {
    var self = this;

    var device_name = device.advertisementData.kCBAdvDataLocalName;
    if (device_name && !self.ble_sisbots_found[device_name]) {
      console.log("BLE found Device", device_name);
      self.ble_sisbots_found[device_name] = device;
    }
  },
  ble_cb: function(value) {
    console.log("BLE_cb: ", value);
    var self = this;

    var ble_i = 0;
    var ble_keys = _.keys(self.ble_sisbots_found);

    function cb(ip_address) {
      if (ip_address) {
        console.log("BLE ip found:", ip_address);
        if (ip_address == '192.168.42.1') self._ble_hotspot = true;
        self.ping_sisbot(ip_address, function() {
          next_device();
        });
      } else {
        console.log("BLE connect error", ip_address);
        next_device();
      }
    }

    function next_device() {
      ble_i++;
      if (ble_i < ble_keys.length) self.ble_connect(self.ble_sisbots_found[ble_keys[ble_i]], cb);
      else {
        console.log("BLE finished", Date.now() - self.ble_start_time);
        console.log("BLE sisbots found:", JSON.stringify(self.get('sisbots_networked')));
        // continue with scan
        if (self._ble_cb) {
          self._ble_cb();
        }
      }
    }

    if (ble_keys.length > 0) self.ble_connect(self.ble_sisbots_found[ble_keys[ble_i]], cb);

    return this;
  },
  ble_stop_scan: function() {
    evothings.ble.stopScan();
  },
  ble_connect: function(device, cb, connect_retries) {
    // this.ble_stop_scan();
    var self = this;

    evothings.ble.connectToDevice(device, function on_connect(device) {
      self.get_service_data(device, cb);
    }, function on_disconnect(device) {
      //alert('Disconnected from Device');
      if (cb) cb();
    }, function on_error(error) {
      if (connect_retries > 5) {
        app.plugins.n.notification.alert('Bluetooth Connect Error: ' + error);
        if (cb) cb();
      } else {
        setTimeout(function() {
          self.ble_connect(device, cb, ++connect_retries);
        }, 500);
      }
    });
  },
  get_service_data: function(device, cb) {
    var self = this;

    evothings.ble.readAllServiceData(device,
      function on_read(services) {
        var dataService = evothings.ble.getService(device, "ec00");

        if (dataService == null) {
          if (cb) cb();
          evothings.ble.close(device);
        } else {
          self._char = evothings.ble.getCharacteristic(dataService, "ec0e")
          self.setup_read_chars(device, cb);
        }
      },
      function on_error(error) {
        //alert('Bluetooth Service Data Error: ' + error);
        if (cb) cb();
        evothings.ble.close(device);
      }
    );
  },
  setup_read_chars: function(device, cb) {
    var self = this;

    evothings.ble.readCharacteristic(device, this._char, function on_success(d) {
      var ip_address_arr = new Uint8Array(d);
      var _ble_ip = ip_address_arr.join('.');
      if (cb) cb(_ble_ip);
      evothings.ble.close(device);
    }, function on_fail(error) {
      //alert('Reach Characteristic Error: ' + error);
      if (cb) cb();
      evothings.ble.close(device);
    });
  },
  /****************************************************************************/
  _has_update: function(sisbot, remote) {
    console.log("_has_update()");

    if (!remote)
      return false;

    var remote_revisions = remote.split('.');
    var local_revisions = sisbot.split('.');
    var local_is_newer = false;
    var has_update = false;

    for (var i = 0; i < local_revisions.length; i++) {
      if (+local_revisions[i] > +remote_revisions[i]) {
        local_is_newer = true;
      } else if (+local_revisions[i] < +remote_revisions[i]) {
        has_update = true;
      }
      if (has_update == true || local_is_newer == true) {
        break;
      }
    }

    return has_update;
  },
  should_show_onboarding: function() {
    // console.log("should_show_onboarding()");
    var sisbot = this.get_model('sisbot_id');
    var hotspot_status = sisbot.get('data.is_hotspot');
    var reminder_status = sisbot.get('data.do_not_remind');
    var is_internet_connected = sisbot.get('data.is_internet_connected');

    if (reminder_status == 'false') {
      if (hotspot_status == 'true') {
        this.set('show_wifi_page', 'true');
      }

      this.set('show_setup_page', 'true')
        .set('show_nightlight_page', 'true');
    }

    if (is_internet_connected) {
      // check for software update
      var sisbot_version = sisbot.get('data.software_version');
      var remote_sisbot = this.get('remote_versions.sisbot');
      if (this._has_update(sisbot_version, remote_sisbot) == true) {
        app.trigger('session:active', {
          secondary: 'software-update',
          primary: 'settings'
        });
      }
    }

    if (this.get_model('sisbot_id').is_legacy() == true) {
      // no onboarding if legacy
      this.set('show_setup_page', 'false')
        .set('show_nightlight_page', 'false')
        .set('show_sleeping_page', 'false')
        .set('show_software_update_page', 'false');

      if (is_internet_connected == 'true')
        app.trigger('session:active', {
          secondary: 'software-update',
          primary: 'settings'
        });
    }

    return this;
  },
  should_show_setup_page: function() {
    console.log("should_show_setup_page()");
    this.set('show_wifi_page', 'false');
  },
  should_show_nightlight: function() {
    console.log("should_show_nightlight()");
    // error check name first
    var sisbot = this.get_model('sisbot_id');

    if (sisbot.get('default_settings.name') == '') {
      sisbot.set('default_settings_error', 'true')
    } else {
      sisbot.set('default_settings_error', 'false')
      this.set('show_setup_page', 'false');
    }
  },
  save_hostname: function() {
    console.log("save_hostname()");
    var sisbot = this.get_model('sisbot_id');
    sisbot.set('updating_hostname', 'true');
    this.listenTo(sisbot, 'change:updating_hostname', this.after_hostname);
    sisbot.update_hostname();
  },
  after_hostname: function() {
    // console.log("after_hostname()");
    var sisbot = this.get_model('sisbot_id');
    this.stopListening(sisbot, 'change:updating_hostname');
    this.set('show_hostname_page', 'false');
  },
  /*********************** SISBOT FIND **************************************/
  open_network_settings: function() {
    //   console.log("open_network_settings()");
    var self = this;

    self.set('sisbot_registration', 'waiting');

    window.cordova.plugins.settings.open('wifi', function success(resp) {
      self.await_network_connection(function() {
        //   console.log("Wifi: await network connection");
        self.set('sisbot_registration', 'find');
      }, 0);
    }, function error(err) {
      return app.plugins.n.notification.alert('Error opening WiFi settings. Please manually go to your WiFi settings');
    });

    return this;
  },
  open_network_settings_from_error: function() {
    //   console.log("open_network_settings_from_error()");
    var self = this;

    window.cordova.plugins.settings.open('wifi', function success(resp) {
      // we are attempting to reconnect to hotspot
      // self.get_model('sisbot_id')._poll_restart();
      // console.log("Wifi: reconnecting");
      self.find_sisbots();
      self.set('sisbot_reconnecting', 'true');
    }, function error(err) {
      self.set('sisbot_reconnecting', 'false');
      return app.plugins.n.notification.alert('Error opening WiFi settings. Please manually go to your WiFi settings');
    });
  },
  open_network_settings_for_hotspot: function() {
    //   console.log("open_network_settings_for_hotspot()");
    var self = this;

    self.set('sisbot_reconnecting', 'true');

    window.cordova.plugins.settings.open('wifi', function success(resp) {
      // we are attempting to reconnect to hotspot
      self.await_network_connection(function() {
        // console.log("Wifi: await network connection");
        self.find_sisbots();
        // self.get_model('sisbot_id').set('data.local_ip', '192.168.42.1')._poll_restart();
      }, 0);
    }, function error(err) {
      self.set('sisbot_reconnecting', 'false');
      return app.plugins.n.notification.alert('Error opening wifi settings. Please manually go to your wifi settings');
    });
  },
  await_network_connection: function(cb, count) {
    // console.log("await_network_connection()");
    var self = this;
    setTimeout(function() {
      if (navigator && navigator.connection && navigator.connection.type == Connection.NONE) {
        self.await_network_connection(cb, 0);
      } else if (count < 5) {
        self.await_network_connection(cb, ++count);
      } else {
        cb();
      }
    }, 500);
  },
  reconnect_from_error: function() {
    // console.log("Wifi: reconnect_from_error()");
    this.set('sisbot_reconnecting', 'true');
    // this.get_model('sisbot_id')._poll_restart();
    this.find_sisbots();
  },
  reconnect_to_hotspot: function() {
    // console.log("Wifi: Reconnect to hotspot");
    this.set('sisbot_reconnecting', 'true');
    // this.get_model('sisbot_id').set('data.local_ip', '192.168.42.1')._poll_restart();
    this.find_sisbots();
  },
  check_reconnect_status: function() {
    console.log("check_reconnect_status()  " +  this.get('sisbot_id'));
    var sisbot = this.get_model('sisbot_id');
    if(!sisbot) return;

    if (this.get('sisbot_reconnecting') == 'true' && this.get('is_sisbot_available') == 'true' && sisbot.get('data.do_not_remind') == 'false') {
      // wifi failed and we needed to reconnect
      this.set('sisbot_connecting', 'false');
      this.set('sisbot_reconnecting', 'false');
      this.get_model('sisbot_id').set('wifi_error', 'incorrect');
    } else if (this.get('is_sisbot_available') == 'false' && sisbot.get('data.installing_updates') == 'true') {
      // we timed out in installing updates
      if (sisbot.get('data.reason_unavailable').indexOf('_fault') < 0) sisbot.set('data.reason_unavailable', 'false');
    }
  },
  /**************************** FIND SISBOTS ********************************/
  _apple_counts: 0,
  _apple_counter: function() {
     this._apple_counts++;
    console.log("_apple_counter()", this._apple_counts);
    if (this._apple_counts > 5) {
      app.config.env = 'alpha';
      this.set('sisbot_registration', 'find');
    }
  },
  find_sisbots: function() {
    console.log("find_sisbots()", this.get('sisbot_id'), this.get('sisbot_registration'), this.get('sisbot_scanning'));
    var self = this;

    if (app.is_app) {
      if (device.platform == 'Android') {
        this.check_ble_permissions(function() {
          var status = self.get('is_ble_enabled');

          if (status == 'false') {
            return this;
          } else {
            self._find_sisbots();
          }
        });
      } else {
        this._find_sisbots();
      }
    } else {
      this._find_sisbots();
    }
  },
  rescan: function() {
    console.log("rescan()");
    app.current_session().clear_sisbots();
    this.set('sisbots_scanning', 'true');
    this.set('sisbot_registration', 'find');
    window.location.reload();
  },
  _find_sisbots: function() {
    if (this.get('sisbots_scanning') == 'true') return;

    console.log("_find_sisbots()");
    // this will find the sisbots on the local network
    var self = this;
    // conditional for if in beta/training localhost mode or not to ignore error.
    if (app.config.env != 'beta' && app.config.env != 'training') {
      if (navigator && navigator.connection && navigator.connection.type == Connection.NONE) {
        setTimeout(function() {
          self._find_sisbots();
        }, 100);
        return this;
      }
    }

    this.set('sisbots_networked', []);
    this.set('sisbots_ip_name', {});
    // this.set('sisbot_id', 'false'); // ?? clear ?? // causes errors on check_reconnect_status
    this.set('sisbot_registration', 'find'); // ?? maybe ??
    this.set('sisbots_scanning', 'true');
    console.log('Find Sisbots:', this.get('sisbot_id'), this.get('sisbot_registration'), this.get('sisbot_scanning'));

    var num_checks = 4;

    function on_cb() {
      --num_checks;

      console.log("Is Sisbot Available:", self.get('sisbot_registration'), self.get('is_sisbot_available'), self.get('sisbots_scanning'));

      if (self.get('sisbots_scanning') == 'false') return;

      // if we found sisbots already, skip rest of checks
      // if (self.get('sisbots_networked').length > 0) num_checks = 0;

      switch (num_checks) {
        case 3:
          console.log("Find Hotspot");
          self.find_hotspot(on_cb);
          break;
        case 2:
          console.log("Find Network Sisbots");
          self.find_network_sisbots(on_cb);
          break;
        case 1:
          console.log("Find Bluetooth Sisbots");
          self.find_bluetooth_sisbots(on_cb);
          break;
        default:
          // DEBUGGING CODE: COMMENT BEFORE COMMIT
          // self.set('sisbot_registration', 'none');
          // return this;

          var sisbots = _.uniq(self.get('sisbots_networked'));
          console.log("Find CB", sisbots);
          self.set('sisbots_networked', sisbots);
          self.set('sisbots_scanning', 'false');

          if (app.config.env == 'alpha') {
            self.connect_to_sisbot('192.168.42.1');
          } else if (app.config.env != 'prod') {
            self.connect_to_sisbot(app.config.get_sisbot_url());
          } else if (sisbots.length == 1) {
            self.set('sisbot_registration', 'connecting');
            self.connect_to_sisbot(sisbots[0]);
          } else if (sisbots.length == 0) {
            if (self._ble_hotspot) self.set('sisbot_registration', 'hotspot'); // BLE found hotspot(s)
            else self.set('sisbot_registration', 'none'); // show screen that we found none
          } else if (sisbots.length > 1) {
            // show screen to select sisbot
            // self.set('sisbot_id', 'false'); //TODO: find previous table
            self.set('sisbot_hostname', Object.keys(self.get('sisbots_ip_name'))[0].replace(/\-/gi, '.'));
            self.set('sisbot_registration', 'multiple');
          }
      }
    }

    console.log("Find Session");
    this.find_session_sisbots(on_cb);
  },
  find_hotspot: function(cb) {
    console.log("in find_hotspot to find_sisbots()");
    var hotspot_hostname = '192.168.42.1';

    this.ping_sisbot(hotspot_hostname, cb);

    return this;
  },
  find_session_sisbots: function(cb) {
    console.log("find_session_sisbots()");
    var self = this;
    var session_sisbots = app.current_session().get_sisbots();
    var num_cbs = session_sisbots.length + 1;

    function on_cb() {
      if (--num_cbs == 0) cb();
    }

    _.each(session_sisbots, function(hostname) {
      self.ping_sisbot(hostname, on_cb);
    });

    on_cb();

    return this;
  },
  find_user_sisbots: function(cb) {
    console.log("find_user_sisbots()", this.get('user_id'));
    if (this.get('user_id') == 'false') return cb();

    var self = this;
    var user_sisbots = this.get_model('user_id').get('data.sisbot_hostnames');
    var num_cbs = user_sisbots.length + 1;

    function on_cb() {
      if (--num_cbs == 0) cb();
    }

    _.each(user_sisbots, function(hostname) {
      self.ping_sisbot(hostname, on_cb);
    });

    on_cb();

    return this;
  },
  find_bluetooth_sisbots: function(cb) {
    if (!app.is_app) return cb();
    console.log("find_bluetooth_sisbots()");

    this.start_ble_scan('sisbot', cb);

    return this;
  },
  find_network_sisbots: function(cb) {
    console.log("find_network_sisbots()");
    if (!app.is_app) return cb();

    var self = this;

    this.get_network_ip_address(function(ip_address) {
      console.log('get_network_ip_address ==' + ip_address);
      if (!ip_address) return cb();
      var ip_add = ip_address.split('.');
      ip_add.pop();

      var ip_base = ip_add.join('.');
      var count = 0;

      _.each(_.range(0, 255), function(num) {
        self.ping_sisbot(ip_base + '.' + num, function() {
          if (++count == 255) cb();
        });
      });
    });

    return this;
  },
  ping_sisbot: function(hostname, cb, retries) {
    console.log("ping_sisbot()", hostname);
    var self = this;

    if (!retries) retries = 0;

    app.post.fetch({
      _url: 'http://' + hostname,
      _type: 'POST',
      _timeout: 2500,
      endpoint: '/sisbot/exists',
      data: {}
    }, function(obj) {
      if (obj.err) {
        return cb();
      }
      if (!obj.resp || !obj.resp.hostname) return cb();

      // Default select the one we are already on
      self.set('sisbot_hostname', obj.resp.local_ip);
      self.add('sisbots_networked', obj.resp.local_ip);
      self.set("sisbots_ip_name['" + obj.resp.local_ip.replace(/\./gi, '-') + "']", obj.resp.name);
      cb();
    }, 0);

    return this;
  },
  connect_to_sisbot: function(sisbot_hostname) {
    if (this.get('sisbot_connecting') == 'true') return false;
    else this.set('sisbot_connecting', 'true');

    this.set('errors', []);

    var self = this;
    var sisbot_hostname = (_.isString(sisbot_hostname)) ? sisbot_hostname : self.get('sisbot_hostname');
    if (sisbot_hostname.match(/^https?:\/\//i)) sisbot_hostname = sisbot_hostname.replace(/^https?:\/\//i, "");
    console.log("connect_to_sisbot()", sisbot_hostname);

    // ping sisbot for connection
    var obj = {
      _url: 'http://' + sisbot_hostname + '/',
      _type: 'POST',
      _timeout: 5000,
      _console: true,
      endpoint: 'sisbot/connect',
      data: {},
    };

    console.log("fetch()", obj);
    app.post.fetch(obj, function(obj) {
      self.set('sisbot_connecting', 'false')
        .set('errors', []);

      var sisbot_data = obj.resp;

      if (app.config.env == 'alpha') {
        sisbot_data = self.get_default_sisbot(); // DEFAULT SISBOT
        console.log('APPLE testing, connect to Sisbot:', sisbot_data);
      } else {
        if (obj.err) {
          // IF WE HAVE CONNECTION ERROR
          self.connect_to_sisbot(sisbot_hostname);
          return self.set('errors', ['- That sisbot does not appear to be on the network']);
        }
      }

      // add sisbot data to our local collection
      _.each(sisbot_data, function(data) {
        // if (app.collection.exists(data.id)) {
        //   app.collection.get(data.id).set('data', data);
        // } else {
        //   app.collection.add(data);
        // }
        // if (data.type == 'led_pattern') console.log("Incoming LED", data);
        self.intake_data(data);

        if (data.type == 'sisbot') {
          if (data.reason_unavailable == 'false') self.set('is_sisbot_available', 'true');

          var old_sisbot = self.get('sisbot_id');
          if (old_sisbot != 'false' && old_sisbot != data.id) {
            console.log("New Sisbot connected");
            app.socket.reset_socket = true;

            // change page to home
            app.trigger('session:active', {
              secondary: 'false',
              primary: 'current'
            });
          }

          self.set('sisbot_id', data.id);

          var sisbot = app.collection.get(data.id);

          // update ip address
          app.config.set_sisbot_url(sisbot.get('data.local_ip'));
          app.socket.initialize();
        }
      });

      // setup listeners after all objects added
      self.get_model('sisbot_id').sisbot_listeners();

      self.get_model('sisbot_id').set('is_connected', 'true')
        .set('sisbots_scanning', 'false'); // cancel out of scanning

      app.current_session().add_nx('sisbot_hostnames', sisbot_hostname);
      app.current_session().save_session();
      console.log("Connected: on page", app.session.get('active.primary'));
      if (app.session.get('active.primary') == 'false') app.trigger('session:active', {
        secondary: 'false',
        primary: 'current'
      });

      // hotspot access allows not requiring user
      if (self.get_model('user_id')) {
        console.log("Add to user model");
        // self.get_model('user_id').add_nx('data.sisbot_ids', self.get('sisbot_id'));
        // self.get_model('user_id').add_nx('data.sisbot_hostnames', sisbot_hostname);
        // self.get_model('user_id').save(true);
      }
    }, 0);

  },
  /**************************** NETWORK INFO **********************************/
  get_network_ip_address: function(cb) {
    console.log("get_network_ip_address()");
    networkinterface.getWiFiIPAddress(function on_success(ip_address) {
      cb(ip_address.ip);
      console.log('ip_address.ip ==' + ip_address.ip);

    }, function on_error(err) {
      cb(err);
    });
  },
  get_current_ssid: function() {
    console.log("get_current_ssid()");
    if (!app.is_app) return this;

    var self = this;

    WifiWizard2.getConnectedSSID(function on_success(ssid) {
      console.log('In the WifiWizard2 =' + ssid)
      self.set('current_ssid', ssid);
    }, function on_error(err) {
      app.plugins.n.notification.alert(err);
    });
  },
  /**************************** PLAYLISTS ***********************************/
  playlist_create: function(msg) {
    var playlist = app.collection.add({
      type: 'playlist',
      'name': ''
    });
    app.trigger('session:active', {
      playlist_id: playlist.id,
      secondary: 'playlist-new',
      primary: 'media'
    });

    if (msg) {
      if(msg.track_id) {
        playlist.add_track(msg.track_id);
      } else if(msg.track_ids) {
        _.each(msg.track_ids, function(track_id){
          playlist.add_track(track_id);
        });
      }
    }
  },
/************************** MOUSE COORDINATES ***********************************/
	showMouse: function() {
		var x = event.clientX;
		var y = event.clientY;
		var coords = "X coords: " + x + ", Y coords: " + y;
		console.log('Coordinates are =', coords)
	},
  /******************** TRACK UPLOAD ****************************************/
  reset_upload_tracks: function() {
    this.set('tracks_to_upload', []);

    var sisbot = this.get_model('sisbot_id');
    sisbot.set('uploading_track', 'false'); // for UI spinner
  },
  on_file_upload: function(data, file, field) {
    console.log("On File Upload", data, file, field);

    var file_name = file.name.substr(0, file.name.lastIndexOf('.'));
    var regex = /.(svg|thr)$/;
    var file_type = file.name.match(regex)[1];
    var track_obj = {
      type: 'track',
      name: file_name,
      original_file_type: file_type,
      file_data: data
    };

    this.add('tracks_to_upload', track_obj);

    return this;
  },
  upload_tracks: function() {
    var self = this;
    var track_objs = this.get('tracks_to_upload');
    var publish_track = this.get('publish_track');
    var num_tracks = track_objs.length;

    _.each(track_objs, function(track_obj) {
      track_obj.is_published = publish_track;

      var track_model = app.collection.add(track_obj);

      if (track_model.get('data.original_file_type') == 'thr') track_model.set('data.verts', track_model.get('data.file_data')); // remove/change later
      else if (track_model.get('data.original_file_type') == 'svg') track_model.set('data.verts', track_model.process_svg(track_model.get('data.file_data')));

      track_model.set('upload_status', 'false'); // not uploaded yet

      // error checking
      if (track_model.get('errors').length > 0)
        console.log("Track error:", track_model.get('errors'));
    });

    // this.set('tracks_to_upload', []);
    console.log("Show preview", app.collection.get(track_objs[0].id).get('data'));

    // if (num_tracks > 1)
    // app.trigger('session:active', { track_id: 'false', secondary: 'tracks', primary: 'media' });
    app.trigger('session:active', {
      primary: 'settings',
      secondary: 'preview-upload',
      track_id: track_objs[0].id
    });

    return this;
  },
  process_upload_track: function() {
    var self = this;

    // Pause sisbot if not already
    var sisbot = this.get_model('sisbot_id');
    sisbot.set('uploading_track', 'true'); // for UI spinner

    var tracks_to_upload = self.get('tracks_to_upload');
    var track_model = app.collection.get(tracks_to_upload[0].id);
    track_model.set('upload_status', 'uploading'); // for spinner
    if (track_model.get('data.original_file_type') == 'draw') app.session.set('active.drawing_id', 'false'); // clear memory

    if (sisbot.get('data.state') == 'playing') {
      // wait for table to be paused
      function wait_to_upload() {
        if (sisbot.get('data.state') != 'playing') {
          // remove from tracks_to_upload, take to next preview page or this model's page
          tracks_to_upload.shift();

          if (tracks_to_upload.length > 0) {
            app.trigger('session:active', {
              primary: 'settings',
              secondary: 'preview-upload',
              track_id: tracks_to_upload[0].id
            });
          } else {
            app.trigger('session:active', {
              primary: 'media',
              secondary: 'track',
              track_id: track_model.id
            });
          }

          // save after, so preview image is made first
          track_model.upload_track_to_sisbot();
          // if (track_model.get('data.publish_track') == 'true') track_model.upload_track_to_cloud();
        } else {
          console.log("Wait longer for pause to finish");
          setTimeout(function() {
            wait_to_upload();
          }, 4000); // delay to be sure the table paused
        }
      }

      // call first, so it delays
      wait_to_upload();

      sisbot.pause();
    } else {
      // remove from tracks_to_upload, take to next preview page or this model's page
      tracks_to_upload.shift();

      if (tracks_to_upload.length > 0) {
        app.trigger('session:active', {
          primary: 'settings',
          secondary: 'preview-upload',
          track_id: tracks_to_upload[0].id
        });
      } else {
        app.trigger('session:active', {
          primary: 'media',
          secondary: 'track',
          track_id: track_model.id,
          goBack: 'tracks'
        });
      }

      // save after, so preview image is made first
      track_model.upload_track_to_sisbot();
      // if (track_model.get('data.publish_track') == 'true') track_model.upload_track_to_cloud();
    }
  },
  reject_upload_track: function() {
    var tracks_to_upload = this.get('tracks_to_upload');

    // remove from tracks_to_upload, take to next preview page or this model's page
    var track_obj = app.collection.get(tracks_to_upload.shift());

    // remove from collection
    app.collection.remove(track_obj.id);

    if (tracks_to_upload.length > 0) {
      app.trigger('session:active', {
        primary: 'settings',
        secondary: 'preview-upload',
        track_id: tracks_to_upload[0].id
      });
    } else if (track_obj.get('data.original_file_type') == 'draw') {
      app.session.set('active.drawing_id', 'false'); // clear memory
      app.trigger('session:active', {
        primary: 'media',
        secondary: 'draw',
        track_id: 'false'
      }); // TODO: reshow existing drawing?
    } else {
      app.trigger('session:active', {
        primary: 'settings',
        secondary: 'upload-track',
        track_id: 'false'
      });
    }
  },

  /**************************** DEMO ****************************************/
  setup_as_sisbot: function() {
    if (app.config.env == 'beta') {
      var hostname = 'sisbot-123.local';
    } else {
      var hostname = window.location.hostname;
    }

    this.set('sisbot_hostname', hostname);
    this.connect_to_sisbot();
  },
  setup_sisbot_select: function() {
    this.set('registration.email	', 'sisyphus@withease.io');
    this.set('registration.password', 'sodo');
    this.sign_in();
  },
  get_default_sisbot: function() {
    return this.default_data();
  },
  default_data: function() {
    var data = [{
      id: '57DB5833-72EF-4D16-BCD8-7B832B423554',
      pi_id: '',
      name: 'Sisyphus Table',
      type: 'sisbot',
      active_playlist_id: 'F42695C4-AE32-4956-8C7D-0FF6A7E9D492',
      active_track: {
        id: '1'
      },
      state: 'paused',
      software_version: '1.2.0',
      is_network_connected: 'false',
      is_internet_connected: 'false',
      is_serial_open: 'true',
      hostname: 'sisyphus-dummy.local',
      is_hotspot: 'false',
      hostname_prompt: 'false',
      do_not_remind: 'true',
      is_autodim: 'true',
      sleep_time: '10:00 PM',
      wake_time: '8:00 AM',
      is_nightlight: 'false',
      nightlight_brightness: .2,
      brightness: .5,
      speed: .3,
      default_playlist_id: 'F42695C4-AE32-4956-8C7D-0FF6A7E9D492',
      local_ip: '192.168.42.1',
      playlist_ids: ['F42695C4-AE32-4956-8C7D-0FF6A7E9D492',
        '3fdab229-5c60-4a86-8713-adb7edd494fe'
      ],
      track_ids: ['1',
        '2',
        '3', '4', '5', '6', '7', '8', '9'
      ]
    }, {
      id: 'F42695C4-AE32-4956-8C7D-0FF6A7E9D492',
      type: 'playlist',
      name: 'Default Playlist',
      description: 'Description of Default Playlist',
      created_by_name: 'Sisyphus Industries',
      is_saved: 'true',
      is_published: 'false',
      is_shuffle: 'true',
      is_loop: 'false',
      active_track_id: '2',
      active_track_index: '1',
      tracks: [{
        id: '1',
        reversible: 'false'
      }, {
        id: '2',
        reversible: 'false'
      }, {
        id: '3',
        reversible: 'false'
      }, {
        id: '1',
        reversible: 'false'
      }],
      sorted_tracks: [0, 1, 2, 3],
    }, {
      id: '3fdab229-5c60-4a86-8713-adb7edd494fe',
      type: 'playlist',
      name: 'Erase Playlist',
      description: 'Description of Default Playlist',
      created_by_name: 'Sisyphus Industries',
      is_saved: 'true',
      is_published: 'false',
      is_shuffle: 'true',
      is_loop: 'false',
      active_track_id: 'false',
      active_track_index: 'false',
      tracks: [{
        id: '2',
        reversible: 'false'
      }],
      sorted_tracks: [0],
    }, {
      id: '1',
      type: 'track',
      name: 'Erase',
      created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
      created_by_name: 'Sisyphus Industries',
    }, {
      id: '2',
      type: 'track',
      name: 'Tensig 1',
      created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
      created_by_name: 'Sisyphus Industries',
    }, {
      id: '3',
      type: 'track',
      name: 'Sine',
      created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
      created_by_name: 'Sisyphus Industries',
    }, {
      id: '4',
      type: 'track',
      name: 'Circam 2S',
      created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
      created_by_name: 'Sisyphus Industries',
    }, {
      id: '5',
      type: 'track',
      name: 'C Warp 3B',
      created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
      created_by_name: 'Sisyphus Industries',
    }, {
      id: '6',
      type: 'track',
      name: 'D Ces 4P',
      created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
      created_by_name: 'Sisyphus Industries',
    }, {
      id: '7',
      type: 'track',
      name: 'Hep',
      created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
      created_by_name: 'Sisyphus Industries',
    }, {
      id: '8',
      type: 'track',
      name: 'India 1P',
      created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
      created_by_name: 'Sisyphus Industries',
    }, {
      id: '9',
      type: 'track',
      name: 'Para 2B',
      created_by_id: '2B037165-209B-4C82-88C6-0FA4DEB08A08',
      created_by_name: 'Sisyphus Industries',
    }];

    return data;
  },
  setup_demo: function() {
    var self = this;

    this.setup_sisbot_select();

    setTimeout(function() {
      self.setup_as_sisbot();
    }, 250);

    return this;
  },

};

function newFunction() {
  return 'sisyphus_manager.data';
}
