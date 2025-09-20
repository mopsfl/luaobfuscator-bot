export default (date: string) => {
    const [d, m, y] = date.split(".").map(n => parseInt(n, 10));
    return new Date(y, m - 1, d);
};