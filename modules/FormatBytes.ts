export default function (b: number, d: number = 2) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (!+b) return `0 ${sizes[0]}`
    const i = Math.floor(Math.log(b) / Math.log(1024))
    return `${(b / Math.pow(1024, i)).toFixed(d)} ${sizes[i]}`;
}