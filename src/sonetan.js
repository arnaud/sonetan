/**
 * @name SONETAN
 * @namespace SONETAN
 * @version 0.0.1
 * @author Arnaud Leymet
 * @copyright SonetIN SAS 2014
 * @license MIT
 * @see https://github.com/sonetin/sonetan/blob/master/LICENSE.md
 */

(function () {

  "use strict";

  var root = this;

  /** @lends SONETAN */
  var SNA = function (vertices, edges, settings) {
    this.vertices = vertices;
    this.edges = edges;
    settings = settings || {};
    if (settings.killOrphans) this.removeOrphanVertices();

    return this;
  };

  /**
   * Verrrsion
   */
  SNA.version = '0.0.1';

  SNA.prototype = {
    constructor : SNA,

    /**
     * The total number of vertices
     * @namespace Metrics
     */
    order: function () {
      return this.vertices.length;
    },

    /**
     * The total number of edges
     * @name size
     * @namespace Metrics
     */
    size: function () {
      return this.edges.length;
    },

    /**
     * weighedSize
     * @namespace Metrics
     */
    weighedSize: function () {
      return this.arraySum(this.arrayMap(this.edges, 'weight'));
    },

    /**
     * The total number of edges divided by the maximum possible edges
     * @namespace Metrics
     */
    density: function () {
      return this.size() / (this.order() * (this.order() - 1));
    },

    /**
     * The largest of all the shortest paths from any vertice to any other vertice
     * @namespace Metrics
     */
    diameter: function () {
      // TODO
    },

    /**
     * Average clustering coefficient for the graph
     * @namespace Segmentation
     */
    averageClusteringCoefficient: function () {
      // TODO
    },

    /**
     * Remove orphan vertices
     */
    removeOrphanVertices: function () {
      var linkedVertices = [];
      for (var e in this.edges) {
        var edge = this.edges[e];
        linkedVertices.push(edge.source);
        linkedVertices.push(edge.target);
      }
      this.vertices = this.vertices.filter(function (vertice) {
        return linkedVertices.indexOf(vertice.id) != -1;
      });
    },

    /**
     * Compute the adjacency matrix, using weighted as values instead of 1s
     */
    adjacencyMatrix: function () {
      if(this.$adjacencyMatrix) return this.$adjacencyMatrix;

      var length = this.order();
      var matrix = new Array(length);
      var vertices = this.vertices;

      // Prefill the matrix with 0
      vertices.forEach(function (col) {
        matrix[col.id] = new Array(length);
        vertices.forEach(function (row) {
          matrix[col.id][row.id] = 0;
        });
      });

      // Fill the matrix with 1s if there is at least one connection
      this.edges.forEach(function (edge) {
        matrix[edge.source][edge.target] = edge.weight;
      }, this);

      // keep it in memory for a probable later use
      this.$adjacencyMatrix = matrix;

      return matrix;
    },

    /**
     * Display a matrix in HTML
     */
    displayMatrix: function (matrix) {
      var string = "";
      string += "&boxdr;";
      for (var row in matrix) string += "  ";
      string += " &boxdl;\n";
      for (var row in matrix) {
        string += "|";
        for (var col in matrix[row]) {
          var value = matrix[row][col];
          if (row == col) {
            string += " <span style='color: #ccc'>" + value + "</span>";
          } else if (value == 0) {
            string += " 0";
          } else {
            string += " <b>" + value + "</b>";
          }
        }
        string += " |\n";
      }
      string += "&boxur; ";
      for (var row in matrix) string += "  ";
      string += "&boxul;";
      return string;
    },

    /**
     * Find a vertice by its id
     * @private
     */
    findVerticeById: function (verticeId) {
      for (var i in this.vertices) {
        if(this.vertices[i].id == verticeId) return this.vertices[i];
      }
    },

    /**
     * Fetch a vertice neighborhood
     */
    verticeWithNeighborhood: function (verticeId) {
      // Identify the right vertice
      var vertice = this.findVerticeById(verticeId);

      // Attach all of its neighbors
      vertice.neighborsIn = [];
      vertice.neighborsOut = [];
      vertice.neighborsAll = [];
      this.edges.forEach(function (e) {
        if(e.target == verticeId) vertice.neighborsIn.push(e.source);
        if(e.source == verticeId) vertice.neighborsOut.push(e.target);
        vertice.neighborsAll.push(e.source);
        vertice.neighborsAll.push(e.target);
      });

      return vertice;
    },

    /**
     * Fetch a vertice neighborhood directed to it
     * @namespace Distribution
     * @private
     */
    verticeInDegree: function (verticeId) {
      return this.verticeWithNeighborhood(verticeId).neighborsIn;
    },

    /**
     * Fetch a vertice neighborhood directed to others
     * @namespace Distribution
     * @private
     */
    verticeOutDegree: function (verticeId) {
      return this.verticeWithNeighborhood(verticeId).neighborsOut;
    },

    /**
     * Fetch a vertice neighborhood
     * @namespace Distribution
     * @private
     */
    verticeAllDegree: function (verticeId) {
      return this.verticeWithNeighborhood(verticeId).neighborsAll;
    },

    /**
     * Degree centrality of a vertice
     * @namespace Distribution
     * @private
     */
    verticeDegreeCentrality: function (verticeId) {
      return this.verticeAllDegree(verticeId).length;
    },

    /**
     * Degree centrality of the whole network
     * @namespace Distribution
     */
    degreeCentrality: function () {
      var degrees = new Array(this.order());
      var highestDegree = -1;
      var verticeWithTheHighestDegree;
      this.vertices.forEach(function (vertice, i) {
        var degree = this.verticeDegreeCentrality(vertice.id);
        if (degree > highestDegree) {
          verticeWithTheHighestDegree = vertice;
          highestDegree = degree;
        }
        // RENDU LA
        if (!degrees[degree]) {
          degrees[degree] = [vertice.id];
        } else {
          degrees[degree].push( vertice.id );
        }
      }, this);

      var result = [];
      for (var degree in degrees) {
        var verticeIds = degrees[degree];
        verticeIds.forEach(function (verticeId) {
          /*result.unshift({
            key : this.findVerticeById(verticeId),
            value: parseInt(degree)
          });*/
          result.unshift(parseInt(degree));
        }, this);
      }
      return this.arraySum(result) / result[0];
      /*
      var degrees = degrees.map(function (degree) {
        return highestDegree - degree;
      });
      var max = Math.max.apply(Math, degrees);
      return this.arraySum(degrees) / max;*/
    },

    /**
     * Sum an array
     * @namespace Misc
     */
    arraySum: function (array) {
      return array.reduce(function (a, b) { return a + b });
    },

    /**
     * Map through an array using an attribute
     * @namespace Misc
     */
    arrayMap: function (array, attribute) {
      return array.map(function (item) { return item[attribute] })
    }
  };

  root.SNA = SNA;

}).call(this);
