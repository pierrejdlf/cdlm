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
	
	$('#helpModal').modal();
	$('#helpModal .modal-body img').on("click",function(){
		$('#helpModal').modal('hide');
	});
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	// action (switchmode + tooltip) on sex buttons
	['fH','fF','tH','tF'].forEach(function(u) {
		d3.select('#'+u).on("click",function(){
			// if from word-mode, we need to re-activate button
			$()
			var newMode = u[0]=='f' ? u[1]+curMode[1] : curMode[0]+u[1];
			f.switchMode(newMode);
		});
	});
	
	$('.fromto').tooltip();
	$('#topbar').tooltip();
	$('#help').tooltip();
	$('#panel_stationname img').tooltip();
	$('#panel_words').tooltip();
	$('#panel_bys').tooltip();
	$('#panel_graph ul').tooltip();
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	// panel(s) opacity
	d3.select('#panel_bys').on('mouseover',function(e){
		d3.select('#panel_bys_overlay').transition().style("opacity",0);
		d3.select('#panel_words_overlay').transition().style("opacity",1);
	});	d3.select('#panel_words').on('mouseover',function(e){
		d3.select('#panel_bys_overlay').transition().style("opacity",1);
		d3.select('#panel_words_overlay').transition().style("opacity",0);
	});
	d3.select('#panel_words').on('mouseout',function(e){
		// restore points size based on word list
		f.updatePointsFromWordList();
	});
	d3.select('#panel_map').on('mouseout',function(e){
		d3.select('#panel_bys_overlay').transition().style("opacity",0);
		d3.select('#panel_words_overlay').transition().style("opacity",0);
	});

	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Metro logo switch between some display styles for stations
	var displayMode = 0;
	d3.select('#panel_stationname img').on('click',function(u){
		displayMode += 1;
		displayMode = displayMode%2 ;
		console.log("Switching display: "+displayMode);
		//.attr("fill",function(d,i){ return mydata[i].nLines>1 ? metroCol['X'] : metroCol[mydata[i].line] ;});
		//d3.selectAll('.voropaths').transition().duration(800).attr("fill-opacity",0);
		if(displayMode==1) {
			pointRainbow = true;
			d3.selectAll('.stations').transition().duration(800)
				.attr("r",function(d){return freqPointScale(d.trafic);})
				.attr("fill",function(d,i){ return mydata[i].nLines>1 ? metroCol['X'] : metroCol[mydata[i].line] ;});
		}
		if(displayMode==0) {
			pointRainbow = false;
			d3.selectAll('.stations').transition().duration(800)
				.attr("r",minPointSize)
				.attr("fill",pointColor);
		}
		// rotate M image
		d3.select(this)
			.style("-webkit-transform","rotate(-"+displayMode*180+"deg)")
			.style("-moz-transform","rotate(-"+displayMode*180+"deg)");
	
	});
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	// selected word list
	f.addWordList = function(word) {
		if(selWords.indexOf(word)==-1) selWords.push(word);
	};
	f.remWordList = function(word) {
		var ind = selWords.indexOf(word);
		if(ind!=-1) selWords.splice(ind, 1);
	};
	// selected word list
	f.updatePointsFromWordList = function() {
		var cumulMax = 0;
		mywords.forEach(function(w){
			if(selWords.indexOf(w.word)!=-1) cumulMax += parseInt(w.max);
		});
		//console.log("cumulMax:"+cumulMax);
		var cumulwordscale = d3.scale.linear().domain([0,cumulMax]).range([minPointSize,maxPointSize]);
		gvoronoi.selectAll(".stations")
			//.transition().duration(100)
			//.attr("fill",function(d,i) { return pointRainbow ? freqPointScale(d.trafic) : pointColor;} )
			.attr("r", function(d,i){
				return cumulwordscale( f.getWordsCount(mydata[i],selWords) );
			});
	};
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	// switch to mode
	f.getWordsCount = function(d,words) {
		var cc = 0;
		if(d.ngrams.length>0) {
			var listwords = eval('('+d.ngrams+')');
			// cumulate each word
			words.forEach(function(w){
				cc += typeof(listwords[w])=="undefined" ? 0 : parseInt(listwords[w]);
			});	
		}
		return cc;	
	};
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	// init word cloud
	f.initWords = function() {
		d3.csv("data/words.csv", function(data) {
			mywords = data;
			var divcloud = overdiv.append("div").attr("id","wordcloud");
			var wordes = {};
			// fetch selected words for each category, and place them in columns
			['cor','vet','ac','col'].forEach(function(u){
				wordes[u] = data.filter(function(t){return (t.cat==u);});
				var clist = d3.select("#panel_words").append('ul');
				wordes[u].forEach(function(thew) {
					// we obtained min/max values from javascript. (now it's included in the words.csv file !)
					//var minOccWord = Math.min.apply(Math,mydata.map(function(y){ return f.getWordsCount(y,[thew.word]); }));
					//var maxOccWord = Math.max.apply(Math,mydata.map(function(y){ return f.getWordsCount(y,[thew.word]); }));
					//console.log(thew.cat+","+thew.word+","+minOccWord+","+maxOccWord);
					clist.append('li')
						.attr("selected",0)
						.attr("class","word "+thew.cat)
						.attr("word",thew.word)
						.style("font-size",offNgramSize+"px")
						.text(thew.word)
						.on('mouseover',function(d,i){
							//console.log(thew.word+":"+thew.max);
							d3.selectAll(".word")
								.filter(function(d,i){return (d3.select(this).attr("selected")==0);})
								//.transition().duration(70)
								.style('color',offNgramCol)
								.style('font-weight','normal')
								.style('font-size',offNgramSize+"px");
							d3.select(this)
								.style("color",oveNgramCol)
								.style('font-weight','bold')
								.style("font-size",oveNgramSize+"px");
							var wordscale = d3.scale.linear().domain([0,thew.max]).range([minPointSize,maxPointSize]);
							// update points on map
							//gvoronoi.selectAll(".stations")
							//	.attr("r", function(el,i){ return wordscale( f.getWordsCount(mydata[i],[thew.word]) ); });
							f.addWordList(thew.word);
							f.updatePointsFromWordList();
						})
						.on('mouseout',function(d,i){
							var state = d3.select(this).attr("selected")==1 ;
							d3.select(this).transition()
								.style('color',state ? selNgramCol : offNgramCol)
								.style("font-size",state ? oveNgramSize+"px" : offNgramSize+"px")
								.style('font-weight',state ? 'bold' : 'normal');
							if(!state) f.remWordList(thew.word);
						})
						.on('click',function(d,i){
							var state = !(d3.select(this).attr("selected")==1) ;
							//console.log(thew.word+":"+state);
							d3.select(this).attr("selected",state ? 1 : 0);
							d3.select(this)
								.style('color',state ? selNgramCol : offNgramCol)
								.style("font-size",state ? oveNgramSize+"px" : offNgramSize+"px")
								.style('font-weight',state ? 'bold' : 'normal');
							if(curMode!='AL') f.updateStationsTooltips('AL');
							curMode = 'AL';
							// word list
							f.addWordList(thew.word);
							f.updatePointsFromWordList();
							console.log(selWords);
						});
				});
			});
		});	
	}
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	// station tooltip content
	f.tooltipStationTitle = function(dataElem,mode) {
		//var h = indata[i].AL.split(' | ')[0];
		var c = "<i>pas d'annonce pour cette combinaison de sexe à cette station</i>";
		if(dataElem[mode].indexOf('|')!=-1) {
			//console.log(dataElem[mode]);
			c = dataElem[mode].split(' | ')[1].replace(/#/g,'<br>');
		}
		return "<div>"+c+"</div>";
	};
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	// update station tooltips based on mode
	f.updateStationsTooltips = function(mode) {
		d3.selectAll(".stations")
			.attr("title",function(d,i){ return f.tooltipStationTitle(d,mode); })
		$(".stations").tooltip('destroy');
		$(".stations").tooltip({
			'container': 	'body',
			'placement': 	'bottom',
			'trigger': 		'hover',
			'html':			true,
			'delay': 		{ show: 700, hide: 50 }
		});	
	}
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
			.attr("fill-opacity",0.5)
			.attr("fill", function(d,i){
				var val = d3.select(this).attr(mode);
				return scale( val );
			})
			.attr("class","voropaths");
		f.updateStationsTooltips(mode);
	}
	
	/////////////////////////////////////////////////////////////////////////////////////////////////////////
	// update tag cloud sizes from array
	f.updateNgrams = function(words) {
		if (words.length>2) words = eval('('+words+')');
		else words = {};
		var maxCount = Math.max.apply(Math,Object.keys(words).map(function(y){return words[y];}));
		//console.log("max:"+maxCount);
		var scale = d3.scale.linear().domain([2,maxCount]).range([minNgramSize,maxNgramSize]);
		
		d3.selectAll(".word")
			//.transition().duration(70)
			.style('color',function(d,i){ return d3.select(this).attr("selected")==1 ? selNgramCol : offNgramCol; })
			.style("font-size",function(d,i){ return d3.select(this).attr("selected")==1 ? oveNgramSize+"px" : offNgramSize+"px"; })
			.style('font-weight',function(d,i){ return d3.select(this).attr("selected")==1 ? 'bold' : 'normal'; });
		Object.keys(words).forEach(function(u) {
			d3.select('.word[word='+u+']')
				//.transition().duration(100)
				.style('color',function(d,i){ return d3.select(this).attr("selected")==1 ? selNgramCol : oveNgramCol; })
				.style('font-weight','bold')
				.style('font-size',scale(words[u])+"px");
		})
	};
	
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
			
		myc = gvoronoi.selectAll('station')
			.data(mydata)
			.enter().append("svg:circle")
			.attr("name",function(d,i){return d.station;})
			.attr("class","stations")
			.attr("fill",pointColor)
			.attr("title",function(d,i){ return f.tooltipStationTitle(d,'HF'); })
			.attr("id",function(d,i){return "c_"+i;})
			.attr("cx",function(d,i){return f.project([parseFloat(d.x),parseFloat(d.y)])[0];})
			.attr("cy",function(d,i){return f.project([parseFloat(d.x),parseFloat(d.y)])[1];})
			.attr("r",minPointSize);
		
		/////////////////////////////////////////// VORONOI
		// friendly array for d3 voronoi
		var dataPositions = indata.map(function(d,i){ return [f.project([parseFloat(d.x),parseFloat(d.y)])[0],f.project([parseFloat(d.x),parseFloat(d.y)])[1]];});
		voronoi = gvoronoi.selectAll("path")
			.data(d3.geom.voronoi(dataPositions))
			.enter().append("svg:path")
				.attr("class","voropaths")
				.attr("fill-opacity",0)
				.attr("fill", function(d,i){
					// Based on frequentation
					//var scale = d3.scale.linear().domain([stats['minFreq'],stats['maxFreq']]).range(["white","green"]);
					//return scale( indata[i].trafic );
					// Based on line color
					//return indata[i].nLines>1 ? metroCol['X'] : metroCol[indata[i].line] ;
					return "white";
				})
				.attr("id",function(d,i){return "v_"+i;})
				.attr("station",function(d,i){return indata[i].name;})
				.attr("AL",function(d,i){return indata[i].AL_n * stats['scaleFreq'](indata[i].trafic) ;})
				.attr("FF",function(d,i){return indata[i].FF_n * stats['scaleFreq'](indata[i].trafic) ;})
				.attr("FH",function(d,i){return indata[i].FH_n * stats['scaleFreq'](indata[i].trafic) ;})
				.attr("HF",function(d,i){return indata[i].HF_n * stats['scaleFreq'](indata[i].trafic) ;})
				.attr("HH",function(d,i){return indata[i].HH_n * stats['scaleFreq'](indata[i].trafic) ;})
				.attr("data-placement","top")
				.attr("d", function(d,i) { return "M" + d.join("L") + "Z"; })
					.on("mouseout",function(d,i){
						$('#c_'+i).mouseout();
						//$('#c_'+i).tooltip('hide');
					})
					.on("mouseover",function(d,i){
						$('#c_'+i).mouseenter();
						d3.select("#panel_stationname div").text( indata[i].name );
						f.updateNgrams(indata[i].ngrams);
/*
						var thePath = d3.select(this);
						['HF','FH','HH','FF'].forEach(function(u){
							var vl = thePath.attr(u);
							var scale = d3.scale.pow().exponent(.6).domain([0,stats['max'+u]]).range([0,maxVal]);
							//var scale = d3.scale.linear().domain([0,stats['max'+u]]).range([baseR,baseR+masR]);
							d3.select("#panel_bysex #"+u+"_val").transition().duration(90)
								.style("width",scale(vl)+"px");
						});
*/
					});
		$(".stations").tooltip({
			'container': 	'body',
			'placement': 	'bottom',
			'trigger': 		'hover',
			'html':			true,
			'delay': 		{ show: 700, hide: 50 }
		});
		
		f.initWords();
		f.switchMode('HF');
		return f;
	};
	return f;
}

