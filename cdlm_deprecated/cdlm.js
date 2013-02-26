var build_cdlm = function(divid,CSVPATH,JPGPATH) {

	d3.csv(CSVPATH, function(indata) {
	
		var nStations = indata.length;
		//var metroColors = ["#F9BD32","#155DA3","#8B8337","#9B4687","#E47E46","#79B486","#E292A4","#B096BF","#C6B738","#D29D3E","#774D2A","#30734A","#84C7D4","#472C79"];
		var defaultOp=0.4;
		var defaultLegendText = "please roll a station to see its name";
	
		var supcontainer = d3.select("#"+divid).append("div")
			.attr("id","vizcontainer")
			.style("height","10px");
	
		// first add image
		var container = supcontainer.append("div")
			.style("position","relative");
		var imdiv = container.append("div")
			.style("position","absolute")
			.style("width","100%")
			.style("left",0)
			.style("top",0);
		imdiv.append("img")
			.attr("id","backmap")
			.style("width","100%")
			.attr("src",JPGPATH);
		
		// fetch size using jquery (depends on screen size)
		var imW = $("#vizcontainer").width();//590;
		var imH = imW*471/590;//471;	
		//console.log("Size:"+imW+"_"+imH);
		supcontainer.style("height",imH+"px");
		
		var buttons = d3.select("#"+divid).append("div").attr("z-index",9999);
		var svgdiv = container.append("div")
			.style("position","absolute")
			.style("left",0)
			.style("top",0);
			
		var viz = svgdiv.append("svg:svg")
			.attr("width",imW)
			.attr("height",imH);
		
		/////////////////////////////////////////// SCALES
		var maxCount = d3.max(indata,function(d,i){return parseInt(d.total);});
	
		var opScale = d3.scale.linear() // for opacity, non representative values are transparent
			.domain([0,maxCount])
			.range([0,1]);
		var colScale = d3.scale.linear()
			.domain([0,maxCount])
			.range(["white","gray"]);
				
		var minX = d3.min(indata,function(d,i){return d.x;});
		var maxX = d3.max(indata,function(d,i){return d.x;});
		var xScale = d3.scale.linear()
			.domain([minX,maxX])
			.range([0,imW]);
		var minY = d3.min(indata,function(d,i){return d.y;});
		var maxY = d3.max(indata,function(d,i){return d.y;});
		var yScale = d3.scale.linear()
			.domain([minY,maxY])
			.range([imH,0]);
		
		/////////////////////////////////////////// MODES
		var modes=['pHomo','pLesbian','pHask','pFask','total','lengthmean'];
		var butColors = ['#EAA99F','#F9B6FF','#F0ACC7','#94BDE1','lightgray','lightgray'];	// for butt rollover
		var colors=['#EAA99F','#F9B6FF','#94BDE1','#F9B6FF','gray','gray'];					// for map
		var descr=['gay','lesbienne','hétéro (fille)','hétéro (garçon)'];					// button
		var vuparmode=['garçons','filles','garçons','filles','garçons/filles','garçons/filles'];			// for text
		var maxValue = new Array();
		maxValue.push( d3.max(indata,function(d,i){ return d.pHomo*1.0; }) );
		maxValue.push( d3.max(indata,function(d,i){ return d.pLesbian*1.0; }) );
		maxValue.push( d3.max(indata,function(d,i){ return d.pHask*1.0; }) );
		maxValue.push( d3.max(indata,function(d,i){ return d.pFask*1.5; }) );
		maxValue.push( d3.max(indata,function(d,i){ return d.total*1.0; }) );
		maxValue.push( d3.max(indata,function(d,i){ return d.lengthmean*1.8; }) );
		var currentMode = 'total';
		
		/////////////////////////////////////////// FUNCTIONS
		var switchToMode = function(mode){
			currentMode = mode;
			console.log("mode:"+mode);	
			var k = modes.indexOf(mode);
			
			d3.select("#vupar").text(vuparmode[k]);
			colScale.domain([0, maxValue[k] ]);
			colScale.range(["white", colors[k] ]);
			opScale.domain([0, maxValue[k] ]);
			
			voronoi.style("opacity",function(d,i){ return getGoodValue(i); });
			voronoi.attr("fill",function(d,i){ return colors[k]; });
		}
		var getGoodLabel = function(i){
			var v = indata[i].label+": ";
			var tot = " (./"+indata[i].total+")";
			if(currentMode=='pHomo') v+=parseInt(indata[i].nHomo)+" poilu(s)"+tot;
			if(currentMode=='pLesbian') v+=parseInt(indata[i].nLesbian)+" goudou(s)"+tot;
			if(currentMode=='pHask') v+=parseInt(indata[i].nHask)+" prince(s)"+tot;
			if(currentMode=='pFask') v+=parseInt(indata[i].nFask)+" princesse(s)"+tot;
			if(currentMode=='total') v+=indata[i].total+" annonce(s)";
			if(currentMode=='lengthmean') v+=parseInt(indata[i].lengthmean)+" caractères";
			return v;	
		};
		var getGoodValue = function(i){
			var v=null;
			if(currentMode=='total') v=indata[i].total;
			if(currentMode=='pHomo') v=indata[i].pHomo;
			if(currentMode=='pLesbian') v=indata[i].pLesbian;
			if(currentMode=='pHomo') v=indata[i].pHomo;
			if(currentMode=='pHask') v=indata[i].pHask;
			if(currentMode=='pFask') v=indata[i].pFask;
			if(currentMode=='lengthmean') v=indata[i].lengthmean;
			return opScale(v);
		};
			
		/////////////////////////////////////////// VORONOI
		// friendly array for d3 voronoi
		var dataPositions = indata.map(function(d,i){ return [xScale(d.x),yScale(d.y)];});
		var voronoi = viz.selectAll("voronoi")
			.data(d3.geom.voronoi(dataPositions))
			.enter().append("svg:path")
				.attr("class","bub")
				//.attr("label",function(d,i){return indata[i].label+" ("+indata[i].total+" messages)";})
				//.attr("stroke","gray")
				//.attr("stroke-width","1px")
				.attr("fill",function(d,i){return colScale(indata[i].total);})
				.style("opacity",function(d,i){ return opScale(indata[i].total);})
				.attr("d", function(d,i) { return "M" + d.join("L") + "Z"; })
					.on("mouseover",function(d,i){
						d3.select(this).style("opacity",0.8);
						//d3.select(this).attr("stroke","yellow");
						//d3.select(this).attr("stroke-width","3px")
						d3.select(this).attr("fill","yellow");
						d3.select("#legend").text( getGoodLabel(i) );
					})
					.on("mouseout",function(d,i){
						d3.select(this).style("opacity",getGoodValue(i));
						d3.select(this).attr("fill",colors[modes.indexOf(currentMode)]);
						//d3.select(this).attr("stroke","none");
						d3.select("#legend").text(defaultLegendText);
					});
		
		/////////////////////////////////////////// CIRCLES
	/*
		var circles = viz.selectAll("circles")
			.data(indata)
			.enter().append("svg:circle")
				.attr("class",'bub')
				.attr("title",function(d,i){return d.label;})
				.attr("cx",function(d,i){return xScale(d.x);})
				.attr("cy",function(d,i){return yScale(d.y);})
				.attr("r",2)
				.attr("fill","black")
				//.attr("stroke","red")
				.attr("opacity",defaultOp);
	*/
		
		/////////////////////////////////////////// LEGEND
		var legendcontainer = container.append("div")
			.attr("id","legend")
			.attr("class","cdlm_legend")
			.style("top",imH-25+"px")
			.text(defaultLegendText);
				
		/////////////////////////////////////////// MODES
		container.append("div")
			.style("position","absolute")
			.style("left",0)
			.style("top",0)
			.style("width",imW+"px")
			.style("height","40px")
			.style("font-size","70%")
			.style("background","white");
		var buttons = container.append("div")
			.style("position","absolute")
			.style("left","7px")
			.style("top","7px")
			.style("padding","5px");
		buttons.append("div")
			.attr("class","cdlm_text")
			.text("si je suis ");
	
		for(k in modes.slice(1,5)) {
			buttons.append("div")
				.attr("k",k)
				.attr("mode",modes[k])
				.attr("class","cdlm_button cdlm_"+modes[k])
				.style("display","inline-block")
				.text(descr[k])
				.on("click",function(d,i){
					var mode = d3.select(this).attr("mode");
					d3.selectAll(".cdlm_button").style("background","white");
					d3.select(this).style("background",butColors[d3.select(this).attr("k")]);
					switchToMode(mode);
				});
		};
	
		buttons.append("div")
			.attr("class","cdlm_text")
			.text(", où sont les");
		buttons.append("div")
			.attr("id","vupar")
			.attr("class","cdlm_text")
			.style("margin-left","3px")
			.style("margin-right","3px")
			.text("garçons");
		buttons.append("div")
			.attr("class","cdlm_text")
			.text("qui me remarqueront ?");
		
		/////////////////////////////////////////// BUTTONS ALL
		var wid = 190;
		container.append("div")
			.attr("class","cdlm_button cdlm_white")
			.style("background","lightgray")
			.style("position","absolute")
			.style("left",imW-wid-13+"px")
			.style("top",imH-48+"px")
			.on("click",function(d,i){
				var mode = d3.select(this).attr("mode");
				d3.selectAll(".cdlm_button").style("background","white");
				d3.select(this).style("background",butColors[4]);
				switchToMode('total');
			})
			.text("nombre total d'annonces");
		container.append("div")
			.attr("class","cdlm_button cdlm_white")
			.style("position","absolute")
			.style("left",imW-wid-13+"px")
			.style("top",imH-25+"px")
			.on("click",function(d,i){
				var mode = d3.select(this).attr("mode");
				d3.selectAll(".cdlm_button").style("background","white");
				d3.select(this).style("background",butColors[5]);
				switchToMode('lengthmean');
			})
			.text("longueur moyenne des annonces");
		
		switchToMode('total');
	});
};

