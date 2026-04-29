var ROWS = 10;
var COLS = 10;
var ANIMAL_COUNT = 20;

// 所有郭老师图片，运行时动态加载实际存在的文件列表
// Node.js 环境（测试）直接读目录，浏览器环境通过 /api/images 获取
var allGuoImages = [];

// 加载实际存在的图片列表（供 Node.js 测试使用）
function loadAvailableImagesSync() {
  if (typeof require !== 'undefined') {
    try {
      var fs = require('fs');
      var path = require('path');
      var dir = path.join(__dirname, 'assets', 'images');
      var files = fs.readdirSync(dir);
      var prefix = 'assets/images/';
      allGuoImages = files.filter(function(f) {
        return f.endsWith('.webp');
      }).sort().map(function(f) {
        return prefix + f;
      });
      if (allGuoImages.length >= ANIMAL_COUNT) {
        return true;
      }
    } catch(e) {}
  }
  // 回退到硬编码范围
  if (typeof XMLHttpRequest !== 'undefined') {
    allGuoImages = [];
    return false;
  }
}
loadAvailableImagesSync();

// 浏览器端：异步从 /api/images 加载可用图片列表
function fetchAvailableImages(callback) {
  if (typeof XMLHttpRequest === 'undefined') {
    // Node.js 环境，已经通过 loadAvailableImagesSync 初始化了
    if (callback) callback(allGuoImages);
    return;
  }
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/api/images', true);
  xhr.onload = function() {
    if (xhr.status === 200) {
      var data = JSON.parse(xhr.responseText);
      var prefix = 'assets/images/';
      allGuoImages = data.images.map(function(f) { return prefix + f; });
      if (allGuoImages.length < ANIMAL_COUNT) {
        console.warn('可用图片不足' + ANIMAL_COUNT + '张（只有' + allGuoImages.length + '张），使用较少的图片类型');
      }
    } else {
      console.warn('获取图片列表失败，使用回退图片列表');
    }
    if (callback) callback(allGuoImages);
  };
  xhr.onerror = function() {
    console.warn('无法连接服务器获取图片列表，使用回退列表');
    if (callback) callback(allGuoImages);
  };
  xhr.send();
}

// 游戏运行时使用的当前图片集
var animals = [];

var board = [];
var selected = null;
var pairs = 0;
var score = 0;
var tempLine = null;
var lastMouseRow = -1;
var lastMouseCol = -1;
var timerValue = 5;
var timerInterval = null;
var hintLine = null;

function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function pickRandomImages() {
  var shuffled = [];
  for (var i = 0; i < allGuoImages.length; i++) {
    shuffled.push(allGuoImages[i]);
  }
  for (var i = shuffled.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }
  return shuffled.slice(0, ANIMAL_COUNT);
}

function initGame() {
  var totalCells = ROWS * COLS;
  var pairCount = (totalCells / 2) | 0;
  var tiles = [];

  animals = pickRandomImages();
  var animalsSubset = animals.slice(0, ANIMAL_COUNT);
  var typesUsed = animalsSubset.length;
  var pairsPerType = (pairCount / typesUsed) | 0;
  var remainder = pairCount % typesUsed;

  for (var i = 0; i < typesUsed; i++) {
    var animal = animalsSubset[i];
    var count = pairsPerType;
    if (i < remainder) count++;
    for (var j = 0; j < count; j++) {
      tiles.push(animal, animal);
    }
  }

  tiles = shuffle(tiles);
  board = [];
  pairs = pairCount;
  score = 0;

  for (var i = 0; i < ROWS; i++) {
    board[i] = [];
    for (var j = 0; j < COLS; j++) {
      board[i][j] = tiles[i * COLS + j];
    }
  }

  if (typeof module === 'undefined' || !module || !module.exports) {
    updateInfo();
  }
}

function findPath(r1, c1, r2, c2) {
  if (r1 === r2 && c1 === c2) {
    return [[r1, c1]];
  }

  var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  var queue = [{ r: r1, c: c1, dir: -1, turns: 0, steps: 0, path: [[r1, c1]] }];
  var best = {};
  var bestTarget = null;

  while (queue.length) {
    var bestIdx = 0;
    for (var i = 1; i < queue.length; i++) {
      if (queue[i].turns < queue[bestIdx].turns ||
          (queue[i].turns === queue[bestIdx].turns && queue[i].steps < queue[bestIdx].steps)) {
        bestIdx = i;
      }
    }
    var state = queue.splice(bestIdx, 1)[0];

    if (state.turns > 2) {
      continue;
    }

    if (state.r === r2 && state.c === c2) {
      if (!bestTarget ||
          state.turns < bestTarget.turns ||
          (state.turns === bestTarget.turns && state.steps < bestTarget.steps)) {
        bestTarget = state;
      }
      continue;
    }

    if (bestTarget) {
      if (state.turns > bestTarget.turns) continue;
      if (state.turns === bestTarget.turns && state.steps >= bestTarget.steps) continue;
    }

    for (var d = 0; d < dirs.length; d++) {
      var nr = state.r + dirs[d][0];
      var nc = state.c + dirs[d][1];

      if (nr < -1 || nr > ROWS || nc < -1 || nc > COLS) continue;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        if (!(nr === r2 && nc === c2) && board[nr][nc] !== '') continue;
      }

      var nextTurns = state.turns;
      if (state.dir !== -1 && state.dir !== d) {
        nextTurns++;
      }
      if (nextTurns > 2) continue;

      var nextSteps = state.steps + 1;
      var key = nr + ',' + nc + ',' + d;
      var prev = best[key];
      if (prev) {
        if (prev.turns < nextTurns) continue;
        if (prev.turns === nextTurns && prev.steps <= nextSteps) continue;
      }
      best[key] = { turns: nextTurns, steps: nextSteps };
      queue.push({
        r: nr,
        c: nc,
        dir: d,
        turns: nextTurns,
        steps: nextSteps,
        path: state.path.concat([[nr, nc]])
      });
    }
  }

  return bestTarget ? bestTarget.path : null;
}

