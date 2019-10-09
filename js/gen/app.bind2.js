var Binding = Backbone.View.extend({
  debug: false, // debug for Rendering
  render_wait: 25,
  is_rendering: false,
  render_start: null,
  render_count: 0,
  render_timeout: null,
  render_ids: [],
  element: null,
  initialize: function (opts) {
    _.extend(this, opts);

    if (this.debug) console.log("Binding opts", opts);
    this.element = new Element($(this.$el.children()[0]));
    this.element.is_changed = true; // force redraw first time

    this.start_listening();
    return this;
  },
  stop_listening: function() {
    this.stopListening(app, 'bind:stop_listening', this.stop_listening);
    this.stopListening(app, 'bind:render', this.render);

    this.listenTo(app, 'bind:start_listening', this.start_listening);
  },
  start_listening: function() {
    this.stopListening(app, 'bind:start_listening', this.start_listening);

    this.listenTo(app, 'bind:stop_listening', this.stop_listening);
    this.listenTo(app, 'bind:render', this.render);
  },
  get: function(id) {
    // console.log("Bind get", id);
    return this.element.get(id);
  },
  render: function(el_id) {
    var self = this;
    clearTimeout(this.render_timeout);

    if (this.render_count == 0) {
      this.render_ids.length = 0;
      this.render_start = new Date();
      if (this.debug) console.log("Bind: render start", this.render_start);
    }
    this.render_count++;

    if (el_id) this.render_ids.push(el_id);

    // queue up a render
    if (!this.is_rendering) {
      this.render_timeout = setTimeout(function() {
        self._render();
      }, self.render_wait);
    }
  },
  _render: function() {
    if (this.render_count <= 0) return this; // exit, unnecessary
    this.is_rendering = true; // mark as rendering

    var render_els = _.uniq(this.render_ids);
    if (this.debug) console.log("Bind Render:", render_els);

    var render_start_count = this.render_count;

    var render_begin = new Date();
    if (this.debug) console.log("Bind: render begin", this.render_count, (render_begin - this.render_start)+'ms', this.render_start);

    // get template to add to this DOM element
    if (this.element.is_changed) this.$el.html(this.element.html());
    else this.element.render();

    var render_end = new Date();

    if (this.render_count > render_start_count) {
      if (this.debug) console.warn("Extra renders may have been missed, re-rendering...");
      return this._render(); //this.element.render();
    }

    if (this.debug) console.log("Bind: render end", this.render_count, (render_end - render_begin)+'ms', 'total', (render_end - this.render_start)+'ms', this.render_start);
    this.render_count = 0;
    this.is_rendering = false;

    app.trigger('bind:after_render');
    return this;
  }
});

