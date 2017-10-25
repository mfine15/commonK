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

// function swoosh([x,y,z]){
//   return path({type: "LineString", coordinates: [x, z]});
// }
var arc = d3.line()
     .x(function(d) { return d[0] })
     .y(function(d) { return d[1] })
    //  .tension(.0);
function flying_arc([a,b]) {
  var source = a.geometry.coordinates;
  var target = b.geometry.coordinates
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

class Graph{
  constructor(data, nodes, connectivity){
    this.adjacency = {};
    this.edges = [];
    this.centerIds = {};
    this.nodes = [];
    this.travelPath = [];

    let centers = _.sampleSize(data.features, nodes);
    this.nodes = centers;
    this.center = _.sample(centers);
    // For visualization, want a subset of connected nodes but beyond that need to fill stuff in
    for (let c of centers){
      this.centerIds[c.id] = c;
      this.adjacency[c.id] = [];
      let connections = Math.round(connectivity * _.random(1, 1.5));
      let dests = _.sampleSize(centers, connections);
      for (let dest of dests){
        this.edges.push([c, dest]);
        this.adjacency[c.id].push([c, dest]);
      }
    };
  }
  get activeEdges(){
    return this.adjacency[this.center.id];
  }
  get inactiveEdges(){
    return _.without(this.edges, this.activeEdges);
  }
  get currentCoords(){
    return this.center.geometry.coordinates
  }
  static flyerId([source,dest]){
    return `#flyer-${source.id}-${dest.id}`
  }
  get travelPathId(){
    return `#flyer-${this.travelPath[0]}-${this.travelPath[1]}`
  }
  recenter(){
    // let centrals = _.without(Object.keys(this.centerIds), this.center.id);
    let neighbours = _.map(_.uniq(_.flatten(this.activeEdges)), o => ""+o.id);
    // let possibleNodes = _.intersection(
    //   centrals, neighbours
    // );
    const newCenter = this.centerIds[_.sample(neighbours)];
    this.travelPath = [this.center, newCenter]
    this.center = newCenter;

  }
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
  if (d[0]) {
    start = d[0].geometry.coordinates;
    end = d[1].geometry.coordinates;
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

function updateLinks(graph){
  let flyers = g.select("#flyers").selectAll("path")
    .data(graph.activeEdges, Graph.flyerId);

  flyers.exit()
    .transition()
    .duration(300)
    .attr("stroke", "grey")
    .remove();

  flyers
    .attr("d", d => swoosh(flying_arc(d)))
    .attr("opacity", function(d) {
        return fade_at_edge(d)
    });

  flyers
    .enter().append("path")
    .attr("id", d => "flyer" + d[1].id)
    .attr("class","flyer")
    .attr("d", d => swoosh(flying_arc(d)))
    .attr("opacity", function(d) {
        return fade_at_edge(d)
    })
    .attr("stroke-dasharray", function(){
      return this.getTotalLength() + " " + this.getTotalLength();
    })
    .attr("stroke-dashoffset", function(){return this.getTotalLength()})
    .transition()
    // .delay((d, i) => i*100)
    .duration(2000)
    .ease(d3.easeCubic)
    .attr("stroke-dashoffset", 0)
    .attrTween("stroke-dashoffset", function() {
      let len = this.getTotalLength();
      return d3.interpolate(len, 0);
    });

  let points = g.selectAll("text").data(graph.nodes);
  points.exit().transition().duration(500).style('opacity', 0).remove();
  points.attr("d", path);
  points
   .enter().append("path")
   .attr("class", "point")
   .attr("d", path);
}

queue()
.defer(d3.json, "https://gist.githubusercontent.com/d3indepth/f28e1c3a99ea6d84986f35ac8646fac7/raw/c58cede8dab4673c91a3db702d50f7447b373d98/ne_110m_land.json")
.defer(d3.json, "data/city-data.json")
.await((error, geojson, data) => {
  projection.rotate(rotate);
   // Handle errors getting and parsing the data
   if (error) { return error; }

  let graph = new Graph(data, 80, 15);
  projection.rotate(rotateTo(graph.currentCoords));

  let globe = g.append("g").attr("id", "globe");
   globe.append("path")
      .datum({type: "Sphere"})
      .attr("class", "front")
      .attr("d", path)
      .attr("fill", "#ffffff");

    globe.append("path")
      .datum({type: 'FeatureCollection', features: geojson.features})
      .attr("class", "front")
      .attr("d", path)
      .attr("fill", "#ccc");

   globe.append("path")
      .datum(d3.geoGraticule())
      .attr("class", "front")
      .attr("class", "graticule")
      .attr("d", path);
   g.append("g").attr("id","flyers")
   g.append("g").attr("class","points")
  updateLinks(graph);


  setInterval(() => {
    graph.recenter();
    refocus(graph);
  }, 5000)

});

function rotateTo(coords){
  return [-coords[0] + 15, -coords[1] + 15];
}


function refocus(graph){
  //   .data(links)
  //   .enter("path").data(links)
  //   .enter().append("path")
  //   .attr("id" , (d, i) => "flyer" + i)
  //   .attr("class","flyer")
  //   .attr("d", function(d) { return swoosh(flying_arc(d)) })
  //   .attr("opacity", function(d) {
  //       return fade_at_edge(d)
  //   });
    // .attr("display", "none")
  let f = g.select("#flyers").selectAll("path").filter((d, i) => {
    console.log("filtering", {d, i, travel: graph.travelPath})
    return d[0].id === graph.travelPath[0].id && d[1].id === graph.travelPath[1].id;
  })
  console.log("flying", {f, travelPath: graph.travelPath});
  console.log("focusing", f, f.classed("focused"));

  f.classed("focused", true);

  d3
    .transition()
    .duration(3000)
    .ease(d3.easeCubic)
    .tween("rotate", function() {
      var r = d3.interpolate(projection.rotate(), rotateTo(graph.currentCoords));
      return function(t) {
        projection.rotate(r(t));
        svg.selectAll(".land").attr("d", path);
        svg.selectAll(".point").attr("d", path);
        svg.selectAll("path").attr("d",path);
        svg.selectAll(".flyer")
          .attr("d", function(d) { return swoosh(flying_arc(d)) })
          .attr("opacity", function(d) {
            return fade_at_edge(d)
          })
          .attr("stroke-dasharray", function(){
            return this.getTotalLength() + " " + this.getTotalLength();
          })
          .attr("stroke-dashoffset", function(){return 0})
        svg.selectAll("path.cities").attr("d", path);
        svg.selectAll(".point").attr("d", path);

        // svg.selectAll("path").attr("d", path)
        // .classed("focused", function(d, i) { return d.id == focusedCountry.id ? focused = d : false; });
      };
    })
    .on("end", () => {
      updateLinks(graph);
      f.classed("focused", false);
      console.log("unfocusing", f, f.classed("focused"));

    })


  // // svg.append("g").attr("class","flyers")
  //   .selectAll("path").data(links)
  //   .enter().append("path")
  //   .attr("id" , (d, i) => "flyer" + i)
  //   .attr("class","flyer")
  //   .attr("d", function(d) { return swoosh(flying_arc(d)) })
  //   .attr("opacity", function(d) {
  //       return fade_at_edge(d)
  // });
  //
  // console.log(svg.selectAll(".flyer"));
  // svg.selectAll(".flyer").each(function(d,i){
  //   var totalLength = d3.select("#flyer" + i).node().getTotalLength();
  //     d3.selectAll("#flyer" + i).attr("stroke-dasharray", totalLength + " " + totalLength)
  //       .attr("stroke-dashoffset", totalLength)
  //       .transition()
  //       .duration(4000)
  //       .attr("stroke-dashoffset", 0)
  //       .style("stroke-width",1)
  // });
  // svg.selectAll(".arc").each(function(d,i){
  //   var totalLength = d3.select("#arc" + i).node().getTotalLength();
  //     d3.selectAll("#arc" + i).attr("stroke-dasharray", totalLength + " " + totalLength)
  //       .attr("stroke-dashoffset", totalLength)
  //       .transition()
  //       .duration(4000)
  //       .attr("stroke-dashoffset", 0)
  //       .style("stroke-width",1)
  // });
  return links;
}
