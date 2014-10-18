edb.declare("testing.edbml").as(function $edbml(header){
	'use strict';
	var out = $edbml.$out,
		$att = $edbml.$att,
		ejner1 = $edbml.$input(Johnson),
		ejner2 = $edbml.$input(Johnson),
		ejner3 = $edbml.$input(Johnson);
	$att['john'] = 23;
	$att['john'] += 7;
	out.html += '<h2>Hej</h2>' +
	            '<h2>Hej</h2>' +
	            '<h2>Hej</h2>' +
	            '<h2>Hej</h2>' +
	            '<h2>Hej</h2>' +
	            '<h2>Hej</h2>' +
	            '<h2>Hej</h2>' +
	            '<h2>Hej</h2>';
	console.log($att['john']);
	function fisse() {
		out.html += '<h1 ' + $att.$html('john') + '>' + header + '</h1>' +
		            '<h1 ' + $att.$html('john') + '>' + header + '</h1>' +
		            '<h1 ' + $att.$html('john') + '>' + header + '</h1>';
	}
	function flemming() {
		alert('Hello');
	}
	var $edb1 = edb.$set(function(value, checked){
		flemming();
	}, this);
	out.html += '<h2 onclick="edb.$run(event,&quot;' + $edb1 + '&quot;);">Hej</h2>' +
	            '<h2>Hej</h2>' +
	            '<h2>Hej</h2>' +
	            '<h2>Hej</h2>';
	return out.write();
}).withInstructions([{
		tag : "param",
		att : {
			name : "header"
		}
	}, {
		tag : "input",
		att : {
			name : "ejner1",
			type : "Johnson"
		}
	}, {
		tag : "input",
		att : {
			name : "ejner2",
			type : "Johnson"
		}
	}, {
		tag : "input",
		att : {
			name : "ejner3",
			type : "Johnson"
		}
	}]);