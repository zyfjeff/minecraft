// =============================================================================
// withTimeout — wrap a Promise with a hard upper bound.
//
// 在移动端浏览器（iOS Safari / Android Chrome）切换前后台时，正在进行的 fetch
// 请求可能被系统挂起，且回到前台后既不 resolve 也不 reject —— 这直接导致依赖
// `loaded` 标志的页面（VocabBook / StatsPage / Achievements 等）永远停在
// skeleton/loading 状态，必须手动刷新才能恢复。本工具用 Promise.race 给所有
// 关键 supabase 调用加一个上限，超时后让上层 catch+finally 正常翻转标志位。
// =============================================================================
export function withTimeout(promise, ms = 8000, label = 'request') {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`[withTimeout] ${label} timed out after ${ms}ms`)),
      ms,
    )
  })
  // Promise.resolve 兼容 supabase-js 的 thenable query builder。
  const wrapped = Promise.resolve(promise).finally(() => clearTimeout(timer))
  return Promise.race([wrapped, timeout])
}
