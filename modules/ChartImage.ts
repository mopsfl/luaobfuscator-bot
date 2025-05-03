import ChartJSImage from "chart.js-image"

export default {
    GetLocalizedDateStrings(length: number = 7, includeYear: boolean = false): Array<string> {
        const dateStrings = [];
        const today = new Date();
        for (let i = 0; i < length; i++) {
            const currentDate = new Date(today);
            currentDate.setDate(currentDate.getDate() - i);
            let localizedDateString = currentDate.toLocaleDateString("en", { month: "2-digit", day: "numeric", year: includeYear ? "numeric" : undefined });
            localizedDateString = localizedDateString.replace(/\.$/, '');
            dateStrings.push(localizedDateString);
        }
        return dateStrings.reverse();
    },

    Create(data: ChartOptions): ChartJSImage {
        const chart = new ChartJSImage().chart(data).width("400").height("200")

        return chart
    }
}

export interface ChartOptions {
    type: string,
    data: {
        labels: Array<String>,
        datasets: Array<ChartDataset>
    },
    options?: Object
}

export interface ChartDataset {
    label: string,
    data: Array<number | string>,
    fill?: boolean,
    backgroundColor?: string,
}