////////////////////////////////////////////////////////////////////////////////////////////////
var init_map = function(divid) {
	mapbox.load('minut.map-tno4o0kc', function(data) {
		m = mapbox.map(divid);
		//m.ui.zoomer.add();
		m.addLayer(data.layer);
		m.setZoomRange(11,15);
		m.setPanLimits([{lat:48.56,lon:2.02},{lat:49.16,lon:2.62}]);
		m.zoom(12.5).center({lat:48.86,lon:2.32});
		d3.tsv("data/annonces.tsv", function(data) {
			var l = voronoimap(divid).data(data,m);
			m.addLayer(l);
/*
			$(window).keydown(function(event) {
				if(event.keyCode==90) l.switchMode('HH');
				if(event.keyCode==65) l.switchMode('FF');
				if(event.keyCode==81) l.switchMode('FH');
				if(event.keyCode==83) l.switchMode('HF');
			});
*/
		});		
	});
/*
	m = mapbox.map(divid);
	var backLayer = mapbox.layer().id('minut.map-tno4o0kc');
	m.addLayer(backLayer);
	var dimensions = m.dimensions;
	//m.parent.className += ' map-fullscreen-map';
	//document.body.className += ' map-fullscreen-view';
	m.dimensions = { x: m.parent.offsetWidth, y: m.parent.offsetHeight };
	m.center({lat:48.83,lon:2.39});
	m.draw();
	//
	//m.zoom(12,true);
*/
}

