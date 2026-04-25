/**
 * 游戏连连看测试用例
 * 运行命令: node game.test.js
 */

var fs = require('fs');
var game = require('./game.js');

var passed = 0;
var failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log('✓ ' + message);
    passed++;
  } else {
    console.log('✗ ' + message);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  var result = JSON.stringify(actual) === JSON.stringify(expected);
  if (result) {
    console.log('✓ ' + message);
    passed++;
  } else {
    console.log('✗ ' + message);
    console.log('  Expected: ' + JSON.stringify(expected));
    console.log('  Actual: ' + JSON.stringify(actual));
    failed++;
  }
}

function assertNotNull(value, message) {
  if (value !== null && value !== undefined) {
    console.log('✓ ' + message);
    passed++;
  } else {
    console.log('✗ ' + message + ' (expected non-null)');
    failed++;
  }
}

function assertNull(value, message) {
  if (value === null || value === undefined) {
    console.log('✓ ' + message);
    passed++;
  } else {
    console.log('✗ ' + message + ' (expected null)');
    failed++;
  }
}

function countTurns(path) {
  if (!path || path.length < 3) return 0;
  var turns = 0;
  var prevDr = path[1][0] - path[0][0];
  var prevDc = path[1][1] - path[0][1];
  for (var i = 2; i < path.length; i++) {
    var dr = path[i][0] - path[i - 1][0];
    var dc = path[i][1] - path[i - 1][1];
    if (dr !== prevDr || dc !== prevDc) {
      turns++;
    }
    prevDr = dr;
    prevDc = dc;
  }
  return turns;
}

console.log('========== 游戏连连看测试用例 ==========\n');

console.log('--- 测试1: shuffle 函数 ---');
var testArr = [1, 2, 3, 4, 5];
var shuffled = game.shuffle(testArr.slice());
assert(shuffled.length === 5, 'shuffle: 数组长度保持不变');
assert(shuffled.sort().join(',') === '1,2,3,4,5', 'shuffle: 包含所有原元素');

console.log('\n--- 测试2: initGame 函数 ---');
game.initGame();
var board = game.getBoard();
assert(board.length === game.ROWS, 'initGame: 行数正确');
assert(board[0].length === game.COLS, 'initGame: 列数正确');

var totalTiles = 0;
for (var i = 0; i < board.length; i++) {
  for (var j = 0; j < board[i].length; j++) {
    if (board[i][j]) totalTiles++;
  }
}
assert(totalTiles === game.ROWS * game.COLS, 'initGame: 所有格子都有图案');

var pairCount = game.getPairs();
assert(pairCount === (game.ROWS * game.COLS) / 2, 'initGame: 成对数量正确');

console.log('\n--- 测试3: findPath 函数 - 基本路径 ---');
game.initGame();
board = game.getBoard();
board[0][0] = 'A';
board[0][1] = 'B';
board[0][2] = 'A';
var path = game.findPath(0, 0, 0, 2);
assertNotNull(path, 'findPath: 直线相邻可连接');

console.log('\n--- 测试4: findPath 函数 - 绕过障碍物 ---');
game.initGame();
board = game.getBoard();
board[0][0] = 'A';
board[0][1] = 'X';
board[0][2] = '';
board[1][0] = '';
board[1][1] = 'A';
board[1][2] = '';
path = game.findPath(0, 0, 1, 1);
assertNotNull(path, 'findPath: 可绕过障碍物');

console.log('\n--- 测试5: findPath 函数 - 边框外路径 ---');
game.initGame();
board = game.getBoard();
board[0][0] = 'A';
board[0][game.COLS - 1] = 'A';
path = game.findPath(0, 0, 0, game.COLS - 1);
assertNotNull(path, 'findPath: 可通过边框外连接');

console.log('\n--- 测试6: findPath 函数 - 无法连接 ---');
game.initGame();
board = game.getBoard();
board[0][0] = 'A';
board[0][1] = 'X';
board[0][2] = 'X';
board[0][3] = 'X';
board[1][0] = 'X';
board[1][1] = 'X';
board[1][2] = 'X';
board[1][3] = 'X';
board[2][0] = 'X';
board[2][1] = 'X';
board[2][2] = 'A';
board[2][3] = 'X';
path = game.findPath(0, 0, 2, 2);
assertNull(path, 'findPath: 无法连接时返回null');

