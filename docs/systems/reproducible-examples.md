---
title: 可复现的代码示例
date: 2026-09-02
categories:
  - 系统工程
tags:
  - 工程实践
  - Python
description: 使用统一的项目环境，在本地运行并核对博客代码示例。
---

# 可复现的代码示例

博客中的代码很容易随依赖和语言版本变化而失效。这个项目把关键示例放在 `examples/`，修改示例或相关课程时，在本地执行对应检查。GitHub Actions 只负责文档站点构建与发布。

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class StudySession:
    topic: str
    minutes: int


sessions = [
    StudySession("Python", 45),
    StudySession("Systems", 60),
    StudySession("Writing", 30),
]

total_minutes = sum(item.minutes for item in sessions)
assert total_minutes == 135
print({"sessions": len(sessions), "minutes": total_minutes})
```

当前示例位于 `examples/python/quickstart.py`。在仓库根目录运行 `uv run --frozen python examples/python/quickstart.py`，或使用 `npm run check:python` 检查基础示例。断言失败时应修正代码或文章输出；发布流程不自动执行这些实验。

## 维护约定

- 示例应当确定性执行，不依赖随机网络响应。
- Python 外部依赖统一在根目录 `pyproject.toml` 声明，通过 `uv.lock` 锁定。
- 文章展示的结果应和脚本输出一致。
- 较慢的实验应缓存产物，并注明生成环境与日期。
