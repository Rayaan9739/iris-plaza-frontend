import sys

file_path = r'd:\manipal\frontend\src\pages\admin\AdminRoomManagement.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if '  newRent: number;' in line:
        continue
    if '    newRent: 0,' in line:
        continue
    if '      newRent: tenant.room?.rent || 0,' in line:
        continue
    if 'updateTenantForm.newRent && updateTenantForm.newRent !== updateTenantModal.tenant.room?.rent' in line:
        continue
    if '        newRent: updateTenantForm.newRent || undefined,' in line:
        continue
        
    if '<Field icon={Home} label="Room Rent (\u20b9)">' in line or '<Field icon={Home} label="Room Rent' in line:
        skip = True
        continue
        
    if skip and '</Field>' in line:
        skip = False
        continue
        
    if not skip:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8', newline='') as f:
    f.writelines(new_lines)
print('Done frontend edits')
