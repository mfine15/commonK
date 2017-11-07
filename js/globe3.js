/**
 * MODIFIED to draw paths rather than columnar points
 *
 * dat.globe Javascript WebGL Globe Toolkit
 * http://dataarts.github.com/dat.globe
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

var DAT = DAT || {};
var graticicalCellWidth= 10;
var graticicalCellHeight= 10;
var width = 600,
height = 600,
radius = 200;

DAT.Globe = function(container, opts) {
  opts = opts || {};

  var colorFn = opts.colorFn || function(x) {
    var c = new THREE.Color();
    c.setHSL( ( 0.6 - ( x * 0.5 ) ), 1.0, 0.5 );
    return c;
  };

  var Shaders = {
    'earth' : {
      uniforms: {
        'texture': { type: 't', value: null }
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
          'vNormal = normalize( normalMatrix * normal );',
          'vUv = uv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D texture;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'vec3 diffuse = texture2D( texture, vUv ).xyz;',
          'float intensity = 0.75 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
          'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
          'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
        '}'
      ].join('\n')
    },
    'atmosphere' : {
      uniforms: {},
      vertexShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'vNormal = normalize( normalMatrix * normal );',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
          'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
        '}'
      ].join('\n')
    }
  };

  var camera, scene, renderer, w, h;
  var mesh, atmosphere, point;

  var overRenderer;

  var curZoomSpeed = 0;
  var zoomSpeed = 50;

  var mouse = { x: 0, y: 0 }, mouseOnDown = { x: 0, y: 0 };
  var rotation = { x: 0, y: 0 },
      target = { x: Math.PI*3/2, y: Math.PI / 6.0 },
      targetOnDown = { x: 0, y: 0 };

  var distance = 100000, distanceTarget = 100000;
  var padding = 40;
  var PI_HALF = Math.PI / 2;

  function init() {

    container.style.color = '#fff';
    container.style.font = '13px/20px Arial, sans-serif';

    var shader, uniforms, material;
    w = container.offsetWidth || window.innerWidth;
    h = container.offsetHeight || window.innerHeight;

    camera = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
    camera.position.z = distance;

    scene = new THREE.Scene();
    scene.background = new THREE.Color('white');

    var geometry = new THREE.SphereGeometry(200, 40, 30);

    shader = Shaders['earth'];
    uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    uniforms['texture'].value = THREE.ImageUtils.loadTexture('img/white-globe.png');

    material = new THREE.ShaderMaterial({
          uniforms: uniforms,
          vertexShader: shader.vertexShader,
          fragmentShader: shader.fragmentShader
        });

    mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = Math.PI;
    scene.add(mesh);

    // shader = Shaders['atmosphere'];
    // uniforms = THREE.UniformsUtils.clone(shader.uniforms);
    //
    // material = new THREE.ShaderMaterial({
    //       uniforms: uniforms,
    //       vertexShader: shader.vertexShader,
    //       fragmentShader: shader.fragmentShader,
    //       side: THREE.BackSide,
    //       blending: THREE.AdditiveBlending,
    //       transparent: true
    //     });
    //
    // mesh = new THREE.Mesh(geometry, material);
    // mesh.scale.set( 1.1, 1.1, 1.1 );
    // scene.add(mesh);

    geometry = new THREE.BoxGeometry(0.75, 0.75, 1);
    geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,0,-0.5));

    point = new THREE.Mesh(geometry);

    renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    renderer.setClearColor( 0xffffff, 0 );
    renderer.setSize(w, h);

    renderer.domElement.style.position = 'absolute';

    container.appendChild(renderer.domElement);

    container.addEventListener('mousedown', onMouseDown, false);

    container.addEventListener('mousewheel', onMouseWheel, false);

    document.addEventListener('keydown', onDocumentKeyDown, false);

    // window.addEventListener('resize', onWindowResize, false);

    container.addEventListener('mouseover', function() {
      overRenderer = true;
    }, false);

    container.addEventListener('mouseout', function() {
      overRenderer = false;
    }, false);
  }

  addData = function(data, opts) {
    var lat1, lng1, lat2, lng2, size, color, i, step, colorFnWrapper;

    opts.animated = opts.animated || false;
    this.is_animated = opts.animated;
    opts.format = opts.format || 'magnitude'; // other option is 'legend'
    if (opts.format === 'magnitude') {
      step = 5;
      colorFnWrapper = function(data, i) { return colorFn(data[i+4]); }
    } else if (opts.format === 'legend') {
      step = 6;
      colorFnWrapper = function(data, i) { return colorFn(data[i+5]); }
    } else {
      throw('error: format not supported: '+opts.format);
    }

    var subgeo = new THREE.Geometry();
    for (i = 0; i < data.length; i += step) {
      lat1 = data[i];
      lng1 = data[i + 1];
      lat2 = data[i + 2];
      lng2 = data[i + 3];
      color = colorFnWrapper(data,i);
      size = data[i + 4];
      size = size*200;
      addPath(lat1, lng1, lat2, lng2, size, color, subgeo);
    }
    if (opts.animated) {
      this._baseGeometry.morphTargets.push({'name': opts.name, vertices: subgeo.vertices});
    } else {
      this._baseGeometry = subgeo;
    }

  };
function range(start, stop, step) {
  start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

  var i = -1,
      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
      range = new Array(n);

  while (++i < n) {
    range[i] = start + i * step;
  }

  return range;
}
function vertex(point)
{
    var lambda = point[0] * Math.PI / 180,
    phi = point[1] * Math.PI / 180,
    cosPhi = Math.cos(phi);
    return new THREE.Vector3(
    radius * cosPhi * Math.cos(lambda),
    radius * cosPhi * Math.sin(lambda),
    radius * Math.sin(phi)
    );
}

Array.prototype.pairwise = function (callback) {
    var next, current;

    while (this.length) {
        current = next ? next : this.shift();
        next = this.shift();
        callback(current, next);
    }
};
function wireframe(multilinestring, material){
    var geometry = new THREE.Geometry;
    multilinestring.coordinates.forEach(function(line)
    {
        line.map(vertex).pairwise(function(a, b)
        {
             geometry.vertices.push(a, b);
        });
    });
    return new THREE.LineSegments(geometry, material);
}

function graticuleSize(width,height){
    var epsilon = 1e-6,
    x1 = 180, x0 = -x1, y1 = 80, y0 = -y1, dx = width, dy = height,
    X1 = 180, X0 = -X1, Y1 = 90, Y0 = -Y1, DX = 90, DY = 360,
    x = graticuleX(y0, y1, 2.5), y = graticuleY(x0, x1, 2.5),
    X = graticuleX(Y0, Y1, 2.5), Y = graticuleY(X0, X1, 2.5);

    function graticuleX(y0, y1, dy)
    {
        var y = range(y0, y1 - epsilon, dy).concat(y1);
        return function(x) { return y.map(function(y) { return [x, y]; }); };
    }

    function graticuleY(x0, x1, dx)
    {
        var x = range(x0, x1 - epsilon, dx).concat(x1);
        return function(y)
        {
             return x.map(function(x) { return [x, y]; });
        };
    }

    return {
        type: "MultiLineString",
        coordinates: range(Math.ceil(X0 / DX) * DX, X1, DX).map(X)
        .concat(range(Math.ceil(Y0 / DY) * DY, Y1, DY).map(Y))
        .concat(range(Math.ceil(x0 / dx) * dx, x1, dx).filter(function(x) { return Math.abs(x % DX) > epsilon; }).map(x))
        .concat(range(Math.ceil(y0 / dy) * dy, y1 + epsilon, dy).filter(function(y) { return Math.abs(y % DY) > epsilon; }).map(y))
    };
}
function addGraticule(){
  const material = new THREE.LineBasicMaterial({
    color: 0xacacac,
    linewidth: 1,
    blending: THREE.AdditiveBlending,
		transparent: true
  })
  const graticule = wireframe(graticuleSize(graticicalCellWidth,graticicalCellHeight), material)
  scene.add(graticule);
}

  function createPoints() {
    if (this._baseGeometry !== undefined) {
      if (this.is_animated === false) {
        this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
              color: 0xffffff,
              vertexColors: THREE.FaceColors,
              morphTargets: false
            }));
      } else {
        if (this._baseGeometry.morphTargets.length < 8) {
          console.log('t l',this._baseGeometry.morphTargets.length);
          var padding = 8-this._baseGeometry.morphTargets.length;
          console.log('padding', padding);
          for(var i=0; i<=padding; i++) {
            console.log('padding',i);
            this._baseGeometry.morphTargets.push({'name': 'morphPadding'+i, vertices: this._baseGeometry.vertices});
          }
        }
        this.points = new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial({
              color: 0xffffff,
              vertexColors: THREE.FaceColors,
              morphTargets: true
            }));
      }
      scene.add(this.points);
    }
  }

  function addPath(lat1, lng1, lat2, lng2, size, color, subgeo) {
    // Only show "significant" enough paths
    if (size < 10) return;

    addPoint(lat1, lng1, size, color, subgeo);
    addPoint(lat2, lng2, size, color, subgeo);

    var phi1 = (90 - lat1) * Math.PI / 180;
    var theta1 = (180 - lng1) * Math.PI / 180;

    var x1 = 200 * Math.sin(phi1) * Math.cos(theta1);
    var y1 = 200 * Math.cos(phi1);
    var z1 = 200 * Math.sin(phi1) * Math.sin(theta1);
    var point1 = new THREE.Vector3(x1, y1, z1);

    var phi2 = (90 - lat2) * Math.PI / 180;
    var theta2 = (180 - lng2) * Math.PI / 180;

    var x2 = 200 * Math.sin(phi2) * Math.cos(theta2);
    var y2 = 200 * Math.cos(phi2);
    var z2 = 200 * Math.sin(phi2) * Math.sin(theta2);
    var point2 = new THREE.Vector3(x2, y2, z2);

    var xm = (point1.x + point2.x)/2;
    var ym = (point1.y + point2.y)/2;
    var zm = (point1.z + point2.z)/2 - Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2))/2;
    var mid = new THREE.Vector3(xm, ym, zm);

    spline = new THREE.SplineCurve3([point1, mid, point2]);
    var splinePoints = spline.getPoints(100);
    var geometry = new THREE.Geometry();
    for (var i=0; i<splinePoints.length; i++) {
      geometry.vertices.push(splinePoints[i]);
    }

    var material = new THREE.LineBasicMaterial({color: color});
    var line = new THREE.Line(geometry, material);
    scene.add(line);
  }

  function addPoint(lat, lng, size, color, subgeo) {

    var phi = (90 - lat) * Math.PI / 180;
    var theta = (180 - lng) * Math.PI / 180;

    point.position.x = 200 * Math.sin(phi) * Math.cos(theta);
    point.position.y = 200 * Math.cos(phi);
    point.position.z = 200 * Math.sin(phi) * Math.sin(theta);

    point.lookAt(mesh.position);

    point.scale.z = Math.max( size, 0.1 ); // avoid non-invertible matrix
    point.updateMatrix();

    for (var i = 0; i < point.geometry.faces.length; i++) {

      point.geometry.faces[i].color = color;

    }
    if(point.matrixAutoUpdate){
      point.updateMatrix();
    }
    subgeo.merge(point.geometry, point.matrix);
  }

  function onMouseDown(event) {
    event.preventDefault();

    container.addEventListener('mousemove', onMouseMove, false);
    container.addEventListener('mouseup', onMouseUp, false);
    container.addEventListener('mouseout', onMouseOut, false);

    mouseOnDown.x = - event.clientX;
    mouseOnDown.y = event.clientY;

    targetOnDown.x = target.x;
    targetOnDown.y = target.y;

    container.style.cursor = 'move';
  }

  function onMouseMove(event) {
    mouse.x = - event.clientX;
    mouse.y = event.clientY;

    var zoomDamp = distance/1000;

    target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
    target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

    target.y = target.y > PI_HALF ? PI_HALF : target.y;
    target.y = target.y < - PI_HALF ? - PI_HALF : target.y;
  }

  function onMouseUp(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
    container.style.cursor = 'auto';
  }

  function onMouseOut(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
  }

  function onMouseWheel(event) {
    event.preventDefault();
    if (overRenderer) {
      zoom(event.wheelDeltaY * 0.3);
    }
    return false;
  }

  function onDocumentKeyDown(event) {
    switch (event.keyCode) {
      case 38:
        zoom(100);
        event.preventDefault();
        break;
      case 40:
        zoom(-100);
        event.preventDefault();
        break;
    }
  }

  function onWindowResize( event ) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  function zoom(delta) {
    distanceTarget -= delta;
    distanceTarget = distanceTarget > 1000 ? 1000 : distanceTarget;
    distanceTarget = distanceTarget < 350 ? 350 : distanceTarget;
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
  }

  function render() {
    zoom(curZoomSpeed);

    rotation.x += (target.x - rotation.x) * 0.1;
    rotation.y += (target.y - rotation.y) * 0.1;
    distance += (distanceTarget - distance) * 0.3;

    camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
    camera.position.y = distance * Math.sin(rotation.y);
    camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);

    camera.lookAt(mesh.position);

    renderer.render(scene, camera);
  }

  init();
  this.animate = animate;


  this.__defineGetter__('time', function() {
    return this._time || 0;
  });

  this.__defineSetter__('time', function(t) {
    var validMorphs = [];
    var morphDict = this.points.morphTargetDictionary;
    for(var k in morphDict) {
      if(k.indexOf('morphPadding') < 0) {
        validMorphs.push(morphDict[k]);
      }
    }
    validMorphs.sort();
    var l = validMorphs.length-1;
    var scaledt = t*l+1;
    var index = Math.floor(scaledt);
    for (i=0;i<validMorphs.length;i++) {
      this.points.morphTargetInfluences[validMorphs[i]] = 0;
    }
    var lastIndex = index - 1;
    var leftover = scaledt - index;
    if (lastIndex >= 0) {
      this.points.morphTargetInfluences[lastIndex] = 1 - leftover;
    }
    this.points.morphTargetInfluences[index] = leftover;
    this._time = t;
  });

  this.addData = addData;
  this.createPoints = createPoints;
  this.addGraticule = addGraticule;
  this.renderer = renderer;
  this.scene = scene;

  return this;

};