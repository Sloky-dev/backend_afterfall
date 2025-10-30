import { Delaunay } from 'd3-delaunay';
import { polygonContains } from 'd3-polygon';

export type ResourceType =
  | 'money'
  | 'food'
  | 'water'
  | 'metal'
  | 'wood'
  | 'oil'
  | 'electricity'
  | 'nuclear';

export type TileType = 'land' | 'water' | 'mountain' | 'forest';

export interface ServerTile {
  id: string;
  type: TileType;
  resourceType: ResourceType;
  coords: number[][];
  owner: string | null;
  neighbors: string[];
}

export interface GameMap {
  width: number;
  height: number;
  seaPolygon: [number, number][];
  tiles: ServerTile[];
}

const RESOURCE_TYPES: ResourceType[] = ['food','water','metal','wood','oil','electricity','nuclear','money'];

function generateSeaPolygon(width: number, height: number): [number, number][] {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 4;
  const points: [number, number][] = [];
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

function isInsideSea(sea: [number, number][], x: number, y: number) {
  return polygonContains(sea, [x, y]);
}

export function generateGameMap(players = 5, aiPlayers = 5, width = 1600, height = 900): GameMap {
  const seaPolygon = generateSeaPolygon(width, height);

  const totalPlayerProvinces = players * 10;
  const totalAIProvinces = aiPlayers * 5;
  const totalProvinces = totalPlayerProvinces + totalAIProvinces;

  const points: [number, number][] = [];
  for (let i = 0; i < totalProvinces; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    points.push([x, y]);
  }

  const delaunay = Delaunay.from(points);
  const voronoi = delaunay.voronoi([0, 0, width, height]);

  const tiles: ServerTile[] = [];
  points.forEach((pt, i) => {
    const polygon = voronoi.cellPolygon(i) as [number, number][];
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
      neighbors: [],
    });
  });

  // Populate neighbors using Delaunay graph
  tiles.forEach((_t, i) => {
    const neigh = Array.from<number>(delaunay.neighbors(i));
    tiles[i].neighbors = neigh.map((j: number) => `tile_${j + 1}`);
  });

  return { width, height, seaPolygon, tiles };
}
