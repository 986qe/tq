// 地图配置
const TILE_SIZE = 40;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 18;

// 瓦片类型
const TILE_EMPTY = 0;
const TILE_WALL = 1;
const TILE_FLOOR = 2;
const TILE_DOOR = 3;

// 地图数据 (25x18)
// 0=空地, 1=墙壁, 2=地板, 3=门
const mapData = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,2,1,1,1,2,1,1,2,1,2,1,1,2,1,1,2,1],
  [1,2,1,2,2,1,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,2,2,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1,1,1,1,2,2,1],
  [1,2,1,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,2,1],
  [1,2,1,1,1,2,1,1,2,1,2,1,1,3,1,1,2,1,1,1,2,1,2,2,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,3,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,2,1,2,2,1,2,1,1,1,1,1,2,1,1,2,1,1,2,2,1],
  [1,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,3,1,2,1,2,1,1,1,2,1,1,1,1,2,1,1,1,1,2,1,1,1],
  [1,2,2,3,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,2,1,1,1,1,2,2,1,2,1,2,2,1,1,2,1,2,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,1,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,2,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// 任务点位置
const taskLocations = [
  { x: 3, y: 2, name: '修复导航系统' },
  { x: 21, y: 2, name: '重启反应堆' },
  { x: 3, y: 15, name: '校准通讯天线' },
  { x: 21, y: 15, name: '维护生命维持系统' },
  { x: 12, y: 8, name: '修复氧气循环' },
  { x: 12, y: 1, name: '更新星图数据' },
  { x: 12, y: 16, name: '清理过滤系统' },
  { x: 1, y: 8, name: '检查电力系统' },
  { x: 23, y: 8, name: '维护引擎核心' },
  { x: 12, y: 12, name: '重置安全协议' }
];

// 玩家出生点
const spawnPoints = [
  { x: 5, y: 4 },
  { x: 19, y: 4 },
  { x: 5, y: 13 },
  { x: 19, y: 13 },
  { x: 12, y: 8 },
  { x: 12, y: 3 }
];

// 碰撞检测辅助函数
function isWall(tileX, tileY) {
  if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) {
    return true;
  }
  return mapData[tileY][tileX] === TILE_WALL;
}

function isWalkable(pixelX, pixelY, playerRadius = 12) {
  const left = Math.floor((pixelX - playerRadius) / TILE_SIZE);
  const right = Math.floor((pixelX + playerRadius) / TILE_SIZE);
  const top = Math.floor((pixelY - playerRadius) / TILE_SIZE);
  const bottom = Math.floor((pixelY + playerRadius) / TILE_SIZE);

  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      if (isWall(x, y)) return false;
    }
  }
  return true;
}

function getTileAt(pixelX, pixelY) {
  const tileX = Math.floor(pixelX / TILE_SIZE);
  const tileY = Math.floor(pixelY / TILE_SIZE);
  if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) {
    return TILE_WALL;
  }
  return mapData[tileY][tileX];
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
