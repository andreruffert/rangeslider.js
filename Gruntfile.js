module.exports = function (grunt) {

    'use strict';

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Project configuration.
    grunt.initConfig({
        pkg: require('./package'),

        meta: {
            banner: '/*! <%= pkg.name %> - v<%= pkg.version %> | ' +
            '(c) <%= grunt.template.today("yyyy") %> @andreruffert | ' +
            'MIT license | http://github.com/andreruffert/rangeslider */\n'
        },

        // Watches files for changes and runs tasks based on the changed files
        watch: {
            compass: {
                files: ['src/{,*/}*.{scss,sass}'],
                tasks: ['compass:dist']
            },
            concat: {
                files: 'src/{,*/}*.js',
                tasks: ['concat:dist', 'uglify:dist']
            }
        },

        // Make sure code styles are up to par and there are no obvious mistakes
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: [
                'Gruntfile.js',
                'src/{,*/}*.js'
            ],
        },

        // Compiles Sass to CSS and generates necessary files if requested
        compass: {
            options: {
                sassDir: 'src',
                cssDir: './'
            },
            dist: {
                options: {
                    banner: '<%= meta.banner %>',
                    specify: 'src/<%= pkg.name %>.scss',
                    debugInfo: false,
                    noLineComments: true
                }
            }
        },

        // Prepend a banner to the files
        concat: {
            options: {
                banner: '<%= meta.banner %>'
            },
            dist: {
                src: ['src/<%= pkg.name %>.js'],
                dest: '<%= pkg.name %>.js'
            }
        },

        // Generate a minified version
        uglify: {
            options: {
                banner: '<%= meta.banner %>'
            },
            dist: {
                src: ['<%= pkg.name %>.js'],
                dest: '<%= pkg.name %>.min.js'
            }
        }
    });

    // Build task
    grunt.registerTask('build', ['jshint', 'concat:dist', 'uglify:dist']);
};