/* Element values
  data:
    data-is-plain :: ignores scripting, renders all values as plain text (i.e. '{{= model.data.value }}' stays as that exact string )
    data-scope :: makes a temporary model for this element (and children) that is not in the collection
    data-model :: set the model to an id of a model in the collection
    data-state :: sets the values outside the model's data variable
    data-defaults :: sets the values in the model's data variable
    data-if :: comparison of if the element and children should be shown
    data-foreach :: loops through the values given, using the first child as the repeated element OR cluster to loop through given cluster
    data-foreach-map :: assigns children the model of the current iteree (assumes array is an array of model ids)
    data-cluster :: object with values that all models must have to be included in loop
    data-cluster-comparator :: sorts the cluster, {key:'data.name','ord':'asc'}
    data-cluster-search :: search through given models for matching values, expects model reference or object with value: { search_keys: [], value:"string" }
    data-template :: sets child element to the html of the given filename (no .html necessary)
    data-fallback :: sets the child element to the html of the given filename if the data-template is not found
    data-publish :: trigger key when data-on-click is set to publish (i.e. data-publish="session:active" == app.trigger('session:active') )
    data-msg :: pass values to functions called via events (i.e. data-on-click)
    data-field :: associated model variable, used with form elements
    data-checked :: is checkbox checked (true|false)
    data-placeholder :: input placeholder text
    data-replace :: for img elements, if the src fails to load, show this template instead. Use with data-on-error="replace".
    data-debug :: console.log info about the element during runtime
  data-on:
    data-on-click :: triggers event on element click, calling function (i.e. set, back, forward)
    data-on-key-enter :: triggers event on Enter key being pressed, while this element is active
    data-on-mouse-over :: triggers event on mouseOver of element
    data-on-mouse-out :: triggers event on mouseOut of element
    data-on-error :: calls function on current model when img src fails to load, used in conjunction with data-replace
  lib:
    lib-chosen :: select elements
    lib-dragula :: drag/drop
    lib-chart :: pie/bar chart
    lib-flatpickr :: date/time picker
    lib-sortable :: drag/drop ordering
*/
function Element(el, parent, _scope) {
  this._scope = null;
  this.scope = null;
  this.model = null;
  this.parents =[]; // parent models, not elements,
  this.parent_element = null; // element containing this
  this.$el = null;
  this.el_id = null;
  this.subviews = [];
  this.data = {};

  this.listeners = [];
  this.triggers = [];
  this.events = [];
  this.libraries = {};

  this.show_comments = false; // show/hide <!-- comments -->
  this.show_data = true; // show/hide data-____ values in html
  this.show_lib = false;
  this.show_tg = false;

  this.el_type = null;
  this.el_text = null;
  this.el = { class: '' }; // attributes as given by html
  this.r_el = {}; // attributes as will be rendered to screen
  this.template  = null;

  this.is_h__k = false;
  this.is_hidden = false;
  this.is_changed = true;
  this.is_model_changed = true;
  this.is_event = false; // has (on) events associated
  this.is_lib = false; // uses additional library

  /*************************** INIT *****************************************/
  this.initialize = function(el, parent, _scope) {
    var self = this;

    // console.log("Init", el, parent, _scope);
    if (_scope) this._scope = _scope;

    // cache html element
    if (!this.$el) this.$el = el;

    // parent Element
    if (parent) this.parent_element = parent;

    // comments
    if (el.nodeType === 8) {
      this.el_type = 'comment';
      this.el_text = el.nodeValue;
    } else {
      // element type
      var tag = el.prop('tagName');
      if (tag) {
        this.el_type = el.prop('tagName');

        // attributes
        _.each(el[0].attributes, function(attr, index) {
          self.el[attr.name] = attr.value;
        });

        if (!this.el.class) this.el.class = '';
        if (_.isObject(this.el.class)) this.el.class = this.el.class.baseVal;

        // test for hidden
        if (this.el.class.match(/\s?hidden[^-_a-z0-9]\s?/i)) this.is_hidden = true;

        // check for events, libraries
        var keys = _.keys(this.el);
        _.each(keys, function(key) {
          if (key.indexOf('data') == 0) self.is_h__k = true;
          if (key.indexOf('data-on') == 0) self.is_event = true;
          if (key.indexOf('lib-') == 0) {
            self.is_lib = true;
            self.is_h__k = true;
          }
          if (self.el[key].indexOf('{{') > -1) self.is_h__k = true;
        });

        // do not run functions/replacements if data-is-plain;
        if (this.el['data-is-plain']) {
          this.is_h__k = false;
          console.log("Make plain", this.el);
        }

        if (this.is_h__k) {
          this.el_id = _.uniqueId('e_');
          this.data = el.data();

          if (this.data.debug) console.log("Debug el{}", this.el);

          // listen for change on inputs
          if (['SELECT', 'INPUT', 'TEXTAREA'].indexOf(this.el_type) > -1) this.is_event = true;
        }
      } else {
        // text element
        this.el_text = el.text();

        if (this.el_text && this.el_text.trim() != '' && !this.parent_element.el['data-is-plain']) {
          try {
            var list = _.chain(this.el_text.match(/\{\{(.*?)\}\}/gi))
                .map(function(r) {
                  var listeners = r.match(/(app|session|manager|scope|model|cluster|parents?|grandparent|g_grandparent|g_g_grandparent|g_g_g_grandparent)[a-zA-Z.0-9:_\[\]\-']+/gi);
                  return listeners;
                }).flatten().compact().value();
            if (list.length > 0) { // check for listeners in this text
              this.parent_element.is_h__k = true; // add listeners if not forced plain
              if (!this.parent_element.el_id) this.parent_element.el_id = _.uniqueId('e_');
            }
          } catch (err) {
            console.log("el.nodeType", el, el.nodeType, err);
          }
        }
      }
    }

    // console.log("El", this.el, this.data);
    return this;
  };
  this.after_init = function() {
    this.prerender();
  };
  this.prerender = function() {
    var self = this;

    if (this.is_changed) {
      // remove old Listeners
      if (this.listeners.length > 0) this.remove_listeners();

      this.setup_model();
      // listen for model to be fetched?
      if (this.model.get('is_fetching') == 'true') {
        this.listenToOnce(this.model, 'change:is_fetched', function() {
          self.is_changed = true;
          app.trigger('bind:render');
        });
      } else {
        if (this.data.run) this._call(this.data.run, this.data.runMsg);
        if (!_.isEmpty(this.data) && this.data.if) this.if();
        this.add_subviews(this.$el);

        this.setup_listeners();

        if (this.el_text && this.parent_element.data.debug) console.log('El_text', this.get_value(this.el_text));
      }

      this.is_changed = false;
    }
  };
  this.setup_events = function() {
    this.clear_events();

    if (this.is_event) {
      var $el = $('.'+this.el_id);

      // console.log("Setup Events", this.el, this.events);
      if (['SELECT', 'INPUT', 'TEXTAREA'].indexOf(this.el_type) > -1) {
        this.events.push('change');
        $el.on('change', {el:this}, this.change);
      }
      if (this.data.onClick) {
        this.events.push('click');
        $el.on('click', {el:this}, this.on_click);
      }
      if (this.data.onInput) {
        this.events.push('input');
        $el.on('input', {el:this}, this.on_input);
      }
      if (this.data.onKeyEnter) {
        this.events.push('keydown');
        $el.on('keydown', {el:this}, this.on_key);
      }
      if (this.data.onMouseOver) {
        this.events.push('mouseover');
        $el.on('mouseover', {el:this}, this.on_mouse_over);
      }
      if (this.data.onMouseOut) {
        this.events.push('mouseout');
        $el.on('mouseout', {el:this}, this.on_mouse_out);
      }
      if (this.data.onError) {
        this.events.push('error');
        if (this.data.onError == 'replace') $el.on('error', {el:this, replace:this.data.replace}, this.on_error);
        else $el.on('error', {el:this}, this.on_error);
      }
    }
  };
  this.clear_events = function() {
    if (this.is_event) {
      var self = this;

      _.each(this.events, function(event) {
        $('.'+self.el_id).off(event);
      });
      this.events.length = 0;
    }
  };
  this.setup_libs = function() {
    var self = this;

    _.each(self.el, function(value, key) {
      if (key.indexOf('lib-') == 0) {
        // console.log("Setup Lib", key, value);
        var library_name = key.replace(/^lib-/i, '');
        if (_.isFunction(self[library_name])) self[library_name]();
        else console.log("Unknown library", library_name, self.el_id);
      }
    });
  };
  this.checked = function () {
      if (!this.data.field) return console.log("No field to match with checkbox, add data-field.");

      var model       = this.get_model(this.data.field);
      var field       = this.get_field(this.data.field);
      var ref         = model.get(field);
      var value       = this.get_value(this.data.checked);
      var is_checked  = (_.isArray(ref)) ? _.contains(ref, value) : ('' + ref) == ('' + value);

      var $el = $('.'+this.el_id);
      if ($el) $el.prop('checked', is_checked);
  };
  this.selected = function () {
      if (!this.data.field) return console.log("No field to match with selected, add data-field.");

      var model   = this.get_model(this.data.field);
      var field   = this.get_field(this.data.field);
      var val     = model.get(field);

      var $el = $('.'+this.el_id);
      if ($el) $el.val(val);
  };
  this.remove = function() {
    var self = this;
    // console.log("Remove", this.el_id);

    this.remove_listeners();

    // remove/destroy library components
    if (this.is_lib) {
      // console.log("Remove Libraries", _.keys(this.libraries));
      var libs = _.keys(this.libraries);
      _.each(libs, function(key) {
        if (self.libraries[key]) {
          if (self[key+'_remove'] && _.isFunction(self[key+'_remove'])) self[key+'_remove']();
          delete self.libraries[key];
        }
      });
    }

    this.remove_children();
  };
  this.remove_children = function() {
    var self = this;

    var subview_count = this.subviews.length;
    if (subview_count > 0) {
      // remove each child
      for (var i=subview_count-1; i>=0; i--) {
        var subview = self.subviews.pop();
        subview.remove();
      }
    }
  };
  /***************************** FIND ***************************************/
  this.get = function(id) {
    var self = this;

    // render self if subview changed
    if (this.el_id == id) return this;
    else {
      // render only changed subviews
      var found_element;
      _.each(this.subviews, function(child_el) {
        var found = child_el.get(id);
        if (found !== false) found_element = found;
      });

      if (found_element) return found_element;
    }

    return false;
  };
  /***************************** PRIVATE REFERENCES *************************/
  this._ref = function (ref, data) {
      var layers		= ref.split('.');
      var fn			= this;

      _.each(layers, function(layer) {
          fn = fn[layer];
      });

      return fn;
  };
  this._fix_legacy_ref = function(ref) {
    var returnValue = ref;

    var matching = ref.match(/^(parent|grandparent|g_grandparent|g_g_grandparent|g_g_g_grandparent)/i);
    if (matching) {
      switch(matching[1]) {
        case 'parent':
          returnValue = ref.replace(/^parent/, 'parents[0]');
          break;
        case 'grandparent':
          returnValue = ref.replace(/^grandparent/, 'parents[1]');
          break;
        case 'g_grandparent':
          returnValue = ref.replace(/^g_grandparent/, 'parents[2]');
          break;
        case 'g_g_grandparent':
          returnValue = ref.replace(/^g_g_grandparent/, 'parents[3]');
          break;
        case 'g_g_g_grandparent':
          returnValue = ref.replace(/^g_g_g_grandparent/, 'parents[4]');
          break;
      }
    }

    return returnValue;
  };
  this._call = function (ref, data) {
    var self = this;

    if (data && _.isString(data)) data = this.get_value(data);

    // ? Call more than one function ?
    if (ref.indexOf('|') > -1) return _.each(ref.split('|'), function (ind) { self._call(ind, data); });

    // fix legacy ref
    ref = this._fix_legacy_ref(ref);

    var layers		= ref.split('.');
    var obj			  = this;
    var fn        = this;
    var l         = layers.length;

    try {
      // console.log("Fn", layers, obj, fn, data);
      _.each(layers, function(layer, index) {
        // check for array string
        var arr_match = layer.match(/([a-z0-9]+)\[([a-z0-9_]+)\]/i);

        if (arr_match) obj = obj[arr_match[1]][arr_match[2]];
        else obj = obj[layer];

        if (--l > 0) {
          if (arr_match) fn = fn[arr_match[1]][arr_match[2]];
          else fn = fn[layer];
        }
      });
    } catch (err) {
      console.log('_call: error', err);
    }

    try {
      // console.log("_call", obj, fn, data);
      return obj.call(fn, data || this.model);
    } catch(err) {
      console.log('_CALL ERROR', err, fn, obj, layers, this);
    }
  };
  /***************************** SETUP MODEL ********************************/
  this.setup_model = function () {
    if (!this.is_model_changed) return; // exit if model not changed

    var self = this;
    var scope       = (this._scope) ? this._scope : { value: false, index: false }
    this.scope      = app.neuron(scope);
    if (this._scope && this.data.debug) console.log("Setup scope", this._scope, this.scope);

    // inherit model/parents from parent element
    if (this.parent_element) {
      this.model = this.parent_element.model;
      this.parents = [];
      _.each(this.parent_element.parents, function(model) {
        self.parents.push(model);
      });
      // this.parents = JSON.parse(JSON.stringify(this.parent_element.parents));
    }

    if (this.data.scope) {
      if (this.model)         this.parents.unshift(this.model);
      if (this.data && this.data.defaults) this.model = app.neuron(this.get_value(this.data.defaults));
      else this.model  = app.neuron();
    }

    if (this.data.model && this.data.model != 'false') {
      var value               = this.get_value(this.data.model);
      if (this.model)         this.parents.unshift(this.model);
      this.model              = app.collection.get(value);
    }

    if (!this.model) {
      if (this.parent_element && this.parent_element.model) this.model = this.parent_element.model;
      else this.model = app.neuron();
    }

    if (this.data.state) this.model.set(this.get_value(this.data.state));

    this.is_model_changed = false;
  };
  this.get_subvalue = function(val) {
    try {
      var returnValue = _.templateSub(val)(this.get_json());
      return returnValue;
    } catch(err) {
      console.log('get_subvalue: err', val);
    }
  };
  this.get_value = function(val, plain_text) {
    var self    = this;
    var err_out = false;
    // console.log("Get Value", val);
    var _start_val = val;

    if (!val || val == true) return val;
    if (!_.isString(val)) val = val.toString();

    if (val.indexOf('{[') > -1) val = this.get_subvalue(val);

    if (val.indexOf('{{') > -1) { // we have a template
      try {
        var tmp   = app.templates.create(val, self);
        var json  = this.get_json();
        val       = tmp(json);
        if (self.data.debug) console.log("Template", _start_val, val);
      } catch (err) {
        err_out = true;
        console.log('get_value: template err ', self.$el, _start_val, val, json, err);
      }
    }

    // is object, parse and strip of single quotes
    if (!plain_text && err_out == false && val.indexOf('{') > -1) {
      try {
        val = JSON.parse(val.replace(/\'/gi, '"'));
      } catch(err) {
        err_out = true;
        console.log('get_value: parse error', val, err)
      }
    }

    // if (err_out == false && val && val.indexOf && val.indexOf('ref::') > -1) {
    //     val     = this._ref(val.replace('ref::',''));
    // }

    if (this.data.debug) console.log("Return Value", val);
    return val;
  };
  this.get_model = function(str) {
    var splt        = str.split('.');
    var target      = this;
    var context     = splt.shift();
    var context_index = -1;

    // legacy fix
    switch (context) {
      case 'manager':
        target = app;
        break;
      case 'session':
        target = app;
        break;
      case 'parent':
        context = 'parents';
        context_index = 0;
        break;
      case 'grandparent':
        context = 'parents';
        context_index = 1;
        break;
      case 'g_grandparent':
        context = 'parents';
        context_index = 2;
        break;
      case 'g_g_grandparent':
        context = 'parents';
        context_index = 3;
        break;
    }

    // fix parents[]
    var parents_match = context.match(/^parents\[([0-9]+)\]/);
    if (parents_match) {
      context = 'parents';
      context_index = parents_match[1];
    }

    var model;
    if (context_index > -1) {
      model = target[context][context_index];
    } else {
      model = target[context];
    }

    return model;
  };
  this.get_field = function(val) {
    var field   = this.get_value(val);
    field = field.replace(/^(session|manager|model|cluster|parents?|grandparent|g_grandparent|g_g_grandparent|g_g_g_grandparent|scope)\./, '');

    return field;
  };
  this.get_json = function () {
    var self            = this;
    var json            = {
      model   : this.model.attributes,
      tmp     : app.templates.get,
      scope   : this.scope.attributes,
      manager : app.manager.attributes,
      session : app.session.attributes,
      _super_ : {},
      _self_  : {}
    };

    if (this.parent_element && this.parent_element.el_id) json._super_.el_id = this.parent_element.el_id;
    if (this.el_id) json._self_.el_id = this.el_id;

    var user = app.manager.get_model('user_id');
    if (user) {
      json.user         = user.attributes;
      // json._user_       = user;
    }

    if (this.parents.length > 0) {
      json.parents = [];
      _.each(this.parents, function(model, i) {
        json.parents[i] = model.attributes;

        // to work with old versions
        switch (i) {
          case 0:
            json.parent = json.parents[i];
            break;
          case 1:
            json.grandparent = json.parents[i];
            break;
          case 2:
            json.g_grandparent = json.parents[i];
            break;
          case 3:
            json.g_g_grandparent = json.parents[i];
            break;
          case 4:
            json.g_g_g_grandparent = json.parents[i];
            break;
        }
      });
      // json.parent         = this.parents[0].attributes;
      // json._parent_       = this.parents[0];
    }

    // if (this.cluster) json._cluster_      = this.cluster;

    return json;
  };
  this.remove_listeners = function() {
    var self = this;

    _.each(this.listeners, function(val) {
      var splt        = val.split('.');
      var context     = splt.shift(); // unused, just cut off first
      var field       = splt.join('.');
      var changes     = (splt.length > 0) ? ['change:' + field] : ['all'];

      var listen_model = self.get_model(val);

      if (_.isString(listen_model)) listen_model = app.collection.get(listen_model);

      // check if value is array
      if (field && _.isArray(listen_model.get(field))) {
        changes.push('add:'+field);
        changes.push('remove:'+field);
      }

      _.each(changes, function(change) {
        var trigger_str = listen_model.id+'|'+change;

        self.stopListening(listen_model,    change,     self.triggers[trigger_str]);
      });
    });

    // remove events
    if (this.is_event) this.clear_events();

    this.stopListening(app, 'bind:after_render', this.after_render);

    this.listeners.length = 0;
  };
  this.setup_listeners = function() {
    var self = this;

    var listeners = this.listeners;

    // text listeners
    if (this.el_text) {
      var list = this._get_listeners(this.el_text);
      listeners = listeners.concat(list);
      if (this.parent_element.data.debug && listeners.length > 0) console.log(this.el_text, "Text Listeners", listeners);
    }

    // attribute listeners
    _.each(this.el, function(attr, key) {
      var list = self._get_listeners(attr);
      // if (self.data.debug) console.log("Attr", key, attr, list);

      var r_key = attr;

      // special case for data-model, as heirarchy will change this ref
      if (key == 'data-model' && list.length > 0) {
        _.each(list, function(value, index) {
          if (value.indexOf('g_g_grandparent.') == 0) {
            r_key = r_key.replace(/[\s=]+g_g_grandparent/, '= parents[4]');
            list[index] = value.replace(/^g_g_grandparent/, 'parents[4]');
          }
          if (value.indexOf('g_grandparent.') == 0)  {
            r_key = r_key.replace(/[\s=]+g_grandparent/, '= parents[3]');
            list[index] = value.replace(/^g_grandparent/, 'parents[3]');
          }
          if (value.indexOf('grandparent.') == 0) {
            r_key = r_key.replace(/[\s=]+grandparent/, '= parents[2]');
            list[index] = value.replace(/^grandparent/, 'parents[2]');
          }
          if (value.indexOf('parent.') == 0) {
            r_key = r_key.replace(/[\s=]+parent/, '= parents[1]');
            list[index] = value.replace(/^parent/, 'parents[1]');
          }
          if (value.indexOf('model.') == 0) {
            r_key = r_key.replace(/[\s=]+model/, '= parents[0]');
            list[index] = value.replace(/^model/, 'parents[0]');
          }
        });
      }

      // save attribute values as templated
      if (list.length > 0) {
        if (key == 'class') {
          var classes = '';
          if (self.is_hidden) classes += 'hidden ';
          if (self.el_id) classes += self.el_id+' ';
          classes += self.get_value(r_key);

          self.r_el[key] = classes;

          // console.log("Attr listeners", key, self.el[key], self.r_el[key]);
        } else self.r_el[key] = self.get_value(r_key);
      }

      // add to whole list
      listeners = listeners.concat(list);
    });

    if (this.data.debug) console.log(this.el_id, "Listeners", this.data, listeners);

    if (this.data.foreach) {
      var _foreach = this.get_value(this.data.foreach);
      // console.log("Foreach listeners", _foreach, listeners);
      var model = this.get_model(_foreach);
      if (model) {
        var field = this.get_field(_foreach);

        // console.log("Foreach", _foreach, field);
        self.triggers['_foreach'] = function () {
          // if (self.data.debug || self.el_text) console.log("Foreach Triggered: ", val, trigger_str, self.el_id);
          // remove children right away
          self.remove_children();

          // make sure to refresh values on redraw
          self.is_changed = true;

          app.trigger('bind:render'); // render since new templates got added
        }
        this.listenTo(model, 'add:'+field,     self.triggers['_foreach']);
        this.listenTo(model, 'change:'+field,  self.triggers['_foreach']);
        this.listenTo(model, 'remove:'+field,  self.triggers['_foreach']);
        this.listenTo(model, 'sort:'+field,    self.triggers['_foreach']);
      }
    }

    if (listeners.length > 0) {
      this.listeners = _.uniq(listeners);
      // if (this.data.debug || this.el_text) console.log("this.listeners", this.listeners);

      _.each(self.listeners, function(val) {
        var splt        = val.split('.');
        var context     = splt.shift();
        var field       = splt.join('.');
        var changes     = (splt.length > 0) ? ['change:' + field] : ['all'];

        var model = self.get_model(val);
        var listen_model;

        if (_.isString(model)) listen_model = app.collection.get(model);
        else listen_model = model;

        if (!listen_model) return console.log("Could not find model", model);

        // check if value is array
        if (field) {
          var field_value;
          try {
            field_value = listen_model.get(field);
          } catch(err) {
            console.log("Field Err", err, listen_model, field);
          }
          if (_.isArray(field_value)) {
            changes.push('add:'+field);
            changes.push('remove:'+field);
          }
        }

        // add listeners
        _.each(changes, function(change) {
          var trigger_str = listen_model.id+'|'+change;
          if (self.data.debug) console.log("Listen to", self.$el, self.el_id, val, trigger_str);
          self.triggers[trigger_str] = function () {
            var is_change = false;

            if (self.data.debug) console.log("Listener triggered", self.el_id, trigger_str);

            // check if attributes really changed
            _.each(self.r_el, function(old_value, key) {
              var new_value = self.get_value(self.el[key]);

              // class specific check
              if (key == 'class') {
                var classes = '';
                if (self.is_hidden) classes += 'hidden ';
                if (self.el_id) classes += self.el_id+' ';
                classes += new_value;

                new_value = classes;
              }

              // fix non-string values
              if (!_.isString(old_value)) old_value = JSON.stringify(old_value);
              if (!_.isString(new_value)) new_value = JSON.stringify(new_value);

              if (new_value != old_value) {
                if (key == 'data-if' && !new_value.match(/<|>/i)) { // mark as changed if comparing < or > values
                  var old_if = !self.is_hidden;
                  var new_if = self.if(new_value);
                  if (old_if != new_if) is_change = true;
                } else if (key.match(/^data-(model|scope|defaults|state)$/i)) {
                  self.is_model_changed = true;
                  is_change = true;
                } else is_change = true;
              }
            });

            // check if text, mark changed
            if (self.el_text) is_change = true;

            if (self.data.debug) console.log("Listener is change:", self.el_id, is_change, trigger_str);
            if (is_change) {
              self.is_changed = true;

              // remove children right away
              self.remove_children();

              // make sure to refresh parent if text element
              if (self.el_text) self.parent_element.is_changed = true;

              app.trigger('bind:render'); // render since new templates got added
            }
          }

          self.listenTo(listen_model,    change,     self.triggers[trigger_str]);
        });
      });
    }

    this.listenTo(app, 'bind:after_render', this.after_render);
  };
  this._get_listeners = function(string) {
    var list = [];

    if (string.trim() == '') return list;

    // by subvalues
    if (string.indexOf('{[') > -1) {
      var sublist = _.chain(string.match(/\{\[(.*?)\]\}/gi))
      .map(function(r) {
        var listeners = r.match(/(session|manager|scope|model|cluster|parents?|grandparent|g_grandparent|g_g_grandparent|g_g_g_grandparent)[a-zA-Z.0-9:_\[\]\-']+/gi);
        listeners = _.map(listeners, function(l) { return l.replace(/\['/gi, "[").replace(/'\]/gi, "]"); });
        return listeners;
      })
      .flatten()
      .compact()
      .value();

      list = list.concat(sublist);

      string = this.get_subvalue(string);
    }

    // by template
    if (string.indexOf('{{') > -1) {
      var tmp_list = _.chain(string.match(/\{\{(.*?)\}\}/gi))
        .map(function(r) {
          var listeners = r.match(/(session|manager|scope|model|cluster|parents?|grandparent|g_grandparent|g_g_grandparent|g_g_g_grandparent)[a-zA-Z.0-9:_\[\]\-']+/gi);
          listeners = _.map(listeners, function(l) { return l.replace(/\['/gi, ".").replace(/'\]/gi, ""); });
          // if (self.data.debug) console.log(attr, "Listeners", listeners);
          return listeners;
        })
        .flatten()
        .compact()
        .value();

      list = list.concat(tmp_list);
    }

    return list;
  };
  /***************************** LOGIC **************************************/
  this.if = function (data) {
    // run if on given data, or this.data.if
    var compare;
    if (data) compare = data;
    else compare = this.get_value(this.data.if);

    // split string out for comparison
    var statement   = compare.split(/\s?(\=\=|\!\=\=|\<\=?|\>\=?)\s?/);
    var first       = '' + statement[0];
    var comparator  = statement[1];
    var second      = '' + statement[2];
    var is_true     = false;

    // evaluate
    if (comparator == '==' && first == second)          is_true = true;
    else if (comparator == '!==' && first !== second)   is_true = true;
    else if (comparator == '>' && +first > +second)     is_true = true;
    else if (comparator == '>=' && +first >= +second)   is_true = true;
    else if (comparator == '<' && +first < +second)     is_true = true;
    else if (comparator == '<=' && +first <= +second)   is_true = true;

    // change visibility
    this.is_hidden = !is_true;

    return is_true;
  };
  /***************************** CHILD CHAINING ***************************/
  this.add_subviews = function(el) {
    var self = this;

    self.remove_children();

    if (this.is_hidden) return; // don't bother
    if (this.el_type == 'comment') return; // don't bother

    if (this.data.foreach) {
      // loop through and add subviews based on the first child
      this.foreach(el);
    } else if (this.data.template && this.data.template != 'false') { // load template
      var template_value = this.get_value(this.data.template);

      app.templates.fetch(template_value, function(resp) {
        if (resp.match(/^Error loading template:/i)) {
          if (self.data.fallback) {
            // get fallback template
            var fallback_value = self.get_value(self.data.fallback);

            app.templates.fetch(fallback_value, function(resp) {
              if (self.template !== resp) {
                self.is_changed = true;
                self.template = resp;
              }

              self.subviews.push(new Element($(self.template), self, self._scope));

              if (self.data.debug) console.log("Fallback Resp", resp);
              app.trigger('bind:render'); // render since new templates got added
            });

            return console.log(resp, 'Replace with ' + self.data.fallback);
          } else return console.log(resp);
        }

        if (self.template !== resp) {
          self.is_changed = true;
          self.template = resp;
        }

        self.subviews.push(new Element($(self.template), self, self._scope));

        if (self.data.debug) console.log("Resp", resp);
        app.trigger('bind:render'); // render since new templates got added
      });
    } else if (el.contents().length > 0) {
      _.each(el.contents(), function(child, i) {
        if (child.nodeType === Node.COMMENT_NODE) {
          self.subviews.push(new Element(child, self, self._scope));
        } else if (child.nodeType === Node.TEXT_NODE) {
          var text_value = $(child).text();
          // only bother rendering non-empty text subviews
          if (text_value && text_value != '') {
            var child = new Element($(child), self, self._scope);
            self.subviews.push(child);

            // add (text) child listeners to this
            if (child.listeners.length > 0) self.listeners = self.listeners.concat(child.listeners);
          }
        } else if (child.nodeType === Node.ELEMENT_NODE) self.subviews.push(new Element($(child), self, self._scope));
        else console.log("Unknown nodeType", child.nodeType, child);
      });
    }
  };
  this.foreach = function(el) {
    var self = this;

    if (self.data.debug) console.log("Foreach element", el);

    var loop_element;
    _.each(el.contents(), function(child, i) {
      if (child.nodeType === Node.COMMENT_NODE) {
        self.subviews.push(new Element(child, self));
      } else if (!loop_element && child.nodeType === Node.ELEMENT_NODE) loop_element = child;
    });

    // <select> default values
    if (this.el_type == 'SELECT') {
      var defaultValue    = this.get_value('' + this.data.foreachDefaultValue) || 'false';
      var defaultLabel    = this.get_value(this.data.foreachDefault) || '';
      self.subviews.push(new Element($('<option value="' + defaultValue + '">' + defaultLabel + '</option>'), self));
    }

    // get list to loop through
    var _foreach = this.get_value(this.data.foreach);
    if (_foreach == 'cluster') {
      // console.log("Foreach cluster", this.data.foreach, this.get_value(this.data.cluster));

      // run cluster query for list
      var cluster = app.collection.get_cluster(this.get_value(this.data.cluster));

      // sort cluster
      if (self.data.clusterComparator) {
        var value = self.get_value(self.data.clusterComparator);

        if (_.isString(value)) {
          var model = self.get_model(value);
          if (model) {
            var field = self.get_field(self.data.clusterComparator);

            value = model.get(field);
          } else console.log("No model found, use value", value);
        }

        // set the sorting of the cluster
        cluster._comparator = value;
        cluster.sort();
      }

      var search_obj;
      if (self.data.clusterSearch) {
        search_obj = self.get_value(self.data.clusterSearch);

        if (_.isString(search_obj)) {
          var model = self.get_model(search_obj);
          if (model) {
            var field = self.get_field(search_obj);

            search_obj = model.get(field);
          } else console.log("No model found, for clusterSearch value", search_obj);
        }
      }

      // console.log("Cluster results", cluster);
      var index = 0;
      cluster.each(function(item) {
        var include = true;

        if (self.data.clusterSearch && search_obj) {
          if (search_obj.value && search_obj.value != "") {
            var search_string = JSON.stringify(search_obj);

            if (item.get('searches') && item.get('searches')[search_string] == true) {
              // nothing, do include
            } else {
              include = false;

              // loop through given keys looking for key/value indexOf match
              var match = false;
              _.each(search_obj.search_keys, function(search_key) {
                var model_value = item.get(search_key);
                if (model_value && model_value.toString().toLowerCase().indexOf(search_obj.value.toLowerCase()) >= 0) match = true;
              });

              // cache results to the model
              item.set('searches.'+search_string, match);

              // add to results if good
              if (match) include = true;
            }
          }
        }

        if (self.data.foreachLimit && index >= +self.data.foreachLimit) include = false;

        if (include) {
          // loop through list
          var _scope = { index: index };
          var new_element = $(loop_element.cloneNode(true));

          new_element.attr('data-model', item.id);

          // add subviews
          // console.log("Add foreach element", item, index, is_map, _scope);
          self.subviews.push(new Element(new_element, self, _scope));

          index++;
        }
      });
    } else {
      var list = [];
      if (_foreach.match(/^\[.*?\]$/)) {
        _foreach = _foreach.replace(/(^\[)|(\]$)/g, ''); // remove array ends
        if (_foreach == '') return; // exit out of empty array
        list = _foreach.split(',');
      } else if (_foreach.match(/^(session.|manager.|scope.|model.|parents?.|grandparent.|g_grandparent.|g_g_grandparent.)/i)) {
        var model = this.get_model(_foreach);
        var field = this.get_field(_foreach);
        list = model.get(field);
        if (_.isString(list)) list = [list];
      } else console.log("Unknown foreach", _foreach);

      // map to [{obj, index}]
      list = _.map(list, function(obj, index) { return { obj: obj, index: index }; });

      // treat values as model.id's?
      var is_map = false;
      if (this.data.foreachMap) is_map = true;

      if (self.data.debug) console.log("Add foreach element", JSON.stringify(list));

      // loop through list
      _.each(list, function(item, count) {
        if (!self.data.foreachLimit || (self.data.foreachLimit && count < +self.data.foreachLimit)) {
          var _scope = {
            index: item.index,
            count: count
          };
          var new_element = $(loop_element.cloneNode(true));

          if (is_map) {
            if (_.isObject(item.obj)) new_element.attr('data-model', item.obj.id);
            else new_element.attr('data-model', item.obj);
          } else _scope.value = item.obj;

          // add subviews
          if (self.data.debug) console.log("Add foreach element", item.obj, item.index, count, is_map, JSON.stringify(_scope));
          self.subviews.push(new Element(new_element, self, _scope));
        }
      });

    }
  };
  /***************************** ROUTING ************************************/
  this.back = function () {
      window.history.back();
  };
  this.forward = function () {
      window.history.forward();
  };
  this.href = function () {
      var href = this.get_value(this.data.href);
      app.router.navigate(JSON.stringify(href), false); // ??
  };
  /***************************** RENDERING ********************************/
  this.render = function() {
    // render self if subview changed
    if (this.is_changed && this.el_id) {
      var self = this;

      var $el = $('.'+this.el_id);

      this.prerender();

      // change the attributes
      _.each(this.el, function(value, key) {
        if (key.indexOf('data-') == 0) {
          if (self.show_data) $el.attr(key, value);
        } else if (key.indexOf('lib-') == 0) {
          if (self.show_lib) $el.attr(key, value);
        } else if (key.indexOf('tg-') == 0) {
          if (self.show_tg) $el.attr(key, value);
        } else if (key == 'class') {
          var classes = '';

          if (self.is_hidden) classes += 'hidden ';
          if (self.el_id) classes += self.el_id+' ';
          if (self.is_h__k) classes += self.get_value(value);
          else classes += value;

          if (classes != '')  $el.attr(key, classes.trim());
        } else if (self.is_h__k) {
          $el.attr(key, self.get_value(value));
        } else $el.attr(key, value);

        // update value via jquery
        if (self.el_type == 'INPUT' && key == 'value') $el.val(self.get_value(value));
      });

      var children = this.render_children();
      return $el.empty().append(children);
    } else {
      // render only changed subviews
      _.each(this.subviews, function(child_el) {
        if (child_el) child_el.render();
      });
    }
  };
  this.html = function() {
    var self = this;

    if (this.is_changed) this.prerender();

    // comment?
    if (this.el_type == 'comment') {
      if (this.show_comments) {
        return '<!-- '+this.get_value(this.el_text)+' -->';
      } else return '';
    }
    // show immediately if text
    if (this.el_text) {
      if (this.parent_element.data.debug) console.log("HTML: El Text", this.get_value(this.el_text, true));
      if (this.parent_element && this.parent_element.is_h__k) return this.get_value(this.el_text, true); // return as plain text (if object)
      else return this.el_text;
    }

    var returnValue = '<'+this.el_type;

    // attributes
    _.each(this.el, function(value, key) {
      if (key.indexOf('data-') == 0) {
        if (self.show_data) returnValue += ' '+key+'="'+value+'"';
      } else if (key.indexOf('lib-') == 0) {
        if (self.show_lib) returnValue += ' '+key+'="'+value+'"';
      } else if (key.indexOf('tg-') == 0) {
        if (self.show_tg) returnValue += ' '+key+'="'+value+'"';
      } else if (key == 'class') {
        var classes = '';

        if (self.is_hidden) classes += 'hidden ';
        if (self.el_id) classes += self.el_id+' ';
        if (self.is_h__k) classes += self.get_value(value);
        else classes += value;

        if (classes != '')  returnValue += ' '+key+'="'+classes.trim()+'"';
      } else if (self.is_h__k) returnValue += ' '+key+'="'+self.get_value(value)+'"';
      else returnValue += ' '+key+'="'+value+'"';
    });

    // don't add extra close tag to those that don't need it
    if (this.el_type.match(/img|input|br|hr|meta/i)) returnValue += ' />';
    else {
      returnValue += '>';
      returnValue += this.render_children();
      returnValue += '</'+this.el_type+'>';
    }

    return returnValue;
  };
  this.render_children = function() {
    var returnValue = '';
      _.each(this.subviews, function(child_el) {
        returnValue += child_el.html();
      });

    return returnValue;
  };
  this.after_render = function() {
    // input fields
    if (this.data.checked) this.checked();
    if (this.data.selected) this.selected();

    // Listen for events reset
    if (this.is_event) this.setup_events();

    // Listen for lib reset
    if (this.is_lib) this.setup_libs();
  };
  /***************************** EVENTS **************************************/
  this.on_click = function(e) {
    var self = e.data.el;
    // console.log("Click", e, self.data.onClick);
    self._call(self.data.onClick, self.get_value(self.data.msg));

    // limit propegation
    if (self.data.eventStop) e.stopPropagation();
  };
  this.change = function (e) {
    // console.log("On Change", e);
    var self = e.data.el;
    var $el = $(e.currentTarget);
    //
    if (['SELECT', 'INPUT', 'TEXTAREA'].indexOf(self.el_type) == -1) return false;
    //
    if ($el.attr('type') == 'file')             return self.file_reader(e);
    if ($el.attr('type') == 'checkbox')         return false;
    if ($el.attr('type') == 'radio')            return false;
    //
    self.data.value = $el.val();
    //
    if (!self.data.field)               return false;
    //
    var model = self.get_model(self.data.field);
    var field   = self.get_field(self.data.field);
    //
    if (self.data.update) {
        // we have another function we want to run instead of the default update
        self._call(self.data.update, {field: field, value: self.data.value});
        return this;
    } else if (self.data.fieldType == 'array') {
        model[(self.is_checked()) ? 'add' : 'remove'](field, self.data.value);
    } else {
        var obj = {};
        obj[field] = self.data.value;
        model.set(obj);
    }
    //
    if (self.data.onUpdate) self.on_update(e);
  };
  this.on_update = function(e) {
    console.log("On Update", e);
  };
  this.on_input = function(e) {
    var self = e.data.el;
    var $el = $(e.currentTarget);
    self._call(self.data.onInput, $el.val());
  };
  this.on_key = function (e) {
    self = e.data.el;
    var $el = $(e.currentTarget);

    if (['INPUT', 'TEXTAREA'].indexOf(self.el_type) == -1) return false;

    // console.log("On Key:", e);

    self.data.value                         = $el.val().replace(/(?:\r\n|\r|\n)/gi, '');
    var model = self.get_model(self.data.field);
    var field = self.get_field(self.data.field);
    model.set(field, self.data.value, { silent: true });

    if (self.data.onKeyUp) self._call(self.data.onKeyUp, self.data);

    // MAP SPECIFIC KEYS
    var map = {
        13          : 'Enter',
        27          : 'Esc',
        32          : 'Space'
    };

    var $map        = map[e.keyCode];
    var $attr       = self.data['onKey' + $map];

    if ($map && $attr) {
      self._call($attr, self.data);
      if ($el) $el.val(self.data.value);
    }
  };
  this.on_mouse_over = function (e) {
    var self = e.data.el;
    // console.log("Mouseover", e, self.data.onMouseOver);

    if (!self.data.msg) {
      var $el = e.originalEvent.target;
      var pos = $el.position();
      var off = $el.offset();
      var element_obj = {
        x : off.left,
        y : off.top,
        left : pos.left,
        top : pos.top,
        width : $el.width(),
        height : $el.height(),
        mouse_x : e.originalEvent.clientX,
        mouse_y : e.originalEvent.clientY,
        scroll_x : $el.scrollLeft(),
        scroll_y : $el.scrollTop()
      };
      self.data.msg = JSON.stringify(element_obj);
    }

    self._call(self.data.onMouseOver, self.get_value(self.data.msg));
  };
  this.on_mouse_out = function (e) {
    var self = e.data.el;

    if (self.data.onMouseOut)        {
      if (!self.data.msg) {
        var $el = e.originalEvent.target;
        var pos = $el.position();
        var element_obj = {
          x : pos.left,
          y : pos.top,
          width : $el.width(),
          height : $el.height(),
          mouse_x : e.originalEvent.clientX,
          mouse_y : e.originalEvent.clientY,
          scroll_x : $el.scrollLeft(),
          scroll_y : $el.scrollTop()
        };
        self.data.msg = JSON.stringify(element_obj);
      }

      // console.log("onMouseOut", this.data.msg);
      self._call(self.data.onMouseOut, self.get_value(self.data.msg));
    }
  };
  this.on_error = function(e) {
    var self = e.data.el;
    // console.log("Image load error", e);
    if (e.data.replace) {

      // change type to div
      self.el_type = 'DIV';

      // insert replacement
      self.data.template = e.data.replace;

      // remove src
      delete self.el.src;

      self.is_changed = true;

      // remove libraries
      if (self.libraries.length > 0) {
        var libs = _.keys(self.libraries);
        _.each(libs, function(key) {
          if (self.libraries[key]) {
            if (self[key+'_remove'] && _.isFunction(self[key+'_remove'])) self[key+'_remove']();
            delete self.libraries[key];
          }
        });
      }

      app.trigger('bind:render');
    } else {
      self._call(self.data.onError, self.get_value(self.data.msg));
    }
  };
  /***************************** ONCLICK FUNCTIONS ****************************/
  this.publish = function () {
    app.trigger(this.get_value(this.data.publish), this.get_value(this.data.msg));
  };
  this.set = function (value) {
    var val = (this.data.value) ? this.data.value : value;

    if (this.data.field) {
      var model = this.get_model(this.data.field);
      var field   = this.get_field(this.data.field);

      // console.log("Set", model, field, val);
      if (_.isObject(val)) model.set(val);
      else model.set(field, this.get_value(val));
    } else {
      console.log("No Field defined");
    }
  };
  this.toggle = function () {
    var model   = this.get_model(this.data.field);
    var field   = this.get_field(this.data.field);

    var opp     = { 'true': 'false', 'false': 'true' };
    var val     = opp[model.get(field)];
    if (!val) val = 'false';

    // console.log("Toggle", model, field, val);
    model.set(field, val).trigger('change:' + field);
  };
  this.file_reader = function (e) {
    var self    = this;
    console.log("File Reader:", e.target.files.length);
    _.each(e.target.files, function(file) {
      // var file    = e.target.files[0];
      var reader  = new FileReader();

      if (!file) return app.trigger('notifications:notify', 'Failed to load the file');

      reader.onload = function (file_read) {
        var file_data = file_read.target.result;
        if (self.model && self.model.on_file_upload) self.model.on_file_upload(file_data, file, self.data.field);
      }

      if (self.data.fileReader == 'dataurl')  reader.readAsDataURL(file);
      else                                    reader.readAsText(file);
    });

    return this;
  };
  /************************** ADDITIONAL LIBRARIES ****************************/
  this.dragula = function () {
    if (this.libraries.dragula) return console.log("Dragula already loaded");

    // console.log("Dragula", this.el_id);
    var self        = this;
    var data        = this.get_value(this.el['lib-dragula']);
    var $el         = $('.'+this.el_id);
    var arraylike   = document.getElementsByClassName(data.container);
    var containers  = Array.prototype.slice.call(arraylike);

    app.scripts.fetch('js/libs/lib.dragula.min.js', function () {
      if (!$el) return false;

      // events: drag|dragend|drop|cancel|remove|shadow|over|out|cloned
      self.libraries.dragula = dragula(containers, {
        isContainer: function (el) {
          return el.classList.contains(data.container);
        },
        moves: function (el, container, handle) {
          return handle.classList.contains(data.item);
        },
        accepts: function (el, target, source, sibling) {
          // get element_ids from the class
          var s_class      = $(source).prop('class');
          var t_class      = $(target).prop('class');
          var s_id = s_class.match(/e_[0-9]+/g)[0];
          var t_id = t_class.match(/e_[0-9]+/g)[0];
          if (s_id == t_id) return true; // if same id, accept

          // check if they have specific allowed type that match
          var s_el = app.bind.get(s_id);
          var t_el = app.bind.get(t_id);

          var v1      = null;
          if (s_el.data && s_el.data.dragulaAccepts) v1 = s_el.get_value(s_el.data.dragulaAccepts);
          var v2      = null;
          if (t_el.data && t_el.data.dragulaAccepts) v2 = t_el.get_value(t_el.data.dragulaAccepts);

          if (v1 != v2) console.log("Dragula Mismatch", v1, v2);
          return v1 == v2;
        },
        revertOnSpill: true
      }).on('drag', function(el, source) {
        console.log("Dragula start drag", el);
        app.session.set('is_dragging', 'true');
      }).on('dragend', function(el) {
        console.log("Dragula end drag", el);
        app.session.set('is_dragging', 'false');
      }).on('drop', function(el, target, source, sibling) {
        var e_class = $(el).prop('class');
        var t_class = $(target).prop('class');
        var el_id = e_class.match(/e_[0-9]+/g)[0];
        var t_id = t_class.match(/e_[0-9]+/g)[0];

        var e_el = app.bind.get(el_id);
        var t_el = app.bind.get(t_id);

        // console.log("Drop", el_id, e_el, t_id, t_el);
        var change  = e_el.get_value(e_el.data.dragulaChange);
        var s_val     = e_el.get_value(e_el.data.dragulaValue);
        var t_val     = t_el.get_value(t_el.data.dragulaValue);
        //
        // console.log("Drop", change, t_val, s_val);
        e_el._call(change, {target:t_val,source:s_val});

        // make sure image can be seen again
        app.session.set('is_dragging', 'false');
      });
    });
  };
  this.dragula_remove = function () {
    // console.log("Remove Dragula", this.el_id);
    if (this.libraries.dragula && _.isFunction(this.libraries.dragula.destroy)) this.libraries.dragula.destroy();
  };
  this.chosen = function () {
    if (this.libraries.chosen) return; // console.log("Chosen already loaded");

    var self = this;
    // console.log("Chosen", this.el_id);

    app.scripts.fetch('js/libs/lib.chosen.min.js', function () {

      // setTimeout(function () {
        var $el = $('.'+self.el_id);
        if ($el && !self.libraries.chosen) {
          var chosen_opts = { width: '100%' };
          if (self.data.chosenThreshold) chosen_opts.disable_search_threshold = +self.data.chosenThreshold;
          self.libraries.chosen = $el.chosen(chosen_opts);
          console.log("Chosen setup", self.el_id, chosen_opts);
        } else {
          console.log("Chosen error", $el, self.el_id);
        }
      // }, 50);
    });
  };
  this.chosen_remove = function () {
    // console.log("Remove Chosen", this.el_id);
    if (this.libraries.chosen && _.isFunction(this.libraries.chosen.destroy)) this.libraries.chosen.destroy();
  };
  this.chart = function () {
    if (this.libraries.chart) return; // console.log("Chart already loaded");
    var self    = this;
    var d       = this.model.get('data');

    var chart_data = { type: d._type, data: d._data, options: d._options };

    app.scripts.fetch('/js/libs/lib.chart.min.js', function() {
      var $el = $('.'+self.el_id);
      if (!$el) return false;
      self.libraries.chart = new Chart($el, chart_data);
    });
  };
  this.chart_remove = function () {
    if (this.libraries.chart && _.isFunction(this.libraries.chart.destroy)) this.libraries.chart.destroy();
  };
  this.flatpickr = function() {
    if (this.libraries.flatpickr) return; // console.log("flatpickr already loaded");

    var self = this;

    app.scripts.fetch('js/libs/lib.flatpickr.min.js', function () {
      var $el = $('.'+self.el_id);

      if (!$el) return false;

      var data        = self.get_value(self.el['lib-flatpickr']);
      self.libraries.flatpickr = $el.flatpickr(data);

      // update value if the field does not match flatpickr output
      var html_value = $el.attr('value');
      // console.log("Flatpickr value:", html_value);
      if (html_value && html_value != 'false') self.libraries.flatpickr.setDate(html_value);
    });
  };
  this.flatpickr_remove = function () {
    if (this.libraries.flatpickr && _.isFunction(this.libraries.flatpickr.destroy)) this.libraries.flatpickr.destroy();
  };
  this.sortable = function () {
    if (this.libraries.sortable) return; // console.log("sortable already loaded");

    var self = this;

    app.scripts.fetch('js/libs/lib.sortable.min.js', function () {
      var $el = $('.'+self.el_id);

      if (!$el) return false;

      var data        = self.get_value(self.el['lib-sortable']);

      console.log("Sortable init", self.el_id, data);

      // only works on arrays
      self.libraries.sortable = Sortable.create($el[0], {
        handle              : data,
        forceFallback       : true,
        scrollSensitivity   : 30,
        scrollSpeed         : 20,
        delay               : 300,
        moveThreshold       : 5,

        onSort: function (evt) {
          self.model.move_array(self.data.field, evt.oldIndex, evt.newIndex);
        }
      });
    });
  };
  this.sortable_remove = function () {
    console.log("Sortable destroy", self.el_id);
    if (this.libraries.sortable && _.isFunction(this.libraries.sortable.destroy)) this.libraries.sortable.destroy();
  };
  //
  _.extend(this.initialize(el, parent, _scope), Backbone.Events);
  if (this.is_h__k) this.after_init();
};
