/**
 * @param {Grunt} grunt
 */
module.exports = function(grunt) {

	"use strict";

	// load tasks via package.json
	require('load-grunt-tasks')(grunt);

	if(grunt.file.exists('node_modules/grunt-spiritual-edbml')) {
		grunt.task.loadNpmTasks('grunt-spiritual-edbml');
	} else {
		grunt.log.error(
			'Please run grunt:init to build grunt-spiritual-edbml \n' +
			'into the node_modules folder so that we can test it.'
		);
	}

	// JSHint options
	var options = grunt.file.readJSON('.jshintrc');
	options.unused = false;


	// Config ....................................................................

	grunt.initConfig({

		// remove old tests
		clean: [
			'test/build/**.*'
		],

		// validate you all
		jshint: {
			validate: {
				options: options,
				jshintrc: '.jshintrc',
				src: [
					'Gruntfile.js',
					'src/**/*.js',
					'tasks/src/**/*.js'
				]
			}
		},

		// concat twice, before and after transpilation
		concat: {
			before: {
				options: {
					separator: '\n\n\n',
				},
				dest: 'build/compiler-es6.js',
				src: [
					"header.js",
					"compilers/Compiler.js",
					"compilers/FunctionCompiler.js",
					"compilers/ScriptCompiler.js",
					"helpers/Instruction.js",
					"helpers/Stripper.js",
					"helpers/Runner.js",
					"helpers/Result.js",
					"helpers/Status.js",
					"helpers/Markup.js",
					"helpers/Output.js",
					"footer.js"
				].map(function(src) {
					return "src/" + src;
				})
			},
			after: {
				options: {
					separator: '\n\n\n',
					banner: "\"use strict\";\n",
					process: function(src, filepath) {
						return '// Source: ' + filepath + '\n' +
							src.replace(/(^|\n)[ \t]*('use strict');?\s*/g, '$1').
						replace(/(^|\n)[ \t]*("use strict");?\s*/g, '$1');
					},
				},
				dest: 'tasks/things/compiler.js',
				src: ['build/compiler-es5.js']
			}
		},

		// transpile to es5
		es5to6: {
			transpile: {
				files: {
					'build/compiler-es5.js': 'build/compiler-es6.js'
				}
			}
		},

		// watch out
		watch: {
			scripts: {
				files: ["**/*.js"],
				tasks: [
					'concat:before',
					'es5to6',
					'concat:after'
				],
				options: {
					spawn: true
				}
			}
		},

		// manually install a build of this project in the
		// the node_modules folder so that we can test it.
		copy: {
			fake_node_module: {
				files: [{
					expand: true,
					cwd: '.',
					src: [
						'*.*',
						'tasks/**'
					],
					dest: 'node_modules/grunt-spiritual-edbml'
				}]
			}
		},

		// run this grunt task (because we copied 
		// ourselves into node_modules) on tests.
		edbml: {
			test_outline: {
				options: {},
				files: {
					"test/build/js/outline.js": ["test/src/edbml/outline/**/*.edbml"]
				}
				/*
				expand: true,
				dest: 'test/out/inline',
				cwd: 'test/src/inline',
				src: ['*.edbml']
				*/
			},
			test_inline: {
				options: {
					inline: true,
					beautify: true
				},
				expand: true,
				dest: 'test/build/html',
				cwd: 'test/src/edbml/inline',
				src: ['*.edbml']
			}
		},

		// testing the stuff
		karma: {
			options: {
				configFile: 'test/karma.conf.js'
			},
			unit: {
				browsers: ['Chrome'],
				singleRun: true
			}
		}

	});

	// Custom tasks ..............................................................

	/**
	 * Compile ES5 to ES6.
	 */
	grunt.registerMultiTask('es5to6', 'It\'s a way to make a living', function() {
		var files = this.data.files,
			to5 = require("6to5");
		Object.keys(files).forEach(function(target) {
			var source = files[target];
			source = grunt.file.read(source);
			grunt.file.write(target, to5.transform(source).code);
		});
	});


	// Command line tasks ........................................................

	/**
	 * Build sequence.
	 * @returns {Array<string>}
	 */
	function build() {
		return [
			'jshint',
			'concat:before',
			'es5to6',
			'concat:after'
		];
	}

	// simply build the stuff
	grunt.registerTask("default", build());

	// build first time (how to go about this?)
	grunt.registerTask('init', build().concat([
		'copy:fake_node_module'
	]));

	// test that build
	grunt.registerTask("test", [
		'clean',
		'edbml',
		//'karma'
	]);
};
