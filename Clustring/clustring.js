var refreshBtn = document.getElementById("refresh-btn");
  refreshBtn.addEventListener("click", function() {
    location.reload();
  });

// Get canvas element and context
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

// Set up initial variables
var points = [];
var clusters = [];

// Handle mouse clicks on canvas to add points
canvas.addEventListener("click", function(event) {
  var rect = canvas.getBoundingClientRect();
  var x = event.clientX - rect.left;
  var y = event.clientY - rect.top;
  points.push({ x: x, y: y });
  drawPoints();
});

// Draw points on canvas
function drawPoints() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  for (var i = 0; i < points.length; i++) {
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, 15, 0, 2*Math.PI);
    ctx.fill();
  }
}


//هذه الدالة تقوم بتنفيذ خوارزمية k-means clustering. تهيئة النقاط البادئة وتحديد مراكز الكتل الأولية ثم تقوم بتكرار عملية تجميع النقاط حتى تتم الاستقرار. تقوم أيضًا بتحديث مراكز الكتل بناءً على متوسط النقاط في كل كتلة.

// Define k-means clustering function
function kMeans(numClusters, points) {
  // Initialize centroids from random points
  var centroids = points.slice(0, numClusters);

  var prevCentroids;
  
  while (!prevCentroids || !centroidsEqual(prevCentroids, centroids)) {
    prevCentroids = centroids.slice();

    // Assign each point to the nearest centroid
    var clusters = [];
    for (var i = 0; i < numClusters; i++) {
      clusters.push([]);
    }
    for (var i = 0; i < points.length; i++) {
      var minDist = Infinity;
      var minIndex = -1;
      for (var j = 0; j < centroids.length; j++) {
        var dist = distance(points[i], centroids[j]);
        if (dist < minDist) {
          minDist = dist;
          minIndex = j;
        }
      }
      clusters[minIndex].push(points[i]);
    }

    // Update centroids based on cluster means
    for (var i = 0; i < numClusters; i++) {
      if (clusters[i].length > 0) {
        var sumX = 0;
        var sumY = 0;
        for (var j = 0; j < clusters[i].length; j++) {
          sumX += clusters[i][j].x;
          sumY += clusters[i][j].y;
        }
        centroids[i].x = sumX / clusters[i].length;
        centroids[i].y = sumY / clusters[i].length;
      }
    }
  }
  
  return clusters;
}

function centroidsEqual(centroids1, centroids2) {
  for (var i = 0; i < centroids1.length; i++) {
    if (centroids1[i].x !== centroids2[i].x || centroids1[i].y !== centroids2[i].y) {
      return false;
    }
  }
  return true;
}



//هذه الدالة تنفذ خوارزمية التجميع الهرمي (Hierarchical clustering). تهيئة النقاط كتجمعات فردية ثم تقوم بدمج الكتل المجاورة حتى يتم الوصول إلى عدد معين من الكتل.

// Define hierarchical clustering function
function hierarchical(numClusters, points) {
  // Initialize clusters with each point as its own cluster
  var clusters = [];
  for (var i = 0; i < points.length; i++) {
    clusters.push([points[i]]);
  }
  
  // Merge clusters until desired number of clusters is reached
  while (clusters.length > numClusters) {
    var minDist = Infinity;
    var minIndex1 = -1;
    var minIndex2 = -1;
    for (var i = 0; i < clusters.length; i++) {
      for (var j = i+1; j < clusters.length; j++) {
        var dist = clusterDistance(clusters[i], clusters[j]);
        if (dist < minDist) {
          minDist = dist;
          minIndex1 = i;
          minIndex2 = j;
        }
      }
    }
    clusters[minIndex1] = clusters[minIndex1].concat(clusters[minIndex2]);
    clusters.splice(minIndex2, 1);
  }
  
  return clusters;
}



//هذه الدالة تقوم بتنفيذ خوارزمية DBSCAN clustering. تقوم بتحديد النقاط الأساسية والنقاط الضوئية في المجموعة ثم تقوم بتجميع النقاط القريبة معًا بناءً على قيمة eps وعدد النقاط الدنيا minPts.

// Define DBSCAN clustering function
function dbscan(numClusters, points) {
  // Define parameters
  var eps = 20;
  var minPts = 5;
  
  // Initialize clusters and visited status for points
  var clusters = [];
  var visited = new Array(points.length).fill(false);
  
  // Iterate over each point and expand clusters
  for (var i = 0; i < points.length; i++) {
    if (visited[i]) continue;
    visited[i] = true;
    
    // Find nearby points
    var neighbors = [];
    for (var j = 0; j < points.length; j++) {
      if (i === j) continue;
      var dist = distance(points[i], points[j]);
      if (dist < eps) neighbors.push(j);
    }
    
    // If there are fewer than minPts nearby points, mark as noise
    if (neighbors.length < minPts) {
      clusters.push([points[i]]);
      continue;
    }
    
    // Expand cluster to nearby points
    var cluster = [points[i]];
    for (var j = 0; j < neighbors.length; j++) {
      if (visited[neighbors[j]]) continue;
      visited[neighbors[j]] = true;
      
      var neighbors2 = [];
      for (var k = 0; k < points.length; k++) {
        if (neighbors[j] === k) continue;
        var dist = distance(points[neighbors[j]], points[k]);
        if (dist < eps) neighbors2.push(k);
      }
      
      if (neighbors2.length >= minPts) {
        neighbors = neighbors.concat(neighbors2);
      }
      
      cluster.push(points[neighbors[j]]);
    }
    
    clusters.push(cluster);
  }
  
  return clusters;
}


//هذه الدالة تحسب المسافة بين نقطتين في الفضاء الثنائي.


// Define distance function
function distance(p1, p2) {
  var dx = p2.x - p1.x;
  var dy = p2.y - p1.y;
  return Math.sqrt(dx*dx + dy*dy);
}


//هذه الدالة تحسب المسافة بين كتلتين من النقاط.

// Define cluster distance function
function clusterDistance(c1, c2) {
  var minDist = Infinity;
  for (var i = 0; i < c1.length; i++) {
    for (var j = 0; j < c2.length; j++) {
      var dist = distance(c1[i], c2[j]);
      if (dist < minDist) {
        minDist = dist;
      }
    }
  }
  return minDist;
}

// Handle generate button click
var generateBtn = document.getElementById("generateBtn");
generateBtn.addEventListener("click", function() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Get user input
  var numClusters = parseInt(document.getElementById("numClusters").value);
  var algorithm = document.getElementById("algorithm").value;
  
  // Cluster points using chosen algorithm
  var clusters;
  switch (algorithm) {
    case "kMeans":
      clusters = kMeans(numClusters, points);
      break;
    case "hierarchical":
      clusters = hierarchical(numClusters, points);
      break;
    case "dbscan":
      clusters = dbscan(numClusters, points);
      break;
  }
  
  // Draw clusters on canvas
  var colors = ["red", "green", "blue", "orange", "purple", "pink", "brown", "gray"];

  for (var i = 0; i < clusters.length; i++) {
    var color = colors[i % colors.length];
    ctx.fillStyle = color;
    for (var j = 0; j < clusters[i].length; j++) {
        ctx.beginPath();
        ctx.arc(clusters[i][j].x, clusters[i][j].y, 15, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();
    }
  }


});

// Draw initial set of points on canvas
drawPoints();
