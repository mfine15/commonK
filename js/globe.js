var width  = 540;
var height = 540;
var rScale = d3.scaleSqrt();
var peoplePerPixel = 50000;
var max_population = [];
var links = [];
var arcLines = [];

// Configuration for the spinning effect
var time = Date.now();
var rotate = [0, -35];
var velocity = [.006, .0015];
var sens = 0.25;
var dragging = false;
// set projection type and paremeters
var projection = d3.geoOrthographic()
   .scale(220)
   .translate([(width / 2), height / 2])
   .clipAngle(90);
var path = d3.geoPath().projection(projection).pointRadius(2);

// var sky = d3.geoOrthographic()
//    .translate([width / 2, height / 2])
//    .clipAngle(90)
//    .scale(260);

var swoosh = d3.line()
     .x(function(d) { return d[0] })
     .y(function(d) { return d[1] })
     .curve(d3.curveCardinal);
var arc = d3.line()
     .x(function(d) { return d[0] })
     .y(function(d) { return d[1] })
    //  .tension(.0);
function flying_arc(pts) {
  var source = pts.coords[0],
      target = pts.coords[1];
  // get canvas coords of arc midpoint and globe center
  var mid = projection(location_along_arc(source, target, .5));
  var ctr = projection.translate();

  // max length of a great circle arc is π,
  // so 0.3 means longest path "flies" 20% of radius above the globe
  var scale = 1 + 0.3 * d3.geoDistance(source,target) / Math.PI;
  mid[0] = ctr[0] + (mid[0]-ctr[0])*scale;
  mid[1] = ctr[1] + (mid[1]-ctr[1])*scale;

  var result = [ projection(source),
                 mid,
                 projection(target) ]
  return result;
}

function location_along_arc(start, end, loc) {
  var interpolator = d3.geoInterpolate(start,end);
  return interpolator(loc)
}

// TODO: Function to clip by bounding box,
// currently clip finds the cartesian point of intersection with the 90 meredian
function clipArc(p1, p2){
  const [x1,y1] = projection(p1);
  const [x2,y2] = projection(p2);
  const meridian = projection([45, 90])[0];

  const slope = (y2 - y1) / (x2 - x1);
  const clip = [meridian, (meridian - x1) * slope + y1];
  const relative = location_along_arc(p1, p2, loc);

}


function fade_at_edge(d) {
  var centerPos = projection.invert([width/2,height/2]),
      start, end;
  // function is called on 2 different data structures..
  if (d.coords && d.coords[0]) {
    start = d.coords[0],
    end = d.coords[1];
  }
  else {
    start = d.geometry.coordinates[0];
    end = d.geometry.coordinates[1];
  }
  var start_dist = Math.PI * 2/3 - d3.geoDistance(start,centerPos),
      end_dist = Math.PI * 2/3 - d3.geoDistance(end,centerPos);

  var fade = d3.scaleLinear().domain([-.1,0]).range([0,.1])
  var dist = start_dist < end_dist ? start_dist : end_dist;

  return fade(dist)
}

function hide_off(d) {
  var centerPos = projection.invert([width/2,height/2]),
      start, end;
  // function is called on 2 different data structures..
  if (d.coords[0]) {
    start = d.coords[0],
    end = d.coords[1];
  }
  else {
    console.log(d);
    start = d.geometry.coordinates[0];
    end = d.geometry.coordinates[1];
  }
  console.log()
  var start_dist = 1.57 - d3.geoDistance(start,centerPos),
      end_dist = 1.57 - d3.geoDistance(end,centerPos);

  return start_dist > 0 || end_dist > 0? 'inline' : 'none';
}

// create path variable, empty svg element and group container
   var svg = d3.select("#globe").append("svg")
              .attr("width", width)
              .attr("height", height)
              .call(d3.drag()
                .subject(function() { var r = projection.rotate(); return {x: r[0] / sens, y: -r[1] / sens}; })
                .on("start", () => dragging = true)
                .on("end", () => dragging = false)
                .on("drag", function() {
                  var rotate = projection.rotate();
                  projection.rotate([d3.event.x * sens, -d3.event.y * sens, projection.rotate()[2]]);
                }))
var g = svg.append("g");

// drawing dark grey spehere as landmass

function makePairs(data,times){
  let pairs = [];
  _.sampleSize(data.features, times).forEach((center, i) => {
    _.times(i, () => {
      let branch = _.sample(data.features);
      pairs.push({
        coords: [
          center.geometry.coordinates,
          branch.geometry.coordinates
        ],
        pop: [
          branch.properties.population,
          center.properties.population,
        ],
        points: [
          center.geometry,
          branch.geometry
        ]
      });
    })
  });
  return pairs;
}


