---
title: 从 C 源码到 MCU 映像需要经过什么
date: 2026-09-06
updated: 2026-09-06
type: lesson
status: learnable
track: embedded
chapter: mcu-bare-metal
prerequisites: [/embedded/digital-systems/state-clock-cpu-memory]
outcomes: [能阅读 GPIO 代码中的类型与位操作, 能区分编译链接和烧录, 能定位构建失败所在阶段]
estimated: 35min
categories: [嵌入式]
tags: [C, Compiler, Linker]
description: 用一个 GPIO 位模式连接 C 表达式、交叉编译、链接产物和开发板烧录。
---

# 从 C 源码到 MCU 映像需要经过什么

你已经知道 CPU 通过地址读写外设。现在补上软件一侧：**编辑器中的 C 文本怎样变成 CPU 可以执行的指令**。默认具备数学基础；无需先学完一门完整 C 语言课程，但要能读懂下面的对象。

## 用一个字节理解位操作

```c
#include <stdint.h>
uint32_t outputs = 0;      // 一个 32 位无符号整数
const uint32_t pin = 3;    // 位编号从 0 开始
outputs |= (1u << pin);    // 把 bit 3 置 1，其余位保留
outputs &= ~(1u << pin);   // 把 bit 3 清 0，其余位保留
```

`1u << 3` 是 `0b1000`，十进制 8。`|` 是按位或，`&` 是按位与，`~` 对每一位取反；它们与逻辑判断的 `||`、`&&` 不同。`uint32_t` 明确宽度，`const` 表示不通过该对象修改值，`u` 表示无符号常量。

这段代码只修改内存中的变量，不会驱动任何真实引脚。实际外设还要靠芯片手册中的寄存器地址和 SDK 函数连接。

## 指针和 volatile 在哪里出现

```c
// 仅解释类型，不提供可直接写入的任意地址：
void write_register(volatile uint32_t *reg, uint32_t value) {
    *reg = value;
}
```

`reg` 保存地址，`*reg` 访问该地址指向的对象；`volatile` 要求编译器保留有外部效果的访问。它不能验证地址正确，也不提供锁或原子性。首次开发板实验先用 SDK 的 `gpio_put`，读懂手册后再追到对应寄存器，避免猜地址。

SDK 的 `.h` 头文件声明函数与类型，`.c` 文件给出实现；`#include` 让当前编译单元看见声明。`main` 是应用入口，但芯片先执行启动代码。

## 四步产物链

```text
main.c + 头文件
  → 交叉编译器：目标 ARM 指令与 .o
  → 链接器：启动代码、SDK 库、链接脚本合成 .elf
  → 转换器：生成用于指定引导程序的 .uf2
  → BOOTSEL USB 复制：固件写入板卡 Flash
```

- **交叉编译**：在 Mac/Windows/Linux 上生成 RP2040 的 ARM 指令；宿主机 `gcc` 不能代替 `arm-none-eabi-gcc`。
- **CMake**：读取依赖关系并生成构建规则，本身不是 C 编译器。
- **ELF**：含代码、地址、符号和调试信息；map 文件说明各段与符号布局。
- **UF2**：面向引导加载的块格式；双击它不会在电脑上运行 MCU 程序。
- **烧录**：将映像写入目标设备；修改源文件而未重新构建和烧录，不会改变板上行为。

## 给报错分类

| 错误 | 阶段 | 首先检查 |
| --- | --- | --- |
| 找不到 C 编译器 | 配置 | `arm-none-eabi-gcc --version` 与 PATH |
| `pico/stdlib.h` 不存在 | 编译 | SDK 路径与 CMake 配置，不要手抄一个同名头文件 |
| `undefined reference` | 链接 | 是否链接了对应 SDK 库、函数实现是否参与构建 |
| RAM/Flash overflow | 链接布局 | map 中哪个段占用过多 |
| ELF 有了但 UF2 没有 | 转换 | picotool 是否可用，转换是否成功 |
| UF2 成功复制但 LED 不亮 | 设备运行 | 板型、引脚、点亮极性、是否运行新映像 |

## 不看答案做一次迁移

`outputs=0b0011`，置位 bit 2 后是什么？接着只清 bit 0，结果是什么？为什么不能把这两个数直接写入任意 GPIO 寄存器？

<details><summary>答案</summary>

先得到 `0b0111=7`，再得到 `0b0110=6`。真实寄存器还有保留位、写一清零、地址和时钟前置等语义，不能按普通变量推断。相应限制由下一课的文档定位来确定。

</details>

下一步：[MCU 资源地图与数据手册](/embedded/mcu-bare-metal/mcu-map-and-datasheet)，之后在固定 Pico 板上使用同一套构建流程。
