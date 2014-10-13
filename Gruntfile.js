/**
 * TODO: http://stackoverflow.com/questions/13358680/how-to-config-grunt-js-to-minify-files-separately
 * @param {Grunt} grunt
 */
module.exports = function ( grunt ) {

	"use strict";

	require('load-grunt-tasks')(grunt);

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

		watch: {
			scripts: {
				files: [ "**/*.js" ],
				tasks: [ "concat" ],
				options: {
					spawn: true
				}
			}
		},

		/*
		 * Test the the build in other projects (grunt manually)
		 */
		copy: {
			copystuff: {
				src: 'tasks/things/compiler.js',
				dest: "../../Chrome/node_modules/grunt-spiritual-edbml/tasks/things/compiler.js"
			}
		}
		
	});

	grunt.registerTask ( "default", [ 'concat:before', 'es5to6', 'concat:after' ]);

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