queue()
.defer(d3.json, "https://gist.githubusercontent.com/d3indepth/f28e1c3a99ea6d84986f35ac8646fac7/raw/c58cede8dab4673c91a3db702d50f7447b373d98/ne_110m_land.json")
.defer(d3.json, "data/cities.json")
.await((error, geojson, data) => {
  projection.rotate(rotate);
   // Handle errors getting and parsing the data
   if (error) { return error; }
   g.append("path")
      .datum({type: "Sphere"})
      .attr("class", "front")
      .attr("d", path)
      .attr("fill", "#ffffff");

    g.append("path")
      .datum({type: 'FeatureCollection', features: geojson.features})
      .attr("class", "front")
      .attr("d", path)
      .attr("fill", "#ccc");

   g.append("path")
      .datum(d3.geoGraticule())
      .attr("class", "front")
      .attr("class", "graticule")
      .attr("d", path);

   // setting the circle size (not radius!) according to the number of inhabitants per city


   links = makePairs(data,10);

   links.forEach(function(e,i,a) {
     var feature =   { "type": "Feature", "geometry": { "type": "LineString", "coordinates": [e.coords[0],e.coords[1]] }}
     arcLines.push(feature)
   })
   console.log(_.flatten(_.map(links, 'points')));

   // Drawing transparent circle markers for cities
   svg.append("g")
    .attr("class","points")
    .selectAll("text")
    .data(_.flatten(_.map(links, 'points')))
    .enter().append("path")
    .attr("class", "point")
    .attr("d", path);


   // start spinning!
  // svg.append("g").attr("class","arcs")
  //   .selectAll("path").data(arcLines)
  //   .enter().append("path")
  //    .attr("class","arc")
  //    .attr("d",path);

  svg.append("g").attr("class","flyers")
    .selectAll("path").data(links)
    .enter().append("path")
    .attr("id" , (d, i) => "flyer" + i)
    .attr("class","flyer")
    .attr("d", function(d) { return swoosh(flying_arc(d)) })
    .attr("opacity", function(d) {
        return fade_at_edge(d)
    })

  // svg.append("g").attr("class","arcs")
  //   .selectAll("path").data(arcLines)
  //   .attr("id" , (d, i) => "arc" + i)
  //   .enter().append("path")
  //   .attr("class","arc")
  //   .attr("d", path)
  //   .attr("opacity", function(d) {
  //       return fade_at_edge(d)
  //   });
  d3.selectAll(".flyer").each(function(d,i){
  	var totalLength = d3.select("#flyer" + i).node().getTotalLength();
  		d3.selectAll("#flyer" + i).attr("stroke-dasharray", totalLength + " " + totalLength)
  		  .attr("stroke-dashoffset", totalLength)
  		  .transition()
  		  .duration(4000)
  		  .delay(80*i)
  		  .attr("stroke-dashoffset", 0)
  		  .style("stroke-width",1)
	})
  d3.selectAll(".arc").each(function(d,i){
  	var totalLength = d3.select("#arc" + i).node().getTotalLength();
  		d3.selectAll("#arc" + i).attr("stroke-dasharray", totalLength + " " + totalLength)
  		  .attr("stroke-dashoffset", totalLength)
  		  .transition()
  		  .duration(4000)
  		  .delay(80*i)
  		  .attr("stroke-dashoffset", 0)
  		  .style("stroke-width",1)
	})

   refresh();
});

// function refresh() {
//   svg.selectAll(".land").attr("d", path);
//   svg.selectAll(".point").attr("d", path);
//
//   svg.selectAll(".arc").attr("d", path)
//     .attr("opacity", function(d) {
//         return fade_at_edge(d)
//     })
//
//   svg.selectAll(".flyer")
//     .attr("d", function(d) { return swoosh(flying_arc(d)) })
//     .attr("opacity", function(d) {
//       return fade_at_edge(d)
//     })
// }

function refresh(){
  d3.timer(function(elapsed) {
    if (elapsed > 4000 + links.length * 80){
      // get current time
      if (!dragging){
        let current = projection.rotate();
        projection.rotate([current[0] + velocity[0] * 10, current[1]]);
      }
      // sky.rotate([rotate[0] + velocity[0] * elapsed, rotate[1]+ velocity[1] * elapsed]);
      svg.selectAll(".land").attr("d", path);
      svg.selectAll(".point").attr("d", path);
      svg.selectAll("path").attr("d",path);
      svg.selectAll(".arc")
        .attr("d", path)
        .attr("opacity", function(d) {
            return fade_at_edge(d)
        })

      svg.selectAll(".flyer")
        .attr("d", function(d) { return swoosh(flying_arc(d)) })
        .attr("opacity", function(d) {
          return fade_at_edge(d)
        })
      svg.selectAll("path.cities").attr("d", path);
      svg.selectAll(".point").attr("d", path);

      d3.selectAll(".flyer").each(function(d,i){
      	var totalLength = d3.select("#flyer" + i).node().getTotalLength();
      		d3.selectAll("#flyer" + i).attr("stroke-dasharray", totalLength + " " + totalLength)
      		  .attr("stroke-dashoffset", totalLength)
      		  .attr("stroke-dashoffset", 0)
      		  .style("stroke-width",1)
    	})
      d3.selectAll(".arc").each(function(d,i){
      	var totalLength = d3.select("#arc" + i).node().getTotalLength();
      		d3.selectAll("#arc" + i).attr("stroke-dasharray", totalLength + " " + totalLength)
      		  .attr("stroke-dashoffset", totalLength)
      		  .attr("stroke-dashoffset", 0)
      		  .style("stroke-width",1)
    	})
    }

},10);

}

// Events for sliders and button
// document.getElementById("rotation").addEventListener("change", function() {
//    var new_speed = this.value;
//    velocity[0] = new_speed
// });
//
// document.getElementById("glow").addEventListener("change", function() {
//    var new_glow = this.value;
//    g.selectAll("path.cities")
//    .attr("fill-opacity", new_glow);
// });
//
// document.getElementById("marker_size").addEventListener("change", function() {
//    var new_marker_size = 1 / this.value ;
//    peoplePerPixel = new_marker_size * 100000;
//    var rMin = 0;
//    var rMax = Math.sqrt(max_population / (peoplePerPixel * Math.PI));
//    rScale.range([rMin, rMax]);
// });
//
// document.getElementById("color").addEventListener("change", function() {
//    var new_color = this.value;
//    g.selectAll("path.cities")
//    .attr("fill", new_color);
// });

// hackish approach to get bl.ocks.org to display individual height
d3.select(self.frameElement).style("height", height + "px");
