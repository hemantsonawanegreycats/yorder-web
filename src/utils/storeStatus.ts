export interface OpenHour {
  id?: number;
  day: string; // e.g. "monday"
  open: string; // e.g. "10:00"
  close: string; // e.g. "22:00"
  isClosed?: boolean | number | string;
}

export interface StoreStatusInfo {
  isOpen: boolean;
  statusText: string;
  opensAt?: string;
  closesAt?: string;
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function isStoreOpen(openHours?: OpenHour[] | null): boolean {
  if (!Array.isArray(openHours) || openHours.length === 0) {
    // If no schedule provided, assume open so we don't artificially block stores
    return true;
  }

  try {
    const now = new Date();
    const currentDay = DAYS[now.getDay()];
    const currentTime = now.getHours() + now.getMinutes() / 60;

    const today = openHours.find(
      (item) => item && typeof item.day === 'string' && item.day.toLowerCase() === currentDay
    );

    if (!today) {
      return false;
    }

    const isClosedFlag =
      today.isClosed === true ||
      (today.isClosed as any) === 1 ||
      (today.isClosed as any) === '1' ||
      (today.isClosed as any) === 'true';

    if (isClosedFlag) {
      return false;
    }

    if (!today.open || !today.close || typeof today.open !== 'string' || typeof today.close !== 'string') {
      return false;
    }

    const [openH, openM] = today.open.split(':').map(Number);
    const [closeH, closeM] = today.close.split(':').map(Number);

    if ([openH, openM, closeH, closeM].some((val) => Number.isNaN(val))) {
      return false;
    }

    const openTime = openH + openM / 60;
    const closeTime = closeH + closeM / 60;

    // 24-hour store
    if (openTime === closeTime) {
      return true;
    }

    // Overnight hours (e.g., 22:00 to 02:00)
    if (openTime > closeTime) {
      return currentTime >= openTime || currentTime < closeTime;
    }

    // Standard hours (e.g. 10:00 to 22:00)
    return currentTime >= openTime && currentTime < closeTime;
  } catch {
    return true;
  }
}

export function getStoreStatusDetails(openHours?: OpenHour[] | null): StoreStatusInfo {
  if (!Array.isArray(openHours) || openHours.length === 0) {
    return {
      isOpen: true,
      statusText: 'OPEN TODAY',
    };
  }

  const now = new Date();
  const currentDay = DAYS[now.getDay()];
  const currentTime = now.getHours() + now.getMinutes() / 60;

  const today = openHours.find(
    (item) => item && typeof item.day === 'string' && item.day.toLowerCase() === currentDay
  );

  if (!today) {
    return {
      isOpen: false,
      statusText: 'CLOSED TODAY',
    };
  }

  const isClosedFlag =
    today.isClosed === true ||
    (today.isClosed as any) === 1 ||
    (today.isClosed as any) === '1' ||
    (today.isClosed as any) === 'true';

  if (isClosedFlag) {
    return {
      isOpen: false,
      statusText: 'CLOSED TODAY',
    };
  }

  if (!today.open || !today.close) {
    return {
      isOpen: false,
      statusText: 'CLOSED',
    };
  }

  const [openH, openM] = today.open.split(':').map(Number);
  const [closeH, closeM] = today.close.split(':').map(Number);

  if ([openH, openM, closeH, closeM].some((val) => Number.isNaN(val))) {
    return {
      isOpen: false,
      statusText: 'CLOSED',
    };
  }

  const openTime = openH + openM / 60;
  const closeTime = closeH + closeM / 60;

  if (openTime === closeTime) {
    return {
      isOpen: true,
      statusText: 'OPEN 24 HOURS',
    };
  }

  let isOpen = false;
  if (openTime > closeTime) {
    isOpen = currentTime >= openTime || currentTime < closeTime;
  } else {
    isOpen = currentTime >= openTime && currentTime < closeTime;
  }

  if (isOpen) {
    return {
      isOpen: true,
      statusText: `OPEN TILL ${today.close}`,
      closesAt: today.close,
    };
  }

  if (currentTime < openTime) {
    return {
      isOpen: false,
      statusText: `CLOSED · OPENS AT ${today.open}`,
      opensAt: today.open,
    };
  }

  return {
    isOpen: false,
    statusText: 'CLOSED FOR TODAY',
  };
}
