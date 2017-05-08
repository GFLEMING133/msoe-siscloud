var http            = require("http");
var express         = require("express");
var bodyParser		= require('body-parser');
var _               = require('underscore');
var local_config    = require('./config.js');
var fs              = require('fs');
var cleanCSS		= require('clean-css');

var exp             = express();
var app_service     = new express();

var config = {};

_.templateSettings = {
	evaluate	: /\{\{\{(.+?)\}\}\}/gim,
	interpolate	: /\{\{\{\=(.+?)\}\}\}/gim
};

var app = function(given_config,ansible) {
	_.extend(given_config, local_config);

	config = given_config;

	/********************* REGENERATES THE INDEX.HTML *****************************/
	fs.watch(config.dir + '/templates', regenerate_index_page);
	fs.watch(config.dir + '/tmp', regenerate_index_page);
	fs.watch(config.dir + '/js/gen', regenerate_index_page);
	fs.watch(config.dir + '/js/libs', regenerate_index_page);
	fs.watch(config.dir + '/js/models', regenerate_index_page);
	fs.watch(config.dir + '/css', regenerate_index_page);
	fs.watch(config.dir + '/dev.index.html', regenerate_index_page);

	app_service
	.get('/tmp/*', function (req, res) {
		var tmp_file	= req.originalUrl;

		fs.readFile(config.dir + tmp_file, 'utf-8', function(err, resp) {
			if (err) console.log('Couldnt load tmp', tmp_file);
			res.json({ err: err, tmp: resp });
		});
	})
	.get('/js/*', function (req, res) {
		var js_file		= req.originalUrl.split('?');

		fs.readFile(config.dir + js_file[0], 'utf-8', function(err, resp) {
			if (err) console.log('Couldnt load js', js_file);
			res.send(resp);
		});
	})
	.use(express.static(config.dir))
	.use(function(res, req, next) {
	    res.header("Access-Control-Allow-Origin", "*");
	    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	    next();
	});

	http.createServer(app_service).listen(config.port);

	regenerate_index_page();

	console.log('Setup the App Server');
};

function regenerate_index_page() {
	var index_page   = fs.readFileSync(config.dir + '/dev.index.html', 'utf-8');
	var uploads_dir  = config.dir + '/prod';
	if (!fs.existsSync(uploads_dir))
	    fs.mkdirSync(uploads_dir, 0777);

	// Concatenate CSS
	var files	   = [
		"css/bootstrap.min.css",
		"css/font-awesome.min.css",
		"css/styles.css",
	];
	var all = [];
	_.each(files, function(filename) {
		var css = fs.readFileSync(config.dir + '/' + filename, 'utf-8');
		all.push(css)
	});
	var minified = new cleanCSS().minify(all.join('')).styles;
	fs.writeFileSync(config.dir + '/prod/styles.css', minified);
	// 242KB

	// Concatenate Libs
	var files	   = [
		"lib.jquery.min.js",				// 86kb
		"lib.fastclick.min.js",				// 8kb
		"lib.underscore.min.js",			// 16kb
		"lib.backbone.min.js",				// 22kb
		"lib.backbone.nested.js",			// 4kb
		"lib.moment.min.js",				// 34kb
	];
	var all = [];
	_.each(files, function(filename) {
		var js = fs.readFileSync(config.dir + '/js/libs/' + filename, 'utf-8');
		all.push(js);
	});
	fs.writeFileSync(config.dir + '/prod/libs.js', all.join(''));

	// Concatenate Models
	var files  = fs.readdirSync(config.dir + '/js/models', 'utf-8');
	var all	   = []
	_.each(files, function(filename) {
		var js = fs.readFileSync(config.dir + '/js/models/' + filename, 'utf-8');
		all.push(js);
	});

	console.log('config', config.dir);
	
	fs.writeFileSync(config.dir + '/prod/models.js', all.join(''));

	// Concatenate General JS
	var files  = fs.readdirSync(config.dir + '/js/gen', 'utf-8');
	var all	   = [];
	_.each(files, function(filename) {
		var js = fs.readFileSync(config.dir + '/js/gen/' + filename, 'utf-8');
		all.push(js);
	});
	fs.writeFileSync(config.dir + '/prod/gen.js', all.join(''));

	// Concatenate Templates
	var templates   = [];
	var files       = fs.readdirSync(config.dir + '/templates', 'utf-8');
	_.each(files, function (file) {
	    file = fs.readFileSync(config.dir + '/templates/' + file, 'utf-8');
	    templates.push(file);
	});

	var index_tmp	= _.template(index_page);
	var new_index   = index_tmp({
	    base_url			: config.dir,
	    templates			: templates.join(''),
	    all_scripts_link	: ''
	});

	fs.writeFileSync(config.dir + '/index.html', new_index);
	console.log('New Index Page');
}

module.exports = app;