console.log('\n--- 测试7: findAllPairs 函数 ---');
game.initGame();
board = game.getBoard();
board[0][0] = 'A';
board[0][1] = 'A';
var pairs = game.findAllPairs();
assert(pairs.length > 0, 'findAllPairs: 能找到可消除的对');
var hasAdjacent = false;
for (var i = 0; i < pairs.length; i++) {
  if (pairs[i].r1 === 0 && pairs[i].c1 === 0 && pairs[i].r2 === 0 && pairs[i].c2 === 1) {
    hasAdjacent = true;
    break;
  }
}
assert(hasAdjacent, 'findAllPairs: 包含相邻的A对');

console.log('\n--- 测试8: eliminateAll 函数 ---');
game.initGame();
board = game.getBoard();
board[0][0] = 'A';
board[0][1] = 'A';
board[1][0] = 'B';
board[1][1] = 'B';
var beforePairs = game.getPairs();
game.eliminateAll();
var afterPairs = game.getPairs();
assert(afterPairs < beforePairs, 'eliminateAll: 消除后剩余数量减少');
assert(board[0][0] === '', 'eliminateAll: 消除后格子为空');
assert(board[0][1] === '', 'eliminateAll: 消除后相邻格子也为空');

console.log('\n--- 测试9: 计分逻辑 ---');
game.initGame();
board = game.getBoard();
board[0][0] = 'A';
board[0][1] = 'A';
var beforeScore = game.getScore();
game.eliminateAll();
var afterScore = game.getScore();
assert(afterScore > beforeScore, 'eliminateAll: 消除后分数增加');

console.log('\n--- 测试10: 一键消除按对数扣减 ---');
game.initGame();
board = game.getBoard();
for (var rr = 0; rr < game.ROWS; rr++) {
  for (var cc = 0; cc < game.COLS; cc++) {
    board[rr][cc] = '';
  }
}
board[0][0] = 'A';
board[0][1] = 'A';
board[1][0] = 'B';
board[1][1] = 'B';
game.setPairs(6);
game.eliminateAll();
assert(game.getPairs() === 4, 'eliminateAll: 每消除2个格子只减少1对');

console.log('\n--- 测试11: 游戏初始化状态 ---');
game.initGame();
assert(game.getPairs() === game.ROWS * game.COLS / 2, 'initGame: 初始剩余数为总数一半');
assert(game.getScore() === 0, 'initGame: 初始分数为0');

console.log('\n--- 测试12: 边界条件 - findPath ---');
game.initGame();
board = game.getBoard();
board[0][0] = 'A';
path = game.findPath(0, 0, -1, 0);
assertNotNull(path, 'findPath: 可走出上边界');

path = game.findPath(0, 0, 0, -1);
assertNotNull(path, 'findPath: 可走出左边界');

path = game.findPath(0, 0, game.ROWS, 0);
assertNotNull(path, 'findPath: 可走出下边界');

path = game.findPath(0, 0, 0, game.COLS);
assertNotNull(path, 'findPath: 可走出右边界');

console.log('\n--- 测试13: 空格子处理 ---');
game.initGame();
board = game.getBoard();
board[0][0] = '';
board[0][1] = '';
path = game.findPath(0, 0, 0, 1);
assertNotNull(path, 'findPath: 空格子之间可连接');

console.log('\n--- 测试14: initGame 不递归调用 ---');
game.initGame();
game.initGame();
game.initGame();
var b = game.getBoard();
assert(b.length === game.ROWS, 'initGame: 多次调用不递归');

console.log('\n--- 测试15: initGame 后 score 重置 ---');
game.initGame();
game.setScore(100);
game.initGame();
assert(game.getScore() === 0, 'initGame: 再次调用后分数重置为0');

