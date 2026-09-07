---
title: 用固定 Pico 板完成编译、烧录与点灯测量
date: 2026-09-06
updated: 2026-09-06
type: lab
status: learnable
track: embedded
chapter: mcu-bare-metal
prerequisites:
  - /embedded/mcu-bare-metal/firmware-evidence-lab
  - /embedded/mcu-bare-metal/c-build-bridge
outcomes:
  - 能为 RP2040 构建 ELF 与 UF2 并通过 BOOTSEL 烧录
  - 能区分 GP 编号、物理引脚编号与板载 LED
  - 能记录实际波形并定位一次错误引脚或错误映像
estimated: 90min
categories: [嵌入式]
tags: [RP2040, Pico, C, GPIO, Lab]
description: 固定 Pico RP2040 和 SDK 2.1.1，提供完整工程、构建命令、烧录步骤、测量接线和失败排查。
---

# 用固定 Pico 板完成编译、烧录与点灯测量

现在把前面的启动模型落实到一个明确硬件。基线是 **Raspberry Pi Pico / Pico H，RP2040，非 W、非 Pico 2**；`PICO_BOARD=pico`。Pico H 带排针，适合后续面包板练习。首次只通过 USB 供电，使用板载 LED，无需外接 LED。预计学习与操作 90 分钟，首次工具下载另计。

本页提供可复现工程与预期测量步骤。**没有连接真实开发板完成实测，因此下面的亮灭、电压和周期均是待验收预期，不是本站的板级实测报告。** 只有你实际保存了结果，才能记录硬件实操通过。

## 器材与固定连接

| 物品 | 必需性 | 用途 |
| --- | --- | --- |
| Pico / Pico H（RP2040） | 必需 | 固定目标板 |
| 支持数据传输的 USB-A/C 转 Micro-USB 线 | 必需 | 供电、BOOTSEL 复制 |
| Mac / Windows / Linux 电脑 | 必需 | 构建与烧录 |
| 万用表、带绝缘夹的测试线 | 电压验收需要 | 测量 GP15 对 GND |
| 支持 3.3 V 输入的逻辑分析仪或示波器 | 周期验收需要 | 测量高低时间 |

| 信号 | Pico 位置 | 接什么 |
| --- | --- | --- |
| 板载 LED | GP25，经板载限流电阻与 LED 接地 | 不外接；软件高电平点亮 |
| 镜像测量输出 | GP15，物理引脚 20 | 仪表红表笔 / CH0 |
| 测量参考 | GND，物理引脚 18 | 仪表黑表笔 / 分析仪 GND |
| USB | Micro-USB 插座 | 电脑数据线 |

```text
电脑 ── USB 数据线 ── Pico
                       ├─ GP25 ─ 板载限流电阻/LED ─ GND
                       └─ GP15 ───── 仪表红表笔/CH0
                          GND ────── 仪表黑表笔/GND
```

从官方引脚图按标记定位，**GP15 不是物理引脚 15**。仪表用电压挡（黑线 COM、红线 VΩ），不将电流挡并在 GP15/GND 上。USB 是本实验唯一电源，先断电接好夹线再插 USB；不要向 GPIO 输入 5 V。

