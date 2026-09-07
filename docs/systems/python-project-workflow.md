---
title: 从浏览器练习进入本地 Python 项目
date: 2026-09-06
updated: 2026-09-06
type: lesson
status: learnable
track: systems
prerequisites: [能阅读简单 Python 函数、循环和列表]
outcomes: [能定位项目目录与解释器, 能安装锁定依赖并运行脚本, 能从 traceback 定位失败行]
estimated: 30min
categories: [系统工程]
tags: [Python, uv, Environment]
description: 为本地模型实验建立固定 Python 环境，区分终端、解释器、项目目录、依赖和输出文件。
---

# 从浏览器练习进入本地 Python 项目

课程默认你掌握数学与线性代数。这里补的是**怎样运行一个项目**：数学公式中的张量并不要求重新学加减乘除，但本地脚本需要找到正确的解释器、依赖和工作目录。

如果已经会创建环境、运行脚本和阅读 traceback，直接完成文末自检，再进入实验。

## 先分清四个位置

| 位置 | 用途 | 本项目例子 |
| --- | --- | --- |
| 终端 | 输入操作系统命令 | `uv sync --extra cpu --frozen` |
| Python 文件 | 保存要执行的代码 | `examples/python/tiny_transformer.py` |
| 项目工作目录 | 相对路径从这里开始 | 同时包含 `pyproject.toml` 与 `docs/` 的目录 |
| 虚拟环境 | 隔离当前项目的库 | `.venv` |

终端出现 `>>>` 表示已经进入 Python 交互解释器；此时不要输入 `uv sync`。输入 `exit()` 返回系统终端。命令前不需要手打示例中的提示符。

## 下载仓库并确认目录

安装 [Git](https://git-scm.com/downloads) 与 [uv](https://docs.astral.sh/uv/getting-started/installation/) 后，重新打开终端：

```bash
git clone https://github.com/ClearDewy/docs.git
cd docs
uv --version
```

如果已经有仓库，直接进入该目录，避免又克隆一层 `docs/docs`。用编辑器打开它，应看见 `pyproject.toml`、`uv.lock`、`examples/` 和 `docs/`。

还未发布到远端的新文章和脚本，应使用包含它们的本地工作副本；运行前先确认目标文件存在。

## 创建固定环境

本项目锁定 Python 3.12 与 PyTorch 2.13.0。Windows/Linux：

```bash
uv sync --extra cpu --frozen
uv run --extra cpu --frozen python -c "import sys, torch; print(sys.version); print(torch.__version__)"
```

Apple Silicon Mac：

```bash
uv sync --extra mps --frozen
uv run --extra mps --frozen python -c "import sys, torch; print(sys.version); print(torch.__version__)"
```

两个依赖组均从 PyTorch 官方 wheel 索引取包；Apple Silicon 的 wheel 身份与原 PyPI 包 SHA256 一致，避免默认下载源过慢时更换包版本。

`mps` 是仓库依赖组的名字；tiny Transformer 脚本仍固定在 CPU 上运行，便于验证。Intel Mac 未包含在这份 PyTorch 环境矩阵中，请使用 Linux/Windows 环境或先做浏览器实验。

`--frozen` 使用仓库现有锁文件，不自动换版本。第一次需要下载 Python/依赖；后续实验不下载模型或数据。无需运行裸 `pip install torch`，否则容易装到另一个解释器里。

## 将代码对象接回文章

- `list` / `dict`：保存样本与配置，如 `TRAIN_TEXTS`、`CONFIG`；
- `def`：声明一个处理步骤，传入参数后才执行；
- `class TinyLM(nn.Module)`：把层与可训练参数组织成一个模型；
- `tensor.shape`：检查轴长度；`reshape` / `transpose` 对应张量课的轴操作；
- `assert`：条件不满足就停止，防止错误结果继续冒充成功；
- `if __name__ == '__main__'`：直接运行文件时调用入口，导入测试时不自动开始训练。

不认识这些语法时先查 [Python 官方教程](https://docs.python.org/3/tutorial/)，重点读控制流、数据结构、模块和类。回到本项目后，应能找到脚本的输入、入口与输出，而非逐行背诵框架 API。

## 报错时如何确定下一步

| 现象 | 检查 | 具体动作 |
| --- | --- | --- |
| `uv: command not found` | 工具是否安装、终端是否刷新 PATH | 重开终端，执行 `uv --version` |
| 找不到 `pyproject.toml` / 脚本 | 工作目录 | 回到同时包含 `docs/` 与 `examples/` 的根目录 |
| `No module named torch` | 是否用错解释器/依赖组 | 使用上面的 `uv run --extra … --frozen` 命令 |
| 下载失败 | 网络、证书、磁盘空间 | 保留原错误；恢复网络后重跑相同命令 |
| `AssertionError` | traceback 最后一个本项目文件位置 | 看该断言检查的是输入、mask、loss 还是恢复 |
| shape 不匹配 | 首个出错算子的两侧 shape | 打印输入、权重、输出轴，而不是试着乱加 reshape |

读 traceback 先看最后一行错误类型，再向上找最近的本项目文件与行号；库内部长调用栈通常不是第一处要修改的地方。

## 自检与下一步

1. 在终端打印 Python 与 torch 版本；
2. 运行 `uv run --frozen python examples/python/quickstart.py`，应看到 3 次记录、135 分钟；
3. 解释为什么 `python` 与 `uv run python` 可能指向不同环境；
4. 找到 `artifacts/`：训练前它可以不存在，训练后保存 checkpoint，可删除自己的实验产物来重做。

第 3 题答案：裸 `python` 由 PATH 决定，`uv run` 根据当前项目选择环境。进入[tiny Transformer 实验](/ai/foundation-models/tiny-transformer-lab)。
