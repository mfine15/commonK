(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
let cambridge = { "type": "Feature", "properties": { "population": 30056051 }, "geometry": { "type": "Point", "coordinates": [-71.1479291, 42.3784484,] } };
cambridge = Object.assign(cambridge.geometry, cambridge.properties);

function makeGraph(center, points, hops, connectivity){
  const n = center === cambridge? Math.ceil(2 * connectivity) : connectivity
  if (hops == 0 ){
    return [];
  }

  let branches = _.range(Math.round(connectivity)).map(() => {
    branch = sample(points);
    const rest = makeGraph(branch, points, hops - 1, connectivity * 0.5);
    rest.push([center, branch, hops]);
    return rest;
  });
  console.log({branches});
  // debugger
  return _.flatten(branches);
}

function makePairs(center, data, hops, connectivity){
  const n = Math.round(Math.pow(connectivity, hops));
  let points = [center].concat(_.sampleSize(data.features, n ).map(p => {
    return Object.assign(p.geometry, p.properties)
  }));
  // runTimes(81, () => {
  //   console.log({data});
  //   const point = sample(data.features);
  //   points.push(Object.assign(point.geometry, point.properties));
  // });
  const edges = makeGraph(center, points, hops, connectivity);
  return [edges, points, center.coordinates]
}

// function makePairs(data,times){
//   let pairs = [];
//   let points = [];
//   let center;
//   let branch = cambridge;
//   let i = 5;
//   let centerSteps = {};
//   while(i > 0){
//     center = branch;
//     centerSteps[center.properties.population] = i;

//     points.push(Object.assign(center, center.properties));

//     runTimes(Math.floor(Math.pow(i,3)), () => {
//       branch = sample(data.features);
//       p = {
//         coords: [
//           center.geometry.coordinates,
//           branch.geometry.coordinates
//         ],
//         pop: [
//           center.properties.population,
//           branch.properties.population,
//         ],
//         points: [
//           center.geometry,
//           branch.geometry
//         ],
//         i: (centerSteps[branch.properties.population]? centerSteps[branch.properties.population] : i),
//       };
//       pairs.push(p);

//       points.push(Object.assign(branch, branch.properties));

//     })
//     i--;
//   };
//   console.log(center)
//   return [pairs,points,points[0].geometry.coordinates];
// }

function dist(a, b){
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2))
}

d3.json("data/geojson.json", (error, geojson) => {
d3.json("data/cities.json", (error2, data) => {

  // min = data.features[0];
  // minDist = Number.MAX_SAFE_INTEGER;
  // for (c of data.features){
  //   // console.log(c);
  //   d = dist(c.geometry.coordinates, [42, 71]);
  //   if (d < minDist){
  //     min = c;
  //     minDist = d
  //   }
  // }
  // console.log("Min!", min);

  let [links, points, center] = makePairs(cambridge, data, 3, 6);
  console.log("Hello", {links, points, center});
  projection.rotate([-center[0] + -15, -center[1] + 15]);


  // projection.rotate(rotate);
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
      .style("stroke-opacity", 0.3)
      .attr("d", path);



   links.forEach(function(e,i,a) {
     var feature = { 
      "type": "Feature", 
      "geometry": { 
        "type": "LineString", 
        "coordinates": [e[0].coordinates,e[1].coordinates] 
      },
      "weight": Math.random(),
      i: e[2]
    }
    console.log(e, feature)
     arcLines.push(feature);
   });
   arcLines = _.shuffle(arcLines);
 
  const rScale = d3.scaleLog()
    .domain(d3.extent(points, p => p.population))
    .range([2, 7]);

  const wScale = d3.scalePow(3)
    .domain([0,1])
    .range([0.2, 2]);
  const extent = d3.extent(arcLines, l => l.i);


  console.log("Extent", extent);
  const colorScale = d3.scalePow(15)
    .domain(extent)
    .range([0.2,1]);

  path.pointRadius(function(d) {
    // console.log("pointRadius",d, d.population, rScale(d.population));
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
    .style('stroke', d => {
      if(d.geometry.coordinates.includes(center)){
        // console.log("found center", d, center);
        return "#6400e3"
      }
      // console.log("didn't find center", d, center);
      return "#6400e3"
    } )
    .attr('stroke-opacity', d => colorScale(d.i))
    // .style('stroke-width', d => {
    //   // console.log(wScale,wScale(d.weight), d.weight)
    //   return wScale(d.weight)
    // })


  d3.selectAll(".flyer").each(function(d,i){
    var totalLength = d3.select("#flyer" + i).node().getTotalLength();
      const dir = d.i != 3? "-" : ""
      d3.selectAll("#flyer" + i).attr("stroke-dasharray", totalLength + " " + totalLength)
        .attr("stroke-dashoffset", dir+totalLength)
        .transition()
        .on("end", () => {
          d3.selectAll("#flyer" + i)
            .attr("stroke-dasharray", 0);
        })
        .duration(2000)
        .ease(d3.easeQuadOut)
        .delay(d => (3 - d.i)*1500 + i * 20)
        .attr("stroke-dashoffset", 0)
        // .style('stroke-width', d => {
        //   return Math.pow(d.weight + 1, 2)
        // })
  })

  refresh();
   

})
});


function refresh(){
  d3.interval(function(elapsed) {
    if (elapsed > 1800 * 3){
      // get current time
      if (!dragging){
        let current = projection.rotate();
        projection.rotate([current[0] - velocity[0] * 20, current[1]]);
      }
      // sky.rotate([rotate[0] + velocity[0] * elapsed, rotate[1]+ velocity[1] * elapsed]);
      svg.selectAll(".land").attr("d", path);
      svg.selectAll(".point")
        .attr("d", path)

      svg.selectAll(".front").attr("d",path);
      svg.selectAll(".graticule").attr("d",path);

      svg.selectAll(".flyer")
        .attr("d", path)
        // .style('stroke-width', d => {
        //   return Math.pow(d.weight + 1, 2)
        // })
    }
},10);

}
},{}]},{},[1]);
