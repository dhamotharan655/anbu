import os

file_path = '../WaterFrontend/src/pages/Payroll.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    # 1. Update netSalary calculation in Excel export
    (
        '''const netSalary = totalSalary + bonus - deduction;''',
        '''const netSalary = totalSalary + bonus - deduction + (staff.total_incentives || 0);'''
    ),
    # 2. Add Incentives to Excel export
    (
        '''          'Deduction (₹)': deduction,
          'Net Salary (₹)': Math.round(netSalary * 100) / 100''',
        '''          'Deduction (₹)': deduction,
          'Incentives (₹)': staff.total_incentives || 0,
          'Net Salary (₹)': Math.round(netSalary * 100) / 100'''
    ),
    # 3. Add Incentives to HTML payslip
    (
        '''          <tr>
            <td class="deduction">- Deduction</td>
            <td class="amount deduction">₹${parseFloat(data.deduction || 0).toFixed(2)}</td>
          </tr>''',
        '''          <tr>
            <td class="deduction">- Deduction</td>
            <td class="amount deduction">₹${parseFloat(data.deduction || 0).toFixed(2)}</td>
          </tr>
          <tr>
            <td class="bonus">+ Incentives/Commission</td>
            <td class="amount bonus">₹${parseFloat(data.total_incentives || 0).toFixed(2)}</td>
          </tr>'''
    ),
    # 4. Add Incentives to PDF payslip
    (
        '''      // Deduction
      doc.setTextColor(220, 38, 38);
      doc.text('Deduction', margin + 3, rowY + 4);
      doc.text('- Rs. ' + formatCurrency(payslipData.deduction), margin + contentWidth - 3, rowY + 4, { align: 'right' });
      doc.line(margin, rowY + dataRowHeight, margin + tableWidth, rowY + dataRowHeight);
      rowY += dataRowHeight;''',
        '''      // Deduction
      doc.setTextColor(220, 38, 38);
      doc.text('Deduction', margin + 3, rowY + 4);
      doc.text('- Rs. ' + formatCurrency(payslipData.deduction), margin + contentWidth - 3, rowY + 4, { align: 'right' });
      doc.line(margin, rowY + dataRowHeight, margin + tableWidth, rowY + dataRowHeight);
      rowY += dataRowHeight;
      
      // Incentives
      doc.setTextColor(22, 163, 74);
      doc.text('Incentives/Commission', margin + 3, rowY + 4);
      doc.text('+ Rs. ' + formatCurrency(payslipData.total_incentives), margin + contentWidth - 3, rowY + 4, { align: 'right' });
      doc.line(margin, rowY + dataRowHeight, margin + tableWidth, rowY + dataRowHeight);
      rowY += dataRowHeight;'''
    ),
    # 5. Fix getTotalSalary
    (
        '''return sum + ((staff.total_salary || 0) + currentBonus - currentDeduction);''',
        '''return sum + ((staff.total_salary || 0) + currentBonus - currentDeduction + (staff.total_incentives || 0));'''
    ),
    # 6. Add Incentive header to Calculate Payroll table
    (
        '''                      <th>Deduction</th>
                      <th>Total</th>''',
        '''                      <th>Deduction</th>
                      <th>Incentive</th>
                      <th>Total</th>'''
    ),
    # 7. Add Incentive cell to Calculate Payroll table
    (
        '''                        <td>
                          <input
                            type="number"
                            value={deduction[staff.staff_id] !== undefined ? deduction[staff.staff_id] : staff.deduction}
                            onChange={(e) => handleDeductionChange(staff.staff_id, e.target.value)}
                            className="payroll-input"
                          />
                        </td>
                        <td className="amount">₹{((staff.total_salary || 0) + (bonus[staff.staff_id] !== undefined ? parseFloat(bonus[staff.staff_id]) || 0 : staff.bonus || 0) - (deduction[staff.staff_id] !== undefined ? parseFloat(deduction[staff.staff_id]) || 0 : staff.deduction || 0)).toLocaleString()}</td>''',
        '''                        <td>
                          <input
                            type="number"
                            value={deduction[staff.staff_id] !== undefined ? deduction[staff.staff_id] : staff.deduction}
                            onChange={(e) => handleDeductionChange(staff.staff_id, e.target.value)}
                            className="payroll-input"
                          />
                        </td>
                        <td style={{ color: '#16a34a', fontWeight: '600' }}>₹{staff.total_incentives || 0}</td>
                        <td className="amount">₹{((staff.total_salary || 0) + (bonus[staff.staff_id] !== undefined ? parseFloat(bonus[staff.staff_id]) || 0 : staff.bonus || 0) - (deduction[staff.staff_id] !== undefined ? parseFloat(deduction[staff.staff_id]) || 0 : staff.deduction || 0) + (staff.total_incentives || 0)).toLocaleString()}</td>'''
    ),
    # 8. Add Incentive header to History table
    (
        '''                      <th>Deduction</th>
                      <th>Final Salary</th>''',
        '''                      <th>Deduction</th>
                      <th>Incentive</th>
                      <th>Final Salary</th>'''
    ),
    # 9. Add Incentive cell to History table
    (
        '''                        <td style={{ color: '#dc2626', fontWeight: '600' }}>₹{record.deduction || 0}</td>
                        <td className="amount">₹{((record.total_salary || 0) + (record.bonus || 0) - (record.deduction || 0)).toLocaleString()}</td>''',
        '''                        <td style={{ color: '#dc2626', fontWeight: '600' }}>₹{record.deduction || 0}</td>
                        <td style={{ color: '#16a34a', fontWeight: '600' }}>₹{record.total_incentives || 0}</td>
                        <td className="amount">₹{((record.total_salary || 0) + (record.bonus || 0) - (record.deduction || 0) + (record.total_incentives || 0)).toLocaleString()}</td>'''
    )
]

