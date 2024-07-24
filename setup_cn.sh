#!/bin/bash

set_format() {
  echo -en "\033[0;$1m"
}

# 判断是否为sudoer
user_id=$(id -u)
if [ "$user_id" -eq 0 ]; then
  set_format 31
  echo "MCSL Future Web 安装程序需要sudo权限启动！"
  set_format 0
  exit 1
fi

# 清屏
echo -e "\033c"

# 标题
echo "================================================================================"
set_format 1
set_format 34
echo " __  __  ____ ____  _       _____      _                   __        __   _     "
echo "|  \/  |/ ___/ ___|| |     |  ___|   _| |_ _   _ _ __ ___  \ \      / /__| |__  "
echo "| |\/| | |   \___ \| |     | |_ | | | | __| | | | '__/ _ \  \ \ /\ / / _ \ '_ \ "
echo "| |  | | |___ ___) | |___  |  _|| |_| | |_| |_| | | |  __/   \ V  V /  __/ |_) |"
echo "|_|  |_|\____|____/|_____| |_|   \__,_|\__|\__,_|_|  \___|    \_/\_/ \___|_.__/ "

set_format 1
set_format 36
echo -n "MCSL Future Web"
set_format 0
echo " - 安装程序"

echo -en "此程序将为您安装 "
set_format 1
echo -n "MCSL Future Web"
set_format 0
echo -n " 与 "
set_format 1
echo -n "MCSL Future Daemon"
set_format 0
echo "！"

echo "================================================================================"

delete_dir() {
  # 检测是否存在
  if [ -d "$1" ]; then
    set_format 33
    echo -n "目录\""
    set_format 1
    set_format 33
    echo -n "$1"
    set_format 0
    set_format 33
    echo -n "\"已存在！是否清空并安装？（Y/n）："
    set_format 0
    read -r overwrite
    if [ "$overwrite" = "Y" ]; then
      echo "正在清空目录..."
      rm -rf "$1"
    else
      set_format 31
      echo "安装已取消！"
      set_format 0
      exit 1
    fi
  fi
}

create_dir() {
  delete_dir "$1"
  mkdir -p "$1"
}

# MCSL Future Web 安装路径
echo -n "请输入 MCSL Future Web 安装路径（默认为"
set_format 1
echo -n "/opt/mcsl/web"
set_format 0
echo -n "）："
read -r web_install_path
if [ -z "$web_install_path" ]; then
  web_install_path="/opt/mcsl/web"
fi
create_dir "$web_install_path"

# MCSL Future Daemon 安装路径
echo -n "请输入 MCSL Future Daemon 安装路径（默认为"
set_format 1
echo -n "/opt/mcsl/daemon"
set_format 0
echo -n "）："
read -r daemon_install_path
if [ -z "$daemon_install_path" ]; then
  daemon_install_path="/opt/mcsl/daemon"
fi
create_dir "$daemon_install_path"

# Node.js
node_version=$(node -v)
node_path=$(which node)
if [ -z "$node_version" ]; then
  set_format 22
  echo "未安装Node.js，开始安装Node.js"
  echo -n "请输入 Node.js 安装路径（默认为"
  set_format 1
  echo -n "/opt/mcsl/nodejs"
  set_format 0
  echo -n "）："
  read -r node_path
  if [ -z "$node_path" ]; then
    node_path="/opt/mcsl/nodejs"
  fi
  delete_dir "$node_path"

  node_version="v20.15.1"
  arch=$(uname -m)
  echo "正在下载Node.js...  版本：$node_version 架构：$arch"
  curl -O "https://nodejs.org/dist/$node_version/node-$node_version-linux-$arch.tar.xz"
  tar -xf "node-$node_version-linux-$arch.tar.xz"
  mv "node-$node_version-linux-$arch" "$node_path"
  rm "node-$node_version-linux-$arch.tar.xz"
  set_format 32
  echo "Node.js安装成功！"
  set_format 0
else
  echo -n "检测到已安装Node.js，版本："
  set_format 1
  echo -n "$node_version"
  set_format 0
  echo "，已跳过Node.js安装"
fi

# MCSL Future Web
echo "开始安装 MCSL Future Web"
curl -o "MCSL-Future-Web.zip" "https://github.com/MCSLTeam/MCServerLauncher-Future-Web/releases/xxx"
tar -xf "MCSL-Future-Web.zip" -C "$web_install_path"
rm "MCSL-Future-Web.zip"
set_format 32
echo "MCSL Future Web 安装成功！"
set_format 0

