/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011
* The Royal Institution for the Advancement of Learning
* McGill University
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
* Author: Tarek Sherif <tsherif@gmail.com> (http://tareksherif.ca/)
*/
 
BrainBrowser.SurfaceViewer.modules.rendering = function(viewer) {
  "use strict";
  
  var renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true });
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(30, viewer.dom_element.offsetWidth / viewer.dom_element.offsetHeight, 1, 10000);
  var light = new THREE.PointLight(0xFFFFFF);
  var current_frame;
  var last_frame;
  var effect = renderer;
  var effects = {};
  var canvas = renderer.domElement;

  viewer.model = new THREE.Object3D();
  
  scene.add(viewer.model);
  
  /**
  * @doc function
  * @name viewer.rendering:render
  * @description
  * Render the scene.
  * ```js
  * viewer.render();
  * ```
  */
  viewer.render = function() {
    var dom_element = viewer.dom_element;
    renderer.setClearColor(0x000000);
    renderer.setSize(dom_element.offsetWidth, dom_element.offsetHeight);
    dom_element.appendChild(renderer.domElement);
    
    camera.position.z = 500;
    
    light.position.set(0, 0, 500);
    scene.add(light);
    
    viewer.autorotate = {};
    
    window.onresize = function() {
      effect.setSize(dom_element.offsetWidth, dom_element.offsetHeight);
      camera.aspect = dom_element.offsetWidth / dom_element.offsetHeight;
      camera.updateProjectionMatrix();
    };
    
    window.onresize();
    
    renderFrame();
  };

  /**
  * @doc function
  * @name viewer.rendering:canvasDataURL
  * @returns {string} The data URL.
  * @description
  * Returns the Data URL of the canvas the viewer is using
  * so it can be used to create an image.
  * ```js
  * viewer.canvasDataURL();
  * ```
  */
  viewer.canvasDataURL = function() {
    return renderer.domElement.toDataURL();
  };
  
  /**
  * @doc function
  * @name viewer.rendering:addEffect
  * @param {string} effect_name The name of the effect as defined in three.js.
  * @description
  * Add a three.js postprocessing effect to the viewer.
  * ```js
  * viewer.addEffect("AnaglyphEffect");
  * ```
  */
  viewer.addEffect = function(effect_name) {
    var effect;
    if (BrainBrowser.utils.isFunction(THREE[effect_name])) {
      effect = new THREE[effect_name](renderer);
      effect.setSize(viewer.dom_element.offsetWidth, viewer.dom_element.offsetHeight);
      effects[effect_name] = effect;
    }
  };

  /**
  * @doc function
  * @name viewer.rendering:setEffect
  * @param {string} effect_name The name of the effect as defined in three.js.
  * @description
  * Activate a previously added postprocessing effect.
  * ```js
  * viewer.setEffect("AnaglyphEffect");
  * ```
  */
  viewer.setEffect = function(effect_name) {
    effect = effects[effect_name] ? effects[effect_name] : renderer;
  };
  
  /**
  * @doc function
  * @name viewer.rendering:setCameraPosition
  * @param {number} x The x coordinate of the camera.
  * @param {number} y The y coordinate of the camera.
  * @param {number} z The z coordinate of the camera.
  * @description
  * Set the camera position.
  * ```js
  * viewer.setCameraPosition(10, 25, 12);
  * ```
  */
  viewer.setCameraPosition = function(x, y, z) {
    camera.position.set(x, y, z);
    light.position.set(x, y, z);
  };
  
  /**
  * @doc function
  * @name viewer.rendering:resetView
  * @description
  * Resets the view of the scene.
  * ```js
  * viewer.resetView();
  * ```
  */
  viewer.resetView = function() {
    var model = viewer.model;
    var child, wireframe;
    var i, count;
    var inv = new THREE.Matrix4();
    inv.getInverse(model.matrix);
  
    model.applyMatrix(inv);
    camera.position.set(0, 0, 500);
    light.position.set(0, 0, 500);
    
    for (i = 0, count = viewer.model.children.length; i < count; i++) {
      child = model.children[i];
      if (child.centroid) {
        child.position.set(child.centroid.x, child.centroid.y, child.centroid.z);
      } else {
        child.position.set(0, 0, 0);
      }
      child.rotation.set(0, 0, 0);

      wireframe = child.getObjectByName("__wireframe__");
    }
  };

  /**
  * @doc function
  * @name viewer.rendering:zoom
  * @param {number} zoom The zoom level (default: 1.0).
  * @description
  * Zoom the view in or out.
  * ```js
  * viewer.zoom(1.2);
  * ```
  */
  viewer.zoom = function(zoom) {
    var position = camera.position;
    var new_z = position.z / zoom;
    if (new_z > camera.near && new_z < 0.9 * camera.far) {
      position.z = new_z;
      light.position.z = new_z;
    }
  };
  
  /**
  * @doc function
  * @name viewer.rendering:setClearColor
  * @param {number} color A hexadecimal number representing the RGB color to use.
  * @description
  * Updates the clear color of the viewer.
  * ```js
  * viewer.setClearColor(0xFF0000);
  * ```
  */
  viewer.setClearColor = function(color)  {
    renderer.setClearColor(color, 1.0);
  };
  
  /**
  * @doc function
  * @name viewer.rendering:pick
  * @param {number} x The x coordinate on the canvas.
  * @param {number} y The y coordinate on the canvas.
  * @returns {object} If an intersection is detected, returns an object with the following information:
  *
  * * **object** The THREE.Object3D object with which the the click intersected.
  * * **point** A THREE.Vector3 object representing the point in 3D space at which the intersection occured.
  * * **index** The index of the intersection point in the list of vertices.
  *
  * Otherwise returns **null**.
  *
  * @description
  * Given an x and y coordinate on the viewer canvas, returns information about the
  * the point of intersection with a displayed object.
  * ```js
  * viewer.pick(125, 250);
  * ```
  */
  viewer.pick = function(x, y) {
    // Convert to normalized coordinates.
    x = (x / viewer.dom_element.offsetWidth) * 2 - 1;
    y = (-y / viewer.dom_element.offsetHeight) * 2 + 1;

    var model = viewer.model;
    var projector = new THREE.Projector();
    var raycaster = new THREE.Raycaster();
    var vector = new THREE.Vector3(x, y, camera.near);
    var intersects, intersection, vertex_data;
    var intersect_object, intersect_point, intersect_indices;
    var intersect_vertex_index;
    var min_distance;
    var original_vertices, original_indices;
    var index, distance;
    var i, count;
    var centroid, cx, cy, cz;

    // Because we're comparing against
    // the vertices in their original positions,
    // we have move everything to place the model at its
    // original position.
    var inv_matrix = new THREE.Matrix4();

    projector.unprojectVector(vector, camera);
    raycaster.set(camera.position, vector.sub(camera.position).normalize());
    intersects = raycaster.intersectObject(model, true);

    if (intersects.length > 0) {
      
      // Find closest point to intersection.
      intersection = intersects[0];
      intersect_object = intersection.object;
      intersect_indices = intersection.indices;

      // Objects have their origins centered 
      // to help with transparency, so to check
      // check against original vertices we have
      // move them back. 
      centroid = intersect_object.centroid;
      cx = centroid.x;
      cy = centroid.y;
      cz = centroid.z;

      inv_matrix.getInverse(intersect_object.matrixWorld);
      intersect_point = intersection.point.applyMatrix4(inv_matrix);

      original_vertices = intersect_object.geometry.original_data.vertices;
      original_indices = intersect_object.geometry.original_data.indices;

      // Have to get the vertex pointed to by the original index because of
      // the de-indexing (see workers/deindex.worker.js)
      intersect_vertex_index = index = original_indices[intersect_indices[0]];
      min_distance = intersect_point.distanceTo(
        new THREE.Vector3(
          original_vertices[index*3] - cx,
          original_vertices[index*3+1] - cy,
          original_vertices[index*3+2] - cz
        )
      );

      for (i = 1, count = intersect_indices.length; i < count; i++) {
        index = original_indices[intersect_indices[i]];
        distance = intersect_point.distanceTo(
          new THREE.Vector3(
            original_vertices[index*3] - cx,
            original_vertices[index*3+1] - cy,
            original_vertices[index*3+2] - cz
          )
        );

        if (distance < min_distance) {
          intersect_vertex_index = index;
          min_distance = distance;
        }

      }

      vertex_data = {
        index: intersect_vertex_index,
        point: new THREE.Vector3(intersection.point.x, intersection.point.y, intersection.point.z),
        object: intersection.object
      };

    } else {
      vertex_data = null;
    }

    return vertex_data;
  };
  
  ////////////////////////////////////
  // PRIVATE FUNCTIONS
  ////////////////////////////////////

  // Render a single frame on the viewer.
  function renderFrame(timestamp) {
    var model = viewer.model;
    var delta;
    var rotation;
    
    window.requestAnimationFrame(renderFrame);
    
    last_frame = current_frame || timestamp;
    current_frame = timestamp;
    
    delta = current_frame - last_frame;
    rotation = delta * 0.00015;

    if (viewer.autorotate.x) {
      model.rotation.x += rotation;
    }
    if (viewer.autorotate.y) {
      model.rotation.y += rotation;
    }
    if (viewer.autorotate.z) {
      model.rotation.z += rotation;
    }

    effect.render(scene, camera);
  }

  ////////////////////////////////
  // CONTROLS
  ////////////////////////////////

  (function() {
    var model = viewer.model;
    var movement = "rotate";
    var last_x = null;
    var last_y = null;
    var last_touch_distance = null;

    function getMousePosition(e) {
      var x, y;
      var offset = BrainBrowser.utils.getOffset(canvas);


      if (e.pageX !== undefined) {
        x = e.pageX;
        y = e.pageY;
      } else {
        x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
      }

      x -= offset.left;
      y -= offset.top;

      return {
        x: x,
        y: y
      };
    }

    function drag(e, multiplier) {
      multiplier = multiplier || 1.0;
      var inverse = new THREE.Matrix4();
      var position = getMousePosition(e);
      var x = position.x;
      var y = position.y;
      var dx, dy;


      if (last_x !== null) {
        dx = x - last_x;
        dy = y - last_y;

        if (movement === "rotate") {

          // Want to always be rotating around
          // world axes.
          inverse.getInverse(model.matrix);
          var axis = new THREE.Vector3(1, 0, 0).applyMatrix4(inverse).normalize();
          model.rotateOnAxis(axis, dy / 150);

          inverse.getInverse(model.matrix);
          axis = new THREE.Vector3(0, 1, 0).applyMatrix4(inverse).normalize();
          model.rotateOnAxis(axis, dx / 150);
        } else {
          camera.position.x -= dx * multiplier;
          light.position.x -= dx * multiplier;
          camera.position.y += dy * multiplier;
          light.position.y += dy * multiplier;
        }
      }

      last_x = x;
      last_y = y;

    }

    function touchZoom(e) {
      var pos1 = getMousePosition(e.touches[0]);
      var pos2 = getMousePosition(e.touches[1]);
      var dx = pos1.x - pos2.x;
      var dy = pos1.y - pos2.y;

      var distance = Math.sqrt(dx * dx + dy * dy);
      var delta;

      if (last_touch_distance !== null) {
        delta = distance - last_touch_distance;

        viewer.zoom(1.0 + 0.01 * delta);
      }

      last_touch_distance = distance;
    }

    function mouseDrag(e) {
      e.preventDefault();
      e.stopPropagation();
      drag(e, 0.25);
    }

    function touchDrag(e) {
      e.preventDefault();
      e.stopPropagation();
      if (movement === "zoom") {
        touchZoom(e);
      } else {
        drag(e.touches[0], 1.0);
      }
    }

    function mouseDragEnd() {
      document.removeEventListener("mousemove", mouseDrag, false);
      document.removeEventListener("mouseup", mouseDragEnd, false);
      last_x = null;
      last_y = null;
    }

    function touchDragEnd() {
      document.removeEventListener("touchmove", touchDrag, false);
      document.removeEventListener("touchend", touchDragEnd, false);
      last_x = null;
      last_y = null;
      last_touch_distance = null;
    }

    function wheelHandler(e) {
      var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

      e.preventDefault();
      e.stopPropagation();

      viewer.zoom(1.0 + 0.05 * delta);
    }

    canvas.addEventListener("mousedown", function(e) {
      document.addEventListener("mousemove", mouseDrag, false);
      document.addEventListener("mouseup", mouseDragEnd, false);

      movement = e.which === 1 ? "rotate" : "translate" ;
    }, false);

    canvas.addEventListener("touchstart", function(e) {
      document.addEventListener("touchmove", touchDrag, false);
      document.addEventListener("touchend", touchDragEnd, false);

      movement = e.touches.length === 1 ? "rotate" :
                 e.touches.length === 2 ? "zoom" :
                 "translate";
    }, false);

    canvas.addEventListener("mousewheel", wheelHandler, false);
    canvas.addEventListener("DOMMouseScroll", wheelHandler, false); // Dammit Firefox
    
    canvas.addEventListener( 'contextmenu', function(e) {
      e.preventDefault();
      e.stopPropagation();
    }, false );

  })();

};
 
 
 
