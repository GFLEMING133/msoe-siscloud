app.post = {
  initialize: function() {

  },
  fetch: function(data, cb, retry_count) {
    // if retry_count is not defined......which will be the case for all callers of app.plugins.fetch
    if (typeof retry_count == 'undefined') retry_count = 5;
    var _data = JSON.parse(JSON.stringify(data));

    var url = data._url || app.config.get_sisbot_url();
    var timeout = 30000;

    // console.log("Fetch: "+url+", "+data.endpoint);

    if (data.endpoint) url += data.endpoint;
    if (data._timeout) timeout = data._timeout;

    var type = data._type || 'POST';
    delete data._type;
    delete data._url;
    delete data._timeout;
    delete data.endpoint;

    var req_data = {
      data: JSON.stringify(data)
    };

    // if (app.current_user()) req_data.user = app.current_user().get('data');

    var obj = {
      url: url,
      type: type,
      data: req_data,
      xhrFields: {
        withCredentials: false
      },
      success: function(data) {
        // console.log("POST success", url, data);
        try {
          data = JSON.parse(data);
        } catch (err) {}

        if (_.isFunction(cb)) cb(data)
        else if (_.isString(cb)) app.trigger(cb, data);
      },
      error: function(resp) {
        if (retry_count <= 0) {
          console.log("POST Error:", url, resp.statusText);
          if (cb) cb({
            err: 'Could not make request',
            resp: null
          });
          return this;
        }

        setTimeout(function() {
          app.post.fetch(_data, cb, --retry_count);
        }, 5000);
      },
      timeout: timeout
    };
    if (obj.type == 'GET') delete obj.data;

    $.ajax(obj);
  },

  fetch2: function(data, cb, retry_count) {

    if (retry_count !== 0) retry_count = 5;
    var _data = JSON.parse(JSON.stringify(data));
    var url = data._url || app.config.get_sisbot_url();
    var timeout = 30000;
    var type = data._type || 'POST';
    if (data.endpoint) url += data.endpoint;
    if (data._timeout) timeout = data._timeout;

    var req_data = {
      data: JSON.stringify(data)
    };
    //  console.log('FETCH2 reg_data' + "" + JSON.stringify(req_data));
    // if (app.current_user()) req_data = app.current_user().get('data');
    var auth_token = app.session.get('auth_token');
    //  console.log('Auth_TOKEN in the APP.POST.JS', auth_token);
    var obj = {
      url: url,
      type: type,
      data: req_data,
      headers: {
        'Authorization': auth_token
      },
      success: function(data, status, xhr) {
        try {
          if (data && data.resp[0]) {
            if (typeof(data.resp[0].auth_token) != 'undefined') {
              app.session.set('auth_token', data.resp[0].auth_token);
            }
          }
          //console.log('NEXT_TOKEN ==', xhr.getResponseHeader('NEXT-TOKEN'));
          //console.log('TOKEN set to -', data.resp[0].auth_token)
        } catch (err) {
          console.log('Error in the catch fetch2() =', err);
        }

        if (_.isFunction(cb))
          cb(data)
        else if (_.isString(cb))
          app.trigger(cb, data);
      },
      error: function(resp) {
        // console.log('fetch2 resp error = ', resp.statusText);
        if (retry_count <= 0) {
          if (cb) cb({
            err: resp.statusText,
            resp: null
          });
          return this;
        }

        setTimeout(function() {
          app.post.fetch(_data, cb, --retry_count);
        }, 5000);
      },
      beforeSend: function(xhr) {
        xhr.setRequestHeader("Authorization", auth_token);
      },
      timeout: timeout
    }

    $.ajax(obj);
  }
};
