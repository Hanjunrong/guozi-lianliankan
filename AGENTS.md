# AGENTS.md

## Project

Simple browser-based "连连看" (Lianliankan/Onet connect) game.

## Run

```bash
./run.sh
# or: node server.js
# Server runs at http://localhost:8888
```

## Tech

- Pure HTML/CSS/JS, no build
- Node.js static file server

## Files

- `index.html` - Game (10x25 grid, tile matching logic)
- `server.js` - Static server on port 8888
- `run.sh` - Entry script (auto run tests first)
- `game.js` - Game logic (testable)
- `game.test.js` - Test cases (23 tests)

## Run

```bash
./run.sh
# or: node game.test.js && node server.js
```

## Files

- `index.html` - Game UI
- `game.js` - Game logic (可测试)
- `game.test.js` - 测试用例 (30 tests, 100% 通过)
- `server.js` - Static server on port 8888

## Skills

### HTML/JS 开发注意事项

1. **语法兼容性**
   - 避免使用 ES6+ 高级语法（如模板字符串、箭头函数解构），使用 ES5 语法以保证兼容性
   - 使用 `function() {}` 替代箭头函数
   - 使用字符串拼接 `'a' + b + 'c'` 替代模板字符串 `` `a${b}c` ``
   - 使用 `arr.concat([x])` 替代 `[...arr, x]`

2. **调试技巧**
   - 修改代码后务必验证语法：`node -e "new Function(jsCode)"`
   - 浏览器报"Unexpected end of input"通常是缺少闭合括号/花括号
   - 使用浏览器控制台 `console.log()` 定位问题

3. **连连看核心逻辑**
   - **路径搜索**：BFS 算法，支持绕过障碍物
   - **边框外连线**：将网格边界扩展为 -1 和 ROWS/COLS，允许路径走出边界
   - **坐标转换**：虚拟坐标（-1 或 ROWS）需要转换为实际屏幕坐标进行连线绘制

4. **常见问题排查**
   - 页面空白/灰色：检查 JS 语法错误或 `initGame()` 是否正确调用
   - 无法消除：检查 `findPath` 函数的障碍物判断逻辑
   - 连线不显示：检查 `getCellPos` 是否正确处理边界外坐标

5. **代码组织**
   - 保持 `findPath`、`drawLine`、`getCellPos` 等核心函数职责单一
   - 消除操作需要同时更新 board 数据和 DOM 元素