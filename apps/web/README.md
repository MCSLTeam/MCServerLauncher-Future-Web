English | [中文](https://github.com/MCSLTeam/MCServerLauncher-Future-Web/blob/main/README_ZH.md)  
</br>

## Feature

**Efficient Instance Setup**: Simplified methods for creating new server instances.

**Console Program Compatibility**: Supports a wide range of console applications.

**Multi-instance Management**: Control multiple servers simultaneously from a single interface.

## Overview

MCServerLauncher Future is the next generation of server management software, providing an intuitive interface for setting up, monitoring, and controlling multiple game servers and console applications. It's the evolution of [MCServerLauncher 2](https://github.com/MCSLTeam/MCSL2), offering enhanced compatibility and efficiency.

## Components

[Daemon](https://github.com/MCSLTeam/MCServerLauncher-Future/tree/master/MCServerLauncher.Daemon): The core service built with .NET 6.0 C#, delivering robust performance and flexibility.

[Web Panel](https://github.com/MCSLTeam/MCServerLauncher-Future-Web): A browser-accessible dashboard, ideal for non-Windows users.

[WPF Desktop Launcher](https://github.com/MCSLTeam/MCServerLauncher-Future/tree/master/MCServerLauncher.WPF): A Windows-specific interface for connecting to daemons.

## System Requirements

Node.js 18 or above.

## Installation

### For Windows

WIP

### For Linux

```bash
sudo su -c "curl -sSL https://raw.githubusercontent.com/MCSLTeam/MCServerLauncher-Future-Web/main/setup_en.sh | bash"
```

## Contribute

To run the project locally, please use the following command:

```shell
pnpm i
pnpm dev # start a dev server
pnpm run docs # generate docs
pnpm build # build for production
```