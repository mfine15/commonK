var isSmall = window.innerWidth < 720; 
var width  =  Math.min(window.innerWidth, 540);
var height =  isSmall? 270 : 540;
var graticuleStep = isSmall? 15 : 10;

var peoplePerPixel = 50000;
var max_population = [];
var links = [];
var arcLines = [];

var glow = 3;

// Configuration for the spinning effect
var time = Date.now();
var rotate = [0, -35];
var velocity = [.006, .0015];
var sens = 0.25;
var dragging = false;
// set projection type and paremeters
var projection = d3.geoOrthographic()
   .scale(isSmall? 110 : 220)
   .translate([(width / 2), height / 2])
   .clipAngle(90);
var path = d3.geoPath().projection(projection);

function runTimes(n, fn){
  return Array.apply(null, Array(5)).map(function (_, i) {return fn(i);});
}
function location_along_arc(start, end, loc) {
  var interpolator = d3.geoInterpolate(start,end);
  return interpolator(loc)
}


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



function sample(arr){
  let x = Math.round(Math.random() * (arr.length - 1));
  // debugger;
  return arr[x];
}
function makePairs(data,times){
  let pairs = [];
  let points = [];
  let i = 0;
  while(pairs.length < times){
    let center = sample(data.features);

    points.push(Object.assign(center, center.properties));

    runTimes(Math.floor(Math.pow(i,2.2)), () => {
      let branch = sample(data.features);
      pairs.push({
        coords: [
          center.geometry.coordinates,
          branch.geometry.coordinates
        ],
        pop: [
          center.properties.population,
          branch.properties.population,
        ],
        points: [
          center.geometry,
          branch.geometry
        ]
      });
      points.push(Object.assign(branch, branch.properties));

    })
    i++;
  };
  return [pairs,points];
}


d3.json("data/geojson.json", (error, geojson) => {
d3.json("data/cities.json", (error2, data) => {

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
      .datum(d3.geoGraticule().step([graticuleStep, graticuleStep]))
      .attr("class", "front")
      .attr("class", "graticule")
      .attr("d", path);


   let [links, points] = makePairs(data,40);

   links.forEach(function(e,i,a) {
     var feature = { 
      "type": "Feature", 
      "geometry": { 
        "type": "LineString", 
        "coordinates": [e.coords[0],e.coords[1]] 
      },
      "weight": Math.random()
    }
     arcLines.push(feature)
   });
 
  const rScale = d3.scaleLog()
    .domain(d3.extent(points, p => p.population))
    .range([2, 7]);

  path.pointRadius(function(d) {
    console.log("pointRadius",d, d.population, rScale(d.population));
    return d.population ? rScale(d.population) : 1;
  });
  
  console.log("points",points);
  svg.append("g")
   .attr("class","points")
   .selectAll("text")
   .data(points)
   .enter().append("path")
   .attr("class", "point")
   .attr("d", path)
   .attr("fill", "#6400e3")
   .attr("fill-opacity", 0.4);

  svg.append("g").attr("class","flyers")
    .selectAll("path").data(arcLines)
    .enter().append("path")
    .attr("id" , (d, i) => "flyer" + i)
    .attr("class","flyer")
    .attr("d", path)
    .attr('stroke-width', d => {
      return d.weight * 10
    })


  d3.selectAll(".flyer").each(function(d,i){
    var totalLength = d3.select("#flyer" + i).node().getTotalLength();
      d3.selectAll("#flyer" + i).attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .on("end", () => {
          d3.selectAll("#flyer" + i)
            .attr("stroke-dasharray", 0)
        })
        .duration(4000)
        .delay(80*i)
        .attr("stroke-dashoffset", 0)
        .attr('stroke-width', d => {
          return d.weight * 10
        })
  })


   refresh();

})
});


function refresh(){
  d3.interval(function(elapsed) {
    if (elapsed > 4000 + links.length * 80){
      // get current time
      if (!dragging){
        let current = projection.rotate();
        projection.rotate([current[0] + velocity[0] * 20, current[1]]);
      }
      // sky.rotate([rotate[0] + velocity[0] * elapsed, rotate[1]+ velocity[1] * elapsed]);
      svg.selectAll(".land").attr("d", path);
      svg.selectAll(".point")
        .attr("d", path)

      svg.selectAll(".front").attr("d",path);
      svg.selectAll(".graticule").attr("d",path);

      svg.selectAll(".flyer")
        .attr("d", path)
    }
},50);

}