#!/bin/bash

set_format() {
  echo -en "\033[0;$1m"
}

# 判断是否为sudoer
user_id=$(id -u)
if [ "$user_id" -ne 0 ]; then
  set_format 31
  echo "MCSL Future Web requires sudo to start!"
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
echo " - Setup wizard"

echo -en "This setup wizard will install "
set_format 1
echo -n "MCSL Future Web"
set_format 0
echo -n " and "
set_format 1
echo -n "MCSL Future Daemon"
set_format 0
echo "!"

echo "================================================================================"

delete_dir() {
  # 检测是否存在
  if [ -d "$1" ]; then
    set_format 33
    echo -n "Directory\""
    set_format 1
    set_format 33
    echo -n "$1"
    set_format 0
    set_format 33
    echo -n "\"already exists! Would you like to empty it and continue installation? (Y/n): "
    set_format 0
    read -r overwrite
    if [ "$overwrite" = "Y" ]; then
      echo "Emptying directory..."
      rm -rf "$1"
    else
      set_format 31
      echo "Installation canceled!"
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
echo -n "Please enter MCSL Future Web installation path (Default: "
set_format 1
echo -n "/opt/mcsl/web"
set_format 0
echo -n "): "
read -r web_install_path
if [ -z "$web_install_path" ]; then
  web_install_path="/opt/mcsl/web"
fi
create_dir "$web_install_path"

# MCSL Future Daemon 安装路径
echo -n "Please enter MCSL Future Daemon installation path (Default: "
set_format 1
echo -n "/opt/mcsl/daemon"
set_format 0
echo -n "): "
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
  echo "Node.js not installed! Installing Node.js"
  echo -n "Please enter Node.js installation path (Default: "
  set_format 1
  echo -n "/opt/mcsl/nodejs"
  set_format 0
  echo -n "): "
  read -r node_path
  if [ -z "$node_path" ]; then
    node_path="/opt/mcsl/nodejs"
  fi
  delete_dir "$node_path"

  node_version="v20.15.1"
  arch=$(uname -m)
  echo "Downloading Node.js...  Version: $node_version Arch: $arch"
  curl -O "https://nodejs.org/dist/$node_version/node-$node_version-linux-$arch.tar.xz"
  tar -xf "node-$node_version-linux-$arch.tar.xz"
  mv "node-$node_version-linux-$arch" "$node_path"
  rm "node-$node_version-linux-$arch.tar.xz"
  set_format 32
  echo "Successfully installed Node.js!"
  set_format 0
else
  echo -n "Node.js already installed with version: "
  set_format 1
  echo -n "$node_version"
  set_format 0
  echo ". Skipping Node.js installation!"
fi

# MCSL Future Web
echo "Installing MCSL Future Web"
curl -o "MCSL-Future-Web.zip" "https://github.com/MCSLTeam/MCServerLauncher-Future-Web/releases/xxx"
tar -xf "MCSL-Future-Web.zip" -C "$web_install_path"
rm "MCSL-Future-Web.zip"
set_format 32
echo "Successfully installed MCSL Future Web!"
set_format 0

# MCSL Future Daemon
echo "Installing MCSL Future Daemon"
curl -o "MCSL-Future-Daemon.zip" "https://github.com/MCSLTeam/MCServerLauncher-Future-Daemon/releases/xxx"
tar -xf "MCSL-Future-Daemon.zip" -C "$daemon_install_path"
rm "MCSL-Future-Daemon.zip"
set_format 32
echo "Successfully installed MCSL Future Daemon!"
set_format 0

# 配置 systemctl
echo "Configuring systemctl"
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

echo -n "Please enter MCSL Future Web server port (Default: "
set_format 1
echo -n "11452"
set_format 0
echo -n "): "
read -r web_port
if [ -z "$web_port" ]; then
  web_port="11452"
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
echo "Successfully configured!"
set_format 0

echo "Starting MCSL Future Daemon"
systemctl start mcsl-future-daemon

echo "Starting MCSL Future Web"
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
echo -e "\nSuccessfully installed!"

set_format 0
echo -en "Thank you for choosing "
set_format 1
set_format 36
echo -n "MCSL Future Web"
set_format 0
echo "!"

echo -e "\nYou can access MCSL Future Web at "
set_format 1
set_format 34
echo -n "http://<Server IP>:$web_port"
set_format 0
echo -n " and start configuring it"

echo -en "The URL of MCSL Future Daemon is "
set_format 1
set_format 34
echo -n "ws://<Server IP>:??"
set_format 0
echo ". You can use this URL to connect to the daemon in MCSL Future Web"

echo -en "Please add the TCP ports ("
set_format 1
set_format 34
echo -n "$web_port"
set_format 0
echo -n " and "
set_format 1
set_format 34
echo -n "??"
set_format 0
echo ") to your firewall to allow external access"

echo -e "\nLaunch command (Already launched now):"
set_format 1
set_format 34
echo "systemctl start mcsl-future-daemon.service"
echo "systemctl start mcsl-future-web.service"
set_format 0

echo -e "\nAuto launch on boot:"
set_format 1
set_format 34
echo "systemctl enable mcsl-future-daemon.service"
echo "systemctl enable mcsl-future-web.service"
set_format 0

echo -en "\nIf you have any issues, please visit "
set_format 1
set_format 34
echo -n "https://github.com/MCSLTeam/MCServerLauncher-Future/issues"
set_format 0
echo " to feedback"

echo -en "Or join our QQ group: "
set_format 1
set_format 34
echo -n "733951376"
set_format 0
echo "!"
echo "================================================================================"
