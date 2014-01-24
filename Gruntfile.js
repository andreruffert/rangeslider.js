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
            '<%= pkg.license %> license | <%= pkg.homepage %> */\n'
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
                    specify: 'src/rangeslider.scss',
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
                src: ['src/rangeslider.js'],
                dest: 'rangeslider.js'
            }
        },

        // Generate a minified version
        uglify: {
            options: {
                banner: '<%= meta.banner %>'
            },
            dist: {
                src: ['rangeslider.js'],
                dest: 'rangeslider.min.js'
            }
        }
    });

    // Build task
    grunt.registerTask('build', ['compass:dist', 'jshint', 'concat:dist', 'uglify:dist']);
};