var sigInst = null;
var greyColor = '#666';

////////////////////////////////////////////////////////////////////////////////////////////////
var getCat = function(sigNode) {
	// warning ! updating .gexf could change position of 'cat' within attributes
	var pos = 1;
	return sigNode['attr']['attributes'][pos]['val'];
};
////////////////////////////////////////////////////////////////////////////////////////////////
var rollGraphCat = function(selcat,over) {
	if(over) {
		// --------------------------------- ROLL OVER
		if(selcat=="personne"){
			neighbors = {};
			sigInst.iterEdges(function(e){
				if(event.content!=e.source && event.content!=e.target) {
					if(!e.attr['grey']){
						e.attr['true_color'] = e.color;
						e.color = greyColor;
						e.attr['grey'] = 1;
					}
				}else{
					e.color = e.attr['grey'] ? e.attr['true_color'] : e.color;
					e.attr['grey'] = 0;
					neighbors[e.source] = 1;
					neighbors[e.target] = 1;
				}
			}).iterNodes(function(n){
				if(!neighbors[n.id]){
					if(!n.attr['grey']){
						n.attr['true_color'] = n.color;
						n.color = greyColor;
						n.attr['grey'] = 1;
						//n.hidden = 1;
					}
				}else{
				n.color = n.attr['grey'] ? n.attr['true_color'] : n.color;
				n.attr['grey'] = 0;
				}
			}).draw(2,2,2);
		} else {
			// ----------------- NORMAL
			sigInst.iterNodes(function(n){
				if(getCat(n)!=selcat && getCat(n)!="personne") {
					n.attr['grey'] = 1;
					n.attr['true_color'] = n.color;
					n.color = greyColor;
					//n.hidden = 1;
				} else {
					n.color = n.attr['grey'] ? n.attr['true_color'] : n.color;
					n.attr['grey'] = 0;
					n.hidden = 0;
				}
			}).draw(2,2,2);
		}
	}
	else {
		// --------------------------------- ROLL OUT
		if(selcat=="personne"){
			sigInst.iterEdges(function(e){
				e.color = e.attr['grey'] ? e.attr['true_color'] : e.color;
				e.attr['grey'] = 0;
			}).iterNodes(function(n){
				n.color = n.attr['grey'] ? n.attr['true_color'] : n.color;
				n.attr['grey'] = 0;
				//n.hidden = 0;
			}).draw(2,2,2);			
		} else {
			// ----------------- NORMAL
			sigInst.iterNodes(function(n){
				n.color = n.attr['grey'] ? n.attr['true_color'] : n.color;
				n.attr['grey'] = 0;
				if(n.attr['act']==0) n.hidden = 1;
			}).draw(2,2,2);
		}	
	}
}

