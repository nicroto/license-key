# license-key [![Build Status](https://secure.travis-ci.org/nicroto/license-key.png?branch=master)](http://travis-ci.org/nicroto/license-key)

License-key generator for NodeJS.

## Getting Started
Install license-key with:
```bash
$ npm install license-key
```

## Description
NodeJS module for generation of license-keys. This module supports DSA and ECDSA keys (this is the current state-of-the-art, since it provides the same level of security as RSA, but in shorter keys). The generated license-key is intended as a copy-paste type of text, not to be rewritten letter-by-letter by the end-user. The serial number part of the license is encoded in base64 (usually people implement their own base32 scheme, but since there is no clear standard, and since this is a copy-paste solution - keys get smaller with base64, it is therefore the better solution).

## Dependencies
The module requires openssl. You can specify a custom path if you want to use a custom build/install, that isn't on the PATH. **Supported are versions starting from 1.0.1**.

## Init
The module exports the LicenseGenerator type, which is initialized with the **absolute** path to your private key, and optionally the **absolute** path to a custom build of OpenSSSL (otherwise it will try to use the one on the PATH if any):
```javascript
var pathUtils = require('path'),
	LicenseGenerator = require('license-key');

var lgen = new LicenseGenerator( {
	privateKeyPath: pathUtils.resolve( "custom/path/to/your/private/key" ),
	opensslPath: pathUtils.resolve( "custom/path/to/openssl" )
} );
```

## Generating Licenses
Once you create an instance of the generator the default way of generating a key is:
```javascript
var signThis = "Nikolay Tsenkov";
lgen.generateLicense( {
	signThis: signThis
}, function(error, license) {
	// ...
} );
```

This will produce a license key, which uses the default template and will look similar to this:
```
====BEGIN LICENSE====
Nikolay Tsenkov
xxxxxxxxxxxxxxxxxxxxx
=====END LICENSE=====
```

Templates are standard mustache tempaltes. If the default tempalte is used, then the model bound the default tempalte has 2 default fields - name and serial.

## Custom License templates
You can create your own mustache template (this sounds weird :smile:). If you provide your own template, then the only field in the model data will be automatically added will be the produced serial. You need to specify the serial field in the template, or otherwise will get license with no serial.

Here is a sample of a custom template:
```javascript
var signThis = "Nikolay Tsenkov",
	template = [
		"====Custom Begin====",
		"Name: {{&name}}",
		"",
		"{{&serial}}",
		"=====Custom End====="
	].join( "\n" );
lgen.generateLicense( {
	signThis: signThis,
	template: template
}, function(error, license) {
	// ...
} );
```

This will produce something like:


```
====Custom Begin====
Name: Nikolay Tsenkov

xxxxxxxxxxxxxxxxxxxxx
=====Custom End=====
```

As you can see, you don't specify the model and your ```name``` and ```serial``` fields are automatically mapped (they are the default fields).

If you pass a model, though, then only serial is being dynamically added to it - it's up to you, what else you want and how you want to display it.

Here is an example with a bit more data:
```javascript
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
		appMeta: appMeta
	}
}, function(error, license) {
	// ...
} );
```

As you can see, here you generate the license serial, from something that you don't display (check signThis). Here is the approximate result:
```
====BEGIN LICENSE====
Nikolay Tsenkov
some@email.com
Quantity: 1
appVersion: 1
xxxxxxxxxxxxxxxxxxxxx
=====END LICENSE=====
```

## Custom serial formatting
Since serial numbers are generally pretty big and messy strings, you might want to format the serial into pretty columns. You can do so, by passing a serialFormat function in the model:
```javascript
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
				numOfColPerRow = 4,
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
	// ...
} );
```

This should produce something like this:
```
====BEGIN LICENSE====
Nikolay Tsenkov
some@email.com
Quantity: 1
appVersion: 1
xxxx xxxx xxxx xxxx
xxxx xxxx xxxx xxxx
=====END LICENSE=====
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
 - 0.2.0
 	- Improve: lgen.generateLicense to be able to return errors on callback

```javascript 	
lgen.generateLicense( data, function(error, license) {...} );
```

 	- Improve: add grunt-release for easier release on npm.
 - 0.1.0

## License
Copyright (c) 2017 Nikolay Tsenkov  
Licensed under the MIT license.
