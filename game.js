// ===== 太空狼人杀 - 游戏主逻辑 =====

// ===== 游戏状态 =====
const GameState = {
  phase: 'menu',
  role: 'crewmate',
  players: [],
  currentPlayer: null,
  tasks: [],
  bodies: [],
  totalTasks: 10,
  completedTasks: 0,
  killCooldown: 0,
  killCooldownMax: 15,
  meetingTimer: 30,
  meetingInterval: null,
  isAlive: true,
  sabotageActive: false,
  sabotageTimer: 0,
  gameTime: 300,
  gameInterval: null,
  currentTask: null,
  taskProgress: 0,
  doingTask: false,
  selectedVote: null,
  aiTimers: [],
  lastTime: 0
};

// ===== 颜色配置 =====
const COLORS = [
  { name: '红色', hex: '#ff1744', dark: '#b71c1c' },
  { name: '蓝色', hex: '#2979ff', dark: '#0d47a1' },
  { name: '绿色', hex: '#00e676', dark: '#1b5e20' },
  { name: '黄色', hex: '#ffea00', dark: '#f57f17' },
  { name: '紫色', hex: '#d500f9', dark: '#6a1b9a' },
  { name: '白色', hex: '#ffffff', dark: '#b0bec5' }
];

// ===== Canvas 初始化 =====
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = MAP_WIDTH * TILE_SIZE;
  canvas.height = MAP_HEIGHT * TILE_SIZE;
  const scaleX = window.innerWidth / canvas.width;
  const scaleY = window.innerHeight / canvas.height;
  const scale = Math.min(scaleX, scaleY, 1);
  canvas.style.transform = `scale(${scale})`;
  canvas.style.transformOrigin = 'center center';
}

// ===== 输入处理 =====
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e','k','r',' '].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});
window.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

// ===== 玩家类 =====
class Player {
  constructor(id, name, color, x, y, isImpostor = false) {
    this.id = id;
    this.name = name;
    this.color = color;
    this.x = x;
    this.y = y;
    this.speed = 2.5;
    this.isAlive = true;
    this.isImpostor = isImpostor;
    this.radius = 12;
    this.aiTargetX = x;
    this.aiTargetY = y;
    this.aiTimer = 0;
    this.aiState = 'idle';
    this.aiMoveTimer = 0;
    this.aiKillCooldown = 0;
    this.aiTaskTarget = null;
    this.aiTaskProgress = 0;
    this.aiDoingTask = false;
    this.voteTarget = null;
    this.bobOffset = 0;
    this.bobSpeed = 0;
  }

  update(deltaTime) {
    if (!this.isAlive) return;

    if (this.bobSpeed > 0) {
      this.bobOffset = Math.sin(Date.now() * this.bobSpeed) * 2;
    } else {
      this.bobOffset *= 0.9;
    }

    if (this !== GameState.currentPlayer) {
      this.updateAI(deltaTime);
    }
  }