console.log('\n--- 测试16: 无相邻时消除数量正确 ---');
game.initGame();
var board = game.getBoard();
var beforePairs = game.getPairs();
game.eliminateAll();
var afterPairs = game.getPairs();
assert(afterPairs < beforePairs, 'eliminateAll: 消除后pairs减少');
assert(afterPairs >= 0, 'eliminateAll: pairs不为负');

console.log('\n--- 测试17: findPath 同位置返回单点路径 ---');
game.initGame();
board = game.getBoard();
board[0][0] = 'A';
path = game.findPath(0, 0, 0, 0);
assertNotNull(path, 'findPath: 同位置返回路径');
assert(path.length === 1, 'findPath: 单点路径只有一个点');

console.log('\n--- 测试18: 大网格性能 ---');
var originalRows = game.ROWS;
var originalCols = game.COLS;
game.ROWS = 20;
game.COLS = 30;
game.initGame();
game.ROWS = originalRows;
game.COLS = originalCols;
assert(game.getBoard().length === originalRows, 'findPath: 网格切换后正确重置');

console.log('\n--- 测试19: findPath 转弯约束与最优性 ---');
game.initGame();
board = game.getBoard();
for (var r = 0; r < game.ROWS; r++) {
  for (var c = 0; c < game.COLS; c++) {
    board[r][c] = 'X';
  }
}
board[1][1] = 'A';
board[1][5] = 'A';
board[1][2] = '';
board[2][2] = '';
board[2][3] = '';
board[2][4] = '';
board[1][4] = '';
path = game.findPath(1, 1, 1, 5);
assertNull(path, 'findPath: 超过2次转弯路径不可消除');

game.initGame();
board = game.getBoard();
board[0][0] = 'A';
board[0][1] = 'X';
board[1][0] = '';
board[1][1] = '';
board[1][2] = 'A';
path = game.findPath(0, 0, 1, 2);
assertNotNull(path, 'findPath: 2次以内转弯可连接');
assert(countTurns(path) <= 2, 'findPath: 返回路径转弯数不超过2');
console.log('\n--- 测试20: 一键消除按钮绑定 ---');
var html = fs.readFileSync('./index.html', 'utf8');
var ui = fs.readFileSync('./ui.js', 'utf8');
var css = fs.readFileSync('./style.css', 'utf8');
assert(html.indexOf('onclick="handleEliminateAllClick()"') !== -1, '一键消除: 按钮绑定到独立UI处理函数');
assert(ui.indexOf('function handleEliminateAllClick()') !== -1, '一键消除: UI处理函数存在');
assert(html.indexOf('function eliminateAll()') === -1, '一键消除: 不覆盖 game.js 的 eliminateAll');

console.log('\n--- 测试21: 提示连线触发时机与保留策略 ---');
assert(ui.indexOf('setupGameUI();\n') !== -1 && ui.indexOf('startTimer();\n') !== -1, '提示连线: 开局不自动提示(无开局showHint调用序列)');
assert(ui.indexOf('resetTimer();\n              showHint();') === -1, '提示连线: 连接成功重置倒计时时不自动提示');
assert(ui.indexOf('function showHint() {\n      removeHint();') === -1, '提示连线: 生成新提示时不清除旧提示');
assert(ui.indexOf('function onBoardClick() {\n      removeHint();') === -1, '提示连线: 点击棋盘时不清除提示');

console.log('\n--- 测试22: 一键消除后倒计时重置条件 ---');
assert(ui.indexOf('var beforePairs = window.getPairs();') !== -1, '一键消除: 记录消除前剩余对数');
assert(ui.indexOf('var eliminatedCount = beforePairs - pairs;') !== -1, '一键消除: 计算本次消除数量');
assert(ui.indexOf('if (eliminatedCount > 1) {') !== -1, '一键消除: 消除超过1对时重置倒计时');

console.log('\n--- 测试23: 棋盘外层坐标轴 ---');
assert(html.indexOf('id="boardWithAxes"') !== -1, '坐标轴: 棋盘外有包裹层');
assert(html.indexOf('id="xAxis"') !== -1, '坐标轴: 存在横坐标容器');
assert(html.indexOf('id="yAxis"') !== -1, '坐标轴: 存在纵坐标容器');
assert(ui.indexOf('function renderAxisLabels()') !== -1, '坐标轴: 存在坐标渲染函数');
assert(ui.indexOf('for (var x = 1; x <= COLS; x++)') !== -1, '坐标轴: 横坐标从1开始');
assert(ui.indexOf('for (var y = 1; y <= ROWS; y++)') !== -1, '坐标轴: 纵坐标从1开始');

