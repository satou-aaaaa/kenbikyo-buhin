// 顕微鏡の部品あての問題を作る（ブラウザと node の両方で使う）。
// 中身は、香川県教育委員会の中学1年理科プリント（補充・発展）・神奈川県の教材「生物の観察」（解答）・横浜市立大綱中学校の課題・大野城市立中学校の入学前の学習（下の SRC。2026-11-17 に読んだ）で確かめたことだけ。
// 1問は、使い方の手順や説明を読んで、顕微鏡の部品（接眼レンズ・対物レンズ・反射鏡・しぼり・調節ねじ）を選ぶ。正解したら2段目「何をする部品？」を選ぶ。
// ルーペと双眼実体顕微鏡の部品は扱わない。
// 選び肢は、ほかの4つから選ぶ（やさしいは2つ、ふつう・むずかしいは3つ）。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ tag なら、どの端末でも同じ問題になる。
// KINDS・言い回しの並びは最後に足すだけにする（並べ替え・削除をすると過去の日の問題が変わる）。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];

  // 出典（画面の「なぜ」に出す）
  const SRC = {
    kgh: ["香川県教育委員会 中学1年理科 補充プリント「顕微鏡の使い方」", "https://www.pref.kagawa.lg.jp/documents/14703/j1_ri_ho_01.pdf"],
    kgh2: ["香川県教育委員会 中学1年理科 発展プリント「顕微鏡の使い方」", "https://www.pref.kagawa.lg.jp/documents/14703/j1_ri_ha_01.pdf"],
    kng: ["神奈川県の教材「生物の観察」（解答）", "https://www.pref.kanagawa.jp/documents/28773/576248.pdf"],
    yoko: ["横浜市立大綱中学校 中学1年理科の課題「顕微鏡の使い方と微生物」", "https://www.edu.city.yokohama.jp/school/jhs/ohtsuna/index.cfm/1,2545,c,html/2545/20200511-094424.pdf"],
    onojo: ["大野城市立中学校 新中学1年生 理科「顕微鏡の使い方」", "https://onojo.schoolweb.ne.jp/4020004/download/document/242190"],
  };

  // 答えになる5つ
  const CLASSES = ["接眼レンズ", "対物レンズ", "反射鏡", "しぼり", "調節ねじ"];

  // 2段目「何をする部品？」の3つ
  const GROUPS = {
    kakudai: { name: "拡大して見る", sub: "倍率が書いてある" },
    akarusa: { name: "明るさを調節する", sub: "光の量を変える" },
    pinto: { name: "ピントを合わせる", sub: "プレパラートとの間を変える" },
  };
  // 使う場面（「なぜ」に出す）
  const CATS = { kumitate: "組み立てるときと、倍率を変えるとき", akaru: "明るさを合わせるとき", awaseru: "ピントを合わせるとき" };
  // 答えごとの決まり。2段目・使う場面・決め手はこの表で決まる（qa/run.mjs が別に持った表でも確かめる）
  const RULE = {
    "接眼レンズ": { grp: "kakudai", cat: "kumitate", key: "接眼レンズは目を近づけてのぞくレンズです。組み立てるときは、対物レンズより先に取り付けます。" },
    "対物レンズ": { grp: "kakudai", cat: "kumitate", key: "対物レンズはプレパラートに近いほうのレンズで、レボルバーを回して倍率を変えます。高倍率のものほど長くなっています。" },
    "反射鏡": { grp: "akarusa", cat: "akaru", key: "反射鏡は光を取り入れて、視野全体が同じように明るく見えるようにする部品です。" },
    "しぼり": { grp: "akarusa", cat: "akaru", key: "しぼりは光の量を調節し、観察したものが最もはっきり見えるようにする部品です。" },
    "調節ねじ": { grp: "pinto", cat: "awaseru", key: "調節ねじは、プレパラートと対物レンズの間を変えてピントを合わせる部品です。遠ざけながら合わせます。" },
  };

  // part:ri:begin（shared-workflows の template/parts/data/ri.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  // part:ri:end
  // part:shuffle:begin（shared-workflows の template/parts/data/shuffle.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  // part:shuffle:end
  // part:pickN:begin（shared-workflows の template/parts/data/pickN.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }
  // part:pickN:end
  const MEDIA = ["理科室で", "理科の授業で", "観察ノートで", "家で", "テスト勉強で"];
  // 問いの前につく言い方（どれでも答えは同じ）
  const PRE = ["顕微鏡で観察した。", "理科の授業で。", "プリントの問題。", "使い方の説明。", "観察ノートより。"];

  // どれかを当てる問題。ans：答え、sit：言い方。選び肢は、ほかの4つから（やさしいは2つ、ふつう・むずかしいは3つ）
  function which(ans, sit) {
    const near = CLASSES.filter((c) => c !== ans);
    return (R, lv) => {
      const si = ri(R, 0, sit.length - 1), mi = ri(R, 0, MEDIA.length - 1);
      const n = lv === 0 ? 2 : 3, ds = pickN(R, near, n);
      const q = sit[si] + "　どの部品？";
      return { type: "act", media: MEDIA[mi], q, opts: shuffle(R, [ans, ...ds]), ans, rev: false, v: `${si}:${mi}` };
    };
  }
  // 1つの種類を作る。grp・cat・key は答えの決まり RULE から。clue は手がかりの文（PRE と組む）
  function K(id, lv, ans, name, src, look, why, clue) {
    const r = RULE[ans];
    return { id, lv, grp: r.grp, cat: r.cat, ans, name, src, look, key: r.key, why, make: which(ans, clue.flatMap((c) => PRE.map((p) => p + c))) };
  }

  const KINDS = [
    // ---- やさしい ----
    K("se_nozoku", 0, "接眼レンズ", "目でのぞくレンズ", ["onojo", "kgh"], "目を近づける所です。",
      "観察するときは接眼レンズをのぞきながら、明るさやピントを合わせます（大野城市の学習・香川県のプリント）。",
      ["観察するとき、目を近づけてのぞくレンズ。", "目を近づけて見るレンズ。香川県のプリントでは10倍のもの1つだけを使う。"]),
    K("ta_revolver", 0, "対物レンズ", "レボルバーで変える", ["onojo", "kgh"], "回して倍率を変える所に注目。",
      "レボルバーを回すと、対物レンズの倍率を変えられます（大野城市の学習）。香川県のプリントでは4倍・10倍・40倍の3つです。",
      ["レボルバーを回すと、倍率のちがうものに変えられるレンズ。"]),
    K("h_mura", 0, "反射鏡", "明るさのむらを直す", ["kgh"], "光を取り入れる部品です。",
      "明るさが不均一なときは、反射鏡を動かして、視野全体が同じように明るく見えるようにします（香川県のプリント）。",
      ["視野の明るさがむらになったとき、動かして全体を同じ明るさにする部品。"]),
    K("sh_kukkiri", 0, "しぼり", "くっきり見えるように回す", ["kgh"], "ピントを合わせたあとの仕上げです。",
      "ピントを合わせたあと、しぼりを回して、観察したものが最もはっきり見えるように調節します（香川県のプリント）。",
      ["ピントを合わせたあと、回して、観察したものが最もはっきり見えるようにする部品。"]),
    K("n_chikazuke", 0, "調節ねじ", "横から見て近づける", ["kgh", "onojo"], "真横から見ながら回します。",
      "真横から見ながら調節ねじを回し、プレパラートと対物レンズをできるだけ近づけます（香川県のプリント・大野城市の学習）。",
      ["真横から見ながら回して、プレパラートとレンズをできるだけ近づける部品。"]),
    // ---- ふつう ----
    K("se_saki", 1, "接眼レンズ", "先に取り付ける", ["kng", "kgh2", "onojo"], "取り付ける順番に注目。",
      "鏡筒内から対物レンズにホコリやゴミが入るのを防ぐため、接眼レンズを先に取り付けます（神奈川県の教材・香川県のプリント）。",
      ["顕微鏡を組み立てるとき、もう一方のレンズより先に取り付けるレンズ。"]),
    K("ta_nagai", 1, "対物レンズ", "高倍率ほど長い", ["kng", "kgh"], "筒の長さと倍率の関係です。",
      "対物レンズは高倍率ほど長く、接眼レンズは高倍率ほど短くなっています（神奈川県の教材）。",
      ["筒が長いものほど倍率が高いレンズ。", "観察を始めるとき、いちばん低倍率のものにしておくレンズ。"]),
    K("h_heimen", 1, "反射鏡", "ふつうは平面鏡", ["kgh2"], "鏡の面を選びます。",
      "かなり暗いときや高倍率で観察するときを除いて、反射鏡は平面鏡を使います（香川県の発展プリント）。",
      ["かなり暗いときや高倍率のときを除いて、平面鏡の面を使う部品。"]),
    K("sh_ana", 1, "しぼり", "穴を最大にしておく", ["kgh2", "onojo"], "穴の大きさを変える部品です。",
      "明るさを合わせるときは、しぼりの穴を最大にします（香川県の発展プリント）。しぼりは光の量を調節します（大野城市の学習）。",
      ["最も明るくするために、穴を最大にしておく部品。"]),
    K("n_toozake", 1, "調節ねじ", "のぞきながら遠ざける", ["kgh", "yoko"], "近づけたときと逆向きに回します。",
      "接眼レンズをのぞきながら、調節ねじを近づけたときと逆向きにゆっくり回し、プレパラートと対物レンズを遠ざけながらピントを合わせます（香川県のプリント・横浜市の課題）。",
      ["のぞきながら、近づけたときと逆向きにゆっくり回して、ピントを合わせる部品。"]),
    // ---- むずかしい ----
    K("se_mijikai", 2, "接眼レンズ", "高倍率ほど短い", ["kng"], "もう一方のレンズとは長さの関係が逆です。",
      "接眼レンズは高倍率ほど短く、対物レンズは高倍率ほど長くなっています（神奈川県の教材）。",
      ["倍率が高いものほど、筒が短くなっているレンズ。"]),
    K("ta_jitsuzo", 2, "対物レンズ", "鏡筒の中に実像をつくる", ["kgh2"], "像ができる順番に注目。",
      "対物レンズにより鏡筒内に拡大された実像ができ、その実像を接眼レンズで虚像としてさらに拡大して見ています（香川県の発展プリント）。",
      ["鏡筒の中に、拡大された実像をつくるレンズ。"]),
    K("h_led", 2, "反射鏡", "LEDライトに変わった", ["yoko"], "光を取り入れる部品です。",
      "顕微鏡によっては、下についている反射鏡がLEDライトに変わっています（横浜市の課題）。",
      ["新しい顕微鏡では、下についているこの部品がLEDライトに変わっていることがある。"]),
    K("sh_koubai", 2, "しぼり", "高倍率のあとに調節", ["yoko", "onojo"], "倍率を上げると暗くなります。",
      "高倍率にすると暗くなるので、レボルバーを回したあと、しぼりを調節して見やすい明るさにします（横浜市の課題・大野城市の学習）。",
      ["レボルバーを回して高倍率にしたあと、見やすい明るさにするために調節する部品。"]),
    K("n_kizu", 2, "調節ねじ", "近づけながら合わせない", ["kgh"], "レンズを傷つけないための順番です。",
      "レンズを近づけながらピントを合わせると、プレパラートに当たってレンズをよごしたり傷つけたりすることがあります（香川県のプリント）。",
      ["レンズがプレパラートに当たらないように、遠ざける向きに回しながらピントを合わせる部品。"]),
  ];
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);

  // part:seedOf:begin（shared-workflows の template/parts/data/seedOf.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  // part:seedOf:end
  // part:rng:begin（shared-workflows の template/parts/data/rng.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // part:rng:end

  // 1問を作る。tag は「種類|種」（例 "se_nozoku|2026-11-18:d0"）。同じ tag ならいつも同じ問題
  function make(tag) {
    const [kind] = String(tag).split("|"), k = Object.prototype.hasOwnProperty.call(BY, kind) ? BY[kind] : null; // 継承した constructor などは知らない種類として扱う（CodeRabbit kenbikyo-buhin#1）
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)), k.lv);
    return { tag, kind, lv: k.lv, name: k.name, look: k.look, key: k.key, why: k.why, grp: k.grp, cat: k.cat, src: k.src.map((s) => SRC[s]), ...p };
  }
  const keyOf = (P) => `${P.kind}:${P.q}:${P.opts.slice().sort().join("/")}`;

  // 今日の5問（やさしい2・ふつう2・むずかしい1）。種類は重ねない
  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  // 上級の3問（むずかしいだけ・今日の5問のむずかしいとは別の種類）
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  const KNB = { KINDS, BY, GROUPS, CATS, RULE, LV, SRC, CLASSES, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = KNB; else root.KNB = KNB;
})(typeof self !== "undefined" ? self : this);
