---
title: 裸机固件证据实验
date: 2026-09-05
updated: 2026-09-06
type: lab
status: learnable
track: embedded
chapter: mcu-bare-metal
prerequisites: [/embedded/mcu-bare-metal/startup-linking-and-gpio]
outcomes:
  - 能设计从构建产物到物理引脚的分层证据
  - 能区分浏览器启动模型与真实板卡验证
estimated: 60min
categories: [嵌入式]
tags: [Lab, Firmware, Debug, Evidence]
description: 使用启动演示和可迁移检查表，为真实 MCU 的构建、烧录、启动、寄存器与波形建立证据链。
---

# 裸机固件证据实验

## 命题、环境和固定输入

目标不是“LED 亮了”，而是证明映像身份、启动路径、寄存器配置和物理输出相互一致。浏览器阶段使用 `Reset → 初始化 RAM → main → 开时钟 → 配 GPIO → 写输出 → 测引脚` 固定路径；真实硬件阶段固定使用下一页的 Pico RP2040 工程，并记录版本清单。

<ClientOnly><McuStartupDemo /></ClientOnly>

## 浏览器步骤

1. 重置后逐步前进，写下每一步新增证据；
2. 在“GPIO 时钟”前回答为何写 GPIO 可能无效；
3. 在“写输出”后区分寄存器证据与引脚证据；
4. 切换“LED 低电平点亮”，重新解释输出值与视觉状态。

## 真实板卡迁移模板

```text
构建：编译器版本、链接 map、ELF 哈希、Flash/SRAM 占用
烧录：目标芯片 ID、地址、校验结果
启动：Reset_Handler 和 main 断点、Fault 寄存器
配置：时钟、模式、复用、输出寄存器读回
物理：引脚电压/波形、LED 两端压降、供电电流
```

预期是五层证据能够指向同一个固件和同一个硬件。任何一层缺失都只能缩小结论范围。浏览器已验证状态顺序和极性切换；它不能验证某块板卡的地址、时钟、Flash 算法或电气输出。

## 清理与安全

真实实验首次上电启用限流，避免驱动未知负载；结束时保存日志、map、ELF 哈希和波形截图，恢复调试引脚与启动配置。不要通过反复烧录掩盖不能稳定复现的启动故障。

下一步：[Pico 编译、烧录与测量](/embedded/mcu-bare-metal/pico-blink-lab)，完成后再查速查页与章节验收。
