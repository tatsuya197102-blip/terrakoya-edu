import re

file_path = 'src/app/api/grade-artwork/route.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 120行目の system: '...' を配列形式に変換
old_pattern = r"system: '([^']+)',"
new_pattern = r"""system: [
          {
            type: 'text',
            text: '\1',
            cache_control: { type: 'ephemeral' }
          }
        ],"""

new_content = re.sub(old_pattern, new_pattern, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("OK: grade-artwork fixed")