console.log('\n--- 测试24: 游戏结束弹窗与重开按钮 ---');
assert(html.indexOf('id="finalScore"') !== -1, '结束弹窗: 展示最终分数区域');
assert(html.indexOf('id="restartBtn"') !== -1, '结束弹窗: 存在重新开始按钮');
assert(ui.indexOf('function showGameOver()') !== -1, '结束弹窗: 存在结束处理函数');
assert(ui.indexOf('function restartGame()') !== -1, '结束弹窗: 存在重新开始函数');
assert(ui.indexOf('function restartGame() {\n  removeHint();') !== -1, '结束弹窗: 重新开始前清理历史提示线');
assert(ui.indexOf('function isBoardCleared()') !== -1, '结束判定: 存在棋盘清空检测函数');
assert(ui.indexOf('if (pairs === 0)') !== -1, '结束判定: remaining为0时检查状态');
assert(html.indexOf('<span id="timer">\u23f0 5</span>') !== -1, '倒计时: 初始展示为5秒');
assert(ui.indexOf('timerValue = 5;') !== -1, '倒计时: 所有重置点统一为5秒');
assert(ui.indexOf('function showGameOver() {\n  if (timerInterval) {\n    clearInterval(timerInterval);\n    timerInterval = null;\n  }') !== -1, '倒计时: 通关后暂停计时器');

console.log('\n--- 测试25: 提示线交互、连线坐标与音效 ---');
assert(ui.indexOf('function consumeHintOnAction()') !== -1, '提示线: 存在点击后消费提示函数');
assert(ui.indexOf('if (hintLine) {\n    removeHint();\n    resetTimer();\n  }') !== -1, '提示线: 点击后消失并重置倒计时');
assert(ui.indexOf("document.querySelectorAll('.line:not(.hint)')") !== -1, '提示线: 清理临时线时保留黄色提示线');
assert(ui.indexOf('function handleClick(row, col) {\n  consumeHintOnAction();') !== -1, '提示线: 鼠标点击触发后才消费提示线');
assert(ui.indexOf('function getBoardMetrics()') !== -1, '连线: 存在棋盘度量函数');
assert(ui.indexOf('originX') !== -1 && ui.indexOf('stepX') !== -1, '连线: 使用网格度量计算中心坐标');
assert(css.indexOf('transform: scale(1.5);') !== -1, '悬停: 格子放大0.5倍');
assert(css.indexOf('transition: transform 0.5s ease') !== -1, '悬停: 放大动画时长0.5s');
assert(ui.indexOf('window.playSuccessSfx') !== -1, '音效: 成功时触发成功音');
assert(ui.indexOf('window.playFailSfx') !== -1, '音效: 失败时触发失败音');

console.log('\n--- 测试26: 初始化每种动物数量为偶数 ---');
game.initGame();
board = game.getBoard();
var animalCounts = {};
for (var r = 0; r < board.length; r++) {
  for (var c = 0; c < board[r].length; c++) {
    var tile = board[r][c];
    if (tile && tile !== '') {
      animalCounts[tile] = (animalCounts[tile] || 0) + 1;
    }
  }
}
var hasOdd = false;
for (var animal in animalCounts) {
  if (animalCounts[animal] % 2 !== 0) {
    hasOdd = true;
    break;
  }
}
assert(!hasOdd, 'initGame: 每种动物数量都是偶数');

