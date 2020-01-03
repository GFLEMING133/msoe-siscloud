app.model.searchable_list = {
  defaults: function (data) {
    var obj = {
      id: data.id,
      type: 'searchable_list',
      errors: [],

      context_menu: 'false',
      is_ready: 'false',

      ready_timeout: 100,

      data: {
        id: data.id,
        type: 'searchable_list',
        deleted: 'false',
        version: this.current_version,

        list_type: 'generic',

        terms: {}, // added to cluster query
        //**** cluster query compares either key:value,  key:{comparator:'greaterthan|lessthan|equals',value:0}, or key:{comparator:'between',start:0,end:0}

        // search term
        q: {
          search_keys: ['data.name'],
          value: ''
        },

        sort: 'data.name',
        order: 'asc',

        query: "false",
        comparator: {
          key: "data.name",
          ord: "asc"
        }
      }
    };

    return obj;
  },
  ready_timer: null,
  current_version: 1,
  on_init: function () {
    // app.log("Init Searchable List", this.toJSON());
    this.listenTo(app.current_session(), 'change:active.organization_id', this.reset_query);

    this.on('change:data.sort', this.reset_comparator);
    this.on('change:data.order', this.reset_comparator);
    this.on('change:data.terms', this.reset_query);
    // this.on('change:data.q.value', this.reset_query);

    this.on('change:is_ready', this.size);

    // initialize values
    this.reset_comparator();
    this.reset_query();
  },
  update_q: function(data) {
    // app.log("Update q:", data);
    if (data == this) data = ''; // fix self reference on empty value

    this.set('is_ready', 'false');
    this.set('data.q.value', data);
    this.set('is_ready', 'true');
  },
  reset_query: function () {
    // app.log("Reset Query");
    var self = this;

    clearTimeout(this.ready_timer);
    this.stopListening(this.cluster);

    this.set('is_ready', 'false');

    var terms = JSON.parse(JSON.stringify(this.get('data.terms')));
    var obj = _.extend({
      type: this.get('data.list_type'),
      is_deleted: 'false'
    }, terms);

    this.set('data.query', JSON.stringify(obj));

    // app.log("Searchable List: Reset Query", JSON.stringify(obj));

    this.ready_timer = setTimeout(function () {
      self.set('is_ready', 'true')
        .size();

      self.listenTo(self.cluster, 'add', self.size);
      self.listenTo(self.cluster, 'remove', self.size);
    }, self.get('ready_timeout'));

    // app.log("Query Reset");
  },
  _get_keys: function (value) {
    var self = this;

    var return_values = [];
    var check_value = this.get(value);
    if (check_value) {
      var keys = _.keys(check_value);
      _.each(keys, function (key) {
        var concat_key = value + '.' + key;

        // keep going if this is an object
        if (_.isObject(check_value[key])) {
          var deeper_keys = self._get_keys(concat_key);
          _.each(deeper_keys, function (deep_key) {
            return_values.push(deep_key);
          });
        } else {
          return_values.push(concat_key);
        }
      });
    }

    return return_values;
  },
  reset_comparator: function () {
    var self = this;

    clearTimeout(this.ready_timer);

    this.set('is_ready', 'false');

    var obj = {
      key: this.get('data.sort'),
      ord: this.get('data.order')
    };
    this.set('data.comparator', obj);

    // app.log("Reset Comparator", JSON.stringify(this.get('data.comparator')));

    this.ready_timer = setTimeout(function () {
      self.set('is_ready', 'true');
    }, self.get('ready_timeout'));
  },
  save: function () {
    // do nothing
    return this;
  },
  /************************ MODELS ***************************************/
  size: function () {
    var self = this;
    if (this.get('is_ready') != 'true') return app.log("Searchable list not ready");

    var total = 0;
    this.cluster = app.collection.get_cluster(this.get('data.query'));

    this.set('size', this.cluster.size());

    // loop through existing sum/average/min/max and recalculate
    var check = ['sum', 'average', 'min', 'max'];
    _.each(check, function (value) {
      var keys = self._get_keys(value);
      _.each(keys, function (key) {
        // remove value. from start, run function with remaining key
        var original_key = key.substr(value.length + 1);
        self[value](original_key);
      });
    });

    return self;
  },
  /************************ CLUSTER MATH *********************************/
  sum: function (given_data) {
    if (this.get('is_ready') != 'true') return app.log("Searchable list not ready");

    var total = 0;
    this.cluster = app.collection.get_cluster(this.get('data.query'));

    cluster.each(function (model) {
      var value = model.get(given_data);
      if (value) total += +value;
    });

    this.set('sum.' + given_data, total);

    return self;
  },
  average: function (given_data) {
    if (this.get('is_ready') != 'true') return app.log("Searchable list not ready");

    var total = 0;
    var count = 0;
    this.cluster = app.collection.get_cluster(this.get('data.query'));

    cluster.each(function (model) {
      var value = model.get(given_data);
      if (value) {
        total += +value;
        count++;
      }
    });

    this.set('average.' + given_data, total / count);

    return self;
  },
  min: function (given_data) {
    if (this.get('is_ready') != 'true') return app.log("Searchable list not ready");

    var min = 'false';
    this.cluster = app.collection.get_cluster(this.get('data.query'));

    cluster.each(function (model) {
      var value = model.get(given_data);
      if (value && (min == 'false' || +value < min)) {
        min = +value;
      }
    });

    this.set('min.' + given_data, min);

    return self;
  },
  max: function (given_data) {
    if (this.get('is_ready') != 'true') return app.log("Searchable list not ready");

    var max = 0;
    this.cluster = app.collection.get_cluster(this.get('data.query'));

    cluster.each(function (model) {
      var value = model.get(given_data);
      if (value && +value > max) {
        max = +value;
      }
    });

    this.set('max.' + given_data, max);

    return self;
  }
};
