import sys
import re

file_path = 'C:/Users/jyoth/Desktop/ruban_final1.1/backend/user/views.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Try regex replacement to skip whitespace issues
pattern = re.compile(
    r'(\s*# Create MotorDetails record\s+)'
    r'motor_serializer = MotorDetailsSerializer\(data=motor_data\)\s+'
    r'if motor_serializer\.is_valid\(\):\s+'
    r'motor_serializer\.save\(\)\s+'
    r'print\(f"✅ Motor details saved for complaint: \{complaint\.complaint_no\}"\)\s+'
    r'else:\s+'
    r'print\(f"⚠️ Motor details validation failed: \{motor_serializer\.errors\}"\)'
)

replacement = r'\1# motor_serializer = MotorDetailsSerializer(data=motor_data)\n\1# if motor_serializer.is_valid():\n\1#     motor_serializer.save()\n\1    print(f"✅ Motor data processed in views for complaint: {complaint.complaint_no}")\n\1# else:\n\1#     print(f"⚠️ Motor details validation failed: {motor_serializer.errors}")'

if pattern.search(content):
    new_content = pattern.sub(replacement, content)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Patch applied successfully via regex!")
else:
    print("Regex pattern did not match.")
