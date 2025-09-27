import ChartJSImage from "chart.js-image"
import Utils from "../Utils"

export default {
    Create(data: number[]) {
        return new ChartJSImage().chart(<ChartOptions>{
            type: "bar",
            data: {
                labels: Utils.GetLocalizedDateStrings(),
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
                    xAxes: [{ barPercentage: 0.5, ticks: { fontColor: "white" }, gridLines: { color: "rgba(50,50,50)" } }],
                    yAxes: [{ ticks: { beginAtZero: true, fontColor: "white" }, gridLines: { color: "rgba(50,50,50)" } }]
                }
            }
        }).toURL()
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