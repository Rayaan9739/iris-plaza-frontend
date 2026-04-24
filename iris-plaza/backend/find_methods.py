import re

with open(r'd:\manipal\backend\src\modules\rooms\rooms.service.ts', 'r', encoding='utf-8') as f:
    text = f.read()

for i, line in enumerate(text.splitlines()):
    if 'findAll' in line or 'getAvailable' in line or 'findOccupied' in line:
        print(f'{i+1}: {line.strip()}')
