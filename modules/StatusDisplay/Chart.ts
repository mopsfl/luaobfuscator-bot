import ChartJSImage from "chart.js-image"

export default {
    Create(data: number[]) {
        return new ChartJSImage().chart(<ChartOptions>{
            type: "bar",
            data: {
                labels: this.GetLocalizedDateStrings(),
                datasets: [
                    {
                        label: "Daily Obfuscated Files",
                        data: data,
                        fill: false,
                        backgroundColor: "#36a2eb"
                    }
                ]
            },
            options: {
                legend: { labels: { fontColor: 'white' } },
                scales: {
                    xAxes: [{ barPercentage: 0.5, ticks: { fontColor: "white" } }],
                    yAxes: [{ ticks: { beginAtZero: true, fontColor: "white" } }]
                }
            }
        }).toURL()
    },

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