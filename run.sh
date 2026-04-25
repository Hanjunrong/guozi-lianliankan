#!/bin/bash
cd "$(dirname "$0")"

if ! command -v node &> /dev/null; then
  echo "错误: 未找到 Node.js"
  echo ""
  echo "请先安装 Node.js:"
  echo "  macOS: brew install node"
  echo "  Ubuntu: sudo apt-get install nodejs"
  echo "  Windows: https://nodejs.org/"
  exit 1
fi

echo "检查 JavaScript 语法..."
node -e "new Function(require('fs').readFileSync('game.js', 'utf8'));"
node -e "new Function(require('fs').readFileSync('ui.js', 'utf8'));"
echo "语法检查通过"

if [ $? -ne 0 ]; then
  echo "语法错误，退出"
  exit 1
fi

echo "运行测试用例..."
node game.test.js
if [ $? -ne 0 ]; then
  echo "测试失败，退出"
  exit 1
fi

echo ""
echo "测试通过，启动游戏服务器..."
node server.js