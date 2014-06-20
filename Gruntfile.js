/**
 * TODO: http://stackoverflow.com/questions/13358680/how-to-config-grunt-js-to-minify-files-separately
 * @param {Grunt} grunt
 */
module.exports = function ( grunt ) {

	"use strict";

	[ 
		"grunt-contrib-concat", 
		"grunt-contrib-watch",
		"grunt-contrib-jshint",
		"grunt-contrib-copy",
		"grunt-traceur"
	].forEach ( grunt.loadNpmTasks );

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
		traceur: {
      options: {
        sourceMaps: false, // default: false,
        blockBinding: true
      },
      compiler: {
        files:{
          "build/compiler-es5.js": [ "build/compiler-es6.js" ]
        }
      },
    },
		concat: {
				before: {
					options: {
						separator: '\n\n\n',
					},
				//dist: {
					//dest: "tasks/things/compiler.js",
					//dest:"../spiritual-tst/node_modules/grunt-spiritual-edbml/tasks/things/compiler.js",
					//dest:"../../Greenfield/Chrome/node_modules/grunt-spiritual-edbml/tasks/things/compiler.js",
					//dest:"../../Hot/hot-drums/node_modules/grunt-spiritual-edbml/tasks/things/compiler.js",
					dest: 'build/compiler-es6.js',
					src: [
						//"lib/traceur/runtime.js",
						//
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
		            // /(^|\n)[ \t]*('use strict'|"use strict");?\s*/g
		        },
					},
					dest: 'tasks/things/compiler.js',
					src: [
						'src/lib/traceur-runtime.js',
						'build/compiler-es5.js'
					]
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
		copy: {
			fisse: {
				src: 'tasks/things/compiler.js',
				dest: '../../Hot/hot-rack/node_modules/grunt-spiritual-edbml/tasks/things/compiler.js'
				//dest:"../spiritual-tst/node_modules/grunt-spiritual-edbml/tasks/things/compiler.js",
				//dest:"../../Greenfield/Chrome/node_modules/grunt-spiritual-edbml/tasks/things/compiler.js",
				//dest:"../../Hot/hot-drums/node_modules/grunt-spiritual-edbml/tasks/things/compiler.js",
			}
		}
	});

	grunt.registerTask ( "default", [ "concat:before", "traceur", "concat:after" ]);
};
