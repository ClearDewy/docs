---
title: 使用 Pexels 官方 API 建立带出处的素材清单
date: 2026-09-09
updated: 2026-09-09
type: lab
status: learnable
track: photography
categories: [摄影]
tags: [摄影学习, 视觉表达]
description: 通过离线样例或官方 API 生成可导入参考图板的带出处素材清单
prerequisites: [/photography/references]
outcomes: [通过离线样例或官方 API 生成可导入参考图板的带出处素材清单]
estimated: 30min
---

# 使用 Pexels 官方 API 建立带出处的素材清单

## 实验目标、环境与边界

本实验把少量摄影参考的来源、作者、使用条件与缩略图整理为本地清单，再导入[参考图板](/photography/references)。需要 Node.js 20 或更新版本，并在本仓库根目录执行命令。预计 30 分钟。脚本仅调用 Pexels 官方搜索接口，不解析任意摄影网站、不绕过登录和限流，也不把素材集合发布为图库或壁纸服务。

参考来源核对日期为 2026-09-09：[官方 API 文档](https://www.pexels.com/api/documentation/)、[Pexels License](https://www.pexels.com/license/)。API 使用还需遵循其展示来源和摄影师等要求；图片免费不代表可以冒充背书、出售未修改复制品或忽略人物与商标的其他权利。脚本保留作者及平台链接，使用前需再次核对当前条款。

## 先理解三个文件

`collect-pexels.mjs` 是本地 Node.js 脚本；`materials.json` 是给图板读取的结构化清单；`ATTRIBUTION.md` 是给人阅读的出处说明。JSON 不是照片本身的通用授权书，它只把来源证据保存下来。默认只采集一页元数据；`--download` 才会下载官方 medium 缩略图，并将其内嵌到清单，供本地图板显示。

**API** 是服务提供的结构化接口。这里传入关键词，服务返回图片 id、作者、来源页和多种尺寸地址。**环境变量**是只在本地进程环境中提供的配置；API Key 放在 `PEXELS_API_KEY`，不会写进浏览器代码、清单或日志。不要把密钥填写到网站输入框或提交进 Git。

## 无密钥也能完成的固定实验

从仓库根目录运行，输出目录请使用尚未存在内容的新目录：

```bash
node --version
node scripts/tests/photography.mjs
node scripts/tests/photography-collector.mjs
node scripts/photography/collect-pexels.mjs --fixture scripts/photography/fixtures/pexels-search.json --query "golden hour rocks" --limit 1 --out /tmp/photography-fixture-01
```

预期控制台显示保存 1 条离线示例；目录中出现 `materials.json` 和 `ATTRIBUTION.md`。固定 fixture 取自官方文档 Photo Resource 示例，id 为 2014422，作者 Joey Farina，作品描述为 Brown Rocks During Golden Hour。它只是模拟返回结构，不声称是本次实时搜索的结果，也不会访问网络下载图片。

在图板中选择「导入图板 / 采集清单」，打开 `/tmp/photography-fixture-01/materials.json`。应出现作品、作者、来源链接和采集信息，观察与实践想法为空。打开来源自己查看，再填写；此步骤验证数据连接，并没有伪造你的参考分析。

## 配置自己的密钥并搜索

到 Pexels 官方页面申请自己的 API Key。在终端里安全输入，输入内容不会显示出来。下面用终端的隐藏输入读取密钥，避免把密钥直接打进 shell 历史；也可以使用自己的本地密钥管理器设置 `PEXELS_API_KEY`。

macOS 默认 zsh 可执行：

```zsh
read -s 'PEXELS_API_KEY?Pexels API Key: '
export PEXELS_API_KEY
node scripts/photography/collect-pexels.mjs --query "mountain landscape" --limit 6 --out /tmp/photography-pexels-01
unset PEXELS_API_KEY
```

这里的 `read -s` 是隐藏输入的 zsh 命令，不是 Node 代码；其他 shell 请采用对应的隐藏输入方式。密钥只保留到 `unset`，命令执行期间不会出现在参数或输出里。预期生成最多 6 条真实搜索结果；搜索返回数量可能更少，也可能为 0，不把某个结果顺序写死为测试答案。

## 可直接看到图片的清单

如果希望导入后立即显示官方缩略图，在密钥已通过环境变量配置的终端中运行：

```bash
node scripts/photography/collect-pexels.mjs --query "mountain landscape" --limit 6 --download --out /tmp/photography-pexels-images-01
```

脚本只接受 `images.pexels.com` 的 HTTPS 图片地址，不跟随重定向，也不会把 API Key 转发给图片域名。它把缩略图存为 `pexels-<id>.jpg/png/webp`，同时内嵌到 `materials.json`；导入图板后图片无需再访问远程服务器。该下载用于用户主动采集的本地参考素材，不是绕过网页图片展示限制。

下载模式最多 6 张，每张内嵌前最多 400KB，总内嵌数据控制在图板可导入的范围内；超过上限会报错，不会悄悄丢图。仅元数据模式 `--limit` 可设 1–30。图板合并后超过 100 条或约 3.5MB 会拒绝，先导出当前图板并整理条目，再导入下一批。不要用一份巨大 JSON 代替有选择的参考分析。

## 判断输出是否正确

打开 `ATTRIBUTION.md`，确认每条包含摄影师、来源页面、作者页面与许可链接。打开图板，确认可见缩略图与来源页面对应，并补全观察和一个具体拍摄动作。导出图板，再次导入时应保留来源、平台、采集时间与查询词；这些字段让你知道这份参考从哪里来，而不是让它自动成为可商用素材。

仓库测试对固定输入核查字段、来源域名、重复 id、离线无网络、API 请求的 Authorization 与限流错误；图片下载路径用模拟响应验证，不需要真实密钥。真实 API 结果、实际配额和账户权限需要你运行时确认。不要把 fixture 通过当成真实 API 已经成功采集。

## 失败排查、清理与重跑

| 提示 | 含义与下一步 |
| --- | --- |
| 缺少 PEXELS_API_KEY | 当前终端未配置密钥；先跑 fixture，或用隐藏输入配置 |
| HTTP 401 / 403 | 凭据或权限不被接受；到官方账户检查，不反复盲试 |
| HTTP 429 | 触发限流；本次停止，按服务给出的配额安排稍后重试 |
| 地址不符合预期域名 | 返回数据无法被安全用于本工具；停止并核查响应来源 |
| EEXIST | 输出文件已存在；换一个新目录，避免覆盖之前证据 |
| 下载中途失败 | 已下载文件可能仍在输出目录，未完成清单不要导入；检查后换新目录重跑 |
| 图板导入超限 | 导出现有图板，删除部分条目后再合并；不要盲目加大浏览器缓存 |

脚本不自动翻页、不自动重试、不绕过限制。临时目录由你确认内容已备份后删除；仓库无需保留自己的密钥、私有参考照片或批量采集结果。

## 自测与参考答案

1. fixture 成功是否证明你的 API Key 有效？
2. 图片来源地址能否替代摄影师与来源页面署名？
3. 参考图板里只有空观察的 6 张图，实验就完成了吗？

<details><summary>答案</summary>

1. 不能。fixture 不读取真实网络，目的是确定性检查数据处理。
2. 不能。图片文件地址不等于作者归属，需保留来源页、作者、许可和具体使用条件。
3. 还没有。采集仅完成素材准备；至少为一张补充三条可见事实和一个可执行动作，并进入实拍验证。

</details>

前置课：[参考图分析](/photography/references)；完成后回到[拍摄与复盘](/photography/practice)。采集工具的价值取决于它能否促成下一次更明确的观察与拍摄。
