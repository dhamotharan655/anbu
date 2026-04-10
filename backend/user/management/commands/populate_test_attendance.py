"""
Management command to delete existing attendance and add test duplicate data
for three staff members to test the payroll system.
"""
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from user.models import Staff, StaffAttendance


class Command(BaseCommand):
    help = 'Delete existing attendance and add test duplicate data for three staff'

    def handle(self, *args, **options):
        self.stdout.write('=' * 60)
        self.stdout.write('STAFF ATTENDANCE TEST DATA GENERATOR')
        self.stdout.write('=' * 60)
        
        # Step 1: Get existing staff
        staff_list = list(Staff.objects.all())
        
        if not staff_list:
            self.stdout.write(self.style.ERROR('No staff members found! Please create staff first.'))
            return
        
        # Take first 3 staff members
        selected_staff = staff_list[:3]
        self.stdout.write(f'\nFound {len(staff_list)} staff members. Using first 3:')
        for i, staff in enumerate(selected_staff, 1):
            self.stdout.write(f'  {i}. {staff.name} (ID: {staff.id})')
        
        # Step 2: Delete existing attendance
        deleted_count = StaffAttendance.objects.delete()
        self.stdout.write(f'\n[OK] Deleted {deleted_count} existing attendance records')
        
        # Step 3: Generate test data for a month (30 days)
        # Creating duplicate pattern for each staff member
        
        # Pattern for Staff 1: Mix of Present, Absent, Leave
        staff1_pattern = [
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Absent', 'absent', 'full_day', 0),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'leave', 'full_day', 1),  # Leave
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Absent', 'absent', 'full_day', 0),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Absent', 'absent', 'full_day', 0),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'leave', 'full_day', 1),  # Leave
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Absent', 'absent', 'full_day', 0),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'leave', 'full_day', 1),  # Leave
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Absent', 'absent', 'full_day', 0),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
        ]
        
        # Pattern for Staff 2: More absences and half days
        staff2_pattern = [
            ('Present', 'present', 'full_day', 1),
            ('Absent', 'absent', 'full_day', 0),
            ('Present', 'present', 'half_day', 0.5),  # Half day
            ('Absent', 'absent', 'full_day', 0),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Absent', 'absent', 'full_day', 0),
            ('Present', 'present', 'half_day', 0.5),  # Half day
            ('Absent', 'absent', 'full_day', 0),
            ('Absent', 'absent', 'full_day', 0),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Absent', 'absent', 'full_day', 0),
            ('Present', 'present', 'half_day', 0.5),  # Half day
            ('Absent', 'absent', 'full_day', 0),
            ('Present', 'present', 'full_day', 1),
            ('Absent', 'absent', 'full_day', 0),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Absent', 'absent', 'full_day', 0),
            ('Present', 'present', 'half_day', 0.5),  # Half day
            ('Absent', 'absent', 'full_day', 0),
            ('Present', 'present', 'full_day', 1),
            ('Absent', 'absent', 'full_day', 0),
            ('Absent', 'absent', 'full_day', 0),
            ('Present', 'present', 'full_day', 1),
            ('Absent', 'absent', 'full_day', 0),
            ('Present', 'present', 'half_day', 0.5),  # Half day
            ('Absent', 'absent', 'full_day', 0),
            ('Present', 'present', 'full_day', 1),
        ]
        
        # Pattern for Staff 3: More leaves
        staff3_pattern = [
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'leave', 'full_day', 1),  # Leave
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'leave', 'full_day', 1),  # Leave
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'leave', 'full_day', 1),  # Leave
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'leave', 'full_day', 1),  # Leave
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'leave', 'full_day', 1),  # Leave
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'leave', 'full_day', 1),  # Leave
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'leave', 'full_day', 1),  # Leave
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'present', 'full_day', 1),
            ('Present', 'leave', 'full_day', 1),  # Leave
            ('Present', 'present', 'full_day', 1),
        ]
        
        patterns = [staff1_pattern, staff2_pattern, staff3_pattern]
        
        # Start date for attendance - March 2026 (configurable)
        # You can change month and year here
        target_month = 3  # Change this to test different months
        target_year = 2026
        start_date = datetime(target_year, target_month, 1)
        
        # Calculate days in the month
        if target_month == 12:
            days_in_month = (datetime(target_year + 1, 1, 1) - datetime(target_year, target_month, 1)).days
        else:
            days_in_month = (datetime(target_year, target_month + 1, 1) - datetime(target_year, target_month, 1)).days
        
        created_records = []
        
        for staff_idx, staff in enumerate(selected_staff):
            pattern = patterns[staff_idx]
            staff_created = 0
            
            for day_idx, (status, attendance_type, work_type, salary_multiplier) in enumerate(pattern):
                attendance_date = start_date + timedelta(days=day_idx)
                
                # Create attendance record
                attendance = StaffAttendance(
                    staff_id=str(staff.id),
                    staff_name=staff.name,
                    date=attendance_date,
                    status=status,  # 'Present' or 'Absent'
                    attendance_type=attendance_type,  # 'present', 'absent', or 'leave'
                    work_type=work_type,  # 'full_day' or 'half_day'
                    salary_multiplier=salary_multiplier,
                    marked_by='admin'
                )
                attendance.save()
                staff_created += 1
            
            created_records.append({
                'staff': staff,
                'count': staff_created
            })
            self.stdout.write(f'\n[OK] Created {staff_created} attendance records for {staff.name}')
        
        # Step 4: Generate summary
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write('ATTENDANCE DATA SUMMARY')
        self.stdout.write('=' * 60)
        
        total_present = 0
        total_absent = 0
        total_leave = 0
        total_half_day = 0
        
        summary_data = []
        
        for staff in selected_staff:
            attendances = StaffAttendance.objects(staff_id=str(staff.id))
            
            # Count by attendance_type and work_type
            full_day_present = attendances(attendance_type='present', work_type='full_day').count()
            half_day_present = attendances(attendance_type='present', work_type='half_day').count()
            absent_count = attendances(attendance_type='absent').count()
            leave_count = attendances(attendance_type='leave').count()
            
            # Calculate multiplier total
            multiplier_total = sum(a.salary_multiplier for a in attendances)
            
            total_present += full_day_present
            total_absent += absent_count
            total_leave += leave_count
            total_half_day += half_day_present
            
            summary_data.append({
                'name': staff.name,
                'present': full_day_present,
                'half_day': half_day_present,
                'absent': absent_count,
                'leave': leave_count,
                'multiplier': multiplier_total
            })
            
            self.stdout.write(f'\n--- {staff.name} ---')
            self.stdout.write(f'   Present (Full Day): {full_day_present}')
            self.stdout.write(f'   Present (Half Day): {half_day_present}')
            self.stdout.write(f'   Absent: {absent_count}')
            self.stdout.write(f'   Leave: {leave_count}')
            self.stdout.write(f'   Salary Multiplier Total: {multiplier_total}')
        
        self.stdout.write('\n' + '-' * 60)
        self.stdout.write('OVERALL TOTALS:')
        self.stdout.write(f'   Total Present (Full Day): {total_present}')
        self.stdout.write(f'   Total Half Day: {total_half_day}')
        self.stdout.write(f'   Total Absent: {total_absent}')
        self.stdout.write(f'   Total Leave: {total_leave}')
        self.stdout.write('=' * 60)
        
        self.stdout.write('\n[SUCCESS] Test attendance data created successfully!')
        self.stdout.write('You can now test the payroll system with this data.')
