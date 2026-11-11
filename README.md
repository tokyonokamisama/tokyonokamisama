# UNIT-01 Birthday / 初号机生日特别篇

一个通用的 EVA 标题卡风格生日网站模板：紫色 × 荧光绿、深圳夜景、三秒开场倒数、Canvas 烟花、年龄星光，以及三封来自未来的信。

## 制作专属祝福

打开网站，点击右上角「制作一份祝福」，填写姓名和年龄，即可生成专属链接。

收件人信息只存在 URL 的 `#` 片段中，由浏览器读取。源码不包含真实收件人的名字，没有后端、分析脚本、Cookie 或本地持久化。分享链接时，能看到链接的人也能看到收件人信息；网页不会把片段主动发给服务器。

支持通过 `#name=收件人&age=20` 传入信息；不带参数时显示「亲爱的你」。姓名通过 `textContent` 渲染，最多 24 个字符；年龄支持 1 到 120。

## 部署

纯 HTML / CSS / JavaScript，无依赖、无构建步骤。静态资源都在 `docs/`。

GitHub Pages 设置：选择 `Deploy from a branch` → 模板所在分支（本仓库为 `birthday-template-unit01`）→ `/docs`。也可以把 `docs/` 的内容上传至任意静态托管平台。

本地预览：在 `docs/` 目录运行 `python -m http.server 8080`。

默认关闭声音；点击音频按钮才启动合成背景音。开启系统「减少动态效果」时会跳过倒数与粒子动画，直接显示祝福。

## 创意参考

- [ayusharma/birthday](https://github.com/ayusharma/birthday)：分步开启生日场景。
- [Martarion-Code/Countdown-Birthday-and-Fireworks-Animation](https://github.com/Martarion-Code/Countdown-Birthday-and-Fireworks-Animation)：倒数后绽放烟花。
- [0xSabdadev/Birthday-Gift-with-Fireworks](https://github.com/0xSabdadev/Birthday-Gift-with-Fireworks)：开启礼物的仪式感。

以上仅作为互动概念参考，未复制项目代码。

## 素材与许可

城市照片：Sparktour，*Civic Center, Shenzhen Lianhuashan Park (2018.9) Night*，Wikimedia Commons，[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)。[原图](https://commons.wikimedia.org/wiki/File:Civic_Center,_Shenzhen_Lianhuashan_Park_(2018.9)_Night.jpg)未修改，仅由 CSS 在显示时调色。

字体与矢量字形：Noto Serif SC Heavy，SIL Open Font License 1.1，许可见 `docs/assets/FONT-LICENSE.txt`。

独立制作的同人视觉模板，与相关动画版权方无隶属关系。原创页面代码采用 MIT 许可；照片和字体保留各自许可。
