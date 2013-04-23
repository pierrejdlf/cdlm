////////////////////////////////////////////////////////////////////////////////////////////////
var voronoimap = function(divid) {
	var f = {}, bounds, feature;
	var overdiv = d3.select('#'+divid).append("div").attr('id','cdlm_overmap');
	f.parent = overdiv.node();
	var svgmap = overdiv.append('svg');

	var curMode = 'HF';	
	var freqPointScale = null; // based on frequentations for each station

	var mydata = null;
	var mywords = null;
		
	// VALUES
	var maxVal = 50;

	// NGRAMS (sizes in em)
	var offNgramSize = 9;
	var oveNgramSize = 15;
	var minNgramSize = 12;
	var maxNgramSize = 19;
	var offNgramCol = "lightgray";
	var oveNgramCol = "#D7A39F"; //"#C44040"; //dark red
	var selNgramCol = "#001A63"; //metroblue
	var minWordPointSize = 0.01; // hide point if no word (not 0 to avoid bug with tooltip location)
	var minPointSize = 3;
	var maxPointSize = 25;
	var selWords = [];
	
	var pointColor = "#001A40"; //dark metroblue
	var pointRainbow = false;
	var metroCol = {};
	metroCol['X']= "gray" ;
	metroCol['1']= "#F8BE32" ;
	metroCol['2']= "#135698" ;
	metroCol['3']= "#8F8026" ;
	metroCol['3b']= "#93C9D4" ;
	metroCol['4']= "#9E3E78" ;
	metroCol['5']= "#DF7E41" ;
	metroCol['6']= "#81B07E" ;
	metroCol['7']= "#E097A8" ;
	metroCol['7b']= "#81B07E" ;
	metroCol['8']= "#BA9FC2" ;
	metroCol['9']= "#CDB72D" ;
	metroCol['10']= "#D7A035" ;
	metroCol['11']= "#734B22" ;
	metroCol['12']= "#2A6238" ;
	metroCol['13']= "#92C7D2" ;
	metroCol['14']= "#442569" ;

	g = svgmap.append("g");
	var gvoronoi = g.append("g");
	
	var myc = null;
	var voronoi = null;
	var stats = [];
	var scales = [];

	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	// switch to mode
	f.switchMode = function(mode) {
		curMode = mode;
		console.log("Switching to Mode: "+mode);
		d3.selectAll(".clic").classed("current",false);
		d3.select(".clic_"+mode).classed("current",true);
		var col = mode[0]=="H" ? "green" : "red";
		if(mode=="AL") col="blue";
		var scale = d3.scale.linear().domain([0,stats['max'+mode]]).range(["white",col]);;
		gvoronoi.selectAll("path")
			.transition()
			.duration(500)
			.attr("fill-opacity",1)
			.attr("fill", function(d,i){
				var val = d3.select(this).attr(mode);
				return scale( val );
			})
			.attr("class","voropaths");
	}
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////			
	// Use Leaflet to implement a D3 geographic projection.
	f.project = function(x) {
		var point = f.map.locationPoint({ lat:x[1],lon:x[0] });
		return [point.x, point.y];
	}
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Reposition the SVG to cover the features.
	f.draw = function() {
		//console.log("draw");
		
		var bounds = f.map.extent(),
				bl = bounds.southWest(),
				tr = bounds.northEast();
		var bottomLeft = f.project([bl.lon, bl.lat]),
				topRight = f.project([tr.lon, tr.lat]);
			
		svgmap.attr("width", topRight[0] - bottomLeft[0])
				.attr("height", bottomLeft[1] - topRight[1])
				.style("margin-left", bottomLeft[0] + "px")
				.style("margin-top", topRight[1] + "px");

		g.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");
			
		var pp = f.project([48.866296,2.320124]);
		myc.attr("cx",function(d,i){return f.project([parseFloat(d.x),parseFloat(d.y)])[0];})
			.attr("cy",function(d,i){return f.project([parseFloat(d.x),parseFloat(d.y)])[1];});
		
		var dataPositions = mydata.map(function(d,i){ return [f.project([parseFloat(d.x),parseFloat(d.y)])[0],f.project([parseFloat(d.x),parseFloat(d.y)])[1]];});
		var ndata = d3.geom.voronoi(dataPositions).map(function(d) { return "M" + d.join("L") + "Z"; });
		g.selectAll("path")
			.data(ndata)
			//.filter(function(d) { return this.getAttribute("d") != d; })
			.attr("d", function(d) { return d; });
	}
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	// init
	f.data = function(indata,m) {
		stats['types'] = {}
		stats['types']['HF'] = 'Homme > Femme';
		stats['types']['FH'] = 'Femme > Homme';
		stats['types']['HH'] = 'Homme > Homme';
		stats['types']['FF'] = 'Femme > Femme';
		stats['types']['AL'] = 'Toutes annonces';
		stats['minFreq'] = Math.min.apply(Math,indata.map(function(y){ return y.trafic ; }));
		stats['maxFreq'] = Math.max.apply(Math,indata.map(function(y){ return y.trafic ; }));
		stats['coefFreq'] = stats['maxFreq']/stats['minFreq'];
		// less visited station got multiplyed by how many less visitors it got from the most visited
		stats['scaleFreq'] = d3.scale.linear()
			.domain([stats['minFreq'],stats['maxFreq']])
			.range([stats['coefFreq'],1]);
		
		['HF','FH','HH','FF','AL'].forEach(function(u){
			stats['max'+u] = Math.max.apply(Math,indata.map(function(y){
				return y[u+'_n'] * stats['scaleFreq'](y.trafic) ;
			}));
		});
		console.log(stats);
		mydata = indata ;
		f.map = m;
		
		freqPointScale = d3.scale.linear()
			.domain([stats['minFreq'],stats['maxFreq']])
			.range([minPointSize,maxPointSize]);
				
		/////////////////////////////////////////// VORONOI
		// friendly array for d3 voronoi
		var dataPositions = indata.map(function(d,i){ return [f.project([parseFloat(d.x),parseFloat(d.y)])[0],f.project([parseFloat(d.x),parseFloat(d.y)])[1]];});
		voronoi = gvoronoi.selectAll("path")
			.data(d3.geom.voronoi(dataPositions))
			.enter().append("svg:path")
				.attr("class","voropaths")
				.attr("fill-opacity",0)
				.attr("fill", "white")
				.attr("id",function(d,i){return "v_"+i;})
				.attr("station",function(d,i){return indata[i].name;})
				.attr("AL",function(d,i){return indata[i].AL_n * stats['scaleFreq'](indata[i].trafic) ;})
				.attr("FF",function(d,i){return indata[i].FF_n * stats['scaleFreq'](indata[i].trafic) ;})
				.attr("FH",function(d,i){return indata[i].FH_n * stats['scaleFreq'](indata[i].trafic) ;})
				.attr("HF",function(d,i){return indata[i].HF_n * stats['scaleFreq'](indata[i].trafic) ;})
				.attr("HH",function(d,i){return indata[i].HH_n * stats['scaleFreq'](indata[i].trafic) ;})
				.attr("data-placement","top")
				.attr("d", function(d,i) { return "M" + d.join("L") + "Z"; });

		/////////////////////////////////////////// POINTS
		myc = gvoronoi.selectAll('station')
			.data(mydata)
			.enter().append("svg:circle")
			.attr("name",function(d,i){return d.station;})
			.attr("class","stations")
			.attr("fill",pointColor)
			.attr("id",function(d,i){return "c_"+i;})
			.attr("cx",function(d,i){return f.project([parseFloat(d.x),parseFloat(d.y)])[0];})
			.attr("cy",function(d,i){return f.project([parseFloat(d.x),parseFloat(d.y)])[1];})
			.attr("r",minPointSize);
		d3.selectAll('.stations').transition().duration(800)
			.attr("r",function(d){return freqPointScale(d.trafic);})
			.attr("fill",function(d,i){ return mydata[i].nLines>1 ? metroCol['X'] : metroCol[mydata[i].line] ;});	
/*
		d3.selectAll('.stations').transition().duration(800)
			.attr("r",minPointSize)
			.attr("fill",pointColor);
*/

					
		f.switchMode('HF');		
		return f;
	};
	return f;
}

////////////////////////////////////////////////////////////////////////////////////////////////
var init_map = function(divid) {
	mapbox.load('minut.map-qgm940aa', function(data) {
		m = mapbox.map(divid);
		//m.ui.zoomer.add();
		m.addLayer(data.layer);
		//m.setZoomRange(11,15);
		//m.setPanLimits([{lat:48.56,lon:2.02},{lat:49.16,lon:2.62}]);
		m.zoom(11.5).center({lat:48.86,lon:2.35});
		d3.tsv("../data/annonces.tsv", function(data) {
			var l = voronoimap(divid).data(data,m);
			m.addLayer(l);
		});		
	});
}