# MCSL Future Daemon
echo "开始安装 MCSL Future Daemon"
curl -o "MCSL-Future-Daemon.zip" "https://github.com/MCSLTeam/MCServerLauncher-Future-Daemon/releases/xxx"
tar -xf "MCSL-Future-Daemon.zip" -C "$daemon_install_path"
rm "MCSL-Future-Daemon.zip"
set_format 32
echo "MCSL Future Daemon 安装成功！"
set_format 0

# 配置 systemctl
echo "正在配置 systemctl"
echo "[Unit]
      Description=MCSL Future Daemon
      After=network.target

      [Service]
      Type=simple
      ExecStart=???
      Restart=always
      RestartSec=10

      [Install]
      WantedBy=multi-user.target
      "> /etc/systemd/system/mcsl-future-daemon.service

echo -n "请输入 MCSL Future Web 服务器端口（默认为"
set_format 1
echo -n "11451"
set_format 0
echo -n "）："
read -r web_port
if [ -z "$web_port" ]; then
  web_port="11451"
fi

echo "[Unit]
      Description=MCSL Future Web
      After=network.target

      [Service]
      Type=simple
      ExecStart=$node_path/bin/node $daemon_install_path/server/index.mjs
      Restart=always
      RestartSec=10
      Environment=\"PORT=$web_port\"

      [Install]
      WantedBy=multi-user.target
      "> /etc/systemd/system/mcsl-future-web.service

systemctl daemon-reload
set_format 32
echo "配置完成！"
set_format 0

echo "正在启动 MCSL Future Daemon"
systemctl start mcsl-future-daemon

echo "正在启动 MCSL Future Web"
systemctl start mcsl-future-web

# 安装完成
echo "================================================================================"
set_format 1
set_format 34
echo " __  __  ____ ____  _       _____      _                   __        __   _     "
echo "|  \/  |/ ___/ ___|| |     |  ___|   _| |_ _   _ _ __ ___  \ \      / /__| |__  "
echo "| |\/| | |   \___ \| |     | |_ | | | | __| | | | '__/ _ \  \ \ /\ / / _ \ '_ \ "
echo "| |  | | |___ ___) | |___  |  _|| |_| | |_| |_| | | |  __/   \ V  V /  __/ |_) |"
echo "|_|  |_|\____|____/|_____| |_|   \__,_|\__|\__,_|_|  \___|    \_/\_/ \___|_.__/ "
set_format 0
set_format 32
echo -e "\n安装完成！"

set_format 0
echo -en "感谢您使用 "
set_format 1
set_format 36
echo -n "MCSL Future Web"
set_format 0
echo "！"

echo -e "\n您可以通过浏览器访问 "
set_format 1
set_format 34
echo -n "http://<服务器IP>:$web_port"
set_format 0
echo -n " 以开始配置 MCSL Future Web"

echo -en "MCSL Future Daemon 的URL为 "
set_format 1
set_format 34
echo -n "ws://<服务器IP>:??"
set_format 0
echo "，您可以在 MCSL Future Web 中使用此URL连接 Daemon"

echo -en "请在系统防火墙内添加端口"
set_format 1
set_format 34
echo -n "$web_port"
set_format 0
echo -n " 和 "
set_format 1
set_format 34
echo -n "??"
set_format 0
echo " 以允许外网访问 MCSL Future Web 和 MCSL Future Daemon"

echo -e "\n启动命令（已自动启动）："
set_format 1
set_format 34
echo "systemctl start mcsl-future-daemon.service"
echo "systemctl start mcsl-future-web.service"
set_format 0

echo -e "\n开机自启动："
set_format 1
set_format 34
echo "systemctl enable mcsl-future-daemon.service"
echo "systemctl enable mcsl-future-web.service"
set_format 0

echo -en "\n如果您遇到问题，可在 "
set_format 1
set_format 34
echo -n "https://github.com/MCSLTeam/MCServerLauncher-Future/issues"
set_format 0
echo " 进行反馈"

echo -en "或者加入我们的QQ群 "
set_format 1
set_format 34
echo -n "733951376"
set_format 0
echo "！"
echo "================================================================================"
