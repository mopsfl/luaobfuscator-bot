export default function (date: string) {
    let date_arr: Array<string>
    date_arr = date.split(".");
    //@ts-ignore
    return new Date(date_arr[2], date_arr[1] - 1, date[0]);
}