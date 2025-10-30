"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGameMap = generateGameMap;
const d3_delaunay_1 = require("d3-delaunay");
const d3_polygon_1 = require("d3-polygon");
const RESOURCE_TYPES = ['food', 'water', 'metal', 'wood', 'oil', 'electricity', 'nuclear', 'money'];
function generateSeaPolygon(width, height) {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;
    const points = [];
    const numPoints = 10;
    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        const r = radius + Math.random() * 60 - 30;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        points.push([x, y]);
    }
    return points;
}
function isInsideSea(sea, x, y) {
    return (0, d3_polygon_1.polygonContains)(sea, [x, y]);
}
function generateGameMap(players = 5, aiPlayers = 5, width = 1600, height = 900) {
    const seaPolygon = generateSeaPolygon(width, height);
    const totalPlayerProvinces = players * 10;
    const totalAIProvinces = aiPlayers * 5;
    const totalProvinces = totalPlayerProvinces + totalAIProvinces;
    const points = [];
    for (let i = 0; i < totalProvinces; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        points.push([x, y]);
    }
    const voronoi = d3_delaunay_1.Delaunay.from(points).voronoi([0, 0, width, height]);
    const tiles = [];
    points.forEach((pt, i) => {
        const polygon = voronoi.cellPolygon(i);
        const cx = polygon.reduce((s, c) => s + c[0], 0) / polygon.length;
        const cy = polygon.reduce((s, c) => s + c[1], 0) / polygon.length;
        const water = isInsideSea(seaPolygon, cx, cy);
        const resourceType = water
            ? 'water'
            : RESOURCE_TYPES[Math.floor(Math.random() * (RESOURCE_TYPES.length - 1))];
        tiles.push({
            id: `tile_${i + 1}`,
            type: water ? 'water' : 'land',
            resourceType,
            coords: polygon,
            owner: null,
        });
    });
    return { width, height, seaPolygon, tiles };
}
