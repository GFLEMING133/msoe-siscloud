/*  RESERVED
    template    : current html template
    reset       : reset the model
    foreach     : foreach loop. used with cluster right now
    cluster     : current cluster
    field       : current active model field
    value       : current input value
    replace     : replace html of template
    model       : current neuron
    publish     : click action
    initValue   : initial value of a model property
    listeners   : properties to listen to for changes on model
    scope       : create a new scoped model
    keyEnter    : on key enter
    parent      : parent model
    grandparent : grandparent model
    g_grandparent: great-grandparent model
    g_g_grandparent: great-great-grandparent model
    g_g_g_grandparent: great-great-great-grandparent model

    focus       : focus the input element,
    blur        : blur the input element
*/

var Binding = Backbone.View.extend({
    initialize: function (opts) {
        _.extend(this, opts);

        this.before_init();
        this.setup_defaults();
        this.setup_events();
        this.setup_model();
        this.prerender();
        this.after_init();

        return this;
    },
    before_init : function () {},
    after_init  : function () {},
    /***************************** SETUP DEFAULTS *****************************/
    setup_defaults: function () {
        this.collection = app.collection;

        this.is_rendered        = false;
        this.$el                = $(this.el);
        this.tagName            = this.$el.prop('tagName');
        this.type               = this.$el.attr('type') || false;
        this.subviews           = [];
        this.triggers           = {};
        this.orig               = {};
        this.tmp                = {};
        this.count              = 0;
        this.data               = this.$el.data();
        this.data.bind          = this;

        if (this.data.ctx)
            this.ctx = this._ref(this.data.ctx);
    },
    /***************************** SETUP EVENTS *******************************/
    events: {},
    setup_events: function () {
        var new_events = {};

        // DEFAULT HANDLERS
        new_events['touchstart']    = 'touchStart';
        new_events['touchend']      = 'touchEnd';


        if (['SELECT', 'INPUT', 'TEXTAREA'].indexOf(this.tagName) > -1)
                                    new_events['change']    = 'update';

        if (this.data.onInput)      new_events['input']     = 'onInput';
        if (this.data.onKeyup)      new_events['keyup']     = 'onKey';
        if (this.data.onClick)      new_events['click']     = 'onClick';
        if (this.data.onBlur)       new_events['blur']      = 'onBlur';
        if (this.data.drag)         new_events['drag']      = 'onDrag';
        if (this.data.dragStart)    new_events['dragstart'] = 'onDragStart';
        if (this.data.dragEnd)      new_events['dragend']   = 'onDragEnd';
        if (this.data.dragEnter)    new_events['dragenter'] = 'onDragEnter';
        if (this.data.dragOver)     new_events['dragover']  = 'onDragOver';
        if (this.data.dragLeave)    new_events['dragleave'] = 'onDragLeave';
        if (this.data.drop)         new_events['drop']      = 'onDrop';
        if (this.data.tap)          new_events['tap']       = 'onTap';
        if (this.data.touchStart)   new_events['touchstart']= 'onTouchStart';
        if (this.data.touchMove)    new_events['touchmove'] = 'onTouchMove';
        if (this.data.touchEnd)     new_events['touchend']  = 'onTouchEnd';

        if (this.data.onMouseDown)  new_events['mousedown'] = 'onMouseDown';
        if (this.data.onMouseMove) {
            new_events['mousedown'] = 'onMouseDown';
            new_events['mousemove'] = 'onMouseMove';
            new_events['mouseup']   = 'onMouseUp';
        }
        if (this.data.onMouseUp)    new_events['mouseup']   = 'onMouseUp';

        this.events = _({}).extend(this.events, new_events);
        this.delegateEvents();
    },
    /***************************** SETUP MODEL ********************************/
    setup_model: function () {
        var scope       = (this._scope) ? this._scope : { value: false, index: false }
        this.scope      = app.neuron(scope);

        if (this.data.scope) {
            if (this.g_g_grandparent) this.g_g_g_grandparent = this.g_g_grandparent;
            if (this.g_grandparent) this.g_g_grandparent = this.g_grandparent;
            if (this.grandparent)   this.g_grandparent = this.grandparent;
            if (this.parent)        this.grandparent = this.parent;
            this.parent = this.model;
            this.model  = false;
        }

        if (this.data.model) {
            var value = this.get_value(this.data.model);
            if (this.g_g_grandparent) this.g_g_g_grandparent    = this.g_g_grandparent;
            if (this.g_grandparent) this.g_g_grandparent    = this.g_grandparent;
            if (this.grandparent)   this.g_grandparent      = this.grandparent;
            if (this.parent)        this.grandparent        = this.parent;
            if (this.model)         this.parent             = this.model;
            this.model              = app.collection.get(value);
        }

        if (!this.model)    {
            this.model          = (this.data.defaults) ? app.neuron(this.get_value(this.data.defaults)) : app.neuron();
        }
    },
    /***************************** PRERENDER **********************************/
    prerender: function () {
        if (this.model.get('is_fetched') == 'false') {
            this.listenTo(this.model, 'change:is_fetched', this.render_ready_pre);
			if (this.model.get('is_fetching') == 'false') this.model.fetch();
            this._save_html = this.$el.html();
            this.$el.html(app.templates.get('loading-tmp'));
        } else if (this.data.subfetch && this.model.get('is_subfetched') == 'false') {
            this.listenTo(this.model, 'change:is_subfetched', this.render_ready_pre);
            this._save_html = this.$el.html();
            this.$el.html(app.templates.get('loading-tmp'));
            this.model.fetch_neighbors();
        } else if (this.model.get('is_unfetchable') !== 'false') {
            if (!this.data.if)
                this.$el.html(app.templates.get('unfetchable-tmp'));

            this.render_ready();
        } else {
            this.render_ready();
        }
    },
    render_ready_pre: function () {
        this.$el.html(this._save_html);
        this.prerender();
    },
    preload_tmp: function (cb, ctx) {
        var self = this;

        if (this.data.template) {
            app.templates.fetch(this.get_value(this.data.template), function(tmp) {
                if (!self.$el) return false;

                self.template = tmp;
                cb.call(ctx);
            }, this)
        } else {
            cb.call(ctx);
        }
    },
    render_ready: function () {
        this.preload_tmp(this._render_ready, this);
    },
    _render_ready: function () {
        this.before_render();

        if (_.isFunction(this.template))            this.$el.html(this.template(this.get_json()));
        else if (!this.data.if && this.template)    this.$el.html(this.template);

        if (this.data.cluster)              this.setup_cluster();
        if (this.data.clusterComparator)    this.setup_cluster_comparator();

        this.process_attrs();

        if (this.data.if) {
            this.if();
        } else {
            this.after_render();
            this.is_rendered = true;
        }
    },
    /***************************** BEFORE RENDER ******************************/
    before_render: function () {
        if (this.data.state) this.model.set(this.get_value(this.data.state));
        if (this.data.field) {
            var ctx         = this.data.field.match(/^(model|cluster|parent|grandparent|g_grandparent|g_g_grandparent|g_g_g_grandparent|scope)/);
            ctx             = (ctx && ctx.length > 0) ? ctx[0] : 'model';
            this.ctx        = this[ctx];
            this.data.field = this.data.field.replace(/^(model|cluster|parent|grandparent|g_grandparent|g_g_grandparent|g_g_g_grandparent|scope)\./, '');
        }

        if (this.data.reset)            this.listenTo(this.model,   'reset',    this.onReset);
        if (this.data.subscribe)        this.subscribe();
        if (this.data.run)              this._call(this.data.run, this.data.runMsg);

        if (this.data.initValue)        this.init_data();
        if (this.data.delay)            this.delay = true;
    },
    /***************************** AFTER RENDER *******************************/
    after_render: function () {
        if (this.data.drag)             this.drag();
        if (this.data.focus)            this.focus();
        if (this.data.checked)          this.checked();
        if (this.data.selected)         this.selected();
        if (this.data.src)              this.src();
        if (this.data.log)              this.log();

        // Libraries
        if (this.data.date)             this.date();
        if (this.data.time)             this.time();
        if (this.data.sortable)         this.sortable();
        if (this.data.dragula)          this.dragula();
        if (this.data.fullcalendar)     this.fullcalendar();
        if (this.data.svg)              this.svg();
        if (this.data.d3)               this.d3();
        if (this.data.taggle)           this.taggle();
        if (this.data.gumwrapper)       this.gumwrapper();
        if (this.data.simplemde)        this.simplemde();
        if (this.data.chosen)           this.chosen();
        if (this.data.iro)              this.iro();
        if (this.data.chart)            this.chart();
      	if (this.data.leaflet)          this.leaflet();
        if (this.data.tooltip)          this.tooltip();
        if (this.data.rangetouch)       this.rangetouch();

        // RUN FOREACH AT THE VERY END
        if (this.data.foreach)          this.foreach();
    },
    /***************************** PRIVATE REFERENCES *************************/
    _ref: function (ref, data) {
        var layers		= ref.split('.');
        var fn			= this;

        _.each(layers, function(layer) {
            fn = fn[layer];
        });

        return fn;
    },
    _call: function (ref, data) {
        var self = this;

        if (data && _.isString(data))
            data = this.get_value(data);

        if (ref.indexOf('|') > -1)
            return _.each(ref.split('|'), function (ind) { self._call(ind, data); });

        var layers		= ref.split('.');
        var fn			= this;
        var fn2         = this;
        var l           = layers.length;

        try {
            _.each(layers, function(layer) {
                fn = fn[layer];
                if (--l > 0) fn2 = fn2[layer];
            });
        } catch (err) {
            if (this.data && this.data.console)
                console.log('_call: error', self);
        }

        return fn.call(fn2, data || this.model);
    },
    /***************************** ANIMATION **********************************/
    _animate: function (distance) {
        this.$el
			.css('transition', '-webkit-transform .2s ease-out')
			.css('transform', 'translate3d(' + distance + 'px, 0px, 0px)')
			.css('-webkit-transform', 'translate3d(' + distance + 'px, 0px, 0px)');
    },
    animateLeft: function () {
        this._animate(-100);
    },
    animateRight: function () {
        this._animate(0);
    },
    /***************************** UI INTERACTIONS ****************************/
    onClick: function (e) {
        if (this.data.onClick)        this._call(this.data.onClick, this.get_value(this.data.msg));
    },
    onInput: function (e) {
        if (this.data.onInput)        this._call(this.data.onInput, this.$el.val());
    },
    onTap: function (e) {
        if (this.data.touchStart)   this._call(this.data.touchStart, this.$el.val());
    },
    touchStart: function () {
        $('.body').addClass('touch-hover');
    },
    touchEnd: function () {
        $('.body').removeClass('touch-hover');
    },
    onTouchStart: function (e) {
        if (this.data.touchStart)   this._call(this.data.touchStart, this.get_value(this.data.msg));
    },
    onTouchMove: function (e) {
        if (this.data.touchMove)    this._call(this.data.touchMove, this.get_value(this.data.msg));
    },
    onTouchEnd: function (e) {
        if (this.data.touchEnd)   this._call(this.data.touchEnd, this.get_value(this.data.msg));
    },
    onKey: function (e) {
        if (['INPUT', 'TEXTAREA'].indexOf(this.tagName) == -1) return false;

        this.data.value                         = $(e.currentTarget).val().replace(/(?:\r\n|\r|\n)/gi, '');
        var obj                                 = {};
		obj[this.get_value(this.data.field)]    = this.data.value;
        this.ctx.set(obj, { silent: true });

        if (this.data.onKeyup)
            this._call(this.data.onKeyup, this.data);

        this.data.value                         = $(e.currentTarget).val().replace(/(?:\r\n|\r|\n)/gi, '');

        // MAP SPECIFIC KEYS
        var map = {
            13          : 'Enter',
            27          : 'Esc',
            32          : 'Space'
        };

        var $map        = map[e.keyCode];
        var $attr       = this.data['onKey' + $map];

        if ($map && $attr && this.$el) {
            this._call($attr, this.data);
            if (this.$el) this.$el.val(this.data.value);
        }
	},
    onUpdate: function () {
      if (this.data && this.data.onUpdate)  this._call(this.data.onUpdate);
    },
    onReset: function () {
        if (this.data.onReset)      this._call(this.data.reset);
    },
    onSubscribe: function (data) {
        if (this.data.onSubscribe)  this._call(this.data.onSubscribe, data);
    },
    onBlur: function (data) {
         if (this.data.onBlur)       this._call(this.data.onBlur, data);
    },
    onCheck: function (data) {
        console.log('we have a check event');
    },
    _width  : '100px',
    _x      : 0,
    _y      : 0,
    _ended  : false,
    onDrag: function (e) {
        if (!this._onDrag) {
            this._onDrag = _.throttle(function (e) {
                if (this._ended)
                    return false;

                var oe      = e.originalEvent;
                var width   = +this._width.replace('px', '');
                var x       = Math.round((oe.x - this._x) / width) * width - width;
                var y       = Math.round((oe.y - this._y) / 25) * 25 - 25;
                this.$el.css({ position: 'absolute', left: x + 'px', top: y + 'px', width: this._width });
            }, 100);
        }

        if (this.data.drag) this._onDrag(e);
    },
    onDragStart: function (e) {
        window.dragElement = $('#random-mover');

        if (!this._onDragStart) {
            this._onDragStart = _.throttle(function (e) {
                this._ended = false;

                e.originalEvent.dataTransfer.effectAllowed = 'move';
                e.originalEvent.dataTransfer.setData('text/html', this.innerHTML);

                this._x = e.originalEvent.x - e.currentTarget.offsetLeft - e.originalEvent.offsetX;
                this._y = e.originalEvent.y - e.currentTarget.offsetTop - e.originalEvent.offsetY;
                this._width = this.$el.css('width');

                e.originalEvent.dataTransfer.setDragImage(window.dragElement[0], 0, 0);
            }, 100);
        }

        if (this.data.drag) this._onDragStart(e);
    },
    onDragEnd: function (e) {
        if (!this._onDragEnd) {
            this._onDragEnd = _.throttle(function (e) {
                this._x     = e.originalEvent.x - e.originalEvent.offsetX;
                this._y     = e.originalEvent.y - e.originalEvent.offsetY;
                this._ended = true;
            }, 100);
        }

        if (this.data.drag) this._onDragEnd(e);
    },
    onDragEnter: function (e) {
        if (!this._onDragEnter) {
            this._onDragEnter = _.throttle(function (data) {

            }, 100);
        }


        if (this.data.drag) this._onDragEnter(e);
    },
    onDragOver: function (e) {
        if (e.originalEvent.preventDefault) {
            e.originalEvent.preventDefault(); // Necessary. Allows us to drop.
         }

         e.originalEvent.dataTransfer.dropEffect = 'move';

         return false;
    },
    onDragLeave: function (e) {
        if (!this._onDragLeave) {
            this._onDragLeave = _.throttle(function (data) {

            }, 100);
        }

        if (this.data.drag) this._onDragLeave(e);
    },
    onDrop: function (e) {
        if (e.originalEvent.stopPropagation) {
            e.originalEvent.stopPropagation(); // stops the browser from redirecting.
        }

        // See the section on the DataTransfer object.

        return false;

        if (!this._onDrop) {
            this._onDrop = _.throttle(function (data) {
                //this._call(this.data.onDrop);
                console.log('on drop');
            }, 100);
        }

        if (this.data.drag) this.onDrop(e);
    },
    onMouseDown: function (e) {
        if (this.data.onMouseDown !== 'true')
            this._call(this.data.onMouseDown, this.get_value(this.data.msg));

        app.mouse_is_down = true;
    },
    onMouseMove: function (e) {
        var throttleMove = _.throttle(function (self) {
            if (self.data.onMouseMove)        self._call(self.data.onMouseMove, self.data.msg);
        }, 50);

        if (app.mouse_is_down)
            if (this.data.onMouseMove)        throttleMove(this);

    },
    onMouseUp: function (e) {
        if (this.data.onMouseUp !== 'true')
            this._call(this.data.onMouseUp, this.get_value(this.data.msg));

        app.mouse_is_down = false;
    },
    on_remove: function () {
        if (this.data.datepicker && this.data.datepicker.remove) {
            this.data.datepicker.remove();
        }
    },
    /***************************** CLASSES ************************************/
    classToggle: function (e) {
        if (this.data.classToggle) {
            this.$el.toggleClass(this.data.classToggle);
        }
    },
    classAdd: function () {
        this.$el.addClass(this.data.addClass);
    },
    classRemove: function () {
        this.$el.removeClass(this.data.removeClass);
    },
    /***************************** ROUTING ************************************/
    back: function () {
        window.history.back();
    },
    forward: function () {
        window.history.forward();
    },
    href: function () {
        var href = this.get_value(this.data.href);
        app.router.navigate('#/' + JSON.stringify(href), false);
    },
    /***************************** PUBSUB *************************************/
    publish: function () {
        app.trigger(this.get_value(this.data.publish), this.get_value(this.data.msg));
    },
    subscribe: function () {
        var self        = this;
        var listeners   = this.data.subscribe.split('|');
        var ctx         = (this.data.subscribeCtx) ? this[this.data.subscribeCtx] : app;

        _.each(listeners, function (listener) {
            self.listenTo(ctx, listener, function (msg) {
                self._call(self.data.onSubscribe, msg);
            });
        });
    },
    /***************************** FORM INPUT *********************************/
    clear: function () {
        var self = this;
        setTimeout(function () {
            if (self.$el) self.$el.val('');
        }, 10);
    },
    click: function () {
        $(this.data.click).click();
    },
    focus: function () {
        this.$el.focus();
    },
    blur: function () {
        this.$el.blur();
    },
    checked: function () {
        var self        = this;
        var ref         = this.ctx.get(this.get_value(this.data.field));
        var value       = this.get_value(this.data.checked);
        var is_checked  = (_.isArray(ref)) ? _.contains(ref, value) : ('' + ref) == ('' + value);

        this.$el.prop('checked', is_checked);
    },
    is_checked: function () {
        return this.$el.is(':checked');
    },
    selected: function () {
        var self    = this;
        var val     = this.ctx.get(this.get_value(this.data.field));

        if (val == '')
            return this;

        // gives ability for foreach to render each attribute then make sure it's checked
        setTimeout(function () {
            if (self.$el) {
				self.$el.val(val);
				if (self.data.chosen) self.chosen();
			}
        }, 10);
    },
    /***************************** GENERAL ************************************/
    scroll: function () {
        var self = this;

        setTimeout(function () {
            if (self.$el) self.$el.scrollTop(self.$el.prop('scrollHeight'));
        }, 50);
    },
    drag: function () {
        this.$el.attr('draggable', true);
    },
    src: function () {
        this.$el.attr('src', this.get_value(this.data.src));
    },
    toggle: function (e) {
	    var opp     = { 'true': 'false', 'false': 'true' };
      var field   = this.get_value(this.data.field);
      var val     = opp[this.ctx.get(field)];

      if (!val) val = 'true'; // change to true if previously undefined
      this.ctx.set(field, val)
        .trigger('change:' + field)
        .trigger('change:' + field.replace(/\'/gi, ''));
	},
    file_reader: function (e) {
        var self            = this;
        var files           = e.target.files;

        if (files.length == 0)
            return app.trigger('notifications:notify', 'Failed to load the file');

        _.each(files, function(file_obj) {
            self._read_file(file_obj);
        });

        return this;
    },
    _read_file: function (file_obj, cb) {
        var self    = this;
        var reader  = new FileReader();

        reader.onload = function (file_results) {
            file_obj.data = file_results.target.result;

            if (self.model && self.model.on_file_upload)
                self.model.on_file_upload(file_obj);
        }

        reader.readAsText(file_obj);

        return this;
    },
    trigger: function () {
        this.model.trigger(this.data.trigger);
    },
    _log: {},
    log: function () {
        if (!this._log[this.data.log]) this._log[this.data.log] = 0;
        this._log[this.data.log]++;
        console.log('log', this.data.log, this._log[this.data.log]);
    },
    console: function () {
        //
    },
    html_clone: function () {
        var html = this.$el.parents(this.data.clone).clone().html();
        html = html.replace(/h__k/gi, '');
        return html;
    },
    init_data: function() {
        var field       = this.data.field;
        var value       = this.get_value(this.data.initValue);
        var action      = (field.indexOf('[]') > -1) ? 'add' : 'set';

        this.ctx[action](field, value);
    },
    get_subvalue: function(val) {
        try {
            return _.templateSub(val)(this.get_json());
        } catch(err) {
            console.log('get_subvalue: err', val);
        }
    },
    get_value: function(val) {
        var self    = this;
        var err_out = false;

        if (!val || val == true)
            return val;

        if (val.indexOf('{[') > -1) {
            val = this.get_subvalue(val);
        }

        if (val.indexOf('{{') > -1) { // we have a template
            var _val  = val;

            try {
                var tmp   = app.templates.create(val, self);
                var json  = this.get_json();
                val       = tmp(json);
            } catch (err) {
                err_out = true;
                if (this.data.console)
                    console.log('get_value: template err ', val, json, err);
            }
        }

        if (err_out == false && val.indexOf('{') > -1) {
            try {
                val = JSON.parse(val.replace(/\'/gi, '"'));

                _.each(val, function (vall, key) {
                    if (vall && vall.indexOf && vall.indexOf('ref::') > -1) {
                        val[key] = self._ref(vall.replace('ref::',''));
                    }
                });
            } catch(err) {
                err_out = true;
                if (this.data.console)
                    console.log('get_value: parse error', val, err)
            }
        }

        if (err_out == false && val && val.indexOf && val.indexOf('ref::') > -1) {
            val     = this._ref(val.replace('ref::',''));
        }

        return val;
    },
    get_json: function () {
        var self            = this;
        var json            = {
            model   : this.model.attributes,
            tmp     : app.templates.get,
            scope   : this.scope.attributes,
            session : app.session.attributes,
            manager : app.manager.attributes,
            _model_ : this.model,
            _super_ : this._super_,
            _self_  : this
        };

        if (app.manager) {
            json.manager        = app.manager.attributes;
        }

        if (this.parent) {
            json.parent         = this.parent.attributes;
            json._parent_       = this.parent;
        }

        if (this.grandparent) {
            json.grandparent    = this.grandparent.attributes;
            json._grandparent_  = this.grandparent;
        }

        if (this.g_grandparent) {
            json.g_grandparent    = this.g_grandparent.attributes;
            json._g_grandparent_  = this.g_grandparent;
        }

        if (this.g_g_grandparent) {
            json.g_g_grandparent    = this.g_g_grandparent.attributes;
            json._g_g_grandparent_  = this.g_g_grandparent;
        }

        if (this.g_g_g_grandparent) {
            json.g_g_g_grandparent    = this.g_g_g_grandparent.attributes;
            json._g_g_g_grandparent_  = this.g_g_g_grandparent;
        }

        if (this.cluster) {
            json._cluster_      = this.cluster;
        }

        return json;
    },
    /***************************** LOGIC **************************************/
    if: function () {
      if (!this.$el) return; // exit if this element no longer exists

      var statement   = this.get_value(this.data.if).split(/\s?(\=\=|\!\=\=|\<|\>)\s?/);
      var first       = '' + statement[0];
      var comparator  = statement[1];
      var second      = '' + statement[2];
      var is_true     = false;

      // evaluate
      if (comparator == '==' && first == second)          is_true = true;
      else if (comparator == '!==' && first !== second)   is_true = true;
      else if (comparator == '>' && +first > +second)     is_true = true;
      else if (comparator == '<' && +first < +second)     is_true = true;

      // change visibility
      if (is_true)    this.$el.removeClass('hidden')
      else            this.$el.addClass('hidden')

      this.if_evaluation = is_true;

      // Handle re-rendering of subvalues
      if (this.data.template) this.if_template();
      if (!this.data.template && this.orig && this.orig._html && this.orig._html.indexOf('h__k') > -1) {
          this.template = this.orig._html;
          this.if_template();
      }
      if (this.data.checked)  this.checked();
      if (this.data.foreach)  this.foreach();
    },
    if_template: function () {
        var self = this;

        this.remove_subviews();

        if (this.if_evaluation) {
            this.preload_tmp(function () {
                self.$el.html(self.template);
                self.setup_subview();
            }, this);
        }
    },
    /***************************** GET/SET/UPDATE *****************************/
    set: function (value) {
        var val = (this.data.value) ? this.data.value : value;
        //var val = this.data.value;
        if (_.isObject(val)) {
            this.ctx.set(val);
        } else if (val.indexOf && val.indexOf('{{') == 0) {
            this.ctx.set(this.data.field, this.get_value(val));
        } else if (val.indexOf && val.indexOf('{') > -1) {
            this.ctx.set(this.get_value(val))
        } else {
            this.ctx.set(this.data.field, val);
        }
    },
    set_subscribe: function (value) {
        this.model.set(this.data.subscribe, value);
    },
    get: function (field) {
        return this.ctx.get(field);
    },
    update: function (e) {
        if (['SELECT', 'INPUT', 'TEXTAREA'].indexOf(this.tagName) == -1) return false;

        if (this.type == 'file')            return this.file_reader(e);
        if (this.type == 'checkbox')        return this;

        this.data.value = this.$el.val();

        if (!this.data.field)               return false;

        var field   = this.get_value(this.data.field);
        var type    = this.ctx.get(field);

        if (this.data.update) {
            // we have another function we want to run instead of the default update
            this._call(this.data.update, this.data.value);
            return this;
        } else if (this.data.fieldType == 'array') {
            this.ctx[(this.is_checked()) ? 'add' : 'remove'](field, this.data.value);
        } else {
            var obj = {};
            obj[field] = this.data.value;
            this.ctx.set(obj);
        }

        console.log("Update", e, this.$el, this.data);
        if (this.onUpdate) this.onUpdate();
        if (this.data && this.data.value) app.trigger('trigger:updated:' + this.cid, this.data.value);
    },
    /***************************** CLUSTER ************************************/
    setup_cluster: function () {
        if (this.cluster)   this.stopListening(this.cluster);
        this.cluster        = app.collection.get_cluster(this.get_value(this.data.cluster));
    },
    setup_cluster_comparator: function () {
        var comp = this.data.clusterComparator;
        var self = this;

        if (comp.indexOf('model') == 0) {
					this.listenTo(this.model, "change:" + comp.replace('model.','') + ".key", this.cluster_comparator);
					this.listenTo(this.model, "change:" + comp.replace('model.','') + ".ord", this.cluster_comparator);
        }

        // THROTTLE BECAUSE IT CAN BE TRIGGERED BY CHAGNE TO BOTH .key & .ord
        this._cluster_comparator = _.throttle(function() {
            if (this.$el == undefined) return;

            var comparator;

            if (comp.indexOf('model') == 0)
    						comparator = self._ref(comp.replace('model.', 'model.attributes.'));
            else
                comparator = self.get_value(comp);

            self.cluster._comparator = comparator;
            self.cluster.sort();
        }, 50, { leading: false });

        this.cluster_comparator();
    },
    cluster_comparator: function () {
        this._cluster_comparator();
    },
    _cluster_comparator: function () {
        // will be replaced in setup_cluster_comparator
    },
    /***************************** FOREACH ************************************/
    foreach_ref: false,
    foreach_listeners: false,
    foreach: function () {
        if (!this.$el) return false;

        if (this.data.console)
            console.log('Foreach', this);

        this.$el.html('');

        var defaultValue    = this.get_value('' + this.data.foreachDefaultValue) || '';
        var defaultLabel    = this.get_value(this.data.foreachDefault) || '';
        // SET THE DEFAULT IF ITS A SELECT
        if (this.tagName == 'SELECT' && defaultValue !== 'undefined')
            this.$el.append('<option value="' + defaultValue + '">' + defaultLabel + '</option>');

        if (this.data.if && !this.if_evaluation)
            return false;

        var _foreach = this.data.foreach;
        var list = false;

        if (_foreach.indexOf('{{') > -1)            _foreach = this.get_value(_foreach);
        else if (_foreach.indexOf('{[') > -1)       _foreach = this.get_value(_foreach);
        if (_foreach.indexOf('[') == 0)             _foreach = _foreach.replace('[', '').replace(']', '').split(',');
        if (_foreach.indexOf('scope') > -1)         list = this.scope.get(_foreach.replace('scope.', ''));
        if (_foreach.indexOf('model') > -1)         list = this.model.get(_foreach.replace('model.', ''));
        if (_foreach.indexOf('parent') > -1)        list = this.parent.get(_foreach.replace('parent.', ''));
        if (_foreach.indexOf('g_grandparent') > -1) list = this.g_grandparent.get(_foreach.replace('g_grandparent.', ''));
        if (_foreach.indexOf('g_g_grandparent') > -1) list = this.g_g_grandparent.get(_foreach.replace('g_g_grandparent.', ''));
        if (_foreach.indexOf('grandparent') > -1)   list = this.grandparent.get(_foreach.replace('grandparent.', ''));
        if (_foreach.indexOf('cluster') > -1)       list = (this._ref(_foreach)).models;

        if (list === false) list = _foreach;
        if (this.data.foreachMap)               list = _.map(list, function(item) { return app.collection.get(item) });

        if (this.data.foreachWithout) {
            var ctx     = this.data.foreachWithout.match(/^(model|cluster|parent|grandparent|g_grandparent|g_g_grandparent|scope)/)[0];
            var without = this[ctx].get(this.data.foreachWithout.replace(/^(model|cluster|parent|grandparent|g_grandparent|g_g_grandparent|scope)\./, ''));
            var l2      = [];

            _.each(list, function(item) {
                if (item && without.indexOf(item.id) < 0) l2.push(item);
            })
            list        = l2;
        }

        if (this.data.foreachReverse)           list.reverse();

        if (this.foreach_listeners == false) {
            this.foreach_listeners  = true;
            if (_.isString(this.get_value(this.data.foreach))) {
                var foreach_ref         = this.get_value(this.data.foreach).split('.');
                var ref                 = foreach_ref.shift();
                if (['cluster','model','parent','grandparent','g_grandparent'].indexOf(ref) > -1) {
                    this.foreach_ref = foreach_ref.join('.');
                    this.foreach_ctx = this[ref];
                    var listener = (ref == 'cluster') ? this.foreach_ref : ':' + this.foreach_ref;

                    if (this.data.foreachAdd)       this.listenTo(this.foreach_ctx, 'add'    + listener,     this[this.data.foreachAdd]);
                    if (this.data.foreachChange)    this.listenTo(this.foreach_ctx, 'change' + listener,     this[this.data.foreachChange]);
                    if (this.data.foreachRemove)    this.listenTo(this.foreach_ctx, 'remove' + listener,  this[this.data.foreachRemove]);
                    if (this.data.foreachSort)      this.listenTo(this.foreach_ctx, 'sort'   + listener,    this[this.data.foreachSort]);
                    if (this.data.foreachRender)    this.listenTo(this.foreach_ctx, 'render',  this[this.data.foreachRender]);
                }
            }
        }

        var ff = _.map(list, function(obj, index) { return { obj: obj, index: index }; });
        this.foreach_add(ff);
    },
    foreach_reset: function () {
        this.remove_subviews();
        this.foreach();
    },
    foreach_cluster_add: function (model) {
        this.foreach_add({ obj: model, index: 1 });
    },
    foreach_cluster_remove: function (model, index) {
        var v;

        for (var i = this.subviews.length - 1; i >= 0; i -= 1) {
            if (this.subviews[i].model.id == model.id) {
                v = this.subviews.splice(i, 1);
                v[0].remove();
            }
        }
    },
    foreach_g_g_grandparent_add: function (model) {
        var field = this.g_g_grandparent.get(this.foreach_ref);
        this.foreach_add({ obj: field[field.length - 1], index: field.length - 1 });
    },
    foreach_g_grandparent_add: function (model) {
        var field = this.g_grandparent.get(this.foreach_ref);
        this.foreach_add({ obj: field[field.length - 1], index: field.length - 1 });
    },
    foreach_grandparent_add: function (model) {
        var field = this.grandparent.get(this.foreach_ref);
        this.foreach_add({ obj: field[field.length - 1], index: field.length - 1 });
    },
    foreach_parent_add: function (model) {
        var field = this.parent.get(this.foreach_ref);
        this.foreach_add({ obj: field[field.length - 1], index: field.length - 1 });
    },
    foreach_add_model: function (model) {
        var field   = this.model.get(this.foreach_ref);
        this.foreach_add({ obj: model, index: field.length - 1 });
    },
    foreach_on_add: function (blah) {
        var field   = this.model.get(this.foreach_ref);
        var obj     = field[field.length - 1];

        if (this.data.foreachMap)
            obj = app.collection.get(obj);

        this.foreach_add({ obj: obj, index: field.length - 1 });
    },
    foreach_on_remove: function (model, index) {
        var view = (_.isNumber(index)) ? this.subviews.splice(index, 1)[0] : this.subviews.pop();
        view.remove();
    },
    foreach_add: function (models) {
        var self = this;

        if (!this.data.item) {
            this.item = this.orig._html;
            this._foreach_add(models);
        } else {
            app.templates.fetch(this.get_value(this.data.item), function(tmp) {
                if (!self.$el) return false;
                self.item = tmp;
                self._foreach_add(models);
            });
        }
    },
    _foreach_add: function (models) {
        if (!_.isArray(models)) models = [models];
        var self        = this;
        var opts_array  = [];

        if (this.data.console)
            console.log('Foreach Add', models);

        if (this.data.console)
            console.log('Foreach Item', this, this.item, this.orig);

        if (!this.data) {
            console.log('we have issues with not data', this);
        }

        // expects items to be { obj: obj, index: index }
        _.each(models, function foreach_add_loop(item, count) {
            var $el     = $(self.item).addClass('h__k');

            self.$el.append($el);

            var opts    = {
                el      : $el,
                cluster : self.cluster,
                _scope   : {
                    index   : item.index,
                    value   : (_.isObject(item.obj) && item.obj.cid) ? ''  : item.obj,
                    count   : count
                },
                _super_ : self
            };

            if (self.delay)         opts.delay      = true;

            opts.g_g_g_grandparent  = (_.has(item.obj, 'cid') && self.g_g_grandparent) ? self.g_g_grandparent : self.g_g_g_grandparent;
            opts.g_g_grandparent  = (_.has(item.obj, 'cid') && self.g_grandparent) ? self.g_grandparent : self.g_g_grandparent;
            opts.g_grandparent  = (_.has(item.obj, 'cid') && self.grandparent) ? self.grandparent : self.g_grandparent;
            opts.grandparent    = (_.has(item.obj, 'cid') && self.parent) ? self.parent : self.grandparent;
            opts.parent         = (_.has(item.obj, 'cid')) ? self.model : self.parent;
            opts.model          = (_.has(item.obj, 'cid')) ? item.obj : self.model;
            opts_array.push(opts);
        });

        this.render_subviews(opts_array);

        if (this.data.selected)     this.selected();
        if (this.data.chosen)       this.chosen();
    },
    foreach_remove: function (models) {
        if (!_.isArray(models)) models = [ models ];

        var removed_models  = _.pluck(models, 'id');

        _.each(this.subviews, function (subview) {
            if (subview.model && _.contains(removed_models, subview.model.id)) {
                subview.remove();
            }
        });
    },
    /***************************** SUBVIEWS ***********************************/
    render_subviews: function (opts_array) {
        var self = this;

        function render_subviews() {
            _.each(opts_array, function(opts) {
                if (self.subviews) {
                    var v = new Binding(opts);
                    v._parent = self;
                    self.subviews.push(v);
                }
            });
        };

        render_subviews();
    },
    setup_subview: function () {
        var self    = this;
        var $parent = this.$el;

        if (this.data.foreach)
            return false;

        var opts_array = [];

        this.$el.find('.h__k').each(function setup_subview_loop(i, el) {
            $closest = $(el).parent().closest('.h__k');

            if ($closest[0] == $parent[0] || $closest.length == 0) {
                var opts    = _.extend({}, { el: $(el) });
                var data    = $(el).data();

                if (self.delay)                     opts.delay          = true;
                if (self.cluster)                   opts.cluster        = self.cluster;
                if (self.scope)                     opts._scope         = self.scope.attributes;

                if (self.g_g_g_grandparent)         opts.g_g_g_grandparent= self.g_g_g_grandparent;
                if (self.g_g_grandparent)           opts.g_g_grandparent= self.g_g_grandparent;
                if (self.g_grandparent)             opts.g_grandparent  = self.g_grandparent;
                if (self.grandparent)               opts.grandparent    = self.grandparent;
                if (self.parent)                    opts.parent         = self.parent;

                opts.model      = self.model;
                opts._super_    = self;
                opts.session    = app.session;
                opts.manager    = app.manager;

                opts_array.push(opts);
            }
		});

        this.render_subviews(opts_array);
    },
    /****************************** ATTRIBUTES ********************************/
    process_attrs: function (trigger) {
        var self    = this;
        var json    = this.get_json();
        var attrs   = [];

        $.each(this.$el[0].attributes, function(index, attr) {
            attrs.push({ name: attr.name, value: attr.value });
        });

        if (_.contains('DIV,P,H1,H2,H3,H4,LI,BUTTON,SPAN,LABEL,SELECT,UL,I,OPTION,FORM,PRE,IMG,TEXTAREA,VIDEO,OPTGROUP'.split(','), this.tagName)) {
            if (this.data.console)
                console.log('Process Attr', this);

            attrs.push({ name: '_html', value: this.$el.html() });
        } else if (!_.contains('INPUT'.split(','), this.tagName)) {
            console.log('CHECK IF TAG TO ADD', this.tagName);
        }

        var dummy_tmp = function (data) {
            return function () {
                return data;
            };
        }

        _.each(attrs, function (attr) {
            self.orig[attr.name]    = attr.value;

            if (attr.name == '_html' && attr.value.indexOf('h__k') > -1) {
                self.tmp[attr.name] = new dummy_tmp(self.orig[attr.name])
            } else {
                var subvalue = self.get_subvalue(self.orig[attr.name]);
                self.tmp[attr.name] = app.templates.create(subvalue, self);
            }

            if (attr.value.indexOf('{{') > -1)
                self.setup_attr_listeners(attr);

            // THERE IS A SLIGHTLY SNEAKY BUG WHERE WE DO A DOUBLE RENDER ON SETUP AND ON CHANGE
            if (attr.name !== 'data-foreach' && attr.name !== 'data-if' && attr.name !== 'data-model')
                self.render_attr(attr.name);
        });

        //if (this.tagName == 'TEXTAREA') this.$el.autosize('update');
    },
    setup_attr_listeners: function (attr) {
        var self        = this;

        if (attr.name == '_html' && attr.value.indexOf('h__k') > -1)
            return false;

        var listeners   = this.get_attr_listeners(attr.value);

        _.each(listeners, function setup_listeners_loop(it) {
            var splt        = it.split('.');
            var context     = splt.shift();
            var change      = (splt.length > 0) ? 'change:' + splt.join('.') : 'all';

            if (!self.triggers['_' + attr.name]) {
                self.triggers['_' + attr.name] = function () {
                    if (self.render_attr) {
                        self.render_attr(attr.name);
                    }
                }
            }

            self.listenTo(self[context],    change,     self.triggers['_' + attr.name]);
        });
    },
    get_attr_listeners: function (str_tmp) {
        var self = this;

        if (str_tmp.match(/\{\[(.*?)\]\}/gi))
            str_tmp = this.get_subvalue(str_tmp);

        return _.chain(str_tmp.match(/\{\{(.*?)\}\}/gi))
            .map(function(r) {
                var listeners = r.match(/(session|manager|model|cluster|parent|grandparent|g_grandparent|g_g_grandparent|g_g_g_grandparent|scope)[a-zA-Z.0-9:_\[\]\-']+/gi);
                listeners = _.map(listeners, function(l) { return l.replace(/\['/gi, "[").replace(/'\]/gi, "]"); });
                return listeners;
            })
            .flatten()
            .compact()
            .value();
    },
    render_attr: function (attr_name) {
        if (!this.$el) return false;

        var json    = this.get_json();

        try {
            var val     = this.tmp[attr_name](json);
        } catch (err) {
            if (this.data.console)
                console.log('render_attr: tmp err', err, json, attr_name, this);
        }

        if (attr_name == '_html') {
            try {
                var curr    = this.$el.html();

                if (curr !== val) {
                    this.remove_subviews();
                    this.$el.html(val);
                }
                if (this.data.if && this.if_evaluation !== true) {
                    // Don't render the html of an if statement that isn't true
                } else {
                    this.setup_subview();
                }
            } catch (err) {
                if (this.data.console)
                    console.log('render_attr: _html', err);
            }
        } else {
            var curr    = this.$el.attr(attr_name);
            if (curr !== val) this.$el.attr(attr_name, val);
        }

        // input is stubborn in that you need to set the value
        if (attr_name == 'value')           this.$el.val(val);
        if (attr_name == 'data-if')         this.if();
        if (attr_name == 'data-foreach')    this.foreach_reset();
        if (attr_name == 'data-tooltip')    this.tooltip();
    		if (attr_name == 'data-chosen')     this.chosen();
    		if (attr_name == 'data-selected')   this.selected();
        if (attr_name == 'data-src')        this.src();

        if (this.is_rendered && attr_name == 'class' && this.data.if)
            this.if();    // ensure showing/not showing the right thing
    },
    /***************************** LIBRARIES **********************************/
    svg: function () {
        var self = this;

        app.scripts.fetch('js/libs/lib.snap.min.js', function () {
            app.scripts.fetch('js/libs/lib.snap.zoompan.js', function () {
                if (!self.$el) return false;

                var svg = new app.view.svg({ el: self.$(self.data.svg), model: self.model });
                self.subviews.push(svg);
            });
        });
    },
    d3: function () {
        var self = this;

        app.scripts.fetch('js/libs/lib.d3.min.js', function () {
					if (!self.$el) return false;

          var w = 400, h = 400;
					if (self.data.d3W) w = self.data.d3W;
					if (self.data.d3H) h = self.data.d3H;
          var svg = d3.select(self.$el[0])
            .append('svg')
            .attr('width', w)
            .attr('height', h);

					var stroke_width = +self.model.get("d3_data.stroke_width") * w / 400;
					var stroke_edge_width = +self.model.get("d3_data.stroke_edge_width") * w / 400;

          var line = d3.radialLine()
            .radius(function(d, i){
							// console.log('radius', d);
							return d.x * (w/2 - stroke_edge_width/2); })
            .angle(function(d){
							// console.log('angle', d);
							return d.y; })
            .curve(d3.curveLinear); //curveCatmullRom
            //.interpolate('basis')

					if (self.model.get("d3_data.square") == "true") {
						svg.append("rect")
					    .attr("width", "100%")
					    .attr("height", "100%")
					    .attr("fill", self.model.get("d3_data.background"));
					}

					if (self.model.get("d3_data.circle") == "true") {
						svg.append("circle")
							.attr("cx", w/2)
							.attr("cy", h/2)
							.attr("r", w/2-(+self.model.get("d3_data.circle_stroke_width")/2))
							.attr('stroke', self.model.get("d3_data.circle_stroke"))
							.attr('stroke-width', self.model.get("d3_data.circle_stroke_width"))
							.attr("fill", self.model.get("d3_data.background"));
					}

					console.log("Background", self.model.get("d3_data.background"));

					var interpolated_points = [];
					if (self.model != undefined) {
						var data = self.model.get("d3_data");

						interpolated_points.push(data.points[0]);
						var last_point = interpolated_points[0];
						var r_max_dist = Math.min(0.785398, data.r_max_dist);

						_.each(data.points, function(point, index) {
							if (index > 0) {
								var diff = Math.abs(last_point.y-point.y);
								if (diff > r_max_dist){
									var steps = Math.ceil(diff / r_max_dist);
									for (var i=1; i< steps-1; i++) {
										interpolated_points.push({x: last_point.x + (point.x - last_point.x) * i / steps, y: last_point.y + (point.y - last_point.y) * i / steps })
									}
								}
								interpolated_points.push(point);
								last_point = point;
							}
						});
					}

					// debug with fewer points
					// interpolated_points.reverse();
					// interpolated_points.length = 500;

					//console.log("D3 Rendered Points", interpolated_points);
					console.log("D3 Model: ", self.model.id, interpolated_points.length, self.model.get("d3_data.stroke"), self.model.get("d3_data.stroke_width"));

					var last_points = [];
					var point_count = Math.max(1,self.model.get('d3_data.retrace_steps'));
					_.each(interpolated_points, function(point, index) {
						if (index < interpolated_points.length-1) {
							// setTimeout(function() {
								var line_array = [point, interpolated_points[index+1]];
								// lighter edge
								var edge_path = svg.append('path')
									.datum(line_array)
									.attr('d', line)
									.attr('stroke', self.model.get("d3_data.stroke_edge"))
									.attr('stroke-width', stroke_edge_width)
									.style("stroke-linecap", "round")  // stroke-linecap type
									.attr('fill', 'transparent')
									.attr('transform', 'translate(' + w/2 +','+ h/2 +')');

								var second_array = [];
								if (last_points.length > 0) second_array = last_points.concat(line_array);

								// darker path
								var path = svg.append('path')
									.datum(second_array)
									.attr('d', line)
									.attr('stroke', self.model.get("d3_data.stroke"))
									.attr('stroke-width', stroke_width)
									.style("stroke-linecap", "round")  // stroke-linecap type
									.attr('fill', 'transparent')
									.attr('transform', 'translate(' + w/2 +','+ h/2 +')');

								last_points.push(point);
								if (last_points.length > point_count) last_points.shift();
							// }, 50*index);
						}
					});
        });
    },
    taggle: function () {
      var self = this;
      var tags = this.get(this.data.field) || [];

      app.scripts.fetch('js/libs/lib.taggle.min.js', function () {
        if (!self.$el) return false;

        self.taggle = new Taggle(self.$el[0], {
          tags    : tags,
          placeholder: 'Tags',
          onTagAdd: function(event, tag) {
            self.model.add(self.data.field, tag);
          },
          onTagRemove: function(event, tag) {
            self.model.remove(self.data.field, tag);
          }
        });
      });
    },
    gumwrapper: function () {
        if (app.is_app)
            this.model.set('is_app', 'true');

        var is_app  = this.model.get('is_app');

        if (is_app == 'true') {
            this.$('.gumwrapper_video').addClass('hidden');
            this.model.setup();
        } else {
            var self    = this;
            app.scripts.fetch('js/libs/lib.gumwrapper.js', function () {
                if (!self.$el) return false;

                setTimeout(function () {
                    self.model.gum_instance = new GumWrapper(self.$('.gumwrapper_video'));
                    self.model.setup();
                    self.model.start();
                }, 500);

                // WEIRD BUG REQUIRES TRYING TO LOAD, FAIL, THEN TRY AGAIN
                self.model.gum_instance = new GumWrapper(self.$('.gumwrapper_video'));
                self.model.setup();
            });
        }
    },
    simplemde: function (e) {
        var self = this;

        app.scripts.fetch('js/libs/lib.simplemde.min.js', function () {
            if (!self.$el) return false;

            new SimpleMDE({ element: this.$el });
        });
    },
    chosen: function (e) {
        var self = this;

        app.scripts.fetch('js/libs/lib.chosen.min.js', function () {
            if (!self.$el) return false;

            self.$el.chosen("destroy");

            setTimeout(function () {
                if (self.$el) self.$el.chosen({ width: '100%' });
            }, 50);
        });
    },
    iro: function (e) {
      var self = this;

      // console.log("Iro Colorpicker", this.data.iro, this.get_value(this.data.value));

      // preloaded, don't need to fetch
      // app.scripts.fetch('js/libs/lib.iro.min.js', function () {
      if (!self.$el) return false;

      // setTimeout(function () {
      if (self.$el && !self._iro) {
        iro.use(iroWhitePlugin);

        console.log("Iro Colorpicker", self.data.iro, self.get_value(self.data.value));

        self._iro = iro.ColorPicker(self.data.iro, {
            // Set the size of the color picker
            width: 300,
            // Set the initial color to pure red
            color: self.get_value(self.data.value),
            transparency: true
        });
        function onColorChange(color, changes) {
          // print the color's new hex value to the developer console
          console.log("Color Change:", color.hex8String);
          self.ctx.set(self.data.field,  color.hex8String);
          if (self.data.onUpdate)     self._call(self.data.onUpdate);
        }
        if (self.data.onUpdate) self._iro.on('input:end', onColorChange);
      }
      // }, 50);
      // });
    },
    chart: function (e) {
      var self    = this;
      var d       = this.model.get('data');
      d.type      = d._type;
      d.data      = d._data;
      delete d._type;
      delete d._data;

      app.scripts.fetch('js/libs/lib.chart.min.js', function() {
        if (!self.$el) return false;
        self._chart = new Chart(self.$el, d);
      });
    },
    leaflet: function (e) {
        var self      = this;

        app.scripts.fetch('js/libs/lib.leaflet.min.js', function () {
            if (!self.$el) return false;

            var _leaflet = new app.view.leaflet({ el: self.$(self.data.leaflet), model: self.model });
            self.subviews.push(_leaflet);
        });
    },
    tooltip: function (e) {
        var self = this;

        app.scripts.fetch('js/libs/lib.tooltip.min.js', function () {
            if (!self.$el) return false;

            if (self._tooltip)
                 $(self.el).tooltip('destroy');

            var tooltip = self.get_value(self.data.tooltip);
            self._tooltip = $(self.el).tooltip(tooltip);
        });
    },
    rangetouch: function (e) {
        var self = this;

        app.scripts.fetch('js/libs/lib.rangetouch.js', function () {
            if (!self.$el) return false;
            // do nothing, it auto binds and delegates
        });
    },
    date: function () {
        var self = this;

        app.scripts.fetch('js/libs/lib.datepicker.min.js', function () {
            if (!self.$el) return false;

            self.$el.datepicker('hide')
                .on('changeDate', function (e) {
                    self.$el.data().datepicker.hide();
                    self.update();
                    self.$el.val(self.$el.val()); // Fixes weird display bug
                });
        });
    },
    time: function () {
        var self = this;

        app.scripts.fetch('js/libs/lib.timepicker.min.js', function () {
            if (!self.$el) return false;

            try {
                self.$el
                    .timepicker({ 'timeFormat': 'g:i A', 'step': 15, 'forceRoundTime': true, disableTouchKeyboard: true })
                    .timepicker('setTime', self.get_value(self.data.time))
                    .on('changeTime', function (e) {
                        var d = new Date(self.$el.timepicker('getTime'));
                        self.$el.timepicker('hide');

                        setTimeout(function() {
                            self.ctx.set(self.data.field,  moment(d).format('h:mm A'));
                        }, 200);
                    });
            } catch(err) {
                // do nothing
            }
        });
    },
    time_open: function() {
        this.$el.timepicker().show();
    },
    sortable: function () {
        var self = this;

        app.scripts.fetch('js/libs/lib.sortable.min.js', function () {
            if (!self.$el) return false;

            // only works on arrays
            var sortable = Sortable.create(self.$el[0], {
                handle              : self.data.sortable,
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
    },
    dragula: function () {
      var self        = this;
      var data        = this.get_value(this.data.dragula);
      var arraylike   = document.getElementsByClassName(data.container);
      var containers  = Array.prototype.slice.call(arraylike);

      app.scripts.fetch('js/libs/lib.dragula.min.js', function () {
        if (!self.$el) return false;

        self._dragula = dragula(containers, {
          moves: function (el, container, handle) {
            return handle.classList.contains(data.item);
          },
          accepts: function (el, target, source, sibling) {
            var $s      = $(source).data();
            var $t      = $(target).data();

            var v1      = $s.bind.get_value($s.dragulaAccepts);
            var v2      = $t.bind.get_value($t.dragulaAccepts);

            return v1 == v2;
          },
          revertOnSpill: true
        }).on('drop', function(el, target, source, sibling) {
          var $el     = $(el).data();
          var $t      = $(target).data();
          var change  = $el.bind.get_value($el.dragulaChange);
          var val     = $t.bind.get_value($t.dragulaValue);

          $el.bind._call(change, val);
        });
      });
    },
    fullcalendar: function () {
        var self        = this;

        app.scripts.fetch('js/libs/lib.fullcalendar.js', function () {
            app.scripts.fetch('js/libs/lib.fullcalendar.gcal.js', function () {
                if (!self.$el) return false;

                var api_key = self.model.get('calendar_api_key');
                var cal_id  = self.model.get('calendar_id');

                self.$el.fullCalendar({
                    googleCalendarApiKey: api_key,
                    events: {
                        googleCalendarId: cal_id
                    }
                })

                self.model.set('fullcalendar_loaded','true');
            });
        });
    }
});
