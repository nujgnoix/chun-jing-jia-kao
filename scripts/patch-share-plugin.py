#!/usr/bin/env python3
"""
Patch @capacitor/share 的 SharePlugin.java：让分享目标 App 在独立任务栈打开。

背景：插件默认用 startActivityForResult 启动系统分享面板，目标 App（豆包/千问）
会被压进驾考自己的 task，导致：
  - 从 AI App 要连按两次返回才能回到驾考
  - 最近任务里两者是同一张卡片，点「驾考」却回到栈顶的豆包
另外 startActivityForResult 在用户取消时会 reject("Share canceled")，
旧版前端 catch 后又发起第二次分享，叠出两个面板——这也是「返回两次」的主因。

本脚本改为：
  - 给被分享的 intent 加 FLAG_ACTIVITY_NEW_TASK（目标进独立 task）
  - 用 startActivity 直接拉起 chooser 并立即 resolve，等不到 result 回调也不会卡住 isPresenting
  - 用逐行匹配 + 继承原缩进，避免源码版本/缩进差异导致匹配失败
"""
import sys

TARGET = 'node_modules/@capacitor/share/android/src/main/java/com/capacitorjs/plugins/share/SharePlugin.java'
MARKER = 'intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);'


def main():
    with open(TARGET, encoding='utf-8') as f:
        src = f.read()

    if MARKER in src:
        print('already patched')
        return 0

    lines = src.split('\n')
    out = []
    hit_create = False
    hit_start = False

    for line in lines:
        stripped = line.strip()
        indent = line[:len(line) - len(line.lstrip())]

        if stripped.startswith('Intent chooser = Intent.createChooser('):
            # 关键：加在被包裹的 EXTRA_INTENT 上，chooser 选中的目标才会进独立 task。
            # 不能给 chooser 自己加，否则最近任务会多出一张分享面板卡片。
            # addFlags 在 shareFiles() 的 setFlags(GRANT_READ_URI_PERMISSION) 之后执行，
            # 是追加而非覆盖，图片 URI 读授权会保留。
            out.append(indent + 'intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);')
            out.append(line)
            hit_create = True
        elif stripped == 'startActivityForResult(call, chooser, "activityResult");':
            out.append(indent + 'try {')
            out.append(indent + '    getActivity().startActivity(chooser);')
            out.append(indent + '    JSObject result = new JSObject();')
            out.append(indent + '    result.put("activityType", "");')
            out.append(indent + '    call.resolve(result);')
            out.append(indent + '} catch (Exception ex) {')
            out.append(indent + '    call.reject(ex.getLocalizedMessage());')
            out.append(indent + '}')
            out.append(indent + 'isPresenting = false;')
            hit_start = True
        else:
            out.append(line)

    if not (hit_create and hit_start):
        print('ERROR: SharePlugin anchors not found '
              f'(createChooser={hit_create}, startActivityForResult={hit_start})')
        return 1

    with open(TARGET, 'w', encoding='utf-8') as f:
        f.write('\n'.join(out))
    print('patched SharePlugin: independent task + immediate resolve')
    return 0


if __name__ == '__main__':
    sys.exit(main())
