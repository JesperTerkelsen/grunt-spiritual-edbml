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
	var $edbml1 = edbml.$set(function(value, checked){
		flemming();
	}, this);
	out.html += '<h2 onclick="edbml.$run(event,&quot;' + $edbml1 + '&quot;);">Hej</h2>' +
	            '<h2>Hej</h2>' +
	            '<h2>Hej</h2>' +
	            '<h2>Hej</h2>';
	return out.write();
}).withInstructions([{
		param : {
			name : "header"
		}
	}, {
		input : {
			name : "ejner1",
			type : "Johnson"
		}
	}, {
		input : {
			name : "ejner2",
			type : "Johnson"
		}
	}, {
		input : {
			name : "ejner3",
			type : "Johnson"
		}
	}]);