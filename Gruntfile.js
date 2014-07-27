'use strict';

module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			all: ['src/**/*.js', 'test/**/*.js', 'Gruntfile.js'],
			checkstyle: 'checkstyle.xml',
			options: {
				jshintrc: '.jshintrc'
			},
			gruntfile: {
				src: 'Gruntfile.js'
			},
			src: {
				src: ['src/**/*.js']
			},
			test: {
				src: ['test/**/*.js']
			}
		},
		simplemocha: {
			all: { src: 'test/**/*-test.js' },
			options: {
				ui: 'bdd',
				reporter: 'spec'
			}
		}

	});

	// task loading
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-simple-mocha');

	// ci task
	grunt.registerTask('default', ['simplemocha', 'jshint:all']);
};