function getBoard() {
  return board;
}

function getPairs() {
  return pairs;
}

function getScore() {
  return score;
}

function setBoard(newBoard) {
  board = newBoard;
}

function setPairs(newPairs) {
  pairs = newPairs;
}

function setScore(newScore) {
  score = newScore;
}

function getTimerValue() {
  return timerValue;
}

function setTimerValue(val) {
  timerValue = val;
}

function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function setTimerInterval(interval) {
  timerInterval = interval;
}

function updateInfo() {
  if (typeof document !== 'undefined') {
    document.getElementById('score').textContent = score;
    document.getElementById('remaining').textContent = pairs;
  }
}

function findAllPairs() {
  var results = [];
  for (var i = 0; i < ROWS; i++) {
    for (var j = 0; j < COLS; j++) {
      if (!board[i][j] || board[i][j] === '') continue;
      for (var ii = i; ii < ROWS; ii++) {
        var jjStart = (ii === i) ? j + 1 : 0;
        for (var jj = jjStart; jj < COLS; jj++) {
          if (!board[ii][jj] || board[ii][jj] === '') continue;
          if (board[i][j] === board[ii][jj]) {
            var path = findPath(i, j, ii, jj);
            if (path) {
              results.push({r1: i, c1: j, r2: ii, c2: jj, path: path});
            }
          }
        }
      }
    }
  }
  return results;
}

function hasAvailablePairs() {
  return findAllPairs().length > 0;
}

function reshuffleRemaining() {
  var tiles = [];
  for (var i = 0; i < ROWS; i++) {
    for (var j = 0; j < COLS; j++) {
      if (board[i][j] && board[i][j] !== '') {
        tiles.push(board[i][j]);
      }
    }
  }

  tiles = shuffle(tiles);

  var idx = 0;
  for (var i = 0; i < ROWS; i++) {
    for (var j = 0; j < COLS; j++) {
      if (board[i][j] && board[i][j] !== '') {
        board[i][j] = tiles[idx];
        idx++;
      }
    }
  }
}

function eliminateAll() {
  var removedPairs = 0;
  var changed = true;
  while (changed) {
    changed = false;
    for (var i = 0; i < ROWS; i++) {
      for (var j = 0; j < COLS; j++) {
        if (!board[i][j] || board[i][j] === '') continue;
        if (j + 1 < COLS && board[i][j+1] && board[i][j+1] !== '' && board[i][j] === board[i][j+1]) {
          board[i][j] = '';
          board[i][j+1] = '';
          removedPairs++;
          changed = true;
          continue;
        }
        if (i + 1 < ROWS && board[i+1][j] && board[i+1][j] !== '' && board[i][j] === board[i+1][j]) {
          board[i][j] = '';
          board[i+1][j] = '';
          removedPairs++;
          changed = true;
        }
      }
    }
  }
  pairs -= removedPairs;
  if (pairs < 0) pairs = 0;
  score += removedPairs * 10;
  updateInfo();
  if (typeof document !== 'undefined' && pairs === 0) {
    document.getElementById('message').style.display = 'block';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ROWS: ROWS,
    COLS: COLS,
    ANIMAL_COUNT: ANIMAL_COUNT,
    animals: animals,
    shuffle: shuffle,
    initGame: initGame,
    findPath: findPath,
    getBoard: getBoard,
    getPairs: getPairs,
    getScore: getScore,
    setBoard: setBoard,
    setPairs: setPairs,
    setScore: setScore,
    getTimerValue: getTimerValue,
    setTimerValue: setTimerValue,
    clearTimer: clearTimer,
    setTimerInterval: setTimerInterval,
    updateInfo: updateInfo,
    findAllPairs: findAllPairs,
    eliminateAll: eliminateAll,
    hasAvailablePairs: hasAvailablePairs,
    reshuffleRemaining: reshuffleRemaining
  };
} else {
  window.ROWS = ROWS;
  window.COLS = COLS;
  window.ANIMAL_COUNT = ANIMAL_COUNT;
  window.animals = animals;
  window.allGuoImages = allGuoImages;
  window.fetchAvailableImages = fetchAvailableImages;
  window.shuffle = shuffle;
  window.initGame = initGame;
  window.findPath = findPath;
  window.getBoard = getBoard;
  window.getPairs = getPairs;
  window.getScore = getScore;
  window.setBoard = setBoard;
  window.setPairs = setPairs;
  window.setScore = setScore;
  window.getTimerValue = getTimerValue;
  window.setTimerValue = setTimerValue;
  window.clearTimer = clearTimer;
  window.setTimerInterval = setTimerInterval;
  window.updateInfo = updateInfo;
  window.findAllPairs = findAllPairs;
  window.eliminateAll = eliminateAll;
  window.hasAvailablePairs = hasAvailablePairs;
  window.reshuffleRemaining = reshuffleRemaining;
}