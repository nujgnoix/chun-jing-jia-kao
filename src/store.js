import { reactive, watch } from 'vue'

const KEY = 'jiaxiao_v1'
const saved = JSON.parse(localStorage.getItem(KEY) || '{}')

// wrong / fav 存题目 id；fs 为字体大小（默认 18px，可在 14~30 之间调节）
export const store = reactive({
  wrong: saved.wrong || {},
  fav: saved.fav || {},
  fs: saved.fs || 18
})

// 字号调节：限制在 14~30px，避免叠加系统/老人模式放大导致布局错乱
export function adjustFont(delta){
  const v = Math.min(30, Math.max(14, (store.fs || 18) + delta))
  store.fs = v
  return v
}

watch(
  () => JSON.stringify({ wrong: store.wrong, fav: store.fav, fs: store.fs }),
  () => {
    localStorage.setItem(KEY, JSON.stringify({ wrong: store.wrong, fav: store.fav, fs: store.fs }))
  }
)
