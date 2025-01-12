中文 | [English](https://github.com/MCSLTeam/MCServerLauncher-Future-Web/tree/main#readme)  
</br>

## 特色

**高效**：顷刻即可创建新实例。

**全面**：支持大多数控制台应用程序的管理。

**多实例管理**：从一处同时控制多个实例。

## 概览

MCServerLauncher Future 是新一代的服务器管理软件，提供直观的界面来设置、监控和控制多个游戏服务器及控制台应用程序。作为 [MCServerLauncher 2](https://github.com/MCSLTeam/MCSL2) 的下一世代产品，拥有更好的性能、更灵活的架构、更简便的操作、更丰富的体验。

## 组件

[守护进程](https://github.com/MCSLTeam/MCServerLauncher-Future/tree/master/MCServerLauncher.Daemon)：使用 .NET 6.0 C# 构建的核心服务，提供强大的性能和灵活性。

[网页面板](https://github.com/MCSLTeam/MCServerLauncher-Future-Web)：可以通过浏览器访问的仪表板，非常适合非 Windows 用户，当然 Windows 用户也可使用。

[WPF桌面启动器](https://github.com/MCSLTeam/MCServerLauncher-Future/tree/master/MCServerLauncher.WPF)：针对 Windows 用户的最优解决方案。

## 系统需求

Node.js 18 及以上版本。

## 安装

### Windows

WIP

### Linux

```bash
sudo su -c "curl -sSL https://github.moeyy.xyz/https://raw.githubusercontent.com/MCSLTeam/MCServerLauncher-Future-Web/main/setup_cn.sh | bash"
```

## 贡献

要在本地运行项目，请使用以下命令：

```shell
pnpm i
pnpm dev # 测试服务器
pnpm run docs # 生成文档
pnpm build # 构建
```