  updateAI(deltaTime) {
    this.aiTimer += deltaTime;
    this.aiKillCooldown -= deltaTime;

    // 内鬼AI：击杀附近船员
    if (this.isImpostor && this.aiKillCooldown <= 0) {
      const nearby = GameState.players.find(p =>
        p !== this && p.isAlive && !p.isImpostor &&
        distance(this.x, this.y, p.x, p.y) < 50
      );
      if (nearby) {
        performKill(this, nearby);
        this.aiKillCooldown = GameState.killCooldownMax + Math.random() * 5;
        return;
      }
    }

    // 随机报告尸体
    if (!this.isImpostor) {
      const nearbyBody = GameState.bodies.find(b =>
        distance(this.x, this.y, b.x, b.y) < 60
      );
      if (nearbyBody && Math.random() < 0.01) {
        reportBody(nearbyBody);
        return;
      }
    }

    // 移动逻辑
    this.aiMoveTimer -= deltaTime;
    if (this.aiMoveTimer <= 0) {
      if (this.aiState === 'idle' || this.aiState === 'moving') {
        if (this.isImpostor) {
          this.aiTargetX = (2 + Math.random() * (MAP_WIDTH - 4)) * TILE_SIZE;
          this.aiTargetY = (2 + Math.random() * (MAP_HEIGHT - 4)) * TILE_SIZE;
        } else {
          if (Math.random() < 0.6 && GameState.tasks.length > 0) {
            const task = GameState.tasks[Math.floor(Math.random() * GameState.tasks.length)];
            if (!task.isCompleted) {
              this.aiTargetX = task.x;
              this.aiTargetY = task.y;
              this.aiTaskTarget = task;
              this.aiState = 'going_to_task';
            }
          } else {
            this.aiTargetX = (2 + Math.random() * (MAP_WIDTH - 4)) * TILE_SIZE;
            this.aiTargetY = (2 + Math.random() * (MAP_HEIGHT - 4)) * TILE_SIZE;
            this.aiState = 'moving';
          }
        }
        this.aiMoveTimer = 2 + Math.random() * 3;
      }
    }

    // 向目标移动
    const dx = this.aiTargetX - this.x;
    const dy = this.aiTargetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      const moveX = (dx / dist) * this.speed;
      const moveY = (dy / dist) * this.speed;

      const newX = this.x + moveX;
      const newY = this.y + moveY;

      if (isWalkable(newX, this.y, this.radius)) {
        this.x = newX;
      }
      if (isWalkable(this.x, newY, this.radius)) {
        this.y = newY;
      }
      this.bobSpeed = 0.008;
    } else {
      this.bobSpeed = 0;
    }

    // 到达任务点时完成任务
    if (this.aiState === 'going_to_task' && this.aiTaskTarget) {
      const taskDist = distance(this.x, this.y, this.aiTaskTarget.x, this.aiTaskTarget.y);
      if (taskDist < 30 && !this.aiTaskTarget.isCompleted && Math.random() < 0.02) {
        this.aiTaskTarget.isCompleted = true;
        GameState.completedTasks++;
        updateTaskBar();
        this.aiState = 'idle';
        this.aiTaskTarget = null;
      }
    }
  }
}

// ===== 渲染系统 =====
function drawMap() {
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const tile = mapData[y][x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      if (tile === TILE_WALL) {
        ctx.fillStyle = '#1a2030';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#2a3550';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, 3);
      } else if (tile === TILE_FLOOR || tile === TILE_EMPTY) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#0f1319' : '#0d1117';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
      } else if (tile === TILE_DOOR) {
        ctx.fillStyle = '#1a2030';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = 'rgba(0, 229, 255, 0.3)';
        ctx.fillRect(px + 5, py + 5, TILE_SIZE - 10, TILE_SIZE - 10);
      }
    }
  }
}

