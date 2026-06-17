import sys

def delete_lines(file_path, ranges):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Sort ranges in reverse order to keep indices valid during deletion
    sorted_ranges = sorted(ranges, key=lambda x: x[0], reverse=True)
    
    for start, end in sorted_ranges:
        print(f"Deleting lines {start} to {end}")
        # Ranges are 1-indexed, inclusive
        del lines[start-1:end]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)

if __name__ == "__main__":
    path = r"i:\Client\Anbu\anbu_2\ruban_final3\ruban_final1.1\backend\user\views.py"
    # Note: These line numbers must be from the CURRENT state of the file.
    # Since I just removed update_motor_brand (approx 86 lines), line numbers shifted.
    # It's better to use markers or re-verify.
    pass
