/**
 * @param {Grunt} grunt
 */
module.exports = function ( grunt ) {

	"use strict";

	[ 
		"grunt-contrib-concat", 
		"grunt-contrib-watch",
		"grunt-contrib-jshint",
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
        sourceMaps: true // default: false
      },
      custom: {
        files:{
          "tasks/build/": [ "tasks/src/**/*.js" ]
        }
      },
    },
		concat: {
			options: {
				separator: '\n\n\n',
				banner: "'use strict';\n",
				process: function(src, filepath) {
          return '// Source: ' + filepath + '\n' +
            src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
        },
			},
			dist: {
				dest: "tasks/compiler.js",
				src: [
					"lib/traceur/runtime.js",
					"header.js",
					"compilers/Compiler.js",
					"compilers/FunctionCompiler.js",
					"compilers/ScriptCompiler.js",
					"helpers/Instruction.js",
					"helpers/Runner.js",
					"helpers/Result.js",
					"helpers/Status.js",
					"results/FunctionResult.js",
					"results/ScriptResult.js",
					"footer.js"
				].map ( function ( src ) {
					return "tasks/build/tasks/src/" + src;
				})
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
		}
	});

	grunt.registerTask ( "default", [ "traceur", "concat" ]);
};