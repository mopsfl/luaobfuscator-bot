import ChartJSImage from "chart.js-image"

export default class ChartImage {
    constructor() { }

    GetLocalizedDateStrings(length: number = 7) {
        const dateStrings = [];
        const today = new Date();
        for (let i = 0; i < length; i++) {
            const currentDate = new Date(today);
            currentDate.setDate(currentDate.getDate() - i);
            let localizedDateString = currentDate.toLocaleDateString(undefined, { month: "2-digit", day: "numeric" });
            localizedDateString = localizedDateString.replace(/\.$/, '');
            dateStrings.push(localizedDateString);
        }
        return dateStrings.reverse();
    }

    Create(data: ChartOptions): ChartJSImage {
        //@ts-ignore
        const chart = new ChartJSImage().chart(data)
        return chart
    }
}

export interface ChartOptions {
    type: string,
    data: {
        labels: Array<String>,
        datasets: Array<ChartDataset>
    },
    options?: {
        title: {
            display: boolean,
            text: string
        },
    }
}

export interface ChartDataset {
    label: string,
    data: Array<number | string>,
    fill?: boolean,
    backgroundColor?: string,
}