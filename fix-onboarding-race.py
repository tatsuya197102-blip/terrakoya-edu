#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
オンボーディング画面の race condition 修正

問題:
  setSelfSelectedRole → router.replace('/dashboard') の順だと、
  onSnapshot の role 反映が間に合わず、AuthGate が /onboarding に戻してしまう。

修正:
  手動 router.replace を削除し、AuthContext の onSnapshot で role が更新された後、
  useEffect (role を監視) が自動で正しいホームへ遷移するようにする。

実行:
  cd C:\\Users\\User\\Desktop\\terrakoya-edu
  python fix-onboarding-race.py
"""
import io
import os
import sys
import shutil
from datetime import datetime

PATH = 'src/app/onboarding/page.tsx'

if not os.path.exists(PATH):
    print(f'ERROR: {PATH} が見つかりません')
    sys.exit(1)

with io.open(PATH, 'r', encoding='utf-8') as f:
    src = f.read()

# バックアップ
ts = datetime.now().strftime('%Y%m%d-%H%M%S')
shutil.copy2(PATH, f'{PATH}.bak-{ts}')

# 修正 1: setSelfSelectedRole 成功後の router.replace を削除
old1 = '''      await setSelfSelectedRole(user!.uid, r);
      router.replace(ROLE_HOME_PATH[r]);'''
new1 = '''      await setSelfSelectedRole(user!.uid, r);
      // router.replace は useEffect (role 監視) に任せる - onSnapshot 反映を待つため'''

if old1 not in src:
    print('WARN: setSelfSelectedRole 後の router.replace パターンが見つかりません')
else:
    src = src.replace(old1, new1)
    print('OK: handlePickRole の race condition 修正')

# 修正 2: claimInviteCode 成功後の router.replace も同様に削除
old2 = '''      router.replace(ROLE_HOME_PATH[result.role]);
    } else {'''
new2 = '''      // router.replace は useEffect (role 監視) に任せる
    } else {'''

if old2 not in src:
    print('WARN: claimInviteCode 後の router.replace パターンが見つかりません')
else:
    src = src.replace(old2, new2)
    print('OK: handleSubmitCode の race condition 修正')

with io.open(PATH, 'w', encoding='utf-8') as f:
    f.write(src)

print()
print('完了。次のステップ:')
print('  npm run build && npm run dev')
print('  → 再度「生徒」を選択して /dashboard に遷移できるか確認')
