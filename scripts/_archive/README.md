# scripts/_archive/

旧的 generation / bundling / download 脚本归档区。这些脚本已被同目录下的新版本取代，
保留在仓库里仅供历史参考；正常 pipeline 不再需要它们。

| 归档文件                       | 取代者                                | 备注                                                                                  |
| ------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------- |
| `batch-generate-courses.mjs`   | `../generate-courses-v2.mjs`          | v2 在 header 中明确声明替代关系；改进了选段启发式与 distractor 多样性。               |
| `batch-download-subs.sh`       | `../retry-download-subs.sh`           | 并行版容易被 YouTube 限频；retry 版串行 + sleep 4s，是当前默认的下载方式。            |
| `bundle-bulk-import.mjs`       | `../bundle-unified.mjs`               | 旧版只 bundle listening；unified 同时支持 listening + reading + vocabulary。          |

如果以后这些脚本依然几个月没人用，可以直接删除（git 历史已永久保留）。
