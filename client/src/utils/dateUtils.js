import { formatDistanceToNow, formatDuration, differenceInSeconds, isPast } from 'date-fns';

export const formatTimeAgo = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatCheckoutDuration = (checkoutTime, returnTime = null) => {
  const start = new Date(checkoutTime);
  const end = returnTime ? new Date(returnTime) : new Date();
  const seconds = differenceInSeconds(end, start);
  
  if (seconds < 60) {
    return '< 1 min';
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
};

export const getCheckoutStatus = (checkoutTime, expectedReturnTime, actualReturnTime) => {
  const now = new Date();
  const expected = new Date(expectedReturnTime);
  
  if (actualReturnTime) {
    const returned = new Date(actualReturnTime);
    return returned > expected ? 'returned_late' : 'returned_on_time';
  }
  
  if (isPast(expected)) {
    return 'overdue';
  }
  
  const timeUntilDue = differenceInSeconds(expected, now);
  if (timeUntilDue <= 3600) {
    return 'due_soon';
  }
  
  return 'on_time';
};

export const formatOverdueTime = (expectedReturnTime) => {
  const now = new Date();
  const expected = new Date(expectedReturnTime);
  
  if (!isPast(expected)) {
    return null;
  }
  
  const overdueSeconds = differenceInSeconds(now, expected);
  const hours = Math.floor(overdueSeconds / 3600);
  const minutes = Math.floor((overdueSeconds % 3600) / 60);
  
  if (hours === 0) {
    return `${minutes}m overdue`;
  } else {
    return `${hours}h ${minutes}m overdue`;
  }
};

export const getStatusColor = (status) => {
  const colors = {
    on_time: 'text-green-600 bg-green-100',
    due_soon: 'text-yellow-600 bg-yellow-100',
    overdue: 'text-red-600 bg-red-100',
    returned_on_time: 'text-blue-600 bg-blue-100',
    returned_late: 'text-red-600 bg-red-100',
  };
  
  return colors[status] || 'text-gray-600 bg-gray-100';
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};