/*
 * license-key
 * https://github.com/nicroto/license-key
 *
 * Copyright (c) 2014 Nikolay Tsenkov
 * Licensed under the MIT license.
 */

/* jshint -W098 */

'use strict';

var fs = require('fs'),
	pathUtils = require('path'),
	exec = require('child_process').exec,
	semver = require('semver'),
	Mustache = require('mustache');

var defaultTemplate = fs.readFileSync( pathUtils.resolve( __dirname, "default.template" ), "utf8" );

function Generator(options) {

	var self = this;

	if ( !options || typeof options !== "object" || !Object.keys( options ).length ) {
		throw new Error( "No options are provided!" );
	}

	var fileCheck = function(path, str) {
		if ( !path ) {
			throw new Error( "No " + str + " is specified!" );
		}
		if ( !fs.existsSync( path ) ) {
			throw new Error( str + " doesn't exist!" );
		}
		if ( !fs.statSync( path ).isFile() ) {
			throw new Error( str + " isn't a file!" );
		}
	};

	fileCheck( options.privateKeyPath );
	self.privateKeyPath = options.privateKeyPath;

	var opensslPath = options.opensslPath;
	if ( opensslPath ) {
		fileCheck( opensslPath );
		self.opensslPath = opensslPath;
	}

}

Generator.prototype = {

	privateKeyPath: null,
	opensslPath: "openssl",
	isOpensslChecked: false,
	isOpensslVersionSupported: false,

	generateLicense: function(args, callback) {
		var self = this,
			signThis = args.signThis,
			template = args.template,
			model = args.model ? args.model : { name: signThis },
			serialFormat = model.serialFormat;

		// checks
		if ( !signThis || typeof signThis !== "string" ) {
			throw new Error( "Invalid data to be signed!" );
		}
		if ( model && typeof model !== "object" ) {
			throw new Error( "Model should be an object!" );
		}
		if ( serialFormat !== undefined && typeof serialFormat !== "function" ) {
			throw new Error( "model.serialFormat should be a function!" );
		}
		if ( template && typeof template !== "string" ) {
			throw new Error( "Template should be a string!" );
		}
		if ( !callback ) {
			throw new Error( "No callback is assigned!" );
		}
		if ( typeof callback !== "function" ) {
			throw new Error( "No callback is assigned!" );
		}

		// clean model from non-data props
		delete model.serialFormat;

		// should default template be used?
		if ( !template ) {
			template = template ? template : defaultTemplate;

			// default model props
			model.name = ( model.name !== undefined ) ? model.name : signThis;
		}

		self._checkOpenssl( function() {
			self._generateSerial( signThis, function(serial) {
				model.serial = serialFormat ? serialFormat( serial ) : serial;
				callback( Mustache.render( template, model ) );
			} );
		} );
	},

	_checkOpenssl: function(callback) {
		var self = this;
		var throwError = function() {
			throw new Error( "Openssl version isn't supported! Should be >= 1.0.1" );
		};

		if ( !self.isOpensslChecked ) {
			exec( self.opensslPath + " version", function(error, stdout, stderror) {
				self.isOpensslChecked = true;
				self.isOpensslVersionSupported = self._isOpensslVersionSupported( stdout );
				if ( self.isOpensslVersionSupported ) {
					callback();
				} else {
					throwError();
				}
			} );
		} else if ( !self.isOpensslVersionSupported ) {
			throwError();
		} else if ( self.isOpensslVersionSupported ) {
			callback();
		}
	},

	_isOpensslVersionSupported: function(str) {
		var matchs = str.match(/([0-9][0-9]*)\.([0-9][0-9]*)\.([0-9][0-9]*)/g);

		if ( matchs.length === 1 ) {
			var version = matchs[0];

			return semver.satisfies( version, ">=1.0.1" );
		}

		return false;
	},

	_generateSerial: function(signThis, callback) {
		var self = this,
			opensslPath = self.opensslPath,
			privateKeyPath = self.privateKeyPath,
			signScriptPath = pathUtils.resolve( __dirname, "..", "bin", "sign.sh" );

		var command = [
			signScriptPath, opensslPath, privateKeyPath, JSON.stringify( signThis )
		].join(" ");
		exec( command, function(error, stdout, stderror) {
			callback( stdout.replace( /(\n|\s|\=)/g, "" ) );
		} );
	}

};

module.exports = Generator;