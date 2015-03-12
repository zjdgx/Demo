module.exports = function (grunt) {
	grunt.initConfig({
		handlebars: {
			compile: {
				options: {
					amd: true,
					namespace: 'Handlebars',
					processContent: function (content, filepath) {
						content = content.replace(/^[\x20\t]+/mg, '').replace(/[\x20\t]+$/mg, '');
						content = content.replace(/^[\r\n]+/, '').replace(/[\r\n]*$/, '\n');
						return content;
					},
					processName: function (filePath) {
						return filePath.replace(/(.+\/)*(.*)\.hbs?/, '$2');
					}
				},
				files: {
					'static/todo/templates.js': ['static/todo/*.hb']
				}
			}
		},
		concat: {
			options: {
				separator: ';',
				process: {
					data: {
						requireJSVersion: +new Date
					}
				}
			},
			js: {
				src: ['config.js', 'static/bower_components/requirejs/require.js'],
				dest: 'static/common/require.js'
			}
		},
		concat_css: {
			options: {},
			files: {
				'static/css/main.css': ['']
			}
		},
		uglify: {
			templates: {
				files: {
					'static/todo/templates.js' : 'static/todo/templates.js'
				}
			},
			bower: {
				options: {
					sourceMap: true
				},
				files: {
					'static/common/backbone.js': 'static/bower_components/backbone/backbone.js',
					'static/common/jquery.js': 'static/bower_components/jquery/dist/jquery.js',
					'static/common/underscore.js': 'static/bower_components/underscore/underscore.js',
					'static/common/require.js': 'static/common/require.js'
				}
			}
		}
	});
	
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-handlebars');
	
	grunt.registerTask('build', ['handlebars', 'concat', 'uglify']);
	grunt.registerTask('default', ['build']);
}