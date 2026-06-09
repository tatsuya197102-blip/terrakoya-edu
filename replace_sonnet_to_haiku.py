import os

files = [
    'src/app/api/analyze-artwork/route.ts',
    'src/app/api/chat/route.ts',
    'src/app/api/generate-4manga/route.ts',
    'src/app/api/grade-artwork/route.ts',
]

old_model = 'claude-sonnet-4-20250514'
new_model = 'claude-haiku-4-5-20251001'

for file_path in files:
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if old_model in content:
            new_content = content.replace(old_model, new_model)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"OK: {file_path}")
        else:
            print(f"NOT FOUND: {file_path}")
    else:
        print(f"ERROR: {file_path}")

print("Done!")
