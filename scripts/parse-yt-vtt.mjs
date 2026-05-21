#!/usr/bin/env node
/**
 * parse-yt-vtt.mjs
 *
 * 把 YouTube auto-generated VTT 字幕解析成干净的 micro-segments。
 *
 * 输入痛点：
 *   - YouTube ASR vtt 是 rolling 格式：每个 cue 重复上一个 cue 的尾巴
 *   - 单词级时间码（<00:00:02.600><c> word</c>）混在文本里
 *   - 全小写、无标点
 *
 * 输出：
 *   - 干净的 line list（每行：start_sec, end_sec, text，去重去单词时间码）
 *   - 合并成的 micro-segments（每段 15-40s，按 "短停顿 / 时长上限" 切）
 *
 * 用法：
 *   node scripts/parse-yt-vtt.mjs <input.vtt> [--max=40] [--min=15]
 *
 * 输出 JSON 到 stdout，字段：
 *   {
 *     lines: [{ start, end, text }],
 *     segments: [{ idx, start, end, sentence_en, lines: [...] }]
 *   }
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const inputPath = args.find(a => !a.startsWith('--'));
const maxSec = parseFloat(args.find(a => a.startsWith('--max='))?.split('=')[1] || '40');
const minSec = parseFloat(args.find(a => a.startsWith('--min='))?.split('=')[1] || '15');

if (!inputPath) {
  console.error('usage: parse-yt-vtt.mjs <file.vtt> [--max=40] [--min=15]');
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, 'utf8');

// --- 1. 解析 cue ----------------------------------------------------------
function parseTime(s) {
  const [h, m, rest] = s.split(':');
  const [sec, ms] = rest.split('.');
  return (+h) * 3600 + (+m) * 60 + (+sec) + (+ms) / 1000;
}

// 解析每个 cue 的内部行：
//   YouTube ASR rolling 字幕的关键观察：
//     每个 cue 包含 1~2 行：
//       行 A（无 <hh:mm:ss> 标签）：上一帧的旧内容（用来 "持续显示"）
//       行 B（含 <hh:mm:ss><c>word</c> 单词级时间码）：本帧 **新增** 的内容
//     真正的新词在 "行 B" 里，且每个单词都有精确时间戳。
function parseTimedLine(line, cueStart, cueEnd) {
  // line 形如：'firstWord<00:00:02.600><c> I</c><00:00:03.600><c> have</c>...'
  // 把它拆成一组 (word, startSec) tuple。
  // 第一个 word 起始时间 = cueStart。
  const tokens = [];
  // 先找出所有 <hh:mm:ss.ms> 标记位置
  const re = /<(\d\d):(\d\d):(\d\d)\.(\d{3})>/g;
  const marks = [];
  let m;
  while ((m = re.exec(line)) !== null) {
    marks.push({
      idx: m.index,
      end: m.index + m[0].length,
      t: (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / 1000,
    });
  }
  if (marks.length === 0) {
    // 整行是单一词组（可能是 cue 的开头行，如 'hello'）
    const txt = line.replace(/<\/?c[^>]*>/g, '').trim();
    if (txt) tokens.push({ word: txt, t: cueStart });
    return tokens;
  }
  // 第一段：从开头到第一个标记前 = 起始词
  const firstWord = line.slice(0, marks[0].idx).replace(/<\/?c[^>]*>/g, '').trim();
  if (firstWord) tokens.push({ word: firstWord, t: cueStart });
  for (let i = 0; i < marks.length; i++) {
    const segStart = marks[i].end;
    const segEnd = i + 1 < marks.length ? marks[i + 1].idx : line.length;
    const word = line.slice(segStart, segEnd).replace(/<\/?c[^>]*>/g, '').trim();
    if (word) tokens.push({ word, t: marks[i].t });
  }
  return tokens;
}

// 从 vtt 块中提取所有带单词级时间码的 token（这是真正的 "新内容"）
const wordStream = [];
const blocks = raw.split(/\r?\n\r?\n/);
for (const block of blocks) {
  const m = block.match(/(\d\d:\d\d:\d\d\.\d{3})\s+-->\s+(\d\d:\d\d:\d\d\.\d{3})/);
  if (!m) continue;
  const cueStart = parseTime(m[1]);
  const cueEnd = parseTime(m[2]);
  const cueLines = block.split(/\r?\n/);
  const tsIdx = cueLines.findIndex(l => /-->/.test(l));
  if (tsIdx < 0) continue;
  const contentLines = cueLines.slice(tsIdx + 1);
  for (const cl of contentLines) {
    if (!/<\d\d:\d\d:\d\d\.\d{3}>/.test(cl)) continue; // 只处理带单词级时间码的行（新增）
    const tokens = parseTimedLine(cl, cueStart, cueEnd);
    for (const tk of tokens) wordStream.push(tk);
  }
}

// 去重（同 word + 同 t）
const seen = new Set();
const dedupWords = [];
for (const w of wordStream) {
  const k = w.t.toFixed(3) + '|' + w.word;
  if (seen.has(k)) continue;
  seen.add(k);
  dedupWords.push(w);
}
// 按时间排序
dedupWords.sort((a, b) => a.t - b.t);

// --- 2. word stream → 行 ---------------------------------------------
// 把单词流按 "短停顿" 切行：相邻 word 间隔 >= 0.6s 视为换行。
const lines = [];
let curLine = null;
for (let i = 0; i < dedupWords.length; i++) {
  const w = dedupWords[i];
  const next = dedupWords[i + 1];
  if (!curLine) {
    curLine = { start: w.t, end: next ? next.t : w.t + 0.5, words: [w.word] };
  } else {
    curLine.end = w.t;
    curLine.words.push(w.word);
  }
  const gap = next ? next.t - w.t : 999;
  if (gap >= 0.6 || !next) {
    // 推断词的结束时间（用下一词起点或固定回落）
    const wordEnd = next ? Math.min(next.t, w.t + 1.0) : w.t + 0.5;
    curLine.end = wordEnd;
    lines.push({
      start: +curLine.start.toFixed(3),
      end: +curLine.end.toFixed(3),
      text: curLine.words.join(' '),
    });
    curLine = null;
  }
}

const merged = lines;

// --- 3. 切 micro-segments ------------------------------------------------
// 启发式：连续合并 lines，直到累积时长达到 minSec~maxSec。
// 在 maxSec 之前优先在"较长静默"处断（>= 0.5s gap）。
function segmentLines(input, minS, maxS) {
  const segs = [];
  let cur = null;
  for (let i = 0; i < input.length; i++) {
    const l = input[i];
    if (!cur) {
      cur = { start: l.start, end: l.end, lines: [l] };
      continue;
    }
    const dur = l.end - cur.start;
    const gap = l.start - cur.end;
    const curDur = cur.end - cur.start;
    const shouldBreak =
      curDur >= maxS ||
      (curDur >= minS && gap >= 0.5) ||
      (curDur >= minS * 0.7 && gap >= 1.0);
    if (shouldBreak) {
      segs.push(cur);
      cur = { start: l.start, end: l.end, lines: [l] };
    } else {
      cur.end = l.end;
      cur.lines.push(l);
    }
  }
  if (cur) segs.push(cur);
  return segs.map((s, i) => ({
    idx: i + 1,
    start: +s.start.toFixed(2),
    end: +s.end.toFixed(2),
    duration: +(s.end - s.start).toFixed(2),
    sentence_en: s.lines.map(l => l.text).join(' ').replace(/\s+/g, ' ').trim(),
    lines: s.lines,
  }));
}

const segments = segmentLines(merged, minSec, maxSec);

console.log(JSON.stringify({
  source: path.basename(inputPath),
  total_cues: wordStream.length,
  total_lines: merged.length,
  total_segments: segments.length,
  total_duration: segments.length ? +segments[segments.length - 1].end.toFixed(2) : 0,
  lines: merged,
  segments,
}, null, 2));
