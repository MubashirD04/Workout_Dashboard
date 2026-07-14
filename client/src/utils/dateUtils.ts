export const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('T')[0].split('-');
    if (parts.length !== 3) return dateString;

    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // 0-indexed
    const day = parseInt(parts[2]);

    const d = new Date(year, month, day);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

/** Parses a YYYY-MM-DD string into a local Date without the UTC/timezone shift new Date(str) can cause. */
export const parseDateOnly = (dateString: string): Date => {
    const parts = dateString.split('T')[0].split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    return new Date(year, month, day);
};

/** Returns the Monday of the week containing the given date. */
export const startOfWeek = (d: Date): Date => {
    const date = new Date(d);
    const day = date.getDay(); // 0 = Sun ... 6 = Sat
    const diff = (day === 0 ? -6 : 1) - day; // shift back to Monday
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
};

export const getCurrentDate = () => new Date().toISOString().split('T')[0];

export const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};