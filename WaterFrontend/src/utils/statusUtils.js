export const getDisplayStatus = (complaint) => {
  const jobStatus = complaint?.status?.toLowerCase();
  
  if (jobStatus === "pending") {
    if (complaint?.assigned === true || complaint?.assigned_staff || complaint?.staff_name) {
      return "Assigned";
    }
    return "Pending";
  }
  
  if (jobStatus === "assigned") {
    return "Assigned";
  }
  
  if (jobStatus === "completed") {
    const isPaid = complaint.payment_status?.toLowerCase() === "paid" || 
                   complaint.payment_indicator?.toLowerCase() === "paid" || 
                   (complaint.due_amount !== undefined && complaint.due_amount <= 0 && complaint.grand_total > 0);
                   
    if (isPaid) return "Completed";
    
    const dueDateStr = complaint.payment_due_date || complaint.due_date;
    if (!dueDateStr) return "Due"; // Fallback: if due_date is missing and not paid -> 'Due'
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // ignore time in exact comparison
    
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today) {
      return "Overdue";
    } else {
      return "Due";
    }
  }
  
  return jobStatus ? (jobStatus.charAt(0).toUpperCase() + jobStatus.slice(1)) : "Unknown";
};
