export function formatTime(timeInSeconds: number) {
    const hours = Math.floor(timeInSeconds / 3600),
        minutes = Math.floor((timeInSeconds % 3600) / 60),
        seconds = Math.floor(timeInSeconds % 60);

    return hours > 0
        ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
