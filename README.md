![Header Image](https://socialify.git.ci/MCSLTeam/MCServerLauncher-Future-Web/image?description=1&descriptionEditable=Future%20version%20of%20MCSL.%20Redefined%2C%20Versatile%2C%20Easy%20to%20use.&font=Jost&forks=1&language=1&logo=https%3A%2F%2Fimg.fastmirror.net%2Fs%2F2024%2F07%2F24%2F66a0f36d0242c.png&name=1&pattern=Circuit%20Board&stargazers=1&theme=Auto)  
English | [中文](https://github.com/MCSLTeam/MCServerLauncher-Future-Web/blob/master/README_ZH.md)  
</br>
This repository only includes sources of the Web Panel. If you want to know more about the Daemon and the WPF Desktop Launcher, just click [here](https://github.com/MCSLTeam/MCServerLauncher-Future).

## Feature

**Efficient Instance Setup**: Simplified methods for creating new server instances.

**Console Program Compatibility**: Supports a wide range of console applications.

**Multi-instance Management**: Control multiple servers simultaneously from a single interface.

## Overview

MCServerLauncher Future is the next generation of server management software, providing an intuitive interface for setting up, monitoring, and controlling multiple game servers and console applications. It's the evolution of [MCServerLauncher 2](https://github.com/MCSLTeam/MCSL2), offering enhanced compatibility and efficiency.

## Components

[Daemon](https://github.com/MCSLTeam/MCServerLauncher-Future/tree/master/MCServerLauncher.Daemon): The core service built with .NET 6.0 C#, delivering robust performance and flexibility.

[Web Panel](https://github.com/MCSLTeam/MCServerLauncher-Future-Web): A browser-accessible dashboard, ideal for non-Windows users.

[WPF Desktop Launcher](https://github.com/MCSLTeam/MCServerLauncher-Future/tree/master/MCServerLauncher.WPF.Main): A Windows-specific interface for connecting to daemons.

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

To report issues or suggest improvements, please [open an issue](https://github.com/MCSLTeam/MCServerLauncher-Future/issues/new/choose) or [submit a pull request](https://github.com/MCSLTeam/MCServerLauncher-Future/compare).

## Contact

Email: [services@mcsl.com.cn](mailto:services@mcsl.com.cn)

QQ Group 1: [733951376](https://qm.qq.com/q/WtVCQWSBEe)

QQ Group 2: [819067131](https://qm.qq.com/q/EXBE6a5CF4)

## Open Source License

This project is distributed under the [GNU General Public License Version 3.0](https://github.com/MCSLTeam/MCServerLauncher-Future/blob/master/LICENSE).

## Copyright

Copyright © 2022-2024 MCSLTeam. All rights reserved.
