const fs = require('fs');
const path = require('path');
const { split } = require('pinyin-split');
const { spellInfo } = require('cnchar');

let n = 0;

const cmds = process.argv.slice(2);
if (cmds.length < 1) return console.error('[Error] 参数请带上"词库路径/文件名"!');
if (!fs.existsSync(cmds[0])) return console.error(`[Error] 文件"${cmds[0]}"不存在!`);

const contrastPath = './flypy.json';
const contrastFile = fs.readFileSync(contrastPath, 'utf8');
const contrast = JSON.parse(contrastFile);

const dictsPath = cmds[0];
let dicts = fs.readFileSync(dictsPath, 'utf8');
let temp = '';
const flag = '...';
if (dicts.includes(flag)) {
  const index = dicts.indexOf(flag);
  temp = dicts.substring(0, index + flag.length + 2);
  dicts = dicts.slice(index + flag.length + 2);
}
const result = temp + multiProcess(dicts);
const { ext, name } = path.parse(dictsPath);
const outName = `${name}_out${ext}`;
fs.writeFileSync(outName, result, 'utf8');
console.log(`[INFO] ${outName}`);

function multiProcess(dicts) {
  const dictsList = dicts.trim().split('\n');
  const result = [];
  for (const dict of dictsList) {
    n++;
    result.push(replaceSrc(dict));
  }
  return result.join('\n');
}

function replaceSrc(input) {
  let [cn, spell] = input.split(/\s/i);
  const spellSplice = splitReplaceWords(spell.trim()).join('');
  return cn + '\t' + spellSplice;
}

function splitReplaceWords(spell) {
  if (spell.length <= 2) return [spell];

  const words = split(spell);

  if (spell.startsWith('nv')) words[0] = 'nv';
  if (spell.endsWith('nv')) words[words.length - 1] = 'nv';

  const result = [];
  for (const word of words) {
    if (word.length <= 2 && !/^[aoe]{1}$/.test(word)) {
      result.push(word);
      continue;
    }
    const { initial, final } = spellInfo(word);
    result.push(replaceWords(initial, final));
  }

  return result;
}

function replaceWords(initial, final) {
  if (!initial) {
    if (final === 'ang') return 'ah';
    return final.repeat(2);
  }
  let result = '';
  result += initial.length === 1 ? initial : contrast['initial'][initial];
  result += final.length === 1 ? final : contrast['final'][final];
  return result;
}