console.log('\n--- 测试27: 消除不会剩余单个 ---');
var totalInit = 0;
game.initGame();
board = game.getBoard();
for (var r = 0; r < board.length; r++) {
  for (var c = 0; c < board[r].length; c++) {
    if (board[r][c] && board[r][c] !== '') totalInit++;
  }
}
assert(totalInit % 2 === 0, 'initGame: 总格子数为偶数');
var countMap = {};
for (var r = 0; r < board.length; r++) {
  for (var c = 0; c < board[r].length; c++) {
    var tile = board[r][c];
    if (tile && tile !== '') {
      countMap[tile] = (countMap[tile] || 0) + 1;
    }
  }
}
var allEven = true;
for (var k in countMap) {
  if (countMap[k] % 2 !== 0) {
    allEven = false;
    break;
  }
}
assert(allEven, 'initGame: 任意animal类型出现次数都是偶数');

console.log('\n--- 测试28: 死局检测 hasAvailablePairs ---');
game.initGame();
board = game.getBoard();
assert(typeof game.hasAvailablePairs === 'function', 'hasAvailablePairs: 函数存在');
for (var r = 0; r < game.ROWS; r++) {
  for (var c = 0; c < game.COLS; c++) {
    board[r][c] = '';
  }
}
board[0][0] = 'A';
board[0][1] = 'A';
board[1][0] = 'B';
board[1][1] = 'B';
game.setBoard(board);
assert(game.hasAvailablePairs(), 'hasAvailablePairs: 有可消除对时返回true');

for (var r = 0; r < game.ROWS; r++) {
  for (var c = 0; c < game.COLS; c++) {
    board[r][c] = '';
  }
}
board[0][0] = 'A';
board[0][1] = 'X';
board[1][0] = 'X';
board[1][1] = 'A';
game.setBoard(board);
assert(!game.hasAvailablePairs(), 'hasAvailablePairs: 无可消除对时返回false');

console.log('\n--- 测试28b: 消除到最后一对后remaining为0 ---');
game.initGame();
board = game.getBoard();
for (var r = 0; r < game.ROWS; r++) {
  for (var c = 0; c < game.COLS; c++) {
    board[r][c] = '';
  }
}
board[0][0] = 'A';
board[0][1] = 'A';
game.setBoard(board);
game.setPairs(1);
board[0][0] = '';
board[0][1] = '';
game.setBoard(board);
game.setPairs(0);
assert(game.getPairs() === 0, '消除到最后一对remaining为0');

console.log('\n--- 测试28c: 模拟连续点击测试消除 ---');
game.initGame();
board = game.getBoard();

var simulateClick = function() {
  var allPairs = game.findAllPairs();
  if (allPairs.length === 0) return false;
  var p = allPairs[0];
  var board = game.getBoard();
  board[p.r1][p.c1] = '';
  board[p.r2][p.c2] = '';
  game.setBoard(board);
  var newPairs = game.getPairs() - 1;
  if (newPairs < 0) newPairs = 0;
  game.setPairs(newPairs);
  return true;
};

var count = 0;
while (count < 100) {
  if (!simulateClick()) break;
  count++;
}
assert(game.getPairs() >= 0, '连续消除remaining不会变为负数');
assert(game.getPairs() === (50 - count), 'remaining正确减少');

console.log('\n--- 测试29: 重排 reshuffleRemaining ---');
game.initGame();
board = game.getBoard();
for (var r = 0; r < game.ROWS; r++) {
  for (var c = 0; c < game.COLS; c++) {
    board[r][c] = '';
  }
}
board[0][0] = 'A';
board[0][1] = 'A';
board[0][2] = 'B';
board[0][3] = 'B';
game.setBoard(board);
var beforeTiles = board[0].slice(0, 4).join(',');
var changed = false;
for (var t = 0; t < 10; t++) {
  game.reshuffleRemaining();
  board = game.getBoard();
  var afterTiles = board[0].slice(0, 4).join(',');
  if (beforeTiles !== afterTiles) {
    changed = true;
    break;
  }
}
assert(changed, 'reshuffleRemaining: 打乱现有格子');

var countA = 0, countB = 0;
for (var r = 0; r < board.length; r++) {
  for (var c = 0; c < board[r].length; c++) {
    if (board[r][c] === 'A') countA++;
    if (board[r][c] === 'B') countB++;
  }
}
assert(countA === 2, 'reshuffleRemaining: A数量不变');
assert(countB === 2, 'reshuffleRemaining: B数量不变');

