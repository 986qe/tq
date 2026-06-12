export const TILE_SIZE = 40
export const MAP_WIDTH = 25
export const MAP_HEIGHT = 18
export const PLAYER_RADIUS = 12
export const PLAYER_SPEED = 2.5
export const KILL_COOLDOWN = 15
export const MEETING_DURATION = 30
export const GAME_DURATION = 300
export const TOTAL_TASKS = 10
export const TASK_DURATION_MIN = 3
export const TASK_DURATION_MAX = 5
export const KILL_DISTANCE = 50
export const TASK_DISTANCE = 40
export const BODY_DISTANCE = 50
export const IMPOSTOR_COUNT = 2
export const PLAYER_COUNT = 6

export const TILE_EMPTY = 0
export const TILE_WALL = 1
export const TILE_FLOOR = 2
export const TILE_DOOR = 3

export const PLAYER_COLORS = [
  { name: '红色', hex: '#ff1744', dark: '#b71c1c' },
  { name: '蓝色', hex: '#2979ff', dark: '#0d47a1' },
  { name: '绿色', hex: '#00e676', dark: '#1b5e20' },
  { name: '黄色', hex: '#ffea00', dark: '#f57f17' },
  { name: '紫色', hex: '#d500f9', dark: '#6a1b9a' },
  { name: '白色', hex: '#ffffff', dark: '#b0bec5' },
]

export const SPAWN_POINTS = [
  { x: 5, y: 4 },
  { x: 19, y: 4 },
  { x: 5, y: 13 },
  { x: 19, y: 13 },
  { x: 12, y: 8 },
  { x: 12, y: 3 },
]

export const TASK_LOCATIONS = [
  { x: 3, y: 2, name: '修复导航系统' },
  { x: 21, y: 2, name: '重启反应堆' },
  { x: 3, y: 15, name: '校准通讯天线' },
  { x: 21, y: 15, name: '维护生命维持系统' },
  { x: 12, y: 8, name: '修复氧气循环' },
  { x: 12, y: 1, name: '更新星图数据' },
  { x: 12, y: 16, name: '清理过滤系统' },
  { x: 1, y: 8, name: '检查电力系统' },
  { x: 23, y: 8, name: '维护引擎核心' },
  { x: 12, y: 12, name: '重置安全协议' },
]
