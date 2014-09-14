/* jshint -W030 */
/* jshint -W098 */

'use strict';

var should = require('should'),
	fs = require('fs'),
	pathUtils = require('path'),
	Mustache = require('mustache'),
	LicenseGenerator = require(".."),
	defaultTemplate = fs.readFileSync( pathUtils.resolve( __dirname, "..", "src", "default.template" ), "utf8" );

var privateKeyPath = pathUtils.resolve( __dirname, "data", "private.pem" ),
	nonFilePath = pathUtils.resolve( __dirname, "data" );

describe( "license-key", function() {
	describe( "new LicenseGenerator( { privateKeyPath:.., opensslPath:.. } )", function() {
		it( "should throw an error if no options are provided", function() {
			should( function() {
				var lgen = new LicenseGenerator();
			} ).throw();
			should( function() {
				var lgen = new LicenseGenerator( {} );
			} ).throw();
		} );
		it( "should throw an error if privateKeyPath isn't provided", function() {
			should( function() {
				var lgen = new LicenseGenerator( {} );
			} ).throw();
		} );
		it( "should throw an error if privateKeyPath doesn't exist", function() {
			should( function() {
				var lgen = new LicenseGenerator( {
					privateKeyPath: "non-existent-path"
				} );
			} ).throw();
		} );
		it( "should throw an error if privateKeyPath is not a file", function() {
			should( function() {
				var lgen = new LicenseGenerator( {
					privateKeyPath: nonFilePath
				} );
			} ).throw();
		} );
		it( "should use global openssl if no path provided", function() {
			var lgen = new LicenseGenerator( {
				privateKeyPath: privateKeyPath
			} );
			lgen.opensslPath.should.equal( "openssl" );
		} );
		it( "should throw an error if opensslPath doesn't exist", function() {
			should( function() {
				var lgen = new LicenseGenerator( {
					privateKeyPath: privateKeyPath,
					opensslPath: "non-existent-path"
				} );
			} ).throw();
		} );
		it( "shouldn't throw an error if privateKeyPath is valid and openssl is on PATH", function() {
			should( function() {
				var lgen = new LicenseGenerator( {
					privateKeyPath: privateKeyPath
				} );
			} ).not.throw();
		} );
	} );
	describe( "prototype_isOpensslVersionSupported", function() {
		it( "should return false if version isn't supported", function() {
			LicenseGenerator.prototype._isOpensslVersionSupported( "OpenSSL 0.9.8g 7 Apr 2009" ).should.not.be.ok;
			LicenseGenerator.prototype._isOpensslVersionSupported( "OpenSSL 0.9.7b 7 Apr 2004" ).should.not.be.ok;
			LicenseGenerator.prototype._isOpensslVersionSupported( "OpenSSL 0.9.9b 7 Apr 2005" ).should.not.be.ok;
			LicenseGenerator.prototype._isOpensslVersionSupported( "OpenSSL 1.0.0b 7 Apr 2013" ).should.not.be.ok;
			LicenseGenerator.prototype._isOpensslVersionSupported( "some unpredictable format 0.9.7b 21/04/2004" ).should.not.be.ok;
			LicenseGenerator.prototype._isOpensslVersionSupported( "0.9.9b 21/04/2004" ).should.not.be.ok;
			LicenseGenerator.prototype._isOpensslVersionSupported( "1.0.0b 21/04/2004" ).should.not.be.ok;
		} );
		it( "should return true if version is supported", function() {
			LicenseGenerator.prototype._isOpensslVersionSupported( "OpenSSL 1.0.1g 7 Apr 2014" ).should.be.ok;
			LicenseGenerator.prototype._isOpensslVersionSupported( "OpenSSL 1.0.8g 8 Apr 2014" ).should.be.ok;
			LicenseGenerator.prototype._isOpensslVersionSupported( "OpenSSL 1.0.9g 10 Apr 2014" ).should.be.ok;
			LicenseGenerator.prototype._isOpensslVersionSupported( "OpenSSL 2.0.1g 7 Apr 2014" ).should.be.ok;
			LicenseGenerator.prototype._isOpensslVersionSupported( "some unpredictable format 2.0.1b 21/04/2016" ).should.be.ok;
			LicenseGenerator.prototype._isOpensslVersionSupported( "1.0.1g 21/04/2014" ).should.be.ok;
			LicenseGenerator.prototype._isOpensslVersionSupported( "1.0.7g 21/04/2018" ).should.be.ok;
		} );
	} );
	describe( "generateLicense( { signThis:.., serialFormat:.., model:.., template:.. }, callback )", function() {
		var lgen = new LicenseGenerator( {
				privateKeyPath: privateKeyPath
			} ),
			serial = "xxxxxxxxxxxxxxxx"; // 16 symbols
		// mock serial creation for predictability
		lgen._generateSerial = function(signThis, callback) {
			callback( null, serial );
		};
		it( "should return an error if signThis is not a valid string (at least 1 character)", function() {
			lgen.generateLicense( {}, function(error) {
				should.exist( error );
			} );
			lgen.generateLicense( { signThis: null }, function(error) {
				should.exist( error );
			} );
			lgen.generateLicense( { signThis: 1 }, function(error) {
				should.exist( error );
			} );
			lgen.generateLicense( { signThis: {} }, function(error) {
				should.exist( error );
			} );
			lgen.generateLicense( { signThis: "" }, function(error) {
				should.exist( error );
			} );
		} );
		it( "should throw an error if no callback is passed", function() {
			should( function() {
				lgen.generateLicense( { signThis: "data to sign" } );
			} ).throw();
			should( function() {
				lgen.generateLicense( { signThis: "data to sign" }, 1 );
			} ).throw();
			should( function() {
				lgen.generateLicense( { signThis: "data to sign" }, {} );
			} ).throw();
		} );
		it( "shouldn't return an error if no model is passed", function() {
			lgen.generateLicense( { signThis: "data to sign" }, function(error) {
				should.not.exist( error );
			} );
			lgen.generateLicense( {
				signThis: "data to sign",
				model: {}
			}, function(error) {
				should.not.exist( error );
			} );
		} );
		it( "should return an error if model is passed but not an object", function() {
			lgen.generateLicense( {
				signThis: "data to sign",
				model: 1
			}, function(error) {
				should.exist( error );
			} );
		} );
		it( "should return an error if template is passed but isn't a string", function() {
			lgen.generateLicense( {
				signThis: "data to sign",
				template: 1
			}, function(error) {
				should.exist( error );
			} );
			lgen.generateLicense( {
				signThis: "data to sign",
				template: {}
			}, function(error) {
				should.exist( error );
			} );
		} );
		it( "generates a license key with the default tempalte", function(done) {
			var signThis = "Nikolay Tsenkov";
			lgen.generateLicense( {
				signThis: signThis
			}, function(error, license) {
				should.not.exist( error );
				license.should.equal( Mustache.render( defaultTemplate, {
					name: signThis,
					serial: serial
				} ) );
				done();
			} );
		} );
		it( "uses model.name if provided, instead of signed data", function(done) {
			var signThis = "Nikolay Tsenkov | some@email.domain",
				name = "Nikolay Tsenkov";
			lgen.generateLicense( {
				signThis: signThis,
				model: {
					name: name
				}
			}, function(error, license) {
				should.not.exist( error );
				license.should.equal( Mustache.render( defaultTemplate, {
					name: name,
					serial: serial
				} ) );
				done();
			} );
		} );
		it( "generates a license key with custom tempalte", function(done) {
			var signThis = "Nikolay Tsenkov",
				template = [
					"====Custom Begin====",
					"Name: {{&name}}",
					"{{&serial}}",
					"=====Custom End====="
				].join( "\n" );
			lgen.generateLicense( {
				signThis: signThis,
				template: template
			}, function(error, license) {
				should.not.exist( error );
				license.should.equal( Mustache.render( template, {
					name: signThis,
					serial: serial
				} ) );
				done();
			} );
		} );
		it( "should return an error if model.serialFormat is passed, but it's not a function", function() {
			lgen.generateLicense( {
				signThis: "data to sign",
				model: {
					serialFormat: {}
				}
			}, function(error) {
				should.exist( error );
			} );
			lgen.generateLicense( {
				signThis: "data to sign",
				model: {
					serialFormat: 1
				}
			}, function(error) {
				should.exist( error );
			} );
			lgen.generateLicense( {
				signThis: "data to sign",
				model: {
					serialFormat: ""
				}
			}, function(error) {
				should.exist( error );
			} );
		} );
		it( "uses serialFormat function for serial if provided in the model", function(done) {
			var signThis = "Nikolay Tsenkov",
				formattedSerial = "||" + serial + "||";
			lgen.generateLicense( {
				signThis: signThis,
				model: {
					serialFormat: function() {
						return formattedSerial;
					}
				}
			}, function(error, license) {
				should.not.exist( error );
				license.should.equal( Mustache.render( defaultTemplate, {
					name: signThis,
					serial: formattedSerial
				} ) );
				done();
			} );
		} );
		it( "works in a real-world example", function(done) {
			var name = "Nikolay Tsenkov",
				email = "some@email.com",
				licenseMeta = "Quantity: 1",
				appMeta = "appVersion: 1",
				signThis = [ name, email, licenseMeta, appMeta ].join( " | " ),
				template = [
					"====BEGIN LICENSE====",
					"{{&name}}",
					"{{&email}}",
					"{{&licenseMeta}}",
					"{{&appMeta}}",
					"{{&serial}}",
					"=====END LICENSE====="
				].join( "\n" );
			lgen.generateLicense( {
				signThis: signThis,
				template: template,
				model: {
					name: name,
					email: email,
					licenseMeta: licenseMeta,
					appMeta: appMeta,
					serialFormat: function(serial) {
						var colLength = 4,
							numOfColPerRow = 2,
							length = serial.length,
							numberOfColumns = (length % colLength) === 0 ? length / colLength : Math.ceil( length / colLength ),
							regex = new RegExp( ".{1," + colLength + "}", "g" ),
							colData = serial.match( regex ),
							resultLines = [];
						while ( colData.length ) {
							var row = colData.splice( 0, numOfColPerRow );
							resultLines.push( row.join( " " ) );
						}
						return resultLines.join( "\n" );
					}
				}
			}, function(error, license) {
				should.not.exist( error );
				license.should.equal( Mustache.render( template, {
					name: name,
					email: email,
					licenseMeta: licenseMeta,
					appMeta: appMeta,
					serial: [
						"xxxx xxxx",
						"xxxx xxxx"
					].join( "\n" )
				} ) );
				done();
			} );
		} );
	} );
} );