function drawPlayer(player) {
  if (!player.isAlive) return;

  const x = player.x;
  const y = player.y + player.bobOffset;
  const r = player.radius;

  // 阴影
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, y + r + 3, r, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // 身体
  ctx.fillStyle = player.color.hex;
  ctx.beginPath();
  ctx.ellipse(x, y + 2, r * 0.8, r, 0, 0, Math.PI * 2);
  ctx.fill();

  // 身体暗部
  ctx.fillStyle = player.color.dark;
  ctx.beginPath();
  ctx.ellipse(x, y + 4, r * 0.7, r * 0.6, 0, 0, Math.PI);
  ctx.fill();

  // 头盔/面罩
  ctx.fillStyle = '#1a2535';
  ctx.beginPath();
  ctx.ellipse(x, y - 2, r * 0.9, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // 面罩反光
  ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
  ctx.beginPath();
  ctx.ellipse(x - 3, y - 4, r * 0.4, r * 0.3, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // 背包
  ctx.fillStyle = player.color.dark;
  ctx.fillRect(x - r - 3, y - 2, 5, r * 1.2);

  // 当前玩家标记
  if (player === GameState.currentPlayer) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawDeadBody(body) {
  const x = body.x;
  const y = body.y;
  const r = 12;

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + 5, r, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = body.color.hex;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.5, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 5, y - 5);
  ctx.lineTo(x + 5, y + 5);
  ctx.moveTo(x + 5, y - 5);
  ctx.lineTo(x - 5, y + 5);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 23, 68, 0.4)';
  ctx.beginPath();
  ctx.ellipse(x + 10, y + 3, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawTask(task) {
  if (task.isCompleted) return;

  const x = task.x;
  const y = task.y;
  const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;

  ctx.fillStyle = `rgba(0, 230, 118, ${0.1 * pulse})`;
  ctx.beginPath();
  ctx.arc(x, y, 25, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#00e676';
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0a0e17';
  ctx.font = 'bold 12px Orbitron';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', x, y + 1);

  ctx.fillStyle = 'rgba(0, 230, 118, 0.7)';
  ctx.font = '10px "Noto Sans SC"';
  ctx.fillText(task.name, x, y - 20);
}

function drawEffects() {
  if (GameState.sabotageActive) {
    const alpha = Math.sin(Date.now() * 0.01) * 0.15 + 0.15;
    ctx.fillStyle = `rgba(255, 23, 68, ${alpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (killFlashTime > 0) {
    const alpha = killFlashTime / 200;
    ctx.fillStyle = `rgba(255, 23, 68, ${alpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

let killFlashTime = 0;

// ===== 游戏初始化 =====
function initGame() {
  GameState.phase = 'playing';
  GameState.completedTasks = 0;
  GameState.killCooldown = 0;
  GameState.isAlive = true;
  GameState.sabotageActive = false;
  GameState.currentTask = null;
  GameState.doingTask = false;
  GameState.selectedVote = null;
  GameState.bodies = [];
  GameState.gameTime = 300;

  const isImpostor = Math.random() < 0.33;
  GameState.role = isImpostor ? 'impostor' : 'crewmate';

  GameState.players = [];
  const impostorCount = 2;
  const impostorIndices = new Set();

  if (isImpostor) {
    impostorIndices.add(0);
    while (impostorIndices.size < impostorCount) {
      impostorIndices.add(1 + Math.floor(Math.random() * 5));
    }
  } else {
    while (impostorIndices.size < impostorCount) {
      impostorIndices.add(Math.floor(Math.random() * 6));
    }
  }

  for (let i = 0; i < 6; i++) {
    const spawn = spawnPoints[i];
    const isImp = impostorIndices.has(i);
    const player = new Player(
      i,
      COLORS[i].name,
      COLORS[i],
      spawn.x * TILE_SIZE + TILE_SIZE / 2,
      spawn.y * TILE_SIZE + TILE_SIZE / 2,
      isImp
    );
    GameState.players.push(player);
  }

  GameState.currentPlayer = GameState.players[0];

  GameState.tasks = taskLocations.map((loc, i) => ({
    id: i,
    name: loc.name,
    x: loc.x * TILE_SIZE + TILE_SIZE / 2,
    y: loc.y * TILE_SIZE + TILE_SIZE / 2,
    duration: 3 + Math.random() * 2,
    isCompleted: false
  }));

  updateTaskBar();
  updateRoleBadge();
  updateKillCooldownUI();

  showScreen('game-screen');
  document.getElementById('hud').classList.remove('hidden');

  GameState.lastTime = performance.now();
  requestAnimationFrame(gameLoop);

  if (GameState.gameInterval) clearInterval(GameState.gameInterval);
  GameState.gameInterval = setInterval(() => {
    if (GameState.phase === 'playing') {
      GameState.gameTime--;
      if (GameState.gameTime <= 0) {
        checkWinCondition('time');
      }
    }
  }, 1000);
}

// ===== 游戏循环 =====
function gameLoop(timestamp) {
  if (GameState.phase !== 'playing') return;

  const deltaTime = timestamp - GameState.lastTime;
  GameState.lastTime = timestamp;

  handleInput(deltaTime);

  GameState.players.forEach(p => p.update(deltaTime / 16));

  if (GameState.doingTask && GameState.currentTask) {
    GameState.taskProgress += deltaTime / (GameState.currentTask.duration * 1000);
    if (GameState.taskProgress >= 1) {
      GameState.taskProgress = 1;
      if (!GameState.currentPlayer.isImpostor) {
        GameState.currentTask.isCompleted = true;
        GameState.completedTasks++;
        updateTaskBar();
      }
      GameState.doingTask = false;
      GameState.currentTask = null;
      GameState.taskProgress = 0;
      document.getElementById('task-progress-ui').classList.add('hidden');
      checkWinCondition('tasks');
    }
    updateTaskProgressUI();
  }

  if (GameState.killCooldown > 0) {
    GameState.killCooldown -= deltaTime / 1000;
    if (GameState.killCooldown < 0) GameState.killCooldown = 0;
    updateKillCooldownUI();
  }

  if (killFlashTime > 0) {
    killFlashTime -= deltaTime;
  }

  checkInteractionHint();

  if (GameState.role === 'impostor' && !GameState.sabotageActive && Math.random() < 0.0005) {
    triggerSabotage();
  }

  render();

  requestAnimationFrame(gameLoop);
}

function handleInput(deltaTime) {
  const player = GameState.currentPlayer;
  if (!player.isAlive || GameState.doingTask) return;

  let moveX = 0;
  let moveY = 0;

  if (keys['w'] || keys['arrowup']) moveY = -1;
  if (keys['s'] || keys['arrowdown']) moveY = 1;
  if (keys['a'] || keys['arrowleft']) moveX = -1;
  if (keys['d'] || keys['arrowright']) moveX = 1;

  if (moveX !== 0 && moveY !== 0) {
    moveX *= 0.707;
    moveY *= 0.707;
  }

  if (moveX !== 0 || moveY !== 0) {
    const newX = player.x + moveX * player.speed;
    const newY = player.y + moveY * player.speed;

    if (isWalkable(newX, player.y, player.radius)) {
      player.x = newX;
    }
    if (isWalkable(player.x, newY, player.radius)) {
      player.y = newY;
    }

    player.bobSpeed = 0.008;
  } else {
    player.bobSpeed = 0;
  }

  if (keys['e'] || keys['r']) {
    keys['e'] = false;
    keys['r'] = false;

    if (!GameState.doingTask) {
      const nearbyBody = GameState.bodies.find(b =>
        distance(player.x, player.y, b.x, b.y) < 50
      );
      if (nearbyBody) {
        reportBody(nearbyBody);
        return;
      }

      const nearbyTask = GameState.tasks.find(t =>
        !t.isCompleted && distance(player.x, player.y, t.x, t.y) < 40
      );
      if (nearbyTask) {
        startTask(nearbyTask);
      }
    }
  }

  if (keys['k'] && player.isImpostor && GameState.killCooldown <= 0 && !GameState.doingTask) {
    keys['k'] = false;
    const nearbyCrew = GameState.players.find(p =>
      p !== player && p.isAlive && !p.isImpostor &&
      distance(player.x, player.y, p.x, p.y) < 50
    );
    if (nearbyCrew) {
      performKill(player, nearbyCrew);
      GameState.killCooldown = GameState.killCooldownMax;
    }
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawMap();

  GameState.tasks.forEach(task => drawTask(task));

  GameState.bodies.forEach(body => drawDeadBody(body));

  const sortedPlayers = [...GameState.players].sort((a, b) => a.y - b.y);
  sortedPlayers.forEach(player => drawPlayer(player));

  drawEffects();
}

// ===== 任务系统 =====
function startTask(task) {
  GameState.doingTask = true;
  GameState.currentTask = task;
  GameState.taskProgress = 0;
  document.getElementById('task-progress-ui').classList.remove('hidden');
  document.getElementById('current-task-name').textContent = task.name;
}

function updateTaskProgressUI() {
  const fill = document.getElementById('task-progress-fill');
  fill.style.width = `${GameState.taskProgress * 100}%`;
}

function updateTaskBar() {
  const fill = document.getElementById('task-fill');
  const count = document.getElementById('task-count');
  const pct = (GameState.completedTasks / GameState.totalTasks) * 100;
  fill.style.width = `${pct}%`;
  count.textContent = `${GameState.completedTasks}/${GameState.totalTasks}`;
}

// ===== 击杀系统 =====
function performKill(killer, victim) {
  victim.isAlive = false;
  GameState.bodies.push({
    x: victim.x,
    y: victim.y,
    color: victim.color,
    playerId: victim.id
  });
  killFlashTime = 200;

  if (victim === GameState.currentPlayer) {
    GameState.isAlive = false;
    document.getElementById('interaction-hint').classList.add('hidden');
    document.getElementById('kill-hint').classList.add('hidden');
  }

  checkWinCondition('kill');
}

// ===== 报告系统 =====
function reportBody(body) {
  const idx = GameState.bodies.indexOf(body);
  if (idx > -1) GameState.bodies.splice(idx, 1);
  startMeeting();
}

// ===== 会议系统 =====
function startMeeting() {
  GameState.phase = 'meeting';
  GameState.meetingTimer = 30;
  GameState.selectedVote = null;

  showScreen('meeting-screen');
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('vote-result').classList.add('hidden');
  document.getElementById('btn-submit-vote').classList.remove('hidden');
  document.getElementById('btn-submit-vote').disabled = true;
  document.getElementById('btn-back-game').classList.add('hidden');
  document.getElementById('meeting-status').textContent = '请选择你要投票的玩家';

  renderPlayerList();

  updateMeetingTimer();
  if (GameState.meetingInterval) clearInterval(GameState.meetingInterval);
  GameState.meetingInterval = setInterval(() => {
    GameState.meetingTimer--;
    updateMeetingTimer();
    if (GameState.meetingTimer <= 0) {
      resolveMeeting();
    }
  }, 1000);

  aiVote();
}

function renderPlayerList() {
  const list = document.getElementById('player-list');
  list.innerHTML = '';

  GameState.players.forEach(player => {
    const item = document.createElement('div');
    item.className = `player-item ${!player.isAlive ? 'dead' : ''} ${GameState.selectedVote === player.id ? 'selected' : ''}`;
    item.innerHTML = `
      <div class="player-color" style="background: ${player.color.hex}"></div>
      <span class="player-name">${player.name}</span>
      <span class="player-status ${player.isAlive ? 'alive' : 'dead'}">${player.isAlive ? '存活' : '已死亡'}</span>
    `;

    if (player.isAlive && player !== GameState.currentPlayer) {
      item.addEventListener('click', () => {
        GameState.selectedVote = player.id;
        renderPlayerList();
        document.getElementById('btn-submit-vote').disabled = false;
      });
    }

    list.appendChild(item);
  });

  const skipItem = document.createElement('div');
  skipItem.className = `player-item ${GameState.selectedVote === -1 ? 'selected' : ''}`;
  skipItem.innerHTML = `
    <div class="player-color" style="background: #666"></div>
    <span class="player-name">跳过投票</span>
  `;
  skipItem.addEventListener('click', () => {
    GameState.selectedVote = -1;
    renderPlayerList();
    document.getElementById('btn-submit-vote').disabled = false;
  });
  list.appendChild(skipItem);
}

function updateMeetingTimer() {
  const timer = document.getElementById('meeting-timer');
  timer.textContent = GameState.meetingTimer;
  if (GameState.meetingTimer <= 10) {
    timer.style.color = 'var(--color-danger)';
  } else {
    timer.style.color = 'var(--color-warning)';
  }
}

function aiVote() {
  GameState.players.forEach(player => {
    if (player === GameState.currentPlayer || !player.isAlive) return;

    if (player.isImpostor) {
      const targets = GameState.players.filter(p => p.isAlive && !p.isImpostor && p !== GameState.currentPlayer);
      if (targets.length > 0) {
        player.voteTarget = targets[Math.floor(Math.random() * targets.length)].id;
      } else {
        player.voteTarget = -1;
      }
    } else {
      const aliveOthers = GameState.players.filter(p => p.isAlive && p !== player && p !== GameState.currentPlayer);
      if (aliveOthers.length > 0) {
        player.voteTarget = aliveOthers[Math.floor(Math.random() * aliveOthers.length)].id;
      } else {
        player.voteTarget = -1;
      }
    }
  });
}

function resolveMeeting() {
  clearInterval(GameState.meetingInterval);

  const votes = {};
  GameState.players.forEach(player => {
    if (!player.isAlive) return;
    let vote;
    if (player === GameState.currentPlayer) {
      vote = GameState.selectedVote;
    } else {
      vote = player.voteTarget;
    }
    if (vote !== null && vote !== undefined) {
      votes[vote] = (votes[vote] || 0) + 1;
    }
  });

  let maxVotes = 0;
  let maxTarget = null;
  let isTie = false;

  for (const [target, count] of Object.entries(votes)) {
    if (count > maxVotes) {
      maxVotes = count;
      maxTarget = parseInt(target);
      isTie = false;
    } else if (count === maxVotes) {
      isTie = true;
    }
  }

  const resultDiv = document.getElementById('vote-result');
  resultDiv.classList.remove('hidden', 'eliminated', 'skipped');

  if (isTie || maxTarget === -1) {
    resultDiv.classList.add('skipped');
    resultDiv.textContent = '平票或跳过，无人被淘汰';
  } else {
    const eliminated = GameState.players.find(p => p.id === maxTarget);
    if (eliminated) {
      eliminated.isAlive = false;
      resultDiv.classList.add('eliminated');
      resultDiv.textContent = `${eliminated.name} 被淘汰！${eliminated.isImpostor ? '（内鬼）' : '（船员）'}`;
    }
  }

  document.getElementById('btn-submit-vote').classList.add('hidden');
  document.getElementById('btn-back-game').classList.remove('hidden');

  document.getElementById('meeting-status').textContent = '投票结束';

  setTimeout(() => checkWinCondition('vote'), 1500);
}

// ===== 胜利条件检查 =====
function checkWinCondition(reason) {
  const aliveImpostors = GameState.players.filter(p => p.isAlive && p.isImpostor).length;
  const aliveCrew = GameState.players.filter(p => p.isAlive && !p.isImpostor).length;
  const tasksComplete = GameState.completedTasks >= GameState.totalTasks;

  let result = null;
  let reasonText = '';

  if (tasksComplete) {
    result = 'crew';
    reasonText = '船员完成了所有任务！';
  } else if (aliveImpostors === 0) {
    result = 'crew';
    reasonText = '所有内鬼已被投票淘汰！';
  } else if (aliveImpostors >= aliveCrew) {
    result = 'impostor';
    reasonText = '内鬼数量已不少于船员！';
  } else if (reason === 'time') {
    result = 'impostor';
    reasonText = '时间耗尽，氧气不足！';
  }

  if (result) {
    endGame(result, reasonText);
  }
}

function endGame(winner, reason) {
  GameState.phase = 'result';
  if (GameState.gameInterval) clearInterval(GameState.gameInterval);

  const isVictory = (winner === GameState.role);

  showScreen('result-screen');
  document.getElementById('hud').classList.add('hidden');

  const title = document.getElementById('result-title');
  title.textContent = isVictory ? '胜利！' : '失败！';
  title.className = `result-title ${isVictory ? 'victory' : 'defeat'}`;

  document.getElementById('result-icon').textContent = isVictory ? '🏆' : '💀';
  document.getElementById('result-reason').textContent = reason;
}

// ===== 破坏系统 =====
function triggerSabotage() {
  GameState.sabotageActive = true;
  document.getElementById('sabotage-alert').classList.remove('hidden');

  setTimeout(() => {
    GameState.sabotageActive = false;
    document.getElementById('sabotage-alert').classList.add('hidden');
  }, 10000);
}

// ===== UI 更新 =====
function updateRoleBadge() {
  const badge = document.getElementById('role-badge');
  badge.textContent = GameState.role === 'impostor' ? '内鬼' : '船员';
  badge.className = GameState.role === 'impostor' ? 'impostor' : 'crew';

  if (GameState.role === 'impostor') {
    document.getElementById('kill-cooldown').classList.remove('hidden');
  } else {
    document.getElementById('kill-cooldown').classList.add('hidden');
  }
}

function updateKillCooldownUI() {
  const timer = document.getElementById('cd-timer');
  if (GameState.killCooldown <= 0) {
    timer.textContent = 'READY';
    timer.className = 'ready';
  } else {
    timer.textContent = Math.ceil(GameState.killCooldown);
    timer.className = '';
  }
}

function checkInteractionHint() {
  const player = GameState.currentPlayer;
  if (!player.isAlive || GameState.doingTask) {
    document.getElementById('interaction-hint').classList.add('hidden');
    document.getElementById('kill-hint').classList.add('hidden');
    return;
  }

  const nearbyBody = GameState.bodies.find(b => distance(player.x, player.y, b.x, b.y) < 50);
  const nearbyTask = GameState.tasks.find(t => !t.isCompleted && distance(player.x, player.y, t.x, t.y) < 40);

  if (nearbyBody) {
    document.getElementById('interaction-hint').classList.remove('hidden');
    document.getElementById('interaction-hint').textContent = '按 E 报告尸体';
  } else if (nearbyTask) {
    document.getElementById('interaction-hint').classList.remove('hidden');
    document.getElementById('interaction-hint').textContent = `按 E ${GameState.currentPlayer.isImpostor ? '假装' : ''}执行任务`;
  } else {
    document.getElementById('interaction-hint').classList.add('hidden');
  }

  if (player.isImpostor && GameState.killCooldown <= 0) {
    const nearbyCrew = GameState.players.find(p =>
      p !== player && p.isAlive && !p.isImpostor &&
      distance(player.x, player.y, p.x, p.y) < 50
    );
    if (nearbyCrew) {
      document.getElementById('kill-hint').classList.remove('hidden');
    } else {
      document.getElementById('kill-hint').classList.add('hidden');
    }
  } else {
    document.getElementById('kill-hint').classList.add('hidden');
  }
}

// ===== 屏幕切换 =====
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

// ===== 事件绑定 =====
document.getElementById('btn-start').addEventListener('click', () => {
  initGame();
});

document.getElementById('btn-rules').addEventListener('click', () => {
  document.getElementById('rules-modal').classList.remove('hidden');
});

document.getElementById('btn-close-rules').addEventListener('click', () => {
  document.getElementById('rules-modal').classList.add('hidden');
});

document.getElementById('btn-submit-vote').addEventListener('click', () => {
  if (GameState.selectedVote !== null) {
    resolveMeeting();
  }
});

document.getElementById('btn-back-game').addEventListener('click', () => {
  GameState.phase = 'playing';
  showScreen('game-screen');
  document.getElementById('hud').classList.remove('hidden');
  GameState.lastTime = performance.now();
  requestAnimationFrame(gameLoop);
});

document.getElementById('btn-restart').addEventListener('click', () => {
  initGame();
});

document.getElementById('btn-home').addEventListener('click', () => {
  GameState.phase = 'menu';
  if (GameState.gameInterval) clearInterval(GameState.gameInterval);
  if (GameState.meetingInterval) clearInterval(GameState.meetingInterval);
  showScreen('menu-screen');
});

// ===== 初始化 =====
resizeCanvas();
window.addEventListener('resize', resizeCanvas);
