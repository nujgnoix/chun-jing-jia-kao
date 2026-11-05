import { reactive, watch } from 'vue'

const KEY = 'jiaxiao_v1'
const saved = JSON.parse(localStorage.getItem(KEY) || '{}')

// wrong / fav 存题目 id；fs 为字体大小（默认 18px，可在 14~30 之间调节）
// subject：当前科目（1=科目一 / 4=科目四）；lastView：上次所在页面，重开直接回到该页
// studyIdx：按「模式-科目」记住看到第几题（如 { 'sequence-1': 9 } 表示科目一顺序练习看到第 10 题）
// exam：模拟考试断点续考（关掉 APP 再回来恢复同一套题/已选/翻到的题/剩余时间）；交卷后清空
export const store = reactive({
  wrong: saved.wrong || {},
  fav: saved.fav || {},
  fs: saved.fs || 18,
  subject: saved.subject || 1,
  lastView: saved.lastView || { view: 'home', mode: 'sequence' },
  studyIdx: saved.studyIdx || {},
  exam: saved.exam || null
})

// 字号调节：限制在 14~30px，避免叠加系统/老人模式放大导致布局错乱
export function adjustFont(delta){
  const v = Math.min(30, Math.max(14, (store.fs || 18) + delta))
  store.fs = v
  return v
}

// 记住某模式+科目下看到第几题
export function setProgress(mode, subject, idx){
  store.studyIdx[mode + '-' + subject] = idx
}
export function getProgress(mode, subject){
  const v = store.studyIdx[mode + '-' + subject]
  return typeof v === 'number' ? v : 0
}

watch(
  () => JSON.stringify({
    wrong: store.wrong, fav: store.fav, fs: store.fs,
    subject: store.subject, lastView: store.lastView, studyIdx: store.studyIdx,
    exam: store.exam
  }),
  () => {
    localStorage.setItem(KEY, JSON.stringify({
      wrong: store.wrong, fav: store.fav, fs: store.fs,
      subject: store.subject, lastView: store.lastView, studyIdx: store.studyIdx,
      exam: store.exam
    }))
  }
)
