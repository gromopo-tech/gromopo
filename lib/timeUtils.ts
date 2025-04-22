export const formatTimeDisplay = (time: string) => {
  if (!time) return '00:00AM';
  
  // First ensure the time string is in valid format (HH:MM)
  const timeParts = time.split(':');
  if (timeParts.length !== 2) return time; // Return original if invalid format
  
  let hours = parseInt(timeParts[0], 10);
  let minutes = parseInt(timeParts[1], 10);
  
  // Validate numbers
  if (isNaN(hours) || isNaN(minutes)) return time;
  
  // Convert to 12-hour format
  const period = hours < 12 ? 'AM' : 'PM';
  hours = hours % 12;
  hours = hours || 12; // Convert 0 to 12
  
  return `${hours}:${minutes.toString().padStart(2, '0')}${period}`.replace(/\s/g, '').replace('M', '');
};

export const parseTimeInput = (time: string) => {
  // Convert from display format (H:MMAM/PM) back to storage format (HH:MM)
  if (!time) return '00:00';
  
  const periodMatch = time.match(/(AM|PM)/i);
  const period = periodMatch ? periodMatch[0].toUpperCase() : '';
  const timeWithoutPeriod = time.replace(/(AM|PM)/i, '').trim();
  
  const [hoursStr, minutesStr] = timeWithoutPeriod.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr || '0', 10);
  
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};