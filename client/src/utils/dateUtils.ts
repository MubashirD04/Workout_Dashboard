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

export const getCurrentDate = () => new Date().toISOString().split('T')[0];

export const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};
