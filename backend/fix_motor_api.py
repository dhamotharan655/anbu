#!/usr/bin/env python3
"""
Script to update motor_details_list in views.py to add auto-complaint creation
"""

import re

# Read the file
with open('user/views.py', 'r', encoding='utf-8') as f:
    content = f.read()

# The new POST handler code
new_post_handler = '''    elif request.method == 'POST':
        try:
            # Extract customer and job info from request data
            customer_name = request.data.get('customer_name', '')
            customer_phone = request.data.get('customer_phone', '')
            customer_address = request.data.get('customer_address', '')
            job_category = request.data.get('job_category', 'normal_service')
            
            # Prepare motor data (exclude customer fields)
            motor_data = {k: v for k, v in request.data.items() 
                         if k not in ['customer_name', 'customer_phone', 'customer_address', 'job_category']}
            
            # Create complaint first if customer info is provided
            complaint_id = None
            if customer_name and customer_phone:
                try:
                    # Generate complaint ID
                    from datetime import datetime
                    prefix = 'COM'
                    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
                    complaint_id = f"{prefix}-{timestamp}"
                    
                    # Determine job type based on job_category
                    job_type = 'motor_service' if job_category in ['motor_service', 'motor_sale'] else 'service'
                    
                    # Create the complaint
                    complaint = Complaint(
                        complaint_id=complaint_id,
                        customer_name=customer_name,
                        customer_phone=customer_phone,
                        customer_address=customer_address,
                        complaint_details=f"Motor {job_category.replace('_', ' ').title()} - Serial No: {motor_data.get('serial_no', 'N/A')}",
                        job_type=job_type,
                        status='pending',
                        created_by=motor_data.get('created_by', 'System')
                    )
                    complaint.save()
                    print(f"Auto-created complaint: {complaint_id} for motor service")
                except Exception as e:
                    print(f"Error creating complaint: {str(e)}")
                    # Continue even if complaint creation fails
            
            # Add complaint_id to motor data
            if complaint_id:
                motor_data['complaint_id'] = complaint_id
            
            serializer = MotorDetailsSerializer(data=motor_data)
            if serializer.is_valid():
                motor = serializer.save()
                # Add created_by from request if provided
                if motor_data.get('created_by'):
                    motor.created_by = motor_data.get('created_by')
                    motor.save()
                
                response_data = MotorDetailsSerializer(motor).data
                if complaint_id:
                    response_data['complaint_id'] = complaint_id
                
                return Response({
                    "success": True,
                    "message": "Motor details saved successfully",
                    "complaint_id": complaint_id,
                    "data": response_data
                }, status=status.HTTP_201_CREATED)
            return Response({
                "success": False,
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)'''

# The old POST handler code pattern to replace
old_post_handler = '''    elif request.method == 'POST':
        try:
            serializer = MotorDetailsSerializer(data=request.data)
            if serializer.is_valid():
                motor = serializer.save()
                # Add created_by from request if provided
                if request.data.get('created_by'):
                    motor.created_by = request.data.get('created_by')
                    motor.save()
                return Response({
                    "success": True,
                    "message": "Motor details saved successfully",
                    "data": MotorDetailsSerializer(motor).data
                }, status=status.HTTP_201_CREATED)
            return Response({
                "success": False,
                "errors": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)'''

# Replace all occurrences
count = content.count(old_post_handler)
print(f"Found {count} occurrences of old POST handler")

if count > 0:
    new_content = content.replace(old_post_handler, new_post_handler)
    
    # Write back
    with open('user/views.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"Successfully replaced {count} occurrences!")
else:
    print("Could not find the old POST handler pattern")