for src, dst in replacements:
    content = content.replace(src, dst)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Now do views.py
file_path_views = 'user/views.py'
with open(file_path_views, 'r', encoding='utf-8') as f:
    content_views = f.read()

replacements_views = [
    # Update save_payroll (existing)
    (
        '''                existing.deduction = item.get('deduction', 0)
                existing.final_salary = round(existing.total_salary + (existing.bonus or 0) - (existing.deduction or 0), 2)''',
        '''                existing.deduction = item.get('deduction', 0)
                existing.total_incentives = item.get('total_incentives', 0)
                existing.final_salary = round(existing.total_salary + (existing.bonus or 0) - (existing.deduction or 0) + (existing.total_incentives or 0), 2)'''
    ),
    # Update save_payroll (new)
    (
        '''                    deduction=deduction_val,
                    final_salary=round(total_salary_val + bonus_val - deduction_val, 2)''',
        '''                    deduction=deduction_val,
                    total_incentives=item.get('total_incentives', 0),
                    final_salary=round(total_salary_val + bonus_val - deduction_val + item.get('total_incentives', 0), 2)'''
    ),
    # Update get_payroll_history
    (
        '''            calculated_final_salary = round((record.total_salary or 0) + (record.bonus or 0) - (record.deduction or 0), 2)''',
        '''            calculated_final_salary = round((record.total_salary or 0) + (record.bonus or 0) - (record.deduction or 0) + (getattr(record, 'total_incentives', 0) or 0), 2)'''
    ),
    (
        '''                'deduction': record.deduction,
                'final_salary': calculated_final_salary,''',
        '''                'deduction': record.deduction,
                'total_incentives': getattr(record, 'total_incentives', 0) or 0,
                'final_salary': calculated_final_salary,'''
    ),
    # Update get_payroll_by_staff
    (
        '''        calculated_final_salary = round((payroll.total_salary or 0) + (payroll.bonus or 0) - (payroll.deduction or 0), 2)''',
        '''        calculated_final_salary = round((payroll.total_salary or 0) + (payroll.bonus or 0) - (payroll.deduction or 0) + (getattr(payroll, 'total_incentives', 0) or 0), 2)'''
    ),
    (
        '''                'deduction': payroll.deduction,
                'final_salary': calculated_final_salary,''',
        '''                'deduction': payroll.deduction,
                'total_incentives': getattr(payroll, 'total_incentives', 0) or 0,
                'final_salary': calculated_final_salary,'''
    )
]

for src, dst in replacements_views:
    content_views = content_views.replace(src, dst)

with open(file_path_views, 'w', encoding='utf-8') as f:
    f.write(content_views)

print('Updated Payroll.jsx and views.py successfully!')
