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
node -e "
var fs = require('fs');
var html = fs.readFileSync('index.html', 'utf8');
var match = html.match(/<script src=\"game\.js\"><\/script>[\n\r\s]*<script>([\s\S]*?)<\/script>/);
if (!match) { throw new Error('无法提取内联脚本'); }
var script = match[1];
var open = (script.match(/{/g) || []).length;
var close = (script.match(/}/g) || []).length;
if (open !== close) { throw new Error('花括号不匹配: 开放' + open + ', 关闭' + close); }
new Function(script);
console.log('语法检查通过');
"

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