板载 LED 定义见 [SDK 2.1.1 的 pico.h](https://github.com/raspberrypi/pico-sdk/blob/2.1.1/src/boards/include/boards/pico.h)，引脚、供电和板级原理图见 [Pico 数据手册](https://datasheets.raspberrypi.com/pico/pico-datasheet.pdf)。

## 安装一次工具链

先获取包含本实验的博客仓库。以下命令均在仓库根目录运行，目录名中保留双引号处理空格。

Linux（Ubuntu/Debian）可安装：

```bash
sudo apt-get update
sudo apt-get install git cmake make gcc g++ gcc-arm-none-eabi libnewlib-arm-none-eabi libstdc++-arm-none-eabi-newlib
```

Mac 安装 CMake、Command Line Tools，以及 [Arm GNU Toolchain](https://developer.arm.com/downloads/-/arm-gnu-toolchain-downloads) 的 **arm-none-eabi** 版本；Apple Silicon 选 darwin-arm64，Intel 选 darwin-x86_64。Windows 可按 [Pico 官方 C/C++ 环境指南](https://www.raspberrypi.com/documentation/microcontrollers/c_sdk.html)安装工具与 Ninja，在配置好工具的终端中执行下文命令。

Mac 本次实际使用的 Apple Silicon 命令如下。先安装 [Homebrew](https://brew.sh/)；Command Line Tools 未安装时运行 `xcode-select --install` 并完成系统安装窗口。然后在仓库根目录执行：

```bash
brew install cmake
mkdir -p .pico-tools
curl -fL -o .pico-tools/toolchain.tar.gz https://github.com/xpack-dev-tools/arm-none-eabi-gcc-xpack/releases/download/v13.3.1-1.1/xpack-arm-none-eabi-gcc-13.3.1-1.1-darwin-arm64.tar.gz
tar -xf .pico-tools/toolchain.tar.gz -C .pico-tools
export PATH="$PWD/.pico-tools/xpack-arm-none-eabi-gcc-13.3.1-1.1/bin:$PATH"
```

新开终端后要重新执行这条 PATH 设置；它只是把本工程下载的交叉编译器加入当前终端搜索路径。Intel Mac 从同一发布页选择 darwin-x64，不使用 arm64 包。

SDK 固定 2.1.1；本次工具基线为 xPack GCC 13.3.1、CMake 3.31.6。系统包管理器可能安装更新版 CMake，请记录实际版本；如需严格复现且已安装 uv，可用 `uv tool run --from cmake==3.31.6 cmake` 替换后文每个 `cmake` 命令。安装后先确认：

```bash
cmake --version
arm-none-eabi-gcc --version
git --version
```

任意一个提示“找不到命令”就先修复 PATH，不要继续猜代码。Windows 还需 `ninja --version`；生成 UF2 的 picotool 可能在首次配置时下载并编译，因此需要可用的宿主机 C/C++ 构建工具与网络。

## 下载 SDK 与构建

Mac/Linux：

```bash
mkdir -p .pico-tools
git clone --depth 1 --branch 2.1.1 https://github.com/raspberrypi/pico-sdk.git .pico-tools/pico-sdk
git -C .pico-tools/pico-sdk submodule update --init lib/tinyusb
cmake -S examples/embedded/pico-blink -B examples/embedded/pico-blink/build -DPICO_BOARD=pico -DPICO_SDK_PATH="$PWD/.pico-tools/pico-sdk" -DCMAKE_BUILD_TYPE=Debug
cmake --build examples/embedded/pico-blink/build --parallel 2
```

Windows PowerShell：

```powershell
New-Item -ItemType Directory -Force .pico-tools
git clone --depth 1 --branch 2.1.1 https://github.com/raspberrypi/pico-sdk.git .pico-tools/pico-sdk
git -C .pico-tools/pico-sdk submodule update --init lib/tinyusb
$picoSdk = (Resolve-Path .pico-tools/pico-sdk).Path
cmake -S examples/embedded/pico-blink -B examples/embedded/pico-blink/build -G Ninja -DPICO_BOARD=pico "-DPICO_SDK_PATH=$picoSdk" -DCMAKE_BUILD_TYPE=Debug
cmake --build examples/embedded/pico-blink/build --parallel 2
```

SDK 已存在时不重复 clone；用 `git -C .pico-tools/pico-sdk describe --tags --exact-match` 确认版本。切换编译器或系统时用新 build 目录，避免旧 CMake 缓存串用。

构建结束应出现 `learning_blink.elf`、`learning_blink.uf2` 和 map 文件。

2026-09-06 本地构建记录：macOS arm64、CMake 3.31.6、xPack Arm GCC 13.3.1、SDK 2.1.1、Debug 配置；已生成 ELF/UF2。`arm-none-eabi-size` 报告 text=16832、data=0、bss=1596 字节。不同工具链/配置产物大小可以不同，不能要求哈希跨环境相同。Arm 官方下载较慢时，本次采用 [xPack 13.3.1-1.1 发布包](https://github.com/xpack-dev-tools/arm-none-eabi-gcc-xpack/releases/tag/v13.3.1-1.1)，解压后将 `bin` 加入 PATH；它是另一种工具链发行方式，版本应记录为 xPack。

ELF 用于符号/地址检查，UF2 才是本次复制到板卡的文件。记录 SDK commit：`bddd20f928ce76142793bef434d4f75f4af6e433`。

## 完整工程：两份文件

`main.c`：

<<< @/../examples/embedded/pico-blink/main.c

`CMakeLists.txt`：

<<< @/../examples/embedded/pico-blink/CMakeLists.txt

`gpio_init` 选择 GPIO 功能并初始化状态，`gpio_set_dir` 设置输出方向，`gpio_put` 修改输出，`sleep_ms` 让亮/灭持续一段时间。本例 `500+500 ms` 是约 1 秒的完整周期，不是 500 ms。SDK 负责启动与底层寄存器实现；本页不是自写 Boot ROM 或寄存器驱动。

## BOOTSEL 烧录

1. 拔下 Pico 的 USB；
2. 按住板上 **BOOTSEL**，插入 USB，出现 `RPI-RP2` 磁盘后松开；
3. 将刚构建的 `learning_blink.uf2` 复制到该磁盘；
4. 复制完成后磁盘应消失、板卡重新启动；
5. 观察板载 LED 是否约亮 0.5 秒、灭 0.5 秒；断电再上电，应运行同一固件。

这是 UF2 引导过程。程序未启用 USB 串口，因此运行后没有串口设备并不代表失败。只在 BOOTSEL 状态期望看到磁盘。

## 测量并建立证据

先观察 LED，再测 GP15。万用表刷新慢，闪烁时可能读到中间值；不要把它当成输出逻辑电平错误。要看稳定电压，可临时将两段等待都改为 3000 ms，重新构建、烧录，再分别记录低电平接近 0 V、高电平接近板上 3.3 V。

周期验收恢复 500 ms，使用分析仪观察约 1 Hz、约 50% 占空比。软件等待、时钟误差与调用开销会影响精确值，本实验不据此证明硬实时上界。保存原始波形，不只写“灯亮了”。

| 证据 | 你需要填入的实际内容 |
| --- | --- |
| 硬件身份 | Pico/Pico H、芯片、板卡标记 |
| 构建身份 | SDK commit、编译器版本、构建日志、UF2 哈希 |
| 启动观察 | 复制后磁盘是否消失、重上电是否运行 |
| 电压 | GP15 对 GND 的高/低读数、仪表型号 |
| 周期 | 高/低时间、采样率、波形文件 |
| 变式 | 改 250 ms 后周期是否约减半 |

Mac 用 `shasum -a 256 文件路径`，Linux 用 `sha256sum 文件路径`，PowerShell 用 `Get-FileHash 文件路径 -Algorithm SHA256` 记录 UF2 身份。

## 按证据排查故障

| 现象 | 操作与判断 |
| --- | --- |
| 没有 RPI-RP2 | 换数据线/直连 USB 口，确认插入时按住 BOOTSEL；先不修改源代码 |
| UF2 复制后 LED 不亮 | 确认不是 Pico W/Pico 2，确认复制文件时间与哈希，检查原理图与板载 GP25 |
| LED 正常，GP15 没变化 | 核对 GP15 与物理 20 号脚，检查黑线参考、镜像代码是否烧录 |
| 没有 UF2，只有 ELF | 查看 picotool 下载/构建错误；不要把 ELF 改后缀当 UF2 |

独立挑战：只把 `MEASURE_PIN` 改成 14，保持仪表仍接 GP15。LED 仍闪，但原测点不再是这个固件主动驱动的输出。你应通过源码、映像身份和引脚核对定位，而非断言悬空 GP15 必须读 0 V。恢复 15 并重做一次。

## 通过条件与后续

- **构建通过**：从两份源文件得到 ELF/UF2，并保留构建身份；
- **板级通过**：亲手烧录、重上电、记录电压与周期；
- **迁移通过**：独立修改半周期与测量脚，预测并解释结果。

没有测量工具时只记录点灯观察；尚未测量的格子留空。结束后拔 USB、取下测试线，保留源码与记录，删除不再需要的 build 产物即可重建。

后续按钮、定时器、中断和总线实验可继续沿用此板；第 3–7 章当前浏览器实验仍分别只验证教学模型，并不因本页存在而自动获得板级验证。进入[MCU 章节验收](/embedded/mcu-bare-metal/review)。