////////////////////////////////////////////////////////////////////////////////////////////////
var toggleGraphCat = function(thecat,show) {
	//console.log("togglecat: "+thecat+":"+show);
	if(show) {
		// --------------------------------- ACTIVATE
		sigInst.iterNodes(function(n){
			if(getCat(n)==thecat && getCat(n)!="personne") {
				n.attr['act'] = 1;
				n.hidden = 0;
			}
		}).draw(2,2,2);
	}
	else {
		// --------------------------------- DEACTIVATE
		sigInst.iterNodes(function(n){
			if(getCat(n)==thecat && getCat(n)!="personne") {
				n.attr['act'] = 0;
				n.hidden = 1;
			}
		}).draw(2,2,2);	
	}
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////
// init categories for graph (graph already made)
var initCatCheckboxes = function() {
	var graphcats=[];
	graphcats.push({act:1, col:"#242424", descr:"les 4 types d'annonces, toujours visibles", cat:'personne', label:'Annonces'} );
	graphcats.push({act:0, col:"#EF842A", descr:"frère, artiste, garagiste, conducteur", cat:'typ', label:'personnages'} );
	graphcats.push({act:0, col:"#62D2F9", descr:"sac, livre, écouteurs, pochette", cat:'ac', label:'accessoires'} );
	graphcats.push({act:0, col:"#274A8C", descr:"rouge, blond, grand, noisette", cat:'col', label:'couleurs, formes'} );
	graphcats.push({act:0, col:"#928434", descr:"main, tête, maigre, moustache", cat:'cor', label:'corps'} );
	graphcats.push({act:0, col:"#787EF6", descr:"pull, chausson, bonnet, pantalon", cat:'vet', label:'vêtements'} );
	graphcats.push({act:0, col:"#E264F5", descr:"mignon, ravissant, charmant, ravageur", cat:'bo', label:'« tu es inoubliable »'} );
	graphcats.push({act:0, col:"#B041F6", descr:"nul, regret, foutu , stupide", cat:'moch', label:'« je suis un con »'} );
	graphcats.push({act:0, col:"#832E2C", descr:"rougir, chagrin, incertitude, troubler", cat:'em', label:'sensible'} );
	graphcats.push({act:0, col:"#89552F", descr:"figer, enfuir, accrocher, échanger", cat:'action', label:'actif'} );
	graphcats.push({act:0, col:"#518A32", descr:"matin, midi, soir, siège, strapontin, vitre", cat:'timloc', label:'espaces'} );
	graphcats.push({act:0, col:"#718B34", descr:"lourdes, japon, maroc, brésil", cat:'loc', label:'géographie'} );
	graphcats.push({act:0, col:"#59368C", descr:"mémoire, soleil, école, poésie, caresse", cat:'sp', label:'divers'} );
	var catul = d3.select("#panel_graph ul");
	graphcats.forEach(function(u) {
		if(u.cat=='personne') {
			var cata = catul.append("li").append('a')
				.style("margin-bottom","10px")
				.attr("title",u.descr)
				.attr("data-placement","right")
				.on("mouseover",function(e){ rollGraphCat(u.cat,true); })
				.on("mouseout",function(e){ rollGraphCat(u.cat,false); });
			cata.append("div")
				.attr("class","catcol")
				.style("background",u.col)
				.style("border","2px solid "+u.col);
			cata.append("span")
				.text(u.label);
		} else {
			var cata = catul.append("li").append("a")
				.style("margin-left","15px")
				.attr("catshow",u.act)
				.attr("title",u.descr)
				.attr("data-placement","right")
				.on("click",function(e){
					var show = !(d3.select(this).attr("catshow")==1);
					d3.select(this).attr("catshow",show ? 1:0);
					toggleGraphCat(u.cat,show);
					d3.select(this).select('div').style("background",show ? u.col:"transparent");
				})
				.on("mouseover",function(e){
					rollGraphCat(u.cat,true);
					d3.select(this).select('div').style("background",u.col)
				})
				.on("mouseout",function(e){
					rollGraphCat(u.cat,false);
					var show = d3.select(this).attr("catshow")==1;
					d3.select(this).select('div').style("background",show ? u.col:"transparent")
				});
			cata.append("div")
				.attr("class","catcol")
				.style("background",(u.act==1) ? u.col : "transparent")
				.style("border","2px solid "+u.col);
			cata.append("span")
				.text(u.label);
			// default is active, so let's deactivate manually the hidden ones
			if(u.act==0) toggleGraphCat(u.cat,false);
		}
				
	});
	$('#panel_graph a').tooltip();
}
////////////////////////////////////////////////////////////////////////////////////////////////
var init_graph = function(divid) {
	console.log('init graph');
	var isRunning = false;
	
	// Instanciate sigma.js and customize rendering :
	sigInst = sigma.init(document.getElementById(divid)).drawingProperties({
		defaultLabelColor: '#fff',
		defaultLabelSize: 11,
		defaultLabelBGColor: '#fff',
		defaultLabelHoverColor: '#000',
		labelThreshold: 1.5,
		defaultEdgeType: 'curve',
	}).graphProperties({
		minNodeSize: 1,
		maxNodeSize: 20,
		minEdgeSize: 1,
		maxEdgeSize: 1,
	}).mouseProperties({
		maxRatio: 32
	});

	// Parse a GEXF encoded file to fill the graph
	// (requires "sigma.parseGexf.js" to be included)
	sigInst.parseGexf('data/graph.gexf');
	// Draw the graph :
	sigInst.draw();
	
	// create attribute act(ive)
	sigInst.iterNodes(function(n){
		if(!n.attr['act']) n.attr['act']=1;
	});
	
	initCatCheckboxes();
	
	// Over
/*
	sigInst.bind('overnodes',function(event){
		//console.log(event.content);
		var seln = sigInst.getNodes(event.content);
		selcat = getCat(seln[0]);
		if(selcat=="personne"){
			neighbors = {};
			sigInst.iterEdges(function(e){
				if(event.content!=e.source && event.content!=e.target) {
					if(!e.attr['grey']){
						e.attr['true_color'] = e.color;
						e.color = greyColor;
						e.attr['grey'] = 1;
					}
				}else{
					e.color = e.attr['grey'] ? e.attr['true_color'] : e.color;
					e.attr['grey'] = 0;
					neighbors[e.source] = 1;
					neighbors[e.target] = 1;
				}
			}).iterNodes(function(n){
				if(!neighbors[n.id]){
					if(!n.attr['grey']){
						n.attr['true_color'] = n.color;
						n.color = greyColor;
						n.attr['grey'] = 1;
						n.hidden = 1;
					}
				}else{
				n.color = n.attr['grey'] ? n.attr['true_color'] : n.color;
				n.attr['grey'] = 0;
				}
			}).draw(2,2,2);
		} else {
			sigInst.iterNodes(function(n){
				if(getCat(n)!=selcat && getCat(n)!="personne") {
					n.attr['true_color'] = n.color;
					n.color = greyColor;
					n.attr['grey'] = 1;
					n.hidden = 1;
				} else {
					n.color = n.attr['grey'] ? n.attr['true_color'] : n.color;
					n.attr['grey'] = 0;
				}
			}).draw(2,2,2);
		}
	// Out
	}).bind('outnodes',function(){
		if(selcat=="personne"){
			sigInst.iterEdges(function(e){
				e.color = e.attr['grey'] ? e.attr['true_color'] : e.color;
				e.attr['grey'] = 0;
			}).iterNodes(function(n){
				n.color = n.attr['grey'] ? n.attr['true_color'] : n.color;
				n.attr['grey'] = 0;
				n.hidden = 0;
			}).draw(2,2,2);			
		} else {
			sigInst.iterNodes(function(n){
				n.color = n.attr['grey'] ? n.attr['true_color'] : n.color;
				n.attr['grey'] = 0;
				n.hidden = 0;
			}).draw(2,2,2);
		}
	});
*/
	
	$("#stop-layout").on("click", function(u) {
		if(isRunning){
			isRunning = false;
			sigInst.stopForceAtlas2();
			$('#stop-layout').text('Start Layout');
		}else{
			console.log("starting layout");
			isRunning = true;
			sigInst.startForceAtlas2();
			$('#stop-layout').text('Stop Layout');
		}
	});
	$("#rescale-graph").on("click", function(u) {
		sigInst.position(0,0,1).draw();
	});
}
