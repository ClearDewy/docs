---
title: 2. MCU、启动与裸机固件
date: 2026-09-05
updated: 2026-09-06
type: overview
status: learnable
track: embedded
categories: [嵌入式]
tags: [MCU, Startup, Bare Metal, GPIO]
description: 从 MCU 资源地图、复位启动和链接布局进入寄存器、GPIO、构建、烧录与调试闭环。
---

# 2. MCU、启动与裸机固件

MCU 把 CPU、Flash、SRAM、时钟、GPIO 和多种外设集成在一颗芯片中。本章回答：**上电后第一条指令从哪里来，一行 GPIO 代码怎样最终改变引脚？**

固定实操先使用 Pico 板载 LED 与 GP15 镜像输出，完成构建、烧录和测量；按钮输入留给外设章节。

| 顺序 | 页面 | 完成证据 |
| ---: | --- | --- |
| 1 | [C 与构建衔接](/embedded/mcu-bare-metal/c-build-bridge) | 能解释位操作、编译、链接和烧录 |
| 2 | [怎样阅读 MCU 资源地图和数据手册](/embedded/mcu-bare-metal/mcu-map-and-datasheet) | 能为封装引脚、内存地址和外设能力找到权威来源 |
| 3 | [复位、启动、链接与 GPIO 怎样闭环](/embedded/mcu-bare-metal/startup-linking-and-gpio) | 能追踪 Reset_Handler 到引脚电压 |
| 4 | [裸机固件证据实验](/embedded/mcu-bare-metal/firmware-evidence-lab) | 能设计构建、烧录、断点、寄存器和波形证据 |
| 5 | [Pico 编译、烧录与测量](/embedded/mcu-bare-metal/pico-blink-lab) | ELF/UF2 构建与待实测记录 |
| 6 | [MCU 与裸机速查](/embedded/mcu-bare-metal/reference) | 查询启动对象、存储区和 GPIO 操作 |
| 7 | [复习与验收](/embedded/mcu-bare-metal/review) | 完成启动失败和 GPIO 无响应诊断 |

原理课用厂商无关伪寄存器，实操固定 Pico RP2040 与 SDK 2.1.1，不声称代码可直接运行于任意芯片。真实实验必须绑定芯片型号、封装、板卡修订、工具链和参考手册版本。

完成后进入[外设与串行通信](/embedded/peripherals-and-buses)。
