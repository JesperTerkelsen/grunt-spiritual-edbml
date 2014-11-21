/**
 * TODO: http://stackoverflow.com/questions/13358680/how-to-config-grunt-js-to-minify-files-separately
 * @param {Grunt} grunt
 */
module.exports = function ( grunt ) {

	"use strict";

	// load tasks via package.json
	require('load-grunt-tasks')(grunt);

	try { // first grunt will build a fake module...
		grunt.task.loadNpmTasks('grunt-spiritual-edbml');
	} catch(missingModuleException) {
		console.log('First build :)');
	}

	var options = grunt.file.readJSON ( ".jshintrc" );
	options.unused = false;

	grunt.initConfig ({
		jshint: {
			fisse : {
				jshintrc : ".jshintrc",
				options: options,
				src: [ "Gruntfile.js", "tasks/src/**/*.js" ]
			}
		},
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
					"helpers/Runner.js",
					"helpers/Result.js",
					"helpers/Status.js",
					"helpers/Markup.js",
					"helpers/Output.js",
					"footer.js"
				].map ( function ( src ) {
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

		es5to6: {
			testingit: {
				files: {
					'build/compiler-es5.js' : 'build/compiler-es6.js'
				}
			}
		},

		/**
		 *
		 */
		watch: {
			scripts: {
				files: [ "**/*.js" ],
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

		/*
		 * Manually install a build of this project in the 
		 * the node_modules folder so that we can test it.
		 */
		copy: {
			fake_node_module: {
				files: [{
					expand: true, 
					cwd: '.', 
					src: [
						'*.*',
						'tasks/**',
						//'node_modules/**'
					],
					dest: 'node_modules/grunt-spiritual-edbml'
				}]
			}
		},

		// testing it out...
		edbml: {
			outline: {
				options : {},
				files : {
					"test/out/outline/outline.js" : [ "test/src/outline/**/*.edbml" ]
				}
			},
			inline : {
				options : {
					inline : true,
					beautify: true
				},
				expand: true,
				dest: 'test/out/inline',
				cwd: 'test/src/inline',
				src: ['*.edbml']
			}
		}
		
	});

	// build
	grunt.registerTask ( "default", [
		'concat:before',
		'es5to6',
		'concat:after',
		'copy:fake_node_module'
	]);

	// test
	grunt.registerTask ( "test", [
		'edbml'
	]);

	/**
	 * Compile ES5 to ES6. Isn't it great.
	 */
	grunt.registerMultiTask('es5to6', 'It\'s a way to make a living', function() {
		var files = this.data.files, to5 = require("6to5");
		Object.keys(files).forEach(function(target) {
			var source = files[target];
			source = grunt.file.read(source);
			grunt.file.write(target, to5.transform(source).code);
		});
	});
};
