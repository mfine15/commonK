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

// set projection type and paremetes
var projection = d3.geoOrthographic()
   .scale(220)
   .translate([(width / 2), height / 2])
   .clipAngle(90);

var sky = d3.geoOrthographic()
   .translate([width / 2, height / 2])
   .clipAngle(90)
   .scale(220);

var swoosh = d3.line()
     .x(function(d) { return d[0] })
     .y(function(d) { return d[1] })
     .curve(d3.curveCardinal)
    //  .tension(.0);
function flying_arc(pts) {
  var source = pts[0],
      target = pts[1];

  var mid = location_along_arc(source, target, .5);
  var result = [ projection(source),
                 sky(mid),
                 projection(target) ]
  return result;
}

function location_along_arc(start, end, loc) {
  var interpolator = d3.geoInterpolate(start,end);
  return interpolator(loc)
}

function fade_at_edge(d) {
  var centerPos = projection.invert([width/2,height/2]),
      start, end;
  // function is called on 2 different data structures..
  if (d[0]) {
    start = d[0],
    end = d[1];
  }
  else {
    start = d.geometry.coordinates[0];
    end = d.geometry.coordinates[1];
  }
  console.log()
  var start_dist = 1.57 - d3.geoDistance(start,centerPos),
      end_dist = 1.57 - d3.geoDistance(end,centerPos);

  var fade = d3.scaleLinear().domain([-.1,0]).range([0,.1])
  var dist = start_dist < end_dist ? start_dist : end_dist;

  return fade(dist)
}

// create path variable, empty svg element and group container
var path = d3.geoPath()
   .projection(projection).pointRadius(2);
   var svg = d3.select("#globe").append("svg")
              .attr("width", width)
              .attr("height", height)
var g = svg.append("g");

// drawing dark grey spehere as landmass

function makePairs(data,times){
  let pairs = [];
  _.times(times, () => {
    pairs.push([
      _.sample(data.features).geometry.coordinates,
      _.sample(data.features).geometry.coordinates
    ]);
  });
  return pairs;
}


queue()
.defer(d3.json, "https://gist.githubusercontent.com/d3indepth/f28e1c3a99ea6d84986f35ac8646fac7/raw/c58cede8dab4673c91a3db702d50f7447b373d98/ne_110m_land.json")
.defer(d3.json, "data/cities.json")
.await((error, geojson, data) => {

   // Handle errors getting and parsing the data
   if (error) { return error; }
   g.append("path")
      .datum({type: "Sphere"})
      .attr("class", "sphere")
      .attr("d", path)
      .attr("fill", "#ffffff");

    g.append("path")
      .datum({type: 'FeatureCollection', features: geojson.features})
      .attr("d", path)
      .attr("fill", "#ccc");

   g.append("path")
      .datum(d3.geoGraticule())
      .attr("class", "graticule")
      .attr("d", path);

   // setting the circle size (not radius!) according to the number of inhabitants per city
   population_array = [];
   for (i = 0; i < data.features.length; i++) {
      population_array.push(data.features[i].properties.population);
   }
   max_population = population_array.sort(d3.descending)[0]
   var rMin = 0;
   var rMax = Math.sqrt(max_population / (peoplePerPixel * Math.PI));
   rScale.domain([0, max_population]);
   rScale.range([rMin, rMax]);

   path.pointRadius(function(d) {
      return d.properties ? rScale(d.properties.population) : 1;

   });

   links = makePairs(data,40);

   links.forEach(function(e,i,a) {
     var feature =   { "type": "Feature", "geometry": { "type": "LineString", "coordinates": [e[0],e[1]] }}
     arcLines.push(feature)
   })

   // Drawing transparent circle markers for cities
  //  g.selectAll("path.cities").data(data.features)
  //     .enter().append("path")
  //     .attr("class", "cities")
  //     .attr("d", path)
  //     .attr("fill", "darkred")
  //     .attr("fill-opacity", 0.3);

   // start spinning!
  // svg.append("g").attr("class","arcs")
  //   .selectAll("path").data(arcLines)
  //   .enter().append("path")
  //    .attr("class","arc")
  //    .attr("d",path);
  svg.append("g").attr("class","flyers")
    .selectAll("path").data(links)
    .enter().append("path")
    .attr("class","flyer")
    .attr("d", function(d) { return swoosh(flying_arc(d)) })


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

      // get current time
  projection.rotate([rotate[0] + velocity[0] * elapsed, rotate[1]+ velocity[1] * elapsed]);
  sky.rotate([rotate[0] + velocity[0] * elapsed, rotate[1]+ velocity[1] * elapsed]);
  g.selectAll("path").attr("d", path);

  // svg.selectAll(".arc")
  //   .attr("d", path)
  //   .attr("opacity", function(d) {
  //       return fade_at_edge(d)
  //   })

  svg.selectAll(".flyer")
    .attr("d", function(d) { return swoosh(flying_arc(d)) })
    .attr("opacity", function(d) {
      return fade_at_edge(d)
    })
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
