/**
 * An extension of Backbone.js that keeps track of nested attributes
 *
 * Copyright (c) 2011-2012 Aidan Feldman
 * MIT Licensed (LICENSE)
 */

/*global define, require, module */

(function(root, factory) {
    if (typeof exports !== 'undefined') {
        // Define as CommonJS export:
        module.exports = factory(require("jquery"), require("underscore"), require("backbone"));
    } else if (typeof define === 'function' && define.amd) {
        // Define as AMD:
        define(["jquery", "underscore", "backbone"], factory);
    } else {
        // Just run it:
        factory(root.$, root._, root.Backbone);
    }
}(this, function($, _, Backbone) {
    'use strict';

    var _delayedTriggers = [],
        nestedChanges;

    Backbone.NestedModel = Backbone.Model.extend({

        get: function(attrStrOrPath, debug) {
            return Backbone.NestedModel.walkThenGet(this.attributes, attrStrOrPath, debug);
        },

        previous: function(attrStrOrPath) {
            return Backbone.NestedModel.walkThenGet(this._previousAttributes, attrStrOrPath);
        },

        has: function(attr) {
            // for some reason this is not how Backbone.Model is implemented - it accesses the attributes object directly
            var result = this.get(attr);
            return !(result === null || _.isUndefined(result));
        },

        set: function(key, value, opts) {
            var newAttrs = Backbone.NestedModel.deepClone(this.attributes),
                attrPath,
                unsetObj,
                validated;

            if (_.isString(key)) {
                attrPath = Backbone.NestedModel.attrPath(key);
            } else if (_.isArray(key)) {
                attrPath = key;
            }

            if (attrPath) {
                opts = opts || {};
                this._setAttr(newAttrs, attrPath, value, opts);
            } else { // it's an Object
                opts = value || {};
                var attrs = key;
                for (var _attrStr in attrs) {
                    if (attrs.hasOwnProperty(_attrStr)) {
                        this._setAttr(newAttrs,
                            Backbone.NestedModel.attrPath(_attrStr),
                            opts.unset ? void 0 : attrs[_attrStr],
                            opts);
                    }
                }
            }

            nestedChanges = Backbone.NestedModel.__super__.changedAttributes.call(this);

            if (opts.unset && attrPath && attrPath.length === 1) { // assume it is a singular attribute being unset
                // unsetting top-level attribute
                unsetObj = {};
                unsetObj[key] = void 0;
                nestedChanges = _.omit(nestedChanges, _.keys(unsetObj));
                validated = Backbone.NestedModel.__super__.set.call(this, unsetObj, opts);
            } else {
                unsetObj = newAttrs;

                // normal set(), or an unset of nested attribute
                if (opts.unset && attrPath) {
                    // make sure Backbone.Model won't unset the top-level attribute
                    opts = _.extend({}, opts);
                    delete opts.unset;
                } else if (opts.unset && _.isObject(key)) {
                    unsetObj = key;
                }
                nestedChanges = _.omit(nestedChanges, _.keys(unsetObj));
                validated = Backbone.NestedModel.__super__.set.call(this, unsetObj, opts);
            }


            if (!validated) {
                // reset changed attributes
                this.changed = {};
                nestedChanges = {};
                return false;
            }


            this._runDelayedTriggers();
            return this;
        },

        unset: function(attr, options) {
            return this.set(attr, void 0, _.extend({}, options, {
                unset: true
            }));
        },

        clear: function(options) {
            nestedChanges = {};

            // Mostly taken from Backbone.Model.set, modified to work for NestedModel.
            options = options || {};
            // clone attributes so validate method can't mutate it from underneath us.
            var attrs = _.clone(this.attributes);
            if (!options.silent && this.validate && !this.validate(attrs, options)) {
                return false; // Should maybe return this instead?
            }

            var changed = this.changed = {};
            var model = this;

            var setChanged = function(obj, prefix, options) {
                // obj will be an Array or an Object
                _.each(obj, function(val, attr) {
                    var changedPath = prefix;
                    if (_.isArray(obj)) {
                        // assume there is a prefix
                        changedPath += '[' + attr + ']';
                    } else if (prefix) {
                        changedPath += '.' + attr;
                    } else {
                        changedPath = attr;
                    }

                    val = obj[attr];
                    if (_.isObject(val)) { // clear child attrs
                        setChanged(val, changedPath, options);
                    }
                    if (!options.silent) model._delayedChange(changedPath, null, options);
                    changed[changedPath] = null;
                });
            };
            setChanged(this.attributes, '', options);

            this.attributes = {};

            // Fire the `"change"` events.
            if (!options.silent) this._delayedTrigger('change');

            this._runDelayedTriggers();
            return this;
        },
        add: function(attrStr, value, opts) {
            attrStr = attrStr.replace('[]', '');

            var current = this.get(attrStr);
            if (!current) {     // undefined.. let's set up
                current = [];
                this.set(attrStr, current, { silent: true });
            }

            if (!_.isArray(current)) throw new Error('current value is not an array');

            this.set(attrStr + '[' + current.length + ']', value, opts);
            current.push(value);
            this.trigger('add:' + attrStr, this, current);

            return this;
        },
        remove: function(attrStr, val, opts) {
            opts           = opts || {};
            var old_val    = this.get(attrStr);
			var match      = attrStr.match(/\[[0-9]+\]/g);
			var lastIndex  = attrStr.length;

            if (val) {
                var old_val = this.get(attrStr);
                var new_val = _.without(old_val, val);
                this.set(attrStr, new_val, opts);
            } else if (_.isArray(match) && match.length > 0) {
			  lastIndex  = attrStr.lastIndexOf(match[match.length-1]);
              // we have an array
              var val     = old_val;
              var old_val = this.get(attrStr.slice(0, lastIndex));
              var new_val = _.without(old_val, val);

              this.set(attrStr.slice(0, lastIndex), new_val, { silent: true });
            } else if (!_.isArray(old_val)) {
                throw new Error('current value is not an array');
            } else {
                var new_val = _.without(old_val, val);
                this.set(attrStr, new_val, opts);
            }

            if (!opts.silent) {
                this.trigger('remove:' + attrStr.slice(0, lastIndex), this, new_val);
            }
            return this;
        },

        changedAttributes: function(diff) {
            var backboneChanged = Backbone.NestedModel.__super__.changedAttributes.call(this, diff);
            if (_.isObject(backboneChanged)) {
                return _.extend({}, nestedChanges, backboneChanged);
            }
            return false;
        },

        toJSON: function() {
            return Backbone.NestedModel.deepClone(this.attributes);
        },


        // private
        _delayedTrigger: function( /* the trigger args */ ) {
            _delayedTriggers.push(arguments);
        },

        _delayedChange: function(attrStr, newVal, options) {
            this._delayedTrigger('change:' + attrStr, this, newVal, options);

            // Check if `change` even *exists*, as it won't when the model is
            // freshly created.
            if (!this.changed) {
                this.changed = {};
            }

            this.changed[attrStr] = newVal;
        },

        _runDelayedTriggers: function() {
            while (_delayedTriggers.length > 0) {
                this.trigger.apply(this, _delayedTriggers.shift());
            }
        },

        // note: modifies `newAttrs`
        _setAttr: function(newAttrs, attrPath, newValue, opts) {
            opts = opts || {};

            var fullPathLength = attrPath.length;
            var model = this;

            Backbone.NestedModel.walkPath(newAttrs, attrPath, function(val, path, next) {
                var attr = _.last(path);
                var attrStr = Backbone.NestedModel.createAttrStr(path);

                // See if this is a new value being set
                var isNewValue = !_.isEqual(val[attr], newValue);

                if (path.length === fullPathLength) {
                    // reached the attribute to be set

                    if (opts.unset) {
                        // unset the value
                        delete val[attr];

                        // Trigger Remove Event if array being set to null
                        if (_.isArray(val)) {
                            var parentPath = Backbone.NestedModel.createAttrStr(_.initial(attrPath));
                            model._delayedTrigger('remove:' + parentPath, model, val[attr]);
                        }
                    } else {
                        // Set the new value
                        val[attr] = newValue;
                    }

                    // Trigger Change Event if new values are being set
                    if (!opts.silent && _.isObject(newValue) && isNewValue) {
                        var visited = [];
                        var checkChanges = function(obj, prefix) {
                            // Don't choke on circular references
                            if (_.indexOf(visited, obj) > -1) {
                                return;
                            } else {
                                visited.push(obj);
                            }

                            var nestedAttr, nestedVal;
                            for (var a in obj) {
                                if (obj.hasOwnProperty(a)) {
                                    nestedAttr = prefix + '.' + a;
                                    nestedVal = obj[a];
                                    if (!_.isEqual(model.get(nestedAttr), nestedVal)) {
                                        model._delayedChange(nestedAttr, nestedVal, opts);
                                    }
                                    if (_.isObject(nestedVal)) {
                                        checkChanges(nestedVal, nestedAttr);
                                    }
                                }
                            }
                        };
                        checkChanges(newValue, attrStr);

                    }


                } else if (!val[attr]) {
                    if (_.isNumber(next)) {
                        val[attr] = [];
                    } else {
                        val[attr] = {};
                    }
                }

                if (!opts.silent) {
                    // let the superclass handle change events for top-level attributes
                    if (path.length > 1 && isNewValue) {
                        model._delayedChange(attrStr, val[attr], opts);
                    }

                    /* HANDLE IN THE ARRAY ADD / REMOVE
                    if (_.isArray(val[attr])){
                      model._delayedTrigger('add:' + attrStr, model, val[attr]);
                    }
                    */
                }
            });
        }

    }, {
        // class methods

        attrPath: function(attrStrOrPath, debug) {
            var path;

            if (_.isString(attrStrOrPath)) {
                path = (attrStrOrPath === '') ? [''] : attrStrOrPath.match(/[^\.\[\]]+/g);

                if (debug)
                    console.log('attrPath: first path', path);

                path = _.map(path, function(val) {
                    // convert array accessors to numbers & remove extra quotes for accessors
                    return val.match(/^\d+$/) ? parseInt(val, 10) : val.replace(/^'/, '').replace(/'$/gi, '');
                });
            } else {
                path = attrStrOrPath;
            }

            return path;
        },

        createAttrStr: function(attrPath) {
            var attrStr = attrPath[0];
            _.each(_.rest(attrPath), function(attr) {
                attrStr += _.isNumber(attr) ? ('[' + attr + ']') : ('.' + attr);
            });

            return attrStr;
        },

        deepClone: function(obj) {
            // NOTE: TK CHANGE FOR RUNNING IN NODEJS
            return JSON.parse(JSON.stringify(obj));
            //return $.extend(true, {}, obj);
        },

        walkPath: function(obj, attrPath, callback, scope) {
            var val = obj,
                childAttr;

            // walk through the child attributes
            for (var i = 0; i < attrPath.length; i++) {
                callback.call(scope || this, val, attrPath.slice(0, i + 1), attrPath[i + 1]);

                childAttr = attrPath[i];
                val = val[childAttr];
                if (!val) break; // at the leaf
            }
        },

        walkThenGet: function(attributes, attrStrOrPath, debug) {
            var attrPath = Backbone.NestedModel.attrPath(attrStrOrPath, debug),
                result;

            Backbone.NestedModel.walkPath(attributes, attrPath, function(val, path) {
                var attr = _.last(path);
                if (path.length === attrPath.length) {
                    // attribute found
                    result = val[attr];
                }
            });

            if (debug)
                console.log('walkthenget: attributes', attributes, attrPath,result)

            return result;
        }

    });

    return Backbone;
}));
