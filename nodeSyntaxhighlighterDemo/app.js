/*var nsh = require('node-syntaxhighlighter'),
	language = nsh.getLanguage('js'),
	codeFile ="app.listen(myport, function() {\r\n"
			+"	var server = app.address.host,\r\n"
			+"		port = app.address.port;\r\n"
			+"\r\n"
			+"	console.log('server started on http://%s:%s', server, port)ss;\r\n"
			+"});";
	
console.log(nsh.highlight(codeFile, language, {'tab-size': 3}));*/

var fs = require('fs'),
	path = require('path');
	
fs.readFile('nsh.html', {encoding: 'utf8'}, function(err, data) {
	if (err) {
		console.log('Error occues: ' + err);
	} else {
		console.log(data.replace(/<pre>*<\/pre>/gi,'123$1'));
	}
});