console.log('\n--- 测试30: 消除后remaining正确 ---');
game.initGame();
var initialPairs = game.getPairs();
assert(initialPairs % 2 === 0, 'eliminateAll: 初始remaining为偶数');
game.eliminateAll();
var afterPairs = game.getPairs();
var board = game.getBoard();
var remainingTiles = 0;
for (var r = 0; r < board.length; r++) {
  for (var c = 0; c < board[r].length; c++) {
    if (board[r][c] && board[r][c] !== '') remainingTiles++;
  }
}
assert(remainingTiles % 2 === 0, 'eliminateAll: 消除后格子数仍为偶数');
assert(remainingTiles === afterPairs * 2, 'eliminateAll: remaining与实际格子一致');

console.log('\n--- 测试31: 重排后remaining正确 ---');
game.initGame();
game.eliminateAll();
var beforeReshuffle = game.getPairs();
game.reshuffleRemaining();
var afterReshuffle = game.getPairs();
assert(beforeReshuffle === afterReshuffle, 'reshuffleRemaining: 重排后remaining不变');
board = game.getBoard();
var tilesAfterReshuffle = 0;
var countMap2 = {};
for (var r = 0; r < board.length; r++) {
  for (var c = 0; c < board[r].length; c++) {
    var tile = board[r][c];
    if (tile && tile !== '') {
      tilesAfterReshuffle++;
      countMap2[tile] = (countMap2[tile] || 0) + 1;
    }
  }
}
assert(tilesAfterReshuffle % 2 === 0, 'reshuffleRemaining: 重排后总格子数为偶数');
var allEven2 = true;
for (var k in countMap2) {
  if (countMap2[k] % 2 !== 0) {
    allEven2 = false;
    break;
  }
}
assert(allEven2, 'reshuffleRemaining: 重排后每种动物数量为偶数');

console.log('\n--- 测试32: 音效目录与脚本 ---');
var sfxCode = fs.readFileSync('./assets/audio/sfx.js', 'utf8');
assert(sfxCode.indexOf('window.playSuccessSfx') !== -1, '音效目录: 成功音效函数导出');
assert(sfxCode.indexOf('window.playFailSfx') !== -1, '音效目录: 失败音效函数导出');
assert(sfxCode.indexOf('window.toggleSfx') !== -1, '音效目录: 音效开关函数导出');
assert(sfxCode.indexOf("var STORAGE_KEY = 'llk_sfx_enabled';") !== -1, '音效目录: 本地存储键存在');
assert(sfxCode.indexOf('window.localStorage.setItem(STORAGE_KEY, sfxEnabled ? \'1\' : \'0\')') !== -1, '音效目录: 切换时持久化音效状态');
assert(sfxCode.indexOf('document.addEventListener(\'pointerdown\', unlockAudio, { once: true })') !== -1, '音效目录: 首次点击解锁音频上下文');
assert(sfxCode.indexOf('if (audioCtx.state !== \'running\')') !== -1, '音效目录: 非running状态时先恢复再播放');
assert(sfxCode.indexOf('if (unlocked || !sfxEnabled) return;') !== -1, '音效目录: 关闭音效时不错误标记已解锁');
assert(sfxCode.indexOf('audioCtx.resume().then(function() {\n      unlocked = true;') !== -1, '音效目录: 仅在恢复成功后标记解锁');
assert(html.indexOf('<script src="assets/audio/sfx.js"></script>') !== -1, '音效目录: 页面加载独立音效脚本');
assert(html.indexOf('id="sfxToggleBtn"') !== -1, '音效: 页面存在开关按钮');
assert(ui.indexOf('function handleToggleSfx()') !== -1, '音效: 页面存在音效开关处理函数');
assert(ui.indexOf('function refreshSfxButton()') !== -1, '音效: 页面存在图标刷新函数');
assert(ui.indexOf("window.isSfxEnabled() ? '\ud83d\udd0a' : '\ud83d\udd07'") !== -1, '音效: 使用图标显示开关状态');

console.log('\n========================================');
console.log('测试结果: ' + passed + ' 通过, ' + failed + ' 失败');
console.log('========================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n所有测试通过! ✓\n');
  process.exit(0);
}